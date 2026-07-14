// Generates FitCoach's app icon, adaptive icon, splash and favicon as PNGs.
// A tiny raster engine (no native deps) draws a dumbbell on a blue→teal
// gradient rounded square. Re-run after tweaking colors: `node scripts/make-assets.js`.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ── PNG encoder ───────────────────────────────────────────────────────────────
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePng(img) {
  const { w, h, data } = img;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  const rowLen = w * 4 + 1;
  const raw = Buffer.alloc(rowLen * h);
  for (let y = 0; y < h; y++) {
    raw[y * rowLen] = 0;
    data.copy(raw, y * rowLen + 1, y * w * 4, (y + 1) * w * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ── Raster engine ─────────────────────────────────────────────────────────────
function canvas(w, h) {
  return { w, h, data: Buffer.alloc(w * h * 4) };
}
function px(img, x, y, [r, g, b, a = 255]) {
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return;
  const i = (y * img.w + x) * 4;
  const ia = a / 255;
  const bg = img.data;
  bg[i] = Math.round(r * ia + bg[i] * (1 - ia));
  bg[i + 1] = Math.round(g * ia + bg[i + 1] * (1 - ia));
  bg[i + 2] = Math.round(b * ia + bg[i + 2] * (1 - ia));
  bg[i + 3] = Math.max(bg[i + 3], Math.round(a));
}
const lerp = (a, b, t) => a + (b - a) * t;
function mix(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t), 255];
}
function roundedGradient(img, x0, y0, x1, y1, radius, cA, cB) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      // rounded-corner mask
      let inside = true;
      const corners = [
        [x0 + radius, y0 + radius], [x1 - radius, y0 + radius],
        [x0 + radius, y1 - radius], [x1 - radius, y1 - radius],
      ];
      if (x < x0 + radius && y < y0 + radius) inside = dist(x, y, corners[0]) <= radius;
      else if (x >= x1 - radius && y < y0 + radius) inside = dist(x, y, corners[1]) <= radius;
      else if (x < x0 + radius && y >= y1 - radius) inside = dist(x, y, corners[2]) <= radius;
      else if (x >= x1 - radius && y >= y1 - radius) inside = dist(x, y, corners[3]) <= radius;
      if (!inside) continue;
      const t = (x - x0 + (y - y0)) / ((x1 - x0) + (y1 - y0)); // diagonal gradient
      px(img, x, y, mix(cA, cB, Math.max(0, Math.min(1, t))));
    }
  }
}
function dist(x, y, [cx, cy]) {
  return Math.hypot(x - cx, y - cy);
}
function fillCircle(img, cx, cy, r, color) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++)
    for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= r) px(img, x, y, color);
      else if (d <= r + 1.2) px(img, x, y, [color[0], color[1], color[2], (color[3] ?? 255) * (1 - (d - r) / 1.2)]);
    }
}
function fillRoundRect(img, x0, y0, x1, y1, r, color) {
  if (x1 < x0) [x0, x1] = [x1, x0];
  if (y1 < y0) [y0, y1] = [y1, y0];
  x0 = Math.round(x0); x1 = Math.round(x1); y0 = Math.round(y0); y1 = Math.round(y1);
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      const nx = Math.max(x0 + r, Math.min(x, x1 - r));
      const ny = Math.max(y0 + r, Math.min(y, y1 - r));
      if (Math.hypot(x - nx, y - ny) <= r) px(img, x, y, color);
    }
}

// ── Dumbbell mark ─────────────────────────────────────────────────────────────
function drawDumbbell(img, cx, cy, scale, color) {
  const hw = 150 * scale;
  const hh = 26 * scale;
  // handle bar
  fillRoundRect(img, cx - hw, cy - hh, cx + hw, cy + hh, hh, color);
  // a pair of plates on each end (outer big, inner small)
  const plate = (dir) => {
    const x = cx + dir * hw; // inner edge of the plates
    // outer big plate
    fillRoundRect(img, x + dir * 8 * scale, cy - 92 * scale, x + dir * 44 * scale, cy + 92 * scale, 16 * scale, color);
    // inner small plate
    fillRoundRect(img, x - dir * 22 * scale, cy - 60 * scale, x + dir * 6 * scale, cy + 60 * scale, 14 * scale, color);
  };
  plate(-1);
  plate(1);
}

const BLUE = [79, 140, 255];
const TEAL = [51, 217, 166];
const NAVY = [11, 18, 32];
const WHITE = [255, 255, 255, 255];

function makeIcon(size, { bg = true, mark = 0.62 } = {}) {
  const img = canvas(size, size);
  if (bg) {
    const pad = Math.round(size * 0.06);
    roundedGradient(img, pad, pad, size - pad, size - pad, Math.round(size * 0.22), [...BLUE], [...TEAL]);
    // darken lower area for depth
  }
  fillCircle(img, size / 2, size / 2, size * 0.30, [255, 255, 255, 22]);
  drawDumbbell(img, size / 2, size / 2, (size / 1024) * mark * 1.6, WHITE);
  return img;
}

function makeSplash(w, h) {
  const img = canvas(w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = NAVY[0]; img.data[i + 1] = NAVY[1]; img.data[i + 2] = NAVY[2]; img.data[i + 3] = 255;
  }
  const cx = w / 2, cy = h / 2;
  fillCircle(img, cx, cy, w * 0.16, [...BLUE, 40]);
  drawDumbbell(img, cx, cy, (w / 1024) * 1.1, [...BLUE, 255]);
  return img;
}

const dir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'icon.png'), encodePng(makeIcon(1024)));
fs.writeFileSync(path.join(dir, 'adaptive-icon.png'), encodePng(makeIcon(1024, { bg: false, mark: 0.5 })));
fs.writeFileSync(path.join(dir, 'splash.png'), encodePng(makeSplash(1284, 2778)));
fs.writeFileSync(path.join(dir, 'favicon.png'), encodePng(makeIcon(96)));
console.log('Wrote FitCoach icon assets to', dir);
