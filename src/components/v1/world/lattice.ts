// The dots of the globe (r13/lib/lattice.js). Pure: no DOM, no three.
// The lattice is rows of latitude with evenly spaced dots: the dots squeeze into fine concentric rings toward the limb by foreshortening, for free.
// Every dot carries its place on the unit sphere, how much land is under it (0 = sea .. 1 = land) and two hashes.
export const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/** land-rle.json: rows of alternating runs of sea / land, starting with sea */
export type LandRLE = { w?: number; h?: number; rows: number[][] };
/** a W x H mask (1 = land) */
export type LandMask = Float32Array & { W: number; H: number };

/* land-rle.json -> a 1440 x 720 mask (1 = land) */
export function decodeLand(j: LandRLE): LandMask {
  const W = j.w || 1440, H = j.h || 720, raw = new Float32Array(W * H);
  j.rows.forEach((runs, y) => { let x = 0, v = 0; for (const n of runs) { if (v) raw.fill(1, y * W + x, y * W + x + n); x += n; v ^= 1; } });
  return despike(raw, W, H);
}

/* the 110m mask has a few rows that are one long smear of "land" across the world (a polygon crossing the antimeridian): with fine dots it shows as a line.
   A row whose land is far above its neighbours is replaced by the nearest sane row. */
export function despike(raw: Float32Array, W: number, H: number): LandMask {
  const cnt = new Float32Array(H), bad = new Uint8Array(H);
  for (let y = 0; y < H; y++) { let t = 0; for (let x = 0; x < W; x++) t += raw[y * W + x]; cnt[y] = t; }
  for (let y = 2; y < H - 2; y++) {
    const nb: number[] = [];
    for (let d = -6; d <= 6; d++) if (d && y + d >= 0 && y + d < H) nb.push(cnt[y + d]);
    nb.sort((a, b) => a - b);
    if (cnt[y] > nb[nb.length >> 1] * 1.3 + 40) bad[y] = 1;
  }
  for (let y = 0; y < H; y++) {
    if (!bad[y]) continue;
    let up = y; while (up > 0 && bad[up]) up--;
    let dn = y; while (dn < H - 1 && bad[dn]) dn++;
    const src = !bad[up] && (bad[dn] || y - up <= dn - y) ? up : dn;
    raw.copyWithin(y * W, src * W, src * W + W);
  }
  const m = raw as LandMask;
  m.W = W; m.H = H;
  return m;
}

const hash = (i: number, k: number) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };

export type Lattice = {
  n: number;
  /** xyz on the unit sphere, y = north */
  pos: Float32Array;
  /** land, hash, hash, kind 0 */
  aG: Float32Array;
  /** angular pitch (radians) */
  step: number;
  /** number of latitude rows */
  rows: number;
  /** the row of every dot, 0 = the southern-most */
  row: Uint16Array;
  /** dots per row */
  rowN: Int32Array;
};

/* N = how many dots the sphere gets (about) */
export function buildLattice(N: number, raw: LandMask): Lattice {
  const W = raw.W || 1440, H = raw.H || 720;
  const cover = (lat: number, lon: number) => { const x = ((Math.floor(((lon + Math.PI) / TAU) * W) % W) + W) % W, y = Math.min(H - 1, Math.max(0, Math.floor(((Math.PI / 2 - lat) / Math.PI) * H))); return raw[y * W + x]; };
  const delta = Math.sqrt((4 * Math.PI) / N), rows = Math.round(Math.PI / delta), step = Math.PI / rows;
  const counts = new Int32Array(rows);
  let total = 0;
  for (let i = 0; i < rows; i++) { const lat = -Math.PI / 2 + ((i + 0.5) / rows) * Math.PI; counts[i] = Math.max(3, Math.round((TAU * Math.cos(lat)) / step)); total += counts[i]; }
  const pos = new Float32Array(3 * total), aG = new Float32Array(4 * total), row = new Uint16Array(total);
  let q = 0;
  for (let i = 0; i < rows; i++) {
    const lat = -Math.PI / 2 + ((i + 0.5) / rows) * Math.PI, n = counts[i], cl = Math.cos(lat), sl = Math.sin(lat);
    for (let j = 0; j < n; j++) {
      const lon = ((j + (i % 2) * 0.5) / n) * TAU - Math.PI;
      pos[3 * q] = Math.sin(lon) * cl; pos[3 * q + 1] = sl; pos[3 * q + 2] = Math.cos(lon) * cl;
      let s = 0;                                                    // land under the dot: a 3 x 3 sample, so coasts get a soft edge
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += cover(clamp(lat + dy * step * 0.4, -1.5707, 1.5707), lon + (dx * step * 0.4) / Math.max(0.2, cl));
      aG[4 * q] = smooth(0.3, 0.62, s / 9); aG[4 * q + 1] = hash(q, 1); aG[4 * q + 2] = hash(q, 2);
      row[q] = i;
      q++;
    }
  }
  return { n: total, pos, aG, step, rows, row, rowN: counts };
}

/* the rotation of the world: Rz(roll) * Rx(pitch) * Ry(yaw), row-major 3 x 3 (the same as the shader's uRot). yaw = the longitude that faces the viewer is -yaw. */
export function rotation(out: Float32Array, yaw: number, pitch: number, roll: number): Float32Array {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
  const a0 = cy, a1 = 0, a2 = sy, b0 = sp * sy, b1 = cp, b2 = -sp * cy;
  out[0] = cr * a0 - sr * b0; out[1] = cr * a1 - sr * b1; out[2] = cr * a2 - sr * b2;
  out[3] = sr * a0 + cr * b0; out[4] = sr * a1 + cr * b1; out[5] = sr * a2 + cr * b2;
  out[6] = -cp * sy; out[7] = sp; out[8] = cp * cy;
  return out;
}
