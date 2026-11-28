// Hero study "Stack D", "privacy through glass": the stack (Figma node 1123:6508, "VEC03_STACK_11") in three.js, after Pillar D (../pillar-d: its
// glass, look, post, choreography and scroll), telling "NEAR encrypts your prompts and transactions". The stack IS the diffusion: data enters at the
// bottom as legible LINES (rows of dashes, packets on a bus) and rises plate by plate; each green glass sheet frosts it one level more:
//   · the green glass base (A5) shows the data sharp, ink lines on its top;
//   · the perforated plate (A4) lets it through as dots of light, the middle green sheet (A3) shows it soft (streaks), the glass column (B2) carries
//     only a glow up through it, the arm plate (A2) lets a haze through its holes, the top sheet (A1) shows only a green glow;
//   · the green cube on top (B1) receives only that glow, computes, and one green proof (the result without the data) leaves up the axis.
// The diffusion is /hero-h's: the data's picture is drawn sharp each frame and blurred to two levels (./glass.ts); each surface shows its level.
// Geometry: ./stack.ts; look and post: ./fx.ts. At rest it reads as the Figma drawing (paper ground #F5F5F5, white plates in the drawing's greys,
// the drawing's mint glass, 1.3 px ink outlines) in the drawing's isometric (a perspective camera whose field of view at rest is a third of a degree).
// The canvas covers the whole hero (.hp) so nothing is ever clipped by a box; the camera is offset so at rest the drawing sits in .hp__art.
//   1 · Intro (≈1.8 s, fast and soft): one wave, bottom to top. The camera eases in from a short, slightly turned perspective; the base first, the
//       plates settle down onto their places one after another, the column rises into them, the cube lands on top, the satellites settle along their
//       feed lines, the guides draw on. Short distances, expo ease-out, 50–60 ms staggers. The settle: one pulse of light up through the glass.
//   2 · Loop (one 8 s master cycle, the story of a private transaction): 0–2 s INFLOW, packets of data run in from the satellites along their feed
//       lines and a band of light sweeps the base's legible lines; 2–4.5 s CROSSING, the light rises through the stack, plate by plate (the base's
//       lines go green, A4's holes light as dots, A3's streaks, the column's glow, A2's haze, A1's glow); 4.5–5.5 s CHARGE, the cube computes unseen:
//       it brightens and lifts a hair, the top sheet's glow swells; 5.5–8 s RELEASE, one green proof leaves the cube up the axis off the top edge, a
//       ripple runs out over the floor, the satellites rise and settle in turn. Underneath: the data rows slide, the column's glow drifts up, the
//       guides' dashes flow, a 1° camera drift.
//   3 · Exit, "seal" (setProgress 0 → 1 over the hero's hold): 0–0.45 GATHER, the satellites fly in along their feed lines, the guides draw in, the
//       column retracts, and the plates close together like lids (each tips as it swings in, then lies flat), the stack compressing round its middle,
//       the cube coming down onto it; 0.45–0.8 SEAL, the gathered stack compresses into one cube that turns green, travels and shrinks onto the h1's
//       green square (.hp__sq) and lands on it with a soft flash; 0.8–1, only the h1's own square remains. Reversible.
// Intro and scroll compose. Runs only on screen with the tab visible; DPR ≤ 2; small screens drop shadows; reduced motion: a still frame that fades
// as the page scrolls.
import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  AXIS, BASE_CUBE, COLUMN, COTAS, CUBE, FLOOR, PLATES, SATS, TOPLINE, VGUIDES, F,
  buildColumn, buildCube, buildPlate, fromDrawing, type Piece,
} from "./stack";
import { glowTexture, library, post, uniforms } from "./fx";
import { data } from "./glass";

export type StackScene = { setProgress(p: number): void; dispose(): void };
export type Els = { hp: HTMLElement; art: HTMLElement; wrap: HTMLElement; sq: HTMLElement | null };

const PX = 100 / Math.sqrt(2 / 3);              // drawing px per camera unit
const ISO_EL = Math.atan(1 / Math.SQRT2);       // true isometric: 35.26° down, 45° round
const REST_FOV = THREE.MathUtils.degToRad(0.35);
const SPAN_W = 1482, SPAN_H = 1708;             // the drawing's spread (satellites side to side; the top sheet to the base's foot), drawing px
const MID_Y = (F.y - 1138) / 100;               // the axis point at the spread's middle (the camera's target)
const CYCLE = 8;
const LOOP_AT = 1.75;
const CEN = new THREE.Vector3(0, 5.6, 0);       // the gathered object's centre: everything seals there

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const outExpo = (t: number) => { t = clamp(t); return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); };
const outQuart = (t: number) => 1 - Math.pow(1 - clamp(t), 4);
const sineIO = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t));
const p2IO = (t: number) => { t = clamp(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
const bump = (v: number, a: number, b: number, c: number, d: number) => smooth(a, b, v) * (1 - smooth(c, d, v));
const gauss = (v: number, c: number, w: number) => Math.exp(-Math.pow((v - c) / w, 2));

export function mount(canvas: HTMLCanvasElement, els: Els, opts: { reduced: boolean }): StackScene {
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

  /* lights: ambient + key (shadows on the floor) + a fill from below and behind + a rim that circles; green lights by the cube and the proof */
  const amb = new THREE.AmbientLight(0xffffff, 0.3 * Math.PI); scene.add(amb);
  const key = new THREE.DirectionalLight(0xffffff, 0.56 * Math.PI);
  const KEY = new THREE.Vector3(0.273, 0.834, 0.478).normalize();
  scene.add(key, key.target);
  if (!lite) {
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 5; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.025;
    const sc = key.shadow.camera; sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.near = 1; sc.far = 50; sc.updateProjectionMatrix();
  }
  const fill = new THREE.DirectionalLight(0xffffff, 0.38 * Math.PI); fill.position.set(-0.55, -0.6, -0.58); scene.add(fill, fill.target);
  const rim = new THREE.DirectionalLight(0xeaf6ff, 0.2 * Math.PI); scene.add(rim, rim.target);
  const GREEN = new THREE.Color("#00dc8d");
  const cubeL = new THREE.PointLight(GREEN, 0, 5, 2); world.add(cubeL);

  /* the data's pictures (sharp, soft, glow), the material library, the shared uniforms */
  const U = uniforms();
  const dat = data(renderer, lite);
  U.tSoft.value = dat.soft; U.tGlow.value = dat.glow;
  const lib = library(U, dat);
  const pieces: Piece[] = [];
  const keep = <T extends Piece>(p: T, parent: THREE.Object3D = asm) => { pieces.push(p); parent.add(p.g); return p; };

  /* the plates, bottom to top; each knows the one above it (its soft shadow) */
  type PerfU = { uLit: THREE.IUniform; uWave: THREE.IUniform; uShade: THREE.IUniform; uShadow: THREE.IUniform; uKey: THREE.IUniform; uBl: THREE.IUniform };
  const plates = PLATES.map((d, i) => {
    const p = keep(buildPlate(lib, d));
    const glass = p.mat<THREE.ShaderMaterial>("glass");
    const perfM = p.mat<THREE.MeshStandardMaterial>("perf") ?? p.mat<THREE.MeshStandardMaterial>("perfArm");
    const perf = perfM ? (perfM.userData.perf as PerfU) : null;
    const up = PLATES[i + 1];
    const gap = up ? up.y0 - d.y1 : 0;
    if (glass) {
      const u = glass.uniforms;
      u.uLevel.value = d.level; u.uHalf.value = d.half; u.uHole.value = d.hole; u.uY.value = d.y1; u.uDots.value = d.kind === "base" ? 1 : 0;
      if (up && gap < 3) u.uShadow.value.set(up.half, up.hole, gap);
      u.uKey.value.set(KEY.x / KEY.y, KEY.z / KEY.y);
    }
    if (perf) {
      if (up) perf.uShadow.value.set(up.half, up.hole, gap);
      perf.uKey.value.set(KEY.x / KEY.y, KEY.z / KEY.y);
      perf.uShade.value = 0.05;
    }
    p.c.set(0, (d.y0 + d.y1) / 2, 0);
    return { p, d, i, glass, perf, perfM };
  });
  const column = keep(buildColumn(lib));
  const colMat = column.mat<THREE.ShaderMaterial>("column")!;
  const cube = keep(buildCube(lib, CUBE.s, "green", [0, CUBE.y0, 0]));
  const cubeMat = cube.mat<THREE.MeshPhysicalMaterial>("green")!;
  const baseCube = keep(buildCube(lib, BASE_CUBE.s, "white", [BASE_CUBE.at, PLATES[0].y1, BASE_CUBE.at]));

  /* the satellites: white cubes, each feeding one plate along a floor axis */
  const sats = SATS.map((sd, i) => {
    const pos = fromDrawing(sd.sx, sd.sy, sd.y);
    const pd = PLATES[sd.feeds];
    const alongX = Math.abs(pos.z) <= pd.half;
    const dir = alongX ? new THREE.Vector3(-Math.sign(pos.x), 0, 0) : new THREE.Vector3(0, 0, -Math.sign(pos.z));
    const from = pos.clone().addScaledVector(dir, sd.s / 2 + 0.06);
    const to = pos.clone(); if (alongX) to.x = Math.sign(pos.x) * pd.half; else to.z = Math.sign(pos.z) * (pd.kind === "arm" ? 2.76 : pd.half);
    const p = keep(buildCube(lib, sd.s, "white", [0, -sd.s / 2, 0]));
    p.c.set(0, 0, 0);
    return { p, base: pos, dir, from, to, i, feeds: sd.feeds, spin: (i % 2 ? 1 : -1) * 0.8 };
  });

  /* the glows: the cube's halo, the packets, the proof, the landing flash */
  const glowTex = glowTexture();
  const sprite = (scale: number, order: number, depthTest = true) => {
    const m = new THREE.SpriteMaterial({ map: glowTex, color: GREEN, transparent: true, opacity: 0, depthWrite: false, depthTest });
    const s = new THREE.Sprite(m); s.scale.setScalar(scale); s.renderOrder = order; s.userData.kind = "glow"; return s;
  };
  const halo = sprite(3.4, 9); asm.add(halo);
  const packets = sats.map(() => { const s = sprite(0.8, 9); world.add(s); return s; });
  const proof = sprite(0.9, 10, false); world.add(proof);
  const flash = sprite(1, 11, false); world.add(flash);

  /* the guides: dashed ink (the verticals, the axis, the top line, the feed lines), the dimension ticks, the floor's diamond and its dots */
  const guides = new THREE.Group(); world.add(guides);
  type G = { l: LineSegments2; m: LineMaterial; k: number; dl: number };
  const gl: G[] = [];
  const lineSet = (segs: number[], o: { k: number; dl: number; dash?: number; gap?: number; color?: number; width?: number; order?: number; parent?: THREE.Object3D }) => {
    const m = new LineMaterial({ color: o.color ?? 0x111111, linewidth: o.width ?? 1, transparent: true, opacity: 0, depthWrite: false, dashed: !!o.dash, dashSize: o.dash ?? 1, gapSize: o.gap ?? 1 });
    lib.lines.push(m);
    const g = new LineSegmentsGeometry(); g.setPositions(segs);
    const l = new LineSegments2(g, m); if (o.dash) l.computeLineDistances(); l.renderOrder = o.order ?? 1; l.userData.kind = "line";
    (o.parent ?? guides).add(l);
    const r = { l, m, k: o.k, dl: o.dl }; gl.push(r); return r;
  };
  const onAxisPlane = (sx: number, sy: number) => { const u = (sx - F.x) / 86.6; return new THREE.Vector3(u / 2, (F.y - sy) / 100, -u / 2); };
  const vseg: number[] = [];
  for (const [sx, a, b] of VGUIDES) { const p = onAxisPlane(sx, a), q = onAxisPlane(sx, b); vseg.push(...p.toArray(), ...q.toArray()); }
  lineSet(vseg, { k: 0.5, dl: 0.75, dash: 0.06, gap: 0.072 });
  const TOP = 40;
  const axisLo = onAxisPlane(AXIS.sx, AXIS.syBottom);
  const axis = lineSet([...axisLo.toArray(), 0, TOP, 0], { k: 0.5, dl: 0.55, dash: 0.06, gap: 0.072 });
  const topP = fromDrawing(TOPLINE.sx, TOPLINE.sy, PLATES[3].y1);   // the top guide's black dot, on A2's top
  const topLine = lineSet([...topP.toArray(), topP.x, TOP, topP.z], { k: 0.5, dl: 0.65, dash: 0.06, gap: 0.072 });
  const cseg: number[] = [];
  for (const [sx, a, b] of COTAS) {
    const p = onAxisPlane(sx, a), q = onAxisPlane(sx, b);
    cseg.push(...p.toArray(), ...q.toArray());
    for (const e of [p, q]) cseg.push(e.x - 0.069, e.y, e.z, e.x + 0.069, e.y, e.z);
  }
  lineSet(cseg, { k: 0.8, dl: 0.9 });
  const fh = FLOOR.half, fy = FLOOR.y;
  lineSet([-fh, fy, -fh, fh, fy, -fh, fh, fy, -fh, fh, fy, fh, fh, fy, fh, -fh, fy, fh, -fh, fy, fh, -fh, fy, -fh], { k: 0.28, dl: 0.4, order: 0 });
  sats.forEach((s) => lineSet([...s.from.toArray(), ...s.to.toArray()], { k: 0.55, dl: 0.8 + s.i * 0.05, dash: 0.06, gap: 0.072 }));
  // the green tracers: one dash running along a line (the packets in, the proof up the axis)
  const tracer = (a: THREE.Vector3, b: THREE.Vector3, len: number) => {
    const m = new LineMaterial({ color: 0x00dc8d, linewidth: 2.2, transparent: true, opacity: 0, depthWrite: false, depthTest: false, dashed: true, dashSize: len, gapSize: 999 });
    lib.lines.push(m);
    const g = new LineSegmentsGeometry(); g.setPositions([...a.toArray(), ...b.toArray()]);
    const l = new LineSegments2(g, m); l.computeLineDistances(); l.renderOrder = 10; l.userData.kind = "tracer"; world.add(l);
    return { l, m, len: a.distanceTo(b) };
  };
  const inTr = sats.map((s) => tracer(s.from, s.to, 0.7));
  const proofTop = new THREE.Vector3(0, TOP, 0);
  const proofTr = tracer(new THREE.Vector3(0, CUBE.y0 + CUBE.s, 0), proofTop, 1.4);
  // the floor's dots (the drawing's small rings round the diamond and on its grid) and A2's black dot
  const fdots: number[] = [];
  for (let i = -5; i <= 5; i++) for (let j = -5; j <= 5; j++) {
    const x = i * 0.862, z = j * 0.862;
    if (Math.abs(x) > fh + 0.01 || Math.abs(z) > fh + 0.01) continue;
    const edge = Math.abs(Math.abs(x) - fh) < 0.45 || Math.abs(Math.abs(z) - fh) < 0.45;
    if (!edge && (Math.abs(x) < 3.2 && Math.abs(z) < 3.2)) continue;            // under the base: hidden anyway
    fdots.push(x, fy, z);
  }
  const fdg = new THREE.BufferGeometry(); fdg.setAttribute("position", new THREE.Float32BufferAttribute(fdots, 3));
  const fdMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { uSize: { value: 3 }, uA: { value: 0 } },
    vertexShader: "uniform float uSize; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = uSize; }",
    fragmentShader: "uniform float uA; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = smoothstep(1.0, 0.75, d) * (1.0 - smoothstep(0.55, 0.35, d) * 0.85) * uA; if (a < 0.01) discard; gl_FragColor = vec4(vec3(0.067), a); }",
  });
  const fdPts = new THREE.Points(fdg, fdMat); fdPts.userData.kind = "line"; fdPts.frustumCulled = false; guides.add(fdPts);
  const blackDot = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24).rotateX(-Math.PI / 2).scale(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0, depthWrite: false }));
  blackDot.position.copy(topP).setY(topP.y + 0.004); blackDot.userData.kind = "line"; asm.add(blackDot);

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
    const m = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), ripMat()); m.rotation.x = -Math.PI / 2; m.position.y = fy + 0.005; m.renderOrder = 1; m.userData.kind = "glow"; world.add(m); return m;
  });

  /* the contact shadow: the floor under the base takes only shadows (the satellite on it, the stack's), fading out round its centre */
  const shadowMat = new THREE.ShadowMaterial({ color: 0x2a2620, opacity: 0.05, depthWrite: false });
  shadowMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vFl;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvFl = position.xy;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec2 vFl;")
      .replace("gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );", "gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) * (1.0 - smoothstep(4.0, 9.0, length(vFl))) );");
  };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), shadowMat);
  floor.rotation.x = -Math.PI / 2; floor.position.y = fy; floor.receiveShadow = !lite; floor.userData.kind = "shadow"; floor.renderOrder = 0;
  asm.add(floor);
  // only the solids cast (the white plates, the cubes); the glass's shadow would be a solid block
  for (const pl of plates) if (pl.glass) pl.p.g.traverse((o) => { o.castShadow = false; });
  column.g.traverse((o) => { o.castShadow = false; });

  /* the seal: one cube (the gathered stack, then green) that flies to the h1's square */
  const sealMat = new THREE.MeshPhysicalMaterial({ color: "#e9f8f1", emissive: GREEN, emissiveIntensity: 0, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.2, transparent: true, opacity: 0 });
  const seal = new THREE.Mesh(new RoundedBoxGeometry(1, 1, 1, 3, 0.05), sealMat); seal.userData.kind = "seal"; seal.renderOrder = 12;
  const sealLineMat = lib.line();
  const slg = new LineSegmentsGeometry(); { const e = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)); slg.setPositions(Array.from(e.attributes.position.array)); e.dispose(); }
  const sealLine = new LineSegments2(slg, sealLineMat); sealLine.userData.kind = "line"; sealLine.renderOrder = 13; seal.add(sealLine);
  seal.visible = false; world.add(seal);

  /* the bloom's look: whites black (they hide what's behind them but never glow), lines / the floor hidden, green parts their bright twins, the
     glass and the perforations their own green light only */
  const black = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const cubeBloom = new THREE.MeshBasicMaterial({ color: GREEN });
  const sealBloom = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true });
  const occ: THREE.Mesh[] = [], hidden: THREE.Object3D[] = [], swap: [THREE.Mesh, THREE.Material][] = [], glassMats: THREE.ShaderMaterial[] = [];
  const perfU = plates.filter((p) => p.perf).map((p) => p.perf!);
  world.traverse((o) => {
    const k = o.userData.kind as string | undefined, mesh = o as THREE.Mesh;
    if (k === "white" || k === "dim") occ.push(mesh);
    else if (k === "line" || k === "shadow") hidden.push(o);
    else if (k === "green") swap.push([mesh, cubeBloom]);
    else if (k === "seal") swap.push([mesh, sealBloom]);
    else if (k === "glass" || k === "column") glassMats.push(mesh.material as THREE.ShaderMaterial);
  });
  const saved: THREE.Material[] = [], savedVis: boolean[] = [];
  const bloomScene = () => {
    let i = 0;
    for (const o of occ) { saved[i++] = o.material as THREE.Material; o.material = black; }
    for (const [o, b] of swap) { saved[i++] = o.material as THREE.Material; o.material = b; }
    hidden.forEach((o, j) => { savedVis[j] = o.visible; o.visible = false; });
    for (const m of glassMats) { m.uniforms.uBloom.value = 1; m.blending = THREE.AdditiveBlending; }
    for (const u of perfU) u.uBl.value = 1;
    const env = scene.environment; scene.environment = null;
    return () => {
      let j = 0;
      for (const o of occ) o.material = saved[j++];
      for (const [o] of swap) o.material = saved[j++];
      hidden.forEach((o, k) => { o.visible = savedVis[k]; });
      for (const m of glassMats) { m.uniforms.uBloom.value = 0; m.blending = THREE.NormalBlending; }
      for (const u of perfU) u.uBl.value = 0;
      scene.environment = env;
    };
  };
  const fx = post(renderer, scene, camera, { lite });

  /* the fit: the canvas covers the hero; at rest the drawing sits in .hp__art at the reference's scale (the spread ≈ 75 % of the art's width, ≈ 60 %
     of its height at most), its middle at 52 % of the hero's height */
  let W = 1, H = 1, restH = 20, cx = 0, cy = 0, artTop = 0;
  let raf = 0;
  const fit = () => {
    const hr = hp.getBoundingClientRect(), ar = art.getBoundingClientRect();
    W = Math.max(1, Math.round(hr.width)); H = Math.max(1, Math.round(hr.height));
    Object.assign(wrap.style, { left: `${hr.left - ar.left}px`, top: `${hr.top - ar.top}px`, width: `${W}px`, height: `${H}px`, right: "auto", bottom: "auto" });
    const ax = ar.left - hr.left, ay = ar.top - hr.top, aw = Math.max(1, ar.width), ah = Math.max(1, ar.height);
    renderer.setSize(W, H, false);
    fx.setSize(pr);
    camera.aspect = W / H;
    const s = lite ? Math.min((aw * 0.86) / SPAN_W, (ah * 0.8) / SPAN_H) : Math.min((aw * 0.7545) / SPAN_W, (ah * 0.6) / SPAN_H);
    restH = H / s / PX;
    cx = ax + aw / 2; cy = ay + ah * (lite ? 0.5 : 0.52); artTop = ay;
    for (const l of lib.lines) l.resolution.set(W, H);
    fdMat.uniforms.uSize.value = Math.max(2.5, s * 13 * pr);
    fx.comp.mat.uniforms.uC.value.set(cx / W, 1 - cy / H);
    if (rm || !raf) draw();
  };

  /* the camera: round the target by az / el, the view `vh` tall (whole canvas) through the target, seen with fov, offset so the target sits at (cx, cy) */
  const setCam = (az: number, el: number, fov: number, vh: number) => {
    const d = vh / 2 / Math.tan(fov / 2);
    camera.fov = THREE.MathUtils.radToDeg(fov);
    camera.near = Math.max(0.05, d - 80); camera.far = d + 100;
    camera.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d).add(target);
    camera.up.set(0, 1, 0); camera.lookAt(target);
    camera.setViewOffset(W, H, W / 2 - cx, H / 2 - cy, W, H);
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    return d;
  };
  /* the long guides stop at the art box's top (on phones the copy sits above it): a plane square to the screen through that edge; the axis's height
     there (the proof runs up to it) */
  const clipTop = new THREE.Plane();
  for (const g of [axis, topLine]) g.m.clippingPlanes = [clipTop];
  proofTr.m.clippingPlanes = [clipTop];
  const up = new THREE.Vector3(), tv = new THREE.Vector3();
  let topY = 20;
  const setClip = () => {
    up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    tv.set(0, 1 - (artTop / H) * 2 + 0.002, 0.5).unproject(camera); clipTop.set(up.clone().negate(), up.dot(tv));
    const a = tv.set(0, 0, 0).project(camera).y, b = tv.set(0, 1, 0).project(camera).y;
    topY = ((1 - (artTop / H) * 2) - a) / (b - a);
  };

  /* state */
  let prog = 0, shown = 0, t = 0, loopT = 0, lastOpacity = "";
  const T0 = rm ? 0 : Math.max(0, 0.2 - performance.now() / 1000);
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), dims = new THREE.Vector3(), q0 = new THREE.Quaternion();
  const sealC0 = new THREE.Color("#e9f8f1"), cubeC0 = new THREE.Color("#7fe8c2"), cubeHot = new THREE.Color("#2fe3a0");
  const sqPx = { x: 0, y: 0, s: 10 };
  const readSq = () => {
    const sq = els.sq; if (!sq) { sqPx.x = W * 0.45; sqPx.y = H * 0.4; sqPx.s = 12; return; }
    const r = sq.getBoundingClientRect(), hr = hp.getBoundingClientRect();
    sqPx.x = r.left - hr.left + r.width / 2; sqPx.y = r.top - hr.top + r.height / 2; sqPx.s = r.width;
  };
  // the crossing: when the light reaches each level (s into the cycle), bottom to top: base, A4, A3, (column), A2, A1
  const CROSS = [2.0, 2.4, 2.85, 3.5, 3.95];

  const place = () => {
    const p = rm ? 0 : shown;
    const ti = rm ? 99 : t - T0;
    const L = rm ? 0 : smooth(1.6, 2.3, ti);
    const phi = loopT % CYCLE;
    U.uT.value = loopT + Math.max(0, ti) * 0.5;
    dat.update(rm ? 3 : U.uT.value);

    /* the loop's beats */
    const inflow = bump(phi, 0, 0.35, 1.7, 2.1) * L;
    const crossing = bump(phi, 1.85, 2.15, 4.3, 4.7) * L;
    const charge = bump(phi, 4.35, 4.85, 5.3, 6.0) * L;
    const release = bump(phi, 5.45, 5.75, 7.2, 7.9) * L;
    const ex = 1 - smooth(0, 0.12, p);

    /* the exit's phases */
    const cg = sineIO(p / 0.42), cs = sineIO((p - 0.44) / 0.16);
    const s1 = sineIO((p - 0.44) / 0.12);                        // compress into the cube
    const s2 = p2IO((p - 0.555) / 0.225);                        // the cube's flight
    const land = bump(p, 0.74, 0.785, 0.8, 0.88);

    /* the camera */
    const ci = rm ? 1 : outExpo((ti + 0.05) / 1.55);
    const drift = L * ex;
    target.set(0, MID_Y, 0);
    const az = Math.PI / 4 - 0.18 * (1 - ci) + Math.sin((loopT / 16) * Math.PI * 2) * 0.0175 * drift + 0.18 * cg * (1 - cs);
    const el = ISO_EL + 0.06 * (1 - ci) + Math.sin((loopT / 16) * Math.PI * 2 + 1.3) * 0.008 * drift - 0.05 * cg * (1 - cs);
    const lf = Math.log(REST_FOV), lw = Math.log(THREE.MathUtils.degToRad(11));
    const fov = Math.exp(lerp(lf, lw, Math.max(1 - ci, cg * (1 - cs) * 0.8)));
    const vh = restH * (1 - 0.1 * (1 - ci)) * (1 - 0.2 * cg);
    setCam(az, el, fov, vh);
    setClip();

    key.position.copy(KEY).multiplyScalar(18).add(tmp.set(0, 4, 0)); key.target.position.set(0, 4, 0);
    const ra = loopT * 0.12 + 2.4;
    rim.position.set(Math.cos(ra) * -0.8, 0.45, Math.sin(ra) * -0.8);
    rim.intensity = 0.2 * Math.PI * (0.6 + 0.4 * Math.sin(loopT * 0.21));

    /* the settle: one pulse of light up through the glass as the intro ends (level k at 1.25 + 0.14 k s) */
    const settleAt = (k: number) => (rm ? 0 : gauss(ti, 1.25 + k * 0.14, 0.15));

    /* the plates: settle down onto their places, bottom to top; at the exit they close together like lids round the middle, tipping as they come */
    const nP = plates.length;
    for (const pl of plates) {
      const dl = 0.05 + pl.i * 0.06;
      const a = rm ? 1 : outExpo((ti - dl) / 0.95);
      pl.p.fade(rm ? 1 : outQuart((ti - dl) / 0.5));
      const e = sineIO((p - 0.02 - Math.abs(pl.i - 2) * 0.03) / 0.38);
      const yc = pl.p.c.y, tgtY = CEN.y + (pl.i - (nP - 1) / 2) * 0.3;
      const tgtS = pl.i === 0 ? 0.36 : 0.42;
      const sc = lerp(lerp(0.97, 1, a), tgtS, e);
      const y = lerp(yc + (1 - a) * (0.45 + pl.i * 0.06), tgtY, e);
      pl.p.g.scale.set(sc, lerp(1, 1.4, e), sc);
      pl.p.g.position.set(0, y - yc * pl.p.g.scale.y, 0);
      const tip = Math.sin(Math.PI * e) * 0.16 * (pl.i % 2 ? 1 : -1);
      pl.p.g.rotation.set(tip * 0.7, 0, -tip * 0.7);
      // the crossing: the light reaches this level, spreads from the middle out to the rim in 0.9 s
      const t0 = CROSS[pl.i], w = clamp((phi - t0) / 0.9);
      const sW = clamp((ti - (1.2 + pl.i * 0.14)) / 0.6);
      const lc = crossing * Math.sin(Math.PI * w) * ex, ls = settleAt(pl.i) * 0.9;
      const lit = Math.max(lc, ls) + gauss(p, 0.42, 0.03) * 0.6;
      const wave = lerp(0.2, pl.d.half + 0.4, lc >= ls ? w : sW);
      if (pl.glass) {
        pl.glass.uniforms.uLit.value = lit; pl.glass.uniforms.uWave.value = wave;
        pl.glass.uniforms.uBand.value = pl.i === 0 ? inflow * 0.55 * ex * (0.5 + 0.5 * Math.sin(phi * 2.2)) : 0;
      }
      if (pl.perf) { pl.perf.uLit.value = lit; pl.perf.uWave.value = wave; }
    }

    /* the column: rises into the plates (intro); its glow drifts up, a pulse runs up it as the light crosses; at the exit it retracts into the middle */
    {
      const a = rm ? 1 : outExpo((ti - 0.22) / 0.95);
      column.fade(rm ? 1 : outQuart((ti - 0.22) / 0.5));
      const e = sineIO((p - 0.02) / 0.34);
      const yc = (COLUMN.y0 + COLUMN.y1) / 2;
      const sy = lerp(lerp(0.85, 1, a), 0.12, e), sxz = lerp(1, 0.6, e);
      const cyy = lerp(yc - (1 - a) * 0.5, CEN.y, e);
      column.g.scale.set(sxz, sy, sxz);
      column.g.position.set(0, cyy - yc * sy, 0);
      const pu = clamp((phi - 2.85) / 1.1);
      U.uPulseY.value = lerp(COLUMN.y0, COLUMN.y1 + 0.4, pu);
      U.uPulse.value = crossing * Math.sin(Math.PI * pu) * ex + settleAt(2.5) * 0.6;
      colMat.uniforms.uFlow.value = 0.6;
    }
    /* the deep glass's glow: up on the charge */
    U.uGlow.value = (0.3 + charge * 0.9 + settleAt(4) * 0.8 + crossing * 0.2) * (rm ? 1 : outQuart((ti - 0.3) / 0.8));

    /* the cube: lands on the top sheet last; charges (brightens, lifts a hair); at the exit comes down onto the gathered stack */
    {
      const a = rm ? 1 : outExpo((ti - 0.36) / 0.9);
      cube.fade(rm ? 1 : outQuart((ti - 0.36) / 0.45));
      const e = sineIO((p - 0.03) / 0.38);
      const restY = (1 - a) * 0.6 + charge * 0.08 + Math.sin((phi / CYCLE) * Math.PI * 2) * 0.012 * L;
      // it rides the top sheet down onto the gathered stack (its foot on the sheet's top, wherever the sheet is)
      const sc = lerp(1, 0.55, e);
      const a1 = plates[plates.length - 1], a1Top = a1.p.g.position.y + a1.d.y1 * a1.p.g.scale.y;
      const cyy = a1Top + (CUBE.y0 - a1.d.y1) * (1 - e) + (CUBE.s * sc) / 2 + restY * (1 - e);
      cube.g.scale.setScalar(sc);
      cube.g.position.set(0, cyy - (CUBE.y0 + CUBE.s / 2) * sc, 0);
      const hot = charge * 1.0 + settleAt(5) * 0.7 + release * 0.4 * gauss(phi, 5.7, 0.4) + gauss(p, 0.42, 0.03);
      cubeMat.color.copy(cubeC0).lerp(cubeHot, clamp(hot * 0.6));
      cubeMat.emissiveIntensity = 0.04 + hot * 0.45;
      cubeBloom.color.copy(GREEN).multiplyScalar(0.04 + hot * 0.5);
      cubeL.position.set(0, cyy, 0);
      cubeL.intensity = hot * 2.2 * ex;
      halo.position.set(0, cyy, 0);
      (halo.material as THREE.SpriteMaterial).opacity = (charge * 0.32 + settleAt(5) * 0.2) * ex;
      halo.scale.setScalar(3.4 * (1 + charge * 0.2));
    }
    /* the base's cube: with the base; at the exit it slides in under the gathered stack */
    {
      const a = rm ? 1 : outExpo((ti - 0.1) / 0.9);
      baseCube.fade(rm ? 1 : outQuart((ti - 0.1) / 0.45) * (1 - smooth(0.3, 0.42, p)));
      const e = sineIO((p - 0.03) / 0.36);
      tmp.set(0, (1 - a) * 0.35, 0).lerp(tmp2.set(-BASE_CUBE.at, CEN.y - 0.9 - PLATES[0].y1, -BASE_CUBE.at), e);
      const sc = lerp(1, 0.4, e);
      baseCube.g.scale.setScalar(sc);
      const c0 = baseCube.c;
      baseCube.g.position.set(tmp.x + c0.x * (1 - sc), tmp.y + c0.y * (1 - sc), tmp.z + c0.z * (1 - sc));
    }

    /* the satellites: settle along their feed lines (intro); rise in turn (release); fly in along their lines, then into the middle (exit) */
    sats.forEach((s, i) => {
      const dl = 0.55 + i * 0.05;
      const a = rm ? 1 : outExpo((ti - dl) / 0.85);
      const e = sineIO((p - 0.02 - i * 0.02) / 0.3);
      s.p.fade((rm ? 1 : outQuart((ti - dl) / 0.45)) * (1 - smooth(0.85, 1, e)));
      const bob = Math.sin((phi / CYCLE) * Math.PI * 2 + i * 1.3) * 0.03 * L;
      const rise = Math.sin(Math.PI * clamp((phi - 5.75 - i * 0.18) / 1.1)) * 0.22 * L;
      tmp.copy(s.base).addScaledVector(s.dir, -0.7 * (1 - a)); tmp.y += bob + rise;
      // along the line to the plate's edge, then in to the middle
      const e1 = clamp(e / 0.6), e2 = clamp((e - 0.6) / 0.4);
      tmp.lerp(tmp2.copy(s.to).addScaledVector(s.dir, -0.2), sineIO(e1));
      tmp.lerp(CEN, sineIO(e2));
      s.p.g.position.copy(tmp);
      s.p.g.scale.setScalar(lerp(1, 0.35, e));
      s.p.g.rotation.y = e * s.spin;
      // the inflow: a packet runs in along the feed line (staggered), a glow at its head
      const ph = clamp((phi - 0.1 - i * 0.28) / 1.2);
      const tr = inTr[i];
      const len = tr.len, dash = 0.7;
      tr.m.dashOffset = -(lerp(-dash, len, sineIO(ph)));
      const on = inflow * ex * Math.sin(Math.PI * ph);
      tr.m.opacity = on * 0.95;
      tr.l.visible = on > 0.01;
      const pk = packets[i];
      pk.position.lerpVectors(s.from, s.to, clamp(sineIO(ph) + 0.0));
      (pk.material as THREE.SpriteMaterial).opacity = on * 0.4;
      pk.visible = on > 0.01;
    });

    /* the proof: one green dash leaves the cube up the axis, off the art's top edge; the settle sends one too */
    {
      const pu = clamp((phi - 5.6) / 1.5);
      const top = Math.max(CUBE.y0 + 3, topY + 1);
      const len = top - (CUBE.y0 + CUBE.s);
      const yH = lerp(CUBE.y0 + CUBE.s, top, Math.pow(pu, 1.3));
      const a = release * ex * smooth(0, 0.06, pu) * (1 - smooth(0.88, 1, pu));
      if (Math.abs(top - proofTop.y) > 0.01) { proofTop.y = top; proofTr.l.geometry.setPositions([0, CUBE.y0 + CUBE.s, 0, 0, top, 0]); proofTr.l.computeLineDistances(); }
      proofTr.m.dashOffset = -((yH - (CUBE.y0 + CUBE.s)) - 1.4);
      proofTr.m.opacity = a; proofTr.l.visible = a > 0.01 && len > 0;
      proof.position.set(0, yH, 0);
      (proof.material as THREE.SpriteMaterial).opacity = a * 0.6;
      proof.visible = a > 0.01;
    }

    /* the guides: draw on (intro); dashes flow; at the exit they draw in toward the middle and go */
    const ge = sineIO((p - 0.01) / 0.32);
    guides.scale.set(lerp(1, 0.35, ge), lerp(1, 0.3, ge), lerp(1, 0.35, ge));
    guides.position.copy(CEN).multiplyScalar(1).multiply(tmp.set(1 - guides.scale.x, 1 - guides.scale.y, 1 - guides.scale.z));
    for (const g of gl) {
      const on = rm ? 1 : outQuart((ti - g.dl) / 0.6);
      g.m.opacity = g.k * on * (1 - smooth(0.05, 0.3, p));
      if (g.m.dashed) g.m.dashOffset = -loopT * 0.06 * L;
      g.l.visible = g.m.opacity > 0.003;
    }
    fdMat.uniforms.uA.value = 0.45 * (rm ? 1 : outQuart((ti - 0.4) / 0.6)) * (1 - smooth(0.05, 0.3, p));
    (blackDot.material as THREE.MeshBasicMaterial).opacity = plates[3].p.opacity;

    /* the ripples (release) */
    ripples.forEach((r, i) => {
      const u = clamp((phi - 5.6 - i * 0.35) / 1.9);
      const m = r.material as THREE.ShaderMaterial;
      m.uniforms.uR.value = lerp(3.3, FLOOR.half + 0.9, outQuart(u));
      m.uniforms.uA.value = release * ex * Math.sin(Math.PI * u) * (1 - u * 0.5) * (i ? 0.16 : 0.28);
      r.visible = m.uniforms.uA.value > 0.005;
    });
    shadowMat.opacity = 0.05 * plates[0].p.opacity * (1 - cg);

    /* the seal: everything gathered compresses into the middle; a cube appears there, turns green, flies to the h1's square */
    const f = Math.max(0.0001, 1 - 0.88 * s1);
    asm.scale.setScalar(f); asm.position.copy(CEN).multiplyScalar(1 - f);
    asm.visible = s1 < 0.995 && p < 0.99;
    seal.visible = s1 > 0.001 && p < 0.9;
    if (seal.visible) {
      readSq();
      dims.set(lerp(2.4, 1.5, s1), lerp(1.9, 1.5, s1), lerp(2.4, 1.5, s1));
      tmp.copy(CEN).project(camera);
      const x0 = (tmp.x * 0.5 + 0.5) * W, y0 = (-tmp.y * 0.5 + 0.5) * H, z0 = tmp.z;
      const px = lerp(x0, sqPx.x, s2), py = lerp(y0, sqPx.y, s2) - Math.sin(Math.PI * s2) * H * 0.07;
      seal.position.set((px / W) * 2 - 1, 1 - (py / H) * 2, z0).unproject(camera);
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
      sealBloom.color.copy(GREEN).multiplyScalar(g * 0.45 * (1 - s2 * 0.5) + land * 0.8); sealBloom.opacity = so;
    }
    flash.visible = land > 0.01;
    if (flash.visible) {
      flash.position.copy(seal.position);
      const ppu = seal.scale.x > 0 ? sqPx.s / seal.scale.x : 1;
      flash.scale.setScalar((sqPx.s * 5) / Math.max(1e-4, ppu) * (0.7 + land * 0.5));
      (flash.material as THREE.SpriteMaterial).opacity = land * 0.6;
    }

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
      [black, cubeBloom, sealBloom, ...lib.lines].forEach((m) => m.dispose());
      glowTex.dispose(); U.uNoise.value.dispose(); envRT.dispose(); fx.dispose(); dat.dispose();
      renderer.dispose(); renderer.forceContextLoss();
    },
  };
}
