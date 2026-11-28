// Hero study "Pillar B": the pillar (Figma node 1120:6520) rebuilt in three.js (geometry: ./pillar.ts), played in the studies' shared choreography.
// The look: the paper ground (#F5F5F5, the clear colour, no tone mapping); white blocks lit so their three faces take the drawing's three greys
// (#F8F7F7 / #DFDDDA / #CDCAC6); mint glass with a sweeping sheen; the green collar; 1.3 px ink outlines at 0.85 (fat lines, a constant width on
// screen). The canvas covers the whole hero (nothing is ever cut by a box edge); the camera is a perspective one whose field of view at rest is a
// third of a degree from far away, so it IS the drawing's isometric, framed (by a view offset) exactly where study A sits in .hp__art: the frame
// ≈ 79.5 % of the box's width, centred in it; the column runs to the box's top and bottom (clipped to it in screen space, so on phones it doesn't
// run up over the copy; on desktops the box is the hero's full height).
//   1 · Intro (≈ 1.9 s): one soft wave from close by — the camera eases in a short way round and down into the isometric while the column's
//       segments, the core and bubble, the corners, the arms (the clamps last), the rows and guides and the satellites arrive (position and opacity
//       together, expo-out, short staggers); a light pulse through the green parts settles it and the loop takes over from rest.
//   2 · Loop: one 8 s master cycle — inflow (green packets run in from the satellites along the dotted rows), circulation (a packet of light runs
//       once round the frame inside its tubes, each tube's green line brightening as it passes, then fronts of light run down and up the column to
//       the core), charge (the core lifts, the bubble, the collar and a halo glow), release (a ripple runs back out along the rows and the guides;
//       the satellites rise and settle in turn round the frame). Under it: the dots flow slowly, a sheen sweeps the glass, the light and the camera
//       drift by a degree. Runs only on screen with the tab visible.
//   3 · Exit "seal" (setProgress 0 → 1 over the hero's hold; on phones, as the hero scrolls away): to 0.45 everything gathers — the rows draw back in
//       and the satellites fly in along them, the frame contracts round the core, the column telescopes into it from both ends, the bubble closes;
//       0.45 → 0.6 the gathered pillar compresses into one cube that turns green; 0.6 → 0.8 the cube arcs over and shrinks onto the h1's green square
//       (.hp__sq), turning flat as it lands with a soft flash; then only the h1's own square is left. Reversible.
// Intro, loop and scroll add up. DPR ≤ 2; reduced motion: no intro, no loop, a still frame that the scroll only fades.
import * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { A, DOTS, GUIDES, SAT_Y, SATS, YC, buildBubble, buildCollar, buildColumn, buildCore, buildFrame, buildRods, buildSat, fromDrawing, materials } from "./pillar";

export type PillarScene = { setProgress(p: number): void; dispose(): void };

const PX = 100 / Math.sqrt(2 / 3);              // drawing px per camera unit
const ISO_EL = Math.atan(1 / Math.SQRT2);       // true isometric: 35.26° down, 45° round
const REST_FOV = THREE.MathUtils.degToRad(0.35);
const FRAME_W = 1668, SPREAD_H = 1193;          // the frame's width and the satellites' spread, in drawing px
const LOOP_AT = 1.95, CYCLE = 8;                // the loop takes over this long into the intro; its master cycle (s)
const LOCK = 0.36;                              // the exit: the frame contracts to this (round the bubble)
const CORE = new THREE.Vector3(0, 0.2, 0);      // the point everything seals into

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const outExpo = (t: number) => { t = clamp(t); return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); };
const outCubic = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
const sineIO = (t: number) => -(Math.cos(Math.PI * clamp(t)) - 1) / 2;
const p2IO = (t: number) => { t = clamp(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
const win = (t: number, a: number, d: number, e: (x: number) => number = outExpo) => e(clamp((t - a) / d));
/** a bump: 0 before a, up to 1 at m, back to 0 at b (eased both ways) */
const bump = (t: number, a: number, m: number, b: number) => (t < m ? sineIO((t - a) / (m - a)) : 1 - sineIO((t - m) / (b - m)));

/** a soft round glow */
function glowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d")!, g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(225,255,240,1)"); g.addColorStop(0.18, "rgba(90,240,180,0.85)"); g.addColorStop(0.5, "rgba(0,220,141,0.25)"); g.addColorStop(1, "rgba(0,220,141,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** the glass's sheen: a soft band of light that sweeps across the scene (uSheen moves it) */
type Sheen = { uSheen: { value: number } };
function sheen(mat: THREE.MeshLambertMaterial, u: Sheen) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uSheen = u.uSheen;
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vW;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform float uSheen;\nvarying vec3 vW;")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\nfloat sx = dot(vW, vec3(0.62, 0.45, -0.62)) - uSheen; float shn = exp(-sx * sx * 2.2);\n" +
        "totalEmissiveRadiance += vec3(0.55, 1.0, 0.8) * shn * 0.55; diffuseColor.a = min(1.0, diffuseColor.a + shn * 0.12 * step(0.001, diffuseColor.a));");
  };
  mat.customProgramCacheKey = () => "pillar-sheen";
}
/** the column's materials: drawn only between two heights of the canvas (device px from its bottom) */
type Clip = { uClip: { value: THREE.Vector2 } };
function clipped(mat: THREE.Material, u: Clip) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uClip = u.uClip;
    sh.fragmentShader = sh.fragmentShader.replace("void main() {", "uniform vec2 uClip;\nvoid main() {\n  if (gl_FragCoord.y < uClip.x || gl_FragCoord.y > uClip.y) discard;");
  };
  mat.customProgramCacheKey = () => "pillar-clip-" + mat.type;
}

/** a piece's own opacity: its materials cloned (unless they're its own already: userData.own), each set to its level × the piece's fade */
type Fade = { set(o: number): void; o: number };
function fadeable(g: THREE.Object3D, lines: LineMaterial[]): Fade {
  const map = new Map<THREE.Material, THREE.Material>(), list: { m: THREE.Material; base: number; tr: boolean; dw: boolean }[] = [];
  const own = (m: THREE.Material) => {
    if (m.userData.own) { if (!map.has(m)) { map.set(m, m); list.push({ m, base: m.opacity, tr: m.transparent, dw: m.depthWrite }); } return m; }
    let c = map.get(m);
    if (!c) {
      c = m.clone(); (m.userData.fx as ((x: THREE.Material) => void) | undefined)?.(c);
      map.set(m, c); list.push({ m: c, base: c.opacity, tr: c.transparent, dw: c.depthWrite });
      if ((c as LineMaterial).isLineMaterial) lines.push(c as LineMaterial);
    }
    return c;
  };
  g.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.material) return;
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(own) : own(mesh.material);
  });
  const f: Fade = {
    o: 1,
    set(o: number) {
      f.o = o;
      for (const it of list) {
        const lvl = (it.m.userData.level as number | undefined) ?? it.base;
        it.m.opacity = lvl * o;
        const tr = it.tr || o < 0.999;
        if (it.m.transparent !== tr) { it.m.transparent = tr; it.m.needsUpdate = true; }
        it.m.depthWrite = it.dw && o > 0.6;
      }
      g.visible = o > 0.002;
    },
  };
  return f;
}

export function mount(canvas: HTMLCanvasElement, box: HTMLElement, opts: { reduced: boolean }): PillarScene {
  const rm = opts.reduced;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor("#f5f5f5", 1);
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const world = new THREE.Group(); scene.add(world);
  const pillar = new THREE.Group(); world.add(pillar);          // everything that seals into the cube
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const target = new THREE.Vector3();

  /* lights. Lambert divides by π; the ambient 0.45 and the key 0.586 (×π, in linear) give a white block's top / left / right faces the drawing's
     #F8F7F7 / #DFDDDA / #CDCAC6. A fill reaches only the faces the isometric never shows (−X, −Y, −Z). */
  scene.add(new THREE.AmbientLight(0xffffff, 0.45 * Math.PI));
  const key = new THREE.DirectionalLight(0xffffff, 0.586 * Math.PI);
  const KEY = new THREE.Vector3(0.273, 0.834, 0.478).normalize();
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xffffff, 0.42 * Math.PI); fill.position.set(-0.55, -0.6, -0.58); scene.add(fill, fill.target);

  /* materials */
  const m = materials();
  const line = new LineMaterial({ color: 0x111111, linewidth: 1.3, transparent: true, opacity: 0.85, depthWrite: false });
  const lineSoft = new LineMaterial({ color: 0x111111, linewidth: 1.1, transparent: true, opacity: 0.45, depthWrite: false });
  const lineMats: LineMaterial[] = [line, lineSoft];
  const su: Sheen = { uSheen: { value: -99 } };
  const mkGlass = m.glass;
  m.glass = () => { const g = mkGlass(); sheen(g, su); g.userData.own = true; return g; };
  const mkGline = m.gline;
  m.gline = () => { const g = mkGline(); g.userData.own = true; return g; };
  // the column's own materials: clipped to the art box's height on the canvas
  const cu: Clip = { uClip: { value: new THREE.Vector2(-1e5, 1e5) } };
  const cm = materials(), colLine = line.clone();
  for (const mt of [cm.white, cm.screw, cm.dim, colLine] as THREE.Material[]) mt.userData.fx = (c: THREE.Material) => clipped(c, cu);
  colLine.userData.fx = (c: THREE.Material) => clipped(c, cu);

  /* the pieces: each with its own fade */
  const fades: Fade[] = [];
  const fadeOf = (g: THREE.Object3D) => { const f = fadeable(g, lineMats); fades.push(f); return f; };

  const segs = buildColumn(cm, colLine).map((s) => { pillar.add(s.g); return { ...s, f: fadeOf(s.g) }; });
  const collar = buildCollar(m, line); pillar.add(collar); const collarF = fadeOf(collar);
  const collarMat = (collar.children[0] as THREE.Mesh).material as THREE.MeshLambertMaterial;
  const core = buildCore(m, lineSoft); pillar.add(core); const coreF = fadeOf(core);
  const bubbleGlass = m.glass(); bubbleGlass.userData.level = 0.11;
  const rimMat = new THREE.LineBasicMaterial({ color: "#00c47e", transparent: true, opacity: 0.55, depthWrite: false }); rimMat.userData.own = true;
  const bubble = buildBubble(bubbleGlass, rimMat); pillar.add(bubble.g);
  const rodGlass = m.glass(); rodGlass.userData.level = 0.16;
  const rods = buildRods(rodGlass, line); pillar.add(rods); const rodsF = fadeOf(rods);
  // the bubble's outline: its silhouette, redrawn when the view or the bubble moves
  const hullGeo = new LineGeometry(); hullGeo.setPositions(new Array(6 * 3).fill(0));
  const hullMat = line.clone(); lineMats.push(hullMat);
  const hull = new Line2(hullGeo, hullMat); hull.renderOrder = 5; hull.frustumCulled = false; pillar.add(hull);
  const bubbleVerts: THREE.Vector3[] = [];
  {
    const p = bubble.mesh.geometry.attributes.position as THREE.BufferAttribute, seen = new Set<string>();
    for (let i = 0; i < p.count; i++) { const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`; if (!seen.has(k)) { seen.add(k); bubbleVerts.push(new THREE.Vector3().fromBufferAttribute(p, i)); } }
  }
  const glowTex = glowTexture();
  const haloMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
  const halo = new THREE.Sprite(haloMat); halo.scale.setScalar(3.4); halo.position.y = 0.1; halo.renderOrder = 6; pillar.add(halo);

  /* the frame */
  const frame = buildFrame(m, line).map((f) => { pillar.add(f.g); return { ...f, fd: fadeOf(f.g) }; });
  const tubes = frame.filter((f) => f.kind === "glass" && f.along).sort((a, b) => perim(a.along!) - perim(b.along!));
  function perim(ab: [THREE.Vector3, THREE.Vector3]) { const c = ab[0].clone().add(ab[1]).multiplyScalar(0.5); return (Math.atan2(c.x, -c.z) + Math.PI * 2 + 0.6) % (Math.PI * 2); }
  tubes.forEach((f) => { f.glass!.userData.level = 0.13; f.gline!.userData.level = 0.75; });
  frame.forEach((f) => { if (f.glass && !tubes.includes(f)) f.glass.userData.level = 0.13; });

  /* the dotted rows (with the satellites at their far ends) and the grey guides */
  const rows = DOTS.map(([x1, y1, x2, y2, n]) => ({ a: fromDrawing(x1, y1, SAT_Y), b: fromDrawing(x2, y2, SAT_Y), n }));
  const sats = SATS.map(([, x, y, w, h, kind], i) => {
    const pos = fromDrawing(x + w / 2, y + h / 2, SAT_Y);
    const ax = Math.abs(pos.x) > Math.abs(pos.z) ? new THREE.Vector3(Math.sign(pos.x), 0, 0) : new THREE.Vector3(0, 0, Math.sign(pos.z));
    const g = buildSat(kind, w, ax, m, line); g.position.copy(pos); pillar.add(g);
    g.traverse((o) => { const mm = (o as THREE.Mesh).material as THREE.Material | undefined; if (mm?.userData.own && mm.transparent) mm.userData.level = mm.opacity; });
    // its row: the one ending nearest it; it flies in along it to the frame
    let entry = pos.clone().multiplyScalar(0.55), best = 1.3;
    for (const r of rows) for (const e of [r.a, r.b]) { const d = e.distanceTo(pos); if (d < best) { best = d; entry = r.a.clone(); } }
    return { g, f: fadeOf(g), base: pos, out: pos.clone().setY(0).normalize(), entry, ph: i * 1.37, ang: Math.atan2(pos.z, pos.x), i };
  });
  const satTurn = [...sats].sort((a, b) => ((a.ang + 2.1 + Math.PI * 2) % (Math.PI * 2)) - ((b.ang + 2.1 + Math.PI * 2) % (Math.PI * 2)));

  // one point cloud: each dot a point; packets of light run along the rows (in, then out); the guides take the release's ripple
  const pts: { a: THREE.Vector3; b: THREE.Vector3; s: number; step: number; d: number; k: number }[] = [];
  rows.forEach(({ a, b, n }, r) => { const step = 1 / (n - 1); for (let i = -1; i < n; i++) pts.push({ a, b, s: i * step, step, d: 0.62 + r * 0.04, k: 0 }); });
  GUIDES.forEach(([x1, y1, x2, y2, n]) => {
    let a: THREE.Vector3, b: THREE.Vector3;
    if (Math.abs(x1 - x2) > 1) { a = fromDrawing(x1, y1, 0); b = fromDrawing(x2, y2, 0); }          // floor lines off the corners
    else { const lo = Math.max(y1, y2), hi = Math.min(y1, y2); a = fromDrawing(x1, lo, SAT_Y); b = a.clone().setY(SAT_Y + (lo - hi) / 100); }   // verticals
    for (let i = 0; i < n; i++) pts.push({ a, b, s: i / (n - 1), step: 1 / (n - 1), d: 0.55, k: 1 });
  });
  const pg = new THREE.BufferGeometry();
  const f32 = (n: number, f: (i: number, o: Float32Array) => void) => { const o = new Float32Array(pts.length * n); pts.forEach((_, i) => f(i, o)); return o; };
  pg.setAttribute("position", new THREE.BufferAttribute(f32(3, (i, o) => { o.set(pts[i].a.toArray(), i * 3); }), 3));
  pg.setAttribute("aA", new THREE.BufferAttribute(f32(3, (i, o) => { o.set(pts[i].a.toArray(), i * 3); }), 3));
  pg.setAttribute("aB", new THREE.BufferAttribute(f32(3, (i, o) => { o.set(pts[i].b.toArray(), i * 3); }), 3));
  pg.setAttribute("aS", new THREE.BufferAttribute(f32(1, (i, o) => { o[i] = pts[i].s; }), 1));
  pg.setAttribute("aStep", new THREE.BufferAttribute(f32(1, (i, o) => { o[i] = pts[i].step; }), 1));
  pg.setAttribute("aD", new THREE.BufferAttribute(f32(1, (i, o) => { o[i] = pts[i].d; }), 1));
  pg.setAttribute("aK", new THREE.BufferAttribute(f32(1, (i, o) => { o[i] = pts[i].k; }), 1));
  const dotMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {
      uFlow: { value: 0 }, uR: { value: rm ? 99 : 0 }, uSize: { value: 0.3 }, uFade: { value: 1 }, uRet: { value: 0 },
      uIn: { value: -9 }, uOut: { value: -9 }, uOutG: { value: -9 },
    },
    vertexShader: `uniform float uFlow, uR, uSize, uFade, uRet, uIn, uOut, uOutG;
      attribute vec3 aA, aB; attribute float aS, aStep, aD, aK;
      varying float vA, vG, vK;
      void main(){
        float s = aS + (aK < 0.5 ? uFlow * aStep : 0.0);
        vec3 p = mix(aA, aB, s);
        float on = smoothstep(aD + max(s, 0.0) * 0.45, aD + max(s, 0.0) * 0.45 + 0.08, uR) * (1.0 - smoothstep(1.0 - uRet - 0.02, 1.0 - uRet + 0.02, s));
        float ends = aK < 0.5 ? smoothstep(-0.001, aStep * 0.8, s) * (1.0 - smoothstep(1.0, 1.0 + aStep * 0.8, s)) : 1.0;
        float g = aK < 0.5 ? exp(-pow((s - uIn) * 4.5, 2.0)) + exp(-pow((s - uOut) * 4.5, 2.0)) : exp(-pow((s - uOutG) * 6.0, 2.0)) * 0.8;
        vA = on * ends * uFade; vG = g; vK = aK;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * (aK < 0.5 ? 15.0 * (1.0 + g * 0.5) : 3.6 * (1.0 + g * 0.8));
      }`,
    // sRGB written straight (no conversion here): ink dots, green where a packet passes; the guides faint
    fragmentShader: `varying float vA, vG, vK;
      void main(){
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = smoothstep(1.0, 0.72, d) * vA * (vK > 0.5 ? 0.6 + vG * 0.4 : 0.88);
        if (a < 0.01) discard;
        gl_FragColor = vec4(mix(vec3(0.067), vec3(0.0, 0.86, 0.553), clamp(vG * 1.4, 0.0, 1.0)), a);
      }`,
  });
  const dots = new THREE.Points(pg, dotMat); dots.frustumCulled = false; dots.renderOrder = 4; pillar.add(dots);

  /* the energy: a packet round the frame (inside its tubes); fronts of light along the column's front edge */
  const packMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const packet = new THREE.Sprite(packMat); packet.scale.setScalar(1.3); packet.renderOrder = 7; pillar.add(packet);
  const corners = [new THREE.Vector3(-A, YC - 0.1, -A), new THREE.Vector3(A, YC - 0.1, -A), new THREE.Vector3(A, YC - 0.1, A), new THREE.Vector3(-A, YC - 0.1, A)];
  const onFrame = (u: number, out: THREE.Vector3) => { u = ((u % 1) + 1) % 1; const i = Math.floor(u * 4), f = u * 4 - i; return out.lerpVectors(corners[i], corners[(i + 1) % 4], f); };
  const stripMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uU: { value: 99 }, uL: { value: -99 }, uO: { value: 0 } },
    vertexShader: "varying float vY; void main(){ vY = (modelMatrix * vec4(position, 1.0)).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform float uU, uL, uO; varying float vY; void main(){ float p = exp(-pow((vY - uU) * 0.9, 2.0)) + exp(-pow((vY - uL) * 0.9, 2.0));" +
      " gl_FragColor = vec4(vec3(0.15, 0.95, 0.62) * p * uO, 1.0); }",
  });
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 96, 0.05), stripMat);
  strip.position.set(0.415, 0, 0.415); strip.renderOrder = 6; pillar.add(strip);

  /* the seal: the cube the pillar compresses into, the flat square it becomes on landing, the flash */
  const cubeMat = new THREE.MeshLambertMaterial({ color: "#ffffff", transparent: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
  const cubeLineMat = line.clone(); lineMats.push(cubeLineMat);
  const cubeLg = new LineSegmentsGeometry(); { const e = new THREE.EdgesGeometry(cubeGeo); cubeLg.setPositions(Array.from(e.attributes.position.array)); e.dispose(); }
  const cube = new THREE.Group(); cube.add(new THREE.Mesh(cubeGeo, cubeMat), new LineSegments2(cubeLg, cubeLineMat)); cube.visible = false; world.add(cube);
  const sq = box.closest(".hp")?.querySelector<HTMLElement>(".hp__sq") ?? null;
  const sqColor = new THREE.Color().setStyle(sq ? getComputedStyle(sq).backgroundColor || "#00dc8d" : "#00dc8d");
  const flatMat = new THREE.MeshBasicMaterial({ color: sqColor, transparent: true, opacity: 0, depthTest: false });
  const flat = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), flatMat); flat.renderOrder = 9; flat.visible = false; world.add(flat);
  const flashMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
  const flash = new THREE.Sprite(flashMat); flash.renderOrder = 10; world.add(flash);
  const white = new THREE.Color("#ffffff"), greenCube = new THREE.Color("#22e39c");

  /* the fit: the canvas covers the hero; at rest the drawing sits in the art box at study A's scale, centred on the box (a view offset) */
  let restH = 20, offX = 0, offY = 0, cw = 1, ch = 1, raf = 0;
  const fit = () => {
    cw = Math.max(1, canvas.clientWidth); ch = Math.max(1, canvas.clientHeight);
    renderer.setSize(cw, ch, false);
    camera.aspect = cw / ch;
    const cr = canvas.getBoundingClientRect(), br = box.getBoundingClientRect();
    const s = Math.min((br.width * 0.795) / FRAME_W, (br.height * 0.72) / SPREAD_H);   // css px per drawing px
    restH = ch / s / PX;
    offX = cw / 2 - (br.left - cr.left + br.width / 2); offY = ch / 2 - (br.top - cr.top + br.height / 2);
    camera.setViewOffset(cw, ch, offX, offY, cw, ch);
    const dpr = renderer.getPixelRatio();
    cu.uClip.value.set((cr.bottom - br.bottom) * dpr, (cr.bottom - br.top) * dpr);
    lineMats.forEach((l) => l.resolution.set(cw, ch));
    dotMat.uniforms.uSize.value = s * dpr;
    hullKey = "";
    if (rm || !raf) draw();
  };

  /* the camera: round the target by az / el, the view `vh` tall through the target, seen with fov */
  const setCam = (az: number, el: number, fov: number, vh: number) => {
    const d = vh / 2 / Math.tan(fov / 2);
    camera.fov = THREE.MathUtils.radToDeg(fov);
    camera.near = Math.max(0.05, d - 70); camera.far = d + 90;
    camera.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d).add(target);
    camera.up.set(0, 1, 0); camera.lookAt(target);
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  };

  /* the bubble's silhouette (a convex hull of its projected vertices, put back at its centre's depth) */
  let hullKey = "";
  const v = new THREE.Vector3(), ctr = new THREE.Vector3();
  const updateHull = () => {
    pillar.updateMatrixWorld();
    const k2 = camera.matrixWorld.elements.map((x) => x.toFixed(4)).join() + bubble.mesh.matrixWorld.elements.map((x) => x.toFixed(4)).join() + camera.fov.toFixed(4) + offX + offY;
    if (k2 === hullKey) return; hullKey = k2;
    const P = bubbleVerts.map((p) => { v.copy(p).applyMatrix4(bubble.mesh.matrixWorld).project(camera); return [v.x * camera.aspect, v.y] as [number, number]; });
    P.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo: [number, number][] = [], up: [number, number][] = [];
    for (const p of P) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    const h = lo.slice(0, -1).concat(up.slice(0, -1)); h.push(h[0]);
    ctr.setFromMatrixPosition(bubble.mesh.matrixWorld).project(camera);
    const out: number[] = [], inv = new THREE.Matrix4().copy(pillar.matrixWorld).invert();
    for (const [x, y] of h) { v.set(x / camera.aspect, y, ctr.z).unproject(camera).applyMatrix4(inv); out.push(v.x, v.y, v.z); }
    hullGeo.setPositions(out); hull.computeLineDistances();
  };
  /** the world point on the plane through `at` (facing the camera) under a point of the page, and the world size of one css px there */
  const ndc = new THREE.Vector3(), pageTo = (px: number, py: number, at: THREE.Vector3, out: THREE.Vector3) => {
    const cr = canvas.getBoundingClientRect();
    ndc.copy(at).project(camera);
    out.set(((px - cr.left) / cr.width) * 2 - 1, -((py - cr.top) / cr.height) * 2 + 1, ndc.z).unproject(camera);
    return out;
  };

  /* state */
  let prog = 0, shown = 0, t = rm ? 99 : 0, lastOpacity = "";
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), land = new THREE.Vector3(), edge = new THREE.Vector3();
  const grey = new THREE.Color("#e9e8e6"), green = new THREE.Color("#00e795"), gl0 = new THREE.Color("#00dc8d"), glHot = new THREE.Color("#b6ffe3");

  const place = () => {
    const p = shown;
    const ti = rm ? 99 : t;
    const lt = rm ? 0 : Math.max(0, ti - LOOP_AT), cyc = lt % CYCLE, live = rm ? 0 : smooth(LOOP_AT, LOOP_AT + 0.6, ti);
    /* the exit's shares */
    const gather = rm ? 0 : p2IO(p / 0.45);                   // 0 → 0.45
    const squeeze = rm ? 0 : smooth(0.45, 0.6, p);            // 0.45 → 0.6
    const fadeAll = rm ? 1 - p : 1 - smooth(0.51, 0.6, p);

    /* the loop's master cycle */
    const inflow = cyc < 2.2 ? lerp(1.25, -0.25, sineIO((cyc - 0.1) / 1.8)) : -9;
    const around = cyc > 1.9 && cyc < 4.6 ? sineIO((cyc - 2.0) / 2.4) : -1;
    const fronts = cyc > 2.8 && cyc < 4.7 ? sineIO((cyc - 2.9) / 1.6) : -1;
    const charge = live * (cyc > 4.4 && cyc < 7.4 ? bump(cyc, 4.4, 5.2, 7.4) : 0);
    const out1 = cyc > 5.4 && cyc < 7.2 ? lerp(-0.25, 1.25, sineIO((cyc - 5.5) / 1.4)) : -9;
    const out2 = cyc > 5.7 && cyc < 7.6 ? lerp(-0.15, 1.15, sineIO((cyc - 5.8) / 1.6)) : -9;

    /* the camera: a short, decelerating ease in to the isometric; a degree of drift; a quarter turn round as the pillar gathers */
    const c = rm ? 1 : outCubic(ti / 1.7);
    target.set(0, lerp(0.35, 0, c), 0);
    const az = Math.PI / 4 + lerp(0.34, 0, c) + Math.sin(lt * 0.1) * 0.017 * live + gather * 0.28 * (1 - squeeze);
    const el = ISO_EL + lerp(-0.07, 0, c) + Math.sin(lt * 0.077 + 1) * 0.009 * live;
    const fov = Math.exp(lerp(Math.log(THREE.MathUtils.degToRad(16)), Math.log(REST_FOV), c));
    setCam(az, el, fov, restH * lerp(0.86, 1, c));

    /* the key light drifts a little round (the faces' greys breathe) */
    const ka = Math.sin(lt * 0.07) * 0.14 * live;
    key.position.copy(KEY).applyAxisAngle(tmp.set(0, 1, 0), ka).multiplyScalar(10);

    /* the column: telescopes in (intro), into the core (exit) */
    for (const sg of segs) {
      const k = Math.min(sg.k, 8), a = rm ? 1 : win(ti, k * 0.04, 1.05), o = rm ? 1 : win(ti, k * 0.04, 0.6, outCubic);
      const into = rm ? 0 : p2IO((p - 0.02 + Math.min(sg.k, 6) * 0.004) / 0.4);
      const coreY = sg.dir > 0 ? 1.9 : -1.6;
      sg.g.position.y = sg.dir * (1 - a) * (0.9 + Math.min(sg.k, 6) * 0.22) + (coreY - sg.cy) * into;
      sg.f.set(o * fadeAll);
    }
    const colIn = rm ? 1 : win(ti, 0.05, 1.0);
    collar.position.y = (1 - colIn) * 0.6;
    collarF.set((rm ? 1 : win(ti, 0.05, 0.6, outCubic)) * fadeAll);
    // the collar: grey until it ignites; glows with the settle and the charge
    const ign = rm ? 1 : smooth(0.6, 1.1, ti), settle = rm ? 0 : Math.exp(-Math.pow((ti - 1.5) / 0.22, 2));
    collarMat.color.lerpColors(grey, green, ign);
    collarMat.emissiveIntensity = settle * 0.8 + charge * 0.6;

    /* the core and its bubble: arrive; breathe with the charge; the bubble closes on the gather */
    const coreIn = rm ? 1 : win(ti, 0.08, 1.0);
    core.position.y = (1 - coreIn) * -0.4 + charge * 0.18;
    coreF.set((rm ? 1 : win(ti, 0.08, 0.6, outCubic)) * fadeAll);
    halo.position.y = core.position.y + 0.1;
    haloMat.opacity = (settle * 0.5 + charge * 0.55 + gather * 0.35) * fadeAll;
    const bub = rm ? 1 : win(ti, 0.12, 1.0);
    bubble.g.scale.setScalar(lerp(0.86, 1, bub) * lerp(1, 0.72, gather));
    bubbleGlass.opacity = 0.11 * (rm ? 1 : win(ti, 0.12, 0.6, outCubic)) * (1 + charge * 1.3 + settle * 0.8) * fadeAll;
    rimMat.opacity = 0.55 * (rm ? 1 : win(ti, 0.12, 0.6, outCubic)) * fadeAll * (1 + charge * 0.6);
    bubble.g.visible = bubbleGlass.opacity > 0.002;
    hullMat.opacity = 0.85 * (rm ? 1 : win(ti, 0.12, 0.6, outCubic)) * fadeAll;
    hull.visible = bubble.g.visible;
    const rodsIn = rm ? 1 : win(ti, 0.3, 0.9);
    rods.position.y = (1 - rodsIn) * -0.6 + gather * 1.1;
    rods.scale.setScalar(lerp(1, 0.6, gather));
    rodsF.set((rm ? 1 : win(ti, 0.3, 0.6, outCubic)) * fadeAll);

    /* the frame: arrives from close by along its axes (corners on the diagonals, arms on their normals, clamps last); contracts round the core */
    const order = [1, 2, 3, 0];
    frame.forEach((f, fi) => {
      let t0: number, far: number;
      if (f.kind === "corner") { t0 = 0.12 + order.indexOf(fi) * 0.05; far = 1.4; }
      else { const cl = f.kind === "clamp"; t0 = 0.25 + f.arm * 0.05 + (cl ? 0.22 : f.j * 0.04); far = cl ? 0.6 : 1.0; }
      const a = rm ? 1 : win(ti, t0, 0.95), o = rm ? 1 : win(ti, t0, 0.55, outCubic);
      const k = lerp(1, LOCK, rm ? 0 : p2IO((p - 0.04 - (fi % 4) * 0.012) / 0.36));
      f.g.scale.setScalar(k);
      f.g.position.copy(f.out).multiplyScalar((1 - a) * far * k);
      f.fd.set(o * fadeAll);
    });
    /* the glass: takes its colour as the arms land; the settle's pulse; the packet's light as it passes each tube */
    packet.position.copy(onFrame(around < 0 ? 0 : around, tmp2));
    const pv = live * (around < 0 ? 0 : smooth(0, 0.06, around) * (1 - smooth(0.94, 1, around))) * (1 - smooth(0, 0.08, p));
    packMat.opacity = pv; packet.visible = pv > 0.01;
    tubes.forEach((f, i) => {
      const on = rm ? 1 : smooth(0.5 + i * 0.05, 1.1 + i * 0.05, ti), hot = rm ? 0 : Math.exp(-Math.pow((ti - 1.35 - i * 0.06) / 0.14, 2));
      let k = 0;
      if (pv > 0.01) {
        const [p0, p1] = f.along!, seg = tmp.copy(p1).sub(p0), q = clamp(packet.position.clone().sub(p0).dot(seg) / seg.lengthSq());
        const d = packet.position.distanceTo(p0.clone().addScaledVector(seg, q));
        k = Math.exp(-d * d * 2.5) * pv;
      }
      const lit = Math.max(hot, k * 0.85);
      f.glass!.userData.level = lerp(0.035, 0.13, on) * (1 + charge * 0.3);
      f.glass!.emissive.setRGB(0, 0.86, 0.55).multiplyScalar(lit * 0.3);
      f.gline!.color.copy(gl0).lerp(glHot, lit);
      f.gline!.userData.level = lerp(0.25, 0.75, on) + lit * 0.25;
      f.fd.set(f.fd.o);
    });
    // the column's fronts: from both ends toward the core (circulation) — and once through, on the settle
    const sf = rm ? -1 : clamp((ti - 1.2) / 0.7);
    const fr = fronts >= 0 ? fronts : sf > 0 && sf < 1 ? outCubic(sf) : -1;
    stripMat.uniforms.uU.value = fr < 0 ? 99 : lerp(13, 1.7, fr); stripMat.uniforms.uL.value = fr < 0 ? -99 : lerp(-13, -1.3, fr);
    stripMat.uniforms.uO.value = (fr < 0 ? 0 : smooth(0, 0.1, fr) * (1 - smooth(0.85, 1, fr))) * (1 - smooth(0, 0.1, p)) * 0.95;
    su.uSheen.value = rm ? -99 : ((lt * 1.4) % 22) - 11;

    /* the satellites: arrive; rise and settle in turn on the release; fly in along their rows and into the core on the exit */
    satTurn.forEach((s, n) => {
      const a = rm ? 1 : win(ti, 0.7 + s.i * 0.045, 0.85), o = rm ? 1 : win(ti, 0.7 + s.i * 0.045, 0.5, outCubic);
      const rise = live * (cyc > 5.7 ? bump(cyc, 5.75 + n * 0.1, 6.25 + n * 0.1, 6.85 + n * 0.1) : 0);
      const t1 = p2IO((p - 0.01 - (s.i % 5) * 0.015) / 0.24), t2 = p2IO((p - 0.25 - (s.i % 5) * 0.015) / 0.17);
      const lock = tmp.copy(s.entry).multiplyScalar(LOCK).setY(SAT_Y * LOCK + 0.1);
      s.g.position.copy(s.base).addScaledVector(s.out, (1 - a) * 0.8);
      if (!rm) s.g.position.lerp(s.entry, t1).lerp(lock, t2);
      s.g.position.y += rise * 0.2 + Math.sin(lt * 0.8 + s.ph) * 0.025 * live;
      s.g.scale.setScalar(lerp(1, 0.8, t1) * lerp(1, 0.38, t2));
      s.f.set(o * (1 - smooth(0.33, 0.43, p)) * fadeAll);
    });
    /* the rows and guides: draw out; packets in and out; the dots flow; they draw back in on the exit */
    dotMat.uniforms.uR.value = ti; dotMat.uniforms.uFlow.value = rm ? 0 : (lt * 0.25) % 1;
    dotMat.uniforms.uIn.value = live > 0 ? inflow : -9; dotMat.uniforms.uOut.value = live > 0 ? out1 : -9; dotMat.uniforms.uOutG.value = live > 0 ? out2 : -9;
    dotMat.uniforms.uRet.value = rm ? 0 : sineIO((p - 0.02) / 0.24);
    dotMat.uniforms.uFade.value = rm ? 1 - p : 1 - smooth(0.24, 0.3, p);

    /* the compression: the gathered pillar shrinks into the core and fades as the cube grows out of it */
    const ps = lerp(1, 0.2, squeeze * squeeze);
    pillar.scale.setScalar(ps); pillar.position.copy(CORE).multiplyScalar(1 - ps);
    pillar.visible = fadeAll > 0.002;

    /* the cube: grows at the core, turns green, arcs over onto the h1's square and turns flat as it lands; the flash */
    const showCube = !rm && p > 0.44 && p < 0.84;
    cube.visible = showCube; flat.visible = showCube && p > 0.72; flashMat.opacity = 0;
    if (!rm && sq && p > 0.44 && p < 0.97) {
      const r = sq.getBoundingClientRect();
      const grow = sineIO((p - 0.44) / 0.14), gr = sineIO((p - 0.5) / 0.1), go = sineIO((p - 0.6) / 0.2), flatten = sineIO((p - 0.73) / 0.07);
      pageTo(r.left + r.width / 2, r.top + r.height / 2, CORE, land);
      const w = pageTo(r.right, r.top + r.height / 2, CORE, edge).distanceTo(land) * 2;   // the square's width, in world units at the core's depth
      const side = lerp(1.25 * (0.35 + 0.65 * grow), w / Math.SQRT2, go);               // a cube that wide on screen at the end
      cube.position.lerpVectors(CORE, land, go);
      cube.position.addScaledVector(tmp.set(0, 1, 0).applyQuaternion(camera.quaternion), Math.sin(Math.PI * go) * restH * 0.12);   // a soft arc up and over
      cube.scale.setScalar(side); cube.quaternion.identity();
      cubeMat.color.lerpColors(white, greenCube, gr);
      cubeMat.opacity = clamp((p - 0.44) / 0.05) * (1 - flatten); cubeLineMat.opacity = 0.85 * cubeMat.opacity;
      flat.position.copy(land); flat.quaternion.copy(camera.quaternion); flat.scale.setScalar(w * lerp(0.75, 1, flatten)); flatMat.opacity = flatten;
      flash.position.copy(land); flash.scale.setScalar(w * (4 + 3 * clamp((p - 0.74) / 0.16)));
      flashMat.opacity = Math.exp(-Math.pow((p - 0.8) / 0.045, 2)) * 0.9;
    }

    updateHull();
    const op = rm ? (1 - p).toFixed(3) : "1";
    if (op !== lastOpacity) { lastOpacity = op; canvas.style.opacity = op; }
  };
  function draw() { place(); renderer.render(scene, camera); }

  /* the loop: only while on screen and the tab is visible */
  let last = 0, seen = true, dead = false;
  const tick = (now: number) => {
    raf = 0; if (dead) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
    t += dt;
    shown += (prog - shown) * (1 - Math.exp(-12 * dt)); if (Math.abs(shown - prog) < 1e-4) shown = prog;
    draw();
    if (seen && !document.hidden) raf = requestAnimationFrame(tick);
  };
  const go = () => { if (!rm && !raf && seen && !document.hidden && !dead) { last = 0; raf = requestAnimationFrame(tick); } };
  const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; go(); }, { threshold: 0 });
  const ro = new ResizeObserver(() => fit());
  const vis = () => go();
  ro.observe(box); ro.observe(canvas); io.observe(canvas);
  document.addEventListener("visibilitychange", vis);
  fit();
  go();

  return {
    setProgress(p: number) {
      prog = clamp(p);
      if (rm || !raf) { shown = prog; draw(); }
    },
    dispose() {
      dead = true; cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect(); document.removeEventListener("visibilitychange", vis);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
        for (const mt of mats) mt.dispose();
      });
      glowTex.dispose(); lineMats.forEach((l) => l.dispose());
      renderer.dispose(); renderer.forceContextLoss();
    },
  };
}
