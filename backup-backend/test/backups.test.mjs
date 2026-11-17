import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBackupHandler, sha256 } from '../functions/lib/backups.mjs';

const alice = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const bob = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
function harness(deleteAccount = async () => {}) {
  const values = new Map();
  const store = { get: async key => values.get(key) ?? null, set: async (k,v) => values.set(k,v),
    setJSON: async (k,v) => values.set(k,structuredClone(v)), delete: async k => values.delete(k),
    list: async function* ({prefix}) { yield { blobs: [...values.keys()].filter(k => k.startsWith(prefix)).map(key => ({key})) }; } };
  const handler = createBackupHandler({ store, deleteAccount, authenticate: async r => r.headers.get('authorization') ? { id: r.headers.get('authorization') } : null });
  const call = async (user, method, path = '', body) => {
    const response = await handler(new Request(`https://example.test/api/backups${path}`, { method, headers: user ? { authorization:user } : {}, body: body ? JSON.stringify(body) : undefined }));
    return { status: response.status, body: await response.json() };
  };
  const bytes = Buffer.from('encrypted health snapshot');
  const manifest = { chunks: [{ size: bytes.length, sha256: sha256(bytes) }], sha256: sha256(bytes), keyId: sha256('key'), schema:43 };
  return { values, call, bytes, manifest };
}
test('unauthenticated and invalid identities cannot read or write', async () => {
  const {call,manifest} = harness();
  assert.equal((await call(null,'GET')).status,401);
  assert.equal((await call('../../other','POST','',manifest)).status,401);
});
test('account isolation, complete upload, interrupted upload and integrity rejection', async () => {
  const {call,bytes,manifest} = harness();
  const draft = (await call(alice,'POST','',manifest)).body;
  assert.equal((await call(alice,'POST',`/${draft.id}`)).status,409);
  assert.equal((await call(alice,'GET')).body.length,0);
  assert.equal((await call(bob,'PUT',`/${draft.id}/0`,{data:bytes.toString('base64')})).status,404);
  assert.equal((await call(alice,'PUT',`/${draft.id}/0`,{data:Buffer.from('bad').toString('base64')})).status,400);
  assert.equal((await call(alice,'PUT',`/${draft.id}/0`,{data:bytes.toString('base64')})).status,200);
  assert.equal((await call(alice,'POST',`/${draft.id}`)).status,200);
  assert.equal((await call(alice,'GET')).body.length,1);
  assert.equal((await call(bob,'GET')).body.length,0);
  assert.equal((await call(bob,'GET',`/${draft.id}/0`)).status,404);
  assert.equal((await call(alice,'GET',`/${draft.id}/0`)).body.data,bytes.toString('base64'));
});
test('bounded manifests and retention keep three completed versions', async () => {
  const {call,bytes,manifest} = harness();
  assert.equal((await call(alice,'POST','',{...manifest,chunks:Array(49).fill(manifest.chunks[0])})).status,400);
  for (let i=0;i<4;i++) {
    const draft=(await call(alice,'POST','',manifest)).body;
    await call(alice,'PUT',`/${draft.id}/0`,{data:bytes.toString('base64')});
    assert.equal((await call(alice,'POST',`/${draft.id}`)).status,200);
  }
  assert.equal((await call(alice,'GET')).body.length,3);
});

test('account deletion removes only authenticated owner data and blocks later writes',async()=>{
  const deleted=[];const {call,values,manifest}=harness(async id=>deleted.push(id));
  const a=(await call(alice,'POST','',manifest)).body;const b=(await call(bob,'POST','',manifest)).body;
  assert.equal((await call(alice,'DELETE','/account',{confirm:'no'})).status,400);
  assert.equal((await call(alice,'DELETE','/account',{confirm:'DELETE MY ACCOUNT',userId:bob})).status,200);
  assert.deepEqual(deleted,[alice]);assert.equal(values.has(`users/${alice}/drafts/${a.id}`),false);
  assert.equal(values.has(`users/${bob}/drafts/${b.id}`),true);
  assert.equal((await call(alice,'POST','',manifest)).status,409);
});
test('identity deletion failure is explicit and retryable after backups were erased',async()=>{
  let fail=true;const {call,values,manifest}=harness(async()=>{if(fail)throw new Error('temporary outage');});
  await call(alice,'POST','',manifest);
  const first=await call(alice,'DELETE','/account',{confirm:'DELETE MY ACCOUNT'});assert.equal(first.status,503);
  assert.match(first.body.error,/backups were deleted/);assert.equal([...values.keys()].filter(k=>!k.endsWith('/deleting')).length,0);
  fail=false;assert.equal((await call(alice,'DELETE','/account',{confirm:'DELETE MY ACCOUNT'})).status,200);
});
