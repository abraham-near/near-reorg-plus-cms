// Hero study "Pillar B"'s geometry: the drawing of Figma node 1120:6520 (public/hero-private/pillar.svg) measured into a 3-D model. Units: one world
// unit along a floor axis (or up) is 100 of the drawing's px in its isometric; the origin is the drawing's point (1226.1, 1097) on the floor (y = 0),
// the column's axis. World +X runs down-right in the drawing, +Z down-left, +Y up (so the camera at rest looks from +X +Y +Z).
// Every piece is a group of meshes plus one set of fat outlines (its hard edges), made by `Kit`. The scene (./scene.ts) moves the groups.
import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export const F = { x: 1226.1, y: 1097 };
/** a point of the drawing (sx, sy) placed at height y: the world point that projects there in the isometric */
export function fromDrawing(sx: number, sy: number, y: number) {
  const u = (sx - F.x) / 86.6, v = (sy - F.y + 100 * y) / 50;
  return new THREE.Vector3((u + v) / 2, y, (v - u) / 2);
}

/* ── the measures ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export const COL = 0.88;                     // the column's side
export const A = 4.04;                       // the frame: its corners' centres at (±A, ±A)
export const YC = 0.32;                      // the frame's mid height (tubes 0.68 tall, from the floor)
export const TUBE = { w: 0.95, h: 0.68 };
export const BUBBLE = { s: 2.79, h: 2.07, y: 0.21, r: 0.36 };
export const COLLAR = { y0: 1.53, y1: 1.78, s: 1.11 };
export const SAT_Y = 0.4;                    // the satellites' and the dotted lines' height
/** the satellites: drawing bbox [x, y, w, h], their kind */
export const SATS: [string, number, number, number, number, "cap" | "cube" | "window" | "chamfer" | "leaf"][] = [
  ["D1", 419, 525, 130, 126, "cap"], ["D2", 641, 661, 51, 69, "leaf"], ["D5", 1760, 549, 40, 48, "cube"], ["D4", 1868, 423, 130, 126, "cap"],
  ["D7", 1778, 697, 51, 77, "leaf"], ["D6", 1903, 586, 106, 126, "window"], ["D10", 612, 1391, 51, 59, "leaf"], ["D9", 412, 1484, 84, 112, "chamfer"],
  ["D13", 1802, 1377, 51, 77, "leaf"], ["D12", 1966, 1481, 52, 62, "cube"],
];
/** the dotted rows to the satellites: drawing [x1, y1, x2, y2, dots], from the frame outward */
export const DOTS: [number, number, number, number, number][] = [
  [791.5, 763.5, 723.5, 724.2, 3], [621.5, 665.2, 553.5, 625.8, 3], [1579.5, 687.8, 1756.2, 585.8, 6], [1826.8, 545, 1862.2, 524.7, 2],
  [1745.3, 768.9, 1890.5, 685, 3], [730.3, 1375.3, 693.8, 1396.5, 2], [584.2, 1459.7, 511.1, 1501.8, 3], [1727.2, 1357.9, 1798.7, 1399.3, 3],
  [1870.2, 1440.5, 1941.8, 1481.9, 3],
];
/** the grey guides: three floor lines off the corners, five verticals (drawing [x1, y1, x2, y2, dots]) */
export const GUIDES: [number, number, number, number, number][] = [
  [378.1, 1136.7, 1.1, 919, 49], [2074.1, 1136.7, 2451.1, 919, 49], [1438.2, 1503.9, 1814.9, 1721.5, 49],
  [448.7, 1177.4, 448.7, 1507.9, 37], [1956.3, 987, 1956.3, 681, 34], [1779.7, 888.5, 1779.7, 585.9, 34], [1991.7, 1184.3, 1991.7, 1493, 35],
  [2074.1, 1136.7, 2074.1, 1510.7, 42],
];

/* ── materials ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export type Mats = ReturnType<typeof materials>;
export function materials() {
  const solid = (color: string) => new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  return {
    white: solid("#ffffff"),
    dim: solid("#d9d6d2"),                           // slots, windows, recesses
    screw: solid("#e7e5e2"),
    core: solid("#e2f3ec"),                          // the core, seen through the bubble's tint
    green: new THREE.MeshLambertMaterial({ color: "#00e795", emissive: "#00dc8d", emissiveIntensity: 0, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
    glass: () => new THREE.MeshLambertMaterial({ color: "#00dc8d", transparent: true, opacity: 0.13, depthWrite: false, side: THREE.DoubleSide }),
    gline: () => new THREE.MeshBasicMaterial({ color: "#00dc8d", transparent: true, opacity: 0.75, depthWrite: false }),
  };
}

/* ── a piece: meshes and their outlines ───────────────────────────────────────────────────────────────────────────────────────────────────── */
export class Kit {
  g = new THREE.Group();
  private segs: number[] = [];
  /** adds a mesh (placed by pos / rot) and, unless `edges` is 0, its edges sharper than `edges` degrees to the outline */
  add(geo: THREE.BufferGeometry, mat: THREE.Material, pos?: THREE.Vector3 | [number, number, number], edges = 25, rot?: THREE.Euler) {
    const m = new THREE.Mesh(geo, mat);
    if (pos) m.position.copy(Array.isArray(pos) ? new THREE.Vector3(...pos) : pos);
    if (rot) m.rotation.copy(rot);
    m.updateMatrix(); this.g.add(m);
    if (edges) {
      const e = new THREE.EdgesGeometry(geo, edges), p = e.attributes.position as THREE.BufferAttribute, v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m.matrix); this.segs.push(v.x, v.y, v.z); }
      e.dispose();
    }
    return m;
  }
  done(line: LineMaterial) {
    if (this.segs.length) {
      const lg = new LineSegmentsGeometry(); lg.setPositions(this.segs);
      const l = new LineSegments2(lg, line); l.renderOrder = 2; this.g.add(l);
    }
    this.segs = [];
    return this.g;
  }
}

/* ── shapes ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
/** a square prism with chamfered vertical edges, from y0 to y1 */
export function prism(s: number, y0: number, y1: number, c = 0.045) {
  const h = s / 2, sh = new THREE.Shape();
  sh.moveTo(-h + c, -h); sh.lineTo(h - c, -h); sh.lineTo(h, -h + c); sh.lineTo(h, h - c); sh.lineTo(h - c, h); sh.lineTo(-h + c, h); sh.lineTo(-h, h - c); sh.lineTo(-h, -h + c); sh.closePath();
  return new THREE.ExtrudeGeometry(sh, { depth: y1 - y0, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, y0, 0);
}
/** an L block (a frame corner): legs `reach` long along local +x and +y (shape space), `w` wide, `h` tall, its outer corner rounded */
function cornerGeo(reach: number, w: number, h: number, r: number) {
  const a = w / 2, sh = new THREE.Shape();
  sh.moveTo(reach, -a); sh.lineTo(-a + r, -a); sh.absarc(-a + r, -a + r, r, -Math.PI / 2, -Math.PI, true);
  sh.lineTo(-a, reach); sh.lineTo(a, reach); sh.lineTo(a, a + 0.08); sh.absarc(a + 0.08, a + 0.08, 0.08, Math.PI, Math.PI * 1.5, false); sh.lineTo(reach, a); sh.closePath();
  return new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 10 }).rotateX(-Math.PI / 2).translate(0, -h / 2, 0);
}
/** a quarter disc (the satellites' glass leaves) of radius r, thickness t, centred on its own middle */
function leafGeo(r: number, t: number) {
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(r, 0); sh.absarc(0, 0, r, 0, Math.PI / 2, false); sh.closePath();
  return new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 12 }).translate(-r / 2, -r / 2, -t / 2);
}
/** a cap: a cube with a slot down one side */
function capGeo(s: number) {
  const h = s / 2, n = s * 0.24, d = s * 0.42, sh = new THREE.Shape();
  sh.moveTo(-h, -h); sh.lineTo(h, -h); sh.lineTo(h, h); sh.lineTo(n, h); sh.lineTo(n, h - d); sh.lineTo(-n, h - d); sh.lineTo(-n, h); sh.lineTo(-h, h); sh.closePath();
  return new THREE.ExtrudeGeometry(sh, { depth: s, bevelEnabled: false }).translate(0, 0, -h);
}
/** a cube with one edge chamfered */
function chamferGeo(s: number) {
  const h = s / 2, c = s * 0.34, sh = new THREE.Shape();
  sh.moveTo(-h, -h); sh.lineTo(h, -h); sh.lineTo(h, h - c); sh.lineTo(h - c, h); sh.lineTo(-h, h); sh.closePath();
  return new THREE.ExtrudeGeometry(sh, { depth: s, bevelEnabled: false }).translate(0, 0, -h);
}
const box = (x: number, y: number, z: number) => new THREE.BoxGeometry(x, y, z);

/* ── the column ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export type Seg = { g: THREE.Group; k: number; dir: 1 | -1; cy: number };
/** the column's segments above the core (dir 1) and below it (dir -1), k counting from the core; each a body with its neck */
export function buildColumn(m: Mats, line: LineMaterial, reach = 46): Seg[] {
  const out: Seg[] = [];
  const seg = (y0: number, y1: number, neck: [number, number] | null, k: number, dir: 1 | -1, extra?: (kit: Kit) => void) => {
    const kit = new Kit();
    kit.add(prism(COL, y0, y1), m.white);
    if (neck) kit.add(prism(0.75, neck[0], neck[1], 0.04), m.white);
    // a screw near the bottom of the body's left face (+Z)
    if (y1 - y0 > 1.5) kit.add(new THREE.CylinderGeometry(0.055, 0.055, 0.03, 14).rotateX(Math.PI / 2), m.screw, [-0.17, (dir > 0 ? y0 : y0) + 0.28, COL / 2 + 0.012], 30);
    extra?.(kit);
    out.push({ g: kit.done(line), k, dir, cy: (y0 + y1) / 2 });
  };
  // above: a short body over the collar, the slotted body, then bodies of 2.38 every 2.64
  seg(1.6, 2.66, [2.66, 2.94], 0, 1);
  seg(2.94, 4.84, [4.84, 5.12], 1, 1, (kit) => {
    for (const [x, z, ry] of [[-0.03, COL / 2 + 0.006, 0], [COL / 2 + 0.006, -0.03, Math.PI / 2]] as const)
      kit.add(new THREE.BoxGeometry(0.13, 1.3, 0.012), m.dim, [x, 3.78, z], 30, new THREE.Euler(0, ry, 0));
  });
  seg(5.12, 7.02, [7.02, 7.29], 2, 1);
  for (let k = 3, y = 7.29; y < reach; k++, y += 2.64) seg(y, y + 2.38, [y + 2.38, y + 2.64], k, 1);
  // below: the neck under the core, a long body, then bodies of 1.9 every 2.16
  seg(-6.04, -1.35, [-1.35, -1.21], 0, -1);
  for (let k = 1, y = -6.04; y > -reach; k++, y -= 2.16) seg(y - 2.16, y - 0.26, [y - 0.26, y], k, -1);
  return out;
}

/* ── the core, the collar, the bubble, the rods ───────────────────────────────────────────────────────────────────────────────────────────── */
export function buildCore(m: Mats, line: LineMaterial) {
  const kit = new Kit();
  const tiers: [number, number, number][] = [[1.9, -1.21, -1.07], [1.6, -1.07, -0.82], [1.25, -0.82, 0.34], [1.45, 0.34, 0.5], [0.98, 0.5, 1.02], [0.7, 1.02, 1.32]];
  for (const [s, y0, y1] of tiers) kit.add(prism(s, y0, y1, 0.05), m.core);
  // the body's framed panels (front faces) and its corner posts
  for (const [x, z, ry] of [[0, 0.626, 0], [0.626, 0, Math.PI / 2]] as const) {
    kit.add(box(0.72, 0.78, 0.02), m.dim, [x, -0.24, z], 30, new THREE.Euler(0, ry, 0));
    kit.add(box(0.44, 0.5, 0.03), m.core, [x * 1.02, -0.24, z * 1.02], 30, new THREE.Euler(0, ry, 0));
  }
  for (const [x, z] of [[0.56, 0.56], [-0.56, 0.56], [0.56, -0.56]]) kit.add(box(0.16, 1.16, 0.16), m.core, [x, -0.24, z]);
  return kit.done(line);
}
export function buildCollar(m: Mats, line: LineMaterial) {
  const kit = new Kit(); kit.add(prism(COLLAR.s, COLLAR.y0, COLLAR.y1, 0.06), m.green); return kit.done(line);
}
export function buildBubble(glass: THREE.Material, rim: THREE.Material) {
  const g = new THREE.Group();
  const geo = new RoundedBoxGeometry(BUBBLE.s, BUBBLE.h, BUBBLE.s, 5, BUBBLE.r);
  const mesh = new THREE.Mesh(geo, glass); mesh.renderOrder = 3; g.add(mesh);
  // the meridians: green rounded loops round the bubble (one level, two upright)
  const loop = (w: number, h: number, r: number) => {
    const sh = new THREE.Shape(), a = w / 2, b = h / 2;
    sh.moveTo(-a + r, -b); sh.lineTo(a - r, -b); sh.absarc(a - r, -b + r, r, -Math.PI / 2, 0, false); sh.lineTo(a, b - r); sh.absarc(a - r, b - r, r, 0, Math.PI / 2, false);
    sh.lineTo(-a + r, b); sh.absarc(-a + r, b - r, r, Math.PI / 2, Math.PI, false); sh.lineTo(-a, -b + r); sh.absarc(-a + r, -b + r, r, Math.PI, Math.PI * 1.5, false);
    return new THREE.BufferGeometry().setFromPoints(sh.getPoints(16).map((p) => new THREE.Vector3(p.x, p.y, 0)));
  };
  const l1 = new THREE.LineLoop(loop(BUBBLE.s * 0.98, BUBBLE.s * 0.98, BUBBLE.r), rim); l1.rotation.x = Math.PI / 2;
  const l2 = new THREE.LineLoop(loop(BUBBLE.s * 0.98, BUBBLE.h * 0.98, BUBBLE.r), rim);
  const l3 = new THREE.LineLoop(loop(BUBBLE.s * 0.98, BUBBLE.h * 0.98, BUBBLE.r), rim); l3.rotation.y = Math.PI / 2;
  for (const l of [l1, l2, l3]) { l.renderOrder = 3; g.add(l); }
  g.position.y = BUBBLE.y;
  return { g, mesh };
}
export function buildRods(glass: THREE.Material, line: LineMaterial) {
  const kit = new Kit();
  for (const [x, z] of [[-1.33, 1.33], [1.33, -1.33]]) kit.add(box(0.15, 0.82, 0.15), glass, [x, -1.39, z]);
  return kit.done(line);
}

/* ── the frame ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export type FramePiece = { g: THREE.Group; kind: "corner" | "glass" | "solid" | "clamp"; out: THREE.Vector3; arm: number; j: number; glass?: THREE.MeshLambertMaterial; gline?: THREE.MeshBasicMaterial; along?: [THREE.Vector3, THREE.Vector3] };
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
/** the four corners (left, back, right, front) and the four arms, each arm from its small corner: glass, clamp, then glass or solid */
export function buildFrame(m: Mats, line: LineMaterial) {
  const pieces: FramePiece[] = [];
  const corners: [THREE.Vector3, THREE.Vector3, THREE.Vector3, number][] = [
    [V(-A, YC, A), V(0, 0, -1), V(1, 0, 0), 0.97], [V(-A, YC, -A), V(1, 0, 0), V(0, 0, 1), 1.68],
    [V(A, YC, -A), V(-1, 0, 0), V(0, 0, 1), 0.97], [V(A, YC, A), V(-1, 0, 0), V(0, 0, -1), 1.68],
  ];
  for (const [c, dA, dB, reach] of corners) {
    const kit = new Kit(), w = 1.12, h = 0.84;
    const geo = cornerGeo(reach + w / 2 - 0.02, w, h, 0.5);
    // local shape x → dA, shape y → dB (after the extrusion's turn, shape y lies along −Z)
    // (the L is symmetric: when that basis would mirror it, the legs swap, so the faces keep their winding)
    const basis = new THREE.Matrix4().makeBasis(dA, V(0, 1, 0), dB.clone().negate());
    geo.applyMatrix4(basis.determinant() > 0 ? basis : new THREE.Matrix4().makeBasis(dB, V(0, 1, 0), dA.clone().negate()));
    kit.add(geo, m.white, c, 20);
    // screws on the top
    for (const [p, q] of [[0.25, -0.25], [-0.25, 0.25], [0.6, -0.1], [-0.1, 0.6]]) {
      const pos = c.clone().addScaledVector(dA, p + 0.15).addScaledVector(dB, q + 0.15).setY(YC + h / 2 + 0.012);
      if (reach > 1.2 || Math.abs(p) < 0.5) kit.add(new THREE.CylinderGeometry(0.055, 0.055, 0.025, 14), m.screw, pos, 30);
    }
    pieces.push({ g: kit.done(line), kind: "corner", out: c.clone().setY(0).normalize(), arm: -1, j: 0 });
  }
  // arms: [small corner, big corner, outward normal, second piece glass?]
  const arms: [THREE.Vector3, THREE.Vector3, THREE.Vector3, boolean][] = [
    [V(A, YC, -A), V(-A, YC, -A), V(0, 0, -1), true],   // back right: from the right corner to the back one
    [V(A, YC, -A), V(A, YC, A), V(1, 0, 0), false],     // front right
    [V(-A, YC, A), V(A, YC, A), V(0, 0, 1), false],     // front left
    [V(-A, YC, A), V(-A, YC, -A), V(-1, 0, 0), false],  // back left
  ];
  arms.forEach(([S, L, n, glass2], a) => {
    const d = L.clone().sub(S).normalize();
    const ry = Math.atan2(d.x, d.z);                     // a box's local z along the arm
    const at = (t: number) => S.clone().addScaledVector(d, t);
    const part = (t0: number, t1: number, kind: "glass" | "solid" | "clamp", j: number) => {
      const kit = new Kit(), len = t1 - t0, mid = at((t0 + t1) / 2), rot = new THREE.Euler(0, ry, 0);
      let glass: THREE.MeshLambertMaterial | undefined, gline: THREE.MeshBasicMaterial | undefined;
      if (kind === "glass") {
        glass = m.glass(); gline = m.gline();
        kit.add(box(TUBE.w, TUBE.h, len - 0.02), glass, mid, 25, rot).renderOrder = 3;
        // the inner green line: along the bottom, on the outer side
        const lp = mid.clone().addScaledVector(n, TUBE.w / 2 - 0.09).setY(YC - TUBE.h / 2 + 0.03);
        kit.add(box(0.1, 0.025, len - 0.06), gline, lp, 0, rot).renderOrder = 4;
      } else if (kind === "solid") {
        kit.add(box(TUBE.w, TUBE.h, len - 0.02), m.white, mid, 25, rot);
      } else {
        kit.add(box(1.2, 0.92, len - 0.16), m.white, mid, 25, rot);
        for (const f of [-1, 1]) kit.add(box(1.25, 0.97, 0.08), m.white, mid.clone().addScaledVector(d, f * (len / 2 - 0.06)), 25, rot);
        // a slot along its outer face
        kit.add(box(0.03, 0.14, len * 0.5), m.dim, mid.clone().addScaledVector(n, 0.61).setY(YC + 0.12), 30, rot);
        // the back arms' clamps carry a glass fin in toward the bubble (B17, B18)
        if (a === 0 || a === 3) {
          glass = m.glass();
          const fin = mid.clone().addScaledVector(n, -1.5).setY(0.39);
          kit.add(box(0.12, 1.22, 2.04), glass, fin, 25, new THREE.Euler(0, ry + Math.PI / 2, 0)).renderOrder = 3;
        }
      }
      pieces.push({ g: kit.done(line), kind, out: n.clone(), arm: a, j, glass, gline, along: [at(t0 - 0.2), at(t1 + 0.2)] });
    };
    part(0.97 + 0.02, 3.14, "glass", 0);
    part(3.14, 4.24, "clamp", 2);
    part(4.24, 6.4 - 0.02, glass2 ? "glass" : "solid", 1);
  });
  return pieces;
}

/* ── the satellites ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export function buildSat(kind: (typeof SATS)[number][5], w: number, dir: THREE.Vector3, m: Mats, line: LineMaterial) {
  const kit = new Kit(), s = w / 173.2;
  if (kind === "cube") kit.add(box(s, s, s), m.white);
  if (kind === "cap") kit.add(capGeo(s), m.white);
  if (kind === "chamfer") kit.add(chamferGeo(s), m.white, undefined, 25, new THREE.Euler(0, Math.PI / 2, 0));
  if (kind === "window") {
    kit.add(box(s, s, s), m.white);
    kit.add(box(s * 0.56, s * 0.56, 0.02), m.dim, [0, 0, s / 2 + 0.005]);
    kit.add(box(s * 0.32, s * 0.32, 0.03), m.white, [0, 0, s / 2 + 0.01]);
  }
  if (kind === "leaf") {
    const glass = m.glass(); glass.opacity = 0.2;
    // standing, facing along its dotted row
    kit.add(leafGeo(0.4, 0.09), glass, undefined, 25, new THREE.Euler(0, Math.atan2(dir.x, dir.z), 0)).renderOrder = 3;
  }
  return kit.done(line);
}
