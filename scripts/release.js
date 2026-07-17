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
 * Usage:
 *   npm run release                 # message defaults to the changelog title
 *   npm run release "hotfix: …"     # custom update message
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

const message = process.argv.slice(2).join(' ').trim() || title;
const branch = 'preview';

console.log(`\nReleasing FitCoach v${version} to channel "${branch}"`);
console.log(`Patch note: ${message}`);

// ── 1. Publish the OTA update ────────────────────────────────────────────────
run(`eas update --branch ${branch} --message "v${version}: ${message}"`);

// ── 2. Tag the release in git (unique even if the version repeats) ────────────
let tag = `v${version}`;
try {
  const existing = capture('git tag --list').split('\n');
  if (existing.includes(tag)) {
    const sha = capture('git rev-parse --short HEAD');
    tag = `v${version}+${sha}`;
  }
  run(`git tag -a ${tag} -m "${message}"`);
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
    run(`gh release create ${tag} --title "${releaseTitle.replace(/"/g, '\\"')}" --notes-file "${tmp}" --latest`);
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
