#!/usr/bin/env node
// v4 artwork is source artwork, not generated from primitive shapes.
const fs = require('fs');
const path = require('path');
for (const name of ['icon.png','adaptive-icon.png','splash.png','favicon.png']) {
  const file = path.join(__dirname,'..','assets',name);
  const bytes = fs.readFileSync(file);
  if (bytes.readUInt32BE(0) !== 0x89504e47) throw new Error(`Invalid PNG: ${name}`);
  console.log(`${name}: ${bytes.readUInt32BE(16)} x ${bytes.readUInt32BE(20)}`);
}
console.log('Approved v4 icon assets verified. Use the source artwork for future exports.');
