#!/usr/bin/env node
/**
 * What an over-the-air update can and cannot change.
 *
 * An OTA update replaces the JavaScript and the assets. It cannot add a
 * native module, upgrade one, add an Android permission or change a config
 * plugin: those live in the APK. An update that calls something the APK on
 * the phone does not have crashes there (3.8.0 nearly shipped a vibration
 * call to an APK without the VIBRATE permission).
 *
 * So the APK carries a native profile, recorded here when it is built
 * (scripts/native-baseline.json), and every release compares the code it is
 * about to publish against it. The same profile means the update lands; a
 * different one means build and install an APK first.
 *
 *   node scripts/native-profile.js            compare with the baseline
 *   node scripts/native-profile.js --write    record the current profile as the baseline
 *
 * The profile holds versions and hashes only: nothing secret, safe to commit.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const BASELINE = path.join(__dirname, 'native-baseline.json');

function hashFiles(dir, skip = /[\\/](build|\.cxx|\.gradle)[\\/]/) {
  const h = crypto.createHash('sha256');
  if (!fs.existsSync(dir)) return null;
  const walk = (d) =>
    fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap((e) => {
      const p = path.join(d, e.name);
      if (skip.test(p + path.sep)) return [];
      return e.isDirectory() ? walk(p) : [p];
    });
  for (const f of walk(dir)) {
    h.update(path.relative(root, f).replace(/\\/g, '/'));
    h.update(fs.readFileSync(f).toString('utf8').replace(/\r\n/g, '\n'));
  }
  return h.digest('hex').slice(0, 16);
}

/** Every installed dependency that ships Android code, at its installed version. */
function nativeDependencies() {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const out = {};
  for (const name of Object.keys(pkg.dependencies || {}).sort()) {
    const dir = path.join(root, 'node_modules', name);
    if (!fs.existsSync(dir)) continue;
    const native = fs.existsSync(path.join(dir, 'android')) || fs.existsSync(path.join(dir, 'expo-module.config.json'));
    if (native) out[name] = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).version;
  }
  return out;
}

/** The resolved app config, as the APK was generated from it. */
function nativeConfig() {
  const json = execSync('npx expo config --type public --json', { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const c = JSON.parse(json);
  return {
    package: c.android?.package ?? null,
    version: c.version,
    runtimeVersion: c.runtimeVersion,
    versionCode: c.android?.versionCode ?? null,
    permissions: [...(c.android?.permissions ?? [])].sort(),
    plugins: c.plugins ?? [],
    updates: c.updates ?? null,
  };
}

function currentProfile() {
  const modules = {};
  const modDir = path.join(root, 'modules');
  if (fs.existsSync(modDir)) for (const m of fs.readdirSync(modDir).sort()) modules[m] = hashFiles(path.join(modDir, m), /[\\/](build|\.cxx|\.gradle|node_modules)[\\/]/);
  return {
    config: nativeConfig(),
    dependencies: nativeDependencies(),
    localModules: modules,
    configPlugins: hashFiles(path.join(root, 'plugins')),
  };
}

function readBaseline() {
  return fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : null;
}

/** Plain-language differences between two profiles; empty when an update is safe. */
function differences(base, now) {
  const out = [];
  const cmp = (label, a, b) => {
    if (JSON.stringify(a) === JSON.stringify(b)) return;
    if (Array.isArray(a) && Array.isArray(b)) {
      const sa = a.map((x) => JSON.stringify(x));
      const sb = b.map((x) => JSON.stringify(x));
      const added = sb.filter((x) => !sa.includes(x));
      const removed = sa.filter((x) => !sb.includes(x));
      out.push(`${label}: ${[...added.map((x) => '+' + x), ...removed.map((x) => '-' + x)].join(', ') || 'order changed'}`);
      return;
    }
    out.push(`${label}: ${JSON.stringify(a)} → ${JSON.stringify(b)}`);
  };
  for (const k of Object.keys({ ...base.config, ...now.config })) {
    // versionCode alone does not reach installed apps: it is checked on the next APK, not here.
    if (k === 'versionCode') continue;
    cmp(`config.${k}`, base.config[k], now.config[k]);
  }
  for (const k of [...new Set([...Object.keys(base.dependencies), ...Object.keys(now.dependencies)])].sort()) cmp(`native dependency ${k}`, base.dependencies[k], now.dependencies[k]);
  for (const k of [...new Set([...Object.keys(base.localModules), ...Object.keys(now.localModules)])].sort()) cmp(`local module ${k}`, base.localModules[k], now.localModules[k]);
  cmp('config plugins', base.configPlugins, now.configPlugins);
  return out;
}

function writeBaseline(apk) {
  const profile = currentProfile();
  const body = { note: 'Native profile of the APK installed on the phone. Written by scripts/build-apk.js; read by scripts/release.js.', apk: apk ?? null, recorded: new Date().toISOString().slice(0, 10), ...profile };
  fs.writeFileSync(BASELINE, JSON.stringify(body, null, 2) + '\n');
  return body;
}

module.exports = { currentProfile, readBaseline, differences, writeBaseline, BASELINE };

if (require.main === module) {
  if (process.argv.includes('--write')) {
    const apkArg = (process.argv.find((a) => a.startsWith('--apk=')) || '').slice(6) || null;
    const b = writeBaseline(apkArg);
    console.log(`✓ Baseline recorded for ${b.apk ?? 'the current build'} (${Object.keys(b.dependencies).length} native dependencies).`);
  } else {
    const base = readBaseline();
    if (!base) {
      console.error('No baseline: build an APK with npm run build:apk:local, or record one with --write.');
      process.exit(1);
    }
    const diff = differences(base, currentProfile());
    if (diff.length) {
      console.error(`✗ The native side changed since ${base.apk ?? 'the installed APK'}:\n  ` + diff.join('\n  '));
      process.exit(1);
    }
    console.log(`✓ Same native profile as ${base.apk ?? 'the installed APK'}: an OTA update lands safely.`);
  }
}
