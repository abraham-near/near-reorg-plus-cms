// The ring of "NEAR is private by design" (Figma node 1123:610) rebuilt as 3D geometry, at the drawing's own measures. One world unit is 100 px of the
// drawing's isometric length (its 2016 × 1249 frame), the floor is y = 0 and the ring's centre is the origin (the drawing's orbit centre, 1081 × 625).
// Measured off public/hero-private/ring.svg: the ring's centreline runs a square of half-side H; its modules are W wide and HT tall; its corners are arcs
// of radius RC around (±C, ±C). Each side is a run of modules (white blocks, glass sleeves at the joints, glass channels with green rails, a housing),
// each corner a curved glass tube with green rails top and bottom on both walls; two green-framed dotted panels stand on the inner edge of the left sides.
// Every part is built in world coordinates inside its own group (4 sides, 4 corners), so the scene can push a group out as the hero scrolls away.
// The rails and the glass carry `aS`, the point's place around the ring (0…1), so a shader pulse can run round it (./scene.ts).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const H = 4.47, W = 1.49, HT = 1.49, C = 3.235, RC = H - C;
const HW = W / 2;
const RAIL_H = 0.15, RAIL_T = 0.09;
const Q = (RC * Math.PI) / 2;
const PERIM = 8 * C + 4 * Q;

/** a point of the drawing (px in its 2016 × 1249 frame), seen at height y, to the floor (x, z) */
export function fromDrawing(px: number, py: number, y = 0) {
  const a = (px - 1081) / 86.6025, s = (py - 625 + y * 100) / 50;
  return { x: (a + s) / 2, z: (s - a) / 2 };
}

/** where a point lies around the ring, 0…1 (the origin sits under a block on the back-right side, so no rail or glass straddles the wrap) */
function perimRaw(x: number, z: number): number {
  const ax = Math.abs(x), az = Math.abs(z);
  if (ax > C && az > C) {   // a corner's arc
    let t = Math.atan2(z - Math.sign(z) * C, x - Math.sign(x) * C); if (t < 0) t += Math.PI * 2;
    if (x > 0 && z < 0) return 2 * C + RC * (t - 1.5 * Math.PI);
    if (x > 0 && z > 0) return 4 * C + Q + RC * t;
    if (x < 0 && z > 0) return 6 * C + 2 * Q + RC * (t - Math.PI / 2);
    return 8 * C + 3 * Q + RC * (t - Math.PI);
  }
  if (az >= ax) return z < 0 ? x + C : 4 * C + 2 * Q + (C - x);
  return x > 0 ? 2 * C + Q + (z + C) : 6 * C + 3 * Q + (C - z);
}
const S0 = perimRaw(-1.5, -H);
export const perim = (x: number, z: number) => ((((perimRaw(x, z) - S0) % PERIM) + PERIM) % PERIM) / PERIM;

/* ── materials ─────────────────────────────────────────────────────────────────────────────────────────────────────────── */

export const GREEN = "#00dc8d";
export type Mats = ReturnType<typeof materials>;
export function materials() {
  const off = { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 };
  const glass = (opacity: number, color = "#7fe8c1") =>
    new THREE.MeshLambertMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, ...off });
  return {
    white: new THREE.MeshLambertMaterial({ color: 0xffffff, ...off }),
    grey: new THREE.MeshLambertMaterial({ color: "#c9c5c0", ...off }),
    rail: new THREE.MeshLambertMaterial({ color: 0x000000, emissive: GREEN, emissiveIntensity: 1, ...off }),   // exactly the drawing's flat #00DC8D
    housing: new THREE.MeshLambertMaterial({ color: "#e4f8ef", ...off }),
    slot: new THREE.MeshLambertMaterial({ color: "#b9e4d2", ...off }),
    wall: glass(0.075, "#9df0d2"),
    floor: glass(0.15, "#9df0d2"),
    sleeve: glass(0.3, "#a3f1d5"),
    tray: glass(0.5, "#45e3a9"),
    bubble: glass(0.13, "#9df0d2"),
    core: new THREE.MeshPhysicalMaterial({ color: 0xf4f4f2, roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.25, envMapIntensity: 0.55, ...off }),
    line: new THREE.LineBasicMaterial({ color: "#111111", transparent: true, opacity: 0.85 }),
    fine: new THREE.LineBasicMaterial({ color: "#2d8e67", transparent: true, opacity: 0.45 }),
  };
}

/* ── a bag of pieces per group: merged by material, their outlines merged into one set of lines ───────────────────────── */

class Bag {
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

/* ── sweeps along the ring's centreline ────────────────────────────────────────────────────────────────────────────────── */

type PP = { x: number; z: number; nx: number; nz: number };   // a centreline point and the outward normal there

/** one edge of a cross-section ([offset from the centreline, height] → [offset, height]) swept along a path, as a strip */
function strip(path: PP[], a: [number, number], b: [number, number]): THREE.BufferGeometry {
  const pos: number[] = [], nor: number[] = [], idx: number[] = [];
  const dO = b[0] - a[0], dY = b[1] - a[1], L = Math.hypot(dO, dY) || 1;
  const cnO = dY / L, cnY = -dO / L;   // the edge's normal in the cross-section
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
/** a rail: a rectangle [o0, o1] × [y0, y1] swept along a path, capped at both ends */
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

/** a stretch of glass tube along a path: two walls, a floor, four rails; plus the walls' vertical silhouettes where they curve */
function tube(bag: Bag, m: Mats, path: PP[]) {
  bag.add(m.wall, strip(path, [HW, 0], [HW, HT]), false);
  bag.add(m.wall, strip(path, [-HW, 0], [-HW, HT]), false);
  bag.add(m.floor, strip(path, [-HW, 0.004], [HW, 0.004]), false);
  for (const o of [HW, -HW]) for (const y of [0, HT - RAIL_H]) bag.add(m.rail, bar(path, o - RAIL_T / 2, o + RAIL_T / 2, y, y + RAIL_H), 20);
  // silhouettes: where a wall's normal turns square to the view (the camera looks along -(1, 1, 1)), a vertical line as in the drawing
  for (let i = 1; i < path.length; i++) {
    const p = path[i - 1], q = path[i];
    const f0 = p.nx + p.nz, f1 = q.nx + q.nz;   // n · (1, 0, 1): zero where the normal is square to the view's horizontal
    if (f0 === 0 || Math.sign(f0) === Math.sign(f1)) continue;
    const t = f0 / (f0 - f1), x = p.x + (q.x - p.x) * t, z = p.z + (q.z - p.z) * t;
    const nx = p.nx + (q.nx - p.nx) * t, nz = p.nz + (q.nz - p.nz) * t;
    for (const o of [HW, -HW]) bag.line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x + nx * o, RAIL_H, z + nz * o), new THREE.Vector3(x + nx * o, HT - RAIL_H, z + nz * o)]));
  }
}

/* ── the sides ─────────────────────────────────────────────────────────────────────────────────────────────────────────── */

type Axis = "x" | "z";   // "x": the side lies at x = ±H and runs along z; "z": at z = ±H, along x
type Side = { axis: Axis; s: 1 | -1 };
/** a world point from a side's frame: t along it, o outward from its centreline, y up */
const at = (sd: Side, t: number, o: number, y: number) =>
  sd.axis === "x" ? new THREE.Vector3(sd.s * (H + o), y, t) : new THREE.Vector3(t, y, sd.s * (H + o));
const sidePath = (sd: Side, a: number, b: number, n = 2): PP[] =>
  Array.from({ length: n }, (_, i) => {
    const t = a + ((b - a) * i) / (n - 1), p = at(sd, t, 0, 0);
    return { x: p.x, z: p.z, nx: sd.axis === "x" ? sd.s : 0, nz: sd.axis === "z" ? sd.s : 0 };
  });
/** a box in a side's frame: along [a, b], outward [o0, o1], up [y0, y1] */
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
/** geometry drawn in a side's cross-section plane (x: outward, y: up, z: along, centred on 0), moved to t along the side */
function alongSide(sd: Side, g: THREE.BufferGeometry, t: number) {
  if (sd.axis === "x") g.translate(sd.s * H, 0, t);
  else { g.rotateY(Math.PI / 2); g.translate(t, 0, sd.s * H); }
  return g;
}
/** a glass collar over a joint */
function sleeve(bag: Bag, m: Mats, sd: Side, t: number, len = 0.42) {
  const o = roundRect(1.62, 1.62, 0.2, 0.81);
  o.holes.push(roundRect(W + 0.01, W + 0.01, 0.1, HT / 2 + 0.005));
  bag.add(m.sleeve, alongSide(sd, new THREE.ExtrudeGeometry(o, { depth: len, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, -len / 2), t), 16);
  // the window's inner frame on its faces (a finer line, as the drawing's lighter inner rounded square)
  for (const side of [-1, 1]) {
    const pts = roundRect(1.38, 1.38, 0.16, 0.81).getPoints(6).map((v) => new THREE.Vector3(v.x, v.y, (side * len) / 2 + side * 0.002));
    const g = new THREE.BufferGeometry().setFromPoints(pts.flatMap((p, i) => (i ? [pts[i - 1], p] : [])));
    bag.line(alongSide(sd, g, t));
  }
}
function block(bag: Bag, m: Mats, sd: Side, a: number, b: number) { bag.add(m.white, sideBox(sd, a, b, -HW, HW, 0, HT)); }
/** a screw on the block face that faces the camera */
function screw(bag: Bag, m: Mats, sd: Side, t: number, y = HT * 0.52) {
  const vis = sd.s === 1 ? HW : -HW;   // the face toward the camera: outward on the front sides, inward on the back ones
  const p = at(sd, t, vis + Math.sign(vis) * 0.004, y);
  const g = new THREE.CircleGeometry(0.06, 16), r = new THREE.EdgesGeometry(new THREE.CircleGeometry(0.06, 16));
  const ri = new THREE.EdgesGeometry(new THREE.CircleGeometry(0.03, 12));
  for (const x of [g, r, ri]) { if (sd.axis === "x") x.rotateY(Math.PI / 2); x.translate(p.x, p.y, p.z); }
  bag.add(m.grey, g, false); bag.line(r); bag.line(ri);
}
/** a small cube or a tray sitting on top of a block (measured where the drawing has it) */
function onTop(bag: Bag, m: Mats, px: number, py: number, kind: "cube" | "tray") {
  const s = kind === "cube" ? 0.25 : 0.3, hgt = kind === "cube" ? 0.25 : 0.1;
  const f = fromDrawing(px, py, HT + hgt / 2);
  const g = new THREE.BoxGeometry(s, hgt, s); g.translate(f.x, HT + hgt / 2, f.z);
  bag.add(kind === "cube" ? m.white : m.tray, g);
}
/** a pill (a slot) as 2D points: `len` long along u, `w` wide along v, centred */
function pill(len: number, w: number) {
  const s = new THREE.Shape(), r = w / 2, a = len / 2 - r;
  s.moveTo(-a, -r); s.lineTo(a, -r); s.absarc(a, 0, r, -Math.PI / 2, Math.PI / 2, false); s.lineTo(-a, r); s.absarc(-a, 0, r, Math.PI / 2, Math.PI * 1.5, false);
  return s;
}
/** a flat shape laid on a surface: its (u, v) points mapped to the world; a fill and its outline */
function decal(bag: Bag, mat: THREE.Material, shape: THREE.Shape, map: (u: number, v: number) => THREE.Vector3) {
  const g = new THREE.ShapeGeometry(shape, 12), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const v = map(p.getX(i), p.getY(i)); p.setXYZ(i, v.x, v.y, v.z); }
  g.deleteAttribute("normal"); g.computeVertexNormals();
  bag.add(mat, g, false);
  const pts = shape.getPoints(12).map((q) => map(q.x, q.y));
  bag.line(new THREE.BufferGeometry().setFromPoints(pts.flatMap((q, i) => (i ? [pts[i - 1], q] : []))));
}
/** the housing (LR3): a rounded block of pale mint over the run, a slot along its top, a slot and a small hatch on its face */
function housing(bag: Bag, m: Mats, sd: Side, a: number, b: number) {
  const len = b - a, c = (a + b) / 2, R = 0.81, r = 0.2;
  bag.add(m.housing, alongSide(sd, new THREE.ExtrudeGeometry(roundRect(2 * R, 2 * R, r, R), { depth: len, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, -len / 2), c), 16);
  // its long edges (the rounded corners' crests), drawn as the drawing draws them
  const k = R - r + r / Math.SQRT2, pts: THREE.Vector3[] = [];
  for (const [x, y] of [[k, R + k], [-k, R + k], [k, R - k], [-k, R - k]]) pts.push(new THREE.Vector3(x, y, -len / 2), new THREE.Vector3(x, y, len / 2));
  bag.line(alongSide(sd, new THREE.BufferGeometry().setFromPoints(pts), c));
  const top = 2 * R + 0.004, face = sd.s === 1 ? R + 0.004 : -R - 0.004;
  decal(bag, m.slot, pill(0.62, 0.1), (u, v) => at(sd, c + u, v, top));
  decal(bag, m.slot, pill(0.6, 0.09), (u, v) => at(sd, a + len * 0.3 + v, face, 0.95 + u));
  const hatch = new THREE.Shape(); hatch.moveTo(-0.11, -0.07); hatch.lineTo(0.11, -0.07); hatch.lineTo(0.11, 0.07); hatch.lineTo(-0.11, 0.07); hatch.lineTo(-0.11, -0.07);
  decal(bag, m.slot, hatch, (u, v) => at(sd, a + len * 0.3 + u, face, 0.38 + v));
}
/** a green-framed panel of dotted glass standing on a side's inner edge */
function panel(group: THREE.Group, bag: Bag, m: Mats, dots: THREE.Texture, sd: Side, c: number, len: number, h: number) {
  const o = -HW + 0.05, f = 0.1;
  for (const [a, b, y0, y1] of [[c - len / 2, c + len / 2, h - f, h], [c - len / 2, c + len / 2, 0, f], [c - len / 2, c - len / 2 + f, 0, h], [c + len / 2 - f, c + len / 2, 0, h]])
    bag.add(m.rail, sideBox(sd, a, b, o - f / 2, o + f / 2, y0, y1));
  const plane = new THREE.PlaneGeometry(len - 2 * f, h - 2 * f);
  if (sd.axis === "x") plane.rotateY(Math.PI / 2);
  const p = at(sd, c, o, h / 2); plane.translate(p.x, p.y, p.z);
  const tex = dots.clone(); tex.needsUpdate = true; tex.repeat.set((len - 2 * f) / 0.11, (h - 2 * f) / 0.11);
  const mesh = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  mesh.renderOrder = 1; group.add(mesh);
}

/* ── the whole ring ────────────────────────────────────────────────────────────────────────────────────────────────────── */

export type Part = { g: THREE.Group; dir: THREE.Vector3; k: number };   // a group, the way it moves out, its share of the movement
export function buildRing(m: Mats, dots: THREE.Texture) {
  const parts: Part[] = [];
  const shadows = new Set<THREE.Material>([m.white, m.grey, m.housing]);   // glass and rails cast none (their shadows read as stray lines on the floor)
  const UL: Side = { axis: "x", s: -1 }, UR: Side = { axis: "z", s: -1 }, LL: Side = { axis: "z", s: 1 }, LR: Side = { axis: "x", s: 1 };
  const side = (sd: Side, fill: (bag: Bag, g: THREE.Group) => void) => {
    const g = new THREE.Group(), bag = new Bag();
    fill(bag, g); bag.build(g, m.line, shadows);
    parts.push({ g, dir: new THREE.Vector3(sd.axis === "x" ? sd.s : 0, 0, sd.axis === "z" ? sd.s : 0), k: 1 });
  };
  side(UL, (b, g) => {
    block(b, m, UL, -3.17, -1.99); screw(b, m, UL, -2.35);
    sleeve(b, m, UL, -1.87);
    tube(b, m, sidePath(UL, -1.66, 0.75));
    panel(g, b, m, dots, UL, -0.98, 1.5, 1.66);
    block(b, m, UL, 0.75, 1.93); block(b, m, UL, 1.93, 2.43);
    sleeve(b, m, UL, 2.57);
    onTop(b, m, 564, 282, "cube");
  });
  side(UR, (b) => {
    block(b, m, UR, -3.17, -2.19); onTop(b, m, 1252, 97, "cube");
    sleeve(b, m, UR, -2.02);
    block(b, m, UR, -1.82, -1.13); block(b, m, UR, -1.13, -0.95);
    sleeve(b, m, UR, -0.79);
    tube(b, m, sidePath(UR, -0.6, 0.87));
    block(b, m, UR, 0.87, 1.86); screw(b, m, UR, 1.2); onTop(b, m, 1617, 320, "tray");
    block(b, m, UR, 1.86, 2.37); screw(b, m, UR, 2.1);
    sleeve(b, m, UR, 2.51);
  });
  side(LL, (b, g) => {
    block(b, m, LL, -2.74, -1.68); onTop(b, m, 512, 562, "cube");
    block(b, m, LL, -1.68, -1.43);
    sleeve(b, m, LL, -1.27);
    tube(b, m, sidePath(LL, -1.06, 1.67));
    panel(g, b, m, dots, LL, -0.2, 2.5, 2.05);
    block(b, m, LL, 1.67, 2.73); onTop(b, m, 915, 802, "cube");
    // the slot on its face, with a screw
    b.add(m.grey, sideBox(LL, 2.02, 2.2, HW, HW + 0.012, 0.25, 1.15)); screw(b, m, LL, 2.11, 0.45);
    sleeve(b, m, LL, 2.88);
  });
  side(LR, (b) => {
    block(b, m, LR, -2.6, -1.11); onTop(b, m, 1672, 577, "cube"); screw(b, m, LR, -1.85);
    block(b, m, LR, -1.11, 0.07); screw(b, m, LR, -0.5);
    // the housing: a block in a long glass collar, a slot on top
    housing(b, m, LR, 0.07, 1.25);
    block(b, m, LR, 1.25, 2.55); screw(b, m, LR, 1.9);
    sleeve(b, m, LR, 2.7);
  });

  // the corners: from the end of one side, round the arc, to the end of the next
  const corner = (sx: 1 | -1, sz: 1 | -1, ez: number, ex: number) => {
    const path: PP[] = [];
    for (let i = 0; i < 3; i++) path.push({ x: sx * H, z: ez + ((sz * C - ez) * i) / 3, nx: sx, nz: 0 });
    const a0 = sx > 0 ? 0 : Math.PI, a1 = sz > 0 ? Math.PI / 2 : -Math.PI / 2;
    let d = a1 - a0; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
    for (let i = 0; i <= 32; i++) { const a = a0 + (d * i) / 32; path.push({ x: sx * C + RC * Math.cos(a), z: sz * C + RC * Math.sin(a), nx: Math.cos(a), nz: Math.sin(a) }); }
    for (let i = 1; i <= 3; i++) path.push({ x: sx * C + ((ex - sx * C) * i) / 3, z: sz * H, nx: 0, nz: sz });
    const g = new THREE.Group(), bag = new Bag();
    tube(bag, m, path); bag.build(g, m.line, shadows);
    parts.push({ g, dir: new THREE.Vector3(sx, 0, sz).normalize(), k: 1.2 });
  };
  corner(-1, -1, -3.17, -3.17);
  corner(-1, 1, 2.43, -2.74);
  corner(1, -1, -2.6, 2.37);
  corner(1, 1, 2.55, 2.73);
  return parts;
}

/* ── the core and its bubble ───────────────────────────────────────────────────────────────────────────────────────────── */

export const BUBBLE = { w: 2.6, h: 2.04, r: 0.35, y: 1.06 }, CORE = { s: 1.24, r: 0.22, y: 1.06 };

/** the crest lines of a rounded box's 12 edges (half extents of its inner box: hx, hy, hz) */
function crests(hx: number, hy: number, hz: number, r: number) {
  const k = r / Math.SQRT2, pts: THREE.Vector3[] = [];
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    pts.push(new THREE.Vector3(-hx, a * (hy + k), b * (hz + k)), new THREE.Vector3(hx, a * (hy + k), b * (hz + k)));
    pts.push(new THREE.Vector3(a * (hx + k), -hy, b * (hz + k)), new THREE.Vector3(a * (hx + k), hy, b * (hz + k)));
    pts.push(new THREE.Vector3(a * (hx + k), b * (hy + k), -hz), new THREE.Vector3(a * (hx + k), b * (hy + k), hz));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}
export function buildCore(m: Mats) {
  const bubble = new THREE.Group(); bubble.position.y = BUBBLE.y;
  const bm = new THREE.Mesh(new RoundedBoxGeometry(BUBBLE.w, BUBBLE.h, BUBBLE.w, 6, BUBBLE.r), m.bubble);
  bubble.add(bm);
  const bi = BUBBLE.w / 2 - BUBBLE.r, bh = BUBBLE.h / 2 - BUBBLE.r;
  bubble.add(new THREE.LineSegments(crests(bi, bh, bi, BUBBLE.r), m.fine));
  // its inner shell: a smaller rounded box's crests, as the drawing's internal lines
  bubble.add(new THREE.LineSegments(crests(bi - 0.3, bh - 0.22, bi - 0.3, BUBBLE.r), m.fine));
  const core = new THREE.Group(); core.position.y = CORE.y;
  const cm = new THREE.Mesh(new RoundedBoxGeometry(CORE.s, CORE.s, CORE.s, 6, CORE.r), m.core); cm.castShadow = true;
  const ci = CORE.s / 2 - CORE.r;
  const cl = new THREE.LineSegments(crests(ci, ci, ci, CORE.r), new THREE.LineBasicMaterial({ color: "#111111", transparent: true, opacity: 0.35 }));
  core.add(cm, cl);
  return { bubble, core, bubbleHalf: new THREE.Vector3(bi, bh, bi), coreHalf: new THREE.Vector3(ci, ci, ci) };
}

/** the outline of a rounded box as the camera sees it: its inner box's corners projected on the view plane, their hull, grown by r. Written into `line`. */
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
  const hull = lo.slice(0, -1).concat(hi.slice(0, -1));   // counter-clockwise
  const pos = line.geometry.attributes.position as THREE.BufferAttribute, R = r * sc, SEG = 8;
  let n = 0;
  for (let i = 0; i < hull.length; i++) {
    const p = hull[i], a = hull[(i - 1 + hull.length) % hull.length], b = hull[(i + 1) % hull.length];
    const t0 = Math.atan2(-(p[0] - a[0]), p[1] - a[1]), t1raw = Math.atan2(-(b[0] - p[0]), b[1] - p[1]);
    let t1 = t1raw; while (t1 < t0) t1 += Math.PI * 2;
    for (let j = 0; j <= SEG && n < pos.count; j++) {
      const t = t0 + ((t1 - t0) * j) / SEG, u = p[0] + Math.cos(t) * R, v = p[1] + Math.sin(t) * R;
      tmp.copy(centre).addScaledVector(right, u).addScaledVector(up, v);
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
