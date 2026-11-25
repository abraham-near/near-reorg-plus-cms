// Hero H · "Veils": privacy as light through frosted glass. In the dark, a point of white light far behind shines forward through the NEAR mark three
// times over: three panes in the mark's shape, one behind the other, seen almost head on, each set a little aside from the one behind it (the back one
// right, the front one left), so the light reads right to left. Small glyphs of data (hex digits, chained blocks) ride the light through the panes. The first
// (on the right) is clear, and the light leaves it as a sharp picture (rows of bits; on load a point of data draws the mark's edge round once); the second
// is frosted, and the picture reaches it blurred; the third (on the left) is frosted deep, and only a glow gets through. Between the panes the light hangs
// in the haze as rays, sharp after the first pane, soft after the second, a halo after the third. The light is kept low (a little bloom, no flare). Each
// word of the cycle sends a faint pulse down the light, through the three panes in turn; on "by design" the glow turns NEAR green. Scrolling (the hero is
// pinned for 1.2 screens): the stack tips onto its back as the view rises to the Stack drawing's isometric angle (a dolly zoom, from a lens to all but
// flat), the light goes out and each pane folds into a cube of the Stack's pillar; then the screen closes to the Stack band's ink.
//
// The diffusion: each frame the light's picture is drawn once, sharp, into a texture, then blurred twice (a little, and a lot) at lower resolutions.
// Pane k shows picture k, and the light between the panes is a stack of thin slices, each showing a blend of the pictures before and after it.
import * as THREE from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import { type Mount, GREEN, INK, STACK, glow, nMark, nOutline, damp, hash, ease, frameView, free, reduced, stage } from "./common";
import { bloom } from "./post";

const SIZE = 2.3, T = 0.07;                  // the mark: its height, a pane's thickness
const LAT = 0.5;                             // each pane set a little aside from the one behind it, so the three read right to left
const SPAN = 1.36;                           // the light's picture covers 1.36 × the mark (room for the glow round it)
const GAP = 1.75, DEEP = 7;                  // between the panes; how far behind the stack the light is (along the line of sight)
const CA = 0.7, CH = 1.12;                   // a pillar cube: width, height (the drawing's proportions, as E)
const ISO = Math.atan(1 / Math.SQRT2);       // the drawing's camera pitch (true isometric)
const YAW = 0.14;                            // seen almost head on, a touch from the right: the sharp pane (the back) on the right, the glow on the left
const RES = 512;

/** a colour as the linear value that comes out of the Neutral tone mapping as itself (dark greys only), so the frame can end on the band's ink */
const graded = (hex: string) => { const c = new THREE.Color(hex); return new THREE.Color(Math.sqrt(c.r / 6.25), Math.sqrt(c.g / 6.25), Math.sqrt(c.b / 6.25)); };

const QUAD_VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
// the light's picture: rows of bits drifting (each row its own way, re-rolled now and then), a scan line, inside the mark; a point running round its edge
const SRC_FS = /* glsl */ `
  uniform sampler2D mask; uniform float t, scan, flash, trailA; uniform vec2 trail[16]; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main(){
    vec2 uv = vUv; float rows = 34.0;
    float r = floor(uv.y * rows);
    float x = uv.x * rows * 1.7 + t * (h(vec2(r, 3.0)) - 0.5) * 2.2;
    float c = floor(x);
    float roll = floor(t * (0.35 + h(vec2(r, 9.0)) * 1.1) + h(vec2(c, r)) * 5.0);
    float on = step(0.48, h(vec2(c, r) + roll * 0.173));
    vec2 f = vec2(fract(x), fract(uv.y * rows));
    float bar = smoothstep(0.06, 0.16, f.x) * smoothstep(0.94, 0.84, f.x) * smoothstep(0.26, 0.36, f.y) * smoothstep(0.74, 0.64, f.y);
    float band = exp(-pow((uv.y - scan) / 0.05, 2.0));
    float m = texture2D(mask, uv).r;
    float v = (on * bar * (0.3 + 0.7 * h(vec2(c * 1.3, r * 7.1))) * (0.6 + 0.7 * band + flash * 0.35) + 0.05 + band * 0.08) * m;
    for (int i = 0; i < 16; i++) { float d = distance(uv, trail[i]); float k = 1.0 - float(i) / 16.0; v += exp(-d * d / (0.00006 + 0.00004 * float(i))) * k * k * 1.6 * trailA; }
    gl_FragColor = vec4(vec3(v), 1.0);
  }`;
// a gaussian blur along one direction (9 taps through linear sampling)
const BLUR_FS = /* glsl */ `
  uniform sampler2D tex; uniform vec2 dir; varying vec2 vUv;
  void main(){
    vec4 s = texture2D(tex, vUv) * 0.227027;
    s += (texture2D(tex, vUv + dir * 1.3846) + texture2D(tex, vUv - dir * 1.3846)) * 0.3162162;
    s += (texture2D(tex, vUv + dir * 3.2308) + texture2D(tex, vUv - dir * 3.2308)) * 0.0702703;
    gl_FragColor = s;
  }`;

// a pane: the light's picture where it meets it, a frosted body (a fine grain), its edges lit
const PANE_VS = /* glsl */ `
  uniform float span; varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying float vCap;
  void main(){
    vUv = position.xy / span + 0.5; vCap = abs(normal.z);
    vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;
const PANE_FS = /* glsl */ `
  uniform sampler2D tex; uniform vec3 col, body; uniform float gain, frost, rim, alpha, a;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying float vCap;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main(){
    vec3 L = texture2D(tex, vUv).rgb * gain;
    float fr = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0);
    float grain = (h(floor(gl_FragCoord.xy)) - 0.5) * frost * 0.05;
    vec3 c = col * L * (1.0 + frost * 0.35) + body * (frost * (0.05 + L.r * 0.25) + grain) + col * fr * rim * 0.5;
    c = mix(col * (rim + L.r * 0.8), c, step(0.5, vCap));                        // the sides: lit by the light inside the glass
    gl_FragColor = vec4(c * a, alpha * a);
  }`;
// a slice of the light in the haze between the panes: a blend of the picture before it and the one after
const SLICE_VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const SLICE_FS = /* glsl */ `
  uniform sampler2D tA, tB; uniform float k, a; uniform vec3 col; varying vec2 vUv;
  void main(){
    vec3 L = mix(texture2D(tA, vUv).rgb, texture2D(tB, vUv).rgb, k);
    vec2 e = smoothstep(vec2(0.0), vec2(0.12), vUv) * smoothstep(vec2(1.0), vec2(0.88), vUv);
    gl_FragColor = vec4(col * L * a * e.x * e.y, 0.0);
  }`;
// dust in the haze, bright where the light is (the deep-blurred picture, looked up from where it floats), drifting down the light
const DUST_VS = /* glsl */ `
  uniform float t, span, z0, len, vh; uniform sampler2D glowTex; attribute float k; varying float vA;
  void main(){
    vec3 p = position; p.z = z0 + mod(p.z + t * (0.05 + k * 0.08), len); p.x += sin(t * 0.3 + k * 6.3) * 0.06;
    float lit = texture2D(glowTex, p.xy / span + 0.5).r;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (0.012 + k * 0.026) * projectionMatrix[1][1] * vh / -mv.z; vA = (0.03 + lit * 1.2) * (0.3 + k * 0.7);
    gl_Position = projectionMatrix * mv;
  }`;
const DUST_FS = "uniform float a; uniform vec3 col; varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(col * smoothstep(.5, 0., d) * vA * a, 0.); }";

// the data: small glyphs (hex digits, blocks, chained blocks) carried down the light; sharp until the first pane, then blurred more by each pane they
// pass (a lower mip level, a larger point) until, past the last, they are only soft specks. One draw per stretch between panes, so each pane covers
// the data behind it; each draw keeps only the points in its stretch
const DATA_VS = /* glsl */ `
  uniform float t, gap, lat, z0, len, vh, a, size, zMin, zMax; attribute vec4 d; varying float vLv, vA, vG;
  float sm(float e, float z){ return smoothstep(e - 0.1, e + 0.1, z); }
  void main(){
    float z = z0 + mod(d.z * len + t * (0.2 + fract(d.w * 7.3) * 0.12), len);
    vec3 p = vec3(d.x - min(z, gap) / gap * lat, d.y, z);
    float lv = 0.1 * sm(-gap, z) + 0.42 * sm(0.0, z) + 0.48 * sm(gap, z);
    float inside = step(zMin, z) * (1.0 - step(zMax, z));
    float fade = smoothstep(z0, z0 + 0.9, z) * (1.0 - smoothstep(z0 + len - 1.0, z0 + len, z));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = inside * size * (1.0 + lv * 0.9) * projectionMatrix[1][1] * vh / -mv.z;
    vLv = lv; vA = a * fade * inside * (1.0 - 0.75 * lv); vG = floor(d.w * 16.0);
    gl_Position = projectionMatrix * mv;
  }`;
const DATA_FS = /* glsl */ `
  uniform sampler2D atlas; uniform vec3 cA, cB, cC; varying float vLv, vA, vG;
  void main(){
    vec2 pc = gl_PointCoord, q = clamp((pc - 0.5) * (1.0 + vLv * 0.9) + 0.5, 0.0, 1.0);
    vec2 uv = (vec2(mod(vG, 8.0), floor(vG / 8.0)) + vec2(q.x, 1.0 - q.y)) / vec2(8.0, 2.0);
    float g = texture2D(atlas, uv, vLv * 5.0).a;
    float r = length(pc - 0.5);
    float v = mix(g, exp(-r * r * 16.0) * 0.55, smoothstep(0.5, 0.95, vLv));
    vec3 c = vLv < 0.3 ? mix(cA, cB, vLv / 0.3) : mix(cB, cC, (vLv - 0.3) / 0.7);
    gl_FragColor = vec4(c * v * vA, 0.0);
  }`;

export const mount: Mount = (canvas, section, track) => {
  const rm = reduced();
  const scene = new THREE.Scene();
  const night = graded("#050505"), ink = graded(INK), bg = night.clone();
  scene.background = bg;
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 200);
  let post: ReturnType<typeof bloom> | null = null;
  const st = stage(canvas, section, { clear: "#050505", tone: THREE.NeutralToneMapping, exposure: 1, track, dpr: 1.5 }, camera,
    (w, h) => { camera.aspect = w / h; camera.updateProjectionMatrix(); post?.size(); }, (f) => frame(f));
  post = bloom(st.renderer, scene, camera, 0.32, 0.4, 0.88);
  const round = glow("round");
  const premul = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor } as const;

  /* the light's pictures: the mark's shape (drawn once), the sharp picture, and two blurs of it */
  const W = SIZE * SPAN;
  const outline = nOutline(SIZE, 600);
  const mc = document.createElement("canvas"); mc.width = mc.height = RES;
  const mx = mc.getContext("2d")!;
  mx.fillStyle = "#000"; mx.fillRect(0, 0, RES, RES); mx.fillStyle = "#fff"; mx.beginPath();
  outline.forEach((v, i) => { const x = (v.x / W + 0.5) * RES, y = (0.5 - v.y / W) * RES; if (i) mx.lineTo(x, y); else mx.moveTo(x, y); });
  mx.fill();
  const mask = new THREE.CanvasTexture(mc);
  const rt = (n: number) => new THREE.WebGLRenderTarget(n, n, { type: THREE.HalfFloatType, depthBuffer: false });
  const sharp = rt(RES), m1 = rt(256), m2 = rt(256), h1 = rt(64), h2 = rt(64);
  const trail = Array.from({ length: 16 }, () => new THREE.Vector2(-1, -1));
  const srcU = { mask: { value: mask }, t: { value: 0 }, scan: { value: 0.5 }, flash: { value: 0 }, trailA: { value: 0 }, trail: { value: trail } };
  const srcMat = new THREE.ShaderMaterial({ vertexShader: QUAD_VS, fragmentShader: SRC_FS, uniforms: srcU });
  const blurU = { tex: { value: null as THREE.Texture | null }, dir: { value: new THREE.Vector2() } };
  const blurMat = new THREE.ShaderMaterial({ vertexShader: QUAD_VS, fragmentShader: BLUR_FS, uniforms: blurU });
  const quad = new FullScreenQuad(srcMat);
  const pass = (mat: THREE.ShaderMaterial, to: THREE.WebGLRenderTarget) => { quad.material = mat; st.renderer.setRenderTarget(to); quad.render(st.renderer); };
  const blur = (from: THREE.WebGLRenderTarget, a: THREE.WebGLRenderTarget, b: THREE.WebGLRenderTarget, spreads: number[]) => {
    let src = from;
    for (const s of spreads) {
      blurU.tex.value = src.texture; blurU.dir.value.set(s / a.width, 0); pass(blurMat, a);
      blurU.tex.value = a.texture; blurU.dir.value.set(0, s / a.width); pass(blurMat, b);
      src = b;
    }
  };
  const pictures = () => {
    pass(srcMat, sharp);
    blur(sharp, m1, m2, [0.7, 1]);          // frosted: the bits run together
    blur(m2, h1, h2, [1, 1.8, 2.6]);        // frosted deep: only the glow
    st.renderer.setRenderTarget(null);
  };
  const PIC = [sharp.texture, m2.texture, h2.texture];

  /* the stack: the light, three panes, the light between them (it tips onto its back with the scroll) */
  const stack = new THREE.Group(); scene.add(stack);
  let ro = 1;
  const sq = new THREE.PlaneGeometry(W, W);
  type Slice = { m: THREE.Mesh; u: { tA: { value: THREE.Texture }; tB: { value: THREE.Texture }; k: { value: number }; a: { value: number }; col: { value: THREE.Color } }; seg: number; s: number };
  const slices: Slice[] = [];
  const addSlices = (seg: number, n: number, tA: THREE.Texture, tB: THREE.Texture, k0: number) => {
    for (let j = 0; j < n; j++) {
      const s = (j + 0.5) / n;
      const u = { tA: { value: tA }, tB: { value: tB }, k: { value: k0 + (1 - k0) * s }, a: { value: 0 }, col: { value: new THREE.Color() } };
      const m = new THREE.Mesh(sq, new THREE.ShaderMaterial({ vertexShader: SLICE_VS, fragmentShader: SLICE_FS, uniforms: u, ...premul, side: THREE.DoubleSide }));
      m.renderOrder = ro++; m.frustumCulled = false; stack.add(m);
      slices.push({ m, u, seg, s });
    }
  };

  // the point of light, far behind the stack (straight behind it as seen), and the cone of light from it to the first pane
  const coreMat = new THREE.SpriteMaterial({ map: round, color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const core = new THREE.Sprite(coreMat); core.renderOrder = ro++; stack.add(core);
  addSlices(0, 16, mask, mask, 0);

  /* the data: a sheet of glyphs, and points scattered over the mark's shape (each with its own glyph, depth and speed) */
  const ac = document.createElement("canvas"); ac.width = 256; ac.height = 64;
  const ax = ac.getContext("2d")!;
  ax.fillStyle = ax.strokeStyle = "#fff"; ax.font = "600 19px ui-monospace, Menlo, monospace"; ax.textAlign = "center"; ax.textBaseline = "middle"; ax.lineWidth = 2;
  "01a7fe3c9b".split("").forEach((ch, i) => ax.fillText(ch, (i % 8) * 32 + 16, Math.floor(i / 8) * 32 + 17));
  const cell = (i: number) => [(i % 8) * 32 + 16, Math.floor(i / 8) * 32 + 16] as const;
  { const [x, y] = cell(10); ax.fillRect(x - 6, y - 6, 12, 12); }                                                      // a block
  { const [x, y] = cell(11); ax.strokeRect(x - 6, y - 6, 12, 12); }                                                    // an empty one
  { const [x, y] = cell(12); ax.fillRect(x - 10, y - 4, 8, 8); ax.fillRect(x + 2, y - 4, 8, 8); ax.fillRect(x - 3, y - 1, 6, 2); }  // two, chained
  { const [x, y] = cell(13); for (let k = 0; k < 3; k++) ax.fillRect(x - 10 + k * 7, y - 3, 5, 6); }                  // a short chain
  { const [x, y] = cell(14); ax.fillText("#", x, y + 1); }
  { const [x, y] = cell(15); ax.beginPath(); ax.moveTo(x, y - 7); ax.lineTo(x + 7, y); ax.lineTo(x, y + 7); ax.lineTo(x - 7, y); ax.closePath(); ax.stroke(); }
  const atlas = new THREE.CanvasTexture(ac);
  const ND = 150, dd = new Float32Array(ND * 4), mpx = mx.getImageData(0, 0, RES, RES).data;
  for (let i = 0, n = 0; i < ND; n++) {
    const x = (hash(n * 3.1) - 0.5) * SIZE, y = (hash(n * 5.7) - 0.5) * SIZE;
    const px = Math.floor((x / W + 0.5) * RES), py = Math.floor((0.5 - y / W) * RES);
    if (mpx[(py * RES + px) * 4] < 128 && n < 5000) continue;
    dd.set([x, y, hash(n * 9.1), hash(n * 2.9)], i * 4); i++;
  }
  const dataGeo = new THREE.BufferGeometry();
  dataGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(ND * 3), 3)); dataGeo.setAttribute("d", new THREE.BufferAttribute(dd, 4));
  const dataU = { t: { value: 0 }, gap: { value: GAP }, lat: { value: LAT }, z0: { value: 0 }, len: { value: 1 }, vh: { value: 450 }, a: { value: 0 }, size: { value: 0.13 },
    atlas: { value: atlas }, cA: { value: new THREE.Color(0xffffff) }, cB: { value: new THREE.Color() }, cC: { value: new THREE.Color() } };
  const dataStretch = [-1e3, 0, 0, 0, 1e3];                     // the stretches' bounds, along the light (set each frame)
  const datas: { u: { zMin: { value: number }; zMax: { value: number } }; seg: number }[] = [];
  const addData = (seg: number) => {
    const u = { ...dataU, zMin: { value: 0 }, zMax: { value: 0 } };
    const pts = new THREE.Points(dataGeo, new THREE.ShaderMaterial({ vertexShader: DATA_VS, fragmentShader: DATA_FS, uniforms: u, ...premul }));
    pts.frustumCulled = false; pts.renderOrder = ro++; stack.add(pts);
    datas.push({ u, seg });
  };
  addData(0);

  const paneGeo = nMark(SIZE, T, 0.006), edgeGeo = new THREE.EdgesGeometry(nMark(SIZE, T, 0), 25);
  const FROST = [{ frost: 0, alpha: 0.12, rim: 0.4, edge: 0.6, gain: 0.95 }, { frost: 0.45, alpha: 0.6, rim: 0.32, edge: 0.25, gain: 0.95 }, { frost: 0.9, alpha: 0.8, rim: 0.25, edge: 0.1, gain: 3 }];
  const panes = FROST.map((fr, i) => {
    const u = { tex: { value: PIC[i] }, span: { value: W }, col: { value: new THREE.Color() }, body: { value: new THREE.Color(0xdff5ec) }, gain: { value: fr.gain },
      frost: { value: fr.frost }, rim: { value: fr.rim }, alpha: { value: fr.alpha }, a: { value: 0 } };
    const g = new THREE.Group(); stack.add(g);
    const m = new THREE.Mesh(paneGeo, new THREE.ShaderMaterial({ vertexShader: PANE_VS, fragmentShader: PANE_FS, uniforms: u, ...premul }));
    m.renderOrder = ro++; g.add(m);
    const e = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    e.renderOrder = ro++; g.add(e);
    if (i === 0) { addSlices(1, 22, PIC[0], PIC[1], 0.12); addData(1); }   // sharp rays, softening on the way
    if (i === 1) { addSlices(2, 14, PIC[1], PIC[2], 0); addData(2); }      // soft rays
    if (i === 2) { addSlices(3, 10, PIC[2], PIC[2], 0); addData(3); }      // the glow, spreading
    return { g, m, e, u, ...fr };
  });

  const N = 700, dp = new Float32Array(N * 3), dk = new Float32Array(N);
  for (let i = 0; i < N; i++) { dp[i * 3] = (hash(i * 1.7) - 0.5) * W * 1.15; dp[i * 3 + 1] = (hash(i * 2.3) - 0.5) * W * 1.15; dp[i * 3 + 2] = hash(i * 4.9) * 10; dk[i] = hash(i * 8.3); }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dp, 3)); dustGeo.setAttribute("k", new THREE.BufferAttribute(dk, 1));
  const dustU = { t: { value: 0 }, span: { value: W }, z0: { value: 0 }, len: { value: 1 }, vh: { value: 450 }, glowTex: { value: PIC[2] }, a: { value: 0 }, col: { value: new THREE.Color(0xe8fff4) } };
  const dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({ vertexShader: DUST_VS, fragmentShader: DUST_FS, uniforms: dustU, ...premul }));
  dust.frustumCulled = false; dust.renderOrder = ro++; stack.add(dust);

  /* the Stack's pillar: a cube grown out of each pane, in the drawing's greens with its cream outline (as E) */
  const boxGeo = new THREE.BoxGeometry(CA, CH, CA), boxEdges = new THREE.EdgesGeometry(boxGeo);
  const cubes = panes.map(() => {
    // seen from the front right (the drawing's angle, as E): +x is its right face, +z its left one
    const mats = [STACK.r, STACK.r, STACK.t, STACK.t, STACK.l, STACK.l].map((c) => new THREE.MeshBasicMaterial({ color: c }));
    const g = new THREE.Group(); g.visible = false;
    g.add(new THREE.Mesh(boxGeo, mats), new THREE.LineSegments(boxEdges, new THREE.LineBasicMaterial({ color: 0xf5f4f1 })));
    scene.add(g);
    return g;
  });

  // the colours down the light: white, mint, a pale green glow; on "by design" the soft end turns NEAR green
  const C_SHARP = new THREE.Color(0xffffff), C_SOFT = new THREE.Color(0xdcfbec), C_GLOW = new THREE.Color(0xa8f0cf), C_GREEN = new THREE.Color(GREEN).multiplyScalar(1.15);
  const cSoft = new THREE.Color(), cGlow = new THREE.Color();

  let final = false, fin = 0, pulseAt = -10;
  const dir = new THREE.Vector3(), target = new THREE.Vector3(), wp = new THREE.Vector3(), src = new THREE.Vector3();
  function frame(f: { t: number; dt: number; px: number; py: number; p: number; w: number; h: number; wide: boolean }) {
    const dt = f.dt || 1 / 60, t = f.t, p = f.p;
    // on load: the point of light, its cone, then each pane and the light beyond it, one after another
    const at = (d: number, len = 0.8) => (rm ? 1 : ease.outCubic((t - d) / len));
    const on = [at(0.3, 0.5), at(0.55, 1), at(1.0), at(1.25, 1), at(1.55), at(1.8, 1), at(2.1), at(2.35, 1.4)];
    // the scroll: the gaps open a little; the stack tips onto its back and the view rises (0.12 to 0.55); the light goes out and the panes fold into
    // cubes (0.34 to 0.78); the room darkens to the band's ink; it holds still for the veil (0.86)
    const open = ease.inOutCubic(p / 0.3), tip = ease.inOutCubic((p - 0.12) / 0.43), out = 1 - ease.inOutCubic((p - 0.34) / 0.3);
    bg.copy(night).lerp(ink, ease.inOutCubic((p - 0.3) / 0.45));
    if (post) post.pass.strength = 0.32 * (0.3 + 0.7 * out);

    fin = damp(fin, final ? 1 : 0, 1.6, dt);
    cSoft.copy(C_SOFT).lerp(C_GREEN, fin * 0.45); cGlow.copy(C_GLOW).lerp(C_GREEN, fin);
    const breathe = rm ? 1 : 1 + Math.sin(t * 0.9) * 0.05 + Math.sin(t * 2.3) * 0.02;

    const gap = THREE.MathUtils.lerp(GAP * (1 + open * 0.15), CH, tip), z0 = -gap - 1, z1 = gap + 1.6;
    const side = (z: number) => (-Math.min(z, gap) / gap) * LAT * (1 - tip);   // the panes' axis leans: the back pane right, the front one left
    // the stack: upright, then on its back (the light then shines up through it); a slow sway
    stack.rotation.set((-Math.PI / 2) * tip, rm ? 0 : Math.sin(t * 0.17) * 0.05 * (1 - tip), 0);

    // the view: three quarters from the front right, a little above; with the scroll, up to the drawing's isometric angle while the lens narrows
    // (the distance grows to keep the framing): a dolly zoom into a nearly flat, isometric picture, the pillar in the middle of the screen
    const settle = rm ? 1 : ease.outCubic(t / 4);
    const yaw = THREE.MathUtils.lerp(YAW + (1 - settle) * 0.1 + f.px * 0.05 + (rm ? 0 : Math.sin(t * 0.13) * 0.03), Math.PI / 4, tip);
    const pitch = THREE.MathUtils.lerp(0.07 - f.py * 0.03, ISO, tip);
    const fov = THREE.MathUtils.lerp(f.wide ? 18 : 28, 2.5, ease.inOutCubic((p - 0.1) / 0.5));
    const H = THREE.MathUtils.lerp(f.wide ? 7.4 : 12, f.wide ? 7.4 : 10.5, tip) / (0.94 + 0.06 * settle);
    const dist = H / (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2));
    target.set(THREE.MathUtils.lerp(0.12, 0, tip), 0, THREE.MathUtils.lerp(0.2, 0, tip));
    dir.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    camera.position.copy(target).addScaledVector(dir, dist);
    camera.lookAt(target);
    camera.fov = fov; camera.near = Math.max(0.1, dist - 14); camera.far = dist + 20;
    camera.updateProjectionMatrix();
    const hold = 1 - ease.inOutCubic((p - 0.1) / 0.4);
    frameView(camera, f.w, f.h, f.wide, 0.3 * hold, 0.2 * hold);

    // the light: far behind the stack along the line of sight, shining forward through it; its cone narrows back to it
    stack.updateMatrixWorld();
    stack.worldToLocal(src.copy(target).addScaledVector(dir, -DEEP));

    // the pulse: a faint band of light running down the stack, from the first pane to past the last, in a second
    const front = z0 + ((t - pulseAt) * (z1 - z0)) / 1.05;
    const pulse = (z: number) => (rm ? 0 : Math.exp(-Math.pow((z - front) / 0.5, 2)) * 0.3);

    // the light's picture: the scan line falls slowly; once, on load, a point of data draws the mark's edge round, then goes
    srcU.t.value = rm ? 0 : t; srcU.scan.value = rm ? 0.55 : 1.15 - ((t * 0.11) % 1.3); srcU.flash.value = pulse(-gap);
    const draw = rm ? 1 : (t - 1.1) / 2.6;
    srcU.trailA.value = rm ? 0 : Math.min(1, Math.max(0, draw * 8)) * (1 - ease.outCubic((draw - 1) * 2.5));
    const head = Math.min(1, Math.max(0, draw)) * 600;
    for (let i = 0; i < trail.length; i++) {
      const v = outline[Math.min(599, Math.max(0, Math.floor(head - i * 2.2)))];
      trail[i].set(v.x / W + 0.5, v.y / W + 0.5);
    }

    core.position.copy(src);
    coreMat.opacity = on[0] * out * breathe * 0.75; core.scale.setScalar(0.55);

    for (const sl of slices) {
      let z: number, s = 1, a: number, c: THREE.Color;
      if (sl.seg === 0) {
        sl.m.position.lerpVectors(src, wp.set(side(-gap), 0, -gap), sl.s); s = 0.03 + 0.97 * sl.s;
        sl.m.scale.set(s, s, 1); sl.u.a.value = 0.03 * on[1] * out * breathe; sl.u.col.value.copy(C_SHARP);
        continue;
      }
      if (sl.seg === 1) { z = THREE.MathUtils.lerp(-gap, 0, sl.s); a = 0.035 * (1 - sl.s * 0.35) * on[3]; c = C_SHARP; }
      else if (sl.seg === 2) { z = THREE.MathUtils.lerp(0, gap, sl.s); s = 1 + sl.s * 0.06; a = 0.04 * on[5]; c = cSoft; }
      else { z = gap + sl.s * 1.6; s = 1.05 + sl.s * 0.55; a = 0.06 * Math.pow(1 - sl.s, 1.4) * on[7]; c = cGlow; }
      sl.m.position.set(side(z), 0, z); sl.m.scale.set(s, s, 1);
      sl.u.a.value = a * out * breathe * (1 + pulse(z)); sl.u.col.value.copy(c);
    }

    panes.forEach((pn, i) => {
      const z = (i - 1) * gap, k = on[2 + i * 2];
      // each comes forward into place as it lights; a slow drift (the nearer, the more)
      pn.g.position.set(side(z) + (rm ? 0 : Math.sin(t * 0.21 + i * 1.7) * 0.03 * i * (1 - tip)), rm ? 0 : Math.sin(t * 0.33 + i) * 0.025 * (1 - tip), z - (1 - k) * 0.6);
      const fold = ease.inOutCubic((p - 0.4 - i * 0.07) / 0.24), sc = 1 - fold;
      pn.g.scale.set(Math.max(0.001, sc), Math.max(0.001, sc), 1); pn.g.visible = sc > 0.01;
      pn.u.a.value = k * (0.35 + 0.65 * out); pn.u.gain.value = pn.gain * breathe * (1 + pulse(z)) * out;
      pn.u.col.value.copy(i === 0 ? C_SHARP : i === 1 ? cSoft : cGlow);
      const em = pn.e.material as THREE.LineBasicMaterial;
      em.opacity = pn.edge * k * (1 + pulse(z)); em.color.copy(pn.u.col.value);

      // its cube: grows where the pane was as the pane shrinks away (once the stack lies on its back), and settles into the pillar
      const cb = cubes[i];
      cb.visible = fold > 0.01;
      pn.g.getWorldPosition(wp);
      cb.position.set(wp.x * (1 - fold), THREE.MathUtils.lerp(wp.y, (i - 1) * CH, fold), wp.z * (1 - fold));
      const g = Math.max(0.01, rm ? fold : ease.outBack(fold, 1.3));
      cb.scale.set(g, Math.max(0.01, fold), g);
    });

    dustU.t.value = rm ? 0 : t; dustU.z0.value = z0; dustU.len.value = z1 - z0; dustU.vh.value = f.h * st.renderer.getPixelRatio() * 0.5;
    // the data: from just in front of the light to past the last pane
    dataU.t.value = rm ? 4 : t; dataU.gap.value = gap; dataU.lat.value = LAT * (1 - tip); dataU.z0.value = -gap - 1.4; dataU.len.value = gap * 2 + 2.6;
    dataU.vh.value = dustU.vh.value; dataU.a.value = 0.55 * on[1] * out; dataU.cB.value.copy(cSoft); dataU.cC.value.copy(cGlow);
    dataStretch[1] = -gap; dataStretch[2] = 0; dataStretch[3] = gap;
    for (const dv of datas) { dv.u.zMin.value = dataStretch[dv.seg]; dv.u.zMax.value = dataStretch[dv.seg + 1]; }
    dustU.a.value = on[1] * out * 0.8; dustU.col.value.copy(C_SHARP).lerp(cGlow, 0.5);

    pictures();
  }

  st.run(scene, () => post?.draw());
  return {
    step(i, last) {
      if (i === 0) final = false;
      if (i >= last) final = true;
      if (i > 0) pulseAt = st.f.t;
    },
    dispose() {
      st.dispose(); post?.dispose(); free(scene); round.dispose(); mask.dispose(); quad.dispose(); atlas.dispose(); srcMat.dispose(); blurMat.dispose();
      for (const r of [sharp, m1, m2, h1, h2]) r.dispose();
    },
  };
};
