import { add, angle, clamp, curve, dot, FOCAL, project, px, rad, rotX, rotY, rotZ, seg2, smooth, sphere, xf, type Attrs, type P2, type V3 } from "./geo";

// The two stations as numbers (D72): where everything is for a given slide and time (the pose), and the vector layer
// drawn from that pose by projecting the same points the WebGL scene renders. Shared by the server's rest state and
// the live frames. t = 0 is the rest pose (reduced motion, phones, no JS, and the fallback still).

const TAU = Math.PI * 2;

// ── Data: a frosted disc with a polished rim, flat to camera at the centre and turned up to 64° at the edges; a green
// ball swings left and right behind it on a 7.2 s loop. The disc's frame is tilted back by the camera's elevation so
// "flat" is exactly face-on.
export const DATA = {
  R: 1, thick: 0.05, ball: 0.25,
  swing: 1.52, period: 7.2, rest: -1.02, // the ball's reach either side, and where it rests (half behind the left edge)
  // the turn: flat within ±0.05 of the centre, fully turned (64°) from ±0.45 out, so it all happens where the rail
  // has faded the station in
  turn: rad(64), still: 0.05, full: 0.45,
  orbit: { r: 1.62, tilt: rad(15), roll: rad(-4), y: -0.02 },
};
export const DATA_TILT = -rad(12); // the disc frame's tilt (= -CAM.el): its +z axis points at the camera

export type DataPose = { yaw: number; ball: V3 };
export function dataPose(slide: number, t: number): DataPose {
  const u = smooth((Math.abs(slide) - DATA.still) / (DATA.full - DATA.still));
  const yaw = -Math.sign(slide) * DATA.turn * u;
  const ph = Math.asin(DATA.rest / DATA.swing);
  const x = DATA.swing * Math.sin(ph + (TAU * t) / DATA.period);
  // behind the disc; further back while it is turned, so its swept edge never meets the ball
  const z = -(0.5 + 0.85 * Math.abs(Math.sin(yaw)));
  return { yaw, ball: [x, 0, z] };
}

// The orbit's plane in the disc's frame: tilted toward the camera and rolled a little, like Orbit's ORB_D
const orbitPt = (a: number, s = 1): V3 => {
  const { r, tilt, roll, y } = DATA.orbit;
  return rotZ(rotX([r * s * Math.cos(a), y, r * s * Math.sin(a)], tilt), roll);
};
const dataW = (p: V3) => rotX(p, DATA_TILT); // disc frame → world

export function dataVectors({ yaw, ball }: DataPose): Record<string, Attrs> {
  const n: V3 = [Math.sin(yaw), 0, Math.cos(yaw)]; // the disc's face normal (toward the camera when flat)
  const front = (p: V3) => dot(p, n) > 0;
  const back = (p: V3) => !front(p);
  const shift = -yaw; // marks on the orbit ride round with the disc's turn
  const occ = [sphere(dataW(ball), DATA.ball)];
  const ring = (s: number, keep: (p: V3) => boolean) => curve((u) => dataW(orbitPt(u * TAU, s)), 220, (p) => keep(rotX(p, -DATA_TILT)), occ);
  const ticksOn = (a0: number, a1: number, step: number, keep: (p: V3) => boolean) => {
    let d = "";
    for (let a = a0, i = 0; a <= a1 + 1e-6; a += step, i++) {
      const t = rad(a) + shift, p = orbitPt(t);
      if (!keep(p)) continue;
      const q0 = px(dataW(p)), q1 = px(dataW(orbitPt(t, i % 5 === 0 ? 1.07 : 1.035)));
      d += seg2(q0, q1);
    }
    return d;
  };
  const at = (a: number, s = 1) => px(dataW(orbitPt(rad(a) + shift, s)));

  // the disc's own scale: fine ticks just outside its rim, lower left, turning with it
  const rimPt = (a: number, s: number): V3 => rotY([s * Math.cos(a), s * Math.sin(a), DATA.thick / 2], yaw);
  let rim = "";
  for (let a = 196, i = 0; a <= 256; a += 3, i++) rim += seg2(px(dataW(rimPt(rad(a), 1.045))), px(dataW(rimPt(rad(a), i % 5 === 0 ? 1.1 : 1.07))));
  const rimArc = curve((u) => dataW(rimPt(rad(150 + u * 46), 1.045)), 40);

  // the ball's track: a horizon through it, its scale on the left where the ball comes out from behind the glass
  const tk = (x: number): V3 => dataW([x, 0, ball[2] - 0.01]); // a hair behind the ball's centre, so the ball hides it
  const x0 = -2.02, edge = -Math.cos(yaw) * DATA.R - 0.06;
  let scale = "";
  for (let i = 0, x = x0; x <= edge - 0.02; x += 0.075, i++) {
    const q = px(tk(x));
    scale += `M${q[0].toFixed(2)} ${q[1].toFixed(2)}v${i % 5 === 0 ? -5 : -2.2}`;
  }
  const lead = at(38);
  return {
    // under the canvas (muted by the glass, hidden by the ball)
    orbitBack: { d: ring(1, back) },
    innerBack: { d: ring(0.72, back) },
    ticksBack: { d: ticksOn(198, 264, 3, back) },
    track: { d: curve((u) => tk(edge + u * (2.02 - edge)), 60, () => true, occ) },
    // over it
    orbitFront: { d: ring(1, front) },
    innerFront: { d: ring(0.72, front) },
    ticksFront: { d: ticksOn(100, 176, 2, front) },
    rim: { d: rim },
    rimArc: { d: rimArc },
    trackLeft: { d: curve((u) => tk(x0 + u * (edge - x0)), 40, () => true, occ) },
    trackScale: { d: scale },
    trackEnd: { transform: xf(px(tk(x0))) },
    p150: { transform: xf(at(150)) },
    p30: { transform: xf(at(30)) },
    p232: { transform: xf(at(232)) },
    p120: { transform: xf(at(120, 0.72)) },
    leadDot: { transform: xf(lead) },
    leader: { d: seg2(lead, LABEL_DATA_TO) },
  };
}
export const LABEL_DATA_TO: P2 = [356, 238];
export const LABEL_DATA: P2 = [388, 252];

// ── Assets: the angled frosted ring (a flat glass washer with polished edges, as in Orbit) and one green ball riding
// round it on a 14 s loop, with a short green trail on its own orbit (strongest at the ball, fading back over 75°,
// carried rigidly by the ball, so no light ever runs along a line). Around it a second, slower layer of atlas graphics,
// every piece in the ring's plane and projected each frame:
// - an outer graduated dial counter-rotating once a minute, with index ticks every 45°;
// - three markers (ring, cross, square) orbiting the construction circle the other way from the ball, each with a short
//   radial tick toward the washer;
// - three dashed arcs on an inner circle in the hole, drawing on and off in turn (their dashes stay put);
// - a reading at the ball: a radius from the ring's axis out to the ball, with fine ticks, strongest at its two ends.
// Far halves sit under the canvas (behind the frost and the ball), near halves over it; nothing is drawn across the ball.
export const ASSETS = {
  rOut: 1.6, rIn: 1.04, thick: 0.06, ball: 0.27,
  tilt: rad(11), y: -0.12, period: 14, rest: rad(152), trail: rad(75),
  dial: { r: 1.6 * 1.34, period: 60 }, marks: { r: 1.6 * 1.2, period: 38, at: [206, 328, 88] },
  arcs: { r: 0.8, len: rad(64), cycle: 9, at: [200, 320, 80] },
};
export const ASSETS_PATH = (ASSETS.rOut + ASSETS.rIn) / 2;
const BALL_Y = ASSETS.thick / 2 + ASSETS.ball; // resting on the glass
const assetsW = (p: V3): V3 => add(rotX(p, ASSETS.tilt), [0, ASSETS.y, 0]);

export type AssetsPose = { green: V3; phi: number; t: number };
export function assetsPose(_slide: number, t: number): AssetsPose {
  // anticlockwise seen from above: along the near side it runs left to right
  const phi = ASSETS.rest - (TAU * t) / ASSETS.period;
  return { green: [ASSETS_PATH * Math.cos(phi), BALL_Y, ASSETS_PATH * Math.sin(phi)], phi, t };
}

// An arc of the inner circle's draw: on (0–1.6 s), held, off back toward its start (4.2–5.8 s), then gone until its turn
function drawn(t: number) {
  const u = ((t % ASSETS.arcs.cycle) + ASSETS.arcs.cycle) % ASSETS.arcs.cycle;
  if (u < 1.6) return smooth(u / 1.6);
  if (u < 4.2) return 1;
  if (u < 5.8) return 1 - smooth((u - 4.2) / 1.6);
  return 0;
}

export function assetsVectors({ green, phi, t }: AssetsPose): Record<string, Attrs> {
  const occ = [sphere(assetsW(green), ASSETS.ball)];
  const B = occ[0];
  // never across the ball: anything inside its outline on screen (with a hair of margin) is left out
  const clear = (_p: V3, q: { p: P2 }) => Math.hypot(q.p[0] - B.c[0], q.p[1] - B.c[1]) > B.r + 2;
  const top = ASSETS.thick / 2;
  const pathY = top + 0.004;
  const at = (r: number, a: number, y = pathY): V3 => assetsW([r * Math.cos(a), y, r * Math.sin(a)]);
  const far = (a: number) => Math.sin(a) < 0; // the half of the ring's plane behind its centre
  const circ = (r: number, y: number, a0: number, a1: number, n = 160) => curve((u) => at(r, a0 + u * (a1 - a0), y), n, clear);
  const tick = (r0: number, r1: number, a: number, y = pathY) => {
    const p = project(at(r0, a, y)), q = project(at(r1, a, y));
    return clear(at(r0, a, y), p) && clear(at(r1, a, y), q) ? seg2(p.p, q.p) : "";
  };

  // fine ticks on the far side of the path, fixed: the ball rolls across them
  let ticks = "";
  for (let a = 200, i = 0; a <= 320; a += 3, i++) ticks += tick(ASSETS_PATH, ASSETS_PATH * (i % 5 === 0 ? 1.075 : 1.04), rad(a));

  // the trail, at the ball's centre height: from its tail (faded out) to where it tucks in behind the ball
  const trailPt = (u: number) => at(ASSETS_PATH, phi + ASSETS.trail * (1 - u), BALL_Y);
  const N = 90;
  let head: P2 = px(trailPt(0));
  for (let i = 0; i <= N; i++) {
    const p = trailPt(i / N), q = project(p);
    if (!clear(p, q)) break;
    head = q.p;
  }
  const tail = px(trailPt(0));

  // the outer dial, counter-rotating: two opposite graduated sectors of 120° (an arc with fine ticks every 3°, longer
  // every 15°, index ticks at their ends), so the turn reads without filling the frame
  const D = ASSETS.dial, spin = (TAU * t) / D.period;
  let dialBack = "", dialFront = "", ringBack = "", ringFront = "";
  for (const s0 of [spin, spin + Math.PI]) {
    for (let i = 0; i <= 40; i++) {
      const a = s0 + rad(i * 3), d = tick(D.r, D.r * (i === 0 || i === 40 ? 1.08 : i % 5 === 0 ? 1.045 : 1.022), a, 0);
      if (far(a)) dialBack += d; else dialFront += d;
    }
    // the sector's arc, split where it crosses from the far half to the near one
    const steps = 48;
    for (let i = 0; i < steps; i++) {
      const a = s0 + (rad(120) * i) / steps, b = s0 + (rad(120) * (i + 1)) / steps;
      const d = curve((u) => at(D.r, a + u * (b - a), 0), 1, clear);
      if (far((a + b) / 2)) ringBack += d; else ringFront += d;
    }
  }

  // the orbiting markers: each in front of or behind the ring as it goes round, with its radial tick
  const M = ASSETS.marks, mspin = (TAU * t) / M.period;
  const marks: Record<string, Attrs> = {};
  M.at.forEach((deg, i) => {
    const a = rad(deg) + mspin, p = at(M.r, a, 0), q = project(p);
    const show = clear(p, q), back = far(a);
    const d = tick(M.r * 0.955, M.r * 0.91, a, 0);
    marks[`mk${i}b`] = { transform: xf(q.p), opacity: show && back ? "1" : "0" };
    marks[`mk${i}f`] = { transform: xf(q.p), opacity: show && !back ? "1" : "0" };
    marks[`mt${i}b`] = { d: back ? d : "" };
    marks[`mt${i}f`] = { d: back ? "" : d };
  });

  // the inner dashed arcs, drawing on and off in turn (each grows from its start and retracts to it)
  const A = ASSETS.arcs, arcs: Record<string, Attrs> = {};
  A.at.forEach((deg, i) => {
    const u = drawn(t - i * (A.cycle / 3));
    const a0 = rad(deg);
    arcs[`arc${i}`] = { d: u > 0.002 ? circ(A.r, pathY, a0, a0 + A.len * u, Math.max(2, Math.round(40 * u))) : "" };
  });

  // the reading: a radius from the ring's axis to the ball, cut where it meets the ball's outline
  const c0 = at(0, 0), cq = project(c0);
  let end: P2 = cq.p, rticks = "";
  for (let i = 0; i <= 60; i++) {
    const p = at((ASSETS_PATH * i) / 60, phi), q = project(p);
    if (!clear(p, q)) break;
    end = q.p;
  }
  for (let r = 0.2; r < ASSETS_PATH - 0.3; r += 0.12) {
    const n: V3 = [-Math.sin(phi), 0, Math.cos(phi)], m = [r * Math.cos(phi), pathY, r * Math.sin(phi)] as const;
    const p0 = assetsW([m[0] - n[0] * 0.035, m[1], m[2] - n[2] * 0.035]), p1 = assetsW([m[0] + n[0] * 0.035, m[1], m[2] + n[2] * 0.035]);
    if (clear(p0, project(p0)) && clear(p1, project(p1))) rticks += seg2(px(p0), px(p1));
  }

  const C = 1.2;
  return {
    constructBack: { d: circ(ASSETS.rOut * C, 0, Math.PI, TAU, 120) },
    constructFront: { d: circ(ASSETS.rOut * C, 0, 0, Math.PI, 120) },
    pathBack: { d: circ(ASSETS_PATH, pathY, Math.PI, TAU) },
    pathFront: { d: circ(ASSETS_PATH, pathY, 0, Math.PI) },
    ticks: { d: ticks },
    trail: { d: curve(trailPt, N, clear) },
    trailGrad: { x1: tail[0].toFixed(2), y1: tail[1].toFixed(2), x2: head[0].toFixed(2), y2: head[1].toFixed(2) },
    dialRingBack: { d: ringBack },
    dialRingFront: { d: ringFront },
    dialBack: { d: dialBack },
    dialFront: { d: dialFront },
    ...marks,
    ...arcs,
    reading: { d: seg2(cq.p, end) },
    readingTicks: { d: rticks },
    readingGrad: { x1: cq.p[0].toFixed(2), y1: cq.p[1].toFixed(2), x2: end[0].toFixed(2), y2: end[1].toFixed(2) },
    readingFrom: { transform: xf(cq.p) },
    readingTo: { transform: xf(end) },
  };
}
export const assetsHorizon = () => Math.round(px(assetsW([0, 0, 0]))[1] * 10) / 10;

// ── Intelligence: Orbit's sealed enclave in three dimensions. A frosted glass sphere in two halves, joined at the
// equator by a band of clear polished glass, seals a machined chrome core; a small green ball waits outside on the
// seal orbit, lower right. At rest (slide 0) it is placed and sized as Orbit's still, its band seen almost edge-on.
// - The core turns inside the frost once every 30 s, about the sphere's polar axis; its lathe grooves run round a
//   different axis, so their rings and their reflections visibly sweep across it as it turns.
// - The entry turn: the whole sphere (band, core and meridian) arrives pitched toward the viewer and rolled, so the
//   band reads as an open ellipse, and eases level as it reaches the centre with the data disc's spring (D73).
// - The vectors: the graduated meridian sweeps slowly to and fro over the sphere; two markers ride the orbits at their own speeds, passing
//   behind and in front of the glass; the seal orbit's scale breathes in place; the request ray grows in from the
//   upper left and retracts (it never travels). The sphere, the ball and both orbits stay put.
export const INTEL = {
  S: [-0.0663, 0.0474, 0] as V3, // the sphere's centre (on screen at 204, 153.3, as in the still)
  R: 0.815, band: 0.085, core: 0.4, ball: 0.182,
  lean: rad(-10.5), // the sphere's rest tilt: its band a hair open (exactly edge-on at -12°, the camera's elevation)
  turn: { pitch: 38, roll: 14, full: 0.45 }, // degrees at |slide| ≥ 0.45
  spin: 30, // seconds a turn of the core
  grooves: rad(30), // the grooves' axis: tipped from the polar axis toward the camera by this much, at rest
  // the two orbits about the sphere (fitted to Orbit's SEAL and TILT ellipses within half a pixel)
  seal: { c: [-0.0659, 0.018, 0] as V3, r: 1.4065, tilt: rad(8.839), roll: rad(-17.009) },
  tilt: { c: [-0.0751, 0.0579, 0] as V3, r: 1.3201, tilt: rad(4.877), roll: rad(13.428) },
  // the graduated meridian (Orbit's MERID): 112° from upper left over the top (screen angles, clockwise), ticks every
  // 4°, its square 76° along; it sweeps ±28° about that on a 40 s swing
  merid: { r: 1.092, from: 214, span: 112, step: 4, mark: 76, swing: 28, period: 40 },
  ray: { from: [13.7, 86] as P2, aim: [133.3, 121.1] as P2, cycle: 10 },
};
type Orb = { c: V3; r: number; tilt: number; roll: number };
const orbAt = (o: Orb, u: number, s = 1): V3 => add(o.c, rotZ(rotX([o.r * s * Math.cos(u), 0, o.r * s * Math.sin(u)], o.tilt), o.roll));

// The sphere's frame: its rest tilt plus the entry pitch, then the roll (three: an outer group rolled about z at S,
// an inner one pitched about x)
export const intelFrame = (lean: number) => ({ pitch: INTEL.lean + rad(Math.abs(lean)), roll: rad((-lean * INTEL.turn.roll) / INTEL.turn.pitch) });
const frameW = (v: V3, f: { pitch: number; roll: number }) => add(INTEL.S, rotZ(rotX(v, f.pitch), f.roll));

// Orbit's still, on screen (its 2D ellipses with the station's zoom), to place the 3D pieces where the still has them
const still = (e: { cx: number; cy: number; rx: number; ry: number; rot: number }, t: number): P2 => {
  const a = rad(t), r = rad(e.rot), x = e.rx * Math.cos(a), y = e.ry * Math.sin(a);
  return [210 + 1.3 * (e.cx + x * Math.cos(r) - y * Math.sin(r) - 205), 157.5 + 1.3 * (e.cy + x * Math.sin(r) + y * Math.cos(r) - 160)];
};
const SEAL_2D = { cx: 200, cy: 160, rx: 98, ry: 34, rot: 18 }, TILT_2D = { cx: 200, cy: 157, rx: 92, ry: 26, rot: -14 };
const nearest = (o: Orb, q: P2) => {
  let best = 0, err = Infinity;
  for (let i = 0; i < 1440; i++) {
    const u = (i / 1440) * TAU, p = px(orbAt(o, u)), e = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (e < err) { err = e; best = u; }
  }
  return best;
};
const U = {
  ball: nearest(INTEL.seal, [295.2, 211.8]),
  trace: nearest(INTEL.seal, still(SEAL_2D, -30)),
  scale0: nearest(INTEL.seal, still(SEAL_2D, 196)), scale1: nearest(INTEL.seal, still(SEAL_2D, 250)),
  star: nearest(INTEL.seal, still(SEAL_2D, 300)),
  ring: nearest(INTEL.tilt, still(TILT_2D, 200)),
};
// the shorter way round from a to b
const toward = (a: number, b: number) => { const d = (((b - a) % TAU) + TAU * 1.5) % TAU - TAU / 2; return d; };
export const INTEL_BALL = orbAt(INTEL.seal, U.ball);

// The ray's fixed points on screen: from the upper left to the glass, its arrowhead just outside the sphere
const S2 = project(INTEL.S), RPX = (INTEL.R * FOCAL) / S2.z;
function hit(from: P2, dir: P2, r: number): P2 {
  const fx = from[0] - S2.p[0], fy = from[1] - S2.p[1], b = fx * dir[0] + fy * dir[1], c = fx * fx + fy * fy - r * r;
  const k = -b - Math.sqrt(Math.max(0, b * b - c));
  return [from[0] + dir[0] * k, from[1] + dir[1] * k];
}
const RAY = (() => {
  const { from, aim } = INTEL.ray, l = Math.hypot(aim[0] - from[0], aim[1] - from[1]);
  const dir: P2 = [(aim[0] - from[0]) / l, (aim[1] - from[1]) / l];
  const tip = hit(from, dir, RPX + 4);
  return { from, dir, tip, l1: Math.hypot(tip[0] - from[0], tip[1] - from[1]) };
})();
// how much of the ray is drawn: full at rest, then it retracts to its start, rests, and grows back in
function rayGrown(t: number) {
  const u = ((t % INTEL.ray.cycle) + INTEL.ray.cycle) % INTEL.ray.cycle;
  if (u < 5) return 1;
  if (u < 6.4) return 1 - smooth((u - 5) / 1.4);
  if (u < 7.2) return 0;
  if (u < 8.8) return smooth((u - 7.2) / 1.6);
  return 1;
}
export const INTEL_HORIZON = Math.round(S2.p[1] * 10) / 10;
// where the ecliptic passes behind the sphere (left out, like every far line)
export const INTEL_GAP = [S2.p[0] - RPX - 1.5, S2.p[0] + RPX + 1.5] as const;

// The turn, as the data disc's (D73): a target from the slide (smootherstep over |slide| / 0.45, signed so it arrives
// and leaves rolled opposite ways), chased by a critically damped spring: ω 6.5 settling toward level, ω 20 leaving
// it, exactly level below 0.1°, and straight to the target after a gap (the drawing was off screen). `lean` is the
// chased pitch in degrees, signed by the side it is on.
export type Spring = { y: number; v: number; t: number };
const smoother = (u: number) => { const x = clamp(u); return x * x * x * (x * (6 * x - 15) + 10); };
function chase(st: Spring, target: number, time: number) {
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

export type IntelPose = { lean: number; t: number };
export function intelligencePose(slide: number, t: number, spring?: Spring): IntelPose {
  const target = INTEL.turn.pitch * Math.sign(slide) * smoother(Math.abs(slide) / INTEL.turn.full);
  return { lean: spring ? chase(spring, target, t) : target, t };
}
export const intelSpin = (t: number) => (TAU * t) / INTEL.spin;

export function intelligenceVectors({ lean, t }: IntelPose): Record<string, Attrs> {
  const f = intelFrame(lean);
  const B = sphere(INTEL_BALL, INTEL.ball);
  // never across the ball (it sits in front of everything here), and nothing behind the sphere is drawn where the
  // sphere covers it: seen through the frost, a hairline reads as a scratch on the glass (D75), so, as in Orbit's still,
  // the far halves stop at the glass's outline. Only what passes in front of the sphere crosses its face.
  const clear = (_p: V3, q: { p: P2 }) => Math.hypot(q.p[0] - B.c[0], q.p[1] - B.c[1]) > B.r + 2;
  const outside = (q: { p: P2 }) => Math.hypot(q.p[0] - S2.p[0], q.p[1] - S2.p[1]) > RPX + 1.5;
  const far = (q: { p: P2; z: number }) => q.z > S2.z && outside(q); // behind the sphere's centre, beside the glass
  const near = (q: { z: number }) => q.z <= S2.z;
  const arc = (o: Orb, a: number, b: number, keep: (q: { p: P2; z: number }) => boolean, n = 220) =>
    curve((u) => orbAt(o, a + u * (b - a)), n, (p, q) => keep(q) && clear(p, q));

  // the seal orbit: ink all round but the trace, which runs from its tail up on the right down to the ball
  const tr = toward(U.trace, U.ball), restA = U.ball, restB = U.ball + Math.sign(tr) * (TAU - Math.abs(tr));
  const N = 70;
  let head: P2 = px(orbAt(INTEL.seal, U.trace));
  for (let i = 0; i <= N; i++) {
    const p = orbAt(INTEL.seal, U.trace + (tr * i) / N), q = project(p);
    if (!clear(p, q)) break;
    head = q.p;
  }
  const tail = px(orbAt(INTEL.seal, U.trace));

  // the seal orbit's scale on its far upper left: fine ticks, longer every fifth, breathing in place in a slow wave
  let scale = "";
  for (let i = 0; i <= 18; i++) {
    const u = U.scale0 + ((U.scale1 - U.scale0) * i) / 18;
    const k = 0.78 + 0.3 * Math.sin(TAU * (t / 8 - i / 19));
    const q0 = project(orbAt(INTEL.seal, u)), q1 = project(orbAt(INTEL.seal, u, 1 + (i % 5 === 0 ? 0.1 : 0.05) * k));
    if (outside(q0) && outside(q1)) scale += seg2(q0.p, q1.p);
  }

  // the meridian: a graduated arc on a great circle facing us (in the sphere's frame, so it tilts with the entry turn),
  // sweeping slowly to and fro over the top (a long sine, so it eases at each end). It is outside the sphere at rest;
  // pitched in the entry turn its top comes forward over the glass, and the part inside the outline is left out
  const M = INTEL.merid, sweep = M.swing * Math.sin((TAU * t) / M.period);
  const mer = (deg: number, s = 1): V3 => frameW([M.r * s * Math.cos(rad(deg)), -M.r * s * Math.sin(rad(deg)), 0], f);
  const a0 = M.from + sweep, a1 = a0 + M.span;
  const merArc = (keep: (q: { p: P2; z: number }) => boolean) =>
    curve((u) => mer(a0 + u * M.span), 96, (p, q) => keep(q) && outside(q) && clear(p, q));
  let mtF = "", mtB = "";
  for (let a = a0, i = 0; a <= a1 + 1e-6; a += M.step, i++) {
    const p0 = mer(a), q0 = project(p0), q1 = project(mer(a, i % 5 === 0 ? 1.065 : 1.03));
    if (!clear(p0, q0) || !outside(q0) || !outside(q1)) continue;
    if (q0.z > S2.z) mtB += seg2(q0.p, q1.p); else mtF += seg2(q0.p, q1.p);
  }

  // the markers: a ring riding the tilted orbit, a cross the seal orbit the other way, a square on the meridian; each
  // in the layer it is in, hidden behind the ball, and hidden while the sphere covers it
  const marks: Record<string, Attrs> = {};
  const place = (i: number, p: V3, always = false) => {
    const q = project(p), back = q.z > S2.z, show = clear(p, q) && (back || always ? outside(q) : true);
    marks[`mk${i}b`] = { transform: xf(q.p), opacity: show && back ? "1" : "0" };
    marks[`mk${i}f`] = { transform: xf(q.p), opacity: show && !back ? "1" : "0" };
  };
  place(0, orbAt(INTEL.tilt, U.ring + (TAU * t) / 56));
  place(1, orbAt(INTEL.seal, U.star - (TAU * t) / 84));
  place(2, mer(a0 + M.mark), true);

  // the request: drawn from its start to the glass, where its arrowhead stops it (as in Orbit)
  const g = rayGrown(t), L = RAY.l1 * g, R = RAY;
  const at = (d: number): P2 => [R.from[0] + R.dir[0] * d, R.from[1] + R.dir[1] * d];
  const headOn = clamp((L - (R.l1 - 6)) / 6);
  const outer = Math.min(L, R.l1 - 5.5 * headOn);
  return {
    sealBack: { d: arc(INTEL.seal, restA, restB, far) },
    sealFront: { d: arc(INTEL.seal, restA, restB, near) },
    tiltBack: { d: arc(INTEL.tilt, 0, TAU, far, 240) },
    tiltFront: { d: arc(INTEL.tilt, 0, TAU, near, 240) },
    scale: { d: scale },
    trace: { d: curve((u) => orbAt(INTEL.seal, U.trace + tr * u), N, clear) },
    traceGrad: { x1: tail[0].toFixed(2), y1: tail[1].toFixed(2), x2: head[0].toFixed(2), y2: head[1].toFixed(2) },
    meridBack: { d: merArc(far) },
    meridFront: { d: merArc(near) },
    meridTicksBack: { d: mtB },
    meridTicksFront: { d: mtF },
    ...marks,
    ray: { d: outer > 0.3 ? seg2(R.from, at(outer)) : "" },
    head: { transform: xf(R.tip, angle(R.from, R.tip)), opacity: headOn.toFixed(3) },
  };
}
export const INTEL_RAY_FROM = RAY.from;
