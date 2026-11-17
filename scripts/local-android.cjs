#!/usr/bin/env node
// Local Android release. Passwords are passed only through the child environment.
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const args = new Set(process.argv.slice(2));
const win = process.platform === 'win32';
const builds = path.join(root, 'builds');
const android = path.join(root, 'android');
const gradleVersion = '8.10.2'; // Expo SDK 52 / React Native 0.76 / AGP 8.6
const expectedCertificate = '326ec31102b5140bc0ae52e71b368596c0d5d3114e007f72d5f91c86b7c3585c';
function fail(message) { console.error(message); process.exit(1); }
function execute(command, params, options = {}) {
  const result = spawnSync(command, params, { cwd: root, encoding: 'utf8', shell: win && /\.(bat|cmd)$/.test(command), ...options });
  if (result.error || result.status !== 0) fail(`${path.basename(command)} failed: ${result.error?.message || result.stderr || `exit ${result.status}`}`);
  return result.stdout || '';
}
function javaVersion(dir) {
  if (!dir) return false;
  const java = path.join(dir, 'bin', win ? 'java.exe' : 'java');
  if (!fs.existsSync(java)) return false;
  const result = spawnSync(java, ['-version'], { encoding: 'utf8' });
  return result.status === 0 && /version "17[.\"]/.test(result.stderr || '');
}
function findJava() {
  if (process.env.FITCOACH_JAVA_HOME) return process.env.FITCOACH_JAVA_HOME;
  if (javaVersion(process.env.JAVA_HOME)) return process.env.JAVA_HOME;
  const bases = win ? ['C:/Program Files/Eclipse Adoptium', 'C:/Program Files/Microsoft', 'C:/Program Files/Java'] : ['/usr/lib/jvm', '/Library/Java/JavaVirtualMachines'];
  for (const base of bases) if (fs.existsSync(base)) for (const name of fs.readdirSync(base)) {
    const dir = path.join(base, name);
    if (javaVersion(dir)) return dir;
    if (javaVersion(path.join(dir, 'Contents/Home'))) return path.join(dir, 'Contents/Home');
  }
  fail('JDK 17 is required. Set FITCOACH_JAVA_HOME to its installation directory.');
}
const java = findJava();
if (!javaVersion(java)) fail('FITCOACH_JAVA_HOME must point to JDK 17.');
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || path.join(win ? process.env.LOCALAPPDATA : os.homedir(), 'Android/Sdk');
if (!fs.existsSync(sdk)) fail('Install the Android SDK and set ANDROID_HOME.');
const toolsDir = path.join(sdk, 'build-tools', '35.0.0');
if (!fs.existsSync(toolsDir)) fail('Android SDK Build Tools 35.0.0 are required.');
const credentialsFile = path.join(root, 'credentials.json');
if (!fs.existsSync(credentialsFile)) fail('Download the existing release credentials using eas credentials -p android. Never generate a replacement key.');
const key = JSON.parse(fs.readFileSync(credentialsFile, 'utf8')).android?.keystore;
if (!key?.keystorePath || !key?.keystorePassword || !key?.keyAlias) fail('Missing Android release credentials.');
fs.mkdirSync(path.join(builds, 'tmp'), { recursive: true });
const env = { ...process.env, DEBUG: '', JAVA_HOME: java, ANDROID_HOME: sdk, ANDROID_SDK_ROOT: sdk,
  NODE_ENV: 'production', NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=2048',
  GRADLE_USER_HOME: process.env.GRADLE_USER_HOME || path.join(builds, 'gradle-cache'),
  npm_config_cache: path.join(builds, 'npm-cache'),
  TEMP: path.join(builds, 'tmp'), TMP: path.join(builds, 'tmp'),
  CMAKE_BUILD_PARALLEL_LEVEL: '2',
  FITCOACH_STORE_FILE: path.resolve(root, key.keystorePath), FITCOACH_STORE_PASSWORD: key.keystorePassword,
  FITCOACH_KEY_ALIAS: key.keyAlias, FITCOACH_KEY_PASSWORD: key.keyPassword || key.keystorePassword };
const keyInfo = execute(path.join(java, 'bin', win ? 'keytool.exe' : 'keytool'), [
  '-J-Duser.language=en', '-list', '-v', '-keystore', env.FITCOACH_STORE_FILE,
  '-storepass:env', 'FITCOACH_STORE_PASSWORD', '-alias', key.keyAlias,
], { env });
const certificate = keyInfo.match(/SHA256:\s*([A-Fa-f0-9:]+)/)?.[1].replace(/:/g, '').toLowerCase();
if (!keyInfo.includes('PrivateKeyEntry') || certificate !== expectedCertificate) fail('The keystore does not contain the original FitCoach private signing key.');
console.log(`JDK 17: ${java}\nAndroid SDK: ${sdk}\nOriginal private signing key verified (${certificate.slice(0, 12)}…).`);
for (const drive of [path.parse(root).root, path.parse(sdk).root].filter((v, i, a) => a.indexOf(v) === i)) {
  const disk = fs.statfsSync(drive);
  const free = disk.bavail * disk.bsize / 1024 ** 3;
  console.log(`${drive}: ${free.toFixed(1)} GiB free`);
  if (drive.toLowerCase() === path.parse(root).root.toLowerCase() && free < 2) fail(`Free at least 2 GiB on the build drive ${drive}.`);
  if (free < 1) console.warn(`Low free space on SDK drive ${drive}. The SDK is read-only for this build; build files, caches and temporary files use ${builds}.`);
}
if (args.has('--check')) process.exit(0);
if (args.has('--warm')) fail('--warm is no longer supported: every local build uses the verified release key.');
const profile = require('./native-profile');
for (const name of ['TEMP', 'TMP', 'npm_config_cache']) process.env[name] = env[name];
const now = profile.currentProfile();
const stamp = path.join(builds, 'local-native-profile.json');
const old = fs.existsSync(stamp) ? JSON.parse(fs.readFileSync(stamp, 'utf8')) : null;
if (args.has('--clean') || !fs.existsSync(android) || !old || profile.differences(old, now).length || old.config.versionCode !== now.config.versionCode) {
  const pkgPath = path.join(root, 'package.json');
  const before = fs.readFileSync(pkgPath);
  const result = spawnSync(win ? 'npx.cmd' : 'npx', ['expo', 'prebuild', '--platform', 'android', '--no-install', ...(args.has('--clean') ? ['--clean'] : [])], { cwd: root, env: { ...env, CI: '1' }, stdio: 'inherit', shell: win });
  fs.writeFileSync(pkgPath, before);
  if (result.status !== 0) fail('Android prebuild failed.');
  fs.writeFileSync(stamp, JSON.stringify(now, null, 2));
}
fs.writeFileSync(path.join(android, 'local.properties'), `sdk.dir=${sdk.replace(/\\/g, '\\\\')}\n`);
const wrapper = path.join(android, 'gradle/wrapper/gradle-wrapper.properties');
let properties = fs.readFileSync(wrapper, 'utf8');
if (!properties.includes(`gradle-${gradleVersion}-`)) {
  const copy = path.join(builds, `gradle-wrapper-before-${Date.now()}.properties`);
  fs.copyFileSync(wrapper, copy);
  properties = properties.replace(/^distributionUrl=.*$/m, `distributionUrl=https\\://services.gradle.org/distributions/gradle-${gradleVersion}-all.zip`);
  fs.writeFileSync(wrapper, properties);
  console.log(`Restored Gradle ${gradleVersion}; previous wrapper saved in ${path.relative(root, copy)}.`);
}
const gradleFile = path.join(android, 'app/build.gradle');
let gradle = fs.readFileSync(gradleFile, 'utf8');
if (!gradle.includes('FITCOACH_STORE_FILE')) {
  gradle = gradle.replace(/signingConfigs\s*\{/, `signingConfigs {
        release {
            storeFile file(System.getenv('FITCOACH_STORE_FILE'))
            storePassword System.getenv('FITCOACH_STORE_PASSWORD')
            keyAlias System.getenv('FITCOACH_KEY_ALIAS')
            keyPassword System.getenv('FITCOACH_KEY_PASSWORD')
        }`);
}
gradle = gradle.replace(/(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig[^\r\n]+/, '$1signingConfig signingConfigs.release');
if (!/release\s*\{[\s\S]*signingConfig signingConfigs.release/.test(gradle)) fail('Release signing could not be configured.');
if (!gradle.includes('extraPackagerArgs = ["--max-workers"')) gradle = gradle.replace(/react\s*\{/, 'react {\n    extraPackagerArgs = ["--max-workers", "2"]');
// AGP invokes Ninja directly, so CMAKE_BUILD_PARALLEL_LEVEL is not sufficient.
// A shared CMake job pool bounds both compilation and linking on low-memory PCs.
if (!gradle.includes('-DCMAKE_JOB_POOLS=fitcoach=1')) gradle = gradle.replace(/defaultConfig\s*\{/, `defaultConfig {
        externalNativeBuild { cmake {
            arguments "-DCMAKE_JOB_POOLS=fitcoach=1", "-DCMAKE_JOB_POOL_COMPILE=fitcoach", "-DCMAKE_JOB_POOL_LINK=fitcoach"
        } }`);
if (!gradle.includes('// FitCoach local bundle inputs')) gradle += `
// FitCoach local bundle inputs: generated caches and audit files are not app code.
tasks.withType(com.facebook.react.tasks.BundleHermesCTask).configureEach {
    sources.exclude("builds/**", ".audit/**", ".git/**", ".netlify/**", "backup-backend/**", ".vscode/**")
}
`;
if (!gradle.includes('// FitCoach fresh embedded update')) gradle += `
// FitCoach fresh embedded update: Expo SDK 52 otherwise caches its manifest
// independently of changed JS. Reused IDs can launch stale JS after APK upgrades.
tasks.matching { it.name == "createReleaseUpdatesResources" }.configureEach {
    outputs.upToDateWhen { false }
}
`;
fs.writeFileSync(gradleFile, gradle);
// Prebuild can regenerate these settings. Keep one compiler process on this PC.
const gradlePropertiesPath = path.join(android, 'gradle.properties');
let gradleProperties = fs.readFileSync(gradlePropertiesPath, 'utf8');
for (const [name, value] of Object.entries({
  'org.gradle.jvmargs': '-Xmx1536m -XX:MaxMetaspaceSize=768m -XX:ActiveProcessorCount=2 -XX:CICompilerCount=2 -Dfile.encoding=UTF-8',
  'org.gradle.parallel': 'false', 'org.gradle.workers.max': '1',
  'kotlin.compiler.execution.strategy': 'in-process',
})) {
  const pattern = new RegExp('^' + name.replace(/\./g, '\\.') + '=.*$', 'm');
  gradleProperties = pattern.test(gradleProperties) ? gradleProperties.replace(pattern, `${name}=${value}`) : gradleProperties + `\n${name}=${value}\n`;
}
fs.writeFileSync(gradlePropertiesPath, gradleProperties);
// Reuse the distribution without modifying the global cache; all build writes go to D:.
let gradleCommand = path.join(android, win ? 'gradlew.bat' : 'gradlew');
const existing = path.join(os.homedir(), '.gradle/wrapper/dists', `gradle-${gradleVersion}-all`);
if (fs.existsSync(existing)) for (const folder of fs.readdirSync(existing)) {
  const candidate = path.join(existing, folder, `gradle-${gradleVersion}`, 'bin', win ? 'gradle.bat' : 'gradle');
  if (fs.existsSync(candidate)) { gradleCommand = candidate; break; }
}
const emulator = args.has('--emulator');
const bundle = args.has('--aab');
const tasks = args.has('--configure') ? ['help'] : args.has('--native-check') ? [':fitcoach-tools:compileReleaseKotlin', ':step-counter:compileReleaseKotlin'] : [bundle ? ':app:bundleRelease' : ':app:assembleRelease'];
const compilationStartedAt = Date.now();
execute(gradleCommand, [...tasks, '--no-daemon', '--max-workers=1', '--no-watch-fs', ...(args.has('--diagnose') ? ['--stacktrace'] : []), ...(args.has('--all-abis') ? [] : [`-PreactNativeArchitectures=${emulator ? 'x86_64' : 'arm64-v8a'}`])], { cwd: android, env, stdio: 'inherit' });
if (args.has('--configure') || args.has('--native-check')) process.exit(0);
if (profile.differences(now, profile.currentProfile()).length) fail('Native source changed during compilation. Rerun the build before publishing this artifact.');
const extension = bundle ? 'aab' : 'apk';
const artifact = path.join(android, 'app/build/outputs', bundle ? 'bundle' : 'apk', 'release', `app-release.${extension}`);
if (!fs.existsSync(artifact)) fail('Gradle finished without producing the release artifact.');
const manifestEntry = bundle ? 'base/assets/app.manifest' : 'assets/app.manifest';
const embeddedFiles = require('fflate').unzipSync(fs.readFileSync(artifact), { filter: entry => entry.name === manifestEntry });
const embeddedUpdate = JSON.parse(Buffer.from(embeddedFiles[manifestEntry] || []).toString('utf8') || '{}');
if (!embeddedUpdate.id || !Number.isFinite(embeddedUpdate.commitTime) || embeddedUpdate.commitTime < compilationStartedAt || embeddedUpdate.commitTime > Date.now() + 1000) fail('Embedded update manifest is stale. The APK could reuse old cached JavaScript; do not publish it.');
if (!bundle) {
  const proof = execute(path.join(toolsDir, win ? 'apksigner.bat' : 'apksigner'), ['verify', '--verbose', '--print-certs', artifact], { env });
  if (!proof.toLowerCase().includes(expectedCertificate)) fail('Built APK signature does not match the installed app.');
  const manifest = execute(path.join(toolsDir, win ? 'aapt.exe' : 'aapt'), ['dump', 'badging', artifact], { env });
  if (!manifest.includes(`name='${now.config.package}'`) || !manifest.includes(`versionCode='${now.config.versionCode}'`) || !manifest.includes(`versionName='${now.config.version}'`)) fail('Built APK package/version does not match the source configuration.');
} else {
  const proof = execute(path.join(java, 'bin', win ? 'jarsigner.exe' : 'jarsigner'), ['-J-Duser.language=en', '-verify', artifact], { env });
  if (!proof.includes('jar verified.')) fail('AAB signature verification failed.');
  const cert = execute(path.join(java, 'bin', win ? 'keytool.exe' : 'keytool'), ['-J-Duser.language=en', '-printcert', '-jarfile', artifact], { env });
  if (!cert.replace(/:/g, '').toLowerCase().includes(expectedCertificate)) fail('Built AAB certificate does not match the release key.');
}
const version = require('../package.json').version;
const name = `FitCoach-${version}-vc${now.config.versionCode}${emulator ? '-emulator' : ''}.${extension}`;
const output = path.join(builds, name);
fs.copyFileSync(artifact, output);
const sha256 = crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex');
fs.writeFileSync(output + '.sha256', `${sha256}  ${name}\n`);
fs.writeFileSync(output + '.json', JSON.stringify({ file: name, sha256, certificate, bytes: fs.statSync(output).size, builtLocally: true, createdAt: new Date().toISOString(), embeddedUpdateId: embeddedUpdate.id, embeddedUpdateCreatedAt: new Date(embeddedUpdate.commitTime).toISOString(), nativeProfile: now }, null, 2));
if (!emulator && !bundle) profile.writeBaseline(name);
console.log(`Verified local release: ${output}\nSHA256 ${sha256}`);
