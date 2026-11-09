// The dune's motion through the camera move (D90), as measured from the footage (assets/generated/2026-11-05_hero-dune,
// track_dune.py): a grid of nodes over the frame (padded beyond its edges), each node's displacement from its
// frame-0 place sampled every `step` frames. A point of the layer, placed on frame 0, is carried to frame f by
// Catmull-Rom interpolation between the grid's nodes (bicubic in space) and between its samples (in time), so it moves
// with the sand it sits on, smoothly, at any frame between samples.
export type Warp = {
  frames: number; step: number; w: number; h: number; gx: number; gy: number; pad: number;
  // per sample: node displacements [dx, dy] x 10, in px of the 1920-wide frame, row by row
  d: number[][];
};
export type P = [number, number];

const cr = (p0: number, p1: number, p2: number, p3: number, u: number) =>
  0.5 * (2 * p1 + (p2 - p0) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (3 * p1 - p0 - 3 * p2 + p3) * u * u * u);

// The displacement of a point (frame-0 px) at frame f
export function displace(W: Warp, f: number, x: number, y: number): P {
  const ns = W.d.length;
  const k = Math.min(Math.max(f / W.step, 0), ns - 1);
  const s1 = Math.min(Math.floor(k), ns - 2), u = k - s1;
  const s = [Math.max(s1 - 1, 0), s1, s1 + 1, Math.min(s1 + 2, ns - 1)];
  const x0 = -W.pad * W.w, y0 = -W.pad * W.h;
  const dx = (W.w * (1 + 2 * W.pad)) / (W.gx - 1), dy = (W.h * (1 + 2 * W.pad)) / (W.gy - 1);
  const gu = Math.min(Math.max((x - x0) / dx, 0), W.gx - 1.0001), gv = Math.min(Math.max((y - y0) / dy, 0), W.gy - 1.0001);
  const i1 = Math.floor(gu), j1 = Math.floor(gv), a = gu - i1, b = gv - j1;
  const ci = (i: number) => Math.min(Math.max(i, 0), W.gx - 1), cj = (j: number) => Math.min(Math.max(j, 0), W.gy - 1);
  const out: P = [0, 0];
  for (let c = 0; c < 2; c++) {
    const at = (si: number) => {
      const row = (j: number) => {
        const r = cj(j) * W.gx, d = W.d[si];
        return cr(d[2 * (r + ci(i1 - 1)) + c], d[2 * (r + ci(i1)) + c], d[2 * (r + ci(i1 + 1)) + c], d[2 * (r + ci(i1 + 2)) + c], a);
      };
      return cr(row(j1 - 1), row(j1), row(j1 + 1), row(j1 + 2), b);
    };
    out[c] = cr(at(s[0]), at(s[1]), at(s[2]), at(s[3]), u) / 10;
  }
  return out;
}

// A warp for one frame: frame-0 px -> frame-f px (both in the 1920-wide frame)
export function at(W: Warp | null, f: number) {
  if (!W || f <= 0) return (p: P): P => p;
  return (p: P): P => {
    const d = displace(W, f, p[0], p[1]);
    return [p[0] + d[0], p[1] + d[1]];
  };
}
