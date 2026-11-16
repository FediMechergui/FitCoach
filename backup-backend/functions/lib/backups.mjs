import { createHash, randomUUID } from 'node:crypto';

export const MAX_CHUNK = 512 * 1024;
export const MAX_CHUNKS = 48;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hash = /^[0-9a-f]{64}$/;
export const sha256 = data => createHash('sha256').update(data).digest('hex');
const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
async function json(request) {
  if (Number(request.headers.get('content-length')) > MAX_CHUNK * 1.5) throw new Error('Request is too large');
  const text = await request.text();
  if (text.length > MAX_CHUNK * 1.5) throw new Error('Request is too large');
  return JSON.parse(text);
}
async function keys(store, prefix) {
  const result = [];
  for await (const page of store.list({ prefix, paginate: true })) result.push(...page.blobs.map(b => b.key));
  return result;
}
async function removeVersion(store, prefix, id) {
  for (const key of await keys(store, `${prefix}chunks/${id}/`)) await store.delete(key);
  await store.delete(`${prefix}manifests/${id}`);
  await store.delete(`${prefix}drafts/${id}`);
}

/** Account identity comes exclusively from a verified auth provider, never a body/path user ID. */
export function createBackupHandler({ store, authenticate, now = Date.now }) {
  return async request => {
    try {
      const user = await authenticate(request);
      if (!user || !uuid.test(user.id)) return response({ error: 'Sign in again to access backups.' }, 401);
      const prefix = `users/${user.id}/`;
      const segments = new URL(request.url).pathname.replace(/^\/api\/backups\/?/, '').split('/').filter(Boolean);
      const [id, part] = segments;
      if (id && !uuid.test(id)) return response({ error: 'Invalid backup ID' }, 400);
      if (!id && request.method === 'GET') {
        const manifests = await Promise.all((await keys(store, `${prefix}manifests/`)).map(key => store.get(key, { type: 'json' })));
        return response(manifests.filter(Boolean).sort((a, b) => b.createdAt - a.createdAt));
      }
      if (!id && request.method === 'POST') {
        const input = await json(request);
        if (!Array.isArray(input.chunks) || input.chunks.length < 1 || input.chunks.length > MAX_CHUNKS
          || !input.chunks.every(c => Number.isInteger(c.size) && c.size > 0 && c.size <= MAX_CHUNK && hash.test(c.sha256))
          || !hash.test(input.sha256) || !Number.isInteger(input.schema) || input.schema < 1
          || typeof input.keyId !== 'string' || !hash.test(input.keyId)) return response({ error: 'Invalid backup manifest' }, 400);
        const drafts = await keys(store, `${prefix}drafts/`);
        for (const key of drafts) {
          const draft = await store.get(key, { type: 'json' });
          if (draft && now() - draft.createdAt > 3600_000) await removeVersion(store, prefix, draft.id);
        }
        if ((await keys(store, `${prefix}drafts/`)).length >= 2) return response({ error: 'Two uploads are already in progress. Retry in an hour.' }, 429);
        const backup = { id: randomUUID(), createdAt: now(), format: 1, schema: input.schema, keyId: input.keyId,
          chunks: input.chunks.map(c => ({ size: c.size, sha256: c.sha256 })), sha256: input.sha256,
          bytes: input.chunks.reduce((n, c) => n + c.size, 0) };
        await store.setJSON(`${prefix}drafts/${backup.id}`, backup);
        return response(backup, 201);
      }
      if (id && part != null && /^\d+$/.test(part)) {
        const index = Number(part);
        if (request.method === 'PUT') {
          const draft = await store.get(`${prefix}drafts/${id}`, { type: 'json' });
          if (!draft || !draft.chunks[index]) return response({ error: 'Upload expired or chunk does not exist' }, 404);
          const input = await json(request);
          if (typeof input.data !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(input.data)) return response({ error: 'Invalid chunk' }, 400);
          const bytes = Buffer.from(input.data, 'base64');
          if (bytes.length !== draft.chunks[index].size || sha256(bytes) !== draft.chunks[index].sha256) return response({ error: 'Chunk integrity check failed' }, 400);
          await store.set(`${prefix}chunks/${id}/${index}`, bytes);
          return response({ uploaded: index });
        }
        if (request.method === 'GET') {
          const manifest = await store.get(`${prefix}manifests/${id}`, { type: 'json' });
          if (!manifest?.chunks[index]) return response({ error: 'Backup not found' }, 404);
          const bytes = await store.get(`${prefix}chunks/${id}/${index}`, { type: 'arrayBuffer' });
          if (!bytes) return response({ error: 'Backup chunk missing' }, 409);
          return response({ data: Buffer.from(bytes).toString('base64') });
        }
      }
      if (id && !part && request.method === 'POST') {
        const draft = await store.get(`${prefix}drafts/${id}`, { type: 'json' });
        if (!draft) return response({ error: 'Upload expired' }, 404);
        const digest = createHash('sha256');
        for (let i = 0; i < draft.chunks.length; i++) {
          const bytes = await store.get(`${prefix}chunks/${id}/${i}`, { type: 'arrayBuffer' });
          if (!bytes || bytes.byteLength !== draft.chunks[i].size || sha256(Buffer.from(bytes)) !== draft.chunks[i].sha256)
            return response({ error: 'Upload incomplete; previous backups remain available' }, 409);
          digest.update(Buffer.from(bytes));
        }
        if (digest.digest('hex') !== draft.sha256) return response({ error: 'Backup integrity check failed' }, 409);
        await store.setJSON(`${prefix}manifests/${id}`, draft);
        await store.delete(`${prefix}drafts/${id}`);
        const manifests = await Promise.all((await keys(store, `${prefix}manifests/`)).map(k => store.get(k, { type: 'json' })));
        for (const old of manifests.filter(Boolean).sort((a, b) => b.createdAt - a.createdAt).slice(3)) await removeVersion(store, prefix, old.id);
        return response({ saved: true, createdAt: draft.createdAt });
      }
      if (id && !part && request.method === 'DELETE') {
        await removeVersion(store, prefix, id);
        return response({ deleted: true });
      }
      return response({ error: 'Not found' }, 404);
    } catch {
      return response({ error: 'Backup request failed. Your previous completed backups are unchanged.' }, 400);
    }
  };
}
