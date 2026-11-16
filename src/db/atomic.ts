import { sqlite } from './client';

let sequence = 0;
/** SAVEPOINTs make repository operations atomic, including nested operations. */
export function atomic<T>(work: () => T): T {
  const name = `fitcoach_${++sequence}`;
  sqlite.execSync(`SAVEPOINT ${name}`);
  try {
    const result = work();
    sqlite.execSync(`RELEASE SAVEPOINT ${name}`);
    return result;
  } catch (error) {
    sqlite.execSync(`ROLLBACK TO SAVEPOINT ${name}`);
    sqlite.execSync(`RELEASE SAVEPOINT ${name}`);
    throw error;
  }
}
