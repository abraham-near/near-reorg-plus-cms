// Hero study "Stack D"'s data and its diffusion (the technique of /hero-h, "Veils", ../../heroes3d/scene-h.ts, as Pillar D, ../pillar-d/glass.ts).
// Each frame the data's picture is drawn once, sharp, into a texture that tiles: data as LINES, no characters (rows of dashes of varying lengths,
// like packets on a bus: some long, some short, gaps between, a brighter head on each, every row running its own way at its own speed; whole bands
// of rows blank between bursts). Then it is blurred twice at lower resolutions: a little (the dashes run together into soft streaks) and a lot (only
// a glow is left). Everything that shows the data samples one of the three by its own planar coordinates (no transmission, no depth of field), so
// the frost reads the same on any GPU:
//   · the green glass base (A5) shows the sharp picture on its top: ink lines, legible, green where light passes;
//   · the perforated plates (./fx.ts) let it through their holes as dots of light (the lower plate: the soft picture; the upper one: the glow);
//   · the middle green sheet (A3) shows the soft picture (grey streaks going green), the top sheet (A1) only a green glow;
//   · the glass column (B2) carries only the glow, rising.
import * as THREE from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";

export const ROWS = 40;                          // the picture: ROWS rows of data, tiling
export const COLS = 28;                          // and COLS dash cells along a row

const QUAD_VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";

// the sharp picture. A row: COLS cells, each holding one dash (its start and length rolled per cell, long ones run into the next cell: a bus of
// packets), the row sliding along at its own speed and direction; the leading end of each dash is a bright head. Rows come in bursts (blocks of
// 2–5 rows) with blank rows between, and a dash re-rolls now and then (the data changes).
const SRC_FS = /* glsl */ `
  uniform float t; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main(){
    float R = ${ROWS.toFixed(1)}, C = ${COLS.toFixed(1)};
    float r = floor(vUv.y * R), fy = fract(vUv.y * R);
    float dir = h(vec2(r, 2.3)) < 0.5 ? -1.0 : 1.0;
    float sp = (0.35 + h(vec2(r, 5.1)) * 0.9) * dir;
    float x = fract(vUv.x + t * sp / C * 0.9) * C;
    float c = floor(x), fx = fract(x);
    float cc = mod(c, C);
    float roll = floor(t * (0.12 + h(vec2(cc, r)) * 0.25) + h(vec2(r, cc)) * 9.0);
    float rr = h(vec2(cc, r) + roll * 0.173);
    // the dash in this cell: its start and its length (a long one reaches the cell's end and joins the next one's start at 0: a bus)
    float st = rr < 0.3 ? 0.0 : floor(h(vec2(cc * 1.7, r) + roll) * 4.0) * 0.12;
    float ln = rr < 0.3 ? 1.0 : 0.18 + floor(h(vec2(cc, r * 1.3) + roll) * 4.0) * 0.16;
    float on = step(0.22, h(vec2(cc + roll * 0.31, r * 2.7)));                     // gaps
    float d = fx - st;
    float body = step(0.0, d) * step(d, ln) * on;
    // the head: the end of the dash it travels toward (bright), the tail a little dimmer
    float u = clamp(d / max(ln, 0.01), 0.0, 1.0); u = dir > 0.0 ? u : 1.0 - u;
    float head = smoothstep(0.72, 1.0, u) * step(ln, 0.99);
    // thickness: a thin line in the middle of the row (rows of three weights)
    float wgt = 0.07 + floor(h(vec2(r, 8.8)) * 3.0) * 0.035;
    float line = smoothstep(wgt + 0.05, wgt, abs(fy - 0.5));
    float burst = step(0.42, h(vec2(floor(r / 4.0), 1.9)));                        // bursts of rows, blank between them
    float keep = step(0.12, h(vec2(r, 9.7)));                                       // and a few blank rows inside them
    float v = line * body * burst * keep * (0.62 + 0.38 * head);
    gl_FragColor = vec4(v, v, v, 1.0);
  }`;
// a gaussian blur along one direction (9 taps through linear sampling), wrapping
const BLUR_FS = /* glsl */ `
  uniform sampler2D tex; uniform vec2 dir; varying vec2 vUv;
  void main(){
    vec4 s = texture2D(tex, vUv) * 0.227027;
    s += (texture2D(tex, vUv + dir * 1.3846) + texture2D(tex, vUv - dir * 1.3846)) * 0.3162162;
    s += (texture2D(tex, vUv + dir * 3.2308) + texture2D(tex, vUv - dir * 3.2308)) * 0.0702703;
    gl_FragColor = s;
  }`;

export type Data = ReturnType<typeof data>;
/** the picture and its two blurs; `update(t)` redraws them (cheap: 512² once, then small blurs) */
export function data(renderer: THREE.WebGLRenderer, lite: boolean) {
  const S = lite ? 512 : 1024;
  const rt = (n: number, mips = false) => {
    const r = new THREE.WebGLRenderTarget(n, n, {
      type: THREE.UnsignedByteType, depthBuffer: false, generateMipmaps: mips,
      minFilter: mips ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter, magFilter: THREE.LinearFilter,
    });
    r.texture.wrapS = r.texture.wrapT = THREE.RepeatWrapping;
    return r;
  };
  const sharp = rt(S, true), s1 = rt(256), s2 = rt(256), g1 = rt(64), g2 = rt(64);
  const srcMat = new THREE.ShaderMaterial({ vertexShader: QUAD_VS, fragmentShader: SRC_FS, uniforms: { t: { value: 0 } } });
  const blurU = { tex: { value: null as THREE.Texture | null }, dir: { value: new THREE.Vector2() } };
  const blurMat = new THREE.ShaderMaterial({ vertexShader: QUAD_VS, fragmentShader: BLUR_FS, uniforms: blurU });
  const quad = new FullScreenQuad(srcMat);
  const pass = (mat: THREE.ShaderMaterial, to: THREE.WebGLRenderTarget) => { quad.material = mat; renderer.setRenderTarget(to); quad.render(renderer); };
  const blur = (from: THREE.WebGLRenderTarget, a: THREE.WebGLRenderTarget, b: THREE.WebGLRenderTarget, spreads: number[], k = 1) => {
    let src = from;
    for (const s of spreads) {
      blurU.tex.value = src.texture; blurU.dir.value.set(s / a.width, 0); pass(blurMat, a);
      blurU.tex.value = a.texture; blurU.dir.value.set(0, (s * k) / a.width); pass(blurMat, b);
      src = b;
    }
  };
  let lastT = -1;
  return {
    sharp: sharp.texture, soft: s2.texture, glow: g2.texture,
    update(t: number) {
      // redraw ~30 times a second at most (the rows slide smoothly enough)
      const q = Math.floor(t * 30) / 30;
      if (q === lastT) return; lastT = q;
      const prev = renderer.getRenderTarget();
      srcMat.uniforms.t.value = q;
      pass(srcMat, sharp);
      blur(sharp, s1, s2, [1.2, 1.8], 0.7);       // frosted: the dashes run together into soft streaks (more along the rows than across)
      blur(s2, g1, g2, [1, 1.8, 2.4]);            // frosted deep: only a glow is left
      renderer.setRenderTarget(prev);
    },
    dispose() { for (const r of [sharp, s1, s2, g1, g2]) r.dispose(); srcMat.dispose(); blurMat.dispose(); quad.dispose(); },
  };
}

/* ── the glass ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
// One shader for the green glass, on light paper, in the drawing's colours: the top a pale mint film (the drawing's #00DC8D at ~0.14), the two seen
// sides a deeper mint (0.42 / 0.35), a fine white highlight just inside each top rim, the mint body at the very edge; the data at its level; the
// soft shadow of the plate above; green light from inside. `mode`: 0 a sheet (the base, the middle sheet, the top sheet), 1 the glass column.
// In the bloom pass (uBloom) it draws only its green light, added.
const GLASS_VS = /* glsl */ `
  #include <clipping_planes_pars_vertex>
  varying vec3 vWP; varying vec3 vLP; varying vec3 vLN;
  void main(){
    vLP = position; vLN = normal;
    vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz;
    vec4 mvPosition = viewMatrix * wp;
    #include <clipping_planes_vertex>
    gl_Position = projectionMatrix * mvPosition;
  }`;
const GLASS_FS = /* glsl */ `
  uniform sampler2D tSharp, tSoft, tGlow;
  uniform float uMode, uLevel, uOp, uBloom, uT, uCell, uHalf, uHole, uY, uWave, uLit, uGlow, uPulseY, uPulse, uFlow, uDots, uBand;
  uniform vec3 uShadow;   // the plate above: its half side, its hole's half side, its height above (a soft shadow on this one)
  uniform vec2 uKey;      // the key light's slant (the shadow's offset per unit of height)
  varying vec3 vWP; varying vec3 vLP; varying vec3 vLN;
  #include <clipping_planes_pars_fragment>
  const vec3 INK = vec3(0.067), GREEN = vec3(0.0, 0.862, 0.553), GDEEP = vec3(0.043, 0.784, 0.514), PAPER = vec3(0.961);
  float sq(vec2 p){ return max(abs(p.x), abs(p.y)); }
  void main(){
    #include <clipping_planes_fragment>
    float top = step(0.5, vLN.y);
    // the sides as the drawing has them: the right face (+X) 0.42 of the green, the left (+Z) 0.35
    vec3 sideC = mix(PAPER, GREEN, abs(vLN.x) > 0.5 ? 0.42 : 0.35);
    vec3 col; float a; float gl = 0.0;
    if (uMode < 0.5) {
      vec2 q = vLP.xz;
      float dOut = uHalf - sq(q), dIn = uHole > 0.0 ? sq(q) - uHole : 9.0;
      float rimD = min(dOut, dIn);
      float inner = smoothstep(0.08, 0.3, dOut) * smoothstep(0.06, 0.22, dIn);           // the data keeps off the rims
      vec2 uv = vec2(q.x / (uCell * ${(COLS * 2.8).toFixed(1)}), q.y / (uCell * ${ROWS.toFixed(1)}));
      float s0 = texture2D(tSharp, uv, -0.6).r, s1 = texture2D(tSoft, uv).r, s2 = texture2D(tGlow, uv).r;
      float rad = sq(q);
      float wave = exp(-pow((rad - uWave) / 0.55, 2.0)) * uLit;                            // light spreading over the sheet
      // the film: the drawing's pale mint (a thin green over the paper), whiter as it frosts
      vec3 film = mix(GREEN, vec3(0.9, 0.98, 0.95), uLevel * 0.3);
      if (uLevel < 0.5) {
        // clear: the data sharp, in ink; green where the light passes (the inflow band sweeps in, the crossing's wave spreads)
        float g = smoothstep(0.08, 0.5, s0) * inner;
        float lit = clamp(wave * 1.3 + uBand, 0.0, 1.0);
        col = mix(film, mix(INK, GDEEP * 0.85, lit), g);
        a = 0.17 + g * (0.62 + lit * 0.2);
        gl = g * lit * 0.55;
      } else if (uLevel < 1.5) {
        // frosted: a milkier mint; the data soft, grey streaks going green as the light crosses
        float g = smoothstep(0.01, 0.13, s1) * inner;
        vec3 tint = mix(vec3(0.3, 0.42, 0.37), GDEEP, 0.15 + wave * 0.75);
        col = mix(film, tint, g * (0.75 + wave * 0.2));
        a = 0.3 + g * (0.42 + wave * 0.15);
        gl = g * wave * 0.45;
      } else {
        // deep frosted: milky mint; only a green glow comes through, more toward the middle (the cube above it, the column under it)
        float nearC = 1.0 - smoothstep(0.4, 2.2, rad);
        float g = (smoothstep(0.015, 0.08, s2) * inner * 0.75 + nearC * 0.35) * (0.4 + uGlow * 0.7 + wave * 0.9);
        col = mix(film, GDEEP, clamp(g * 0.7, 0.0, 0.8));
        a = 0.36 + clamp(g, 0.0, 1.0) * 0.3;
        gl = g * 0.2;
      }
      // the base's dot grid (the drawing's green rings, F4)
      if (uDots > 0.5) {
        vec2 c = q / 0.866; vec2 f = (fract(c) - 0.5) * 0.866;
        float ring = exp(-pow((length(f * vec2(1.0, 1.0)) - 0.055) / 0.011, 2.0)) * step(abs(c.x), 3.05) * step(abs(c.y), 3.05) * smoothstep(0.05, 0.15, dOut);
        col = mix(col, GDEEP, ring * 0.5); a = max(a, ring * 0.55);
      }
      // the rims: a fine bright line just inside each edge of the top, the glass's mint body at the very edge
      float hl = exp(-pow((rimD - 0.045) / 0.02, 2.0));
      col = mix(col, vec3(1.0), hl * 0.85 * top);
      a = max(a, hl * 0.6 * top);
      float edge = (1.0 - smoothstep(0.0, 0.028, rimD)) * top;
      col = mix(col, mix(PAPER, GREEN, 0.5), edge * 0.7); a = max(a, edge * 0.55);
      // the plate above: its soft shadow (lighter where its hole is)
      if (uShadow.x > 0.0) {
        vec2 s = q + uKey * uShadow.z;
        float sh = (1.0 - smoothstep(-0.18, 0.3, sq(s) - uShadow.x)) * (uShadow.y > 0.0 ? smoothstep(-0.15, 0.2, sq(s) - uShadow.y) : 1.0);
        col *= 1.0 - sh * 0.07 * top; a += sh * 0.05 * top;
      }
      // the sides: the glass seen through its thickness, mint, lit by the green inside; a fine light line along their top
      if (top < 0.5) {
        float yl = vWP.y - uY;
        col = mix(sideC, GREEN, uLevel * 0.05 + uGlow * 0.08 + wave * 0.15);
        col = mix(col, vec3(0.92, 1.0, 0.97), exp(-pow((yl - 0.02) / 0.012, 2.0)) * 0.5);
        a = 0.86; gl = 0.05 + wave * 0.25 + uLevel * uGlow * 0.08;
      }
    } else {
      // ── the glass column: mint body; inside it only soft green pulses of the data, rising; the proof's pulse runs up it ──
      float u = (abs(vLN.x) > 0.5 ? vLP.z : vLP.x) / 1.207 + 0.5;
      vec2 uv = vec2(u * 0.35 + (abs(vLN.x) > 0.5 ? 0.37 : 0.11), vWP.y / (uCell * ${ROWS.toFixed(1)}) * 0.9 - uT * uFlow * 0.05);
      float s2 = smoothstep(0.03, 0.09, texture2D(tGlow, uv.yx).r);
      float mid = 1.0 - pow(abs(u - 0.5) * 2.0, 2.0);
      float pulse = exp(-pow((vWP.y - uPulseY) / 0.55, 2.0)) * uPulse;
      float g = s2 * (0.25 + uGlow * 0.6) * mid + pulse * (0.5 + mid * 0.6);
      col = mix(sideC, GDEEP, clamp(g * 0.6, 0.0, 0.85));
      float edge = exp(-pow((min(u, 1.0 - u) - 0.06) / 0.025, 2.0));
      col = mix(col, vec3(1.0), edge * 0.6 * (1.0 - top));
      if (top > 0.5) col = mix(mix(PAPER, GREEN, 0.15), GDEEP, pulse * 0.5);
      a = top > 0.5 ? 0.5 : 0.8;
      gl = g * 0.22 + pulse * 0.5;
    }
    if (uBloom > 0.5) { gl_FragColor = vec4(GREEN * gl * uOp, 1.0); return; }
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * uOp);
  }`;

export type GlassUniforms = { [k: string]: THREE.IUniform };
/** a glass material (one per piece). Its `opacity` drives the shader's fade (the piece's fade writes it) */
export function glassMaterial(d: Data, mode: 0 | 1, cell: number, shared: GlassUniforms = {}) {
  const u: GlassUniforms = {
    tSharp: { value: d.sharp }, tSoft: { value: d.soft }, tGlow: { value: d.glow },
    uMode: { value: mode }, uLevel: { value: 0 }, uOp: { value: 1 }, uBloom: { value: 0 }, uT: { value: 0 }, uCell: { value: cell },
    uHalf: { value: 1 }, uHole: { value: 0 }, uY: { value: 0 }, uWave: { value: -9 }, uLit: { value: 0 }, uGlow: { value: 0 },
    uPulseY: { value: -99 }, uPulse: { value: 0 }, uFlow: { value: 0.6 }, uDots: { value: 0 }, uBand: { value: 0 },
    uShadow: { value: new THREE.Vector3(0, 0, 0) }, uKey: { value: new THREE.Vector2(0.327, 0.573) },
    ...shared,
  };
  const m = new THREE.ShaderMaterial({
    uniforms: u, vertexShader: GLASS_VS, fragmentShader: GLASS_FS,
    transparent: true, depthWrite: false, side: THREE.FrontSide, clipping: true,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  });
  m.userData.glass = true;
  let op = 1;
  Object.defineProperty(m, "opacity", { get: () => op, set: (v: number) => { op = v; u.uOp.value = v; }, configurable: true });
  return m;
}
