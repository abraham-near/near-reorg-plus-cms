// Hero study "Pillar C": the pillar (Figma node 1120:6520) in three.js, the most crafted of the three studies. Geometry: ./pillar.ts (study B's
// measures); look and post-processing: ./fx.ts. At rest it still reads as the Figma drawing: the paper ground (#F5F5F5), white blocks whose three
// faces take the drawing's greys, mint glass, the green collar, 1.3 px ink outlines, seen in the drawing's isometric (a perspective camera whose
// field of view at rest is a third of a degree: it IS the isometric; the intro and the exit open it into real perspective).
// What C adds: physical materials (a micro-textured white, real screws, recessed slots, transmissive glass with a clear coat, a room environment for
// reflections); lights (a soft key with soft shadows and a contact shadow under the frame, a fill, a rim light that slowly circles, and green point
// lights that travel with the energy: round the frame, down the column, and the collar itself); caustics on the core under the glass; climbing
// particles; selective bloom on the green only; depth of field while the camera moves; grain and a faint vignette.
// The canvas covers the whole hero (.hp) so nothing is ever clipped by a box; the camera is offset so at rest the drawing sits in .hp__art.
//   1 · Intro (≈1.9 s, fast and soft): one wave. The camera eases in from a short, slightly turned and closer perspective (blurred, the blur clearing);
//       the core first, then the column's segments slide in round it, the frame's corners along their diagonals, its arms along their normals, the
//       clamps press down last, the bubble swells round the core, the satellites settle along their rows and the rows draw out. Short distances, expo
//       ease-out, 40–60 ms staggers, opacity with position. The settle: one pulse of light round the green (tubes, collar, the core's glow).
//   2 · Loop (one 8 s master cycle): 0–2 s INFLOW, packets with trails run in along the dotted rows from the satellites to the frame; 2–4.5 s
//       CIRCULATION, two packets run round the frame inside its tubes (each a green light on its neighbours) while two fronts run down and up the column
//       to the core (particles brighten as they pass, a green light rides the upper one); 4.5–5.5 s CHARGE, the collar and the core's glow swell, the
//       core lifts a hair, the glass shimmers, the caustics bloom; 5.5–8 s RELEASE, a ripple runs out over the floor, a pulse runs out along the rows
//       and guides, the satellites rise and settle in turn. Underneath: the dots flow in, particles climb, a 1° camera drift, the rim light circles.
//   3 · Exit, "seal" (setProgress 0 → 1 over the hero's hold): 0–0.45 GATHER, the satellites fly in along their rows (sweeping the dots up) and
//       into the bubble, the frame slides inward and its clamps lock tight round the core, the column telescopes down into the core (its segments
//       nesting, visibly), the bubble frosts closed; the camera swings a little into perspective (blurred at the edges). 0.45–0.8 SEAL, all of it
//       compresses into one cube that turns green, travels and shrinks onto the h1's green square (.hp__sq) and lands on it with a soft flash.
//       0.8–1, only the h1's own square remains. Reversible.
// Intro and scroll compose. Runs only on screen with the tab visible; DPR ≤ 2; small screens drop transmission, DOF and shadows; reduced motion: a
// still frame that fades as the page scrolls.
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  A, BUBBLE, COL, COLLAR, DOTS, GUIDES, SAT_Y, SATS, TUBE, YC, buildBubble, buildCollar, buildColumn, buildCore, buildFrame, buildRods, buildSat,
  fromDrawing, type Piece,
} from "./pillar";
import { glowTexture, library, post, uniforms } from "./fx";

export type PillarScene = { setProgress(p: number): void; dispose(): void };
export type Els = { hp: HTMLElement; art: HTMLElement; wrap: HTMLElement; sq: HTMLElement | null };

const PX = 100 / Math.sqrt(2 / 3);              // drawing px per camera unit
const ISO_EL = Math.atan(1 / Math.SQRT2);       // true isometric: 35.26° down, 45° round
const REST_FOV = THREE.MathUtils.degToRad(0.35);
const FRAME_W = 1668, SPREAD_H = 1193;          // the frame's width and the satellites' spread, in drawing px
const CYCLE = 8;                                // the loop's master cycle, s
const LOOP_AT = 1.75;                           // the loop's clock starts (its first INFLOW rises from nothing)

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const outExpo = (t: number) => { t = clamp(t); return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); };
const outQuart = (t: number) => 1 - Math.pow(1 - clamp(t), 4);
const sineIO = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t));
const p2IO = (t: number) => { t = clamp(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
/** 0 → 1 → 0 across [a, d], flat between b and c */
const bump = (v: number, a: number, b: number, c: number, d: number) => smooth(a, b, v) * (1 - smooth(c, d, v));
const gauss = (v: number, c: number, w: number) => Math.exp(-Math.pow((v - c) / w, 2));

export function mount(canvas: HTMLCanvasElement, els: Els, opts: { reduced: boolean }): PillarScene {
  const rm = opts.reduced;
  const { hp, art, wrap } = els;
  const lite = Math.min(window.innerWidth, window.screen?.width || 9999) < 1000;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, stencil: false, powerPreference: "high-performance" });
  const pr = Math.min(devicePixelRatio || 1, lite ? 1.75 : 2);
  renderer.setPixelRatio(pr);
  renderer.setClearColor("#f5f5f5", 1);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.localClippingEnabled = true;
  renderer.transmissionResolutionScale = 0.5;
  if (!lite) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.shadowMap.autoUpdate = false; }

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture; scene.environmentIntensity = 0.3;
  pmrem.dispose();
  const world = new THREE.Group(); scene.add(world);
  const asm = new THREE.Group(); world.add(asm);          // everything that compresses into the seal
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const target = new THREE.Vector3();

  /* lights: ambient + key (shadows) + a fill from below and behind + a rim that circles; green point lights travel with the energy */
  const amb = new THREE.AmbientLight(0xffffff, 0.3 * Math.PI); scene.add(amb);
  const key = new THREE.DirectionalLight(0xffffff, 0.56 * Math.PI);
  const KEY = new THREE.Vector3(0.273, 0.834, 0.478).normalize();
  scene.add(key, key.target);
  if (!lite) {
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 4; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.025;
    const sc = key.shadow.camera; sc.left = -8; sc.right = 8; sc.top = 8; sc.bottom = -8; sc.near = 1; sc.far = 40; sc.updateProjectionMatrix();
  }
  const fill = new THREE.DirectionalLight(0xffffff, 0.38 * Math.PI); fill.position.set(-0.55, -0.6, -0.58); scene.add(fill, fill.target);
  const rim = new THREE.DirectionalLight(0xeaf6ff, 0.2 * Math.PI); scene.add(rim, rim.target);
  const GREEN = new THREE.Color("#00dc8d");
  const pl = (n: number) => Array.from({ length: n }, () => { const l = new THREE.PointLight(GREEN, 0, 6, 2); world.add(l); return l; });
  const lights = pl(lite ? 2 : 4);
  const collarL = lights[0], frameL1 = lights[1], frameL2 = lights[2] ?? null, colL = lights[3] ?? null;

  /* the material library and the shared uniforms */
  const U = uniforms();
  const lib = library(U, lite, envRT.texture);
  const pieces: Piece[] = [];
  const keep = <T extends Piece>(p: T, parent: THREE.Object3D = asm) => { pieces.push(p); parent.add(p.g); return p; };

  /* the column (clipped to the art box's top and bottom: on phones the hero is taller than the drawing) */
  const clipTop = new THREE.Plane(), clipBot = new THREE.Plane();
  const segs = buildColumn(lib, lite ? 44 : 30);
  for (const s of segs) {
    keep(s.p);
    for (const m of s.p.mats.values()) m.clippingPlanes = [clipTop, clipBot];
    if (s.p.line) s.p.line.clippingPlanes = [clipTop, clipBot];
  }
  const collar = keep(buildCollar(lib));
  const collarMat = collar.mat<THREE.MeshPhysicalMaterial>("green")!;
  const core = keep(buildCore(lib));
  const bub = buildBubble(lib); keep(bub.piece);
  const bubbleGlass = bub.piece.mat<THREE.MeshPhysicalMaterial>("glass")!;
  const rods = keep(buildRods(lib));

  // the bubble's outline: its silhouette, redrawn when the view or the bubble moves
  const hullMat = lib.line();
  const hullGeo = new LineGeometry(); hullGeo.setPositions(new Array(6 * 3).fill(0));
  const hull = new Line2(hullGeo, hullMat); hull.renderOrder = 5; hull.frustumCulled = false; hull.userData.kind = "hull"; asm.add(hull);
  const bubbleVerts: THREE.Vector3[] = [];
  {
    const p = bub.mesh.geometry.attributes.position as THREE.BufferAttribute, seen = new Set<string>();
    for (let i = 0; i < p.count; i++) { const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`; if (!seen.has(k)) { seen.add(k); bubbleVerts.push(new THREE.Vector3().fromBufferAttribute(p, i)); } }
  }

  /* the frame */
  const frame = buildFrame(lib);
  frame.forEach((f) => keep(f.p));
  const tubes = frame.filter((f) => f.kind === "glass").sort((a, b) => perim(a.along!) - perim(b.along!));
  function perim(ab: [THREE.Vector3, THREE.Vector3]) { const c = ab[0].clone().add(ab[1]).multiplyScalar(0.5); return (Math.atan2(c.x, -c.z) + Math.PI * 2 + 0.6) % (Math.PI * 2); }
  const corners = frame.filter((f) => f.kind === "corner");

  /* the satellites */
  const sats = SATS.map(([, x, y, w, h, kind], i) => {
    const pos = fromDrawing(x + w / 2, y + h / 2, SAT_Y);
    const ax = Math.abs(pos.x) > Math.abs(pos.z) ? new THREE.Vector3(Math.sign(pos.x), 0, 0) : new THREE.Vector3(0, 0, Math.sign(pos.z));
    const p = keep(buildSat(kind, w, ax, lib));
    // the leaves' glass a touch denser than the frame's
    const lg = p.mat<THREE.MeshPhysicalMaterial>("glass"); if (lg && lite) p.setBase(lg, 0.2);
    return { p, base: pos, out: pos.clone().setY(0).normalize(), i, spin: (i % 2 ? 1 : -1) * (0.6 + (i % 3) * 0.3) };
  });

  /* the glows: the core's halo, the frame's packets, the landing flash */
  const glowTex = glowTexture();
  const sprite = (scale: number, order: number, depthTest = true) => {
    const m = new THREE.SpriteMaterial({ map: glowTex, color: GREEN, transparent: true, opacity: 0, depthWrite: false, depthTest });
    const s = new THREE.Sprite(m); s.scale.setScalar(scale); s.renderOrder = order; s.userData.kind = "glow"; return s;
  };
  const halo = sprite(4.2, 6, false); asm.add(halo);
  const packets = [0, 1].map(() => { const s = sprite(1.3, 7); world.add(s); return s; });
  const flash = sprite(1, 9, false); world.add(flash);

  /* the dotted rows and the grey guides: one point cloud */
  type Pt = { a: THREE.Vector3; b: THREE.Vector3; s: number; step: number; d: number; k: number; r: number };
  const pts: Pt[] = [];
  DOTS.forEach(([x1, y1, x2, y2, n], r) => {
    const a = fromDrawing(x1, y1, SAT_Y), b = fromDrawing(x2, y2, SAT_Y), step = 1 / (n - 1);
    for (let i = -1; i < n; i++) pts.push({ a, b, s: i * step, step, d: 0.75 + r * 0.035, k: 0, r: r / (DOTS.length - 1) });
  });
  GUIDES.forEach(([x1, y1, x2, y2, n], r) => {
    let a: THREE.Vector3, b: THREE.Vector3;
    if (Math.abs(x1 - x2) > 1) { a = fromDrawing(x1, y1, 0); b = fromDrawing(x2, y2, 0); }
    else { const lo = Math.max(y1, y2), hi = Math.min(y1, y2); a = fromDrawing(x1, lo, SAT_Y); b = a.clone().setY(SAT_Y + (lo - hi) / 100); }
    for (let i = 0; i < n; i++) pts.push({ a, b, s: i / (n - 1), step: 1 / (n - 1), d: 0.6 + r * 0.03, k: 1, r: r / (GUIDES.length - 1) });
  });
  const pg = new THREE.BufferGeometry();
  const f32 = (n: number, f: (p: Pt, o: Float32Array, i: number) => void) => { const o = new Float32Array(pts.length * n); pts.forEach((p, i) => f(p, o, i)); return new THREE.BufferAttribute(o, n); };
  pg.setAttribute("position", f32(3, (p, o, i) => o.set(p.a.toArray(), i * 3)));
  pg.setAttribute("aA", f32(3, (p, o, i) => o.set(p.a.toArray(), i * 3)));
  pg.setAttribute("aB", f32(3, (p, o, i) => o.set(p.b.toArray(), i * 3)));
  pg.setAttribute("aS", f32(1, (p, o, i) => { o[i] = p.s; }));
  pg.setAttribute("aStep", f32(1, (p, o, i) => { o[i] = p.step; }));
  pg.setAttribute("aD", f32(1, (p, o, i) => { o[i] = p.d; }));
  pg.setAttribute("aK", f32(1, (p, o, i) => { o[i] = p.k; }));
  pg.setAttribute("aR", f32(1, (p, o, i) => { o[i] = p.r; }));
  const dotMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {
      uT: { value: 0 }, uIntro: { value: rm ? 99 : 0 }, uSize: { value: 0.3 }, uFlow: { value: 0 }, uPhi: { value: 0 }, uIn: { value: 0 }, uRel: { value: 0 },
      uP: { value: 0 }, uRing: { value: 1 }, uBloom: { value: 0 }, uArtL: { value: -2 },
    },
    vertexShader: /* glsl */ `uniform float uT, uIntro, uSize, uFlow, uPhi, uIn, uRel, uP, uRing, uArtL;
      attribute vec3 aA, aB; attribute float aS, aStep, aD, aK, aR;
      varying float vA, vG, vK;
      void main(){
        bool row = aK < 0.5;
        float s = aS + (row ? -fract(uT * 0.3) * aStep * uFlow + aStep * uFlow : 0.0);
        // exit: rows are swept up toward the frame by their satellites; guides draw back to their corners
        float ret = row ? smoothstep(0.03 + aR * 0.1, 0.33 + aR * 0.1, uP) : smoothstep(0.0 + aR * 0.06, 0.3 + aR * 0.06, uP);
        float sE = min(s, 1.0 - ret);
        vec3 A = vec3(aA.x * uRing, aA.y, aA.z * uRing);
        vec3 p = mix(A, aB, sE);
        float on = smoothstep(aD + max(s, 0.0) * 0.35, aD + max(s, 0.0) * 0.35 + 0.14, uIntro);
        float ends = row ? smoothstep(-0.001, aStep * 0.8, s) * (1.0 - smoothstep(1.0, 1.0 + aStep * 0.8, s)) : 1.0;
        // inflow: a packet runs in from the satellite (s = 1) to the frame (s = 0), its trail behind it
        float pk = 1.15 - clamp((uPhi - aR * 0.45) / 1.35, 0.0, 1.0) * 1.35;
        float dd = s - pk;
        float g = row ? (dd >= 0.0 ? exp(-dd * 3.2) : exp(-pow(dd * 12.0, 2.0))) * uIn : 0.0;
        // release: a pulse runs out (rows and guides)
        float po = (uPhi - 5.6 - aR * 0.25) / (row ? 0.9 : 1.3) * 1.25 - 0.1;
        g = max(g, exp(-pow((s - po) * (row ? 5.0 : 7.0), 2.0)) * uRel * (row ? 0.8 : 0.55));
        vA = on * ends * (1.0 - smoothstep(0.88, 1.0, ret)); vG = g; vK = aK;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        vA *= smoothstep(uArtL, uArtL + 0.08, gl_Position.x / gl_Position.w);   // the guides stop short of the copy
        gl_PointSize = uSize * (row ? 15.0 * (1.0 + g * 0.55) * (1.0 - ret * ret * 0.5) : 3.6 * (1.0 + g * 0.8));
      }`,
    fragmentShader: /* glsl */ `uniform float uBloom; varying float vA, vG, vK;
      void main(){
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = smoothstep(1.0, 0.7, d) * vA * (vK > 0.5 ? 0.6 : 0.9);
        float gg = clamp(vG * 1.4, 0.0, 1.0);
        if (uBloom > 0.5) { a *= gg; if (a < 0.01) discard; gl_FragColor = vec4(vec3(0.0, 0.86, 0.553) * 1.6, a); return; }
        if (a < 0.01) discard;
        gl_FragColor = vec4(mix(vec3(0.067), vec3(0.0, 0.86, 0.553), gg), a);
      }`,
  });
  const dots = new THREE.Points(pg, dotMat); dots.frustumCulled = false; dots.renderOrder = 4; dots.userData.kind = "dots"; world.add(dots);

  /* the column's energy: particles climbing its two seen faces; the circulation's fronts light them on their way to the core */
  const NP = lite ? 90 : 200;
  const ppg = new THREE.BufferGeometry();
  const pa = new Float32Array(NP * 4);
  for (let i = 0; i < NP; i++) { pa[i * 4] = i % 2; pa[i * 4 + 1] = (Math.random() * 2 - 1) * (COL / 2 - 0.08); pa[i * 4 + 2] = Math.random(); pa[i * 4 + 3] = 0.6 + Math.random() * 0.9; }
  ppg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(NP * 3), 3));
  ppg.setAttribute("aP", new THREE.BufferAttribute(pa, 4));
  const partMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uT: { value: 0 }, uA: { value: 0 }, uTop: { value: 9 }, uBot: { value: -9 }, uFront: { value: 0 }, uSize: { value: 1 }, uLo: { value: -99 }, uHi: { value: 99 } },
    vertexShader: /* glsl */ `uniform float uT, uA, uTop, uBot, uFront, uSize, uLo, uHi; attribute vec4 aP; varying float vB;
      void main(){
        float span = 44.0;
        float y = mod(aP.z * span + uT * aP.w, span) - span * 0.5;
        float out_ = ${(COL / 2 + 0.012).toFixed(3)};
        vec3 p = aP.x < 0.5 ? vec3(out_, y, aP.y) : vec3(aP.y, y, out_);
        float near = exp(-pow((y - uTop) * 0.8, 2.0)) + exp(-pow((y - uBot) * 0.8, 2.0));
        float core = smoothstep(-1.4, -1.1, y) * (1.0 - smoothstep(1.5, 1.8, y));
        vB = (0.16 + near * uFront * 1.6) * (1.0 - core) * uA * step(uLo, y) * step(y, uHi);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * (2.6 + near * uFront * 2.4);
      }`,
    fragmentShader: /* glsl */ `varying float vB;
      void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = smoothstep(1.0, 0.0, d) * vB; if (a < 0.01) discard;
        gl_FragColor = vec4(vec3(0.0, 0.86, 0.553) * (1.0 + (1.0 - d) * 0.5), min(1.0, a)); }`,
  });
  const parts = new THREE.Points(ppg, partMat); parts.frustumCulled = false; parts.renderOrder = 6; asm.add(parts);

  /* the release's ripples: square rings running out over the floor */
  const ripMat = () => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uR: { value: 1 }, uA: { value: 0 } },
    vertexShader: "varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: /* glsl */ `uniform float uR, uA; varying vec2 vP;
      void main(){ vec2 q = abs(vP) - vec2(uR - 0.5); float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.5;
        float a = exp(-pow(d / 0.06, 2.0)) * uA; if (a < 0.005) discard; gl_FragColor = vec4(0.0, 0.86, 0.553, a); }`,
  });
  const ripples = [0, 1].map(() => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), ripMat()); m.rotation.x = -Math.PI / 2; m.position.y = YC - TUBE.h / 2 - 0.1; m.renderOrder = 1; m.userData.kind = "glow"; world.add(m); return m;
  });

  /* the contact shadow: a floor at the core's foot that only takes shadows (the frame's and the core's), fading out round its centre */
  const shadowMat = new THREE.ShadowMaterial({ color: 0x2a2620, opacity: 0.1, depthWrite: false });
  shadowMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vFl;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvFl = position.xy;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec2 vFl;")
      .replace("gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );", "gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) * (1.0 - smoothstep(3.0, 7.5, length(vFl))) );");
  };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), shadowMat);
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.215; floor.receiveShadow = !lite; floor.userData.kind = "shadow"; floor.renderOrder = 0;
  asm.add(floor);
  // the column doesn't cast (its shadow would be an endless band); everything else does
  for (const sg of segs) sg.p.g.traverse((o) => { o.castShadow = false; });

  /* the seal: one cube (the bubble closing, then the core turned green) that flies to the h1's square */
  const sealMat = new THREE.MeshPhysicalMaterial({ color: "#e4f6ee", emissive: GREEN, emissiveIntensity: 0, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.2, transparent: true, opacity: 0 });
  const seal = new THREE.Mesh(new RoundedBoxGeometry(1, 1, 1, 3, 0.06), sealMat); seal.userData.kind = "seal"; seal.renderOrder = 8;
  const sealLineMat = lib.line();
  const slg = new LineSegmentsGeometry(); { const e = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)); slg.setPositions(Array.from(e.attributes.position.array)); e.dispose(); }
  const sealLine = new LineSegments2(slg, sealLineMat); sealLine.userData.kind = "line"; sealLine.renderOrder = 9; seal.add(sealLine);
  seal.visible = false; world.add(seal);

  /* the bloom's look: whites black (they hide what's behind them but never glow), glass / lines / the floor hidden, green parts their bright twins */
  const black = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const collarBloom = new THREE.MeshBasicMaterial({ color: GREEN });
  const sealBloom = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true });
  const occ: THREE.Mesh[] = [], hidden: THREE.Object3D[] = [], swap: [THREE.Mesh, THREE.Material][] = [];
  const glineBloom = new Map<THREE.Material, THREE.MeshBasicMaterial>();
  world.traverse((o) => {
    const k = o.userData.kind as string | undefined, mesh = o as THREE.Mesh;
    if (k === "white" || k === "dim" || k === "screw" || k === "core") occ.push(mesh);
    else if (k === "glass" || k === "line" || k === "rim" || k === "hull" || k === "shadow") hidden.push(o);
    else if (k === "green") swap.push([mesh, collarBloom]);
    else if (k === "seal") swap.push([mesh, sealBloom]);
    else if (k === "gline") { const b = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, depthWrite: false }); glineBloom.set(mesh.material as THREE.Material, b); swap.push([mesh, b]); }
  });
  const saved: THREE.Material[] = [], savedVis: boolean[] = [];
  const bloomScene = () => {
    let i = 0;
    for (const o of occ) { saved[i++] = o.material as THREE.Material; o.material = black; }
    for (const [o, b] of swap) { saved[i++] = o.material as THREE.Material; o.material = b; }
    hidden.forEach((o, j) => { savedVis[j] = o.visible; o.visible = false; });
    dotMat.uniforms.uBloom.value = 1;
    const env = scene.environment; scene.environment = null;
    return () => {
      let j = 0;
      for (const o of occ) o.material = saved[j++];
      for (const [o] of swap) o.material = saved[j++];
      hidden.forEach((o, k) => { o.visible = savedVis[k]; });
      dotMat.uniforms.uBloom.value = 0;
      scene.environment = env;
    };
  };
  const fx = post(renderer, scene, camera, { lite });

  /* the fit: the canvas covers the hero; at rest the drawing sits in .hp__art at the drawing's scale (the frame ≈ 79.5 % of its width, centred) */
  let W = 1, H = 1, restH = 20, cx = 0, cy = 0, artTop = 0, artBot = 1;
  let raf = 0;
  const lineMats = () => [...lib.lines];
  const fit = () => {
    const hr = hp.getBoundingClientRect(), ar = art.getBoundingClientRect();
    W = Math.max(1, Math.round(hr.width)); H = Math.max(1, Math.round(hr.height));
    Object.assign(wrap.style, { left: `${hr.left - ar.left}px`, top: `${hr.top - ar.top}px`, width: `${W}px`, height: `${H}px`, right: "auto", bottom: "auto" });
    const ax = ar.left - hr.left, ay = ar.top - hr.top, aw = Math.max(1, ar.width), ah = Math.max(1, ar.height);
    renderer.setSize(W, H, false);
    fx.setSize(pr);
    camera.aspect = W / H;
    const s = Math.min((aw * 0.795) / FRAME_W, (ah * 0.72) / SPREAD_H);
    restH = H / s / PX;
    cx = ax + aw / 2; cy = ay + ah / 2; artTop = ay; artBot = ay + ah;
    dotMat.uniforms.uArtL.value = aw < W * 0.8 ? (ax / W) * 2 - 1 : -2;
    for (const l of lineMats()) l.resolution.set(W, H);
    dotMat.uniforms.uSize.value = s * pr;
    partMat.uniforms.uSize.value = pr * Math.min(1.4, Math.max(0.8, s * 3.3));
    fx.comp.mat.uniforms.uC.value.set(cx / W, 1 - cy / H);
    hullKey = "";
    if (rm || !raf) draw();
  };

  /* the camera: round the target by az / el, the view `vh` tall (whole canvas) through the target, seen with fov, offset so the target sits at (cx, cy) */
  const setCam = (az: number, el: number, fov: number, vh: number) => {
    const d = vh / 2 / Math.tan(fov / 2);
    camera.fov = THREE.MathUtils.radToDeg(fov);
    camera.near = Math.max(0.05, d - 70); camera.far = d + 90;
    camera.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d).add(target);
    camera.up.set(0, 1, 0); camera.lookAt(target);
    camera.setViewOffset(W, H, W / 2 - cx, H / 2 - cy, W, H);
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    return d;
  };
  /* the column's clip: two planes square to the screen through the art box's top and bottom edges */
  const up = new THREE.Vector3(), tv = new THREE.Vector3();
  const setClip = () => {
    up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    tv.set(0, 1 - (artTop / H) * 2 + 0.002, 0.5).unproject(camera); clipTop.set(up.clone().negate(), up.dot(tv));
    tv.set(0, 1 - (artBot / H) * 2 - 0.002, 0.5).unproject(camera); clipBot.set(up.clone(), -up.dot(tv));
    // the particles: the column's y range inside the box (the axis projects linearly)
    const yAt = (py: number) => { const a = tv.set(0, 0, 0).project(camera).y, b = tv.set(0, 1, 0).project(camera).y; return ((1 - (py / H) * 2) - a) / (b - a); };
    partMat.uniforms.uHi.value = yAt(artTop); partMat.uniforms.uLo.value = yAt(artBot);
  };

  /* the bubble's silhouette */
  let hullKey = "";
  const v = new THREE.Vector3(), ctr = new THREE.Vector3();
  const updateHull = () => {
    bub.piece.g.updateMatrixWorld();
    const k2 = camera.matrixWorld.elements.map((x) => x.toFixed(4)).join() + bub.mesh.matrixWorld.elements.map((x) => x.toFixed(4)).join() + camera.fov.toFixed(4);
    if (k2 === hullKey) return; hullKey = k2;
    const P = bubbleVerts.map((p) => { v.copy(p).applyMatrix4(bub.mesh.matrixWorld).project(camera); return [v.x * camera.aspect, v.y] as [number, number]; });
    P.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo: [number, number][] = [], hi: [number, number][] = [];
    for (const p of P) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    const h = lo.slice(0, -1).concat(hi.slice(0, -1)); h.push(h[0]);
    ctr.setFromMatrixPosition(bub.mesh.matrixWorld).project(camera);
    const inv = new THREE.Matrix4().copy(asm.matrixWorld).invert();
    const out: number[] = [];
    for (const [x, y] of h) { v.set(x / camera.aspect, y, ctr.z).unproject(camera).applyMatrix4(inv); out.push(v.x, v.y, v.z); }
    hullGeo.setPositions(out); hull.computeLineDistances();
  };

  /* state */
  let prog = 0, shown = 0, t = 0, loopT = 0, lastOpacity = "";
  const T0 = rm ? 0 : Math.max(0, 0.2 - performance.now() / 1000);   // the art starts ~0.2 s into the page
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), dims = new THREE.Vector3(), q0 = new THREE.Quaternion();
  const gl0 = new THREE.Color("#00dc8d"), glHot = new THREE.Color("#b6ffe3");
  const sealC0 = new THREE.Color("#e4f6ee"), bubC = new THREE.Vector3(0, BUBBLE.y, 0);
  const fcorner = [new THREE.Vector3(-A, YC + 0.05, -A), new THREE.Vector3(A, YC + 0.05, -A), new THREE.Vector3(A, YC + 0.05, A), new THREE.Vector3(-A, YC + 0.05, A)];
  const onFrame = (u: number, out: THREE.Vector3) => { u = ((u % 1) + 1) % 1; const i = Math.floor(u * 4), f = u * 4 - i; return out.lerpVectors(fcorner[i], fcorner[(i + 1) % 4], f); };
  const sqPx = { x: 0, y: 0, s: 10 };
  const readSq = () => {
    const sq = els.sq; if (!sq) { sqPx.x = W * 0.45; sqPx.y = H * 0.4; sqPx.s = 12; return; }
    const r = sq.getBoundingClientRect(), hr = hp.getBoundingClientRect();
    sqPx.x = r.left - hr.left + r.width / 2; sqPx.y = r.top - hr.top + r.height / 2; sqPx.s = r.width;
  };

  const place = () => {
    const p = rm ? 0 : shown;
    const ti = rm ? 99 : t - T0;
    const L = rm ? 0 : smooth(1.6, 2.3, ti);                 // the loop's amplitude
    const phi = loopT % CYCLE;
    const settle = rm ? 0 : gauss(ti, 1.62, 0.2);
    U.uT.value = loopT + Math.max(0, ti) * 0.5;

    /* the loop's beats */
    const inflow = bump(phi, 0, 0.35, 1.7, 2.1) * L;
    const circ = bump(phi, 1.9, 2.3, 4.2, 4.7) * L;
    const charge = bump(phi, 4.25, 4.85, 5.25, 5.95) * L;
    const release = bump(phi, 5.45, 5.75, 7.2, 7.9) * L;
    const ex = 1 - smooth(0, 0.12, p);                           // the loop's light fades as the exit starts

    /* the exit's phases */
    const cg = sineIO(p / 0.42), cs = sineIO((p - 0.44) / 0.16);
    const C = sineIO((p - 0.03) / 0.4);                          // the column telescopes
    const close = sineIO((p - 0.18) / 0.26);                     // the bubble frosts closed
    const lock = sineIO((p - 0.37) / 0.07);
    const s1 = sineIO((p - 0.44) / 0.12);                        // compress into the cube
    const s2 = p2IO((p - 0.555) / 0.225);                        // the cube's flight
    const land = bump(p, 0.74, 0.785, 0.8, 0.88);

    /* the camera: in from a short turned perspective (intro); a small swing into perspective while it gathers (exit); a 1° drift at rest */
    const ci = rm ? 1 : outExpo((ti + 0.05) / 1.55);
    const drift = L * ex;
    target.set(0, 0, 0);
    const az = Math.PI / 4 + 0.2 * (1 - ci) + Math.sin((loopT / 16) * Math.PI * 2) * 0.0175 * drift + 0.2 * cg * (1 - cs);
    const el = ISO_EL + 0.07 * (1 - ci) + Math.sin((loopT / 16) * Math.PI * 2 + 1.3) * 0.008 * drift - 0.06 * cg * (1 - cs);
    const lf = Math.log(REST_FOV), lw = Math.log(THREE.MathUtils.degToRad(11));
    const fov = Math.exp(lerp(lf, lw, Math.max(1 - ci, cg * (1 - cs) * 0.85)));
    const vh = restH * (1 - 0.12 * (1 - ci)) * (1 - 0.26 * cg);
    const dist = setCam(az, el, fov, vh);
    setClip();
    /* the depth of field: the intro's blur clearing; a swell while the exit's camera moves; off at rest */
    const dofA = lite ? 0 : Math.max(rm ? 0 : 1 - outQuart(ti / 1.2), Math.sin(Math.PI * clamp(p / 0.6)) * 0.85);
    fx.dof.enabled = dofA > 0.01;
    if (fx.dof.enabled) {
      const u = fx.dof.mat.uniforms; u.uNear.value = camera.near; u.uFar.value = camera.far; u.uFocus.value = dist; u.uAmt.value = dofA * 1.3 * pr; u.uMax.value = 7 * pr * dofA + 0.5;
    }

    /* lights: the key fixed on the scene, the rim circling slowly */
    key.position.copy(KEY).multiplyScalar(15); key.target.position.set(0, 0, 0);
    const ra = loopT * 0.12 + 2.4;
    rim.position.set(Math.cos(ra) * -0.8, 0.45, Math.sin(ra) * -0.8);
    rim.intensity = 0.2 * Math.PI * (0.6 + 0.4 * Math.sin(loopT * 0.21));

    /* the core: first in; breathes on the cycle; lifts as it charges */
    const coreIn = rm ? 1 : outExpo((ti - 0.0) / 0.9);
    core.fade(rm ? 1 : outQuart(ti / 0.45));
    core.g.position.y = (1 - coreIn) * -0.3 + Math.sin((phi / CYCLE) * Math.PI * 2) * 0.012 * L + charge * 0.06 + cg * 0.08;
    core.g.scale.setScalar(lerp(0.92, 1, coreIn));
    // (scaled about the origin, the core's centre is near it: fine)

    /* the collar: in with the column; glows on the settle, the charge, the lock; a real green light */
    const colIn = rm ? 1 : outExpo((ti - 0.06) / 0.9);
    collar.fade(rm ? 1 : outQuart((ti - 0.06) / 0.45));
    collar.g.position.y = (1 - colIn) * 0.35 + charge * 0.03;
    const glowC = settle * 1.6 + charge * 2.4 + gauss(p, 0.42, 0.03) * 1.5 + 0.15;
    collarMat.emissiveIntensity = 0.25 + glowC * 0.55;
    collarBloom.color.copy(GREEN).multiplyScalar(0.25 + glowC * 0.8);
    collarL.position.set(0, (COLLAR.y0 + COLLAR.y1) / 2 + collar.g.position.y, 0);
    collarL.intensity = (0.5 + glowC * 2.2) * collar.opacity;
    collarL.distance = 4 + charge * 2;

    /* the column: segments slide in round the core; at the exit they telescope down into it, each nesting inside the one below */
    for (const sg of segs) {
      const kk = Math.min(sg.k, 9);
      const inn = rm ? 1 : outExpo((ti - 0.04 - kk * 0.045) / 0.95);
      sg.p.fade(rm ? 1 : outQuart((ti - 0.04 - kk * 0.045) / 0.5));
      const yc0 = (sg.y0 + sg.y1) / 2, anchor = sg.dir > 0 ? COLLAR.y1 + 0.55 : -1.21 - 0.75;
      const sN = 1 - Math.min(0.5, 0.05 * (sg.k + 1)) * C, sY = sN * (1 - 0.72 * C);
      const cen = lerp(yc0, anchor, C) + sg.dir * (1 - inn) * (0.55 + kk * 0.06);
      sg.p.g.scale.set(sN, sY, sN);
      sg.p.g.position.set(0, cen - yc0 * sY, 0);
    }

    /* the bubble: swells round the core; brightens on the charge; frosts closed in the exit */
    const bIn = rm ? 1 : outExpo((ti - 0.28) / 0.9);
    bub.piece.fade(rm ? 1 : outQuart((ti - 0.28) / 0.5) * (1 - smooth(0, 0.35, s1)));
    bub.piece.g.scale.setScalar(lerp(0.9, 1, bIn) * (1 - 0.05 * close));
    bub.piece.g.position.y = BUBBLE.y + cg * 0.08;
    bub.rim.opacity = 0.55 * bub.piece.opacity * (1 - close);
    hullMat.opacity = 0.85 * bub.piece.opacity;
    if (!lite) {
      bubbleGlass.roughness = lerp(0.16, 0.6, close);
      bubbleGlass.thickness = lerp(0.35, 1.4, close);
      bubbleGlass.color.setRGB(lerp(0.77, 0.62, close), lerp(0.96, 0.92, close), lerp(0.88, 0.8, close));
    }
    bubbleGlass.emissive.copy(GREEN).multiplyScalar(charge * 0.18 + settle * 0.12);
    U.uBubC.value.set(0, bub.piece.g.position.y + core.g.position.y * 0.5, 0);
    U.uCaust.value = (0.45 + charge * 1.4 + settle * 0.6) * (rm ? 0.6 : bIn) * (1 - close);
    U.uShimmer.value = charge + settle * 0.6;
    U.uSheen.value = rm ? -99 : ((loopT * 1.6) % 24) - 12;

    /* the rods: up into the core with the column */
    const rIn = rm ? 1 : outExpo((ti - 0.34) / 0.8);
    rods.fade(rm ? 1 : outQuart((ti - 0.34) / 0.45));
    rods.g.position.y = (1 - rIn) * -0.4 + C * 1.0;
    rods.g.scale.set(1, 1 - C * 0.6, 1);

    /* the halo: the core's glow */
    halo.position.y = core.g.position.y + 0.15;
    (halo.material as THREE.SpriteMaterial).opacity = (settle * 0.5 + charge * 0.55 + 0.08 * L) * ex + cg * 0.12 * (1 - s1);
    halo.scale.setScalar(4.2 * (1 + charge * 0.15));

    /* the frame: corners along the diagonals, arms along their normals, clamps press down last; at the exit it slides inward (positions × R, the
       pieces themselves × 0.8) and the clamps, lifted as it closes, lock down */
    for (const f of frame) {
      let dl: number, far: number, lift = 0;
      if (f.kind === "corner") { dl = 0.24 + [1, 2, 3, 0].indexOf(f.i) * 0.05; far = 0.85; lift = 0.25; }
      else if (f.kind === "clamp") { dl = 0.6 + f.arm * 0.045; far = 0; lift = 0.5; }
      else { dl = 0.36 + f.arm * 0.045 + f.j * 0.05; far = 0.6; }
      const a = rm ? 1 : outExpo((ti - dl) / 0.9);
      f.p.fade(rm ? 1 : outQuart((ti - dl) / 0.45));
      const ge = sineIO((p - 0.02 - (f.kind === "corner" ? 0 : f.kind === "clamp" ? 0.04 : 0.02 + f.j * 0.015)) / 0.34);
      const R = 1 - 0.5 * ge, sp = 1 - 0.2 * ge;
      const c = f.p.c;
      const lockLift = f.kind === "clamp" ? 0.32 * ge * (1 - lock) : 0;
      f.p.g.scale.setScalar(sp);
      f.p.g.position.set(c.x * (R - sp) + f.out.x * far * (1 - a), c.y * (1 - sp) + lift * (1 - a) + lockLift, c.z * (R - sp) + f.out.z * far * (1 - a));
    }
    dotMat.uniforms.uRing.value = 1 - 0.5 * sineIO((p - 0.02) / 0.34);

    /* the tubes: the settle's pulse runs round them; packets pass through them (circulation); their lines flash on the lock */
    const pv = circ * ex;
    for (let i = 0; i < packets.length; i++) {
      const u = 0.07 + i * 0.5 + sineIO((phi - 1.9) / 2.75) * 0.5;
      onFrame(u, packets[i].position);
      (packets[i].material as THREE.SpriteMaterial).opacity = pv * 0.75;
      packets[i].visible = pv > 0.01;
    }
    if (frameL1) { frameL1.position.copy(packets[0].position).setY(YC + 0.75); frameL1.intensity = pv * 5; }
    if (frameL2) { frameL2.position.copy(packets[1].position).setY(YC + 0.75); frameL2.intensity = pv * 5; }
    tubes.forEach((f, i) => {
      const hotS = rm ? 0 : gauss(ti, 1.42 + i * 0.045, 0.12);
      let k = 0;
      if (pv > 0.01) {
        const [p0, p1] = f.along!;
        for (const pk of packets) {
          tmp.copy(p1).sub(p0); const q = clamp(tmp2.copy(pk.position).sub(p0).dot(tmp) / tmp.lengthSq());
          const d = pk.position.distanceTo(tmp2.copy(p0).addScaledVector(tmp, q)); k = Math.max(k, Math.exp(-d * d * 2.5));
        }
      }
      const hot = Math.max(hotS, k * pv, gauss(p, 0.42, 0.03));
      const gm = f.p.mat<THREE.MeshBasicMaterial>("gline")!;
      gm.color.copy(gl0).lerp(glHot, hot * 0.8);
      const b = glineBloom.get(gm)!; b.color.copy(GREEN).multiplyScalar(0.3 + hot * 1.8 + charge * 0.2); b.opacity = f.p.opacity;
      const gg = f.p.mat<THREE.MeshPhysicalMaterial>("glass")!; gg.emissive.copy(GREEN).multiplyScalar(hot * 0.16);
    });

    /* the column's energy: particles climb; the circulation's fronts run in to the core; a green light rides the upper one */
    const yTop = lerp(13, COLLAR.y1 + 0.3, sineIO((phi - 2.05) / 2.4)), yBot = lerp(-13, -1.3, sineIO((phi - 2.05) / 2.4));
    partMat.uniforms.uT.value = loopT; partMat.uniforms.uA.value = L * (1 - smooth(0, 0.1, p)) + (rm ? 0.4 : 0);
    partMat.uniforms.uTop.value = yTop; partMat.uniforms.uBot.value = yBot; partMat.uniforms.uFront.value = circ;
    if (colL) { colL.position.set(0.75, yTop, 0.75); colL.intensity = circ * ex * 3.5; }

    /* the satellites: settle along their rows (intro); rise in turn (release); fly in along their rows into the bubble (exit) */
    for (const s of sats) {
      const dl = 0.7 + s.i * 0.045;
      const a = rm ? 1 : outExpo((ti - dl) / 0.85);
      s.p.fade(rm ? 1 : outQuart((ti - dl) / 0.45));
      const bob = Math.sin((phi / CYCLE) * Math.PI * 2 + s.i * 0.9) * 0.03 * L;
      const rise = Math.sin(Math.PI * clamp((phi - 5.7 - s.i * 0.12) / 1.1)) * 0.22 * L;
      const e = sineIO((p - 0.03 - s.i * 0.014) / 0.28);
      tmp.copy(s.base).addScaledVector(s.out, 0.7 * (1 - a)); tmp.y += bob + rise + 0.15 * (1 - a);
      tmp.lerp(bubC, e); tmp.y += Math.sin(Math.PI * e) * 1.1;
      s.p.g.position.copy(tmp);
      s.p.g.scale.setScalar(lerp(1, 0.3, e));
      s.p.g.rotation.y = e * s.spin;
    }

    /* the dotted rows and guides */
    const du = dotMat.uniforms;
    du.uT.value = loopT; du.uIntro.value = ti; du.uFlow.value = L; du.uPhi.value = phi; du.uIn.value = inflow * ex; du.uRel.value = release * ex; du.uP.value = p;

    /* the ripples (release) */
    ripples.forEach((r, i) => {
      const u = clamp((phi - 5.55 - i * 0.35) / 1.9);
      const m = r.material as THREE.ShaderMaterial;
      m.uniforms.uR.value = lerp(1.7, A + 2.1, outQuart(u));
      m.uniforms.uA.value = release * ex * Math.sin(Math.PI * u) * (1 - u * 0.5) * (i ? 0.25 : 0.42);
      r.visible = m.uniforms.uA.value > 0.005;
    });
    shadowMat.opacity = 0.1 * Math.min(...corners.map((c) => c.p.opacity)) * (1 - cg);

    /* the seal: everything gathered compresses into the bubble's place; a cube appears there, turns green, flies to the h1's square */
    const f = Math.max(0.0001, 1 - 0.88 * s1);
    asm.scale.setScalar(f); asm.position.copy(bubC).multiplyScalar(1 - f);
    asm.visible = s1 < 0.995 && p < 0.99;
    seal.visible = s1 > 0.001 && p < 0.9;
    if (seal.visible) {
      readSq();
      // its size: from the closed bubble to a cube, then to the square's size on screen
      const bs = 0.95;
      dims.set(lerp(BUBBLE.s * bs, 1.5, s1), lerp(BUBBLE.h * bs, 1.5, s1), lerp(BUBBLE.s * bs, 1.5, s1));
      // where: the bubble's centre, then on the way to the square (screen space, an arc), at the same depth
      tmp.copy(bubC).project(camera);
      const x0 = (tmp.x * 0.5 + 0.5) * W, y0 = (-tmp.y * 0.5 + 0.5) * H, z0 = tmp.z;
      const px = lerp(x0, sqPx.x, s2), py = lerp(y0, sqPx.y, s2) - Math.sin(Math.PI * s2) * H * 0.07;
      seal.position.set((px / W) * 2 - 1, 1 - (py / H) * 2, z0).unproject(camera);
      // px per world unit at that depth
      tmp.set(1, 0, 0).applyQuaternion(camera.quaternion).add(seal.position).project(camera);
      tmp2.copy(seal.position).project(camera);
      const ppu = Math.abs(tmp.x - tmp2.x) * 0.5 * W;
      const side0 = 1.5 * ppu, side = Math.exp(lerp(Math.log(side0), Math.log(Math.max(2, sqPx.s)), s2));
      const k = s2 > 0 ? side / ppu / 1.5 : 1;
      seal.scale.set(dims.x * k, dims.y * k, dims.z * k);
      seal.quaternion.copy(q0.identity()).slerp(camera.quaternion, s2);
      const g = smooth(0.25, 1, s1);
      sealMat.color.copy(sealC0).lerp(GREEN, g).multiplyScalar(1 - smooth(0.7, 1, s2) * 0.999);
      sealMat.emissiveIntensity = g * 0.35 + smooth(0.7, 1, s2) * 0.65;
      sealMat.roughness = lerp(0.55, 0.3, g);
      const so = smooth(0, 0.35, s1) * (1 - smooth(0.82, 0.88, p));
      sealMat.opacity = so; sealMat.transparent = so < 0.999;
      sealLineMat.opacity = 0.85 * so * (1 - smooth(0.4, 0.95, s2));
      sealBloom.color.copy(GREEN).multiplyScalar(g * 0.55 * (1 - s2 * 0.5) + land * 0.8); sealBloom.opacity = so;
    }
    flash.visible = land > 0.01;
    if (flash.visible) {
      flash.position.copy(seal.position);
      const ppu = seal.scale.x > 0 ? sqPx.s / seal.scale.x : 1;
      flash.scale.setScalar((sqPx.s * 5) / Math.max(1e-4, ppu) * (0.7 + land * 0.5));
      (flash.material as THREE.SpriteMaterial).opacity = land * 0.6;
    }

    if (!rm) updateHull();
    /* nothing of the drawing past the seal: the world goes; the canvas only fades under reduced motion */
    world.visible = p < 0.9;
    const op = (rm ? 1 - smooth(0, 0.6, shown) : 1).toFixed(3);
    if (op !== lastOpacity) { lastOpacity = op; canvas.style.opacity = op; }
  };
  function draw() {
    place();
    if (renderer.shadowMap.enabled) renderer.shadowMap.needsUpdate = true;
    fx.render(bloomScene);
  }

  /* the loop: only while on screen and the tab is visible */
  let last = 0, seen = true, dead = false, frozen = false;
  const tick = (now: number) => {
    raf = 0; if (dead) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
    t += dt; if (t - T0 > LOOP_AT) loopT += dt;
    shown += (prog - shown) * (1 - Math.exp(-12 * dt)); if (Math.abs(shown - prog) < 1e-4) shown = prog;
    draw();
    if (seen && !document.hidden) raf = requestAnimationFrame(tick);
  };
  const go = () => { if (!rm && !frozen && !raf && seen && !document.hidden && !dead) { last = 0; raf = requestAnimationFrame(tick); } };
  const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; go(); }, { threshold: 0 });
  const ro = new ResizeObserver(() => fit());
  const vis = () => go();
  ro.observe(hp); ro.observe(art); io.observe(wrap);
  document.addEventListener("visibilitychange", vis);

  // compile every program (opaque and fading variants) before the first frame, so the intro doesn't stall
  fit();
  for (const pc of pieces) pc.fade(0.5);
  renderer.compile(scene, camera);
  for (const pc of pieces) pc.fade(1);
  renderer.compile(scene, camera);
  for (const pc of pieces) pc.fade(0);
  draw();
  canvas.style.opacity = "1"; lastOpacity = "1";
  go();
  // a hook for the study's screenshots (?pcdebug): seek(intro time, loop time) freezes the clock there
  if (/[?&]pcdebug/.test(location.search)) (window as unknown as { __pc: unknown }).__pc = {
    get t() { return t - T0; }, get p() { return shown; }, renderer,
    seek(ti: number, lt: number) { frozen = true; cancelAnimationFrame(raf); raf = 0; t = T0 + ti; loopT = lt; shown = prog; draw(); },
    run() { frozen = false; go(); },
  };

  return {
    setProgress(p: number) {
      prog = clamp(p);
      if (rm || frozen || !raf) { shown = prog; draw(); }
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
      [black, collarBloom, sealBloom, ...glineBloom.values(), ...lib.lines].forEach((m) => m.dispose());
      for (const s of segs) for (const m of s.p.mats.values()) m.dispose();
      glowTex.dispose(); U.uNoise.value.dispose(); envRT.dispose(); fx.dispose();
      renderer.dispose(); renderer.forceContextLoss();
    },
  };
}
