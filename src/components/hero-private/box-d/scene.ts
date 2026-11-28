// Hero study "Box D", "privacy through glass": the exploded glass box (Figma node 1120:8316) in three.js, after Pillar D (../pillar-d: its diffusion,
// look, framing, choreography and scroll), telling "NEAR encrypts your prompts and transactions". The box is the vault; glass is the privacy boundary:
//   · data is ASCII (monospace characters, ink): on the back frames' sheets (the data walls) rows of it drift in toward the core, and in the loop short
//     streams of it run in from outside through the four ports (the plates' holes, the side panels' holes) to the four small cubes and on into the core;
//   · what lies between a character and the eye decides how it reads: nothing, sharp; the plates or the side panels (frosted), soft; the core (deep
//     glass), only a green glow. So at a glance: legible outside, soft behind the glass, light in the core;
//   · the central cube computes unseen (it turns green inside), and only one green proof leaves, up through the top plate's hole and the guide.
// The diffusion is /hero-h's: the data's picture is drawn sharp each frame and blurred to two levels (./glass.ts). Geometry: ./box.ts; look and post:
// ./fx.ts. At rest it reads as the Figma drawing (paper ground #F5F5F5, mint glass, white cubes in the drawing's greys, 1.3 px ink outlines) in its
// isometric (a perspective camera whose field of view at rest is a third of a degree). The canvas covers the whole hero (.hp) so nothing is ever
// clipped by a box; the camera is offset so at rest the drawing sits in .hp__art.
//   1 · Intro (≈1.8 s, fast and soft): one wave. The camera eases in from a short, slightly turned perspective; the core first (its frame, the cube
//       rising into it), the back frames and the side panels slide in along their normals, the plates settle down and up onto their places, the
//       small cubes along their lines, the guides draw on, the data fades up on the walls. Short distances, expo ease-out, 40–60 ms staggers. The
//       settle: one pulse of light through the glass (a wave out over the plates and panels, a light round the core's frame).
//   2 · Loop (one 8 s master cycle, the story of a private prompt): 0–2 s INFLOW, four streams of characters run in through the ports (sharp outside,
//       soft once behind the glass) to the small cubes, which flash as they pass; 2–4.5 s CROSSING, the streams go on into the core and dissolve into
//       green light, a light runs round the core's frame, a wave crosses the glass; 4.5–5.5 s CHARGE, the central cube turns green inside (caustics,
//       a halo), lifts a hair; 5.5–8 s RELEASE, one green proof rises from the cube up the rod, through the top cube and the top plate's hole, up the
//       guide to its dot (which lights: received) and on to the top edge; a pulse runs out along the guides, the small cubes rise and settle in turn.
//       Underneath: the walls' rows drift in, the characters re-roll, a 1° camera drift.
//   3 · Exit, "seal" (setProgress 0 → 1 over the hero's hold): 0–0.45 GATHER, the box assembles: the side panels slide in over the core's front
//       faces, the back frames behind it, the plates close on it like lids (tipping as they swing in), the small cubes fly in along their lines, the
//       guides draw back, the floor closes in; the data goes dark (sealed); 0.45–0.8 SEAL, the closed box compresses into one cube that turns green,
//       travels and shrinks onto the h1's green square (.hp__sq) and lands on it with a soft flash; 0.8–1, only the h1's own square remains. Reversible.
// Intro and scroll compose. Runs only on screen with the tab visible; DPR ≤ 2; small screens drop shadows; reduced motion: a still frame that fades
// as the page scrolls.
import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { BACK, BOT, CORE, CUBE, DISCS, FLOOR, LEFT, PORTS, RIGHT, SMALL, SMALLS, TOP, buildBack, buildCoreFrame, buildCube, buildSlab, guides, type Piece, type Slab } from "./box";
import { glowTexture, library, post, uniforms } from "./fx";
import { CELL, coverUniforms, data, tapeGeometry, tapeMaterial } from "./glass";

export type BoxScene = { setProgress(p: number): void; dispose(): void };
export type Els = { hp: HTMLElement; art: HTMLElement; wrap: HTMLElement; sq: HTMLElement | null };

const PX = 100 / Math.sqrt(2 / 3);              // drawing px per camera unit
const ISO_EL = Math.atan(1 / Math.SQRT2);       // true isometric: 35.26° down, 45° round
const REST_FOV = THREE.MathUtils.degToRad(0.35);
const ART_W = 1707;                             // the drawing's width (px): it fills .hp__art's width
const AIM = new THREE.Vector3(0, -0.274, 0);    // the world point at the drawing's centre (853.5, 907)
const CYCLE = 8;                                // the loop's master cycle, s
const LOOP_AT = 1.75;                           // the loop's clock starts
const CEN = new THREE.Vector3(0, 0.17, 0);      // the assembled box's centre: everything seals there
const SEAL = 1.9;                               // the assembled box's half side

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
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export function mount(canvas: HTMLCanvasElement, els: Els, opts: { reduced: boolean }): BoxScene {
  const rm = opts.reduced;
  const { hp, art, wrap } = els;
  const lite = Math.min(window.innerWidth, window.screen?.width || 9999) < 1000;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, stencil: false, powerPreference: "high-performance" });
  const pr = Math.min(devicePixelRatio || 1, lite ? 1.75 : 2);
  renderer.setPixelRatio(pr);
  renderer.setClearColor("#f5f5f5", 1);
  renderer.toneMapping = THREE.NoToneMapping;
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
    key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.025;
    const sc = key.shadow.camera; sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.near = 1; sc.far = 50; sc.updateProjectionMatrix();
  }
  const fill = new THREE.DirectionalLight(0xffffff, 0.38 * Math.PI); fill.position.set(-0.55, -0.6, -0.58); scene.add(fill, fill.target);
  const rim = new THREE.DirectionalLight(0xeaf6ff, 0.2 * Math.PI); scene.add(rim, rim.target);
  const GREEN = new THREE.Color("#00dc8d");
  const coreL = new THREE.PointLight(GREEN, 0, 5, 2); world.add(coreL);
  const proofL = lite ? null : new THREE.PointLight(GREEN, 0, 4, 2);
  if (proofL) world.add(proofL);

  /* the data's pictures, the shared uniforms, the material library */
  const U = uniforms();
  const dat = data(renderer, lite);
  const cover = coverUniforms();
  const lib = library(U, dat, cover);
  const pieces: Piece[] = [];
  const keep = <T extends Piece>(p: T, parent: THREE.Object3D = asm) => { pieces.push(p); parent.add(p.g); return p; };

  /* the core: its frame, the central cube */
  const core = keep(buildCoreFrame(lib));
  const cube = keep(buildCube(lib, CUBE, V(0, 0, 0), "core"));
  const cubeMat = cube.mat<THREE.MeshStandardMaterial>("core")!;
  cubeMat.emissive = GREEN.clone(); cubeMat.emissiveIntensity = 0;

  /* the slabs: plates and side panels */
  const slab = (s: Slab, collar: number, dots: number, dotOff: number, trace: boolean, i: number) => {
    const p = keep(buildSlab(lib, s, collar));
    const m = p.mat<THREE.ShaderMaterial>("slab")!;
    const a = s.axis === 0 ? 2 : 0, b = s.axis === 1 ? 2 : 1;
    m.uniforms.uAxis.value = s.axis; m.uniforms.uHalf.value.copy(s.h);
    m.uniforms.uHole.value.set(s.hole[0] - s.c.getComponent(a), s.hole[1] - s.c.getComponent(b), s.hole[2]);
    m.uniforms.uDots.value = dots; m.uniforms.uDotOff.value.set(dotOff, dotOff); m.uniforms.uTrace.value = trace ? 1 : 0;
    m.uniforms.uWorldC.value.copy(CEN);
    return { p, m, s, i };
  };
  const top = slab(TOP, 0.25, 0.675, 0.3375, false, 0);
  const bot = slab(BOT, 0, 0.675, 0, true, 1);
  const left = slab(LEFT, 0, 0, 0, false, 2);
  const right = slab(RIGHT, 0, 0, 0, false, 3);
  const slabs = [top, bot, left, right];
  for (const sl of [bot, left, right]) sl.p.g.traverse((o) => { if ((o as THREE.Mesh).isMesh && o.userData.kind === "slab") o.castShadow = !lite; });

  /* the back frames and their data walls */
  const backs = ([0, 1] as const).map((side) => {
    const b = buildBack(lib, side);
    keep(b.p);
    const wm = b.wall.material as THREE.ShaderMaterial;
    wm.uniforms.uSide.value = side; wm.uniforms.uY0.value = b.p.c.y;
    return { ...b, wm };
  });

  /* the four small cubes: top, bottom, left, right */
  const smalls = SMALLS.map((at, i) => {
    const p = keep(buildCube(lib, SMALL, at));
    const m = p.mat<THREE.MeshStandardMaterial>("white")!; m.emissive = GREEN.clone(); m.emissiveIntensity = 0;
    // along its line: in from outside (the port's side)
    const out = PORTS[i].clone().sub(at).normalize();
    return { p, m, at, out, i };
  });

  /* the shadow catchers: the floor (under the bottom plate) and the bottom plate's top (under the core) */
  const catcher = (size: number, fadeR: number, op: number) => {
    const m = new THREE.ShadowMaterial({ color: 0x23302a, opacity: op, depthWrite: false });
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vFl;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvFl = position.xy;");
      sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec2 vFl;")
        .replace("gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );", `gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) * (1.0 - smoothstep(${(fadeR * 0.55).toFixed(2)}, ${fadeR.toFixed(2)}, length(vFl))) );`);
    };
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), m);
    mesh.rotation.x = -Math.PI / 2; mesh.receiveShadow = !lite; mesh.userData.kind = "shadow"; mesh.renderOrder = 0;
    return mesh;
  };
  const floorShadow = catcher(14, 6.5, 0.09); floorShadow.position.y = FLOOR.y + 0.003;
  const plateShadow = catcher(6.5, 3.4, 0.07); plateShadow.position.y = BOT.h.y + 0.004; bot.p.g.add(plateShadow);

  /* the floor: its outline (grey), its discs; the guides and the floor's dots are one point cloud (below) */
  const floorG = new THREE.Group(); floorG.position.set(0, FLOOR.y, 0); world.add(floorG);
  const floorLine = new LineMaterial({ color: 0x524e48, linewidth: 1, transparent: true, opacity: 0.45, depthWrite: false });
  {
    const H = FLOOR.h, c = [V(-H, 0, -H), V(H, 0, -H), V(H, 0, H), V(-H, 0, H)], segs: number[] = [];
    for (let i = 0; i < 4; i++) segs.push(...c[i].toArray(), ...c[(i + 1) % 4].toArray());
    const g = new LineSegmentsGeometry(); g.setPositions(segs);
    const l = new LineSegments2(g, floorLine); l.userData.kind = "line"; l.renderOrder = 1; floorG.add(l);
  }
  const discMat = new THREE.MeshBasicMaterial({ color: "#111111", transparent: true, depthWrite: false });
  for (const d of DISCS) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24).rotateX(-Math.PI / 2), discMat);
    m.position.set(d.x, 0.004, d.z); m.userData.kind = "disc"; m.renderOrder = 2; floorG.add(m);
  }
  floorG.add(floorShadow); floorShadow.position.y = 0.003;

  /* the streams: four tapes, each from outside through its port to its small cube and on into the core */
  const R = V(1, 0, -1).normalize();               // across a vertical tape: the screen's horizontal
  const lat = (i: number) => {
    const H = PORTS[i], D = SMALLS[i], d = D.clone().sub(H);
    const inside = i === 2 ? V(D.x, D.y, 0.95) : V(0.95, D.y, D.z);
    return [H.clone().addScaledVector(d, -1.35), H, D, inside];
  };
  const tapeDefs = [
    { pts: [V(0, 9.4, 0), V(0, 6.08, 0), SMALLS[0], V(0, 0.95, 0)], across: R, vert: true, flip: false },
    { pts: [V(1.77, -7.3, 1.77), V(1.77, -3.72, 1.77), SMALLS[1], V(1.77, -0.7, 1.77)], across: R, vert: true, flip: false },
    { pts: lat(2), across: null, vert: false, flip: false },
    { pts: lat(3), across: null, vert: false, flip: true },
  ];
  const tapes = tapeDefs.map((td, i) => {
    const { geo, len } = tapeGeometry(td.pts, td.across);
    const m = tapeMaterial(dat, cover, { uT: U.uT, uGlow: U.uGlow }, { vert: td.vert, flip: td.flip, row: i, col: [3, 17, 9, 25][i], end: len });
    m.uniforms.uLen.value = td.vert ? 6 : 7;
    const mesh = new THREE.Mesh(geo, m); mesh.renderOrder = 12; mesh.frustumCulled = false; mesh.userData.kind = "tape"; world.add(mesh);
    // where along it (cells) its small cube sits
    let s = 0, sAt = 0;
    for (let k = 1; k < td.pts.length; k++) { s += td.pts[k].distanceTo(td.pts[k - 1]) / CELL; if (td.pts[k] === SMALLS[i]) sAt = s; }
    return { mesh, m, len, sAt, i };
  });

  /* the glows: the cube's halo, the proof, the receiver's ring, the landing flash */
  const glowTex = glowTexture();
  const sprite = (scale: number, order: number, depthTest = true) => {
    const m = new THREE.SpriteMaterial({ map: glowTex, color: GREEN, transparent: true, opacity: 0, depthWrite: false, depthTest });
    const s = new THREE.Sprite(m); s.scale.setScalar(scale); s.renderOrder = order; s.userData.kind = "glow"; return s;
  };
  const halo = sprite(3.2, 7); asm.add(halo);
  const proof = sprite(0.8, 13, false); world.add(proof);
  const recv = sprite(0.9, 13, false); recv.position.set(0, 7.363, 0); world.add(recv);
  const flash = sprite(1, 14, false); world.add(flash);

  /* the guides and the floor's dots: one point cloud */
  const dl = guides();
  type Pt = { a: THREE.Vector3; b: THREE.Vector3; s: number; step: number; d: number; k: number; r: number };
  const pts: Pt[] = [];
  dl.forEach((g, r) => {
    const step = g.n > 1 ? 1 / (g.n - 1) : 1;
    for (let i = 0; i < g.n; i++) pts.push({ a: g.a, b: g.b, s: g.n > 1 ? i * step : 1, step, d: 0.55 + (r / dl.length) * 0.5, k: g.k, r: r / (dl.length - 1) });
  });
  const pg = new THREE.BufferGeometry();
  const f32 = (n: number, f: (p: Pt, o: Float32Array, i: number) => void) => { const o = new Float32Array(pts.length * n); pts.forEach((p, i) => f(p, o, i)); return new THREE.BufferAttribute(o, n); };
  pg.setAttribute("position", f32(3, (p, o, i) => o.set(p.b.toArray(), i * 3)));
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
      uIntro: { value: rm ? 99 : 0 }, uSize: { value: 0.3 }, uPhi: { value: 0 }, uRel: { value: 0 }, uP: { value: 0 }, uBloom: { value: 0 }, uArtL: { value: -2 },
      uRecvP: { value: V(0, 7.363, 0) }, uRecv: { value: 0 }, uProofY: { value: -99 }, uProof: { value: 0 },
    },
    vertexShader: /* glsl */ `uniform float uIntro, uSize, uPhi, uRel, uP, uArtL, uRecv, uProofY, uProof; uniform vec3 uRecvP;
      attribute vec3 aA, aB; attribute float aS, aStep, aD, aK, aR;
      varying float vA, vG, vK;
      void main(){
        // exit: a guide draws back to its anchor (a); a black dot shrinks there; a floor dot slides in to the floor's centre
        float ret = smoothstep(0.02 + aR * 0.1, 0.3 + aR * 0.1, uP);
        vec3 p = aK < 0.5 ? mix(aA, aB, min(aS, 1.0 - ret)) : mix(aB, aA, aK > 1.5 ? ret * 0.75 : 0.0);
        float on = smoothstep(aD + aS * 0.4, aD + aS * 0.4 + 0.14, uIntro);
        // release: a pulse runs out along each guide (from its anchor); the floor's dots ripple out from the centre
        float po = (uPhi - 5.7 - aR * 0.3) / 1.2;
        float g = aK < 0.5 ? exp(-pow((aS - po) * 6.0, 2.0)) * uRel * 0.7 : aK > 1.5 ? exp(-pow((length(aB.xz) / 6.5 - po) * 5.0, 2.0)) * uRel * 0.6 : 0.0;
        // the proof passing up the axis lights its dots; the receiver's dot turns green
        g = max(g, exp(-pow((p.y - uProofY) / 0.35, 2.0)) * uProof * step(length(p.xz), 0.01) * step(aK, 0.5));
        g = max(g, step(distance(aB, uRecvP), 0.01) * uRecv);
        vA = on * (1.0 - smoothstep(0.8, 1.0, ret)); vG = g; vK = aK;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        vA *= smoothstep(uArtL, uArtL + 0.08, gl_Position.x / gl_Position.w);   // the guides stop short of the copy
        float sz = aK < 0.5 ? 3.6 : aK < 1.5 ? 11.0 * (1.0 - ret * 0.6) : 9.0 * (1.0 - ret * 0.5);
        gl_PointSize = uSize * sz * (1.0 + g * (aK < 0.5 ? 1.0 : 0.3));
      }`,
    fragmentShader: /* glsl */ `uniform float uBloom; varying float vA, vG, vK;
      void main(){
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = smoothstep(1.0, 0.75, d) * vA * (vK < 0.5 ? 0.6 : vK < 1.5 ? 1.0 : 0.95);
        float gg = clamp(vG * 1.4, 0.0, 1.0);
        vec3 base = vK > 1.5 ? vec3(0.479, 0.449, 0.42) : vec3(0.0056);
        if (uBloom > 0.5) { a *= gg; if (a < 0.01) discard; gl_FragColor = vec4(vec3(0.0, 0.716, 0.266) * 1.4, a); return; }
        if (a < 0.01) discard;
        gl_FragColor = vec4(mix(base, vec3(0.0, 0.716, 0.266), gg), a);
      }`,
  });
  const dots = new THREE.Points(pg, dotMat); dots.frustumCulled = false; dots.renderOrder = 11; dots.userData.kind = "dots"; world.add(dots);

  /* the seal: one cube (the closed box, then green) that flies to the h1's square */
  const sealMat = new THREE.MeshPhysicalMaterial({ color: "#eef8f3", emissive: GREEN, emissiveIntensity: 0, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.2, transparent: true, opacity: 0 });
  const seal = new THREE.Mesh(new RoundedBoxGeometry(1, 1, 1, 3, 0.06), sealMat); seal.userData.kind = "seal"; seal.renderOrder = 15;
  const sealLineMat = lib.line();
  const slg = new LineSegmentsGeometry(); { const e = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)); slg.setPositions(Array.from(e.attributes.position.array)); e.dispose(); }
  const sealLine = new LineSegments2(slg, sealLineMat); sealLine.userData.kind = "line"; sealLine.renderOrder = 16; seal.add(sealLine);
  seal.visible = false; world.add(seal);

  /* the bloom's look: whites black (they hide what's behind them but never glow), lines / shadows / discs hidden, the glass and the data their own
     green light only, added */
  const black = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const sealBloom = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true });
  const occ: THREE.Mesh[] = [], hidden: THREE.Object3D[] = [], swap: [THREE.Mesh, THREE.Material][] = [], glassMats: THREE.ShaderMaterial[] = [];
  world.traverse((o) => {
    const k = o.userData.kind as string | undefined, mesh = o as THREE.Mesh;
    if (k === "white" || k === "core" || k === "ink") occ.push(mesh);
    else if (k === "line" || k === "shadow" || k === "disc") hidden.push(o);
    else if (k === "seal") swap.push([mesh, sealBloom]);
    else if (k === "slab" || k === "bar" || k === "gline" || k === "face" || k === "ghost" || k === "green" || k === "wall" || k === "tape") glassMats.push(mesh.material as THREE.ShaderMaterial);
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

  /* the fit: the canvas covers the hero; at rest the drawing fills .hp__art's width at the drawing's scale, its centre at the box's centre */
  let W = 1, H = 1, restH = 20, cx = 0, cy = 0;
  let raf = 0;
  const fit = () => {
    const hr = hp.getBoundingClientRect(), ar = art.getBoundingClientRect();
    W = Math.max(1, Math.round(hr.width)); H = Math.max(1, Math.round(hr.height));
    Object.assign(wrap.style, { left: `${hr.left - ar.left}px`, top: `${hr.top - ar.top}px`, width: `${W}px`, height: `${H}px`, right: "auto", bottom: "auto" });
    const ax = ar.left - hr.left, ay = ar.top - hr.top, aw = Math.max(1, ar.width), ah = Math.max(1, ar.height);
    renderer.setSize(W, H, false);
    fx.setSize(pr);
    camera.aspect = W / H;
    const s = aw / ART_W;
    restH = H / s / PX;
    cx = ax + aw / 2; cy = ay + ah / 2;
    dotMat.uniforms.uArtL.value = aw < W * 0.8 ? (ax / W) * 2 - 1 - 0.02 : -2;
    for (const l of [...lib.lines, floorLine]) l.resolution.set(W, H);
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
  /* the height (world, on the axis) of the canvas' top edge: the proof runs up to it */
  const tv = new THREE.Vector3();
  const topEdgeY = () => {
    const a = tv.set(0, 0, 0).project(camera).y, b = tv.set(0, 1, 0).project(camera).y;
    return (1 - a) / (b - a);
  };

  /* keep the cover tests on the glass as it moves (a slab: its centre, half sizes, its hole; scaled about its centre) */
  const setSlabCover = (c: THREE.Vector3, h: THREE.Vector3, hole: THREE.Vector3, sl: (typeof slabs)[number]) => {
    const g = sl.p.g, s = sl.s;
    c.copy(g.position); h.copy(s.h).multiply(g.scale);
    const a = s.axis === 0 ? 2 : 0, b = s.axis === 1 ? 2 : 1;
    hole.set(g.position.getComponent(a) + (s.hole[0] - s.c.getComponent(a)) * g.scale.getComponent(a),
      g.position.getComponent(b) + (s.hole[1] - s.c.getComponent(b)) * g.scale.getComponent(b), s.hole[2] * Math.min(g.scale.getComponent(a), g.scale.getComponent(b)));
  };
  // the cover tests work in world space; asm (the seal's compression) scales the pieces about CEN, so apply it too
  const asmPt = (v: THREE.Vector3) => v.sub(CEN).multiplyScalar(asm.scale.x).add(CEN);

  /* state */
  let prog = 0, shown = 0, t = 0, loopT = 0, lastOpacity = "";
  const T0 = rm ? 0 : Math.max(0, 0.2 - performance.now() / 1000);   // the art starts ~0.2 s into the page
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), q0 = new THREE.Quaternion();
  const sealC0 = new THREE.Color("#eef8f3"), WHITE = new THREE.Color("#ffffff"), MINT = new THREE.Color("#12b86e");
  const sqPx = { x: 0, y: 0, s: 10 };
  const readSq = () => {
    const sq = els.sq; if (!sq) { sqPx.x = W * 0.45; sqPx.y = H * 0.4; sqPx.s = 12; return; }
    const r = sq.getBoundingClientRect(), hr = hp.getBoundingClientRect();
    sqPx.x = r.left - hr.left + r.width / 2; sqPx.y = r.top - hr.top + r.height / 2; sqPx.s = r.width;
  };
  /** a piece's place: at rest `c`; moved by `off`; gathered (e) toward `to`, scaled to `sc`; tipped (rx, rz) */
  const put = (pc: Piece, off: THREE.Vector3, e: number, to: THREE.Vector3, sc: THREE.Vector3, rx = 0, rz = 0, s0 = 1) => {
    pc.g.position.copy(pc.c).add(off).lerp(to, e);
    pc.g.scale.set(lerp(s0, sc.x, e), lerp(s0, sc.y, e), lerp(s0, sc.z, e));
    pc.g.rotation.set(rx, 0, rz);
  };
  const ZERO = new THREE.Vector3();

  const place = () => {
    const p = rm ? 0 : shown;
    const ti = rm ? 99 : t - T0;
    const L = rm ? 0 : smooth(1.6, 2.3, ti);                 // the loop's amplitude
    const phi = loopT % CYCLE;
    U.uT.value = loopT + Math.max(0, ti) * 0.5;
    dat.update(rm ? 3 : U.uT.value);

    /* the loop's beats */
    const crossing = bump(phi, 1.9, 2.2, 4.1, 4.6) * L;
    const charge = bump(phi, 4.25, 4.85, 5.25, 5.95) * L;
    const release = bump(phi, 5.45, 5.75, 7.2, 7.9) * L;
    const ex = 1 - smooth(0, 0.12, p);                           // the loop's light fades as the exit starts

    /* the exit's phases */
    const cg = sineIO(p / 0.42), cs = sineIO((p - 0.44) / 0.16);
    const lock = gauss(p, 0.41, 0.035);
    const s1 = sineIO((p - 0.44) / 0.12);                        // compress into the cube
    const s2 = p2IO((p - 0.555) / 0.225);                        // the cube's flight
    const land = bump(p, 0.74, 0.785, 0.8, 0.88);

    /* the camera: in from a short turned perspective (intro); a small swing into perspective while it gathers (exit); a 1° drift at rest */
    const ci = rm ? 1 : outExpo((ti + 0.05) / 1.55);
    const drift = L * ex;
    target.copy(AIM);
    const az = Math.PI / 4 - 0.18 * (1 - ci) + Math.sin((loopT / 16) * Math.PI * 2) * 0.0175 * drift + 0.16 * cg * (1 - cs);
    const el = ISO_EL + 0.07 * (1 - ci) + Math.sin((loopT / 16) * Math.PI * 2 + 1.3) * 0.008 * drift - 0.05 * cg * (1 - cs);
    const lf = Math.log(REST_FOV), lw = Math.log(THREE.MathUtils.degToRad(10));
    const fov = Math.exp(lerp(lf, lw, Math.max(1 - ci, cg * (1 - cs) * 0.75)));
    const vh = restH * (1 - 0.1 * (1 - ci)) * (1 - 0.22 * cg);
    setCam(az, el, fov, vh);

    /* lights: the key fixed on the scene, the rim circling slowly */
    key.position.copy(KEY).multiplyScalar(18); key.target.position.set(0, 0, 0);
    const ra = loopT * 0.12 + 2.4;
    rim.position.set(Math.cos(ra) * -0.8, 0.45, Math.sin(ra) * -0.8);
    rim.intensity = 0.2 * Math.PI * (0.6 + 0.4 * Math.sin(loopT * 0.21));

    /* the settle: one pulse of light through the glass as the intro ends */
    const settle = rm ? 0 : bump(ti, 1.15, 1.35, 1.55, 1.95);
    const settleW = clamp((ti - 1.15) / 0.8);

    /* the core: first in; at the exit it tightens a little */
    const coreIn = rm ? 1 : outExpo(ti / 0.9);
    core.fade(rm ? 1 : outQuart(ti / 0.45));
    const cS = lerp(0.95, 1, coreIn) * lerp(1, 0.86, cg);
    put(core, ZERO, 0, ZERO, ZERO, 0, 0, cS);
    core.g.position.y = core.c.y + charge * 0.04 + (CEN.y - core.c.y) * cg;
    /* the central cube: rises into the frame; breathes on the cycle; lifts as it charges; turns green inside */
    const cubeIn = rm ? 1 : outExpo((ti - 0.05) / 0.9);
    cube.fade(rm ? 1 : outQuart((ti - 0.05) / 0.45));
    cube.g.position.set(0, (1 - cubeIn) * -0.35 + Math.sin((phi / CYCLE) * Math.PI * 2) * 0.012 * L + charge * 0.06 + cg * 0.1, 0);
    cube.g.scale.setScalar(lerp(0.9, 1, cubeIn) * lerp(1, 0.8, cg));
    U.uBubC.value.copy(cube.g.position);
    U.uCaust.value = (0.04 + charge * 0.9 + settle * 0.25) * (rm ? 0.5 : cubeIn) * (1 - cg);
    cubeMat.emissiveIntensity = charge * 0.05 + settle * 0.03;
    cubeMat.color.copy(WHITE).lerp(MINT, charge * 0.85);
    coreL.position.set(0, cube.g.position.y + 1.1, 0.9);
    coreL.intensity = (charge * 1.4 + settle * 0.6) * ex;
    halo.position.copy(cube.g.position);
    (halo.material as THREE.SpriteMaterial).opacity = (charge * 0.3 + settle * 0.1) * ex + cg * 0.08 * (1 - s1);
    halo.scale.setScalar(3.0 * (1 + charge * 0.18));

    /* the light round the core's frame (crossing), its glow on the settle and the lock */
    U.uFrontA.value = -1.2 + sineIO((phi - 2.0) / 2.5) * Math.PI * 4;
    U.uFrontK.value = Math.max(crossing * ex, settle * 0.6, lock * 0.8);
    U.uGlow.value = (0.1 + crossing * 0.3 + charge * 0.55 + settle * 0.3) * ex;

    /* the slabs: settle onto their places (intro); a wave of light crosses them (settle, crossing); at the exit they close on the core like lids */
    const tgt = [
      { to: V(0, CEN.y + SEAL + 0.17, 0), sc: V(SEAL / TOP.h.x, 1, SEAL / TOP.h.z), dl: 0.24, from: V(0, 0.55, 0), tip: 1 },
      { to: V(0, CEN.y - SEAL - 0.17, 0), sc: V(SEAL / BOT.h.x, 1, SEAL / BOT.h.z), dl: 0.28, from: V(0, -0.5, 0), tip: -1 },
      { to: V(0, CEN.y, SEAL + 0.13), sc: V(SEAL / LEFT.h.x, SEAL / LEFT.h.y, 1), dl: 0.34, from: V(-0.15, 0, 0.75), tip: 0 },
      { to: V(SEAL + 0.13, CEN.y, 0), sc: V(1, SEAL / RIGHT.h.y, SEAL / RIGHT.h.z), dl: 0.38, from: V(0.75, 0, -0.15), tip: 0 },
    ];
    for (const sl of slabs) {
      const g = tgt[sl.i];
      const a = rm ? 1 : outExpo((ti - g.dl) / 0.95);
      sl.p.fade(rm ? 1 : outQuart((ti - g.dl) / 0.5));
      const e = sineIO((p - 0.02 - sl.i * 0.025) / 0.38);
      tmp.copy(g.from).multiplyScalar(1 - a);
      const tip = Math.sin(Math.PI * e) * 0.32 * g.tip;
      put(sl.p, tmp, e, g.to, g.sc, tip * 0.7, -tip * 0.7, lerp(0.97, 1, a));
      // the wave: from the core outward over the glass (settle; crossing, each slab in turn)
      const w = clamp((phi - 2.1 - sl.i * 0.35) / 1.3);
      const lit = Math.max(crossing * Math.sin(Math.PI * w) * ex * 0.7, settle * 0.6);
      sl.m.uniforms.uLit.value = lit;
      sl.m.uniforms.uWave.value = settle > crossing * Math.sin(Math.PI * w) * 0.8 ? lerp(1, 8, settleW) : lerp(1, 8, w);
      sl.m.uniforms.uHot.value = lock * 0.9;
    }

    /* the back frames: slide in from behind (intro); at the exit they close in behind the core */
    for (const b of backs) {
      const a = rm ? 1 : outExpo((ti - 0.2 - b.side * 0.05) / 0.95);
      b.p.fade(rm ? 1 : outQuart((ti - 0.2 - b.side * 0.05) / 0.5));
      const e = sineIO((p - 0.03 - b.side * 0.02) / 0.36);
      const back = b.side === 0 ? V(-0.7, 0, 0) : V(0, 0, -0.7);
      const to = b.side === 0 ? V(-SEAL - 0.13, CEN.y, 0) : V(0, CEN.y, -SEAL - 0.13);
      const hu = (BACK.p0 - BACK.p1) / 2, hy = (BACK.y1 - BACK.y0) / 2;
      const sc = b.side === 0 ? V(1, SEAL / hy, SEAL / hu) : V(SEAL / hu, SEAL / hy, 1);
      put(b.p, tmp.copy(back).multiplyScalar(1 - a), e, to, sc, 0, 0, 1);
    }

    /* the small cubes: settle along their lines (intro); flash as a stream passes them; rise in turn (release); fly in to the core (exit) */
    for (const s of smalls) {
      const dl = 0.5 + s.i * 0.05;
      const a = rm ? 1 : outExpo((ti - dl) / 0.85);
      s.p.fade(rm ? 1 : outQuart((ti - dl) / 0.45));
      const bob = Math.sin((phi / CYCLE) * Math.PI * 2 + s.i * 1.3) * 0.03 * L;
      const rise = Math.sin(Math.PI * clamp((phi - 5.8 - s.i * 0.18) / 1.1)) * 0.2 * L;
      const e = sineIO((p - 0.02 - s.i * 0.02) / 0.3);
      tmp.copy(s.at).addScaledVector(s.out, 0.6 * (1 - a)); tmp.y += bob + rise;
      tmp.lerp(CEN, e);
      s.p.g.position.copy(tmp);
      s.p.g.scale.setScalar(lerp(1, 0.35, e));
      s.p.g.rotation.set(0, e * (s.i % 2 ? 1.1 : -1.1), 0);
    }

    /* the streams: a packet runs in along each tape, its characters riding with it; the small cube it passes flashes */
    const inkIn = rm ? 1 : outQuart((ti - 0.45) / 0.9);
    U.uInk.value = inkIn * (1 - smooth(0.04, 0.3, p));
    for (const tp of tapes) {
      const ph0 = 0.05 + tp.i * 0.16, D = 4.25 - ph0;
      const u = clamp((phi - ph0) / D);
      const lenP = tp.m.uniforms.uLen.value as number;
      const head = (tp.len + lenP) * (1 - Math.pow(1 - u, 1.35));
      tp.m.uniforms.uHead.value = head;
      tp.m.opacity = L * ex * (u > 0 && u < 1 ? 1 : 0);
      tp.mesh.visible = tp.m.opacity > 0.003;
      const sm = smalls[tp.i];
      const k = tp.mesh.visible ? gauss(head - lenP * 0.5, tp.sAt, lenP * 0.5) : 0;
      sm.m.emissiveIntensity = k * 0.28 * L;
    }

    /* the proof: from the cube up the rod, through the top cube and the plate's hole, up the guide to its dot (received) and on to the top edge */
    const pu = clamp((phi - 5.55) / 1.9);
    const yTop = topEdgeY() + 0.6;
    const proofY = lerp(0.8, yTop, Math.pow(pu, 1.25));
    const proofA = release * ex * smooth(0, 0.06, pu) * (1 - smooth(0.88, 1, pu));
    proof.position.set(0, proofY, 0);
    (proof.material as THREE.SpriteMaterial).opacity = proofA * 0.7;
    proof.visible = proofA > 0.01;
    if (proofL) { proofL.position.set(0.5, proofY, 0.5); proofL.intensity = proofA * 2.5; }
    const passD1 = gauss(proofY, SMALLS[0].y, 0.45) * proofA;
    smalls[0].m.emissiveIntensity = Math.max(smalls[0].m.emissiveIntensity, passD1 * 0.45);
    top.m.uniforms.uHot.value = Math.max(top.m.uniforms.uHot.value as number, gauss(proofY, TOP.c.y, 0.5) * proofA * 0.8);
    const rcv = proofA > 0.01 || pu < 1 ? smooth(7.0, 7.4, proofY) * (1 - smooth(0.7, 1, pu)) * release * ex : 0;
    recv.visible = rcv > 0.01;
    (recv.material as THREE.SpriteMaterial).opacity = rcv * 0.55;
    recv.scale.setScalar(0.6 + smooth(7.2, 8.6, proofY) * 1.1);

    /* the guides and the floor's dots */
    const du = dotMat.uniforms;
    du.uIntro.value = ti; du.uPhi.value = phi; du.uRel.value = release * ex; du.uP.value = p;
    du.uProofY.value = proofY; du.uProof.value = proofA; du.uRecv.value = rcv;
    /* the floor: draws on (intro); closes in under the box and fades (exit) */
    const flIn = rm ? 1 : outQuart((ti - 0.3) / 0.7);
    const fe = sineIO((p - 0.02) / 0.34);
    floorG.scale.setScalar(lerp(0.97, 1, flIn) * lerp(1, 0.45, fe));
    floorG.position.y = lerp(FLOOR.y, CEN.y - SEAL - 0.4, fe);
    floorLine.opacity = 0.45 * flIn * (1 - smooth(0.12, 0.36, p));
    discMat.opacity = flIn * (1 - smooth(0.05, 0.3, p));
    floorG.visible = floorLine.opacity > 0.003 || discMat.opacity > 0.003;
    (floorShadow.material as THREE.ShadowMaterial).opacity = 0.09 * bot.p.opacity * (1 - cg);
    (plateShadow.material as THREE.ShadowMaterial).opacity = 0.07 * bot.p.opacity * (1 - cg);

    /* the seal: everything gathered compresses into the box's place; a cube appears there, turns green, flies to the h1's square */
    const f = Math.max(0.0001, 1 - 0.88 * s1);
    asm.scale.setScalar(f); asm.position.copy(CEN).multiplyScalar(1 - f);
    asm.visible = s1 < 0.995 && p < 0.99;
    seal.visible = s1 > 0.001 && p < 0.9;
    if (seal.visible) {
      readSq();
      const side = lerp(2 * SEAL * 0.98, 1.5, s1);
      tmp.copy(CEN).project(camera);
      const x0 = (tmp.x * 0.5 + 0.5) * W, y0 = (-tmp.y * 0.5 + 0.5) * H, z0 = tmp.z;
      const px = lerp(x0, sqPx.x, s2), py = lerp(y0, sqPx.y, s2) - Math.sin(Math.PI * s2) * H * 0.07;
      seal.position.set((px / W) * 2 - 1, 1 - (py / H) * 2, z0).unproject(camera);
      tmp.set(1, 0, 0).applyQuaternion(camera.quaternion).add(seal.position).project(camera);
      tmp2.copy(seal.position).project(camera);
      const ppu = Math.abs(tmp.x - tmp2.x) * 0.5 * W;
      const side0 = 1.5 * ppu, sidePx = Math.exp(lerp(Math.log(side0), Math.log(Math.max(2, sqPx.s)), s2));
      const k = s2 > 0 ? sidePx / ppu / 1.5 : 1;
      seal.scale.setScalar(side * k);
      seal.quaternion.copy(q0.identity()).slerp(camera.quaternion, s2);
      const g = smooth(0.25, 1, s1);
      sealMat.color.copy(sealC0).lerp(GREEN, g).multiplyScalar(1 - smooth(0.7, 1, s2) * 0.999);
      sealMat.emissiveIntensity = g * 0.35 + smooth(0.7, 1, s2) * 0.65;
      sealMat.roughness = lerp(0.55, 0.3, g);
      const so = smooth(0, 0.35, s1) * (1 - smooth(0.82, 0.88, p));
      sealMat.opacity = so; sealMat.transparent = so < 0.999;
      sealLineMat.opacity = 0.85 * so * (1 - smooth(0.4, 0.95, s2));
      sealBloom.color.copy(GREEN).multiplyScalar(g * 0.5 * (1 - s2 * 0.5) + land * 0.8); sealBloom.opacity = so;
    }
    flash.visible = land > 0.01;
    if (flash.visible) {
      flash.position.copy(seal.position);
      const ppu = seal.scale.x > 0 ? sqPx.s / seal.scale.x : 1;
      flash.scale.setScalar((sqPx.s * 5) / Math.max(1e-4, ppu) * (0.7 + land * 0.5));
      (flash.material as THREE.SpriteMaterial).opacity = land * 0.6;
    }

    /* the cover tests follow the glass (the core, the plates, the side panels; through asm's compression) */
    asm.updateMatrixWorld();
    cover.uCoreC.value.copy(core.g.position); asmPt(cover.uCoreC.value);
    cover.uCoreH.value.set(CORE.h - 0.08, (CORE.y1 - CORE.y0) / 2 - 0.08, CORE.h - 0.08).multiplyScalar(core.g.scale.x * asm.scale.x);
    setSlabCover(cover.uTopC.value, cover.uTopH.value, cover.uTopHole.value, top);
    setSlabCover(cover.uBotC.value, cover.uBotH.value, cover.uBotHole.value, bot);
    setSlabCover(cover.uLC.value, cover.uLH.value, cover.uLHole.value, left);
    setSlabCover(cover.uRC.value, cover.uRH.value, cover.uRHole.value, right);

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
      [black, sealBloom, floorLine, ...lib.lines].forEach((m) => m.dispose());
      glowTex.dispose(); U.uNoise.value.dispose(); envRT.dispose(); fx.dispose(); dat.dispose();
      renderer.dispose(); renderer.forceContextLoss();
    },
  };
}
