// Hero study "Pillar D", "privacy through glass": the pillar (Figma node 1120:6520) in three.js, after study C (../pillar-c: its geometry, framing,
// lights, choreography and scroll), changed so the drawing tells "NEAR encrypts your prompts and transactions". Glass is the privacy boundary:
//   · below the frame the column is the public chain: solid white, its faces printed with data (glyph rows, ink) rising toward the core;
//   · inside the frame three horizontal panes stack up round the core (/hero-h's three veils, laid flat in the isometric): clear (the data still
//     sharp), frosted (soft), deep frosted (only a green glow);
//   · above the frame the column is frosted glass carrying only green light. At a glance: below legible, above private.
// The diffusion is /hero-h's: the data's picture is drawn sharp each frame and blurred to two levels (./glass.ts); each surface shows its level.
// Geometry: ./pillar.ts; look and post: ./fx.ts. At rest it reads as the Figma drawing (paper ground #F5F5F5, white blocks in the drawing's greys,
// the green collar, 1.3 px ink outlines) in the drawing's isometric (a perspective camera whose field of view at rest is a third of a degree).
// The canvas covers the whole hero (.hp) so nothing is ever clipped by a box; the camera is offset so at rest the drawing sits in .hp__art.
//   1 · Intro (≈1.8 s, fast and soft): one wave. The camera eases in from a short, slightly turned perspective; the core first, the column's
//       segments slide in round it, the panes settle down onto it one after another, the frame's corners along their diagonals, its arms along their
//       normals, the clamps press down, the satellites settle along their rows. Short distances, expo ease-out, 40–60 ms staggers. The settle: one
//       pulse of light up through the glass (the three panes in turn, then the frosted column).
//   2 · Loop (one 8 s master cycle, the story of a private transaction): 0–2 s INFLOW, a band of data runs up the chain (its glyphs turn green) and
//       packets run in along the dotted rows; 2–4.5 s CROSSING, the data crosses the glass, a wave of light spreads over each pane in turn: sharp
//       glyphs, then soft rows, then only a glow; 4.5–5.5 s CHARGE, the core computes unseen: the deep pane, the collar and the core's halo swell, the
//       core lifts a hair; 5.5–8 s RELEASE, one green proof (the result without the data) runs up the frosted column to the top edge, a ripple runs
//       out over the floor and the rows, the satellites rise and settle in turn. Underneath: the chain's rows rise, the frost's glow drifts up, the
//       dots flow, a 1° camera drift.
//   3 · Exit, "seal" (setProgress 0 → 1 over the hero's hold): 0–0.45 GATHER, the satellites fly in along their rows, the frame slides inward, the
//       column telescopes into the frame, and the three panes close over the core like lids (each tips as it swings in, then lies flat, stacked
//       tight round it); 0.45–0.8 SEAL, the gathered glass compresses into one cube that turns green, travels and shrinks onto the h1's green square
//       (.hp__sq) and lands on it with a soft flash; 0.8–1, only the h1's own square remains. Reversible.
// Intro and scroll compose. Runs only on screen with the tab visible; DPR ≤ 2; small screens drop shadows; reduced motion: a still frame that fades
// as the page scrolls.
import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { A, COLLAR, DOTS, GUIDES, PANES, SAT_Y, SATS, TUBE, YC, buildCollar, buildColumn, buildCore, buildFrame, buildPane, buildSat, fromDrawing, type Piece } from "./pillar";
import { glowTexture, library, post, uniforms } from "./fx";
import { type Glyph, data } from "./glass";

export type PillarScene = { setProgress(p: number): void; dispose(): void };
export type Els = { hp: HTMLElement; art: HTMLElement; wrap: HTMLElement; sq: HTMLElement | null };

const PX = 100 / Math.sqrt(2 / 3);              // drawing px per camera unit
const ISO_EL = Math.atan(1 / Math.SQRT2);       // true isometric: 35.26° down, 45° round
const REST_FOV = THREE.MathUtils.degToRad(0.35);
const FRAME_W = 1668, SPREAD_H = 1193;          // the frame's width and the satellites' spread, in drawing px
const CYCLE = 8;                                // the loop's master cycle, s
const LOOP_AT = 1.75;                           // the loop's clock starts (its first INFLOW rises from nothing)
const CEN = new THREE.Vector3(0, 0.21, 0);      // the gathered object's centre (the core's middle): everything seals there

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

export function mount(canvas: HTMLCanvasElement, els: Els, opts: { reduced: boolean; glyph: Glyph }): PillarScene {
  const rm = opts.reduced;
  const { hp, art, wrap } = els;
  const lite = Math.min(window.innerWidth, window.screen?.width || 9999) < 1000;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, stencil: false, powerPreference: "high-performance" });
  const pr = Math.min(devicePixelRatio || 1, lite ? 1.75 : 2);
  renderer.setPixelRatio(pr);
  renderer.setClearColor("#f5f5f5", 1);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.localClippingEnabled = true;
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
  const lights = pl(lite ? 2 : 3);
  const collarL = lights[0], coreL = lights[1], proofL = lights[2] ?? null;

  /* the data's pictures (sharp, soft, glow), the material library, the shared uniforms */
  const U = uniforms();
  const dat = data(renderer, opts.glyph, lite);
  U.tSharp.value = dat.sharp;
  const lib = library(U, dat);
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

  /* the panes: clear, frosted, deep frosted (bottom to top) */
  const panes = PANES.map((pd, i) => {
    const p = keep(buildPane(lib, i));
    const m = p.mat<THREE.ShaderMaterial>("pane")!;
    m.uniforms.uLevel.value = i; m.uniforms.uHalf.value = pd.half; m.uniforms.uHole.value = pd.hole;
    m.uniforms.uDrift.value = [0.06, -0.045, 0.03][i];
    const up = PANES[i + 1];
    if (up) m.uniforms.uShadow.value.set(up.half, up.hole, up.y - pd.y);
    m.uniforms.uKey.value.set(KEY.x / KEY.y, KEY.z / KEY.y);
    return { p, m, i, ...pd };
  });

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
    return { p, base: pos, out: pos.clone().setY(0).normalize(), i, spin: (i % 2 ? 1 : -1) * (0.6 + (i % 3) * 0.3) };
  });

  /* the glows: the core's halo under the panes, the frame's packets, the proof, the landing flash */
  const glowTex = glowTexture();
  const sprite = (scale: number, order: number, depthTest = true) => {
    const m = new THREE.SpriteMaterial({ map: glowTex, color: GREEN, transparent: true, opacity: 0, depthWrite: false, depthTest });
    const s = new THREE.Sprite(m); s.scale.setScalar(scale); s.renderOrder = order; s.userData.kind = "glow"; return s;
  };
  const halo = sprite(3.6, 2); asm.add(halo);
  const packets = [0, 1].map(() => { const s = sprite(1.1, 7); world.add(s); return s; });
  const proof = sprite(0.85, 8, false); asm.add(proof);
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

  /* the contact shadow: a floor at the core's foot that only takes shadows (the frame's, the panes', the core's), fading out round its centre */
  const shadowMat = new THREE.ShadowMaterial({ color: 0x2a2620, opacity: 0.1, depthWrite: false });
  shadowMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vFl;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvFl = position.xy;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec2 vFl;")
      .replace("gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );", "gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) * (1.0 - smoothstep(3.0, 7.5, length(vFl))) );");
  };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), shadowMat);
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.215; floor.receiveShadow = !lite; floor.userData.kind = "shadow"; floor.renderOrder = 0;
  asm.add(floor);
  // the column doesn't cast (its shadow would be an endless band); the glass casts (a pale shadow: the floor's is faint)
  for (const sg of segs) sg.p.g.traverse((o) => { o.castShadow = false; });
  for (const pn of panes) pn.p.g.traverse((o) => { o.castShadow = !lite; });

  /* the seal: one cube (the gathered glass, then green) that flies to the h1's square */
  const sealMat = new THREE.MeshPhysicalMaterial({ color: "#eef8f3", emissive: GREEN, emissiveIntensity: 0, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.2, transparent: true, opacity: 0 });
  const seal = new THREE.Mesh(new RoundedBoxGeometry(1, 1, 1, 3, 0.06), sealMat); seal.userData.kind = "seal"; seal.renderOrder = 8;
  const sealLineMat = lib.line();
  const slg = new LineSegmentsGeometry(); { const e = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)); slg.setPositions(Array.from(e.attributes.position.array)); e.dispose(); }
  const sealLine = new LineSegments2(slg, sealLineMat); sealLine.userData.kind = "line"; sealLine.renderOrder = 9; seal.add(sealLine);
  seal.visible = false; world.add(seal);

  /* the bloom's look: whites black (they hide what's behind them but never glow), lines / the floor hidden, green parts their bright twins, the
     glass its own green light only, added */
  const black = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const collarBloom = new THREE.MeshBasicMaterial({ color: GREEN });
  const sealBloom = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true });
  const occ: THREE.Mesh[] = [], hidden: THREE.Object3D[] = [], swap: [THREE.Mesh, THREE.Material][] = [], glassMats: THREE.ShaderMaterial[] = [];
  const glineBloom = new Map<THREE.Material, THREE.MeshBasicMaterial>();
  world.traverse((o) => {
    const k = o.userData.kind as string | undefined, mesh = o as THREE.Mesh;
    if (k === "white" || k === "chain" || k === "dim" || k === "screw" || k === "core") occ.push(mesh);
    else if (k === "line" || k === "shadow") hidden.push(o);
    else if (k === "green") swap.push([mesh, collarBloom]);
    else if (k === "seal") swap.push([mesh, sealBloom]);
    else if (k === "gline") { const b = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, depthWrite: false }); glineBloom.set(mesh.material as THREE.Material, b); swap.push([mesh, b]); }
    else if (k === "pane" || k === "frost" || k === "glass") glassMats.push(mesh.material as THREE.ShaderMaterial);
  });
  const saved: THREE.Material[] = [], savedVis: boolean[] = [];
  const bloomScene = () => {
    let i = 0;
    for (const o of occ) { saved[i++] = o.material as THREE.Material; o.material = black; }
    for (const [o, b] of swap) { saved[i++] = o.material as THREE.Material; o.material = b; }
    hidden.forEach((o, j) => { savedVis[j] = o.visible; o.visible = false; });
    for (const m of glassMats) { m.uniforms.uBloom.value = 1; m.blending = THREE.AdditiveBlending; }
    dotMat.uniforms.uBloom.value = 1;
    const env = scene.environment; scene.environment = null;
    return () => {
      let j = 0;
      for (const o of occ) o.material = saved[j++];
      for (const [o] of swap) o.material = saved[j++];
      hidden.forEach((o, k) => { o.visible = savedVis[k]; });
      for (const m of glassMats) { m.uniforms.uBloom.value = 0; m.blending = THREE.NormalBlending; }
      dotMat.uniforms.uBloom.value = 0;
      scene.environment = env;
    };
  };
  const fx = post(renderer, scene, camera, { lite });

  /* the fit: the canvas covers the hero; at rest the drawing sits in .hp__art at the drawing's scale (the frame ≈ 79.5 % of its width, centred) */
  let W = 1, H = 1, restH = 20, cx = 0, cy = 0, artTop = 0, artBot = 1, topY = 12;
  let raf = 0;
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
    for (const l of lib.lines) l.resolution.set(W, H);
    dotMat.uniforms.uSize.value = s * pr;
    fx.comp.mat.uniforms.uC.value.set(cx / W, 1 - cy / H);
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
  /* the column's clip: two planes square to the screen through the art box's top and bottom edges; the column's height at the top edge (the proof
     runs up to it) */
  const up = new THREE.Vector3(), tv = new THREE.Vector3();
  const setClip = () => {
    up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    tv.set(0, 1 - (artTop / H) * 2 + 0.002, 0.5).unproject(camera); clipTop.set(up.clone().negate(), up.dot(tv));
    tv.set(0, 1 - (artBot / H) * 2 - 0.002, 0.5).unproject(camera); clipBot.set(up.clone(), -up.dot(tv));
    const a = tv.set(0, 0, 0).project(camera).y, b = tv.set(0, 1, 0).project(camera).y;
    topY = ((1 - (artTop / H) * 2) - a) / (b - a);
  };

  /* state */
  let prog = 0, shown = 0, t = 0, loopT = 0, lastOpacity = "";
  const T0 = rm ? 0 : Math.max(0, 0.2 - performance.now() / 1000);   // the art starts ~0.2 s into the page
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), dims = new THREE.Vector3(), q0 = new THREE.Quaternion();
  const gl0 = new THREE.Color("#00dc8d"), glHot = new THREE.Color("#b6ffe3");
  const sealC0 = new THREE.Color("#eef8f3");
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
    U.uT.value = loopT + Math.max(0, ti) * 0.5;
    dat.update(rm ? 3 : U.uT.value);

    /* the loop's beats */
    const inflow = bump(phi, 0, 0.35, 1.7, 2.1) * L;
    const crossing = bump(phi, 1.85, 2.15, 4.1, 4.6) * L;
    const charge = bump(phi, 4.25, 4.85, 5.25, 5.95) * L;
    const release = bump(phi, 5.45, 5.75, 7.2, 7.9) * L;
    const ex = 1 - smooth(0, 0.12, p);                           // the loop's light fades as the exit starts

    /* the exit's phases */
    const cg = sineIO(p / 0.42), cs = sineIO((p - 0.44) / 0.16);
    const C = sineIO((p - 0.03) / 0.4);                          // the column telescopes
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
    setCam(az, el, fov, vh);
    setClip();

    /* lights: the key fixed on the scene, the rim circling slowly */
    key.position.copy(KEY).multiplyScalar(15); key.target.position.set(0, 0, 0);
    const ra = loopT * 0.12 + 2.4;
    rim.position.set(Math.cos(ra) * -0.8, 0.45, Math.sin(ra) * -0.8);
    rim.intensity = 0.2 * Math.PI * (0.6 + 0.4 * Math.sin(loopT * 0.21));

    /* the settle: one pulse of light up through the glass, as the intro ends (the three panes in turn, then the frost) */
    const settleAt = (k: number) => (rm ? 0 : gauss(ti, 1.3 + k * 0.16, 0.16));

    /* the core: first in; breathes on the cycle; lifts as it charges */
    const coreIn = rm ? 1 : outExpo(ti / 0.9);
    core.fade(rm ? 1 : outQuart(ti / 0.45));
    core.g.position.y = (1 - coreIn) * -0.3 + Math.sin((phi / CYCLE) * Math.PI * 2) * 0.012 * L + charge * 0.06 + cg * 0.08;
    core.g.scale.setScalar(lerp(0.92, 1, coreIn));
    U.uBubC.value.set(0, 0.1 + core.g.position.y, 0);
    U.uCaust.value = (0.25 + charge * 1.2 + settleAt(1) * 0.5) * (rm ? 0.6 : coreIn) * (1 - cg);
    coreL.position.set(0, 0.6 + core.g.position.y, 0);
    coreL.intensity = (charge * 3 + settleAt(2) * 1.5) * ex;

    /* the collar: in with the column; glows on the settle, the charge, the lock; a real green light */
    const colIn = rm ? 1 : outExpo((ti - 0.06) / 0.9);
    collar.fade(rm ? 1 : outQuart((ti - 0.06) / 0.45));
    collar.g.position.y = (1 - colIn) * 0.35 + charge * 0.03;
    const glowC = settleAt(3) * 1.6 + charge * 2.4 + release * 0.8 * gauss(phi, 5.7, 0.35) + gauss(p, 0.42, 0.03) * 1.5 + 0.15;
    collarMat.emissiveIntensity = 0.25 + glowC * 0.55;
    collarBloom.color.copy(GREEN).multiplyScalar(0.2 + glowC * 0.45);
    collarL.position.set(0, (COLLAR.y0 + COLLAR.y1) / 2 + collar.g.position.y, 0);
    collarL.intensity = (0.05 + glowC * 0.45) * collar.opacity;
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
    /* the chain's data: rows rise; the inflow's band runs up to the core */
    U.uBandY.value = lerp(-13, -0.9, sineIO(phi / 1.95));
    U.uBand.value = inflow * ex;
    U.uInk.value = rm ? 1 : outQuart((ti - 0.2) / 0.8) * (1 - smooth(0.1, 0.4, p));
    /* the frost's glow: up on the charge; the proof runs up it to the top edge on the release */
    U.uGlow.value = (0.35 + charge * 0.9 + settleAt(3) * 0.8 + crossing * 0.25) * (rm ? 1 : outQuart((ti - 0.3) / 0.8));
    const pu = clamp((phi - 5.55) / 1.6);
    const proofY = lerp(COLLAR.y1, topY + 0.8, Math.pow(pu, 1.35)), proofA = release * ex * (1 - smooth(0.85, 1, pu)) * smooth(0, 0.08, pu);
    const settleY = lerp(COLLAR.y1, topY + 0.8, Math.pow(clamp((ti - 1.66) / 1.1), 1.35)), settleA = rm ? 0 : bump(ti, 1.62, 1.7, 2.45, 2.75);
    U.uPulseY.value = settleA > proofA ? settleY : proofY; U.uPulse.value = Math.max(proofA, settleA * 0.6);
    proof.position.set(0, U.uPulseY.value, 0);
    (proof.material as THREE.SpriteMaterial).opacity = U.uPulse.value * 0.55;
    proof.visible = U.uPulse.value > 0.01;
    if (proofL) { proofL.position.set(0.7, U.uPulseY.value, 0.7); proofL.intensity = U.uPulse.value * 3; }

    /* the panes: settle down onto the core one after another (intro); the crossing's wave spreads over each in turn; at the exit they close over the
       core like lids: each swings in (tipping as it goes) and shrinks, then lies flat, stacked tight round it */
    for (const pn of panes) {
      const dl = 0.22 + pn.i * 0.06;
      const a = rm ? 1 : outExpo((ti - dl) / 0.9);
      pn.p.fade(rm ? 1 : outQuart((ti - dl) / 0.5));
      const e = sineIO((p - 0.03 - pn.i * 0.035) / 0.36);
      const tgtY = CEN.y + (pn.i - 1) * 0.3, tgtS = 1.22 / pn.half;
      const y = lerp(pn.y + (1 - a) * (0.32 + pn.i * 0.08), tgtY, e);
      const sc = lerp(lerp(0.96, 1, a), tgtS, e);
      pn.p.g.position.set(0, y, 0);
      pn.p.g.scale.set(sc, lerp(1, 1.6, e), sc);
      const tip = Math.sin(Math.PI * e) * 0.42 * (pn.i === 1 ? 0 : pn.i === 0 ? -1 : 1);
      pn.p.g.rotation.set(tip * 0.7, 0, -tip * 0.7);
      // the crossing: pane i lights at 2.0 + 0.75 i s; the wave spreads from the hole out to the rim in 0.95 s
      const t0 = 2.0 + pn.i * 0.75, w = clamp((phi - t0) / 0.95);
      const sW = clamp((ti - (1.2 + pn.i * 0.16)) / 0.6);
      const lit = Math.max(crossing * Math.sin(Math.PI * w) * ex, settleAt(pn.i) * 0.9);
      pn.m.uniforms.uLit.value = lit + gauss(p, 0.42, 0.03) * 0.6;
      pn.m.uniforms.uWave.value = lit > 0.01 && settleAt(pn.i) * 0.9 < crossing * Math.sin(Math.PI * w) * ex ? lerp(pn.hole, pn.half + 0.3, w) : lerp(pn.hole, pn.half + 0.3, sW);
    }

    /* the halo: the core's glow under the panes */
    halo.position.y = core.g.position.y + 0.2;
    (halo.material as THREE.SpriteMaterial).opacity = (settleAt(2) * 0.3 + charge * 0.4) * ex + cg * 0.1 * (1 - s1);
    halo.scale.setScalar(3.6 * (1 + charge * 0.15));

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

    /* the tubes: two packets run round them while the data crosses (each a green light in the glass); their lines flash on the settle and the lock */
    const pv = crossing * ex;
    for (let i = 0; i < packets.length; i++) {
      const u = 0.07 + i * 0.5 + sineIO((phi - 1.9) / 2.75) * 0.5;
      onFrame(u, packets[i].position);
      (packets[i].material as THREE.SpriteMaterial).opacity = pv * 0.45;
      packets[i].visible = pv > 0.01;
    }
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
      f.p.mat<THREE.ShaderMaterial>("glass")!.uniforms.uHot.value = hot * 0.8;
    });

    /* the satellites: settle along their rows (intro); rise in turn (release); fly in along their rows to the core (exit) */
    for (const s of sats) {
      const dl = 0.7 + s.i * 0.045;
      const a = rm ? 1 : outExpo((ti - dl) / 0.85);
      s.p.fade(rm ? 1 : outQuart((ti - dl) / 0.45));
      const bob = Math.sin((phi / CYCLE) * Math.PI * 2 + s.i * 0.9) * 0.03 * L;
      const rise = Math.sin(Math.PI * clamp((phi - 5.7 - s.i * 0.12) / 1.1)) * 0.22 * L;
      const e = sineIO((p - 0.03 - s.i * 0.014) / 0.28);
      tmp.copy(s.base).addScaledVector(s.out, 0.7 * (1 - a)); tmp.y += bob + rise + 0.15 * (1 - a);
      tmp.lerp(CEN, e); tmp.y += Math.sin(Math.PI * e) * 1.1;
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
      m.uniforms.uA.value = release * ex * Math.sin(Math.PI * u) * (1 - u * 0.5) * (i ? 0.2 : 0.34);
      r.visible = m.uniforms.uA.value > 0.005;
    });
    shadowMat.opacity = 0.1 * Math.min(...corners.map((c) => c.p.opacity)) * (1 - cg);

    /* the seal: everything gathered compresses into the core's place; a cube appears there, turns green, flies to the h1's square */
    const f = Math.max(0.0001, 1 - 0.88 * s1);
    asm.scale.setScalar(f); asm.position.copy(CEN).multiplyScalar(1 - f);
    asm.visible = s1 < 0.995 && p < 0.99;
    seal.visible = s1 > 0.001 && p < 0.9;
    if (seal.visible) {
      readSq();
      // its size: from the stacked panes to a cube, then to the square's size on screen
      dims.set(lerp(2.44, 1.5, s1), lerp(1.0, 1.5, s1), lerp(2.44, 1.5, s1));
      // where: the gathered centre, then on the way to the square (screen space, an arc), at the same depth
      tmp.copy(CEN).project(camera);
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
  let last = 0, seen = true, dead = false;
  const tick = (now: number) => {
    raf = 0; if (dead) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
    t += dt; if (t - T0 > LOOP_AT) loopT += dt;
    shown += (prog - shown) * (1 - Math.exp(-12 * dt)); if (Math.abs(shown - prog) < 1e-4) shown = prog;
    draw();
    if (seen && !document.hidden) raf = requestAnimationFrame(tick);
  };
  const go = () => { if (!rm && !raf && seen && !document.hidden && !dead) { last = 0; raf = requestAnimationFrame(tick); } };
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
      [black, collarBloom, sealBloom, ...glineBloom.values(), ...lib.lines].forEach((m) => m.dispose());
      glowTex.dispose(); U.uNoise.value.dispose(); envRT.dispose(); fx.dispose(); dat.dispose();
      renderer.dispose(); renderer.forceContextLoss();
    },
  };
}
