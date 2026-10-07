#!/usr/bin/env node
/**
 * Publish an over-the-air release:
 *   1. reads the current display version from src/data/changelog.ts
 *   2. publishes the JS bundle to the EAS `preview` channel with patch-note text
 *      → installed apps download it on next launch (Profile shows "Up to date")
 *   3. creates and pushes a git tag so the release is marked in history
 *   4. publishes a GitHub Release for that tag with the CHANGELOG.md notes
 *      → the repo's Releases tab shows a titled, "Latest"-badged release
 *
 * Every release is an OTA release, and it has to land. Before anything is
 * published it checks that the code is committed and pushed (the update IS that
 * commit), that it type-checks and passes the guard suite, and that its native
 * side is the one the installed APK has (scripts/native-profile.js) — an update
 * that needs native code the APK lacks would crash on the phone. After
 * publishing, it reads the update back from EAS and only tags and announces
 * the release once the update is live on the channel the app listens to.
 *
 * Usage:
 *   npm run release                 # message defaults to the changelog title
 *   npm run release "hotfix: …"     # custom update message
 *   npm run release -- --check      # run every check, publish nothing
 *
 * Requires: eas-cli installed & logged in (`eas login`), and a clean-ish git tree.
 * For the GitHub Release step, one of:
 *   - `gh` CLI installed & authenticated (`gh auth login`), OR
 *   - a GITHUB_TOKEN (or GH_TOKEN) env var with `repo` scope.
 * If neither is present, the OTA + tag still ship; only the GitHub Release is skipped.
 */
const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

/**
 * Make a string safe to sit inside a double-quoted shell argument.
 *
 * A release title containing a double quote used to abort the whole release:
 * the quote closed the argument early and eas saw the rest as stray arguments.
 * Escaping rules differ between /bin/sh and cmd.exe, so rather than trying to
 * escape correctly on both, the characters that can break out of the quoting
 * are swapped for typographic equivalents. A release message is prose — nothing
 * is lost by it carrying “curly quotes”, and it can never break the command.
 */
function shellSafe(s) {
  let open = true;
  return String(s)
    // Straight quotes alternate into a proper “…” pair so the title still reads
    // like English rather than sprouting two closing quotes.
    .replace(/"/g, () => (open = !open) ? '”' : '“')
    .replace(/`/g, "'") //     ` → ' (backtick would run a subshell)
    .replace(/\$/g, 'USD') //  $ → USD (would expand a variable)
    .replace(/\\/g, '/') //    \ → /  (escape character)
    .replace(/[\r\n]+/g, ' ')
    .trim();
}
function capture(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}
function tryCapture(cmd) {
  try {
    return capture(cmd);
  } catch {
    return null;
  }
}

// ── Read the current version + title from the changelog ──────────────────────
const changelogPath = path.join(__dirname, '..', 'src', 'data', 'changelog.ts');
const src = fs.readFileSync(changelogPath, 'utf8');
const version = (src.match(/version:\s*'([^']+)'/) || [])[1];
const title = (src.match(/title:\s*'([^']+)'/) || [])[1] || 'Update';
if (!version) {
  console.error('Could not read version from src/data/changelog.ts');
  process.exit(1);
}

// ── Pull the notes for this version out of CHANGELOG.md (the human mirror) ────
function notesForVersion(v) {
  const mdPath = path.join(__dirname, '..', 'CHANGELOG.md');
  if (!fs.existsSync(mdPath)) return '';
  const md = fs.readFileSync(mdPath, 'utf8');
  // Match "## v2.1 …" up to the next "## " heading (or EOF).
  const re = new RegExp(`(?:^|\\n)##\\s+v${v.replace(/\./g, '\\.')}\\b[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s|$)`);
  const body = (md.match(re) || [])[1];
  return body ? body.trim() : '';
}

const checkOnly = process.argv.includes('--check');
const message = process.argv.slice(2).filter((a) => a !== '--check').join(' ').trim() || title;
const branch = 'preview';

console.log(`\nReleasing FitCoach v${version} to channel "${branch}"`);
console.log(`Patch note: ${message}`);

// ── 0. Preflight: nothing is published that cannot land ──────────────────────
let expectedRuntime = null;
function stop(why) {
  console.error(`\n✗ Release stopped, nothing was published: ${why}\n`);
  process.exit(1);
}
function quiet(cmd) {
  try {
    execSync(cmd, { encoding: 'utf8', stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 });
    return null;
  } catch (e) {
    return String((e.stdout || '') + (e.stderr || '')).trim().split('\n').slice(-25).join('\n');
  }
}
{
  const dirty = capture('git status --porcelain --untracked-files=no');
  if (dirty) stop(`uncommitted changes — the update must be exactly a commit:\n${dirty}`);
  tryCapture('git fetch -q origin');
  const ahead = tryCapture('git rev-list --count @{u}..HEAD');
  if (ahead === null) stop('this branch has no upstream to compare with; push it first.');
  if (Number(ahead) > 0) stop(`${ahead} commit(s) not pushed — push before releasing.`);
  console.log('\n✓ Committed and pushed');

  const tsc = quiet('npx tsc --noEmit');
  if (tsc !== null) stop(`the type check failed:\n${tsc}`);
  console.log('✓ Type check');
  const suite = quiet('npx tsx scripts/verify-engines.ts');
  if (suite !== null) stop(`the guard suite failed:\n${suite}`);
  console.log('✓ Guard suite');

  const np = require('./native-profile');
  const base = np.readBaseline();
  if (!base) stop('no native baseline (scripts/native-baseline.json). Build the APK with npm run build:apk:local first.');
  const diff = np.differences(base, np.currentProfile());
  if (diff.length) {
    stop(
      `the native side changed since ${base.apk ?? 'the installed APK'}, so an update would not run on it:\n  ` +
        diff.join('\n  ') +
        '\nBuild a new APK (npm run build:apk:local — it records the new baseline), install it on the phone, then release.'
    );
  }
  console.log(`✓ Same native side as ${base.apk ?? 'the installed APK'}`);
  expectedRuntime = base.config.runtimeVersion?.policy === 'appVersion' ? base.config.version : String(base.config.runtimeVersion);
}
if (checkOnly) {
  console.log(`\n✓ v${version} would land as an OTA update on runtime ${expectedRuntime}. Nothing was published (--check).`);
  process.exit(0);
}

// ── 1. Publish the OTA update ────────────────────────────────────────────────
run(`eas update --branch ${branch} --message "v${version}: ${shellSafe(message)}"`);

// ── 1b. Read it back: tag and announce only an update that is live ───────────
{
  let latest = null;
  try {
    const list = JSON.parse(capture(`eas update:list --branch ${branch} --json --non-interactive --limit 1`));
    latest = (list.currentPage || [])[0] || null;
  } catch (e) {
    console.error('\n✗ Could not read the update back from EAS:', e.message);
  }
  const ok =
    latest &&
    String(latest.message || '').includes(`v${version}:`) &&
    latest.runtimeVersion === expectedRuntime &&
    /android/.test(String(latest.platforms || ''));
  if (!ok) {
    console.error(
      `\n✗ The newest update on "${branch}" is not v${version} for Android on runtime ${expectedRuntime}:\n  ` +
        JSON.stringify(latest) +
        '\nNo tag and no GitHub Release were made. Check https://expo.dev and run the release again.'
    );
    process.exit(1);
  }
  console.log(`\n✓ Live: v${version} is the newest update on "${branch}" for runtime ${expectedRuntime} (group ${latest.group}).`);
}

// ── 2. Tag the release in git (unique even if the version repeats) ────────────
let tag = `v${version}`;
try {
  const existing = capture('git tag --list').split('\n');
  if (existing.includes(tag)) {
    const sha = capture('git rev-parse --short HEAD');
    tag = `v${version}+${sha}`;
  }
  run(`git tag -a ${tag} -m "${shellSafe(message)}"`);
  run(`git push origin ${tag}`);
  console.log(`\n✓ Tagged ${tag} and pushed.`);
} catch (e) {
  console.warn('\n⚠ Update published, but tagging failed:', e.message);
}

// ── 3. Publish a GitHub Release for the tag ──────────────────────────────────
// So the repo's Releases tab shows a proper titled release, not just a bare tag.
const releaseTitle = `v${version} — ${title}`;
const releaseBody = notesForVersion(version) || message;

// Resolve owner/repo from the origin remote (git@… or https://…).
const remote = tryCapture('git remote get-url origin') || '';
const slug = (remote.match(/[:/]([^/]+\/[^/]+?)(?:\.git)?$/) || [])[1];

function publishViaGh() {
  if (!tryCapture('gh --version')) return false;
  // Write the body to a temp file to avoid shell-escaping issues.
  const tmp = path.join(require('os').tmpdir(), `fitcoach-release-${tag}.md`);
  fs.writeFileSync(tmp, releaseBody, 'utf8');
  try {
    run(`gh release create ${tag} --title "${shellSafe(releaseTitle)}" --notes-file "${tmp}" --latest`);
    return true;
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

function publishViaApi() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token || !slug) return Promise.resolve(false);
  const [owner, repo] = slug.split('/');
  const payload = JSON.stringify({
    tag_name: tag,
    name: releaseTitle,
    body: releaseBody,
    make_latest: 'true',
  });
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.github.com',
        path: `/repos/${owner}/${repo}/releases`,
        method: 'POST',
        headers: {
          'User-Agent': 'fitcoach-release',
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          if (res.statusCode === 201) {
            const url = (() => {
              try {
                return JSON.parse(data).html_url;
              } catch {
                return '';
              }
            })();
            console.log(`\n✓ GitHub Release published: ${url}`);
            resolve(true);
          } else {
            console.warn(`\n⚠ GitHub API returned ${res.statusCode}: ${data.slice(0, 300)}`);
            resolve(false);
          }
        });
      }
    );
    req.on('error', (e) => {
      console.warn('\n⚠ GitHub API request failed:', e.message);
      resolve(false);
    });
    req.write(payload);
    req.end();
  });
}

(async () => {
  let published = false;
  try {
    published = publishViaGh();
  } catch (e) {
    console.warn('\n⚠ `gh release create` failed:', e.message);
  }
  if (!published) published = await publishViaApi();
  if (!published) {
    console.warn(
      `\n⚠ Skipped GitHub Release (no gh CLI and no GITHUB_TOKEN). ` +
        `The tag "${tag}" is pushed — publish it manually at:\n` +
        (slug ? `  https://github.com/${slug}/releases/new?tag=${tag}` : '  <repo>/releases/new')
    );
  }
  console.log(`\n✓ Released v${version}. Installed apps will update on next launch.`);
})();
