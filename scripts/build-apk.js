#!/usr/bin/env node
/**
 * Build the release APK on this computer, signed with the SAME key as the
 * EAS builds — so it installs over the app already on the phone and keeps
 * every bit of its data. A different key would make Android refuse the
 * update, and the only way in would be to uninstall: the database lives in
 * the app's storage, so uninstalling deletes it.
 *
 *   npm run build:apk:local            prebuild if needed, then build
 *   npm run build:apk:local -- --clean regenerate /android from scratch first
 *   npm run build:apk:local -- --warm  build signed with the DEBUG key, only to
 *                                      warm Gradle's caches (never install it)
 *
 * Signing comes from credentials.json + credentials/android/keystore.jks, the
 * files `eas credentials` writes when you choose "Download credentials from
 * EAS to credentials.json". Both are git-ignored and must stay that way: the
 * repository is public. Passwords reach Gradle through the environment of
 * this process only; nothing here prints or stores them.
 *
 * Needs a JDK 17 and the Android SDK (Android Studio installs both).
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const clean = args.includes('--clean');
const warm = args.includes('--warm');
const isWin = process.platform === 'win32';

function fail(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

function run(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, { stdio: 'inherit', shell: isWin, cwd: root, ...opts });
  if (r.status !== 0) fail(`${cmd} ${cmdArgs.join(' ')} failed (exit ${r.status})`);
}

// ── signing ──────────────────────────────────────────────────────────────────
let signing = null;
if (!warm) {
  const credPath = path.join(root, 'credentials.json');
  if (!fs.existsSync(credPath)) {
    fail(
      'credentials.json is missing. Run `npx eas-cli credentials -p android`, choose the "preview" profile, then\n' +
        '  "credentials.json: Upload/Download credentials between EAS servers and your local json" →\n' +
        '  "Download credentials from EAS to credentials.json". It writes the keystore the installed app is signed with.'
    );
  }
  const ks = JSON.parse(fs.readFileSync(credPath, 'utf8'))?.android?.keystore;
  if (!ks?.keystorePath || !ks.keystorePassword || !ks.keyAlias) fail('credentials.json has no android.keystore entry.');
  const storeFile = path.resolve(root, ks.keystorePath);
  if (!fs.existsSync(storeFile)) fail(`The keystore named in credentials.json is not there: ${ks.keystorePath}`);
  signing = { storeFile, storePassword: ks.keystorePassword, keyAlias: ks.keyAlias, keyPassword: ks.keyPassword ?? ks.keystorePassword };
}

// ── toolchain ────────────────────────────────────────────────────────────────
function findJdk17() {
  if (process.env.FITCOACH_JAVA_HOME) return process.env.FITCOACH_JAVA_HOME;
  const candidates = isWin
    ? ['C:\\Program Files\\Eclipse Adoptium', 'C:\\Program Files\\Microsoft', 'C:\\Program Files\\Java', 'C:\\Program Files\\Android\\Android Studio\\jbr']
    : ['/usr/lib/jvm', '/Library/Java/JavaVirtualMachines'];
  for (const base of candidates) {
    if (!fs.existsSync(base)) continue;
    if (/jbr$/.test(base)) return base;
    const hit = fs.readdirSync(base).find((d) => /^(jdk-?)?17/.test(d));
    if (hit) return path.join(base, hit);
  }
  return process.env.JAVA_HOME;
}
const javaHome = findJdk17();
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || (isWin ? path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk') : path.join(process.env.HOME || '', 'Android', 'Sdk'));
if (!fs.existsSync(sdk)) fail(`Android SDK not found at ${sdk}. Install Android Studio, or set ANDROID_HOME.`);

// ── native project ───────────────────────────────────────────────────────────
const androidDir = path.join(root, 'android');
if (clean || !fs.existsSync(androidDir)) {
  // Prebuild rewrites the "android"/"ios" scripts in package.json; put it back as it was.
  const pkgPath = path.join(root, 'package.json');
  const pkgBefore = fs.readFileSync(pkgPath, 'utf8');
  run('npx', ['expo', 'prebuild', '--platform', 'android', '--no-install', ...(clean ? ['--clean'] : [])], { env: { ...process.env, CI: '1' } });
  fs.writeFileSync(pkgPath, pkgBefore);
}
fs.writeFileSync(path.join(androidDir, 'local.properties'), `sdk.dir=${sdk.replace(/\\/g, '\\\\')}\n`);

// Release signing from the environment; idempotent.
const gradleFile = path.join(androidDir, 'app', 'build.gradle');
let gradle = fs.readFileSync(gradleFile, 'utf8');
if (!gradle.includes('FITCOACH_STORE_FILE')) {
  gradle = gradle.replace(
    /signingConfigs\s*\{/,
    `signingConfigs {
        release {
            // Filled from the environment by scripts/build-apk.js — never hard-coded.
            if (System.getenv('FITCOACH_STORE_FILE')) {
                storeFile file(System.getenv('FITCOACH_STORE_FILE'))
                storePassword System.getenv('FITCOACH_STORE_PASSWORD')
                keyAlias System.getenv('FITCOACH_KEY_ALIAS')
                keyPassword System.getenv('FITCOACH_KEY_PASSWORD')
            }
        }`
  );
  gradle = gradle.replace(/(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/, '$1signingConfig System.getenv(\'FITCOACH_STORE_FILE\') ? signingConfigs.release : signingConfigs.debug');
  if (!gradle.includes("System.getenv('FITCOACH_STORE_FILE') ? signingConfigs.release")) fail('Could not wire release signing into android/app/build.gradle.');
  fs.writeFileSync(gradleFile, gradle);
}

// ── build ────────────────────────────────────────────────────────────────────
const env = { ...process.env, ANDROID_HOME: sdk, ANDROID_SDK_ROOT: sdk, NODE_ENV: 'production' };
if (javaHome) env.JAVA_HOME = javaHome;
if (signing) {
  env.FITCOACH_STORE_FILE = signing.storeFile;
  env.FITCOACH_STORE_PASSWORD = signing.storePassword;
  env.FITCOACH_KEY_ALIAS = signing.keyAlias;
  env.FITCOACH_KEY_PASSWORD = signing.keyPassword;
} else {
  delete env.FITCOACH_STORE_FILE;
}
console.log(`\nBuilding the release APK (${signing ? 'signed with the EAS key' : 'DEBUG-signed, to warm caches only'})…`);
console.log(`JDK: ${javaHome ?? 'from PATH'}\nSDK: ${sdk}\n`);
// By full path: some shells will not run a program from the current folder.
run(path.join(androidDir, isWin ? 'gradlew.bat' : 'gradlew'), ['assembleRelease', '--no-daemon'], { cwd: androidDir, env });

const apk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
if (!fs.existsSync(apk)) fail('Gradle finished but no APK was found.');
if (warm) {
  console.log('\n✓ Caches warm. This APK is debug-signed: do not install it over the app.\n');
  process.exit(0);
}
const cfg = fs.readFileSync(path.join(root, 'app.config.ts'), 'utf8');
const vc = (cfg.match(/versionCode:\s*(\d+)/) || [])[1] || 'x';
// The release name is the newest changelog entry, e.g. 3.8.0.
const release = (fs.readFileSync(path.join(root, 'src', 'data', 'changelog.ts'), 'utf8').match(/version: '([\d.]+)'/) || [])[1] || 'local';
const outDir = path.join(root, 'dist');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `FitCoach-${release}-vc${vc}.apk`);
fs.copyFileSync(apk, out);
console.log(`\n✓ ${path.relative(root, out)} — signed with the EAS key, installs over the app and keeps its data.\n`);
