#!/usr/bin/env node
/**
 * Publish an over-the-air release:
 *   1. reads the current display version from src/data/changelog.ts
 *   2. publishes the JS bundle to the EAS `preview` channel with patch-note text
 *      → installed apps download it on next launch (Profile shows "Up to date")
 *   3. creates and pushes a git tag so the release is marked in history
 *
 * Usage:
 *   npm run release                 # message defaults to the changelog title
 *   npm run release "hotfix: …"     # custom update message
 *
 * Requires: eas-cli installed & logged in (`eas login`), and a clean-ish git tree.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}
function capture(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
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

console.log(`\n✓ Released v${version}. Installed apps will update on next launch.`);
