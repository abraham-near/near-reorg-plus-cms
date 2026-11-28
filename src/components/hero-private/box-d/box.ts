// Hero study "Box D"'s geometry: the drawing of Figma node 1120:8316 ("VEC03_CAJA_111", an exploded glass box) measured into a 3-D model. Units: one
// world unit along a floor axis (or up) is 100 of the drawing's px in its isometric; the origin is the central cube's centre, the drawing's point
// (853.04, 879.58). World +X runs down-right in the drawing, +Z down-left, +Y up (so the camera at rest looks from +X +Y +Z). An isometric drawing
// fixes each point only up to a slide along the line of sight (1, 1, 1): each part is placed along it where it makes sense in 3-D (the plates' holes
// on the vertical axis, the back frames standing on the bottom plate, the side panels at the core's height), so at rest it projects onto the drawing.
// Parts (the drawing's layer names): A1 the top plate (green glass, a hole on the axis, a collar under it), A2 the bottom plate (a hole in front, two
// dotted traces), B1 / B2 the back frames (glass bars round a faint glass sheet: here the "data wall", see ./glass.ts), B3 / B4 the side panels (glass
// slabs with a hole: the ports), C1 the core (a frame of glass bars, faint glass faces), C2 the central cube, C3 the fins, C4 the rod, C5 the ghost cube,
// C6 the ring, D1–D4 the four small cubes (top, bottom, left, right), E the guides and the floor.
// Every piece is a `Piece`: its meshes merged by material (one draw per material), its own material instances (so each piece fades on its own), one set
// of fat outlines (its hard edges), its geometry centred on its own middle (so the scene moves, scales and turns it about itself).
import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** the drawing point of the world origin; a world point's place in the drawing */
export const O = { x: 853.04, y: 879.58 };
export function toDrawing(p: THREE.Vector3) { return { x: O.x + 86.6 * (p.x - p.z), y: O.y + 50 * (p.x + p.z) - 100 * p.y }; }
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/* ── the measures ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export const BAR = 0.2535;                                   // a glass bar's side (frames and core)
export const CORE = { h: 2.027, y0: -1.689, y1: 2.027 };     // the core's frame: half side, bottom, top (outer faces)
export const CUBE = 1.52;                                    // the central cube's side (at the origin)
export const SMALL = 0.507;                                  // D1–D4's side
export const FLOOR = { y: -4.392, h: 4.9 };
/** a glass slab: centre, half extents, its thin axis, its hole (centre in the slab's plane, world, and radius) */
export type Slab = { c: THREE.Vector3; h: THREE.Vector3; axis: 0 | 1 | 2; hole: [number, number, number] };
export const TOP: Slab = { c: V(0.338, 6.0815, 0.338), h: V(2.872, 0.169, 2.872), axis: 1, hole: [0, 0, 0.51] };
export const BOT: Slab = { c: V(0, -3.7168, 0), h: V(3.294, 0.169, 3.294), axis: 1, hole: [1.77, 1.77, 0.37] };
export const LEFT: Slab = { c: V(-2.491, 0.17, 3.971), h: V(1.0135, 2.407, 0.1267), axis: 2, hole: [-2.405, 0.465, 0.338] };
export const RIGHT: Slab = { c: V(3.971, 0.17, -2.491), h: V(0.1267, 2.407, 1.0135), axis: 0, hole: [-2.405, 0.465, 0.338] };
/** the back frames: the plane of their bars (x for the left one, z for the right), the posts' places along it, their height */
export const BACK = { at: -3.083, p0: 3.083, p1: -2.07, y0: -3.5475, y1: 3.209 };
/** the four small cubes: top, bottom, left, right */
export const SMALLS = [V(0, 4.139, 0), V(1.77, -2.45, 1.77), V(-1.943, 0.17, 2.365), V(2.365, 0.17, -1.943)];
/** the ports (each stream's way in, outside → port → its small cube → the core): top hole, bottom hole, left and right panels' holes */
export const PORTS = [V(0, 6.0815, 0), V(1.77, -3.7168, 1.77), V(-2.405, 0.465, 3.971), V(3.971, 0.465, -2.405)];

/* ── the material library (./fx.ts makes it) ──────────────────────────────────────────────────────────────────────────────────────────────── */
export type MatKind = "white" | "slab" | "bar" | "core" | "face" | "gline" | "green" | "wall" | "ghost" | "ink";
export interface Lib {
  /** a new material of that kind (one per piece, so pieces fade on their own) */
  make(kind: MatKind): THREE.Material;
  /** a new outline material (1.3 px ink) */
  line(): LineMaterial;
}

/* ── a piece ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
type Mat = THREE.Material & { opacity: number; transparent: boolean };
export class Piece {
  /** the piece's centre (world, at rest): its geometry is built round it, the group sits there */
  c = new THREE.Vector3();
  private op = 1;
  private base = new Map<Mat, number>();
  /** the outline's opacity at rest */
  lineK = 0.85;
  constructor(public g: THREE.Group, public mats: Map<MatKind, THREE.Material>, public line: LineMaterial | null, c: THREE.Vector3) {
    for (const m of mats.values()) this.base.set(m as Mat, (m as Mat).opacity);
    this.c.copy(c);
    g.position.copy(c);
  }
  mat<T extends THREE.Material = THREE.Material>(k: MatKind) { return this.mats.get(k) as T | undefined; }
  /** fades the whole piece (its materials and its outline); a piece at 0 is hidden. Toggling `transparent` swaps the program variant (OPAQUE). */
  fade(o: number) {
    o = Math.min(1, Math.max(0, o));
    this.g.visible = o > 0.003;
    if (Math.abs(o - this.op) < 1e-4) return;
    this.op = o;
    for (const [m, b] of this.base) {
      m.opacity = b * o;
      const tr = b < 1 || o < 0.999 || m.userData.glass === true;   // the glass is always blended
      if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; }
    }
    if (this.line) this.line.opacity = this.lineK * o;
  }
  get opacity() { return this.op; }
}

/** builds a piece: meshes (placed by pos / rot, world) merged per material, plus the outline of their edges sharper than `edges` degrees; `done()`
 *  centres it all on `c` (its bounding box's centre unless given) */
export class Kit {
  private mats = new Map<MatKind, THREE.Material>();
  private parts = new Map<MatKind, { geos: THREE.BufferGeometry[]; order: number }>();
  private segs: number[] = [];
  constructor(private lib: Lib) {}
  mat(k: MatKind) { let m = this.mats.get(k); if (!m) { m = this.lib.make(k); this.mats.set(k, m); } return m; }
  add(geo: THREE.BufferGeometry, kind: MatKind, pos?: THREE.Vector3 | [number, number, number], edges = 25, rot?: THREE.Euler, order = 0) {
    const mx = new THREE.Matrix4().compose(
      pos ? (Array.isArray(pos) ? new THREE.Vector3(...pos) : pos.clone()) : new THREE.Vector3(),
      new THREE.Quaternion().setFromEuler(rot ?? new THREE.Euler()), new THREE.Vector3(1, 1, 1));
    if (edges) {
      const e = new THREE.EdgesGeometry(geo, edges), p = e.attributes.position as THREE.BufferAttribute, v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(mx); this.segs.push(v.x, v.y, v.z); }
      e.dispose();
    }
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    geo.dispose();
    for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") g.deleteAttribute(k);
    g.clearGroups(); g.applyMatrix4(mx);
    this.mat(kind);
    const slot = this.parts.get(kind) ?? { geos: [], order: 0 };
    slot.geos.push(g); slot.order = Math.max(slot.order, order); this.parts.set(kind, slot);
  }
  /** extra outline segments (world pairs) */
  seg(a: THREE.Vector3, b: THREE.Vector3) { this.segs.push(a.x, a.y, a.z, b.x, b.y, b.z); }
  done(centre?: THREE.Vector3): Piece {
    const g = new THREE.Group();
    const all: THREE.BufferGeometry[] = [];
    const meshes: THREE.Mesh[] = [];
    for (const [kind, { geos, order }] of this.parts) {
      const merged = geos.length > 1 ? mergeGeometries(geos, false)! : geos[0];
      if (geos.length > 1) geos.forEach((x) => x.dispose());
      const mesh = new THREE.Mesh(merged, this.mats.get(kind));
      mesh.renderOrder = order; mesh.userData.kind = kind;
      mesh.castShadow = kind === "white" || kind === "core"; mesh.receiveShadow = kind === "white" || kind === "core";
      all.push(merged); meshes.push(mesh);
    }
    const c = centre?.clone() ?? (() => { const b = new THREE.Box3(); for (const x of all) { x.computeBoundingBox(); b.union(x.boundingBox!); } return b.getCenter(new THREE.Vector3()); })();
    for (const m of meshes) { m.geometry.translate(-c.x, -c.y, -c.z); g.add(m); }
    let line: LineMaterial | null = null;
    if (this.segs.length) {
      line = this.lib.line();
      for (let i = 0; i < this.segs.length; i += 3) { this.segs[i] -= c.x; this.segs[i + 1] -= c.y; this.segs[i + 2] -= c.z; }
      const lg = new LineSegmentsGeometry(); lg.setPositions(this.segs);
      const l = new LineSegments2(lg, line); l.renderOrder = 9; l.userData.kind = "line"; g.add(l);
    }
    this.segs = [];
    return new Piece(g, this.mats, line, c);
  }
}

/* ── shapes ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
const box = (x: number, y: number, z: number) => new THREE.BoxGeometry(x, y, z);
/** a box between two corners (world) */
const span = (kit: Kit, a: THREE.Vector3, b: THREE.Vector3, kind: MatKind, edges = 25, order = 0) => {
  const s = b.clone().sub(a), m = a.clone().add(b).multiplyScalar(0.5);
  kit.add(box(Math.abs(s.x), Math.abs(s.y), Math.abs(s.z)), kind, m, edges, undefined, order);
};
/** a glass bar between two corners with its green core inside (60 % of its section, its full length), as the drawing's bars */
function bar(kit: Kit, a: THREE.Vector3, b: THREE.Vector3, order = 3) {
  span(kit, a, b, "bar", 25, order);
  const s = b.clone().sub(a), m = a.clone().add(b).multiplyScalar(0.5), k = (v: number) => (Math.abs(v) > BAR * 1.5 ? Math.abs(v) - 0.01 : Math.abs(v) * 0.6);
  kit.add(box(k(s.x), k(s.y), k(s.z)), "gline", m, 0, undefined, order - 1);
}

/* ── the slabs: plates and side panels ────────────────────────────────────────────────────────────────────────────────────────────────────── */
/** a rounded-free rectangle with a round hole, extruded along the slab's thin axis; the hole's wall a green tube (the top plate's goes on down as
 *  the collar) */
export function buildSlab(lib: Lib, s: Slab, collar = 0) {
  const kit = new Kit(lib);
  const ax = s.axis, a = ax === 0 ? 2 : 0, b = ax === 1 ? 2 : 1;   // the two in-plane axes (shape x, shape y)
  const ha = s.h.getComponent(a), hb = s.h.getComponent(b), t = s.h.getComponent(ax) * 2;
  const ca = s.c.getComponent(a), cb = s.c.getComponent(b);
  // the hole, in the slab's own plane coordinates
  const [h1, h2, r] = s.hole;
  const sh = new THREE.Shape();
  sh.moveTo(-ha, -hb); sh.lineTo(ha, -hb); sh.lineTo(ha, hb); sh.lineTo(-ha, hb); sh.closePath();
  const hp = new THREE.Path(); hp.absarc(h1 - ca, h2 - cb, r, 0, Math.PI * 2, true); sh.holes.push(hp);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 40 }).translate(0, 0, -t / 2);
  // shape (x, y, z) → world axes (a, b, ax); when that basis mirrors, mirror the extrusion first (two mirrors keep the faces' winding)
  const e = [V(1, 0, 0), V(0, 1, 0), V(0, 0, 1)];
  const m = new THREE.Matrix4().makeBasis(e[a], e[b], e[ax]);
  if (m.determinant() < 0) geo.scale(1, 1, -1);
  geo.applyMatrix4(m);
  kit.add(geo, "slab", s.c, 25, undefined, 6);
  // the hole's wall, green: a tube through the slab (and down as the collar)
  const tube = new THREE.CylinderGeometry(r, r, t + collar, 40, 1, true);
  const tubePos = s.c.clone(); tubePos.setComponent(a, h1); tubePos.setComponent(b, h2);
  if (ax === 1) { tubePos.y = s.c.y - collar / 2; kit.add(tube, "green", tubePos, 0, undefined, 5); }
  else kit.add(tube, "green", tubePos, 0, new THREE.Euler(ax === 2 ? Math.PI / 2 : 0, 0, ax === 0 ? Math.PI / 2 : 0), 5);
  return kit.done(s.c.clone());
}

/* ── the back frames (B1 left: the plane x = BACK.at; B2 right: z = BACK.at) ──────────────────────────────────────────────────────────────── */
/** two posts, a top and a bottom rail (glass bars with their green cores), and the sheet between them (the data wall) */
export function buildBack(lib: Lib, side: 0 | 1) {
  const kit = new Kit(lib), h = BAR / 2, { at, p0, p1, y0, y1 } = BACK;
  // (u along the frame, y) → world
  const P = (u: number, y: number, d = 0) => (side === 0 ? V(at + d, y, u) : V(u, y, at + d));
  const C = (u0: number, ya: number, u1: number, yb: number) => {
    const a = P(Math.min(u0, u1), ya, -h), b = P(Math.max(u0, u1), yb, h);
    return [V(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.min(a.z, b.z)), V(Math.max(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z))] as const;
  };
  for (const u of [p0, p1]) { const [a, b] = C(u - h, y0, u + h, y1); bar(kit, a, b); }
  for (const [ya, yb] of [[y1 - BAR, y1], [y0, y0 + BAR]]) { const [a, b] = C(p1 + h, ya, p0 - h, yb); bar(kit, a, b); }
  // the sheet between them (the data wall): faces the camera (+x for the left frame, +z for the right)
  const w = p0 - p1 - BAR, hgt = y1 - y0 - 2 * BAR;
  kit.add(new THREE.PlaneGeometry(w, hgt), "wall", P((p0 + p1) / 2, (y0 + y1) / 2), 0, new THREE.Euler(0, side === 0 ? Math.PI / 2 : 0, 0), 1);
  const p = kit.done();
  const wall = p.g.children.find((o) => o.userData.kind === "wall") as THREE.Mesh;
  return { p, wall, side };
}

/* ── the core ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
/** the frame: twelve glass bars (green cores), faint glass faces at the back and the bottom (the deep glass), the fins, the rod, the ghost cube and
 *  the ring */
export function buildCoreFrame(lib: Lib) {
  const kit = new Kit(lib), { h, y0, y1 } = CORE, b = BAR;
  // verticals at the four corners
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const a = V(x * h - (x > 0 ? b : 0), y0, z * h - (z > 0 ? b : 0)), c = a.clone().add(V(b, y1 - y0, b));
    bar(kit, a, c, 4);
  }
  // horizontals, top and bottom, along x and z (between the verticals)
  for (const y of [y0, y1 - b]) {
    for (const z of [-1, 1]) bar(kit, V(-h + b, y, z * h - (z > 0 ? b : 0)), V(h - b, y + b, z * h - (z > 0 ? b : 0) + b), 4);
    for (const x of [-1, 1]) bar(kit, V(x * h - (x > 0 ? b : 0), y, -h + b), V(x * h - (x > 0 ? b : 0) + b, y + b, h - b), 4);
  }
  // the deep glass: the back faces and the floor of the core, faint
  const fy = (y0 + y1) / 2, fh = y1 - y0 - 2 * b, fw = 2 * (h - b);
  kit.add(new THREE.PlaneGeometry(fw, fh).rotateY(Math.PI / 2), "face", V(-h + b / 2, fy, 0), 0, undefined, 2);
  kit.add(new THREE.PlaneGeometry(fw, fh), "face", V(0, fy, -h + b / 2), 0, undefined, 2);
  kit.add(new THREE.PlaneGeometry(fw, fw).rotateX(-Math.PI / 2), "face", V(0, y0 + b / 2, 0), 0, undefined, 2);
  // the fins: L-shaped glass blades left (plane x) and right (plane z) of the cube
  const fin = (side: 0 | 1) => {
    const P = (x: number, y: number, z: number) => (side === 0 ? V(x, y, z) : V(z, y, x));
    const t = 0.0845, yb = -1.388, yt = 1.23;
    const leg = [P(-1.05, yb, 0.893), P(-1.05 + t, yt, 1.062)], arm = [P(-1.05, yt - t, 0.555), P(-1.05 + t, yt, 0.893)];
    for (const [a, c] of [leg, arm]) span(kit, V(Math.min(a.x, c.x), a.y, Math.min(a.z, c.z)), V(Math.max(a.x, c.x), c.y, Math.max(a.z, c.z)), "ghost", 25, 5);
  };
  fin(0); fin(1);
  // the rod: from the cube's top up through the frame's top, its cap
  const rw = 0.0845;
  span(kit, V(-rw / 2, CUBE / 2 - 0.04, -rw / 2), V(rw / 2, 2.746, rw / 2), "ghost", 25, 5);
  kit.add(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16), "ink", V(0, 2.756, 0), 0);
  // the ghost cube (C5): faint, outlined
  kit.add(box(0.76, 0.76, 0.76), "ghost", V(0.577, 2.9, 0.239), 25, undefined, 5);
  // the ring (C6): a thin glass ring standing in a plane x
  kit.add(new THREE.TorusGeometry(0.3, 0.035, 10, 40).rotateY(Math.PI / 2), "green", V(0.665, 2.35, 0.134), 0, undefined, 5);
  const p = kit.done(V(0, (y0 + y1) / 2, 0));
  p.lineK = 0.85;
  return p;
}
/** a white cube (the central one: kind "core", it takes the caustics; the small ones) */
export function buildCube(lib: Lib, s: number, at: THREE.Vector3, kind: MatKind = "white") {
  const kit = new Kit(lib); kit.add(box(s, s, s), kind, at, 30); return kit.done(at.clone());
}

/* ── the guides ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
/** a dotted segment: from its anchor a (where it retracts to) to b, n dots; kind 0 a guide's fine dots, 1 a black dot (n = 1), 2 a floor dot */
export type Dot = { a: THREE.Vector3; b: THREE.Vector3; n: number; k: 0 | 1 | 2 };
const mirror = (v: THREE.Vector3) => V(v.z, v.y, v.x);
export function guides(): Dot[] {
  const out: Dot[] = [];
  const seg = (a: THREE.Vector3, b: THREE.Vector3, step = 0.113) => out.push({ a, b, n: Math.max(2, Math.round(a.distanceTo(b) / step) + 1), k: 0 });
  const dot = (p: THREE.Vector3) => out.push({ a: p, b: p, n: 1, k: 1 });
  const F = FLOOR.y;
  // the axis: up from the cube to the top edge, down from it to the floor's centre, then on along the floor's diagonal to the front
  seg(V(0, 0.8, 0), V(0, 8.75, 0)); seg(V(0, -0.8, 0), V(0, F, 0)); seg(V(0, F, 0), V(3.98, F, 3.98));
  dot(V(0, 7.363, 0)); dot(V(0, 5.533, 0)); dot(V(1.548, F, 1.548));
  // each side (the right is the left mirrored)
  for (const m of [false, true]) {
    const M = (v: THREE.Vector3) => (m ? mirror(v) : v);
    seg(M(V(-3.719, F, 3.883)), M(V(-3.719, 3.038, 3.883)));                // the outer post
    seg(M(V(-3.719, 3.038, 2.02)), M(V(-3.719, 3.038, 3.883)));              // across to the inner one
    seg(M(V(-3.719, 2.02, 2.02)), M(V(-3.719, 4.73, 2.02)));                 // the inner post, up
    seg(M(V(-3.719, 2.02, 2.02)), M(V(-3.719, -4.04, 2.02)));                // and down
    seg(M(V(-2.027, 2.02, 2.02)), M(V(-3.719, 2.02, 2.02)));                 // from the core's corner out to it
    seg(M(V(-1.95, 0.17, 1.36)), M(V(-1.95, 0.17, 3.22)), 0.31);             // the small cube's line
    dot(M(V(-3.719, 3.038, 3.883))); dot(M(V(-3.719, 3.038, 2.02))); dot(M(V(-3.719, 2.02, 2.02))); dot(M(V(-3.719, -4.04, 2.02)));
  }
  // the floor's dots: its four edges and two rows in front
  const H = FLOOR.h;
  for (let i = 0; i <= 8; i++) {
    const u = -H + (i / 8) * 2 * H;
    for (const p of [V(-H, F, u), V(H, F, u), V(u, F, -H), V(u, F, H), V(3.67, F, u), V(u, F, 3.67)]) {
      if (!out.some((d) => d.k === 2 && d.a.distanceTo(p) < 0.1)) out.push({ a: V(0, F, 0), b: p, n: 1, k: 2 });
    }
  }
  return out;
}
/** the floor's black discs (where guides meet it) */
export const DISCS = [V(4.05, FLOOR.y, 4.05), V(-3.719, FLOOR.y, 3.883), V(3.883, FLOOR.y, -3.719)];
