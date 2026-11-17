// Integration tests using production repositories and a real SQLite database. Production TypeScript runs against a fresh,
// in-memory SQLite database through an Expo-compatible synchronous adapter.
require('tsx/cjs');
const fs = require('fs');
const Module = require('module');
const { DatabaseSync } = require('node:sqlite');
const native = new DatabaseSync(':memory:');
const params = p => Array.isArray(p) ? p : p === undefined ? [] : [p];
let failSql = null;
const before = sql => { if (failSql && failSql.test(sql)) throw new Error('Audit injected write failure'); };
const adapter = {
  execSync(sql) { before(sql); native.exec(sql); },
  getAllSync(sql, ...p) { return native.prepare(sql).all(...p.flat()); },
  getFirstSync(sql, ...p) { return native.prepare(sql).get(...p.flat()); },
  runSync(sql, ...p) { before(sql); const r = native.prepare(sql).run(...p.flat()); return { ...r, lastInsertRowId: Number(r.lastInsertRowid) }; },
  withTransactionSync(fn) { native.exec('BEGIN'); try { fn(); native.exec('COMMIT'); } catch(e) { native.exec('ROLLBACK'); throw e; } },
  prepareSync(sql) {
    const stmt = native.prepare(sql);
    return {
      executeSync(p) {
        before(sql);
        if (/^\s*(select|pragma|with)/i.test(sql)) {
          stmt.setReturnArrays(false);
          const rows = stmt.all(...params(p));
          return { getAllSync: () => rows, getFirstSync: () => rows[0] ?? null };
        }
        const r = stmt.run(...params(p));
        return { ...r, lastInsertRowId: Number(r.lastInsertRowid) };
      },
      executeForRawResultSync(p) {
        stmt.setReturnArrays(true);
        const rows = stmt.all(...params(p));
        return { getAllSync: () => rows, getFirstSync: () => rows[0] ?? null };
      },
      finalizeSync() {},
    };
  },
};
const originalLoad = Module._load;
Module._load = function(id, parent, main) {
  if (id === 'expo-sqlite') return { openDatabaseSync: () => adapter };
  if (id === 'expo-secure-store') return { getItem: () => null, setItem: () => {} };
  if (id === 'react-native') return { Platform: { OS: 'android' } };
  return originalLoad.call(this, id, parent, main);
};
const assert = require('node:assert/strict');

const path = require('node:path');
const fixture = path.join(__dirname,'fixtures','schema-v42.sql');
if (process.argv.includes('--capture-fixture')) {
  const source = require('node:child_process').execFileSync('git',['show','HEAD:src/db/bootstrap.ts'],{encoding:'utf8'});
  const ts = require('typescript');
  const filename=path.resolve('src/db/bootstrap-v42-fixture.cjs');
  const legacy=new Module(filename,module);legacy.filename=filename;legacy.paths=Module._nodeModulePaths(path.dirname(filename));
  legacy._compile(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,filename);
  legacy.exports.initDatabase();
  assert.equal(native.prepare('PRAGMA user_version').get().user_version,42);
  const ddl=native.prepare("SELECT sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END,name").all();
  fs.mkdirSync(path.dirname(fixture),{recursive:true});
  fs.writeFileSync(fixture,'-- Legacy v42 schema captured before the v4 migration.\n'+ddl.map(r=>r.sql+';').join('\n')+'\nPRAGMA user_version = 42;\n');
  console.log('Captured v42 upgrade fixture');process.exit(0);
}
native.exec(fs.readFileSync(fixture,'utf8'));
require('../src/db/seed.ts').seedExerciseLibrary();
native.exec(`INSERT INTO users(id,name,height_cm) VALUES(1,'Legacy athlete',175);
INSERT INTO weigh_ins(id,user_id,date,weight_kg) VALUES(7,1,'2026-01-01',75);
INSERT INTO nutrition_goals(user_id,calorie_target,protein_g,carbs_g,fat_g) VALUES(1,2101,140,240,65);
INSERT INTO sessions(id,user_id,session_type,start_time) VALUES(10,1,'strength',1000),(11,1,'strength',2000);
INSERT INTO sessions(id,user_id,session_type,start_time,end_time,duration_s) VALUES(12,1,'strength',3000,903000,900);
INSERT INTO exercise_logs(id,session_id,exercise_id,order_index) VALUES(8,12,1,0);
INSERT INTO set_entries(id,exercise_log_id,set_number,reps,weight_kg,completed) VALUES(9,8,1,5,100,1);
INSERT INTO alcohol_entries(id,user_id,date,type,volume_ml,abv_pct,alcohol_grams,standard_drinks,calories)
VALUES(6,1,'2026-01-01','beer',330,5,13,1.3,140);`);
const {initDatabase,SCHEMA_VERSION}=require('../src/db/bootstrap.ts');
failSql=/CREATE UNIQUE INDEX IF NOT EXISTS idx_one_live_session/;
assert.throws(()=>initDatabase(),/injected/);
assert.equal(native.prepare('PRAGMA user_version').get().user_version,42);
assert.equal(native.prepare('PRAGMA table_info(sessions)').all().some(c=>c.name==='archived_at'),false);
assert.equal(native.prepare('SELECT count(*) AS n FROM sessions').get().n,3);
failSql=null;initDatabase();
assert.equal(native.prepare('PRAGMA user_version').get().user_version,SCHEMA_VERSION);
assert.equal(native.prepare('SELECT name FROM users WHERE id=1').get().name,'Legacy athlete');
assert.equal(native.prepare('SELECT id FROM weigh_ins').get().id,7);
assert.equal(native.prepare('SELECT calorie_target,manual FROM nutrition_goals').get().calorie_target,2101);
assert.equal(native.prepare('SELECT manual FROM nutrition_goals').get().manual,1);
assert.equal(native.prepare('SELECT id FROM sessions WHERE end_time IS NULL AND archived_at IS NULL').get().id,11);
assert.equal(native.prepare('SELECT archived_at FROM sessions WHERE id=10').get().archived_at,1000);
assert.ok(native.prepare('SELECT bodyweight_kg FROM sessions WHERE id=12').get().bodyweight_kg>0);
assert.ok(native.prepare('SELECT food_entry_id FROM alcohol_entries WHERE id=6').get().food_entry_id);
assert.equal(native.prepare("SELECT count(*) AS n FROM food_entries WHERE source='alcohol'").get().n,1);
initDatabase();
assert.equal(native.prepare("SELECT count(*) AS n FROM food_entries WHERE source='alcohol'").get().n,1);
assert.ok(native.prepare('PRAGMA table_info(set_entries)').all().some(c=>c.name==='duration_source'));
assert.equal(native.prepare('SELECT COUNT(*) AS n FROM workout_timing').get().n,0);
assert.equal(native.prepare('SELECT equipment_id FROM exercise_logs WHERE id=8').get().equipment_id,null);
console.log('PASS v42 → v44 preserves IDs, targets, drafts and history; rollback/retry and alcohol backfill are idempotent.');
