import { getStore } from '@netlify/blobs';
import { createBackupHandler } from './lib/backups.mjs';

export default async request => {
  const handler = createBackupHandler({
    store: getStore({ name: 'fitcoach-encrypted-backups', consistency: 'strong' }),
    authenticate: async req => {
      const authorization = req.headers.get('authorization') ?? '';
      if (!/^Bearer [A-Za-z0-9_.-]+$/.test(authorization) || authorization.length > 8192) return null;
      // Identity validates the signature, expiry and account. No locally decoded JWT claims are trusted.
      const origin = process.env.URL;
      if (!origin || !origin.startsWith('https://')) throw new Error('Identity origin is not configured');
      const result = await fetch(`${origin}/.netlify/identity/user`, { headers: { authorization }, signal: AbortSignal.timeout(8000) });
      return result.ok ? await result.json() : null;
    },
  });
  return handler(request);
};
export const config = { path: ['/api/backups', '/api/backups/*'] };
