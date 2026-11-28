// Study D's ring ("privacy through glass"): the drawing's square ring (Figma node 1123:610) rebuilt so its sides are a fence of frosted glass round
// the core. Same measures as study C (../c/ring.ts): one world unit is 100 px of the drawing's isometric length, the floor is y = 0 and the ring's centre
// (the drawing's orbit centre, 1081 × 625) is the origin; the ring's centreline runs a square of half-side H, its modules W wide and HT tall, its corners
// arcs of radius RC round (±C, ±C).
// What D changes in the drawing: each side is one glass channel, two walls of frosted panes (split into three panels by slim white mullions) with the
// drawing's green rails top and bottom and a pale floor between them; each corner is solid, a white curved block with its rails, a white collar at each
// end and a small cube on top (the posts the fence hangs between). The bubble and the core are the drawing's. The panes and the bubble only carry
// geometry here; their frost (the blurred picture of what lies behind them) is ./glass.ts. Every piece carries `aS`, its place round the ring (0…1), so
// the energy front can run round it.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const H = 4.47, W = 1.49, HT = 1.49, C = 3.235, RC = H - C;
export const HW = W / 2;
const RAIL_H = 0.15, RAIL_T = 0.09, PANE_T = 0.045;
const Q = (RC * Math.PI) / 2;
const PERIM = 8 * C + 4 * Q;
/** where the panels of a side meet (a mullion), along it */
export const SPLITS = [-C / 3, C / 3];

/** a point of the drawing (px in its 2016 × 1249 frame), seen at height y, to the floor (x, z) */
export function fromDrawing(px: number, py: number, y = 0) {
  const a = (px - 1081) / 86.6025, s = (py - 625 + y * 100) / 50;
  return { x: (a + s) / 2, z: (s - a) / 2 };
}

function perimRaw(x: number, z: number): number {
  const ax = Math.abs(x), az = Math.abs(z);
  if (ax > C && az > C) {
    let t = Math.atan2(z - Math.sign(z) * C, x - Math.sign(x) * C); if (t < 0) t += Math.PI * 2;
    if (x > 0 && z < 0) return 2 * C + RC * (t - 1.5 * Math.PI);
    if (x > 0 && z > 0) return 4 * C + Q + RC * t;
    if (x < 0 && z > 0) return 6 * C + 2 * Q + RC * (t - Math.PI / 2);
    return 8 * C + 3 * Q + RC * (t - Math.PI);
  }
  if (az >= ax) return z < 0 ? x + C : 4 * C + 2 * Q + (C - x);
  return x > 0 ? 2 * C + Q + (z + C) : 6 * C + 3 * Q + (C - z);
}
const S0 = perimRaw(-C, -H);
/** where a point lies round the ring, 0…1 (0 at the back corner's end) */
export const perim = (x: number, z: number) => ((((perimRaw(x, z) - S0) % PERIM) + PERIM) % PERIM) / PERIM;
/** the inverse: the centreline point at a place u (0…1) round the ring, written into `out` (y untouched) */
export function perimPoint(u: number, out: THREE.Vector3) {
  let s = ((((u - Math.floor(u)) * PERIM + S0) % PERIM) + PERIM) % PERIM;
  const arc = (cx: number, cz: number, t: number) => out.set(cx + RC * Math.cos(t), out.y, cz + RC * Math.sin(t));
  if (s < 2 * C) return out.set(s - C, out.y, -H); s -= 2 * C;
  if (s < Q) return arc(C, -C, 1.5 * Math.PI + s / RC); s -= Q;
  if (s < 2 * C) return out.set(H, out.y, s - C); s -= 2 * C;
  if (s < Q) return arc(C, C, s / RC); s -= Q;
  if (s < 2 * C) return out.set(C - s, out.y, H); s -= 2 * C;
  if (s < Q) return arc(-C, C, Math.PI / 2 + s / RC); s -= Q;
  if (s < 2 * C) return out.set(-H, out.y, C - s); s -= 2 * C;
  return arc(-C, -C, Math.PI + s / RC);
}

/* ── a bag of pieces: merged by material (each vertex tagged with its place round the ring), outlines merged into one set of lines ── */

export class Bag {
  solids = new Map<THREE.Material, THREE.BufferGeometry[]>();
  lines: THREE.BufferGeometry[] = [];
  add(mat: THREE.Material, g: THREE.BufferGeometry, edge: number | false = 1) {
    if (edge !== false) this.lines.push(new THREE.EdgesGeometry(g, edge));
    const geo = g.index ? g.toNonIndexed() : g;
    if (geo !== g) g.dispose();
    for (const k of Object.keys(geo.attributes)) if (k !== "position" && k !== "normal") geo.deleteAttribute(k);
    if (!geo.attributes.normal) geo.computeVertexNormals();
    const p = geo.attributes.position, s = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) s[i] = perim(p.getX(i), p.getZ(i));
    geo.setAttribute("aS", new THREE.BufferAttribute(s, 1));
    const list = this.solids.get(mat) ?? []; list.push(geo); this.solids.set(mat, list);
  }
  line(g: THREE.BufferGeometry) { this.lines.push(g); }
  build(group: THREE.Object3D, lineMat: THREE.LineBasicMaterial, shadows: Set<THREE.Material>) {
    for (const [mat, list] of this.solids) {
      const m = new THREE.Mesh(mergeGeometries(list), mat);
      m.castShadow = shadows.has(mat);
      group.add(m); list.forEach((g) => g.dispose());
    }
    if (this.lines.length) {
      for (const g of this.lines) for (const k of Object.keys(g.attributes)) if (k !== "position") g.deleteAttribute(k);
      const l = new THREE.LineSegments(mergeGeometries(this.lines.map((g) => (g.index ? g.toNonIndexed() : g))), lineMat);
      l.renderOrder = 2; group.add(l); this.lines.forEach((g) => g.dispose());
    }
  }
}

/* ── sweeps along a path ───────────────────────────────────────────────────────────────────────────────────────────────── */

type PP = { x: number; z: number; nx: number; nz: number };
function strip(path: PP[], a: [number, number], b: [number, number]): THREE.BufferGeometry {
  const pos: number[] = [], nor: number[] = [], idx: number[] = [];
  const dO = b[0] - a[0], dY = b[1] - a[1], L = Math.hypot(dO, dY) || 1;
  const cnO = dY / L, cnY = -dO / L;
  path.forEach((p, i) => {
    for (const [o, y] of [a, b]) { pos.push(p.x + p.nx * o, y, p.z + p.nz * o); nor.push(p.nx * cnO, cnY, p.nz * cnO); }
    if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}
/** a rectangle [o0, o1] × [y0, y1] swept along a path, capped at both ends */
function bar(path: PP[], o0: number, o1: number, y0: number, y1: number): THREE.BufferGeometry {
  const c: [number, number][] = [[o0, y0], [o1, y0], [o1, y1], [o0, y1]];
  const parts = [0, 1, 2, 3].map((k) => strip(path, c[k], c[(k + 1) % 4]));
  for (const end of [path[0], path[path.length - 1]]) {
    const pts = c.map(([o, y]) => new THREE.Vector3(end.x + end.nx * o, y, end.z + end.nz * o));
    const cap = new THREE.BufferGeometry().setFromPoints([pts[0], pts[1], pts[2], pts[0], pts[2], pts[3]]);
    cap.computeVertexNormals();
    parts.push(cap);
  }
  return mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)));
}
const rails = (bag: Bag, mat: THREE.Material, path: PP[]) => {
  for (const o of [HW, -HW]) for (const y of [0, HT - RAIL_H]) bag.add(mat, bar(path, o - RAIL_T / 2, o + RAIL_T / 2, y, y + RAIL_H), 20);
};

/* ── the sides and the corners ─────────────────────────────────────────────────────────────────────────────────────────── */

type Axis = "x" | "z";
export type Side = { axis: Axis; s: 1 | -1 };
const at = (sd: Side, t: number, o: number, y: number) =>
  sd.axis === "x" ? new THREE.Vector3(sd.s * (H + o), y, t) : new THREE.Vector3(t, y, sd.s * (H + o));
const sidePath = (sd: Side, a: number, b: number): PP[] => [a, b].map((t) => {
  const p = at(sd, t, 0, 0);
  return { x: p.x, z: p.z, nx: sd.axis === "x" ? sd.s : 0, nz: sd.axis === "z" ? sd.s : 0 };
});
function sideBox(sd: Side, a: number, b: number, o0: number, o1: number, y0: number, y1: number) {
  const lo = at(sd, a, o0, y0), hi = at(sd, b, o1, y1);
  const g = new THREE.BoxGeometry(Math.abs(hi.x - lo.x), Math.abs(hi.y - lo.y), Math.abs(hi.z - lo.z));
  g.translate((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, (lo.z + hi.z) / 2);
  return g;
}
function roundRect(w: number, h: number, r: number, cy = 0) {
  const s = new THREE.Shape(), x = -w / 2, y = cy - h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
/** geometry drawn in a side's cross-section plane (x: outward, y: up, z: along), moved to t along the side */
function alongSide(sd: Side, g: THREE.BufferGeometry, t: number) {
  if (sd.axis === "x") g.translate(sd.s * H, 0, t);
  else { g.rotateY(Math.PI / 2); g.translate(t, 0, sd.s * H); }
  return g;
}

export type RingMats = {
  white: THREE.Material; rail: THREE.Material; floor: THREE.Material; pane: THREE.Material; line: THREE.LineBasicMaterial;
};
export type Part = {
  g: THREE.Group; kind: "side" | "corner"; n: THREE.Vector3; t: THREE.Vector3; m: RingMats; side?: Side;
};

/** a side: the glass channel (outer and inner walls of three panes each, mullions between them, rails, its floor) */
function buildSide(sd: Side, m: RingMats) {
  const g = new THREE.Group(), bag = new Bag();
  const ends = [-C, ...SPLITS, C], GAP = 0.035;
  for (const o of [HW, -HW]) {
    for (let i = 0; i < 3; i++) bag.add(m.pane, sideBox(sd, ends[i] + (i ? GAP : 0.02), ends[i + 1] - (i < 2 ? GAP : 0.02), o - PANE_T / 2, o + PANE_T / 2, RAIL_H * 0.5, HT - RAIL_H * 0.5), 30);
    for (const t of SPLITS) bag.add(m.white, sideBox(sd, t - 0.05, t + 0.05, o - 0.06, o + 0.06, 0, HT));
  }
  bag.add(m.floor, sideBox(sd, -C, C, -HW, HW, 0, 0.012), false);
  rails(bag, m.rail, sidePath(sd, -C, C));
  return { g, bag };
}
/** a corner: a solid white block swept round the arc, its rails, a white collar at each end, a small cube on top */
function buildCorner(sx: 1 | -1, sz: 1 | -1, m: RingMats) {
  const g = new THREE.Group(), bag = new Bag();
  const a0 = sx > 0 ? 0 : Math.PI, a1 = sz > 0 ? Math.PI / 2 : -Math.PI / 2;
  let d = a1 - a0; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
  const path: PP[] = [];
  for (let i = 0; i <= 32; i++) { const a = a0 + (d * i) / 32; path.push({ x: sx * C + RC * Math.cos(a), z: sz * C + RC * Math.sin(a), nx: Math.cos(a), nz: Math.sin(a) }); }
  bag.add(m.white, bar(path, -HW + 0.03, HW - 0.03, 0.002, HT - 0.002), 20);
  rails(bag, m.rail, path);
  // vertical silhouettes where the curved walls turn square to the view (the camera looks along -(1, 1, 1))
  for (let i = 1; i < path.length; i++) {
    const p = path[i - 1], q = path[i], f0 = p.nx + p.nz, f1 = q.nx + q.nz;
    if (f0 === 0 || Math.sign(f0) === Math.sign(f1)) continue;
    const t = f0 / (f0 - f1), x = p.x + (q.x - p.x) * t, z = p.z + (q.z - p.z) * t, nx = p.nx + (q.nx - p.nx) * t, nz = p.nz + (q.nz - p.nz) * t;
    for (const o of [HW - 0.03, -HW + 0.03]) bag.line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x + nx * o, RAIL_H, z + nz * o), new THREE.Vector3(x + nx * o, HT - RAIL_H, z + nz * o)]));
  }
  // the collars where the glass meets the post
  const collar = (sd: Side, t: number, len = 0.34) => {
    const o = roundRect(1.62, 1.62, 0.2, 0.81);
    o.holes.push(roundRect(W + 0.01, W + 0.01, 0.1, HT / 2 + 0.005));
    bag.add(m.white, alongSide(sd, new THREE.ExtrudeGeometry(o, { depth: len, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, -len / 2), t), 16);
  };
  collar({ axis: "x", s: sx }, sz * (C - 0.17));
  collar({ axis: "z", s: sz }, sx * (C - 0.17));
  // a small cube on top, mid-arc
  const am = a0 + d / 2, cx = sx * C + RC * Math.cos(am), cz = sz * C + RC * Math.sin(am);
  bag.add(m.white, new THREE.BoxGeometry(0.25, 0.25, 0.25).translate(cx, HT + 0.125, cz));
  return { g, bag };
}

export function buildRing(mk: () => RingMats) {
  const parts: Part[] = [];
  const sides: Side[] = [{ axis: "z", s: -1 }, { axis: "x", s: 1 }, { axis: "z", s: 1 }, { axis: "x", s: -1 }];   // round the ring from 0
  const corners: [1 | -1, 1 | -1][] = [[1, -1], [1, 1], [-1, 1], [-1, -1]];
  sides.forEach((sd, i) => {
    const m = mk(), { g, bag } = buildSide(sd, m);
    bag.build(g, m.line, new Set([m.white]));
    const n = new THREE.Vector3(sd.axis === "x" ? sd.s : 0, 0, sd.axis === "z" ? sd.s : 0);
    parts.push({ g, kind: "side", n, t: new THREE.Vector3(n.z, 0, -n.x), m, side: sd });
    const [sx, sz] = corners[i], mc = mk(), c = buildCorner(sx, sz, mc);
    c.bag.build(c.g, mc.line, new Set([mc.white]));
    parts.push({ g: c.g, kind: "corner", n: new THREE.Vector3(sx, 0, sz).normalize(), t: new THREE.Vector3(), m: mc });
  });
  return parts;
}

/* ── the core and its bubble ───────────────────────────────────────────────────────────────────────────────────────────── */

export const BUBBLE = { w: 2.6, h: 2.04, r: 0.35, y: 1.06 }, CORE = { s: 1.24, r: 0.22, y: 1.06 };

function crests(hx: number, hy: number, hz: number, r: number) {
  const k = r / Math.SQRT2, pts: THREE.Vector3[] = [];
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    pts.push(new THREE.Vector3(-hx, a * (hy + k), b * (hz + k)), new THREE.Vector3(hx, a * (hy + k), b * (hz + k)));
    pts.push(new THREE.Vector3(a * (hx + k), -hy, b * (hz + k)), new THREE.Vector3(a * (hx + k), hy, b * (hz + k)));
    pts.push(new THREE.Vector3(a * (hx + k), b * (hy + k), -hz), new THREE.Vector3(a * (hx + k), b * (hy + k), hz));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}
export function buildCore(m: { bubble: THREE.Material; core: THREE.Material; fine: THREE.LineBasicMaterial; line: THREE.LineBasicMaterial }) {
  const bubble = new THREE.Group(); bubble.position.y = BUBBLE.y;
  const bm = new THREE.Mesh(new RoundedBoxGeometry(BUBBLE.w, BUBBLE.h, BUBBLE.w, 6, BUBBLE.r), m.bubble);
  bubble.add(bm);
  const bi = BUBBLE.w / 2 - BUBBLE.r, bh = BUBBLE.h / 2 - BUBBLE.r;
  const fine = new THREE.LineSegments(crests(bi, bh, bi, BUBBLE.r), m.fine); fine.renderOrder = 2;
  bubble.add(fine);
  const core = new THREE.Group(); core.position.y = CORE.y;
  const cm = new THREE.Mesh(new RoundedBoxGeometry(CORE.s, CORE.s, CORE.s, 6, CORE.r), m.core); cm.castShadow = true;
  const ci = CORE.s / 2 - CORE.r;
  core.add(cm, new THREE.LineSegments(crests(ci, ci, ci, CORE.r), m.line));
  return { bubble, bubbleMesh: bm, core, bubbleHalf: new THREE.Vector3(bi, bh, bi), coreHalf: new THREE.Vector3(ci, ci, ci) };
}

/** the outline of a rounded box as the camera sees it (its inner box's corners on the view plane, their hull grown by r), written into `line` */
const corners8 = Array.from({ length: 8 }, () => new THREE.Vector3()), tmp = new THREE.Vector3();
export function silhouette(line: THREE.LineLoop, obj: THREE.Object3D, half: THREE.Vector3, r: number, cam: THREE.Camera) {
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion), up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
  obj.updateWorldMatrix(true, false);
  const centre = new THREE.Vector3().setFromMatrixPosition(obj.matrixWorld);
  const sc = new THREE.Vector3().setFromMatrixScale(obj.matrixWorld).x;
  const pts: [number, number][] = [];
  for (let i = 0; i < 8; i++) {
    corners8[i].set(i & 1 ? half.x : -half.x, i & 2 ? half.y : -half.y, i & 4 ? half.z : -half.z).applyMatrix4(obj.matrixWorld).sub(centre);
    pts.push([corners8[i].dot(right), corners8[i].dot(up)]);
  }
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: [number, number][] = [], hi: [number, number][] = [];
  for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 1e-9) lo.pop(); lo.push(p); }
  for (const p of [...pts].reverse()) { while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], p) <= 1e-9) hi.pop(); hi.push(p); }
  const hull = lo.slice(0, -1).concat(hi.slice(0, -1));
  const pos = line.geometry.attributes.position as THREE.BufferAttribute, R = r * sc, SEG = 8;
  let n = 0;
  for (let i = 0; i < hull.length; i++) {
    const p = hull[i], a = hull[(i - 1 + hull.length) % hull.length], b = hull[(i + 1) % hull.length];
    const t0 = Math.atan2(-(p[0] - a[0]), p[1] - a[1]);
    let t1 = Math.atan2(-(b[0] - p[0]), b[1] - p[1]); while (t1 < t0) t1 += Math.PI * 2;
    for (let j = 0; j <= SEG && n < pos.count; j++) {
      const t = t0 + ((t1 - t0) * j) / SEG;
      tmp.copy(centre).addScaledVector(right, p[0] + Math.cos(t) * R).addScaledVector(up, p[1] + Math.sin(t) * R);
      pos.setXYZ(n++, tmp.x, tmp.y, tmp.z);
    }
  }
  line.geometry.setDrawRange(0, n);
  pos.needsUpdate = true;
  line.geometry.computeBoundingSphere();
}
export const outlineLoop = (mat: THREE.LineBasicMaterial) => {
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(8 * 9 * 3), 3));
  const l = new THREE.LineLoop(g, mat); l.frustumCulled = false; l.renderOrder = 3; return l;
};
