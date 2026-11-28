// Hero "Private by design" D, "privacy through glass": the isometric ring (Figma node 1123:610) in three.js, its sides turned into a fence of frosted
// glass round the core. Glass is the privacy boundary: outside, data is legible; it crosses the frost and becomes only a green glow; inside, the core
// computes unseen; what leaves is a single green proof (the result without the data). NEAR encrypts your prompts and transactions.
// The frost is hero H's diffusion (../../heroes3d/scene-h.ts), on a light page: each frame the scene is drawn sharp without its glass, blurred to two
// levels, and each pane shows its level where it sits on screen (./glass.ts): the walls a soft blur, the bubble a deep one. Geometry ./ring.ts, the solid
// parts' effects ./fx.ts, the selective bloom ./post.ts. At rest it is the drawing's framing (as study C): a perspective camera with its projection set
// by hand, a quarter of a degree from far away (the isometric), framed so the ring sits exactly where .hp__art is; the canvas covers the whole hero.
//   1 · Intro (~1.8 s, as soon as the scene has compiled): one soft wave. The camera eases back from slightly closer and higher; core and bubble dissolve
//       in, then the eight parts in turn round the ring from just outside their places, the orbits and guides draw on, the satellites land; a sheen
//       sweeps once across the glass and a pulse runs through the green (the settle); the loop starts from rest.
//   2 · Loop, one 8 s cycle: INFLOW (0–2 s) the satellites send packets of glyphs (hex and bits, or `?glyph=abstract` dashes) along the guides, legible
//       ink on the paper; CROSSING (2–4.5) at the glass they pass behind the frost and are seen only blurred, and come out inside as soft green light,
//       while one front of light runs round the rails and through the glass; CHARGE (4.5–5.5) the core takes it, a glow swells in the bubble's deep
//       frost; RELEASE (5.5–8) one green proof point leaves the core along one guide, through the wall, to a satellite, which lights up and rings
//       ("received"); the orbits pulse quietly as it goes. Under it: the orbits turn, satellites bob, the core breathes, the camera drifts a degree.
//   3 · Exit, "seal" (setProgress 0 → 1 over the hero's hold): GATHER (→ 0.45) the satellites fly in along their lines, the guides retract, the orbits
//       contract, the ring draws in round the core, the corners become the posts of a small box round the bubble and the four glass walls rise and
//       fold in over it like lids; SEAL (→ 0.8) the closed box turns to green light and compresses into one green cube, which travels, turns face-on and
//       shrinks onto the h1's square (.hp__sq) and lands on it with a soft flash; then (→ 1) only the h1's square remains.
// Intro and exit compose (the exit is applied over whatever the intro has reached). Runs only on screen with the tab visible; DPR ≤ 2 within a pixel
// budget, lowered if frames run long. Reduced motion: one still frame (the component fades it).
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { BUBBLE, CORE, H, HT, HW, buildCore, buildRing, fromDrawing, outlineLoop, perim, perimPoint, silhouette, type RingMats } from "./ring";
import { aoTexture, fx, globalU, glowTexture, microTexture, partU, ringTexture, type PartU } from "./fx";
import { createDiffusion, glassMaterial, glyphAtlas, glyphMaterial, type GlassU, type GlyphStyle } from "./glass";
import { GLOW, OCC, createPost } from "./post";

export type RingScene = { setProgress(p: number): void; dispose(): void };

const FRAME = { w: 2016, h: 1249, ox: 1081, oy: 625 };
const PX = 100 / Math.sqrt(2 / 3);
const ISO_EL = Math.atan(1 / Math.SQRT2);
const REST_FOV = THREE.MathUtils.degToRad(0.25);
const INTRO = 1.85;
const CYCLE = 8;
const GREEN = new THREE.Color("#00dc8d");
const BG = "#f5f5f5";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const expoOut = (t: number) => { t = clamp(t); return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); };
const p2InOut = (t: number) => { t = clamp(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
const sineInOut = (t: number) => -(Math.cos(Math.PI * clamp(t)) - 1) / 2;
const damp = (v: number, to: number, k: number, dt: number) => v + (to - v) * (1 - Math.exp(-k * dt));
const bump = (v: number, a: number, b: number, c: number, d: number) => smooth(a, b, v) * (1 - smooth(c, d, v));
/** a piecewise-linear path through [time, value] keys, eased into the first and out of the last */
const keys = (x: number, ...k: [number, number][]) => {
  if (x <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (x < k[i][0]) {
    let f = (x - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
    if (i === 1) f = f * f * (1.6 - 0.6 * f);                 // ease in
    if (i === k.length - 1) f = 1 - (1 - f) * (1 - f) * (1.6 - 0.6 * (1 - f));   // ease out
    return lerp(k[i - 1][1], k[i][1], f);
  }
  return k[k.length - 1][1];
};
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** the satellites, as the drawing has them: [x, y, w, h] of their boxes in its frame; cubes, and green trays lying along x or z */
const CUBES = [[355, 44, 43, 48], [1581, 50, 43, 48], [1656, 37, 86, 98], [156, 500, 43, 48], [355, 801, 86, 98], [597, 1009, 43, 48], [365, 1006, 86, 98], [317, 1078, 43, 48], [1737, 1040, 86, 98]];
const TRAYS: [number, number, number, number, "x" | "z"][] = [[417, 54, 81, 59, "x"], [419, 186, 86, 62, "x"], [1732, 199, 86, 62, "z"], [269, 938, 97, 68, "z"], [1457, 991, 97, 68, "z"], [1740, 968, 81, 59, "x"]];
/** the dashed guides from the satellites to the ring (on the floor), ends in the drawing's frame */
const GUIDES = [[666.7, 577.7, 838.8, 677.1], [349.3, 959.7, 838.8, 677.1], [413.9, 885.2, 446.1, 903.8], [430, 1068.4, 688.2, 919.3], [569.8, 1074.6, 763.5, 962.8],
  [187.9, 543.6, 252.5, 580.8], [1554.2, 872.7, 1747.8, 984.5], [1457.4, 928.6, 1758.6, 1102.5], [1535.9, 1013.7, 1570.3, 993.9], [1672.5, 1052.9, 1769.3, 997],
  [487, 107.5, 650.5, 201.9], [475.2, 231.1, 559.1, 279.6], [1629.5, 320, 1745.7, 252.9], [1803.8, 219.3, 1844.6, 195.7]];
/** the guides that carry data in (they meet the ring square on, through a wall), the order they send in, and the one the proof leaves by */
const INFLOW = [3, 7, 10, 1, 6, 12, 4, 11];
const PROOF = 7;
const ORBITS = [1.862, 2.608, 3.353, 7.331, 8.076, 8.818];
/** the closed box (the exit's gather): the ring drawn in to this, the walls risen to lie over it */
const TIGHT = 0.31, TIGHT_V = 0.9, BOX_Y = 0.22, BOX_C = 0.89;

function tray(long: number, ax: "x" | "z", m: { rim: THREE.Material; floor: THREE.Material; line: THREE.LineBasicMaterial }) {
  const g = new THREE.Group(), W = 0.31, Ht = 0.12, IN = 0.045;
  const s = new THREE.Shape([new THREE.Vector2(-long / 2, -W / 2), new THREE.Vector2(long / 2, -W / 2), new THREE.Vector2(long / 2, W / 2), new THREE.Vector2(-long / 2, W / 2)]);
  s.holes.push(new THREE.Path([new THREE.Vector2(-long / 2 + IN, -W / 2 + IN), new THREE.Vector2(-long / 2 + IN, W / 2 - IN), new THREE.Vector2(long / 2 - IN, W / 2 - IN), new THREE.Vector2(long / 2 - IN, -W / 2 + IN)]));
  const rim = new THREE.ExtrudeGeometry(s, { depth: Ht, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, -Ht / 2, 0);
  const floor = new THREE.BoxGeometry(long - 2 * IN, 0.012, W - 2 * IN).translate(0, -Ht / 2 + 0.035, 0);
  const rimMesh = new THREE.Mesh(rim, m.rim); rimMesh.castShadow = true;
  g.add(rimMesh, new THREE.Mesh(floor, m.floor), new THREE.LineSegments(new THREE.EdgesGeometry(rim, 10), m.line));
  if (ax === "z") g.rotation.y = Math.PI / 2;
  return g;
}

export async function mount(canvas: HTMLCanvasElement, box: HTMLElement, opts: { reduced: boolean; square: HTMLElement | null; glyph: GlyphStyle }): Promise<RingScene> {
  const rm = opts.reduced;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, stencil: false, powerPreference: "high-performance" });
  renderer.setClearColor(BG, 1);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap; renderer.shadowMap.autoUpdate = false;

  const scene = new THREE.Scene();
  const world = new THREE.Group(); scene.add(world);
  const pm = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  const env = pm.fromScene(room, 0.04).texture; pm.dispose(); room.dispose();
  const camera = new THREE.PerspectiveCamera();
  const target = new THREE.Vector3();

  /* lights: a soft fill, a key (VSM shadows) that swings slowly, a cool rim, green lights at the core and with the energy */
  const lights: THREE.Light[] = [];
  const fill = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.69 * Math.PI); lights.push(fill);
  const key = new THREE.DirectionalLight(0xffffff, 0.393 * Math.PI);   // with the fill: the drawing's #FCFCFC / #F2F1F0 / #EBEAE8 on a block's faces
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 9; key.shadow.blurSamples = 12; key.shadow.bias = -0.0006; key.shadow.normalBias = 0.03;
  Object.assign(key.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 0.5, far: 50 });
  const rim = new THREE.DirectionalLight(0xe6fff4, 0.45);
  const frontLight = new THREE.PointLight(GREEN, 0, 3.2, 1.6);
  const coreLight = new THREE.PointLight(GREEN, 0, 4.5, 1.6);
  lights.push(key, rim, frontLight, coreLight);
  for (const l of lights) { l.layers.enableAll(); scene.add(l); }
  scene.add(key.target, rim.target);
  const floorMat = new THREE.ShadowMaterial({ color: 0x1a2a22, opacity: 0.16 });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(12.5, 64), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; world.add(floor);

  /* the shared uniforms, textures, the glass's picture */
  const micro = microTexture(), glowTex = glowTexture(), aoTex = aoTexture(), ringTex = ringTexture();
  const g = globalU(micro);
  const sweep = { value: -1 }, res = new THREE.Vector2(1, 1);
  const diff = createDiffusion(renderer, BG);
  const glassU = (u: PartU, pic: THREE.Texture, milk: number, axis: number): GlassU => ({
    uPic: { value: pic }, uRes: { value: res }, uMilk: { value: milk }, uBuild: u.uBuild, uHeat: u.uHeat, uFront: g.uFront, uFrontAmp: g.uFrontAmp,
    uFlash: g.uFlash, uSweep: sweep, uCharge: g.uCharge, uAxis: { value: axis }, uGlowPass: g.uGlowPass,
  });
  const glass: THREE.Object3D[] = [];

  /* the ring: four glass sides and four solid corners, each its own materials and uniforms, each on a holder whose matrix the scene sets */
  const mkMats = (): RingMats & { u: PartU } => {
    const u = partU();
    const off = { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 };
    const m = {
      u,
      white: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.58, metalness: 0, envMapIntensity: 0, ...off }),
      rail: new THREE.MeshLambertMaterial({ color: 0x000000, emissive: GREEN, emissiveIntensity: 1, ...off }),
      floor: new THREE.MeshLambertMaterial({ color: "#dff5ec", ...off }),
      pane: glassMaterial(glassU(u, diff.soft, 0.32, 0), false),
      line: new THREE.LineBasicMaterial({ color: "#111111", transparent: true, opacity: 0.85 }),
    };
    fx(m.white, g, u, "block", true); fx(m.rail, g, u, "rail", true); fx(m.floor, g, u, "solid", true); fx(m.line, g, u, "line", true);
    return m;
  };
  const pieces = buildRing(mkMats).map((pt) => {
    const m = pt.m as RingMats & { u: PartU };
    const holder = new THREE.Group(); holder.matrixAutoUpdate = false; holder.add(pt.g); world.add(holder);
    pt.g.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (mesh.material === m.rail) mesh.layers.enable(GLOW);
      else mesh.layers.enable(OCC);
      if (mesh.material === m.pane) glass.push(mesh);
    });
    if (pt.side) ((m.pane as THREE.ShaderMaterial).uniforms as unknown as GlassU).uAxis.value = pt.side.axis === "x" ? 1 : 0;
    // contact occlusion under the part's footprint
    const bb = new THREE.Box3().setFromObject(pt.g), sz = bb.getSize(new THREE.Vector3()), mid = bb.getCenter(new THREE.Vector3());
    const ao = new THREE.Mesh(new THREE.PlaneGeometry(sz.x * 1.35 + 0.4, sz.z * 1.35 + 0.4).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x0a2a1c, alphaMap: aoTex, transparent: true, opacity: 0.1, depthWrite: false }));
    ao.position.set(mid.x, 0.004, mid.z); ao.renderOrder = -2; pt.g.add(ao);
    const c = mid.clone(); c.y = 0;
    return { ...pt, holder, u: m.u, ao, c, order: perim(c.x, c.z) };
  }).sort((a, b) => a.order - b.order);

  /* the core in its bubble (the bubble frosted deep), their outlines, the core's halo */
  const coreU = partU(), bubbleU = partU();
  const coreMat = new THREE.MeshPhysicalMaterial({ color: 0xf2f2f0, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 0.22, emissive: GREEN, emissiveIntensity: 0 });
  coreMat.envMap = env;
  const coreLineMat = new THREE.LineBasicMaterial({ color: "#111111", transparent: true, opacity: 0.85 });
  const bubbleMat = glassMaterial(glassU(bubbleU, diff.deep, 0.3, 0), true);
  const fineMat = new THREE.LineBasicMaterial({ color: "#2d8e67", transparent: true, opacity: 0.35, depthTest: false });
  fx(coreMat, g, coreU, "core", false); fx(coreLineMat, g, coreU, "line", false);
  const c = buildCore({ bubble: bubbleMat, core: coreMat, fine: fineMat, line: coreLineMat });
  c.bubbleMesh.renderOrder = 1; c.bubbleMesh.layers.enable(OCC);
  c.core.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.layers.enable(OCC); });
  world.add(c.bubble, c.core);
  glass.push(c.bubbleMesh);
  const bubbleLineMat = new THREE.LineBasicMaterial({ color: "#1d5c43", transparent: true, opacity: 0.6, depthTest: false });
  const bubbleLine = outlineLoop(bubbleLineMat), coreLine = outlineLoop(coreLineMat);
  bubbleLine.renderOrder = 4; c.bubble.children[1].renderOrder = 4;
  world.add(bubbleLine, coreLine);
  glass.push(bubbleLine, c.bubble.children[1]);
  const haloMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0, depthWrite: false });
  const halo = new THREE.Sprite(haloMat); halo.scale.setScalar(3.2); c.core.add(halo);

  /* the seal: one green cube (flat green, shaded per face while it travels) and its flash */
  const sealU = { uShade: { value: 1 }, uGlowPass: g.uGlowPass, uGlow: { value: 1 }, uCol: { value: GREEN.clone() }, uA: { value: 1 } };
  const sealMat = new THREE.ShaderMaterial({
    uniforms: sealU, transparent: true,
    vertexShader: "varying vec3 vN; void main(){ vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform float uShade, uGlowPass, uGlow, uA; uniform vec3 uCol; varying vec3 vN;
void main(){ vec3 n = normalize(vN); float s = mix(1.0, n.y > 0.5 ? 1.0 : (abs(n.x) > abs(n.z) ? 0.86 : 0.74), uShade);
  gl_FragColor = vec4(uCol * s * mix(1.0, uGlow, uGlowPass), uA);
  #include <colorspace_fragment>
}`,
  });
  const seal = new THREE.Mesh(new THREE.BoxGeometry(CORE.s, CORE.s, CORE.s), sealMat);
  const sealEdgesMat = new THREE.LineBasicMaterial({ color: "#0b6e4a", transparent: true, opacity: 0 });
  seal.add(new THREE.LineSegments(new THREE.EdgesGeometry(seal.geometry), sealEdgesMat));
  seal.layers.enable(GLOW); seal.visible = false; seal.renderOrder = 6; scene.add(seal);
  const flashMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0, depthWrite: false, depthTest: false });
  const flash = new THREE.Sprite(flashMat); flash.renderOrder = 7; flash.visible = false; scene.add(flash);

  /* the satellites */
  type Sat = { g: THREE.Group; base: THREE.Vector3; ph: number; out: THREE.Vector3; order: number; u: PartU; heat: number };
  const sats: Sat[] = [];
  const addSat = (grp: THREE.Group, px: number, py: number, hgt: number, lift: number, u: PartU) => {
    const f = fromDrawing(px, py, hgt / 2 + lift);
    grp.position.set(f.x, hgt / 2 + lift, f.z); world.add(grp);
    sats.push({ g: grp, base: grp.position.clone(), ph: sats.length * 1.7, out: new THREE.Vector3(f.x, 0, f.z).normalize(), order: perim(f.x, f.z), u, heat: 0 });
  };
  const satLine = () => new THREE.LineBasicMaterial({ color: "#111111", transparent: true, opacity: 0.85 });
  for (const [x, y, w, h] of CUBES) {
    const u = partU(), white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.58, envMapIntensity: 0 }), line = satLine();
    fx(white, g, u, "solid", false); fx(line, g, u, "line", false);
    const s = w / 173.2, geo = new THREE.BoxGeometry(s, s, s), grp = new THREE.Group(), mesh = new THREE.Mesh(geo, white);
    mesh.castShadow = true; mesh.layers.enable(OCC); grp.add(mesh, new THREE.LineSegments(new THREE.EdgesGeometry(geo), line));
    addSat(grp, x + w / 2, y + h / 2, s, 0.12, u);
  }
  for (const [x, y, w, h, ax] of TRAYS) {
    const u = partU();
    const tm = { rim: new THREE.MeshStandardMaterial({ color: "#14d488", roughness: 0.4, envMapIntensity: 0 }),
      floor: new THREE.MeshStandardMaterial({ color: "#7fe8bd", roughness: 0.4, envMapIntensity: 0 }), line: satLine() };
    fx(tm.rim, g, u, "tray", false); fx(tm.floor, g, u, "tray", false); fx(tm.line, g, u, "line", false);
    addSat(tray(w / 86.6 - 0.31, ax, tm), x + w / 2, y + h / 2, 0.12, 0.12, u);
  }
  const satRank = sats.map((s) => s.order).sort((a, b) => a - b);
  for (const s of sats) s.order = satRank.indexOf(s.order) / sats.length;

  /* the floor: dashed orbits (quieter than C's) and guides */
  const SEG = 720;
  const orbits = ORBITS.map((r, i) => {
    const mat = new THREE.LineDashedMaterial({ color: "#111111", transparent: true, opacity: 0.6, dashSize: 0.05, gapSize: 0.075 });
    const a0 = -Math.PI * 0.75;
    const pts = Array.from({ length: SEG + 1 }, (_, j) => { const a = a0 + (j / SEG) * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * r, 0.003, Math.sin(a) * r); });
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat); l.computeLineDistances();
    l.userData.w = (i % 2 ? -1 : 1) * (0.022 / Math.sqrt(r)); world.add(l);
    return { l, mat, r };
  });
  const guides = GUIDES.map(([x0, y0, x1, y1], i) => {
    const a = fromDrawing(x0, y0), b = fromDrawing(x1, y1);
    let A = new THREE.Vector3(a.x, 0.003, a.z), B = new THREE.Vector3(b.x, 0.003, b.z);
    if (A.length() > B.length()) [A, B] = [B, A];   // A: the ring's end
    const mat = new THREE.LineDashedMaterial({ color: "#111111", transparent: true, opacity: 0.85, dashSize: 0.05, gapSize: 0.068 });
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 41 }, (_, j) => A.clone().lerp(B, j / 40))), mat);
    l.computeLineDistances(); world.add(l);
    let best = 0, bd = 1e9;
    sats.forEach((s, k) => { const d = Math.hypot(s.base.x - B.x, s.base.z - B.z); if (d < bd) { bd = d; best = k; } });
    // a carrier's way in: from the satellite's end, square on through the wall (its outer and inner faces), to the bubble's side
    const dir = A.clone().sub(B).normalize(), ax = Math.abs(dir.x) > Math.abs(dir.z) ? "x" : "z";
    const from = Math.abs(B[ax]), k = Math.abs(dir[ax]);
    const way = { dir, out: (from - (H + HW)) / k, inn: (from - (H - HW)) / k, end: (from - 1.45) / k };
    return { l, mat, A, B, sat: best, mid: (A.length() + B.length()) / 2, way, i };
  });

  /* the data: packets of glyphs on the inflow guides (ink, legible; behind the glass only their blur; inside, green light) */
  const NG = 6, GAP = 0.25;
  const atlas = glyphAtlas(opts.glyph);
  const NGL = INFLOW.length * NG;
  const gg = new THREE.BufferGeometry();
  gg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(NGL * 3), 3));
  for (const [k, n] of [["aG", 1], ["aA", 1], ["aZ", 1], ["aL", 1]] as const) gg.setAttribute(k, new THREE.BufferAttribute(new Float32Array(NGL * n), n));
  const glyphMat = glyphMaterial(atlas);
  const glyphs = new THREE.Points(gg, glyphMat); glyphs.frustumCulled = false; glyphs.renderOrder = 5; world.add(glyphs);

  /* the light: orbit packets, the proof and its trail, sparks of the charge (green points, they bloom) */
  const TR_P = 10, NP = ORBITS.length * 4 + TR_P;
  const pg = new THREE.BufferGeometry();
  pg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(NP * 3), 3));
  pg.setAttribute("aA", new THREE.BufferAttribute(new Float32Array(NP), 1));
  pg.setAttribute("aZ", new THREE.BufferAttribute(new Float32Array(NP), 1));
  const packMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uSize: { value: 10 } },
    vertexShader: "attribute float aA; attribute float aZ; varying float vA; uniform float uSize; void main(){ vA = aA; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = uSize * aZ; if (aA < 0.004) gl_PointSize = 0.0; }",
    fragmentShader: "varying float vA; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float core = smoothstep(0.42, 0.08, d); float halo = smoothstep(1.0, 0.15, d);" +
      " vec3 col = mix(vec3(0.0, 0.716, 0.266), vec3(0.75, 1.0, 0.88), core); float a = (halo * 0.5 + core * 0.5) * vA; if (a < 0.01) discard; gl_FragColor = vec4(col, a); }",
  });
  const packets = new THREE.Points(pg, packMat); packets.frustumCulled = false; packets.renderOrder = 5; packets.layers.enable(GLOW); world.add(packets);
  // the receiver's ring ("received"), flat on the floor round the proof's satellite
  const recvMat = new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, opacity: 0, depthWrite: false });
  const recv = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), recvMat); recv.renderOrder = 4; recv.layers.enable(GLOW); world.add(recv);
  // the proof: a small green cube (the result without the data) with a halo; it blooms
  const proofMat = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0 });
  const proof = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), proofMat);
  const proofEdge = new THREE.LineBasicMaterial({ color: "#0b6e4a", transparent: true, opacity: 0 });
  proof.add(new THREE.LineSegments(new THREE.EdgesGeometry(proof.geometry), proofEdge));
  const proofHaloMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0, depthWrite: false });
  const proofHalo = new THREE.Sprite(proofHaloMat); proofHalo.scale.setScalar(0.9); proof.add(proofHalo);
  proof.layers.enable(GLOW); proof.renderOrder = 5; world.add(proof);
  const proofSat = sats[guides[PROOF].sat];
  recv.position.set(proofSat.base.x, 0.01, proofSat.base.z);

  /* framing: the box (.hp__art) shows the drawing's frame; the canvas covers the hero, so the view extends to match */
  const view = { l: -1, r: 1, t: 1, b: -1 };
  const sq = { x: 0, y: 0, w: 0, ok: false };
  const css = { w: 1, h: 1 };
  let pr = Math.min(devicePixelRatio || 1, 2);
  const BUDGET = innerWidth >= 1000 ? 5.4e6 : 2.6e6;
  const post = createPost(renderer, scene, camera, g.uGlowPass);
  let raf = 0, glyphPx = 12, dotPx = 9;
  const fit = () => {
    const cr = canvas.getBoundingClientRect(), br = box.getBoundingClientRect();
    const w = Math.max(1, cr.width), h = Math.max(1, cr.height);
    css.w = w; css.h = h;
    const p = Math.min(pr, Math.sqrt(BUDGET / (w * h)));
    renderer.setPixelRatio(p); renderer.setSize(w, h, false);
    post.setSize(w, h, p);
    res.set(Math.round(w * p), Math.round(h * p)); diff.setSize(res.x, res.y);
    const k = FRAME.h / PX / Math.max(1, br.height);
    view.l = -FRAME.ox / PX - (br.left - cr.left) * k; view.r = (FRAME.w - FRAME.ox) / PX + (cr.right - br.right) * k;
    view.t = FRAME.oy / PX + (br.top - cr.top) * k; view.b = -(FRAME.h - FRAME.oy) / PX - (cr.bottom - br.bottom) * k;
    const sc = clamp(br.width / 540, 0.6, 1.4);
    dotPx = 9 * p * sc; glyphPx = 16 * p * sc;
    post.mix.uCenter.value.set((br.left + br.width / 2 - cr.left) / w, 1 - (br.top + br.height / 2 - cr.top) / h);
    if (opts.square) {
      const r = opts.square.getBoundingClientRect();
      Object.assign(sq, { x: r.left + r.width / 2 - cr.left, y: r.top + r.height / 2 - cr.top, w: r.width, ok: r.width > 0 });
    }
    if (rm || !raf) draw();
  };
  const setCam = (az: number, el: number, fov: number, s: number) => {
    const vl = view.l * s, vr = view.r * s, vt = view.t * s, vb = view.b * s;
    const d = (vt - vb) / 2 / Math.tan(fov / 2), near = Math.max(0.1, d - 60), far = d + 80;
    camera.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d).add(target);
    camera.up.set(0, 1, 0); camera.lookAt(target); camera.updateMatrixWorld();
    camera.near = near; camera.far = far;
    const q = near / d;
    camera.projectionMatrix.makePerspective(vl * q, vr * q, vt * q, vb * q, near, far);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  };

  /* state */
  let prog = 0, shown = 0, t = rm ? 99 : 0, loopT = 0, clock = 0;
  const v = new THREE.Vector3(), v2 = new THREE.Vector3(), qFace = new THREE.Quaternion(), qId = new THREE.Quaternion();
  const sealFrom = new THREE.Vector3(), sealTo = new THREE.Vector3(), sealMid = new THREE.Vector3();
  const mA = new THREE.Matrix4(), mB = new THREE.Matrix4(), mC = new THREE.Matrix4(), axis = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const pivotC = new THREE.Vector3(0, BOX_C, 0);

  const place = (dt: number) => {
    const p = shown;
    const cyc = rm ? 0 : loopT % CYCLE, round = rm ? 0 : Math.floor(loopT / CYCLE);
    const live = rm ? 0 : smooth(INTRO - 0.3, INTRO + 0.4, t);
    /* exit phases */
    const gth = p2InOut(p / 0.45);
    const cmp = p2InOut((p - 0.45) / 0.11);
    const trv = sineInOut((p - 0.56) / 0.24);
    const heat = smooth(0.38, 0.52, p);
    const outF = 1 - smooth(0.8, 0.95, p);

    /* the loop's story */
    const front = clamp((cyc - 2.2) / 2.3), frontAmp = bump(cyc, 2.2, 2.55, 4.2, 4.7) * live;
    const charge = bump(cyc, 4.3, 5.0, 5.5, 6.4) * live;
    const ripT = clamp((cyc - 6.6) / 1.3), ripA = bump(cyc, 6.6, 6.85, 7.4, 7.95) * live * 0.6;
    const settle = rm ? 0 : Math.exp(-Math.pow((t - 1.62) / 0.16, 2));
    g.uT.value = clock;
    g.uFront.value = front;
    g.uFrontAmp.value = frontAmp * (1 - gth);
    g.uFlash.value = settle * 0.55 + charge * 0.12;
    g.uCharge.value = (charge + settle * 0.3) * (1 - gth * 0.5);
    sweep.value = rm ? -1 : lerp(0.42, 1.08, smooth(1.3, 1.9, t));

    /* the camera: intro (a touch closer, higher, turned) → rest (the drawing) → gather (leans in a little) → seal (the drawing's view, where it lands) */
    const ci = rm ? 1 : expoOut((t - 0.02) / 1.6);
    const lean = gth * (1 - smooth(0.45, 0.7, p));
    target.set(0, lerp(CORE.y * 0.6, 0, ci) + lean * BOX_C * 0.6, 0);
    const az = Math.PI / 4 + lerp(0.12, 0, ci) + live * Math.sin(clock * 0.09) * 0.0087 + lean * 0.06;
    const el = ISO_EL + lerp(0.07, 0, ci) + live * Math.sin(clock * 0.07 + 1) * 0.005 - lean * 0.03;
    const fov = Math.max(REST_FOV, lerp(0.22, 0, ci) + lean * 0.2);
    setCam(az, el, fov, lerp(0.86, 1, ci) * (1 - lean * 0.14));

    /* lights */
    const ka = rm ? 0 : Math.sin(clock * 0.06) * 0.08;
    key.position.set(6.45 * Math.cos(ka) - 8.8 * Math.sin(ka), 10.35, 6.45 * Math.sin(ka) + 8.8 * Math.cos(ka));
    const ra = clock * 0.11;
    rim.position.set(-8 * Math.cos(ra * 0.5) - 3, 4, -8 * Math.sin(ra * 0.5 + 0.6) - 3);
    perimPoint(g.uFront.value, frontLight.position); frontLight.position.y = 0.95;
    frontLight.intensity = 5 * g.uFrontAmp.value;
    floorMat.opacity = 0.16 * (1 - smooth(0.3, 0.5, p)) * (rm ? 1 : smooth(0.3, 1.4, t));

    /* compress (the seal): the closed box shrinks to its centre and turns */
    const cs = Math.max(0.001, 1 - cmp * 0.96);
    mC.makeRotationY(cmp * 0.6).scale(v.set(cs, cs, cs)).setPosition(pivotC.x - 0, pivotC.y, pivotC.z);
    mC.multiply(mA.makeTranslation(-pivotC.x, -pivotC.y, -pivotC.z));

    /* the ring's parts: arrive in turn (intro); draw in round the core, the corners as the box's posts, the walls rising and folding over it (gather) */
    pieces.forEach((pc, i) => {
      const at = 0.1 + i * 0.05;
      const land = rm ? 1 : expoOut((t - at) / 1.0);
      pc.u.uBuild.value = rm ? 1 : smooth(at - 0.02, at + 0.5, t) * (1 - smooth(0.5, 0.56, p));
      const side = pc.kind === "side";
      const gi = p2InOut((gth - (side ? 0 : 0.04)) / 0.72);
      const sh = lerp(1, TIGHT, gi), sv = lerp(1, TIGHT_V, gi);
      const off = (1 - land) * 0.8;
      // scale, then (the walls) lift and fold about the inner foot, then the intro's offset; all inside the compress
      mA.makeScale(sh, sv, sh);
      const lift = side ? lerp(0, BOX_Y + HT * TIGHT_V + 0.02, p2InOut((gth - 0.25) / 0.5)) : lerp(0, BOX_Y, gi);
      if (side) {
        const fold = (Math.PI / 2) * p2InOut((gth - 0.62) / 0.38);
        const hx = pc.n.x * (H - HW) * sh, hz = pc.n.z * (H - HW) * sh;
        axis.crossVectors(pc.n, up).normalize();
        mB.makeTranslation(-hx, 0, -hz); mA.premultiply(mB);
        mB.makeRotationAxis(axis, fold); mA.premultiply(mB);
        mB.makeTranslation(hx, lift, hz); mA.premultiply(mB);
      } else {
        mB.makeTranslation(0, lift, 0); mA.premultiply(mB);
      }
      mB.makeTranslation(pc.n.x * off, (1 - land) * 0.35, pc.n.z * off); mA.premultiply(mB);
      pc.holder.matrix.multiplyMatrices(mC, mA);
      pc.holder.matrixWorldNeedsUpdate = true;
      (pc.ao.material as THREE.MeshBasicMaterial).opacity = 0.1 * pc.u.uBuild.value * (1 - gi);
      pc.u.uHeat.value = heat;
      pc.holder.visible = pc.u.uBuild.value > 0.001;
    });

    /* the core: breathes; glows on the charge (seen only through the bubble's deep frost); turns green and gives way to the seal */
    const breath = rm ? 0 : Math.sin((cyc / CYCLE) * Math.PI * 2) * live;
    const coreIn = rm ? 1 : expoOut(t / 0.9);
    coreU.uBuild.value = rm ? 1 : smooth(0, 0.4, t) * (1 - smooth(0.5, 0.56, p));
    const gb = p2InOut(gth / 0.7);
    v.set(0, lerp(CORE.y, BOX_C, gb) + breath * 0.03 + charge * 0.08, 0).applyMatrix4(mC);
    c.core.position.copy(v);
    c.core.scale.setScalar((1 + breath * 0.01 + charge * 0.02) * lerp(0.9, 1, coreIn) * lerp(1, 0.78, gb) * cs);
    c.core.rotation.y = cmp * 0.6;
    coreU.uHeat.value = heat;
    haloMat.opacity = Math.min(1, settle * 0.4 + charge * 1.2) * (1 - gth);
    halo.scale.setScalar(3.2 * (1 + charge * 0.3));
    c.core.visible = coreU.uBuild.value > 0.001;
    coreLight.position.set(0, c.core.position.y + CORE.s * 0.9, 0);
    coreLight.intensity = (charge * 4 + settle * 2 + heat * 1.5 * (1 - cmp)) * (rm ? 0 : 1);
    bubbleU.uBuild.value = rm ? 1 : smooth(0.06, 0.55, t) * (1 - smooth(0.5, 0.56, p));
    bubbleU.uHeat.value = heat;
    v.set(0, lerp(BUBBLE.y, BOX_C, gb), 0).applyMatrix4(mC);
    c.bubble.position.copy(v);
    c.bubble.scale.setScalar(lerp(1, 0.62, gb) * cs);
    c.bubble.rotation.y = cmp * 0.6;
    fineMat.opacity = 0.35 * bubbleU.uBuild.value * (1 - heat);
    bubbleLineMat.opacity = 0.6 * bubbleU.uBuild.value * (1 - heat * 0.8);
    coreLineMat.opacity = 0.85 * coreU.uBuild.value * (1 - heat);
    c.bubble.visible = bubbleU.uBuild.value > 0.001;

    /* the satellites: arrive last; glow as they send; the proof's receiver lights up; fly in along their lines and into the box (gather) */
    const recvA = bump(cyc, 7.0, 7.2, 7.5, 8.0) * live;
    proofSat.heat = Math.max(proofSat.heat, recvA * 0.9);
    for (const st of sats) {
      const at = 0.4 + st.order * 0.5;
      const land = rm ? 1 : expoOut((t - at) / 0.9);
      const rs = 5.7 + st.order * 1.3, rise = Math.pow(Math.sin(Math.PI * clamp((cyc - rs) / 0.95)), 2) * 0.12 * live;
      const bob = Math.sin(clock * 0.7 + st.ph) * 0.03 * live;
      const gi = p2InOut((gth - st.order * 0.3) / 0.7);
      v.set(st.base.x + st.out.x * (1 - land) * 0.7, st.base.y + (1 - land) * 0.35 + rise + bob, st.base.z + st.out.z * (1 - land) * 0.7);
      v2.set(st.out.x * 1.0, BOX_C + 0.2, st.out.z * 1.0);
      st.g.position.lerpVectors(v, v2, gi);
      st.g.position.y += Math.sin(Math.PI * gi) * 0.6;
      st.g.scale.setScalar(Math.max(0.001, lerp(1, 0.45, gi)));
      st.g.rotation.y = Math.sin(clock * 0.25 + st.ph) * 0.05 * live + gi * 1.2;
      st.u.uBuild.value = rm ? 1 : smooth(at - 0.02, at + 0.42, t) * (1 - smooth(0.82, 1, gi));
      st.u.uHeat.value = Math.max(st.heat * live * (1 - gth), smooth(0.4, 0.9, gi));
      st.g.visible = st.u.uBuild.value > 0.001;
      st.heat = 0;
    }
    recv.scale.setScalar(lerp(0.4, 1.6, smooth(7.05, 7.9, cyc)));
    recvMat.opacity = recvA * (1 - smooth(7.4, 7.95, cyc)) * 0.9 * (1 - gth);

    /* the orbits: draw on, turn, pulse quietly as the proof goes out; contract into the box (gather) */
    const ripR = lerp(1.6, 9.5, 1 - Math.pow(1 - ripT, 2));
    orbits.forEach((o, i) => {
      const on = rm ? 1 : expoOut((t - (0.16 + i * 0.05)) / 1.0);
      o.l.geometry.setDrawRange(0, Math.floor(on * SEG) + 1);
      o.l.rotation.y += (o.l.userData.w as number) * dt * live;
      o.l.scale.setScalar(lerp(1, 0.16, p2InOut((gth - (ORBITS.length - 1 - i) * 0.05) / 0.75)));
      const lit = Math.exp(-Math.pow((ripR - o.r) / 0.55, 2)) * ripA;
      o.mat.color.setRGB(lerp(0.0056, 0, lit), lerp(0.0056, 0.6, lit), lerp(0.0056, 0.25, lit));
      o.mat.opacity = (0.6 + lit * 0.3) * on * (1 - smooth(0.3, 0.46, p));
      o.l.visible = on > 0.002 && p < 0.47;
    });

    /* the guides: draw on; retract into the ring (gather) */
    guides.forEach((gd, i) => {
      const on = rm ? 1 : expoOut((t - (0.45 + i * 0.02)) / 0.8);
      const back = p2InOut((gth - 0.05) / 0.6);
      gd.l.geometry.setDrawRange(0, Math.max(0, Math.floor(on * (1 - back) * 40) + 1));
      const lit = gd.i === PROOF ? bump(cyc, 5.6, 5.9, 7.0, 7.6) * live * 0.8 : 0;
      gd.mat.color.setRGB(lerp(0.0056, 0, lit), lerp(0.0056, 0.6, lit), lerp(0.0056, 0.25, lit));
      gd.mat.opacity = 0.85 * (1 - smooth(0.35, 0.45, p));
      gd.l.visible = on > 0.01 && back < 0.999;
    });

    /* the data: each inflow guide sends one packet a cycle; legible outside, blurred behind the glass, green light inside, taken by the core */
    const gp = gg.attributes.position as THREE.BufferAttribute, gG = gg.attributes.aG as THREE.BufferAttribute, gA = gg.attributes.aA as THREE.BufferAttribute;
    const gZ = gg.attributes.aZ as THREE.BufferAttribute, gL = gg.attributes.aL as THREE.BufferAttribute;
    const dataVis = live * (1 - smooth(0.04, 0.22, p));
    let n = 0;
    INFLOW.forEach((gi, j) => {
      // legible on the paper until ~2.3 s, through the glass by ~3.7 s (slower: the frost is where it changes), taken by the core by 4.5 s
      const gd = guides[gi], w = gd.way, ts = j * 0.08;
      const head = keys(cyc, [ts, 0], [2.3 + j * 0.03, w.out], [3.7 + j * 0.03, w.inn + 0.25], [4.5, w.end + (NG - 1) * GAP]);
      if (cyc >= ts && cyc < ts + 0.6) sats[gd.sat].heat = Math.max(sats[gd.sat].heat, bump(cyc - ts, 0, 0.12, 0.25, 0.6) * 0.6);
      for (let k = 0; k < NG; k++) {
        const s = head - k * GAP;
        const L = smooth(w.out - 0.05, w.inn + 0.2, s);
        const inner = smooth(w.inn, w.end, s);
        v.copy(gd.B).addScaledVector(w.dir, clamp(s, 0, w.end));
        v.y = lerp(0.5, 0.85, inner);
        gp.setXYZ(n, v.x, v.y, v.z);
        gG.setX(n, Math.floor(hash(gi * 31.7 + k * 7.3 + round * 3.1) * (opts.glyph === "hex" ? 15.99 : 7.99)));
        const a = smooth(-0.05, 0.35, s) * (1 - smooth(w.end - 0.55, w.end, s)) * (s >= 0 && s <= w.end ? 1 : 0);
        gA.setX(n, a * dataVis);
        gZ.setX(n, 1);
        gL.setX(n++, L);
      }
    });
    gp.needsUpdate = gG.needsUpdate = gA.needsUpdate = gZ.needsUpdate = gL.needsUpdate = true;

    /* the light: two quiet packets per orbit; the proof with its trail */
    const pp = pg.attributes.position as THREE.BufferAttribute, pa = pg.attributes.aA as THREE.BufferAttribute, pz = pg.attributes.aZ as THREE.BufferAttribute;
    n = 0;
    const pkVis = 1 - smooth(0.05, 0.3, p);
    orbits.forEach((o, i) => {
      const r = o.r * o.l.scale.x;
      for (let j = 0; j < 2; j++) {
        const dir = i % 2 ? -1 : 1, ang0 = dir * clock * (0.16 / Math.sqrt(Math.max(0.1, r))) + j * Math.PI + i * 1.3;
        for (let k = 0; k < 2; k++) {
          const ang = ang0 - dir * k * 0.03 * (3 / Math.max(1, o.r));
          pp.setXYZ(n, Math.cos(ang) * r, 0.03, Math.sin(ang) * r);
          pa.setX(n, live * pkVis * 0.4 * (1 - k * 0.5));
          pz.setX(n++, 0.7 - k * 0.25);
        }
      }
    });
    const pw = guides[PROOF];
    const pf = sineInOut((cyc - 5.55) / 1.6), pOn = bump(cyc, 5.45, 5.65, 7.05, 7.3) * live * pkVis;
    for (let k = 0; k < TR_P; k++) {
      const s = lerp(pw.way.end, 0, clamp(pf - k * 0.014));
      v.copy(pw.B).addScaledVector(pw.way.dir, s); v.y = lerp(0.5, 0.85, smooth(pw.way.inn, pw.way.end, s));
      if (!k) { proof.position.copy(v); continue; }
      pp.setXYZ(n, v.x, v.y, v.z);
      pa.setX(n, pOn * (1 - k / TR_P) * 0.7);
      pz.setX(n++, 1.0 * (1 - k / TR_P) + 0.3);
    }
    pa.setX(n, 0);
    proof.visible = pOn > 0.005;
    proofMat.opacity = pOn; proofEdge.opacity = pOn * 0.7; proofHaloMat.opacity = pOn * 0.85;
    proof.rotation.y = clock * 1.2;
    pp.needsUpdate = pa.needsUpdate = pz.needsUpdate = true;

    /* the seal: grows inside the compressing box, travels on an arc, turns face-on and lands on the h1's square, flashes, rests under it */
    seal.visible = cmp > 0.25 && p < 0.92;
    flash.visible = false;
    if (seal.visible) {
      camera.updateMatrixWorld();
      sealFrom.copy(pivotC);
      v.copy(sealFrom).project(camera);
      const nx = sq.ok ? (sq.x / css.w) * 2 - 1 : v.x, ny = sq.ok ? 1 - (sq.y / css.h) * 2 : v.y;
      sealTo.set(nx, ny, v.z).unproject(camera);
      v2.copy(sealTo).project(camera); v.set(v2.x + 0.01, v2.y, v2.z).unproject(camera);
      const unitPerPx = v.distanceTo(sealTo) / (0.01 * css.w / 2);
      const endScale = sq.ok ? (sq.w * unitPerPx) / CORE.s : 0.15;
      sealMid.lerpVectors(sealFrom, sealTo, 0.5).addScaledVector(camera.up, 1.6);
      const k = trv, a = (1 - k) * (1 - k), b = 2 * (1 - k) * k, cc = k * k;
      seal.position.set(sealFrom.x * a + sealMid.x * b + sealTo.x * cc, sealFrom.y * a + sealMid.y * b + sealTo.y * cc, sealFrom.z * a + sealMid.z * b + sealTo.z * cc);
      const grow = p2InOut((cmp - 0.25) / 0.75);
      seal.scale.setScalar(Math.max(0.001, lerp(1.0 * grow, endScale, trv)));
      qFace.copy(camera.quaternion);
      seal.quaternion.slerpQuaternions(qId, qFace, smooth(0.15, 0.95, trv));
      sealU.uShade.value = 1 - smooth(0.6, 0.95, trv);
      const land = smooth(0.74, 0.8, p) * (1 - smooth(0.8, 0.9, p));
      sealU.uGlow.value = 0.3 * (1 - smooth(0.8, 0.88, p)) + land * 0.5;
      sealU.uA.value = 1 - smooth(0.86, 0.92, p);
      sealEdgesMat.opacity = 0.6 * grow * (1 - smooth(0.55, 0.85, trv));
      flash.visible = land > 0.005;
      flash.position.copy(sealTo); flash.scale.setScalar(endScale * CORE.s * (3 + land * 4)); flashMat.opacity = land * 0.8;
      coreLight.position.copy(seal.position); coreLight.intensity = Math.max(coreLight.intensity, 5 * (1 - trv));
    }

    silhouette(bubbleLine, c.bubble, c.bubbleHalf, BUBBLE.r, camera);
    silhouette(coreLine, c.core, c.coreHalf, CORE.r, camera);
    bubbleLine.visible = c.bubble.visible; coreLine.visible = c.core.visible;
    post.mix.uGrain.value = 0.018 * outF * (rm ? 0 : 1);
    post.mix.uVig.value = 0.012 * outF;
    post.mix.uTime.value = clock;
    world.visible = p < 0.95;
  };

  // between the glow's source and the frame: the shadow map (once a frame), then the glass's picture (point sizes at its half size)
  // (in the picture the core is drawn darker: an object behind frost reads as a soft shadow of itself, a white one on white would vanish)
  const coreTone = new THREE.Color(0xf2f2f0), coreShade = new THREE.Color(0xb4bdb9);
  const sizes = (k: number) => {
    glyphMat.uniforms.uSize.value = glyphPx * k; packMat.uniforms.uSize.value = dotPx * k;
    coreMat.color.copy(k < 1 ? coreShade : coreTone);
  };
  const before = () => {
    renderer.shadowMap.needsUpdate = true;
    diff.render(scene, camera, glass, () => sizes(0.5), () => sizes(1));
  };
  function draw() { place(0); post.render(before); }

  /* the loop: only while on screen and the tab is visible; the pixel ratio steps down if frames keep running long */
  let last = 0, seen = true, dead = false, slow = 0, frames = 0;
  const tick = (now: number) => {
    raf = 0; if (dead) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
    t += dt; clock += dt; if (t > INTRO) loopT += dt;
    shown = damp(shown, prog, 10, dt); if (Math.abs(shown - prog) < 1e-4) shown = prog;
    place(dt); post.render(before);
    if (dt > 0) { frames++; slow += dt > 0.024 ? 1 : 0; }
    if (frames >= 90) { if (slow > 45 && pr > 1) { pr = Math.max(1, pr - 0.25); fit(); } frames = 0; slow = 0; }
    if (seen && !document.hidden) raf = requestAnimationFrame(tick);
  };
  const go = () => { if (!rm && !raf && seen && !document.hidden && !dead) { last = 0; raf = requestAnimationFrame(tick); } };
  const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; go(); }, { threshold: 0 });
  const ro = new ResizeObserver(() => fit());
  const vis = () => go();

  // compile every program before the first frame (so the intro doesn't stutter), with everything visible once
  fit();
  place(0);
  const hidden: THREE.Object3D[] = [];
  scene.traverse((o) => { if (!o.visible) { hidden.push(o); o.visible = true; } });
  try { await renderer.compileAsync(scene, camera); } catch { /* compiled on first use instead */ }
  for (const o of hidden) o.visible = false;

  ro.observe(box); ro.observe(canvas); io.observe(canvas);
  if (opts.square) ro.observe(opts.square);
  addEventListener("resize", fit);
  document.addEventListener("visibilitychange", vis);
  t = rm ? 99 : 0; clock = 0;
  fit();
  go();

  return {
    setProgress(p: number) {
      prog = clamp(p);
      if (rm || !raf) { shown = prog; draw(); }
    },
    dispose() {
      dead = true; cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect(); removeEventListener("resize", fit); document.removeEventListener("visibilitychange", vis);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
        for (const mt of mats) mt.dispose();
      });
      [micro, glowTex, aoTex, ringTex, atlas, env].forEach((x) => x.dispose());
      diff.dispose(); post.dispose();
      renderer.dispose(); renderer.forceContextLoss();
    },
  };
}
