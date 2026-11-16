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
const secureValues = new Map();
let backgroundBackupRegistered = false;
Module._load = function(id, parent, main) {
  if (id === 'expo-sqlite') return { openDatabaseSync: () => adapter };
  if (id === 'expo-secure-store') return { getItem: key => secureValues.get(key) ?? null, setItem: (key,value) => secureValues.set(key,value) };
  if (id === 'expo-file-system' || id === 'expo-crypto') return {};
  if (id === 'expo-background-fetch') return {
    registerTaskAsync: async () => { backgroundBackupRegistered = true; },
    unregisterTaskAsync: async () => { backgroundBackupRegistered = false; },
  };
  if (id === 'expo-task-manager') return { defineTask: () => {}, isTaskRegisteredAsync: async () => backgroundBackupRegistered };
  if (id === 'react-native') return { Platform: { OS: 'android' } };
  return originalLoad.call(this, id, parent, main);
};
const assert = require('node:assert/strict');
const { initDatabase, SCHEMA_VERSION } = require('../src/db/bootstrap.ts');
let passed = 0;
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }
test('failed migration rolls back and can be retried', () => {
  failSql = /CREATE TABLE IF NOT EXISTS sessions/i;
  assert.throws(() => initDatabase(), /injected/);
  assert.equal(native.prepare('PRAGMA user_version').get().user_version, 0);
  assert.equal(native.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='table'").get().n, 0);
  failSql = null; initDatabase();
  assert.equal(native.prepare('PRAGMA user_version').get().user_version, SCHEMA_VERSION);
});
const user = require('../src/repositories/userRepo.ts');
const food = require('../src/repositories/nutritionRepo.ts');
const alcohol = require('../src/repositories/alcoholRepo.ts');
const supp = require('../src/repositories/supplementsRepo.ts');
const session = require('../src/repositories/sessionRepo.ts');
const stats = require('../src/repositories/statsRepo.ts');
const sleep = require('../src/repositories/sleepRepo.ts');
const work = require('../src/repositories/workRepo.ts');
const { useUserStore } = require('../src/stores/userStore.ts');
const { todayISO, daysAgoISO, fromISODate, nextDayMs } = require('../src/lib/date.ts');
const store = useUserStore.getState;
user.ensureUser(); store().load();
store().completeOnboarding({ name:'Test Athlete', gender:'male', sex:'male', birthdate:'1995-01-01', heightCm:175, weightKg:75, activityLevel:'moderate', goal:'maintain', rate:'moderate', experienceLevel:'beginner' });
test('manual goals survive profile and weight changes; zero caffeine is valid', () => {
  user.upsertNutritionGoal({ ...user.getNutritionGoal(), manual:true, calorieTarget:2101, waterGoalMl:3456, caffeineSoftLimitMg:0 });
  store().load(); store().updateProfile({unitPreference:'imperial'}); store().logWeight(76);
  assert.equal(user.getNutritionGoal().calorieTarget, 2101);
  assert.equal(user.getNutritionGoal().waterGoalMl, 3456);
  assert.equal(user.getNutritionGoal().caffeineSoftLimitMg, 0);
  const before = user.getNutritionGoal();
  assert.equal(store().recalcTargets({ preview:true, resetManual:true }).manual, false);
  assert.deepEqual(user.getNutritionGoal(), before);
});
test('weigh-in, sleep and work edits retain rows after a write failure', () => {
  sleep.logSleep({hours:8}); work.logWork({minutes:120});
  const cases = [
    ['weigh_ins', () => user.addWeighIn(80), () => user.latestWeight()],
    ['sleep_logs', () => sleep.logSleep({hours:5}), () => sleep.sleepForDate(todayISO())],
    ['work_logs', () => work.logWork({minutes:90}), () => work.workForDate(todayISO())],
  ];
  for (const [table, mutate, read] of cases) {
    const before=read(); failSql=new RegExp(`update "${table}"`, 'i');
    assert.throws(mutate, /injected/); failSql=null; assert.deepEqual(read(), before);
    mutate(); assert.equal(read().id, before.id);
  }
});
test('negative, nonfinite and impossible date input is rejected', () => {
  for (const value of [-1, NaN, Infinity]) assert.throws(() => user.addWeighIn(value));
  assert.throws(() => user.addWeighIn(75, {date:'2026-02-30'}));
  assert.throws(() => work.logWork({startTime:'oops',endTime:'17:00'}));
  assert.throws(() => work.logWork({startTime:'09:00',endTime:'10:00',breakMinutes:61}));
  assert.throws(() => user.upsertNutritionGoal({...user.getNutritionGoal(),calorieTarget:-1}));
});
test('alcohol contributes once to nutrition, and linked edits/delete/undo stay consistent', () => {
  assert.equal(alcohol.alcoholImpact().dryDays7d,0);
  alcohol.logDrink({type:'beer',volumeMl:330,abvPct:5});
  const drink=alcohol.drinksForDay()[0]; const snap=food.getFoodEntry(drink.foodEntryId);
  assert.equal(food.dayNutrition(todayISO()).calories,Math.round(drink.calories));
  food.updateFoodEntry(snap.id,{quantity:2});
  assert.equal(alcohol.drinksForDay()[0].volumeMl,660);
  const doubled=food.getFoodEntry(snap.id); food.deleteFoodEntry(snap.id);
  assert.equal(alcohol.drinksForDay().length,0);
  assert.equal(food.restoreFoodEntry(doubled),snap.id);
  assert.equal(alcohol.drinksForDay().length,1);
  alcohol.deleteDrink(drink.id); assert.equal(food.getFoodEntry(snap.id),undefined);
});
test('supplement units and micros track diary portions, including undo', () => {
  supp.logSupplement('omega-3'); const row=supp.supplementsForDay()[0];
  const original=food.getFoodEntry(row.foodEntryId); food.updateFoodEntry(original.id,{quantity:2});
  if (row.unitsTaken != null) assert.equal(supp.supplementsForDay()[0].unitsTaken,row.unitsTaken*2);
  const snap=food.getFoodEntry(original.id); food.deleteFoodEntry(original.id);
  assert.equal(supp.supplementsForDay().length,0);
  assert.equal(food.restoreFoodEntry(snap),original.id);
  supp.deleteSupplementLog(row.id); assert.equal(food.getFoodEntry(original.id),undefined);
});
test('backdated food has a local timestamp and AI provenance', () => {
  const date=daysAgoISO(3);
  const id=food.addPreciseFood({date,source:'ai',mealType:'lunch',foodName:'Test meal',quantity:1,calories:100,proteinG:5,carbsG:10,fatG:4});
  const row=food.getFoodEntry(id); assert.equal(row.isEstimated,true); assert.equal(row.source,'ai');
  assert.ok(row.createdAt>=fromISODate(date).getTime() && row.createdAt<nextDayMs(date));
  assert.throws(()=>food.updateFoodEntry(id,{quantity:-1}));
});
let first, logId, setId;
const exerciseId=native.prepare("SELECT id FROM exercises WHERE tracking_type='reps_weight' LIMIT 1").get().id;
test('first valid lift is a PR; completed edits refresh totals and later PRs', () => {
  first=session.logPastSession({sessionType:'strength',startTime:Date.now()-7200000,endTime:Date.now()-3600000,weightKg:75}).session.id;
  logId=session.addExerciseToSession(first,exerciseId);
  setId=session.addSet(logId,{reps:10,weightKg:60});
  assert.equal(session.getSessionDetail(first).logs[0].sets[0].isPr,true);
  assert.equal(session.getSession(first).totalVolume,600);
  const later=session.logPastSession({sessionType:'strength',startTime:Date.now()-3000000,endTime:Date.now()-1000000,weightKg:75}).session.id;
  const laterLog=session.addExerciseToSession(later,exerciseId); session.addSet(laterLog,{reps:10,weightKg:70});
  assert.equal(session.getSessionDetail(later).logs[0].sets[0].isPr,true);
  session.updateSet(setId,{weightKg:80});
  assert.equal(session.getSession(first).totalVolume,800);
  assert.equal(session.getSessionDetail(first).logs[0].sets[0].reps,10);
  assert.equal(session.getSessionDetail(later).logs[0].sets[0].isPr,false);
  assert.deepEqual(session.sessionCalorieBreakdown(session.getSessionDetail(first),75),session.sessionCalorieBreakdown(session.getSessionDetail(first),120));
  session.deleteSet(setId); assert.equal(session.getSession(first).totalVolume,0);
  assert.equal(session.getSessionDetail(later).logs[0].sets[0].isPr,true);
});
test('a failed derived-total write rolls back a set edit', () => {
  const id=session.addSet(logId,{reps:10,weightKg:50});
  failSql=/update "sessions"/i; assert.throws(()=>session.updateSet(id,{weightKg:90}),/injected/);failSql=null;
  assert.equal(session.getSessionDetail(first).logs[0].sets[0].weightKg,50);
});
test('one live workout, completion-only statistics and idempotent finish', () => {
  const completed=session.listSessions().length;
  const id=session.startSession('strength'); assert.equal(session.startSession('cardio'),id);
  assert.equal(session.listSessions().length,completed);
  assert.equal(stats.weeklyVolume().reduce((n,w)=>n+w.sessions,0),completed);
  const a=session.finalizeSession(id,{onFoot:true,activity:{distanceM:1000},weightKg:75});
  const b=session.finalizeSession(id,{onFoot:true,activity:{distanceM:1000},weightKg:90});
  assert.deepEqual(b,a);
});
test('local day uses midnight inclusive and next midnight exclusive', () => {
  const date=daysAgoISO(6);const start=fromISODate(date).getTime(),end=nextDayMs(date);
  const a=session.logPastSession({sessionType:'cardio',startTime:start,endTime:start+60000}).session.id;
  const b=session.logPastSession({sessionType:'cardio',startTime:end,endTime:end+60000}).session.id;
  const rows=session.listSessions({since:date,until:date});assert.ok(rows.some(r=>r.id===a));assert.ok(!rows.some(r=>r.id===b));
});
test('stale sleep and empty food are not treated as current measurements', () => {
  const current=sleep.sleepForDate(todayISO());if(current)sleep.deleteSleep(current.id);
  sleep.logSleep({date:daysAgoISO(5),hours:9});assert.equal(sleep.sleepSummary().lastNight,null);
  const b=require('../src/lib/energyBalance.ts').computeEnergyBalance({goal:'maintain',calorieTarget:2400,tdee:2400,bmr:1600,consumedKcal:0,exerciseKcal:25});
  assert.equal(b.status,'incomplete');assert.equal(b.restoreKcal,0);
});
test('routine retains activity type, planned sets and rest', () => {
  session.setExerciseRest(logId,150);
  const r=require('../src/repositories/routinesRepo.ts').saveSessionRoutine('Test routine',first);
  assert.equal(r.sessionType,'strength'); assert.equal(r.prescription[0].restSeconds,150);
  assert.equal(r.prescription[0].sets[0].weightKg,50);assert.equal(r.prescription[0].sets[0].completed,false);
});
test('diet suggestions respect exclusions and report target mismatches', () => {
  const {generateDietPlan}=require('../src/lib/dietPlan.ts');
  const target={calories:2626,protein:135,carbs:337,fat:82};
  for(let seed=1;seed<=12;seed++) {
    const plan=generateDietPlan(target,{seed,excluded:['milk','peanut']});
    assert.ok(plan.meals.flatMap(m=>m.items).every(i=>!/milk|peanut/i.test(i.name)));
    assert.ok(Math.abs(plan.totals.calories-target.calories)<=target.calories*.1 || plan.warnings.length>0);
    assert.ok(Math.abs(plan.totals.protein-target.protein)<=target.protein*.1 || plan.warnings.length>0);
  }
});
test('sensor snapshots and session steps do not double-count or erase each other', () => {
  const activity=require('../src/repositories/activityRepo.ts');
  const day='2026-10-10';
  activity.setDailySteps(day,1200,800,50);
  activity.addSteps(1000,750,45,day);
  assert.equal(activity.getDailySteps(day).stepCount,1200);
  activity.setDailySteps(day,1500,1000,65);
  assert.equal(activity.getDailySteps(day).stepCount,1500);
  activity.removeSteps(1000,750,45,day);
  assert.equal(activity.getDailySteps(day).stepCount,1500);
  activity.setDailySteps(day,0,0,0);
  assert.equal(activity.getDailySteps(day).stepCount,1500);
});
test('vehicle route filtering survives batches and excludes the exit-to-reentry gap', () => {
  const {gateRoute,newTrackingGate,stepCreditAllowed}=require('../src/lib/trackingGate.ts');
  const {routeDistanceM}=require('../src/lib/geo.ts');
  let state=newTrackingGate(),route=[],distance=0;
  const fix=(metres,at,speed)=>({lat:0,lng:metres/111195,at,speed,accuracy:4});
  const apply=(fixes,motion=null)=>{const r=gateRoute(route,fixes,state,motion);state=r.state;route.push(...r.accepted);distance+=r.distanceM;};
  apply([fix(0,1000,1),fix(10,11000,1),fix(20,21000,1)]);
  assert.ok(distance>19&&distance<21);
  apply([fix(120,31000,10)]);
  assert.equal(state.vehicle,false);assert.equal(stepCreditAllowed(state),false);
  apply([fix(220,41000,10)],{kind:'vehicle',confidence:95,at:41000});
  assert.equal(state.vehicle,true);assert.ok(distance<21);
  apply([fix(230,51000,1),fix(240,61000,1),fix(250,71000,1)]);
  assert.equal(state.vehicle,false);assert.ok(distance<35);assert.equal(route.some(p=>p[2]===1),true);
  assert.equal(stepCreditAllowed(state),true);
  assert.ok(Math.abs(routeDistanceM(route)-distance)<.001);
  const before=JSON.stringify(state);apply([fix(9000,61000,100)]);assert.equal(JSON.stringify(state),before);
});
test('running and cycling remain countable, outages never become route shortcuts', () => {
  const {gateRoute,newTrackingGate}=require('../src/lib/trackingGate.ts');
  const f=(m,t,speed)=>({lat:0,lng:m/111195,at:t,speed,accuracy:4});
  const run=gateRoute([], [f(0,1000,8),f(80,11000,8)],newTrackingGate(),{kind:'running',confidence:95,at:1000});
  assert.ok(run.distanceM>79);assert.equal(run.state.vehicle,false);
  const ride=gateRoute([], [f(0,1000,10),f(100,11000,10)],newTrackingGate(),null,true);
  assert.ok(ride.distanceM>99);
  const gap=gateRoute(run.accepted,[f(10000,100000,1)],run.state,null);
  assert.equal(gap.distanceM,0);assert.ok(gap.state.excludedMs>=89000);
});
test('encrypted backups round-trip and reject tampering, wrong keys and unsafe schemas', () => {
  const crypto=require('../src/lib/backupCrypto.ts');
  const {randomBytes}=require('node:crypto');
  const key=new Uint8Array(randomBytes(32)),nonce=new Uint8Array(randomBytes(24));
  const secret={health:'private record',data:[1,2,3]};
  const encrypted=crypto.encryptBackup(secret,key,nonce);
  assert.deepEqual(crypto.decryptBackup(encrypted,key),secret);
  assert.equal(Buffer.from(encrypted).includes(Buffer.from('private record')),false);
  assert.throws(()=>crypto.decryptBackup(encrypted,new Uint8Array(randomBytes(32))),/key|damaged/i);
  encrypted[encrypted.length-1]^=1;
  assert.throws(()=>crypto.decryptBackup(encrypted,key),/damaged/i);
  assert.deepEqual(crypto.parseRecoveryCode(crypto.recoveryCode(key)),key);
  assert.throws(()=>crypto.parseRecoveryCode('1234'));
});
test('backup snapshot excludes credentials; restore is transactional and validates before mutation', () => {
  const repo=require('../src/repositories/backupRepo.ts');
  native.exec("UPDATE sessions SET archived_at=start_time WHERE end_time IS NULL");
  native.prepare('INSERT OR REPLACE INTO app_kv(key,value,updated_at) VALUES(?,?,?)').run('openrouter.apiKey','"secret-key"',1);
  const snapshot=repo.captureSnapshot();
  assert.ok(!JSON.stringify(snapshot).includes('secret-key'));
  const before=native.prepare('SELECT COUNT(*) AS n FROM food_entries').get().n;
  const invalid=structuredClone(snapshot);invalid.schema=999;
  assert.throws(()=>repo.restoreSnapshot(invalid),/unsupported/i);
  assert.equal(native.prepare('SELECT COUNT(*) AS n FROM food_entries').get().n,before);
  const broken=structuredClone(snapshot);
  broken.tables.exercise_logs.push({id:999999,session_id:999999,exercise_id:1,order_index:0});
  assert.throws(()=>repo.restoreSnapshot(broken),/relationship/i);
  const wrongProfile=structuredClone(snapshot);wrongProfile.tables.users[0].id=2;
  assert.throws(()=>repo.restoreSnapshot(wrongProfile),/profile/i);
  assert.equal(native.prepare('SELECT COUNT(*) AS n FROM food_entries').get().n,before);
  failSql=/INSERT INTO "food_entries"/i;
  try { assert.throws(()=>repo.restoreSnapshot(snapshot),/injected/); } finally {failSql=null;}
  assert.equal(native.prepare('SELECT COUNT(*) AS n FROM food_entries').get().n,before);
  repo.restoreSnapshot(snapshot);
  assert.equal(native.prepare('SELECT COUNT(*) AS n FROM food_entries').get().n,before);
  assert.equal(native.prepare("SELECT value FROM app_kv WHERE key='openrouter.apiKey'").get().value,'"secret-key"');
});
test('walk clocks preserve pauses and exclude unobserved restart gaps', () => {
  const { restoreWalkClock } = require('../src/lib/walkClock.ts');
  const start = 1000, observed = 61000, now = 361000;
  const pause = { startTime: start, total: 10000, since: null, observedAt: observed };
  assert.equal(restoreWalkClock(start, now, observed, pause).activeSec, 50);
  const paused = restoreWalkClock(start, now, observed, { ...pause, since: 51000 });
  assert.equal(paused.activeSec, 40);
  assert.equal(paused.total, 10000);
  assert.equal(restoreWalkClock(start, now, observed, pause, now, 60000).activeSec, 300);
  assert.equal(restoreWalkClock(start, observed, observed, { ...pause, startTime: 999 }).activeSec, 60);
  const { excludedTime } = require('../src/lib/walkClock.ts');
  assert.equal(excludedTime(0,100000,[[10000,30000],[20000,40000],[60000,70000]]),40000);
  assert.equal(restoreWalkClock(1000,101000,101000,{startTime:1000,total:10000,since:null,intervals:[[61000,71000]]},101000,30000,[[11000,41000]]).activeSec,60);
});
test('a killed backup attempt does not leave manual retry permanently disabled', () => {
  const {kvSetStrict}=require('../src/repositories/kvRepo.ts');
  secureValues.set('fitcoach.backup.session',JSON.stringify({id:'recovery-test',email:'test@example.invalid'}));
  kvSetStrict('backup.status.recovery-test',{enabled:true,busy:true,lastAttempt:Date.now(),error:'Interrupted'});
  const {backupStatus}=require('../src/services/backup.ts');
  const status=backupStatus();
  assert.equal(status.enabled,true);assert.equal(status.busy,false);assert.equal(status.error,'Interrupted');
  secureValues.delete('fitcoach.backup.session');
});
(async () => {
  const {kvSetStrict}=require('../src/repositories/kvRepo.ts');
  const backup=require('../src/services/backup.ts');
  secureValues.set('fitcoach.backup.session',JSON.stringify({id:'schedule-test',email:'test@example.invalid'}));
  kvSetStrict('backup.status.schedule-test',{enabled:false});
  await backup.registerDailyBackup();assert.equal(backgroundBackupRegistered,false);
  kvSetStrict('backup.status.schedule-test',{enabled:true});
  await backup.registerDailyBackup();assert.equal(backgroundBackupRegistered,true);
  await backup.setAutomaticBackup(false);assert.equal(backgroundBackupRegistered,false);
  assert.equal(backup.backupStatus().enabled,false);
  secureValues.delete('fitcoach.backup.session');
  passed++;console.log('PASS daily backup jobs are registered only while automatic backup is enabled');
  console.log(`${passed} repository integration checks passed.`);
})().catch(error => {console.error(error);process.exitCode=1;});
