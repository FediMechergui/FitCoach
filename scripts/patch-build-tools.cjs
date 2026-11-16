// Expo SDK 52's compiled CLI reads require('tar').default.extract. Patched tar 7
// retains extract/x, but no longer supplies the CommonJS default export. Restore
// that interface without reverting tar's security fixes or changing extraction.
const fs = require('node:fs');
const path = require('node:path');
const entry = require.resolve('tar');
const root = path.resolve(__dirname, '..', 'node_modules') + path.sep;
if (!entry.startsWith(root)) throw new Error('Refusing to patch a tar installation outside this project.');
const marker = '// FitCoach: Expo 52 tar default-export compatibility';
const source = fs.readFileSync(entry, 'utf8');
if (!source.includes(marker)) fs.appendFileSync(entry, `\n${marker}\nif (!exports.default) Object.defineProperty(exports, 'default', { value: exports });\n`);
const tar = require('tar');
if (typeof tar.extract !== 'function' || tar.default !== tar) throw new Error('tar compatibility check failed');
console.log('Verified patched tar compatibility for Expo 52.');
