// Hero "Private by design" B: the isometric ring (Figma node 1123:610) rebuilt in three.js (geometry: ./ring.ts) and played in three acts.
// The look: paper ground (#F5F5F5, the clear colour, no tone mapping), white modules lit to the drawing's three greys, mint glass, flat #00DC8D rails,
// the drawing's 1 px ink outlines at 0.85, soft contact shadows. The canvas covers the whole hero (nothing is ever cut by a box edge); the camera is a
// perspective one with its projection set by hand: a quarter-degree field of view from far away, so at rest it IS the drawing's isometric, framed so the
// ring sits exactly where the drawing sits in .hp__art.
//   1 · Intro (~1.9 s, from the first frame): one soft wave. The camera eases back the last few percent into the isometric (expo out); the ring's eight
//       pieces arrive in turn round it from just outside their places, fading in as they come; the glass fills, the orbits and guides draw on, the
//       satellites settle; one front of light runs round the rails as the settle beat. The loop then starts from its rest values.
//   2 · Loop, one 8 s master cycle telling a small story: INFLOW (0–2 s) packets of light travel the guides from the satellites into the ring;
//       CIRCULATION (2–4.5 s) one front of light runs round the rails and through the glass; CHARGE (4.5–5.5 s) the core takes it: the bubble brightens,
//       the core lifts and glows; RELEASE (5.5–8 s) a ripple runs out over the floor through the orbits, a sheen crosses the glass, the satellites rise
//       and settle in turn round the ring; all back to rest. Under it, always: the orbits' dashes flow, the core breathes, the key light swings slowly,
//       the camera drifts a degree.
//   3 · Exit, "seal" (setProgress 0 → 1 over the hero's hold): GATHER (0–0.45) the satellites fly in, the pieces slide inward and lock tight round the
//       core, the bubble closes, the whole drawing contracts toward the core; SEAL (0.45–0.8) it all compresses into the core, which grows, turns the
//       flat green of the h1's square, and travels and shrinks onto that square (.hp__sq: its place read from the page each frame), landing with a soft
//       flash just under it (the copy sits above the canvas, so the h1's own square covers it); 0.8–1 only that square remains. Reversible.
// Runs only on screen with the tab visible; DPR ≤ 1.75; reduced motion: no intro, no loop, a still frame that fades as the scroll goes.
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { BUBBLE, CORE, buildCore, buildRing, fromDrawing, materials, outlineLoop, perim, silhouette } from "./ring";

export type RingScene = { setProgress(p: number): void; dispose(): void };

const FRAME = { w: 2016, h: 1249, ox: 1081, oy: 625 };
const PX = 100 / Math.sqrt(2 / 3);           // drawing px per camera unit (a world unit along a floor axis projects to √(2/3))
const ISO_EL = Math.atan(1 / Math.SQRT2);    // true isometric: 35.26° down, 45° round
const REST_FOV = THREE.MathUtils.degToRad(0.25);
const CYCLE = 8;                             // the loop's master cycle, seconds
const INTRO = 1.9;                           // the intro's length; the loop starts after it

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ramp = (a: number, b: number, v: number) => clamp((v - a) / (b - a));
const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t)));
const p3Out = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
const p2InOut = (t: number) => { t = clamp(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
const sineInOut = (t: number) => -(Math.cos(Math.PI * clamp(t)) - 1) / 2;
/** a soft bump: 0 → 1 → 0 between a and b */
const bump = (a: number, b: number, v: number) => Math.sin(Math.PI * ramp(a, b, v));
const damp = (v: number, to: number, k: number, dt: number) => v + (to - v) * (1 - Math.exp(-k * dt));

/* ── shaders: one travelling front of light, the sheen, a per-piece fade ────────────────────────────────────────────────────────────────────────── */

type Shared = { uT: { value: number }; uCirc: { value: number }; uSheen: { value: number } };
type U = Shared & { uFade: { value: number } };
/** rails and glass: brightened by the front (head at uT round the ring, its strength uCirc, a long tail behind it); glass also swept by the sheen and
 *  faded by uFade; solids: the sheen only, faint */
function fx(mat: THREE.MeshLambertMaterial, u: U, kind: "rail" | "glass" | "solid", amp = 1, tail = 7, alpha = 0) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute float aS;\nvarying float vS;\nvarying vec3 vW;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvS = aS;\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    const head = "#include <common>\nuniform float uT, uCirc, uSheen, uFade;\nvarying float vS;\nvarying vec3 vW;\n" +
      `float frontAt(float s){float d=fract(uT-s);return uCirc*(exp(-d*${tail.toFixed(1)})*(1.0-smoothstep(0.97,1.0,d)));}` +
      "\nfloat sheenAt(){float x=dot(vW,vec3(0.55,0.62,-0.55))-uSheen;return exp(-x*x*2.5);}";
    let body = "";
    if (kind === "rail") body = `
      totalEmissiveRadiance += vec3(0.62, 1.0, 0.84) * frontAt(vS) * ${amp.toFixed(2)};`;
    if (kind === "glass") body = `
      float pl = frontAt(vS), sh = sheenAt();
      totalEmissiveRadiance += vec3(0.55, 1.0, 0.78) * pl * ${amp.toFixed(2)} + vec3(0.7, 1.0, 0.9) * sh * 0.35;
      diffuseColor.a = min(1.0, diffuseColor.a + pl * ${alpha.toFixed(2)} + sh * 0.07) * uFade;`;
    if (kind === "solid") body = `
      totalEmissiveRadiance += vec3(0.08, 0.09, 0.085) * sheenAt();`;
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", head).replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>" + body);
  };
  mat.customProgramCacheKey = () => `ringfx3-${kind}-${amp}-${tail}-${alpha}`;
}

/** a dot grid (the panels' dotted glass) */
function dotsTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 32;
  const x = c.getContext("2d")!;
  x.fillStyle = "rgba(0,220,141,0.1)"; x.fillRect(0, 0, 32, 32);
  x.fillStyle = "rgba(11,160,104,0.85)"; x.beginPath(); x.arc(16, 16, 3.8, 0, Math.PI * 2); x.fill();
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
/** a soft round glow (the core's halo) */
function glowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d")!, g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(120,240,190,0.9)"); g.addColorStop(0.35, "rgba(0,220,141,0.35)"); g.addColorStop(1, "rgba(0,220,141,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

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
  const g = new THREE.Group(), W = 0.31, H = 0.12, IN = 0.045;
  const s = new THREE.Shape([new THREE.Vector2(-long / 2, -W / 2), new THREE.Vector2(long / 2, -W / 2), new THREE.Vector2(long / 2, W / 2), new THREE.Vector2(-long / 2, W / 2)]);
  s.holes.push(new THREE.Path([new THREE.Vector2(-long / 2 + IN, -W / 2 + IN), new THREE.Vector2(-long / 2 + IN, W / 2 - IN), new THREE.Vector2(long / 2 - IN, W / 2 - IN), new THREE.Vector2(long / 2 - IN, -W / 2 + IN)]));
  const rim = new THREE.ExtrudeGeometry(s, { depth: H, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, -H / 2, 0);
  const floor = new THREE.BoxGeometry(long - 2 * IN, 0.012, W - 2 * IN).translate(0, -H / 2 + 0.035, 0);
  const rimMesh = new THREE.Mesh(rim, m.rim); rimMesh.castShadow = true;
  g.add(rimMesh, new THREE.Mesh(floor, m.floor), new THREE.LineSegments(new THREE.EdgesGeometry(rim, 10), m.line));
  if (ax === "z") g.rotation.y = Math.PI / 2;
  return g;
}

/** a piece's own copies of its materials, so it can fade on its own: opaque ones turn transparent only while they fade */
type Fader = { set(f: number): void };
function fader(root: THREE.Object3D, prep: (orig: THREE.Material, copy: THREE.Material, u: { value: number }) => void): Fader {
  const copies = new Map<THREE.Material, THREE.Material>();
  const uFade = { value: 1 };
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.material || Array.isArray(mesh.material)) return;
    let c = copies.get(mesh.material);
    if (!c) { c = mesh.material.clone(); prep(mesh.material, c, uFade); copies.set(mesh.material, c); }
    mesh.material = c;
  });
  const list = [...copies.values()].map((m) => ({ m, base: m.opacity, opaque: !m.transparent, fx: !!m.userData.fx }));
  let last = -1;
  return {
    set(f: number) {
      if (Math.abs(f - last) < 1e-4) return; last = f;
      uFade.value = f;
      for (const it of list) {
        if (it.fx && !it.opaque) continue;   // glass with the shader: faded by uFade
        it.m.opacity = it.base * f;
        if (it.opaque) { const t = f < 0.999; if (it.m.transparent !== t) { it.m.transparent = t; it.m.needsUpdate = true; } }
      }
    },
  };
}

export function mount(canvas: HTMLCanvasElement, box: HTMLElement, opts: { reduced: boolean; square: () => HTMLElement | null }): RingScene {
  const rm = opts.reduced;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.setClearColor("#f5f5f5", 1);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const world = new THREE.Group(); scene.add(world);
  const pm = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  const env = pm.fromScene(room, 0.04).texture; pm.dispose(); room.dispose();
  const camera = new THREE.PerspectiveCamera();
  const target = new THREE.Vector3();

  /* lights. Lambert divides by π: ambient 0.757 and key 0.236 (×π) give the drawing's #FCFCFC / #F2F1F0 / #EBEAE8 on a white block's three faces */
  scene.add(new THREE.AmbientLight(0xffffff, 0.757 * Math.PI));
  const key = new THREE.DirectionalLight(0xffffff, 0.236 * Math.PI);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 5; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 0.5, far: 50 });
  scene.add(key, key.target);
  const floorMat = new THREE.ShadowMaterial({ color: 0x1a2a22, opacity: 0.14 });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(12.5, 64), floorMat);   // inside the shadow camera (past it, its edge shows as streaks)
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; world.add(floor);

  /* everything that gathers into the core sits in one group, scaled about the core's centre */
  const gather = new THREE.Group(); world.add(gather);
  const shared: Shared = { uT: { value: 0 }, uCirc: { value: 0 }, uSheen: { value: -99 } };

  /* the ring: eight pieces, each on a pivot at its own centre, with its own materials (it fades on its own in the intro), in order round the ring */
  const m = materials();
  m.core.envMap = env;
  const dots = dotsTexture();
  const kinds = new Map<THREE.Material, ["rail" | "glass" | "solid", number, number, number]>([
    [m.rail, ["rail", 1.7, 6, 0]], [m.wall, ["glass", 0.8, 4.5, 0.2]], [m.floor, ["glass", 0.6, 4.5, 0.16]], [m.sleeve, ["glass", 0.55, 5, 0.16]],
    [m.white, ["solid", 0, 0, 0]], [m.housing, ["solid", 0, 0, 0]],
  ]);
  const prep = (orig: THREE.Material, copy: THREE.Material, uFade: { value: number }) => {
    const k = kinds.get(orig);
    if (k) { fx(copy as THREE.MeshLambertMaterial, { ...shared, uFade }, k[0], k[1], k[2], k[3]); copy.userData.fx = true; }
  };
  const pieces = buildRing(m, dots).map((pt) => {
    const c = new THREE.Box3().setFromObject(pt.g).getCenter(new THREE.Vector3()); c.y = 0;
    const pivot = new THREE.Group(); pivot.position.copy(c); pt.g.position.copy(c).negate(); pivot.add(pt.g); gather.add(pivot);
    return { ...pt, pivot, c, order: perim(c.x, c.z), fade: fader(pivot, prep) };
  }).sort((a, b) => a.order - b.order);

  /* the core in its bubble, their outlines (redrawn each frame from the camera), the core's halo */
  const c = buildCore(m);
  gather.add(c.bubble); world.add(c.core);
  const bubbleLineMat = new THREE.LineBasicMaterial({ color: "#1d5c43", transparent: true, opacity: 0.6 });
  const bubbleLine = outlineLoop(bubbleLineMat), coreLineMat = m.line.clone(), coreLine = outlineLoop(coreLineMat);
  world.add(bubbleLine, coreLine);
  const coreCrest = c.core.children[1] as THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  const haloMat = new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, opacity: 0, depthWrite: false });
  const halo = new THREE.Sprite(haloMat); halo.scale.setScalar(3.6); halo.renderOrder = -1; c.core.add(halo);
  const coreMat = m.core; coreMat.emissive.set("#00dc8d"); coreMat.emissiveIntensity = 0;
  const coreWhite = coreMat.color.clone(), black = new THREE.Color(0x000000);
  const bubbleMat = (c.bubble.children[0] as THREE.Mesh).material as THREE.MeshLambertMaterial;

  /* the satellites: each with its own materials (they fade in) */
  type Sat = { g: THREE.Group; base: THREE.Vector3; ph: number; out: THREE.Vector3; order: number; fade: Fader };
  const sats: Sat[] = [];
  const trayMats = {
    rim: new THREE.MeshLambertMaterial({ color: "#2fe0a0", transparent: true, opacity: 0.85 }),
    floor: new THREE.MeshLambertMaterial({ color: "#8ff0cb", transparent: true, opacity: 0.85 }),
    line: m.line,
  };
  const addSat = (g: THREE.Group, px: number, py: number, hgt: number, lift: number) => {
    const f = fromDrawing(px, py, hgt / 2 + lift);
    g.position.set(f.x, hgt / 2 + lift, f.z); gather.add(g);
    sats.push({ g, base: g.position.clone(), ph: sats.length * 1.7, out: new THREE.Vector3(f.x, 0, f.z).normalize(), order: perim(f.x, f.z), fade: fader(g, () => {}) });
  };
  for (const [x, y, w, h] of CUBES) {
    const s = w / 173.2, geo = new THREE.BoxGeometry(s, s, s), g = new THREE.Group(), mesh = new THREE.Mesh(geo, m.white);
    mesh.castShadow = true; g.add(mesh, new THREE.LineSegments(new THREE.EdgesGeometry(geo), m.line));
    addSat(g, x + w / 2, y + h / 2, s, 0.12);
  }
  for (const [x, y, w, h, ax] of TRAYS) addSat(tray(w / 86.6 - 0.31, ax, trayMats), x + w / 2, y + h / 2, 0.12, 0.12);
  sats.sort((a, b) => a.order - b.order);

  /* the floor: dashed orbits and guides (drawn on by their draw ranges), the release's ripple, and the packets of light */
  const orbitMat = new THREE.LineDashedMaterial({ color: "#111111", transparent: true, opacity: 0.85, dashSize: 0.05, gapSize: 0.075 });
  const SEG = 720;
  const orbits = ORBITS.map((r, i) => {
    const a0 = -Math.PI * 0.75;   // drawn on from the back
    const pts = Array.from({ length: SEG + 1 }, (_, j) => { const a = a0 + (j / SEG) * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * r, 0.003, Math.sin(a) * r); });
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), orbitMat); l.computeLineDistances();
    l.userData.w = (i % 2 ? -1 : 1) * (0.022 / Math.sqrt(r)); l.userData.r = r; gather.add(l); return l;
  });
  const guideMat = new THREE.LineDashedMaterial({ color: "#111111", transparent: true, opacity: 0.85, dashSize: 0.05, gapSize: 0.068 });
  const guideEnds = GUIDES.map(([x0, y0, x1, y1]) => {
    const a = fromDrawing(x0, y0), b = fromDrawing(x1, y1);
    const A = new THREE.Vector3(a.x, 0.003, a.z), B = new THREE.Vector3(b.x, 0.003, b.z);
    return A.length() < B.length() ? [A, B] : [B, A];   // from the ring outward
  });
  const guides = guideEnds.map(([A, B]) => {
    const pts = Array.from({ length: 41 }, (_, j) => A.clone().lerp(B, j / 40));
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), guideMat); l.computeLineDistances(); gather.add(l); return l;
  });
  const rippleMat = new THREE.MeshBasicMaterial({ color: "#00dc8d", transparent: true, opacity: 0, depthWrite: false });
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.985, 1, 160), rippleMat);
  ripple.rotation.x = -Math.PI / 2; ripple.position.y = 0.006; gather.add(ripple);
  const NP = ORBITS.length + GUIDES.length;
  const pg = new THREE.BufferGeometry();
  pg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(NP * 3), 3));
  pg.setAttribute("aA", new THREE.BufferAttribute(new Float32Array(NP), 1));
  const packMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uSize: { value: 10 } },
    vertexShader: "attribute float aA; varying float vA; uniform float uSize; void main(){ vA = aA; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = uSize; }",
    // colours written as sRGB (no tone mapping, no conversion here): a pale core in a #00DC8D halo
    fragmentShader: "varying float vA; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float core = smoothstep(0.42, 0.1, d); float halo = smoothstep(1.0, 0.2, d);" +
      " vec3 col = mix(vec3(0.0, 0.86, 0.553), vec3(0.88, 1.0, 0.95), core); float a = (halo * 0.55 + core * 0.45) * vA; if (a < 0.01) discard; gl_FragColor = vec4(col, a); }",
  });
  const packets = new THREE.Points(pg, packMat); packets.frustumCulled = false; packets.renderOrder = 4; gather.add(packets);

  /* framing: the box (.hp__art) shows the drawing's frame; the canvas covers the whole hero, so the view extends to match */
  const view = { l: -1, r: 1, t: 1, b: -1 };   // the canvas's edges on the plane through the target, camera units, at rest
  const cr = { w: 1, h: 1, left: 0, top: 0 };
  let raf = 0;
  const fit = () => {
    const r = canvas.getBoundingClientRect(), br = box.getBoundingClientRect();
    cr.w = Math.max(1, r.width); cr.h = Math.max(1, r.height); cr.left = r.left; cr.top = r.top;
    renderer.setSize(cr.w, cr.h, false);
    const k = FRAME.h / PX / Math.max(1, br.height);   // camera units per css px
    view.l = -FRAME.ox / PX - (br.left - r.left) * k; view.r = (FRAME.w - FRAME.ox) / PX + (r.right - br.right) * k;
    view.t = FRAME.oy / PX + (br.top - r.top) * k; view.b = -(FRAME.h - FRAME.oy) / PX - (r.bottom - br.bottom) * k;
    packMat.uniforms.uSize.value = 9 * renderer.getPixelRatio() * clamp(br.width / 540, 0.6, 1.4);
    if (rm || !raf) draw();
  };

  /** the camera: round the target by az / el, the plane through the target spanning the view (scaled by s), seen with fov */
  const setCam = (az: number, el: number, fov: number, s: number) => {
    const vl = view.l * s, vr = view.r * s, vt = view.t * s, vb = view.b * s;
    const d = (vt - vb) / 2 / Math.tan(fov / 2), near = Math.max(0.1, d - 60), far = d + 80;
    camera.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d).add(target);
    camera.up.set(0, 1, 0); camera.lookAt(target); camera.updateMatrixWorld();
    const q = near / d;
    camera.projectionMatrix.makePerspective(vl * q, vr * q, vt * q, vb * q, near, far);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  };

  /** where the h1's square is, in the world (on the plane through the core, square to the view), and the core's scale to sit just inside it */
  const ndc = new THREE.Vector3(), o3 = new THREE.Vector3(), d3 = new THREE.Vector3(), camDir = new THREE.Vector3();
  const landing = (out: THREE.Vector3, plane: THREE.Vector3): number => {
    const sq = opts.square();
    if (!sq) { out.copy(plane); return 1; }
    const r = sq.getBoundingClientRect(), cvs = canvas.getBoundingClientRect();
    const x = r.left + r.width / 2 - cvs.left, y = r.top + r.height / 2 - cvs.top;
    ndc.set((x / cvs.width) * 2 - 1, -(y / cvs.height) * 2 + 1, -1);
    o3.copy(ndc).unproject(camera); d3.set(ndc.x, ndc.y, 1).unproject(camera).sub(o3);
    camera.getWorldDirection(camDir);
    const t = camDir.dot(plane.clone().sub(o3)) / camDir.dot(d3);
    out.copy(o3).addScaledVector(d3, t);
    // the rounded cube's outline is about 1.6 × its side tall at the isometric view; keep it a little inside the square
    const unitsPerPx = (view.t - view.b) / cvs.height;
    return (r.height * 0.82 * unitsPerPx) / 1.55 / CORE.s;
  };

  /* state */
  let prog = 0, shown = 0, t = rm ? 99 : 0, loopT = 0;
  const sqW = new THREE.Vector3(), coreHome = new THREE.Vector3(0, CORE.y, 0);

  const place = (dt: number) => {
    const p = rm ? 0 : shown, ti = t;
    /* the exit's shares */
    const gat = sineInOut(ramp(0, 0.45, p));               // gather
    const seal = p2InOut(ramp(0.44, 0.58, p));             // the gathered drawing compresses into the core (done before it turns green)
    const green = sineInOut(ramp(0.53, 0.66, p));          // the core turns green
    const travel = sineInOut(ramp(0.6, 0.8, p));           // the core travels onto the square
    const flash = bump(0.74, 0.86, p);
    const calm = 1 - ramp(0, 0.12, p);                     // the loop's story stops as the exit starts

    /* the loop's master cycle (8 s): INFLOW, CIRCULATION, CHARGE, RELEASE */
    const cy = rm ? 3 : loopT % CYCLE, live = rm ? 0 : ramp(0, 0.4, loopT) * calm;
    const charge = (cy < 4.5 ? 0 : cy < 5.5 ? sineInOut((cy - 4.5) / 1) : 1 - sineInOut((cy - 5.5) / 1.6)) * live;
    /* the intro's shares: a camera ease, the pieces in turn, the glass, the floor, the satellites, the settle front */
    const camIn = rm ? 1 : expoOut(ti / 1.5);
    const glassIn = rm ? 1 : p3Out(ramp(0.25, 1.15, ti));

    // the travelling front: the intro's settle beat (1.1–1.9 s), then CIRCULATION every cycle (2–4.5 s)
    if (!rm && ti < INTRO + 0.05) { shared.uT.value = sineInOut(ramp(1.05, 1.9, ti)) * 1.02; shared.uCirc.value = bump(1.0, 1.95, ti) * 1.1; }
    else { shared.uT.value = sineInOut(ramp(2, 4.5, cy)) * 1.02; shared.uCirc.value = bump(1.9, 4.7, cy) ** 0.5 * live; }
    shared.uSheen.value = cy > 5.6 && cy < 7.9 ? lerp(-13, 13, sineInOut(ramp(5.6, 7.9, cy))) : -99;
    if (rm) { shared.uCirc.value = 0; shared.uSheen.value = -99; }

    /* the camera: eases into the isometric (intro); drifts a degree; leans in a little as the drawing gathers */
    const drift = rm ? 0 : 1;
    target.set(0, 0, 0);
    const az = Math.PI / 4 + (1 - camIn) * 0.12 + drift * Math.sin(loopT * 0.11) * 0.016;
    const el = ISO_EL - (1 - camIn) * 0.05 + drift * Math.sin(loopT * 0.083 + 1) * 0.009;
    const fov = Math.max(REST_FOV, (1 - camIn) * 0.14);
    setCam(az, el, fov, lerp(0.93, 1, camIn) * (1 - 0.06 * bump(0, 0.7, p)));

    const ka = rm ? 0 : Math.sin(loopT * 0.06) * 0.35;
    key.position.set(4 * Math.cos(ka) - 7 * Math.sin(ka), 10, 4 * Math.sin(ka) + 7 * Math.cos(ka));
    floorMat.opacity = 0.14 * (1 - seal) * (rm ? 1 : ramp(0.55, 1.3, ti));   // no shadows of pieces still fading in

    /* the gathered group: contracts toward the core (gather), then into it (seal) */
    const gs = Math.max(0.001, lerp(1, 0.6, gat) * (1 - seal));
    gather.scale.setScalar(gs); gather.position.copy(coreHome).multiplyScalar(1 - gs);
    gather.visible = seal < 0.999;

    /* the ring's pieces: arrive in turn from just outside (intro); slide inward and lock (gather) */
    pieces.forEach((pc, i) => {
      const land = rm ? 1 : expoOut(ramp(0.05 + i * 0.06, 0.05 + i * 0.06 + 1.0, ti));
      const lock = p2InOut(ramp(0.04 + i * 0.025, 0.3 + i * 0.025, p));
      const off = (1 - land) * 0.85 - lock * 0.55;
      pc.pivot.position.set(pc.c.x + pc.dir.x * off * pc.k, (1 - land) * 0.35, pc.c.z + pc.dir.z * off * pc.k);
      pc.fade.set(rm ? 1 : p3Out(ramp(0.05 + i * 0.06, 0.05 + i * 0.06 + 0.6, ti)));
    });

    /* the core: breathes; lifts and glows in CHARGE; takes the gathered drawing in, turns green, travels onto the square */
    const br = Math.sin(loopT * 1.1) * 0.5 * live;
    const coreIn = rm ? 1 : p3Out(ramp(0, 0.5, ti));
    const grow = 1 + 0.35 * sineInOut(ramp(0.36, 0.52, p)) * (1 - 0.25 * green);
    const sqScale = landing(sqW, coreHome);
    c.core.position.copy(coreHome).lerp(sqW, travel);
    c.core.position.y += (br * 0.03 + charge * 0.12) * (1 - travel);
    c.core.scale.setScalar(lerp((1 + br * 0.01 + charge * 0.02) * grow, sqScale, travel) * lerp(0.92, 1, coreIn));
    c.core.rotation.y = travel * Math.PI / 2;
    coreMat.color.copy(coreWhite).lerp(black, green);
    coreMat.emissiveIntensity = Math.max(charge * 0.14 + (rm ? 0 : bump(1.2, 2.1, ti) * 0.18), green);
    coreMat.clearcoat = 0.7 * (1 - green);
    coreMat.opacity = coreIn; coreMat.transparent = coreIn < 0.999;
    haloMat.opacity = charge * 0.4 + flash * 0.7 + gat * (1 - travel) * 0.35;
    halo.scale.setScalar(3.6 * (1 + charge * 0.15) * lerp(1, 2.2, travel));
    coreLineMat.opacity = 0.85 * (1 - green) * coreIn; coreCrest.material.opacity = 0.35 * (1 - green) * coreIn;
    c.core.visible = p < 0.93;

    /* the bubble: brightens in CHARGE; closes round the core as the drawing gathers */
    c.bubble.position.y = BUBBLE.y;
    c.bubble.scale.setScalar(lerp(1, 0.82, sineInOut(ramp(0.1, 0.45, p))) * (1 + charge * 0.03));
    bubbleMat.opacity = 0.13 * glassIn * (1 + charge * 1.3) * (1 + gat * 0.8);
    m.fine.opacity = 0.45 * glassIn;
    bubbleLineMat.opacity = 0.6 * glassIn;

    /* the satellites: settle in last (intro); rise and settle in turn (RELEASE); fly in along their lines (gather) */
    sats.forEach((st, i) => {
      const a0 = 0.45 + i * 0.04, land = rm ? 1 : expoOut(ramp(a0, a0 + 0.9, ti));
      const rise = live * bump(5.6 + st.order * 1.6, 5.6 + st.order * 1.6 + 0.8, cy) * 0.22;
      const fly = p2InOut(ramp(0.0 + i * 0.012, 0.26 + i * 0.012, p));
      const inner = st.out.clone().multiplyScalar(5.7);   // just outside the ring
      st.g.position.set(lerp(st.base.x, inner.x, fly), st.base.y + rise + Math.sin(loopT * 0.6 + st.ph) * 0.015 * live + (1 - land) * 0.45 + fly * 0.25, lerp(st.base.z, inner.z, fly));
      st.g.rotation.y = fly * 0.8;
      st.fade.set(rm ? 1 : p3Out(ramp(a0, a0 + 0.5, ti)));
    });

    /* the floor: orbits and guides draw on; dashes flow; the RELEASE ripple runs out through the orbits */
    const rip = cy > 5.5 ? sineInOut(ramp(5.5, 7.6, cy)) : 0, ripR = lerp(1.6, 9.6, rip);
    rippleMat.opacity = live * (cy > 5.5 ? bump(5.5, 7.7, cy) : 0) * 0.55;
    ripple.scale.setScalar(ripR);
    orbits.forEach((l, i) => {
      const on = rm ? 1 : p3Out(ramp(0.15 + i * 0.05, 0.15 + i * 0.05 + 1.0, ti));
      l.geometry.setDrawRange(0, Math.floor(on * SEG) + 1);
      l.rotation.y += (l.userData.w as number) * dt;
      const hit = rippleMat.opacity > 0 ? Math.exp(-Math.pow((ripR - (l.userData.r as number)) / 0.7, 2)) : 0;
      l.scale.setScalar((1 + 0.025 * hit) * lerp(1, 0.35, sineInOut(ramp(0, 0.42, p))));
      l.visible = on > 0.002;
    });
    orbitMat.opacity = 0.85 * lerp(1, 0.45, gat);
    const gOn = rm ? 1 : p3Out(ramp(0.6, 1.4, ti));
    guides.forEach((l) => { l.geometry.setDrawRange(0, Math.floor(gOn * 40) + 1); l.visible = gOn > 0.01; });
    guideMat.opacity = 0.85 * lerp(1, 0.4, gat);

    /* the packets: INFLOW along every guide from its satellite into the ring; one slow packet on each orbit, always */
    const pp = pg.attributes.position as THREE.BufferAttribute, pa = pg.attributes.aA as THREE.BufferAttribute;
    let n = 0;
    orbits.forEach((l, i) => {
      const r = (l.userData.r as number) * l.scale.x;
      const ang = (i % 2 ? -1 : 1) * loopT * (0.12 / Math.sqrt(r)) + i * 1.3;
      pp.setXYZ(n, Math.cos(ang) * r, 0.02, Math.sin(ang) * r); pa.setX(n++, 0.55 * live);
    });
    guideEnds.forEach(([A, B], i) => {
      const f = sineInOut(ramp(0.1 + (i % 5) * 0.08, 1.9 - ((i + 2) % 5) * 0.06, cy));
      pp.setXYZ(n, lerp(B.x, A.x, f), 0.02, lerp(B.z, A.z, f));
      pa.setX(n++, live * (cy < 2.05 ? Math.min(ramp(0, 0.12, f), 1 - ramp(0.88, 1, f)) : 0));
    });
    pp.needsUpdate = true; pa.needsUpdate = true;

    silhouette(bubbleLine, c.bubble, c.bubbleHalf, BUBBLE.r, camera);
    silhouette(coreLine, c.core, c.coreHalf, CORE.r, camera);
    bubbleLine.visible = gather.visible; coreLine.visible = c.core.visible;
  };
  function draw() { place(0); renderer.render(scene, camera); }

  /* reduced motion: the drawing just fades with the scroll */
  const rmFade = (p: number) => { canvas.style.opacity = String(1 - ramp(0, 0.6, p)); };

  /* the loop: only while on screen and the tab is visible */
  let last = 0, seen = true, dead = false;
  const tick = (now: number) => {
    raf = 0; if (dead) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
    t += dt; if (t > INTRO) loopT += dt;
    shown = damp(shown, prog, 10, dt); if (Math.abs(shown - prog) < 1e-4) shown = prog;
    place(dt); renderer.render(scene, camera);
    if (seen && !document.hidden) raf = requestAnimationFrame(tick);
  };
  const go = () => { if (!rm && !raf && seen && !document.hidden && !dead) { last = 0; raf = requestAnimationFrame(tick); } };
  const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; go(); }, { threshold: 0 });
  const ro = new ResizeObserver(() => fit());
  const vis = () => go();
  ro.observe(box); ro.observe(canvas); io.observe(canvas);
  addEventListener("resize", fit);
  document.addEventListener("visibilitychange", vis);
  fit();
  go();

  return {
    setProgress(p: number) {
      prog = clamp(p);
      if (rm) { rmFade(prog); return; }
      if (!raf) { shown = prog; draw(); }
    },
    dispose() {
      dead = true; cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect(); removeEventListener("resize", fit); document.removeEventListener("visibilitychange", vis);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
        for (const mt of mats) { for (const v of Object.values(mt)) if (v && (v as THREE.Texture).isTexture) (v as THREE.Texture).dispose(); mt.dispose(); }
      });
      dots.dispose(); env.dispose();
      renderer.dispose(); renderer.forceContextLoss();
    },
  };
}
