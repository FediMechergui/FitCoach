/**
 * Reading a barcode from a photograph, on the phone.
 *
 * No model, no network, no native scanner: the picture is walked along a few
 * dozen lines, each line is turned into runs of dark and light, and the runs
 * are matched against the EAN alphabet. An EAN-13 is 59 runs in a fixed
 * order — guard, six digits, centre, six digits, guard — and a digit is four
 * runs that add up to seven modules, so there is very little a line of random
 * texture can do to look like one. The check digit then has to agree, and the
 * same number has to be read on more than one line before it is believed.
 *
 * Handles EAN-13, UPC-A (an EAN-13 that begins with 0) and EAN-8; a barcode
 * that is upside down, or turned on its side.
 *
 * Pure. The JPEG is decoded elsewhere (services/barcodePhoto.ts).
 */

/** Widths of the four runs of each digit, in modules, as an L code: space, bar, space, bar. */
const L_CODES: number[][] = [
  [3, 2, 1, 1],
  [2, 2, 2, 1],
  [2, 1, 2, 2],
  [1, 4, 1, 1],
  [1, 1, 3, 2],
  [1, 2, 3, 1],
  [1, 1, 1, 4],
  [1, 3, 1, 2],
  [1, 2, 1, 3],
  [3, 1, 1, 2],
];
/** A G code is the L code read backwards. */
const G_CODES: number[][] = L_CODES.map((w) => [...w].reverse());

/** Which of the six left digits are G codes says what the thirteenth (leading) digit is. */
const PARITY: string[] = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

/** How far, in modules, four measured runs may sit from a digit's pattern and still be that digit. */
const MAX_DIGIT_ERROR = 1.9;

function checksumOk(code: string): boolean {
  const d = code.split('').map(Number);
  const check = d.pop() as number;
  let sum = 0;
  for (let i = d.length - 1, w = 3; i >= 0; i--, w = w === 3 ? 1 : 3) sum += d[i] * w;
  return (10 - (sum % 10)) % 10 === check;
}

/** Four runs against a table: the digit they are nearest to, and how near. */
function matchDigit(runs: number[], at: number, table: number[][]): { digit: number; error: number } {
  const total = runs[at] + runs[at + 1] + runs[at + 2] + runs[at + 3];
  if (!(total > 0)) return { digit: -1, error: Infinity };
  const unit = total / 7;
  let best = -1;
  let bestErr = Infinity;
  for (let d = 0; d < 10; d++) {
    let err = 0;
    for (let k = 0; k < 4; k++) err += Math.abs(runs[at + k] / unit - table[d][k]);
    if (err < bestErr) {
      bestErr = err;
      best = d;
    }
  }
  return { digit: best, error: bestErr };
}

const near = (a: number, b: number, slack: number) => Math.abs(a - b) <= slack * Math.max(a, b);

/**
 * Try to read a barcode whose start guard is the three runs at `at` (a bar, a
 * space, a bar). `runs[at]` must be a dark run.
 */
function readAt(runs: number[], at: number, digitsPerSide: 4 | 6): string | null {
  const need = 3 + digitsPerSide * 4 + 5 + digitsPerSide * 4 + 3;
  if (at + need > runs.length) return null;

  // The guard: three runs of one module each.
  const g0 = runs[at];
  const g1 = runs[at + 1];
  const g2 = runs[at + 2];
  if (!near(g0, g1, 0.6) || !near(g1, g2, 0.6) || !near(g0, g2, 0.6)) return null;
  const module = (g0 + g1 + g2) / 3;

  // A digit is seven modules wide: the whole symbol must be about the size the guard promises.
  let span = 0;
  for (let i = 0; i < need; i++) span += runs[at + i];
  const modules = 3 + digitsPerSide * 7 + 5 + digitsPerSide * 7 + 3;
  if (!near(span, module * modules, 0.25)) return null;

  let p = at + 3;
  const left: number[] = [];
  let parity = '';
  for (let i = 0; i < digitsPerSide; i++, p += 4) {
    const l = matchDigit(runs, p, L_CODES);
    const g = digitsPerSide === 6 ? matchDigit(runs, p, G_CODES) : { digit: -1, error: Infinity };
    const useG = g.error < l.error;
    const m = useG ? g : l;
    if (m.error > MAX_DIGIT_ERROR) return null;
    left.push(m.digit);
    parity += useG ? 'G' : 'L';
  }

  // The centre: five runs of one module each.
  for (let i = 0; i < 5; i++) if (!near(runs[p + i], module, 0.75)) return null;
  p += 5;

  const right: number[] = [];
  for (let i = 0; i < digitsPerSide; i++, p += 4) {
    // An R code has the widths of the L code, with the colours swapped.
    const m = matchDigit(runs, p, L_CODES);
    if (m.error > MAX_DIGIT_ERROR) return null;
    right.push(m.digit);
  }

  // The end guard.
  if (!near(runs[p], module, 0.75) || !near(runs[p + 1], module, 0.75) || !near(runs[p + 2], module, 0.75)) return null;

  let code: string;
  if (digitsPerSide === 6) {
    const first = PARITY.indexOf(parity);
    if (first < 0) return null;
    code = `${first}${left.join('')}${right.join('')}`;
  } else {
    code = `${left.join('')}${right.join('')}`;
  }
  return checksumOk(code) ? code : null;
}

/**
 * A line of brightness (0 dark … 255 light) into runs, the first run dark.
 * The threshold follows the line: a barcode in shadow at one end and in light
 * at the other still splits cleanly.
 */
export function runsOf(line: ArrayLike<number>): { runs: number[]; firstDark: boolean } {
  const n = line.length;
  if (n < 30) return { runs: [], firstDark: false };
  const win = Math.max(16, Math.floor(n / 6));
  // Running mean by prefix sums.
  const pre = new Float64Array(n + 1);
  let lo = 255;
  let hi = 0;
  for (let i = 0; i < n; i++) {
    const v = line[i];
    pre[i + 1] = pre[i] + v;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (hi - lo < 40) return { runs: [], firstDark: false }; // a flat line has nothing to read
  const mid = (lo + hi) / 2;

  const runs: number[] = [];
  let dark = false;
  let firstDark = false;
  let len = 0;
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - win);
    const b = Math.min(n, i + win + 1);
    const local = (pre[b] - pre[a]) / (b - a);
    // Between the line's own middle and the neighbourhood's: steady under uneven light,
    // and not fooled by a long white margin.
    const threshold = (local + mid) / 2;
    const isDark = line[i] < threshold;
    if (i === 0) {
      dark = isDark;
      firstDark = isDark;
      len = 1;
    } else if (isDark === dark) {
      len++;
    } else {
      runs.push(len);
      dark = isDark;
      len = 1;
    }
  }
  runs.push(len);
  return { runs, firstDark };
}

/** Every barcode that can be read along one line, in either direction. */
export function readLine(line: ArrayLike<number>): string[] {
  const out: string[] = [];
  const { runs, firstDark } = runsOf(line);
  if (runs.length < 43) return out;

  const scan = (rs: number[], startsDark: boolean) => {
    // Dark runs sit at even indices when the line starts dark, odd otherwise.
    for (let i = startsDark ? 0 : 1; i < rs.length; i += 2) {
      // A quiet margin before the guard: light, and wider than the bars it precedes.
      if (i > 0 && rs[i - 1] < rs[i] * 2.5) continue;
      const c = readAt(rs, i, 6) ?? readAt(rs, i, 4);
      if (c) out.push(c);
    }
  };
  scan(runs, firstDark);
  const back = [...runs].reverse();
  const lastDark = runs.length % 2 === 1 ? firstDark : !firstDark;
  scan(back, lastDark);
  return out;
}

export interface DecodeResult {
  code: string;
  /** how many lines agreed on it */
  votes: number;
}

/** Lines walked in each direction. More would cost time and find nothing new. */
export const LINES_PER_AXIS = 36;
/** A number is believed when this many lines read it. */
export const VOTES_NEEDED = 2;

/**
 * Read a barcode from an RGBA image. Walks rows, then columns (a barcode
 * turned on its side), each line averaged over three neighbours so a speck
 * of noise does not break a bar. Returns the number most lines agree on.
 */
export function decodeBarcode(data: ArrayLike<number>, width: number, height: number): DecodeResult | null {
  if (!(width > 40 && height > 40) || data.length < width * height * 4) return null;
  const votes = new Map<string, number>();
  const lum = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    return (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
  };

  const walk = (along: number, across: number, at: (a: number, c: number) => number) => {
    const line = new Float32Array(along);
    for (let k = 1; k <= LINES_PER_AXIS; k++) {
      const c = Math.floor((across * k) / (LINES_PER_AXIS + 1));
      const c0 = Math.max(0, c - 1);
      const c1 = Math.min(across - 1, c + 1);
      for (let a = 0; a < along; a++) line[a] = (at(a, c0) + at(a, c) + at(a, c1)) / 3;
      const seen = new Set(readLine(line));
      for (const code of seen) votes.set(code, (votes.get(code) ?? 0) + 1);
    }
  };

  walk(width, height, (x, y) => lum(x, y));
  // Only walk the columns when the rows did not already settle it.
  const settled = [...votes.values()].some((v) => v >= VOTES_NEEDED + 1);
  if (!settled) walk(height, width, (y, x) => lum(x, y));

  let best: DecodeResult | null = null;
  for (const [code, v] of votes) if (!best || v > best.votes) best = { code, votes: v };
  return best && best.votes >= VOTES_NEEDED ? best : null;
}

// ── For the engine suite, and for anyone who wants to see one ────────────────

/** The 95 modules of an EAN-13 (or 67 of an EAN-8): true is a bar. */
export function ean13Modules(code: string): boolean[] {
  const d = code.split('').map(Number);
  const out: boolean[] = [];
  const put = (widths: number[], startsDark: boolean) => {
    let dark = startsDark;
    for (const w of widths) {
      for (let i = 0; i < w; i++) out.push(dark);
      dark = !dark;
    }
  };
  if (d.length === 13) {
    const parity = PARITY[d[0]];
    put([1, 1, 1], true);
    for (let i = 0; i < 6; i++) put(parity[i] === 'G' ? G_CODES[d[1 + i]] : L_CODES[d[1 + i]], false);
    put([1, 1, 1, 1, 1], false);
    for (let i = 0; i < 6; i++) put(L_CODES[d[7 + i]], true);
    put([1, 1, 1], true);
  } else {
    put([1, 1, 1], true);
    for (let i = 0; i < 4; i++) put(L_CODES[d[i]], false);
    put([1, 1, 1, 1, 1], false);
    for (let i = 0; i < 4; i++) put(L_CODES[d[4 + i]], true);
    put([1, 1, 1], true);
  }
  return out;
}

/** Bytes from base64, without relying on a global the runtime may not have. */
export function bytesFromBase64(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const rev = new Int16Array(128).fill(-1);
  for (let i = 0; i < table.length; i++) rev[table.charCodeAt(i)] = i;
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let o = 0;
  let acc = 0;
  let bits = 0;
  for (let i = 0; i < clean.length; i++) {
    acc = (acc << 6) | rev[clean.charCodeAt(i)];
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = (acc >> bits) & 0xff;
    }
  }
  return out.subarray(0, o);
}
