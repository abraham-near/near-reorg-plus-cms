import { add, CAM_POS, clamp, project, px, rad, rotX, rotY, seg2, smooth, xf, type Attrs, type P2, type V3 } from "../geo";

// The layer moments (D86, design B "Glass tokens"): the rail's two moments before the four stations, the problem
// ("Whoever runs the layer beneath your agents sees what they see and keeps what they earn.") and the answer ("On NEAR,
// that layer is user-owned."), drawn from Lawrence's sketch in real-time 3D like the stations. No three.js here: this
// file also draws the vectors on the server.
//
// The scene, in the plate's own frame (y up from the plate's top face, the plate leaned toward the camera so it reads
// three-quarter from above):
// - a thin brushed-aluminium plate with a finely ticked rim;
// - six clear glass data tokens with thin polished chrome rims, a simple glyph etched into each top (dot, square,
//   triangle, diamond, ring, small rectangle), on a dotted track;
// - at the centre a thick frosted glass core.
//
// Progress `own` (0 the problem, 1 the answer; the rail's timeline sets it, StoryRailMotion):
// - 0: the core is small and neutral (no green, no N), the tokens crisp on the track, and transactions run between them:
//   pairs of fine lines from the core to each token, arrowheads at their ends, small dots and squares travelling out
//   and in along them (only the markers travel; no light runs along a line).
// - towards 1: the tokens draw in; the core grows out over them, wider and thicker, and its frost turns NEAR green as it
//   grows; a low polished chrome bezel rises round its foot; three people (D95; it was the official N), a polished
//   metal inlay, arrive in its top face. The tokens inside are blurred by the frost itself (three's transmission), "hidden". The plate stays.
// - 1: the transactions carry on quietly, as four short ticks round the people inside the green disc.
//
// At rest, on the time (as the stations, D76–D82): a pair of graduated sectors outside the plate turn once every 90 s;
// a ring and a square ride the dotted track (84 s, 120 s the other way); the horizon's ticks breathe (8 s); the
// transactions keep moving. Arriving, the plate turns into place with the stations' spring (D73).

export const LAYER = {
  tilt: rad(21), // the plate leaned toward the camera: about 33° from above with the camera's 12°
  y: -0.12, // the plate's centre, a little below the drawing's centre so the core has room above it
  plate: { R: 1.78, depth: 0.05 },
  track: 1.24,
  token: { r: 0.19, h: 0.066, at: [100, 160, 220, 280, 340, 40] as const }, // degrees; 90 is the back
  tokenIn: 0.81, // where the tokens draw in to
  core: { r0: 0.4, r1: 1.11, h0: 0.15, h1: 0.22 },
  // the graduated sectors outside the plate, in its foot's plane; D101: `out` further out while the drawing arrives
  dial: { r: 1.98, span: 110, period: 90, out: 0.7 },
  ride: { ring: 84, square: 120 }, // the markers on the track (seconds a lap)
  enter: { yaw: rad(48), still: 0.05, full: 0.45 }, // the arrival turn
  breath: 8,
};

const TAU = Math.PI * 2;
const smoother = (u: number) => { const x = clamp(u); return x * x * x * (x * (6 * x - 15) + 10); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// The change, as a function of the chased progress: each part on its own stretch, so the tokens draw in first, the core
// passes over them (between about 0.4 and 0.58), and the green, the collar and the people arrive as it settles
export function shapeOf(own: number) {
  const tok = smoother(own / 0.6);
  const grow = smoother((own - 0.12) / 0.62);
  return {
    rT: lerp(LAYER.track, LAYER.tokenIn, tok),
    R: lerp(LAYER.core.r0, LAYER.core.r1, grow),
    h: lerp(LAYER.core.h0, LAYER.core.h1, grow),
    green: smoother((own - 0.2) / 0.62),
    collar: smoother((own - 0.62) / 0.3), // a low bezel, a third of the core's height
    mark: smoother((own - 0.58) / 0.37),
    inner: smoother((own - 0.75) / 0.25),
  };
}
export type Shape = ReturnType<typeof shapeOf>;

// ── The pose: the chased progress, the arrival turn, the time
export type Spring = { y: number; v: number; t: number };
// The stations' turn spring (D73): ω 6.5 settling, ω 20 leaving, exact below 0.1°, straight to the target after a gap
function chaseTurn(st: Spring, target: number, time: number) {
  const dt = time - st.t;
  st.t = time;
  if (!(dt > 0) || dt > 0.25) { st.y = target; st.v = 0; return st.y; }
  const w = Math.abs(target) > Math.abs(st.y) ? 20 : 6.5;
  const d = st.y - target, e = Math.exp(-w * dt), k = (st.v + w * d) * dt;
  st.v = (st.v - w * k) * e;
  st.y = target + (d + k) * e;
  if (Math.abs(target) < 0.1 && Math.abs(st.y) < 0.1 && Math.abs(st.v) < 0.5) { st.y = 0; st.v = 0; }
  return st.y;
}
// The change follows the scrub on a softer critically damped spring (ω 5 both ways: it eases off after the rail stops),
// exact at either end
function chaseOwn(st: Spring, target: number, time: number) {
  const dt = time - st.t;
  st.t = time;
  if (!(dt > 0) || dt > 0.25) { st.y = target; st.v = 0; return st.y; }
  const w = 5, d = st.y - target, e = Math.exp(-w * dt), k = (st.v + w * d) * dt;
  st.v = (st.v - w * k) * e;
  st.y = target + (d + k) * e;
  if (Math.abs(st.y - target) < 1e-3 && Math.abs(st.v) < 1e-2) { st.y = target; st.v = 0; }
  return clamp(st.y);
}

export type LayerPose = { own: number; yaw: number; t: number };
export function layerPose(slide: number, t: number, own = 1, springs?: { turn: Spring; own: Spring }): LayerPose {
  const { yaw, still, full } = LAYER.enter;
  const target = (Math.sign(slide) * yaw * 180 / Math.PI) * smoother((Math.abs(slide) - still) / (full - still)); // degrees
  const turn = springs ? chaseTurn(springs.turn, target, t) : target;
  return { own: springs ? chaseOwn(springs.own, clamp(own), t) : clamp(own), yaw: rad(turn), t };
}

// plate frame → world
const POS: V3 = [0, LAYER.y, 0];
export const toWorld = (v: V3, yaw: number): V3 => add(POS, rotX(rotY(v, yaw), LAYER.tilt));
// a point on the plate's plane (at height y) at radius r and angle a (degrees; 90 is the back)
export const polar = (r: number, deg: number, y = 0): V3 => [r * Math.cos(rad(deg)), y, -r * Math.sin(rad(deg))];
// the camera in the plate's frame
const eyeOf = (yaw: number): V3 => rotY(rotX([CAM_POS[0] - POS[0], CAM_POS[1] - POS[1], CAM_POS[2] - POS[2]], -LAYER.tilt), -yaw);

// ── Occlusion, exactly: the segment from the camera to a point against each upright cylinder (the core, the tokens,
// the plate) in the plate's frame. Lines are drawn over the render, so anything behind a solid is left out.
type Cyl = { c: readonly [number, number]; r: number; y0: number; y1: number };
function hits(E: V3, P: V3, k: Cyl) {
  const D: V3 = [P[0] - E[0], P[1] - E[1], P[2] - E[2]];
  const ox = E[0] - k.c[0], oz = E[2] - k.c[1];
  const a = D[0] * D[0] + D[2] * D[2], b = 2 * (ox * D[0] + oz * D[2]), c = ox * ox + oz * oz - k.r * k.r;
  const T = 1 - 2e-4;
  if (a > 1e-12) {
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const s = Math.sqrt(disc);
      for (const t of [(-b - s) / (2 * a), (-b + s) / (2 * a)]) {
        if (t > 1e-6 && t < T) { const y = E[1] + D[1] * t; if (y >= k.y0 && y <= k.y1) return true; }
      }
    }
  }
  for (const yc of [k.y1, k.y0]) {
    if (Math.abs(D[1]) < 1e-12) continue;
    const t = (yc - E[1]) / D[1];
    if (t > 1e-6 && t < T) { const x = E[0] + D[0] * t - k.c[0], z = E[2] + D[2] * t - k.c[1]; if (x * x + z * z <= k.r * k.r) return true; }
  }
  return false;
}

// where each token is, for the progress
export const tokenAt = (i: number, rT: number): V3 => polar(rT, LAYER.token.at[i]);

export function layerVectors({ own, yaw, t }: LayerPose): Record<string, Attrs> {
  const S = shapeOf(own), E = eyeOf(yaw);
  const { r: tr, h: th } = LAYER.token, P = LAYER.plate;
  const solids: Cyl[] = [
    { c: [0, 0], r: S.R + 0.004, y0: 0, y1: S.h },
    ...LAYER.token.at.map((_, i) => { const p = tokenAt(i, S.rT); return { c: [p[0], p[2]] as const, r: tr + 0.008, y0: 0, y1: th + 0.004 }; }),
    { c: [0, 0], r: P.R, y0: -P.depth, y1: 0 },
  ];
  const seen = (p: V3) => !solids.some((k) => hits(E, p, k));
  const W = (p: V3) => toWorld(p, yaw);
  const at = (p: V3) => px(W(p));
  const on = (p: V3) => seen(p);
  const out: Record<string, Attrs> = {};
  const LIFT = 0.002;

  // the dotted track, broken where a token sits on it or the core covers it
  out.track = { d: path((u) => polar(LAYER.track, u * 360, LIFT), 360, W, seen) };

  // the plate's finely ticked rim (it rides the arrival turn): every 3°, longer every 15°, a cross at the four quarters
  let ticks = "";
  for (let d = 0; d < 360; d += 3) {
    const long = d % 15 === 0;
    ticks += seg2(at(polar(P.R - 0.1, d, LIFT)), at(polar(P.R - (long ? 0.035 : 0.062), d, LIFT)));
  }
  out.rimTicks = { d: ticks };
  [0, 90, 180, 270].forEach((d, i) => { out[`cross${i}`] = { transform: xf(at(polar(P.R - 0.2, d, LIFT))) }; });

  // two graduated sectors outside the plate, opposite each other, turning once every 90 s (carried rigidly)
  // D101 (Lawrence: "Have the graphic arcs on the outside of the base disc be farther away from the base when it
  // animates on and they settle to their current position when it lands in the middle of the frame"): their radius
  // follows the arrival turn (its spring), out by `out` while the drawing is still turning in, home as it lands
  const D = LAYER.dial, c0 = 200 + (360 * t) / D.period;
  const away = clamp(Math.abs(yaw) / LAYER.enter.yaw), dr = D.r + D.out * away * away * (3 - 2 * away);
  let dArc = "", dTicks = "";
  // (in the plane of the plate's foot, so on screen they pass clear below its front edge, and left out wherever the
  // plate covers them at the back)
  const foot = -P.depth;
  for (const base of [c0, c0 + 180]) {
    dArc += path((u) => polar(dr, base - D.span / 2 + u * D.span, foot), 60, W, seen);
    const n = D.span / 2.5;
    for (let i = 0; i <= n; i++) {
      const deg = base - D.span / 2 + i * 2.5, r1 = dr + (i === 0 || i === n ? 0.13 : i % 6 === 0 ? 0.075 : 0.04);
      const p0 = polar(dr, deg, foot), p1 = polar(r1, deg, foot);
      if (seen(p0) && seen(p1)) dTicks += seg2(at(p0), at(p1));
    }
  }
  out.dialArc = { d: dArc };
  out.dialTicks = { d: dTicks };

  // the markers riding the track: a ring one way, a square the other, hidden under a token or the core
  const ride = (key: string, deg: number) => {
    const p = polar(LAYER.track, deg, LIFT), show = on(p);
    out[key] = { transform: xf(at(p)), opacity: show ? "1" : "0" };
  };
  ride("tm0", 130 + (360 * t) / LAYER.ride.ring);
  ride("tm1", 310 - (360 * t) / LAYER.ride.square);

  // ── The transactions: from the core's edge to each token, a pair of fine lines (out on one, in on the other), each
  // strongest at its two ends, an arrowhead where it arrives, and a marker travelling along it. They fade as the core
  // reaches the tokens.
  LAYER.token.at.forEach((deg, i) => {
    const a = rad(deg), u: V3 = [Math.cos(a), 0, -Math.sin(a)], v: V3 = [Math.sin(a), 0, Math.cos(a)];
    const r0 = S.R + 0.07, r1 = S.rT - tr - 0.07, len = r1 - r0;
    const k = clamp((len - 0.06) / 0.16);
    [0.034, -0.034].forEach((off, j) => {
      const key = `${i}${j}`;
      const A = add(add([0, LIFT, 0], u, r0), v, off), B = add(add([0, LIFT, 0], u, r1), v, off);
      // out (j 0) runs core → token, in (j 1) token → core
      const from = j === 0 ? A : B, to = j === 0 ? B : A;
      if (k <= 0) {
        out[`ln${key}`] = { d: "" }; out[`ah${key}`] = { opacity: "0" }; out[`lm${key}`] = { opacity: "0" };
        out[`lg${key}`] = { x1: "0", y1: "0", x2: "1", y2: "0" };
        return;
      }
      const seg = (s: number): V3 => add(from, [to[0] - from[0], to[1] - from[1], to[2] - from[2]], s);
      const q0 = at(from), q1 = at(to);
      out[`ln${key}`] = { d: path(seg, 16, W, seen), opacity: k.toFixed(3) };
      out[`lg${key}`] = { x1: q0[0].toFixed(2), y1: q0[1].toFixed(2), x2: q1[0].toFixed(2), y2: q1[1].toFixed(2) };
      const tip = seg(1), back = seg(0.9);
      out[`ah${key}`] = { transform: xf(at(tip), angleOf(at(back), at(tip))), opacity: (on(tip) ? k : 0).toFixed(3) };
      // the marker: each lane on its own beat, so the traffic never pulses in step
      const period = 3.4 + ((i * 7 + j * 3) % 5) * 0.45, phase = (i * 0.37 + j * 0.5) % 1;
      const s = (((t / period + phase) % 1) + 1) % 1, pos = 0.06 + s * 0.78, mp = seg(pos);
      const fade = smooth(s / 0.14) * smooth((1 - s) / 0.14);
      out[`lm${key}`] = { transform: xf(at(mp)), opacity: (on(mp) ? k * fade : 0).toFixed(3) };
    });
  });

  // Inside the green disc, once it is the user's, the transactions carry on quietly: four short ticks round the people
  // (as in B2), and on two of them a fine dot drifting slowly in and out
  const ki = S.inner, y = S.h + 0.004;
  [0, 90, 180, 270].forEach((deg, i) => {
    const A = polar(0.6, deg, y), B = polar(0.7, deg, y); // D97: out from 0.42–0.53, clear of the larger people
    out[`il${i}`] = { d: ki > 0 ? seg2(at(A), at(B)) : "", opacity: (ki * 0.85).toFixed(3) };
    if (i > 1) return;
    const period = 7.5 + i * 1.7, s = (((t / period + i * 0.5) % 1) + 1) % 1;
    const dir = i === 0 ? s : 1 - s;
    const mp: V3 = [lerp(A[0], B[0], dir), y, lerp(A[2], B[2], dir)];
    out[`im${i}`] = { transform: xf(at(mp)), opacity: (ki * 0.8 * smooth(s / 0.25) * smooth((1 - s) / 0.25)).toFixed(3) };
  });

  out.eclip = { d: layerEcliptic(t) };
  return out;
}

const angleOf = (a: P2, b: P2) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;

// A curve given in the plate's frame, projected, and broken wherever `keep` (in the plate's frame) says no
function path(fn: (u: number) => V3, n: number, W: (p: V3) => V3, keep: (p: V3) => boolean) {
  let d = "", up = false;
  for (let i = 0; i <= n; i++) {
    const p = fn(i / n);
    if (keep(p)) { const q = px(W(p)); d += `${up ? "L" : "M"}${q[0].toFixed(2)} ${q[1].toFixed(2)}`; up = true; } else up = false;
  }
  return d;
}

// The horizon through the plate's centre, ticked, its ticks lengthening and shortening in place in a slow wave. Drawn
// under the render, so the plate covers it where it passes behind.
export const HORIZON = Math.round(project(toWorld([0, 0, 0], 0)).p[1] * 10) / 10;
export function layerEcliptic(t = 0) {
  const y = HORIZON.toFixed(2);
  let d = `M8 ${y}H412`;
  for (let x = 8, i = 0; x <= 412; x += 6, i++) {
    const k = 0.75 + 0.35 * Math.sin(TAU * (t / LAYER.breath - x / 150));
    d += `M${x} ${y}v${((i % 5 === 0 ? -4.5 : -2) * k).toFixed(2)}`;
  }
  return d;
}
