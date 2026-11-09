import { add, CAM_POS, clamp, curve, dot, FOCAL, project, px, rad, rotX, rotY, seg2, smooth, xf, type Attrs, type P2, type V3 } from "../geo";

// The identity station, the gimbal (D80, D81): same identity, new keys. One orthogonal mechanism, held square to the
// view and leaned back a little so its rings read as ellipses: a thin frosted glass frame with a chrome micro-bevel
// and fine graduations cut into its face; inside it a chrome ring on the frame's horizontal pins; inside that a
// second chrome ring on the first ring's vertical pins. At the exact centre, on that vertical axle, the green ball
// (the account), the same ball as the assets station's. The inner ring turns once about the ball from where it was (a
// hairline ghost, square to the frame), and the dial on the frame's rim, on the same axis, reads that one turn; the
// ball is exactly as it was. No three.js here: this file also draws the vectors on the server.
//
// The groups, outermost first (each one axis, so the maths below matches three's nesting exactly):
//   frame: leaned back about x by `lean`, its glass in its xy plane, the middle ring's pins along its ±x
//   middle ring: turned about the frame's x by `a` (12° at rest, a plane of its own); the axle and the ball ride it
//   (a uniform ball turning about its own centre looks exactly the same, so it never visibly moves)
//   inner ring: turned about the middle ring's y by `b`, its pins along ±y
//
// The motion:
// - Arrival (the story: one rotation, the account unchanged): while the station slides in, the inner ring sits at the
//   ghost's angle; it makes its one 46° turn as the station reaches the centre (between |slide| 0.45 and 0.05, while
//   the rail fades it in) and settles with the data disc's critically damped spring (D73: ω 6.5 settling, ω 20
//   leaving, snap below 0.1°). The dial's pointer and its arc grow with the turn; the ghost stays put. Leaving, the
//   ring turns back toward the ghost.
// - At rest, on the time: the middle ring sways ±3° about its 12° rest on its horizontal pins (12 s), carrying the
//   inner ring and the ghost with it, and the dial's ticks breathe in place (8 s). The ball never moves.
// - The vector layer, always running, each on its own slow period so the whole never visibly repeats (as the data,
//   assets and intelligence stations, D76–D78): a graduated arc outside the frame's foot sways ±40° (52 s); a ring
//   rides the ghost's circle (70 s a lap) and a cross a faint drawn orbit round the frame the other way (92 s), each
//   with its radial tick, hidden wherever chrome, glass or the ball covers it; three dashed arcs in the frame's opening,
//   between the middle ring and the glass, draw on and off
//   in turn (9 s); the ecliptic's ticks lengthen and shorten in place in a slow wave (8 s). Lines only grow, retract or
//   are carried rigidly; only the markers travel.

export const GIMBAL = {
  lean: rad(24),
  frame: { rIn: 1.06, rOut: 1.2, depth: 0.08, bevel: 0.009 },
  outer: { r: 0.92, w: 0.035, depth: 0.046 }, // centre-line radius, radial width, depth
  inner: { r: 0.8, w: 0.044, depth: 0.048 },
  ball: 0.28, // the assets station's ball is 0.27
  pin: 0.011,
  b: rad(46), // the inner ring's turn about the vertical axis, at rest
  b0: 0, // where it was (the ghost): square to the frame
  dial: { lift: 0.06, r: 0.4 }, // the dial's hub above the rim, on the boss; its radius
  rest: rad(12), // the middle ring's rest angle on its pins: a flatter ellipse than the frame, a plane of its own
  sway: { amp: rad(3), period: 12 }, // the middle ring about its rest
  turn: { still: 0.05, full: 0.45 }, // the turn runs between these |slide|
  // the always-running vector layer
  foot: { r: 1.3, span: 100, swing: 40, period: 52 }, // the graduated arc at the frame's foot (degrees, seconds)
  marks: { ghost: { period: 70, at: 215 }, wide: { r: 1.62, period: 92, at: 330 } },
  dashes: { r: 0.995, len: 56, cycle: 9, at: [100, 204, 284] }, // in the frame's plane, clear of the pins and the axis
  breath: 8,
};

// The turn, as the data disc's (D73): a target from the slide (smootherstep between |slide| 0.45 and 0.05), chased by
// a critically damped spring on the turn still to go, in degrees: ω 6.5 settling toward rest, ω 20 leaving it,
// exactly at rest below 0.1°, and straight to the target after a gap (the drawing was off screen). Each drawing keeps
// its own spring state.
export type Spring = { y: number; v: number; t: number };
const smoother = (u: number) => { const x = clamp(u); return x * x * x * (x * (6 * x - 15) + 10); };
function chase(st: Spring, target: number, time: number) {
  const dt = time - st.t;
  st.t = time;
  if (!(dt > 0) || dt > 0.25) { st.y = target; st.v = 0; return st.y; }
  const w = target > st.y ? 20 : 6.5;
  const d = st.y - target, e = Math.exp(-w * dt), k = (st.v + w * d) * dt;
  st.v = (st.v - w * k) * e;
  st.y = target + (d + k) * e;
  if (target < 0.1 && Math.abs(st.y) < 0.1 && Math.abs(st.v) < 0.5) { st.y = 0; st.v = 0; }
  return st.y;
}

export type GimbalPose = { a: number; b: number; t: number };
const TURN = ((GIMBAL.b - GIMBAL.b0) * 180) / Math.PI;
export function gimbalPose(slide: number, t: number, spring?: Spring): GimbalPose {
  const { still, full } = GIMBAL.turn;
  const target = TURN * smoother((Math.abs(slide) - still) / (full - still)); // the turn still to go
  const left = spring ? chase(spring, target, t) : target;
  return { a: GIMBAL.rest + GIMBAL.sway.amp * Math.sin((2 * Math.PI * t) / GIMBAL.sway.period), b: GIMBAL.b - rad(left), t };
}

// frame → world, middle ring → world, inner ring → world
const G = GIMBAL;
export const frameW = (v: V3): V3 => rotX(v, G.lean);
export const outerW = (v: V3, a: number): V3 => frameW(rotX(v, a));
export const innerW = (v: V3, a: number, b: number): V3 => outerW(rotY(v, b), a);

// ── Occlusion, exactly: a ray from the camera to a point is blocked by an annulus (each face of the frame and of
// either ring) before it reaches the point. So every line is drawn over the render and still passes behind what is in
// front of it, and nothing crosses a glass or metal face from behind. `anywhere` asks whether the point is covered on
// screen at all, in front or behind.
type Ann = { o: V3; n: V3; r0: number; r1: number };
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
function blocks(c: Ann, p: V3, anywhere = false) {
  const d = sub(p, CAM_POS), dn = dot(d, c.n);
  if (Math.abs(dn) < 1e-9) return false;
  const t = dot(sub(c.o, CAM_POS), c.n) / dn;
  if (t <= 0 || (!anywhere && t >= 0.9985)) return false;
  const h = add(CAM_POS, d, t), r = Math.hypot(...sub(h, c.o));
  return r > c.r0 && r < c.r1;
}
// both faces of a flat ring with normal n, widened by m
const faces = (n: V3, depth: number, r0: number, r1: number, m: number): Ann[] =>
  [1, -1].map((s) => ({ o: add([0, 0, 0], n, (s * depth) / 2), n, r0: r0 - m, r1: r1 + m }));
function occluders(a: number, b: number) {
  const { frame: F, outer: O, inner: I } = G;
  return {
    frame: faces(frameW([0, 0, 1]), F.depth, F.rIn, F.rOut, 0.01),
    chrome: [
      ...faces(outerW([0, 0, 1], a), O.depth, O.r - O.w / 2, O.r + O.w / 2, 0.008),
      ...faces(innerW([0, 0, 1], a, b), I.depth, I.r - I.w / 2, I.r + I.w / 2, 0.008),
    ],
  };
}

// The ball: the ray from the camera to p against it; and on screen, where no line ever goes, in front or behind
function ballBlocks(p: V3) {
  const d = sub(p, CAM_POS), L = Math.hypot(...d), u: V3 = [d[0] / L, d[1] / L, d[2] / L];
  const b = dot(CAM_POS, u), c = dot(CAM_POS, CAM_POS) - G.ball * G.ball, disc = b * b - c;
  return disc >= 0 && -b - Math.sqrt(disc) < L - 1e-4;
}
const BALL = (() => { const q = project([0, 0, 0]); return { c: q.p, r: (G.ball * FOCAL) / q.z + 2.5 }; })();
const offBall = (q: P2) => Math.hypot(q[0] - BALL.c[0], q[1] - BALL.c[1]) > BALL.r;

// Where the upper axle starts, along the middle ring's y, for its turn `a`: the middle ring leans the axle's top toward
// the camera, so an axle from the ball's pole would cross the green face. It starts instead exactly where it leaves
// the ball's outline on screen (plus its own radius), so nothing ever shows inside the ball. The lower axle meets the
// pole, which is behind the ball, and comes out from behind its outline on its own.
export function axleStart(a: number) {
  const c = BALL.c, r = BALL.r - 2.5 + 0.4; // the outline, and a hair
  let lo = G.ball, hi = G.ball * 4;
  for (let i = 0; i < 24; i++) {
    const m = (lo + hi) / 2, q = px(outerW([0, m, 0], a));
    if (Math.hypot(q[0] - c[0], q[1] - c[1]) < r) lo = m; else hi = m;
  }
  return hi + G.pin * 0.9; // and the axle's end face, seen at an angle
}

export const CENTRE = px([0, 0, 0]);
// the ticked ecliptic runs through the frame's horizontal pins: the middle ring's pivot axis, exactly level
export const HORIZON = Math.round(CENTRE[1] * 10) / 10;
// where it passes behind the frame (left out, like every far line): the frame's outline at the horizon
export const GAP = (() => {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < 720; i++) {
    const t = (i / 720) * Math.PI * 2;
    for (const z of [G.frame.depth / 2, -G.frame.depth / 2]) {
      const q = px(frameW([G.frame.rOut * Math.cos(t), G.frame.rOut * Math.sin(t), z]));
      lo = Math.min(lo, q[0]); hi = Math.max(hi, q[0]);
    }
  }
  return [lo - 2, hi + 2] as const;
})();

export function gimbalVectors({ a, b, t }: GimbalPose): Record<string, Attrs> {
  const occ = occluders(a, b);
  const all = [...occ.frame, ...occ.chrome];
  const seen = (p: V3, q: { p: P2 }) => offBall(q.p) && !ballBlocks(p) && !all.some((c) => blocks(c, p));
  // off the glass altogether (in front of it too), for the axis and the dial
  const offFrame = (p: V3, q: { p: P2 }) => seen(p, q) && !occ.frame.some((c) => blocks(c, p, true));
  // the ghost shares the ring's pivots and lies a hair from the chrome there: it stays off the chrome on screen
  const offChrome = (p: V3, q: { p: P2 }) => seen(p, q) && !occ.chrome.some((c) => blocks(c, p, true));
  const vis = (p: V3) => offFrame(p, project(p));
  const TAU = Math.PI * 2, F = G.frame;

  // the ghost: the inner ring where it was, a hairline round its centre line (it rides the middle ring's sway)
  const ghost = curve((u) => innerW([G.inner.r * Math.cos(u * TAU), G.inner.r * Math.sin(u * TAU), 0], a, G.b0), 320, offChrome);

  // the inner ring's axis, dashed, through its pins: in the frame's opening above and below the middle ring, then on
  // past the frame below to a square (above, the dial's boss stands on the rim)
  const y0 = G.outer.r + G.outer.w / 2 + 0.03, yB = F.rOut + 0.22;
  // (every point of the frame's and the ring's vertical planes is on the same vertical line on screen, so the axis runs
  // straight from the ring's pins to the frame's rim and on below it)
  const seg3 = (p0: V3, p1: V3, n: number) => curve((u) => add(p0, sub(p1, p0), u), n, offFrame);
  const axI = seg3(outerW([0, y0, 0], a), frameW([0, F.rIn - 0.02, 0]), 40)
    + seg3(outerW([0, -y0, 0], a), frameW([0, -yB, 0]), 90);

  // the dial, on the frame's rim where the inner ring's axis meets it: a graduated arc behind the rim, square to the
  // frame's vertical. Two pointers read which way the ring faces (its normal, in the frame): where it faced (dotted) and
  // where it faces now; the arc between them is the turn so far. The scale's ticks breathe in place
  const { lift, r: rd } = G.dial, Yh = F.rOut + lift;
  const D = (th: number, r: number): V3 => frameW([-r * Math.sin(th), Yh, -r * Math.cos(th)]);
  const facing = (bb: number) => { const n = rotX(rotY([0, 0, 1], bb), a); return Math.atan2(n[0], n[2]); };
  const th0 = facing(G.b0), th1 = facing(b);
  const lo = G.b0 - rad(20), hi = G.b + rad(20);
  const dialArc = curve((u) => D(lo + u * (hi - lo), rd), 60, vis);
  let dTicks = "";
  for (let d = -20, i = 0; G.b0 + rad(d) <= hi + 1e-6; d += 5, i++) {
    const th = G.b0 + rad(d), k = 0.8 + 0.25 * Math.sin(TAU * (t / 8 - i / 19));
    const p0 = D(th, rd), p1 = D(th, rd + (d % 30 === 0 ? 0.07 : 0.04) * k);
    if (vis(p0) && vis(p1)) dTicks += seg2(px(p0), px(p1));
  }
  // the turn's arc and its dot fade in between 4° and 8° of the turn, so the two dots never run together as it starts
  const rm = rd * 0.7, grown = clamp((Math.abs(th1 - th0) - rad(4)) / rad(4));
  const turn = grown > 0 ? curve((u) => D(th0 + u * (th1 - th0), rm), 40, vis) : "";
  const Q = px(D(0, 0)), A = px(D(th0, rm)), B = px(D(th1, rm));
  const was = seg2(Q, px(D(th0, rd + 0.09))), now = seg2(Q, px(D(th1, rd + 0.09)));

  // ── The always-running layer
  // the keep-out round the rim dial (its scale, ticks and pointers on screen, with a margin): nothing passes through it
  let kx0 = Infinity, kx1 = -Infinity, ky0 = Infinity, ky1 = -Infinity;
  for (let d = -24; G.b0 + rad(d) <= hi + rad(4); d += 4) for (const r of [0, rd + 0.1]) {
    const q = px(D(G.b0 + rad(d), r));
    kx0 = Math.min(kx0, q[0]); kx1 = Math.max(kx1, q[0]); ky0 = Math.min(ky0, q[1]); ky1 = Math.max(ky1, q[1]);
  }
  const offDial = (q: P2) => q[0] < kx0 - 6 || q[0] > kx1 + 6 || q[1] < ky0 - 6 || q[1] > ky1 + 8;

  // the graduated arc at the frame's foot, in the frame's plane: fine ticks every 3°, longer every 15°, index ticks at
  // its ends, carried rigidly to and fro about the bottom
  const FT = G.foot, fc = 270 + FT.swing * Math.sin((TAU * t) / FT.period);
  const ring = (deg: number, r: number) => frameW([r * Math.cos(rad(deg)), r * Math.sin(rad(deg)), 0]);
  const footArc = curve((u) => ring(fc - FT.span / 2 + u * FT.span, FT.r), 70, (p, q) => offFrame(p, q) && offDial(q.p));
  let footTicks = "";
  for (let i = 0; i <= FT.span / 2.5; i++) {
    const deg = fc - FT.span / 2 + i * 2.5, n = FT.span / 2.5;
    const r1 = FT.r * (i === 0 || i === n ? 1.07 : i % 6 === 0 ? 1.045 : 1.024);
    const p0 = ring(deg, FT.r), p1 = ring(deg, r1);
    if (vis(p0) && vis(p1)) footTicks += seg2(px(p0), px(p1));
  }

  // the markers, each with its short radial tick: a ring on the ghost's circle (it rides the middle ring's sway), a
  // cross on a wide circle round the frame, the other way round. Hidden wherever chrome, glass or the ball covers them
  const M = G.marks, marks: Record<string, Attrs> = {};
  const place = (key: string, at: (s: number) => V3, ok: (p: V3, q: { p: P2 }) => boolean) => {
    const p = at(1), q = project(p), show = ok(p, q) && offDial(q.p);
    const t0 = project(at(0.955)), t1 = project(at(0.9));
    marks[`mk${key}`] = { transform: xf(q.p), opacity: show ? "1" : "0" };
    marks[`mt${key}`] = { d: show && ok(at(0.9), t1) ? seg2(t0.p, t1.p) : "" };
  };
  const g0 = M.ghost.at + (360 * t) / M.ghost.period;
  place("0", (sc) => innerW([G.inner.r * sc * Math.cos(rad(g0)), G.inner.r * sc * Math.sin(rad(g0)), 0], a, G.b0), offChrome);
  const w0 = M.wide.at - (360 * t) / M.wide.period;
  place("1", (sc) => ring(w0, M.wide.r * sc), offFrame);
  // the cross's orbit, a faint hairline (the assets station's construction circle), parted round the dial
  const wide = curve((u) => ring(u * 360, M.wide.r), 240, (p, q) => offFrame(p, q) && offDial(q.p));

  // three dashed arcs in the frame's opening, between the middle ring and the glass, drawing on and off in turn (each
  // grows from its start
  // and retracts to it, never travelling)
  const DS = G.dashes, dashes: Record<string, Attrs> = {};
  const drawn = (tt: number) => {
    const u = ((tt % DS.cycle) + DS.cycle) % DS.cycle;
    return u < 1.6 ? smooth(u / 1.6) : u < 4.2 ? 1 : u < 5.8 ? 1 - smooth((u - 4.2) / 1.6) : 0;
  };
  DS.at.forEach((deg, i) => {
    const u = drawn(t - i * (DS.cycle / 3)), a0 = rad(deg), len = rad(DS.len) * u;
    dashes[`dash${i}`] = { d: u > 0.002 ? curve((v) => frameW([DS.r * Math.cos(a0 + v * len), DS.r * Math.sin(a0 + v * len), 0]), Math.max(2, Math.round(30 * u)), offFrame) : "" };
  });

  // the middle ring's pivot axis is the ecliptic itself: its ticks lengthen and shorten in place in a slow wave
  return {
    ecliptic: { d: gimbalEcliptic(t) },
    footArc: { d: footArc },
    footTicks: { d: footTicks },
    ...marks,
    ...dashes,
    wide: { d: wide },
    ghost: { d: ghost },
    axisI: { d: axI },
    dialArc: { d: dialArc },
    dialTicks: { d: dTicks },
    was: { d: was },
    now: { d: now },
    turn: { d: turn, opacity: grown.toFixed(3) },
    turnGrad: { x1: A[0].toFixed(2), y1: A[1].toFixed(2), x2: (grown > 0 ? B[0] : A[0] + 1).toFixed(2), y2: B[1].toFixed(2) },
    from: { transform: xf(A) },
    to: { transform: xf(B), opacity: grown.toFixed(3) },
    hub: { transform: xf(Q) },
    endI: { transform: xf(px(frameW([0, -(yB + 0.05), 0]))) },
  };
}

// the ticked ecliptic through the pins, gapped where it passes behind the frame
export function gimbalEcliptic(t = 0) {
  const y = HORIZON.toFixed(2);
  let d = `M8 ${y}H${GAP[0].toFixed(2)}M${GAP[1].toFixed(2)} ${y}H412`;
  for (let x = 8, i = 0; x <= 412; x += 6, i++) {
    if (x >= GAP[0] && x <= GAP[1]) continue;
    const k = 0.75 + 0.35 * Math.sin(2 * Math.PI * (t / G.breath - x / 150));
    d += `M${x} ${y}v${((i % 5 === 0 ? -4.5 : -2) * k).toFixed(2)}`;
  }
  return d;
}
