// Hero "Private by design" C: the isometric ring (Figma node 1123:610) in three.js with the full treatment: physical glass with real transmission,
// satin white blocks with a brushed micro-texture and engraved lines, metal screws, perforated panels, an environment for the reflections; a soft key
// light (VSM shadows), a fill, a moving rim light, green point lights that travel with the energy and light the parts round it, contact occlusion under
// the blocks, caustics on the floor under the glass; selective bloom on the green only, depth of field while the camera moves, a faint grain and vignette
// (./post.ts); dissolves, energy and the seal in the materials (./fx.ts). Geometry: ./ring.ts (study B's ring at the drawing's measures).
// At rest it IS the drawing: the camera is a perspective one with its projection set by hand, a quarter of a degree from far away (the isometric),
// framed so the ring sits exactly where the drawing sits in .hp__art; the canvas covers the whole hero, so nothing is ever cut by an edge.
//   1 · Intro (~1.9 s, as soon as the scene is compiled): one soft wave. The camera eases back from slightly closer and higher; the eight parts arrive in
//       turn round the ring from just outside their places, dissolving in through a green-lit edge; the core and bubble first, the orbits and guides draw
//       on, the satellites last; a pulse of light runs through all the green (the settle) and the loop starts from rest.
//   2 · Loop, one 8 s cycle: INFLOW (0–2 s) packets of light with trails leave the satellites (which glow as they send) and run the guides into the ring;
//       CIRCULATION (2–4.5) one front of light runs round the rails and through the glass, a green light travelling with it, embers rising behind it;
//       CHARGE (4.5–5.5) the core takes it: the bubble's iridescence and glow swell, sparks rise in it, the core lifts; RELEASE (5.5–8) a ripple runs out
//       over the floor, each orbit lights as it passes, the satellites rise and settle in turn round the ring. Under it: caustics drift under the glass,
//       packets circle the orbits, the orbits turn, the core breathes, the key and rim lights swing, the camera drifts a degree.
//   3 · Exit, "seal" (setProgress 0 → 1 over the hero's hold): GATHER (→ 0.45) the satellites fly in along their lines, the guides retract, the orbits
//       contract, the parts slide in and lock tight round the core, the bubble closes, the camera leans in (depth of field on the core); SEAL (→ 0.8) the
//       gathered object turns to green light and compresses into one green cube, which travels, turns face-on and shrinks onto the h1's square (.hp__sq)
//       and lands on it with a soft flash; then (→ 1) only the h1's square remains.
// Intro and exit compose (the exit is applied over whatever the intro has reached). Runs only on screen with the tab visible; DPR ≤ 2 within a pixel
// budget, lowered if frames run long; on small screens no transmission and no depth of field. Reduced motion: one still frame (the component fades it).
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { BUBBLE, CORE, H, HW, RC, buildCore, buildRing, coreMaterials, fromDrawing, materials, outlineLoop, perim, perimPoint, silhouette, type Mats } from "./ring";
import { aoTexture, floorLightMaterial, fx, globalU, glowTexture, microTexture, partU, perforatedTexture, type Kind, type PartU } from "./fx";
import { GLOW, OCC, createPost } from "./post";

export type RingScene = { setProgress(p: number): void; dispose(): void };

const FRAME = { w: 2016, h: 1249, ox: 1081, oy: 625 };
const PX = 100 / Math.sqrt(2 / 3);           // drawing px per camera unit (a world unit along a floor axis projects to √(2/3))
const ISO_EL = Math.atan(1 / Math.SQRT2);    // true isometric: 35.26° down, 45° round
const REST_FOV = THREE.MathUtils.degToRad(0.25);
const INTRO = 1.95;                          // the intro's length; the loop starts after it
const CYCLE = 8;
const GREEN = new THREE.Color("#00dc8d");

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const expoOut = (t: number) => { t = clamp(t); return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); };
const p2InOut = (t: number) => { t = clamp(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
const sineInOut = (t: number) => -(Math.cos(Math.PI * clamp(t)) - 1) / 2;
const damp = (v: number, to: number, k: number, dt: number) => v + (to - v) * (1 - Math.exp(-k * dt));
/** a soft bump: 0 before a, up over [a, b], held, down over [c, d] */
const bump = (v: number, a: number, b: number, c: number, d: number) => smooth(a, b, v) * (1 - smooth(c, d, v));

/** the satellites, as the drawing has them: [x, y, w, h] of their boxes in its frame; cubes, and green trays lying along x or z */
const CUBES = [[355, 44, 43, 48], [1581, 50, 43, 48], [1656, 37, 86, 98], [156, 500, 43, 48], [355, 801, 86, 98], [597, 1009, 43, 48], [365, 1006, 86, 98], [317, 1078, 43, 48], [1737, 1040, 86, 98]];
const TRAYS: [number, number, number, number, "x" | "z"][] = [[417, 54, 81, 59, "x"], [419, 186, 86, 62, "x"], [1732, 199, 86, 62, "z"], [269, 938, 97, 68, "z"], [1457, 991, 97, 68, "z"], [1740, 968, 81, 59, "x"]];
/** the dashed guides from the satellites to the ring (on the floor), ends in the drawing's frame */
const GUIDES = [[666.7, 577.7, 838.8, 677.1], [349.3, 959.7, 838.8, 677.1], [413.9, 885.2, 446.1, 903.8], [430, 1068.4, 688.2, 919.3], [569.8, 1074.6, 763.5, 962.8],
  [187.9, 543.6, 252.5, 580.8], [1554.2, 872.7, 1747.8, 984.5], [1457.4, 928.6, 1758.6, 1102.5], [1535.9, 1013.7, 1570.3, 993.9], [1672.5, 1052.9, 1769.3, 997],
  [487, 107.5, 650.5, 201.9], [475.2, 231.1, 559.1, 279.6], [1629.5, 320, 1745.7, 252.9], [1803.8, 219.3, 1844.6, 195.7]];
/** the orbits: radii of the drawing's dashed ellipses (rx / 122.47) */
const ORBITS = [1.862, 2.608, 3.353, 7.331, 8.076, 8.818];

/** a green tray: a rim of glass round a sunken floor */
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

export async function mount(canvas: HTMLCanvasElement, box: HTMLElement, opts: { reduced: boolean; square: HTMLElement | null }): Promise<RingScene> {
  const rm = opts.reduced;
  const hi = innerWidth >= 1000;   // large screens: transmission and depth of field
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, stencil: false, powerPreference: "high-performance" });
  renderer.setClearColor("#f5f5f5", 1);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap; renderer.shadowMap.autoUpdate = false;
  renderer.transmissionResolutionScale = 0.5;

  const scene = new THREE.Scene();
  const world = new THREE.Group(); scene.add(world);
  const pm = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  const env = pm.fromScene(room, 0.04).texture; pm.dispose(); room.dispose();

  const camera = new THREE.PerspectiveCamera();
  const target = new THREE.Vector3();

  /* lights: a soft fill from the sky, a key (VSM shadows) that swings slowly, a cool rim from behind that circles, green lights that travel with the energy */
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
  const floor = new THREE.Mesh(new THREE.CircleGeometry(12.5, 64), floorMat);   // inside the shadow camera (past it, its edge shows as streaks)
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; world.add(floor);

  /* the shared effect uniforms and textures */
  const micro = microTexture(), perf = perforatedTexture(), glowTex = glowTexture(), aoTex = aoTexture();
  const g = globalU(micro);
  const kindOf = (m: Mats, mat: THREE.Material): Kind =>
    mat === m.rail ? "rail" : mat === m.white ? "block" : mat === m.housing ? "solid" : mat === m.grey || mat === m.slot ? "metal" : mat === m.line ? "line" : "glass";
  /** a set of materials wired to one part's uniforms, layered for the bloom (green: GLOW; solid: OCC, it hides the glow behind it) */
  const wire = (root: THREE.Object3D, m: Mats, u: PartU, hasS: boolean) => {
    const done = new Set<THREE.Material>();
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.material || Array.isArray(mesh.material)) return;
      const mat = mesh.material, k = mesh.userData.perf ? "glass" : kindOf(m, mat);
      if (k === "rail") mesh.layers.enable(GLOW);
      if (k === "block" || k === "solid" || k === "metal") mesh.layers.enable(OCC);
      if (!done.has(mat)) { done.add(mat); fx(mat, g, u, k, hasS && !mesh.userData.perf); }
    });
  };

  /* the ring: eight parts, each with its own materials, on a pivot at its own centre, in order round the ring */
  const pieces = buildRing(() => materials(hi), perf).map((pt) => {
    const c = new THREE.Box3().setFromObject(pt.g).getCenter(new THREE.Vector3()); c.y = 0;
    const u = partU();
    wire(pt.g, pt.m, u, true);
    let ao: THREE.Mesh | null = null;
    // contact occlusion under the sides' blocks (a soft dark rectangle under the part's footprint)
    if (pt.k === 1) {
      const bb = new THREE.Box3().setFromObject(pt.g), sz = bb.getSize(new THREE.Vector3()), mid = bb.getCenter(new THREE.Vector3());
      ao = new THREE.Mesh(new THREE.PlaneGeometry(sz.x * 1.55, sz.z * 1.55).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: aoTex, transparent: true, opacity: 0.1, depthWrite: false }));
      ao.position.set(mid.x, 0.004, mid.z); ao.renderOrder = -2; pt.g.add(ao);
    }
    const pivot = new THREE.Group(); pivot.position.copy(c); pt.g.position.copy(c).negate(); pivot.add(pt.g); world.add(pivot);
    return { ...pt, pivot, c, u, ao, order: perim(c.x, c.z) };
  }).sort((a, b) => a.order - b.order);

  /* the core in its bubble, their outlines (redrawn each frame from the camera), the core's halo */
  const cm = coreMaterials(hi);
  cm.core.envMap = env;
  const coreU = partU(), bubbleU = partU();
  fx(cm.core, g, coreU, "core", false);
  fx(cm.bubble, g, bubbleU, "bubble", false);
  fx(cm.fine, g, bubbleU, "line", false);
  const c = buildCore(cm);
  c.core.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.layers.enable(OCC); });
  world.add(c.bubble, c.core);
  const bubbleLineMat = new THREE.LineBasicMaterial({ color: "#1d5c43", transparent: true, opacity: 0.6 });
  const coreLineMat = new THREE.LineBasicMaterial({ color: "#111111", transparent: true, opacity: 0.85 });
  const bubbleLine = outlineLoop(bubbleLineMat), coreLine = outlineLoop(coreLineMat);
  world.add(bubbleLine, coreLine);
  const haloMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0, depthWrite: false });
  const halo = new THREE.Sprite(haloMat); halo.scale.setScalar(4.2); halo.renderOrder = -1; c.core.add(halo);
  const bubbleMat = cm.bubble as THREE.MeshStandardMaterial;

  /* the seal: one green cube (the drawing's flat green, shaded per face while it travels, flat when it lands) and its flash */
  const sealU = { uShade: { value: 1 }, uGlowPass: g.uGlowPass, uGlow: { value: 1 }, uCol: { value: GREEN.clone() }, uA: { value: 1 } };
  const sealMat = new THREE.ShaderMaterial({
    uniforms: sealU, transparent: true,
    vertexShader: "varying vec3 vN; void main(){ vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform float uShade, uGlowPass, uGlow, uA; uniform vec3 uCol; varying vec3 vN;
void main(){ vec3 n = normalize(vN); float s = mix(1.0, n.y > 0.5 ? 1.0 : (abs(n.x) > abs(n.z) ? 0.86 : 0.74), uShade);
  vec3 col = uCol * s * mix(1.0, uGlow, uGlowPass);
  gl_FragColor = vec4(col, uA);
  #include <colorspace_fragment>
}`,
  });
  const seal = new THREE.Mesh(new THREE.BoxGeometry(CORE.s, CORE.s, CORE.s), sealMat);
  const sealEdgesMat = new THREE.LineBasicMaterial({ color: "#0b6e4a", transparent: true, opacity: 0 });
  seal.add(new THREE.LineSegments(new THREE.EdgesGeometry(seal.geometry), sealEdgesMat));
  seal.layers.enable(GLOW); seal.visible = false; seal.renderOrder = 6; scene.add(seal);
  const flashMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0, depthWrite: false, depthTest: false });
  const flash = new THREE.Sprite(flashMat); flash.renderOrder = 7; flash.visible = false; scene.add(flash);

  /* the satellites: each its own materials (they dissolve, glow and seal one by one) */
  type Sat = { g: THREE.Group; base: THREE.Vector3; ph: number; out: THREE.Vector3; order: number; u: PartU; heat: number };
  const sats: Sat[] = [];
  const addSat = (grp: THREE.Group, px: number, py: number, hgt: number, lift: number, u: PartU) => {
    const f = fromDrawing(px, py, hgt / 2 + lift);
    grp.position.set(f.x, hgt / 2 + lift, f.z); world.add(grp);
    sats.push({ g: grp, base: grp.position.clone(), ph: sats.length * 1.7, out: new THREE.Vector3(f.x, 0, f.z).normalize(), order: perim(f.x, f.z), u, heat: 0 });
  };
  const satLine = () => new THREE.LineBasicMaterial({ color: "#111111", transparent: true, opacity: 0.85 });
  for (const [x, y, w, h] of CUBES) {
    const u = partU(), white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.58, envMapIntensity: 0.4 }), line = satLine();
    fx(white, g, u, "solid", false); fx(line, g, u, "line", false);
    const s = w / 173.2, geo = new THREE.BoxGeometry(s, s, s), grp = new THREE.Group(), mesh = new THREE.Mesh(geo, white);
    mesh.castShadow = true; mesh.layers.enable(OCC); grp.add(mesh, new THREE.LineSegments(new THREE.EdgesGeometry(geo), line));
    addSat(grp, x + w / 2, y + h / 2, s, 0.12, u);
  }
  for (const [x, y, w, h, ax] of TRAYS) {
    const u = partU();
    const tm = { rim: new THREE.MeshStandardMaterial({ color: "#14d488", roughness: 0.4, transparent: true, opacity: 0.85 }),
      floor: new THREE.MeshStandardMaterial({ color: "#7fe8bd", roughness: 0.4, transparent: true, opacity: 0.85 }), line: satLine() };
    fx(tm.rim, g, u, "glass", false); fx(tm.floor, g, u, "glass", false); fx(tm.line, g, u, "line", false);
    addSat(tray(w / 86.6 - 0.31, ax, tm), x + w / 2, y + h / 2, 0.12, 0.12, u);
  }
  const satRank = sats.map((s) => s.order).sort((a, b) => a - b);
  for (const s of sats) s.order = satRank.indexOf(s.order) / sats.length;   // 0…1 round the ring, evenly

  /* the floor: dashed orbits and guides (each its own material, so the ripple can light it), the caustics and the ripple */
  const SEG = 720;
  const orbits = ORBITS.map((r, i) => {
    const mat = new THREE.LineDashedMaterial({ color: "#111111", transparent: true, opacity: 0.85, dashSize: 0.05, gapSize: 0.075 });
    const a0 = -Math.PI * 0.75;   // drawn on from the back
    const pts = Array.from({ length: SEG + 1 }, (_, j) => { const a = a0 + (j / SEG) * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * r, 0.003, Math.sin(a) * r); });
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat); l.computeLineDistances();
    l.userData.w = (i % 2 ? -1 : 1) * (0.022 / Math.sqrt(r)); world.add(l);
    return { l, mat, r };
  });
  const guideEnds = GUIDES.map(([x0, y0, x1, y1]) => {
    const a = fromDrawing(x0, y0), b = fromDrawing(x1, y1);
    const A = new THREE.Vector3(a.x, 0.003, a.z), B = new THREE.Vector3(b.x, 0.003, b.z);
    return A.length() < B.length() ? [A, B] : [B, A];   // from the ring outward
  });
  const guides = guideEnds.map(([A, B]) => {
    const mat = new THREE.LineDashedMaterial({ color: "#111111", transparent: true, opacity: 0.85, dashSize: 0.05, gapSize: 0.068 });
    const pts = Array.from({ length: 41 }, (_, j) => A.clone().lerp(B, j / 40));
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat); l.computeLineDistances(); world.add(l);
    // the satellite this guide serves (nearest its outer end) and when its packet leaves in the cycle (round the ring)
    let best = 0, bd = 1e9;
    sats.forEach((s, k) => { const d = Math.hypot(s.base.x - B.x, s.base.z - B.z); if (d < bd) { bd = d; best = k; } });
    return { l, mat, A, B, sat: best, at: 0.05 + perim(B.x, B.z) * 0.45, mid: (A.length() + B.length()) / 2 };
  });
  const floorLight = new THREE.Mesh(new THREE.PlaneGeometry(22, 22).rotateX(-Math.PI / 2), floorLightMaterial(H, RC, HW, { half: BUBBLE.w / 2, r: BUBBLE.r }));
  floorLight.position.y = 0.002; floorLight.renderOrder = -1; world.add(floorLight);
  const fl = (floorLight.material as THREE.ShaderMaterial).uniforms;

  /* the light particles: packets with trails on the guides (inflow) and the orbits, embers behind the front, sparks in the bubble */
  const TR_G = 9, TR_O = 6, N_EMB = 26, N_SPK = 34;
  const NP = GUIDES.length * TR_G + ORBITS.length * 2 * TR_O + N_EMB + N_SPK;
  const pg = new THREE.BufferGeometry();
  pg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(NP * 3), 3));
  pg.setAttribute("aA", new THREE.BufferAttribute(new Float32Array(NP), 1));
  pg.setAttribute("aZ", new THREE.BufferAttribute(new Float32Array(NP), 1));
  const packMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uSize: { value: 10 } },
    vertexShader: "attribute float aA; attribute float aZ; varying float vA; uniform float uSize; void main(){ vA = aA; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = uSize * aZ; if (aA < 0.004) gl_PointSize = 0.0; }",
    // colours written as sRGB-ready linear (the output pass converts): a pale core in a green halo
    fragmentShader: "varying float vA; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float core = smoothstep(0.42, 0.08, d); float halo = smoothstep(1.0, 0.15, d);" +
      " vec3 col = mix(vec3(0.0, 0.716, 0.266), vec3(0.75, 1.0, 0.88), core); float a = (halo * 0.5 + core * 0.5) * vA; if (a < 0.01) discard; gl_FragColor = vec4(col, a); }",
  });
  const packets = new THREE.Points(pg, packMat); packets.frustumCulled = false; packets.renderOrder = 5; packets.layers.enable(GLOW); world.add(packets);

  /* framing: the box (.hp__art) shows the drawing's frame; the canvas covers the hero, so the view extends to match */
  const view = { l: -1, r: 1, t: 1, b: -1 };   // the canvas's edges on the plane through the target, camera units, at rest
  const sq = { x: 0, y: 0, w: 0, ok: false };  // the h1's square, css px from the canvas's top-left
  const css = { w: 1, h: 1 };
  let pr = Math.min(devicePixelRatio || 1, 2);
  const BUDGET = hi ? 5.4e6 : 2.6e6;           // device pixels: 1440 × 900 at 2x fits
  const post = createPost(renderer, scene, camera, g.uGlowPass, { dof: hi && !rm });
  let raf = 0;
  const fit = () => {
    const cr = canvas.getBoundingClientRect(), br = box.getBoundingClientRect();
    const w = Math.max(1, cr.width), h = Math.max(1, cr.height);
    css.w = w; css.h = h;
    const p = Math.min(pr, Math.sqrt(BUDGET / (w * h)));
    renderer.setPixelRatio(p); renderer.setSize(w, h, false);
    post.setSize(w, h, p);
    const k = FRAME.h / PX / Math.max(1, br.height);   // camera units per css px
    view.l = -FRAME.ox / PX - (br.left - cr.left) * k; view.r = (FRAME.w - FRAME.ox) / PX + (cr.right - br.right) * k;
    view.t = FRAME.oy / PX + (br.top - cr.top) * k; view.b = -(FRAME.h - FRAME.oy) / PX - (cr.bottom - br.bottom) * k;
    packMat.uniforms.uSize.value = 9 * p * clamp(br.width / 540, 0.6, 1.4);
    post.mix.uCenter.value.set((br.left + br.width / 2 - cr.left) / w, 1 - (br.top + br.height / 2 - cr.top) / h);
    if (opts.square) {
      const r = opts.square.getBoundingClientRect();
      Object.assign(sq, { x: r.left + r.width / 2 - cr.left, y: r.top + r.height / 2 - cr.top, w: r.width, ok: r.width > 0 });
    }
    if (rm || !raf) draw();
  };

  /** the camera: round the target by az / el, the plane through the target spanning the view (scaled by s, shifted by ox / oy), seen with fov */
  const setCam = (az: number, el: number, fov: number, s: number, ox: number, oy: number) => {
    const vl = view.l * s + ox, vr = view.r * s + ox, vt = view.t * s + oy, vb = view.b * s + oy;
    const d = (vt - vb) / 2 / Math.tan(fov / 2), near = Math.max(0.1, d - 60), far = d + 80;
    camera.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d).add(target);
    camera.up.set(0, 1, 0); camera.lookAt(target); camera.updateMatrixWorld();
    camera.near = near; camera.far = far;
    const q = near / d;
    camera.projectionMatrix.makePerspective(vl * q, vr * q, vt * q, vb * q, near, far);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    return d;
  };

  /* state */
  let prog = 0, shown = 0, t = rm ? 99 : 0, loopT = 0, clock = 0;
  const v = new THREE.Vector3(), v2 = new THREE.Vector3(), qFace = new THREE.Quaternion(), qId = new THREE.Quaternion();
  const sealFrom = new THREE.Vector3(), sealTo = new THREE.Vector3(), sealMid = new THREE.Vector3();

  const place = (dt: number) => {
    const p = shown;
    const cyc = rm ? 0 : loopT % CYCLE;
    const live = rm ? 0 : smooth(INTRO - 0.3, INTRO + 0.4, t);   // the loop's continuous layer, faded in at the end of the intro
    /* exit phases */
    const gth = p2InOut(p / 0.45);                 // gather
    const cmp = p2InOut((p - 0.45) / 0.11);        // compress into the cube
    const trv = sineInOut((p - 0.56) / 0.24);      // travel and land
    const heat = smooth(0.36, 0.52, p);            // everything turning to green light
    const outF = 1 - smooth(0.8, 0.95, p);         // grain and vignette leave with the drawing

    /* the loop's story */
    const front = clamp((cyc - 2) / 2.5), frontAmp = bump(cyc, 2.0, 2.35, 4.25, 4.75) * live;
    const charge = bump(cyc, 4.4, 5.05, 5.45, 6.4) * live;
    const ripT = clamp((cyc - 5.5) / 2.3), ripA = bump(cyc, 5.5, 5.75, 7.2, 7.95) * live;
    const flashI = rm ? 0 : Math.exp(-Math.pow((t - 1.72) / 0.17, 2));   // the intro's settle

    g.uT.value = clock;
    g.uFront.value = 0.08 + front * 1.0;
    g.uFrontAmp.value = frontAmp * (1 - gth);
    g.uFlash.value = flashI + charge * 0.15;
    g.uCharge.value = charge * (1 - gth);
    fl.uT.value = clock; fl.uCaus.value = live * (1 - smooth(0, 0.18, p)) * (rm ? 0 : 1);
    fl.uRip.value = lerp(1.6, 10.5, 1 - Math.pow(1 - ripT, 2)); fl.uRipA.value = ripA * (1 - smooth(0, 0.15, p));

    /* the camera: intro (a touch closer, higher, turned) → rest (the drawing) → gather (leans in) → seal (back to the drawing's view, where it lands) */
    const ci = rm ? 1 : expoOut((t - 0.02) / 1.7);
    const lean = gth * (1 - smooth(0.45, 0.7, p));
    target.set(0, lerp(CORE.y * 0.6, 0, ci) + lean * CORE.y * 0.7, 0);
    const az = Math.PI / 4 + lerp(0.12, 0, ci) + live * Math.sin(clock * 0.09) * 0.0087 + lean * 0.1;
    const el = ISO_EL + lerp(0.07, 0, ci) + live * Math.sin(clock * 0.07 + 1) * 0.005 - lean * 0.06;
    const fov = Math.max(REST_FOV, lerp(0.22, 0, ci) + lean * 0.28);
    const s = lerp(0.86, 1, ci) * (1 + 0.006 * flashI) * (1 - lean * 0.16);
    const dist = setCam(az, el, fov, s, 0, 0);
    if (post.bokeh) {
      const dof = (1 - smooth(0.2, 1.3, t)) * (rm ? 0 : 1) + smooth(0.02, 0.18, p) * (1 - smooth(0.5, 0.62, p));
      post.bokeh.enabled = dof > 0.01;
      const bu = post.bokeh.uniforms as Record<string, { value: number }>;
      bu.focus.value = dist; bu.aperture.value = 0.0014 * dof;
    }

    /* lights: the key swings slowly (the shadows move), the rim circles behind, the green lights follow the front and the core */
    const ka = rm ? 0 : Math.sin(clock * 0.06) * 0.08;
    key.position.set(6.45 * Math.cos(ka) - 8.8 * Math.sin(ka), 10.35, 6.45 * Math.sin(ka) + 8.8 * Math.cos(ka));
    const ra = clock * 0.11;
    rim.position.set(-8 * Math.cos(ra * 0.5) - 3, 4, -8 * Math.sin(ra * 0.5 + 0.6) - 3);
    perimPoint(g.uFront.value, frontLight.position); frontLight.position.y = 0.95;
    frontLight.intensity = 6 * g.uFrontAmp.value;
    floorMat.opacity = 0.16 * (1 - smooth(0.3, 0.5, p)) * (rm ? 1 : smooth(0.3, 1.4, t));

    /* the ring's parts: arrive in turn (intro); slide in and lock round the core (gather); compress into it (seal) */
    const TIGHT = 0.42;
    pieces.forEach((pc, i) => {
      const at = 0.1 + i * 0.055;
      const land = rm ? 1 : expoOut((t - at) / 1.05);
      pc.u.uBuild.value = rm ? 1 : smooth(at - 0.02, at + 0.55, t) * (1 - smooth(0.5, 0.56, p));
      const gi = p2InOut((gth - (pc.k > 1 ? 0.14 : 0)) / 0.86);
      const sc = lerp(1, TIGHT, gi) * (1 - cmp * 0.97);
      const off = (1 - land) * 0.85;
      // lifted as it closes so the tight ring wraps the core's middle (its own height scales with it)
      pc.pivot.position.set((pc.c.x + pc.dir.x * off) * sc, (1 - land) * 0.4 + lerp(0, CORE.y - sc * 0.745, gi) + Math.sin(Math.PI * gi) * 0.2, (pc.c.z + pc.dir.z * off) * sc);
      pc.pivot.scale.setScalar(Math.max(0.001, sc));
      pc.pivot.rotation.y = Math.sin(Math.PI * gi) * 0.12 * (i % 2 ? 1 : -1) + cmp * 0.6;
      if (pc.ao) (pc.ao.material as THREE.MeshBasicMaterial).opacity = 0.1 * pc.u.uBuild.value * (1 - gi);
      pc.u.uHeat.value = heat;
      pc.pivot.visible = pc.u.uBuild.value > 0.001;
    });

    /* the core: breathes; flashes on the settle; lifts and glows on the charge; turns green and gives way to the seal */
    const breath = rm ? 0 : Math.sin((cyc / CYCLE) * Math.PI * 2) * live;
    const coreIn = rm ? 1 : expoOut(t / 0.95);
    coreU.uBuild.value = rm ? 1 : smooth(0, 0.45, t) * (1 - smooth(0.5, 0.56, p));
    c.core.position.y = CORE.y + breath * 0.03 + charge * 0.09 + lean * 0.15;
    c.core.scale.setScalar((1 + breath * 0.01 + charge * 0.02) * lerp(0.9, 1, coreIn) * (1 - cmp * 0.5));
    c.core.rotation.y = cmp * 0.6;
    coreU.uHeat.value = heat;
    haloMat.opacity = flashI * 0.5 + charge * 0.55 + heat * 0.18 * (1 - cmp);
    halo.scale.setScalar(4.2 * (1 + charge * 0.35));
    c.core.visible = coreU.uBuild.value > 0.001;
    if (heat > 0) c.core.children.forEach((o) => o.layers.enable(GLOW)); else c.core.children.forEach((o) => o.layers.disable(GLOW));
    coreLight.position.set(0, c.core.position.y + CORE.s * 0.9, 0);   // just above the core (inside it, it would light only the core's inside)
    coreLight.intensity = (charge * 5 + flashI * 3 + heat * 1.5 * (1 - cmp)) * (rm ? 0 : 1);
    // the bubble: dissolves in; its iridescence and rim glow swell with the charge; closes in on the core (gather) and with it (seal)
    bubbleU.uBuild.value = rm ? 1 : smooth(0.08, 0.6, t) * (1 - smooth(0.48, 0.55, p));
    bubbleU.uHeat.value = heat * 0.5;
    const bs = lerp(1, 0.8, gth) * (1 - cmp * 0.6);
    c.bubble.position.y = BUBBLE.y + lean * 0.15;
    c.bubble.scale.setScalar(bs);
    if ("iridescence" in bubbleMat) (bubbleMat as THREE.MeshPhysicalMaterial).iridescence = 0.15 + charge * 0.85;
    cm.fine.opacity = 0.45 * (1 - heat);
    bubbleLineMat.opacity = 0.6 * bubbleU.uBuild.value * (1 - heat * 0.6);
    coreLineMat.opacity = 0.85 * coreU.uBuild.value * (1 - heat);
    c.bubble.visible = bubbleU.uBuild.value > 0.001;

    /* the satellites: arrive last; send their packet (glow); rise in turn on the release; fly in along their lines and into the core (gather) */
    for (const st of sats) {
      const at = 0.42 + st.order * 0.55;
      const land = rm ? 1 : expoOut((t - at) / 0.95);
      const rs = 5.6 + st.order * 1.35, rise = Math.pow(Math.sin(Math.PI * clamp((cyc - rs) / 0.95)), 2) * 0.22 * live;
      const bob = Math.sin(clock * 0.7 + st.ph) * 0.035 * live;
      const gi = p2InOut((gth - st.order * 0.3) / 0.7);
      v.set(st.base.x + st.out.x * (1 - land) * 0.7, st.base.y + (1 - land) * 0.35 + rise + bob, st.base.z + st.out.z * (1 - land) * 0.7);
      v2.set(st.out.x * 1.05, CORE.y + 0.2, st.out.z * 1.05);   // the edge of the closing bubble
      st.g.position.lerpVectors(v, v2, gi);
      st.g.position.y += Math.sin(Math.PI * gi) * 0.6;
      st.g.scale.setScalar(Math.max(0.001, lerp(1, 0.45, gi)));
      st.g.rotation.y = Math.sin(clock * 0.25 + st.ph) * 0.05 * live + gi * 1.2;
      st.u.uBuild.value = rm ? 1 : smooth(at - 0.02, at + 0.45, t) * (1 - smooth(0.82, 1, gi));
      st.u.uHeat.value = Math.max(st.heat * live * (1 - gth), smooth(0.4, 0.9, gi));
      st.g.visible = st.u.uBuild.value > 0.001;
      st.heat = 0;
    }

    /* the orbits: draw on, turn (their dashes flow), light as the ripple passes; contract into the bubble (gather) */
    const ripR = fl.uRip.value;
    orbits.forEach((o, i) => {
      const at = 0.16 + i * 0.05;
      const on = rm ? 1 : expoOut((t - at) / 1.1);
      o.l.geometry.setDrawRange(0, Math.floor(on * SEG) + 1);
      o.l.rotation.y += (o.l.userData.w as number) * dt * live;
      const oc = lerp(1, 0.16, p2InOut((gth - (ORBITS.length - 1 - i) * 0.05) / 0.75));
      o.l.scale.setScalar(oc);
      const lit = Math.exp(-Math.pow((ripR - o.r) / 0.55, 2)) * fl.uRipA.value;
      o.mat.color.setRGB(lerp(0.0056, 0, lit), lerp(0.0056, 0.6, lit), lerp(0.0056, 0.25, lit));
      o.mat.opacity = (0.85 + lit * 0.15) * on * (1 - smooth(0.3, 0.46, p));
      o.l.visible = on > 0.002 && p < 0.47;
    });

    /* the guides: draw on; light as the ripple passes; retract into the ring (gather). Their packets carry the inflow. */
    const pp = pg.attributes.position as THREE.BufferAttribute, pa = pg.attributes.aA as THREE.BufferAttribute, pz = pg.attributes.aZ as THREE.BufferAttribute;
    let n = 0;
    const pkVis = (1 - smooth(0.05, 0.3, p));
    guides.forEach((gd, i) => {
      const at = 0.5 + i * 0.02;
      const on = rm ? 1 : expoOut((t - at) / 0.8);
      const back = p2InOut((gth - 0.05) / 0.6);
      gd.l.geometry.setDrawRange(0, Math.max(0, Math.floor(on * (1 - back) * 40) + 1));
      const lit = Math.exp(-Math.pow((ripR - gd.mid) / 0.8, 2)) * fl.uRipA.value;
      gd.mat.color.setRGB(lerp(0.0056, 0, lit), lerp(0.0056, 0.6, lit), lerp(0.0056, 0.25, lit));
      gd.mat.opacity = 0.85 * (1 - smooth(0.35, 0.45, p));
      gd.l.visible = on > 0.01 && back < 0.999;
      // the inflow: a packet leaves the satellite's end and runs the guide into the ring, a trail behind it
      const hd = (cyc - gd.at) / 1.25;
      if (hd > -0.05 && hd < 1.2) sats[gd.sat].heat = Math.max(sats[gd.sat].heat, bump(hd, -0.05, 0.08, 0.15, 0.55) * 0.55);
      for (let k = 0; k < TR_G; k++) {
        const f = clamp(p2InOut(clamp(hd)) - k * 0.028);
        v.lerpVectors(gd.B, gd.A, f); v.y = 0.05;
        pp.setXYZ(n, v.x, v.y, v.z);
        pa.setX(n, live * pkVis * bump(hd, 0, 0.06, 0.92, 1.12) * (1 - k / TR_G) * (k ? 0.7 : 1));
        pz.setX(n++, (1 - k / TR_G) * 0.85 + 0.25);
      }
    });
    /* orbit packets, two per orbit, with short trails */
    orbits.forEach((o, i) => {
      const r = o.r * o.l.scale.x;
      for (let j = 0; j < 2; j++) {
        const dir = i % 2 ? -1 : 1, ang0 = dir * clock * (0.16 / Math.sqrt(Math.max(0.1, r))) + j * Math.PI + i * 1.3;
        for (let k = 0; k < TR_O; k++) {
          const ang = ang0 - dir * k * 0.022 * (3 / Math.max(1, o.r));
          pp.setXYZ(n, Math.cos(ang) * r, 0.03, Math.sin(ang) * r);
          pa.setX(n, live * pkVis * 0.75 * (1 - k / TR_O));
          pz.setX(n++, (1 - k / TR_O) * 0.7 + 0.2);
        }
      }
    });
    /* embers rising behind the front */
    for (let k = 0; k < N_EMB; k++) {
      const born = 2.05 + (k / N_EMB) * 2.4, age = cyc - born;
      const ok = age > 0 && age < 0.9;
      perimPoint(0.08 + clamp((born - 2) / 2.5), v);
      const sx = Math.sin(k * 12.9898) * 0.5, sz = Math.cos(k * 78.233) * 0.5;
      pp.setXYZ(n, v.x + sx * 0.6, 1.5 + (ok ? age * 0.75 : 0), v.z + sz * 0.6);
      pa.setX(n, ok ? live * pkVis * Math.sin(Math.PI * clamp(age / 0.9)) * 0.75 * (1 - gth) : 0);
      pz.setX(n++, 0.45 + (k % 3) * 0.12);
    }
    /* sparks rising in the bubble while it charges */
    for (let k = 0; k < N_SPK; k++) {
      const ph = (k * 0.618) % 1, life = ((cyc - 4.4) / 1.6 + ph) % 1;
      const sx = Math.sin(k * 3.7) * 0.95, sz = Math.cos(k * 5.1) * 0.95;
      pp.setXYZ(n, sx * bs, (0.15 + life * 1.75) * bs + lean * 0.15, sz * bs);
      pa.setX(n, charge * Math.sin(Math.PI * life) * 0.85);
      pz.setX(n++, 0.32 + (k % 4) * 0.08);
    }
    pp.needsUpdate = true; pa.needsUpdate = true; pz.needsUpdate = true;

    /* the seal: grows inside the compressing core, travels on an arc, turns face-on and lands on the h1's square, flashes, rests under it */
    seal.visible = cmp > 0.25 && p < 0.92;
    flash.visible = false;
    if (seal.visible) {
      camera.updateMatrixWorld();
      sealFrom.set(0, CORE.y + lean * 0.15, 0);
      // the landing point: the square's centre, at the core's depth
      v.copy(sealFrom).project(camera);
      const nx = sq.ok ? (sq.x / css.w) * 2 - 1 : v.x, ny = sq.ok ? 1 - (sq.y / css.h) * 2 : v.y;
      sealTo.set(nx, ny, v.z).unproject(camera);
      // world units per css px there
      v2.copy(sealTo).project(camera); v.set(v2.x + 0.01, v2.y, v2.z).unproject(camera);
      const unitPerPx = v.distanceTo(sealTo) / (0.01 * css.w / 2);
      const endScale = sq.ok ? (sq.w * unitPerPx) / CORE.s : 0.15;
      sealMid.lerpVectors(sealFrom, sealTo, 0.5).addScaledVector(camera.up, 1.6);
      // quadratic arc
      const k = trv, a = (1 - k) * (1 - k), b = 2 * (1 - k) * k, cc = k * k;
      seal.position.set(sealFrom.x * a + sealMid.x * b + sealTo.x * cc, sealFrom.y * a + sealMid.y * b + sealTo.y * cc, sealFrom.z * a + sealMid.z * b + sealTo.z * cc);
      const grow = p2InOut((cmp - 0.25) / 0.75);
      seal.scale.setScalar(Math.max(0.001, lerp(0.85 * grow, endScale, trv)));
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
    g.uFade.value = 1;
    post.mix.uGrain.value = 0.02 * outF * (rm ? 0 : 1);
    post.mix.uVig.value = 0.012 * outF;
    post.mix.uTime.value = clock;
    post.mix.uBloom.value = 1;
    world.visible = p < 0.95;
  };
  const shadows = () => { renderer.shadowMap.needsUpdate = true; };
  function draw() { place(0); post.render(shadows); }

  /* the loop: only while on screen and the tab is visible; the pixel ratio steps down if frames keep running long */
  let last = 0, seen = true, dead = false, slow = 0, frames = 0;
  // verification only (?ringc=debug): hold the clock at a given second, to capture the intro and the loop frame by frame
  let frozen: number | null = null;
  if (/[?&]ringc=debug/.test(location.search)) (window as unknown as { __ringC: unknown }).__ringC = { at: (sec: number | null) => { frozen = sec; }, p: () => shown, pr: () => renderer.getPixelRatio(), scene, lights: { fill, key, rim, frontLight, coreLight }, post };
  const tick = (now: number) => {
    raf = 0; if (dead) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
    if (frozen === null) { t += dt; clock += dt; if (t > INTRO) loopT += dt; }
    else { t = frozen; clock = frozen; loopT = Math.max(0, frozen - INTRO); }
    shown = damp(shown, prog, 10, dt); if (Math.abs(shown - prog) < 1e-4) shown = prog;
    place(dt); post.render(shadows);
    if (dt > 0) { frames++; slow += dt > 0.024 ? 1 : 0; }
    if (frames >= 90) { if (slow > 45 && pr > 1) { pr = Math.max(1, pr - 0.25); fit(); } frames = 0; slow = 0; }
    if (seen && !document.hidden) raf = requestAnimationFrame(tick);
  };
  const go = () => { if (!rm && !raf && seen && !document.hidden && !dead) { last = 0; raf = requestAnimationFrame(tick); } };
  const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; go(); }, { threshold: 0 });
  const ro = new ResizeObserver(() => fit());
  const vis = () => go();

  // the environment, per material (scene.environment would override each material's own envMapIntensity)
  scene.traverse((o) => {
    const mt = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
    if (mt && "isMeshStandardMaterial" in mt && mt.isMeshStandardMaterial && !mt.envMap) mt.envMap = env;
  });

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
        for (const mt of mats) { for (const x of Object.values(mt)) if (x && (x as THREE.Texture).isTexture) (x as THREE.Texture).dispose(); mt.dispose(); }
      });
      [micro, perf, glowTex, aoTex, env].forEach((x) => x.dispose());
      post.dispose();
      renderer.dispose(); renderer.forceContextLoss();
    },
  };
}
