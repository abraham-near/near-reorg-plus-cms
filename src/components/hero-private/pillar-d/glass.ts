// Hero study "Pillar D"'s data and its diffusion (the technique of /hero-h, "Veils", ../../heroes3d/scene-h.ts): each frame the data's picture is drawn
// once, sharp, into a texture (rows of glyphs in a 32 × 32 grid that tiles), then blurred twice at lower resolutions: a little (the rows run together)
// and a lot (only a glow is left). Everything that shows data samples one of the three by its own planar coordinates, so the frost reads the same on
// any GPU (no transmission, no depth of field):
//   · the column below the frame (the public chain) prints the sharp picture on its two seen faces, in ink, rising;
//   · the three panes inside the frame show it sharp (clear), soft (frosted), as a green glow (deep frosted);
//   · the column above the frame (frosted glass) carries only the glow, green.
// Glyph styles (`?glyph=`): "hex", legible (hex words, bit rows, chained-block marks: monospace, drawn once into an atlas), or "abstract", short
// dashes and ticks of the same rhythm, no characters. The pillar's default is abstract.
import * as THREE from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";

export type Glyph = "hex" | "abstract";
export const CELLS = 32;                      // the picture: CELLS × CELLS glyph cells, tiling

const QUAD_VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";

/** the glyph atlas: 8 × 4 cells of 64 px, white on transparent. hex: 0–f, then block marks; abstract: dashes and ticks */
function atlas(style: Glyph) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 256;
  const x = c.getContext("2d")!;
  x.fillStyle = x.strokeStyle = "#fff"; x.lineWidth = 5; x.lineCap = "round";
  const at = (i: number) => [(i % 8) * 64 + 32, Math.floor(i / 8) * 64 + 32] as const;
  if (style === "hex") {
    x.font = "600 46px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"; x.textAlign = "center"; x.textBaseline = "middle";
    "0123456789abcdef".split("").forEach((ch, i) => { const [cx, cy] = at(i); x.fillText(ch, cx, cy + 2); });
    { const [cx, cy] = at(16); x.fillRect(cx - 15, cy - 15, 30, 30); }                                               // a block
    { const [cx, cy] = at(17); x.strokeRect(cx - 14, cy - 14, 28, 28); }                                             // an empty one
    { const [cx, cy] = at(18); x.fillRect(cx - 30, cy - 11, 22, 22); x.fillRect(cx + 8, cy - 11, 22, 22); x.fillRect(cx - 10, cy - 3, 20, 6); } // chained
    { const [cx, cy] = at(19); x.fillRect(cx - 32, cy - 3, 64, 6); }                                                 // a link
    { const [cx, cy] = at(20); x.fillText("#", cx, cy + 2); }
    { const [cx, cy] = at(21); x.beginPath(); x.moveTo(cx, cy - 17); x.lineTo(cx + 17, cy); x.lineTo(cx, cy + 17); x.lineTo(cx - 17, cy); x.closePath(); x.stroke(); }
  } else {
    // the same rhythm without characters: dashes of four lengths, a tick, a dot, a double dash
    const dash = (i: number, w: number) => { const [cx, cy] = at(i); x.fillRect(cx - w / 2, cy - 4, w, 8); };
    for (let i = 0; i < 16; i++) dash(i, [22, 34, 46, 58][i % 4]);
    { const [cx, cy] = at(16); x.fillRect(cx - 4, cy - 14, 8, 28); }
    { const [cx, cy] = at(17); x.beginPath(); x.arc(cx, cy, 6, 0, Math.PI * 2); x.fill(); }
    { const [cx, cy] = at(18); x.fillRect(cx - 30, cy - 4, 24, 8); x.fillRect(cx + 6, cy - 4, 24, 8); }
    dash(19, 64); dash(20, 40);
    { const [cx, cy] = at(21); x.fillRect(cx - 16, cy - 4, 32, 8); x.fillRect(cx - 4, cy - 12, 8, 24); }
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

// the sharp picture: each row is hex words (groups of four), bits (groups of eight) or a chain of blocks; glyphs re-roll now and then (the data changes)
const SRC_FS = /* glsl */ `
  uniform sampler2D atlas; uniform float t; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main(){
    float N = ${CELLS.toFixed(1)};
    vec2 g = vUv * N; vec2 cell = floor(g); vec2 f = fract(g);
    float r = cell.y, c = cell.x;
    float kind = h(vec2(r, 1.7));
    float roll = floor(t * (0.25 + h(vec2(c, r)) * 0.9) + h(vec2(r, c)) * 7.0);
    float rnd = h(vec2(c, r) + roll * 0.173);
    float gi, on;
    if (kind < 0.5) { on = step(mod(c, 5.0), 3.5); gi = floor(rnd * 16.0); }                                                         // hex words
    else if (kind < 0.82) { on = step(mod(c, 9.0), 7.5); gi = step(0.5, rnd); }                                                        // bits
    else { float m = mod(c, 4.0); on = step(m, 2.5); gi = m < 0.5 ? 16.0 + step(0.6, rnd) : m < 1.5 ? 19.0 : (rnd < 0.5 ? 18.0 : 16.0 + floor(rnd * 6.0)); }   // chains
    on *= step(0.12, h(vec2(r * 3.1, floor(c / 5.0) + roll * 0.01)));        // a few gaps
    on *= step(0.08, h(vec2(r, 9.0)));                                       // a few blank rows
    on *= step(0.38, h(vec2(floor(r / 3.0), floor(c / 8.0) + 0.5)));         // packets: blocks of rows, blank between them
    vec2 a = (vec2(mod(gi, 8.0), floor(gi / 8.0)) + vec2(f.x, 1.0 - f.y) * 0.86 + 0.07) / vec2(8.0, 4.0);
    float v = texture2D(atlas, vec2(a.x, 1.0 - a.y)).a * on;
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
export function data(renderer: THREE.WebGLRenderer, style: Glyph, lite: boolean) {
  const S = lite ? 384 : 512;
  const rt = (n: number, mips = false) => {
    const r = new THREE.WebGLRenderTarget(n, n, {
      type: THREE.UnsignedByteType, depthBuffer: false, generateMipmaps: mips,
      minFilter: mips ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter, magFilter: THREE.LinearFilter,
    });
    r.texture.wrapS = r.texture.wrapT = THREE.RepeatWrapping;
    return r;
  };
  const sharp = rt(S, true), s1 = rt(S / 2), s2 = rt(S / 2), g1 = rt(64), g2 = rt(64);
  const at = atlas(style);
  const srcMat = new THREE.ShaderMaterial({ vertexShader: QUAD_VS, fragmentShader: SRC_FS, uniforms: { atlas: { value: at }, t: { value: 0 } } });
  const blurU = { tex: { value: null as THREE.Texture | null }, dir: { value: new THREE.Vector2() } };
  const blurMat = new THREE.ShaderMaterial({ vertexShader: QUAD_VS, fragmentShader: BLUR_FS, uniforms: blurU });
  const quad = new FullScreenQuad(srcMat);
  const pass = (mat: THREE.ShaderMaterial, to: THREE.WebGLRenderTarget) => { quad.material = mat; renderer.setRenderTarget(to); quad.render(renderer); };
  const blur = (from: THREE.WebGLRenderTarget, a: THREE.WebGLRenderTarget, b: THREE.WebGLRenderTarget, spreads: number[]) => {
    let src = from;
    for (const s of spreads) {
      blurU.tex.value = src.texture; blurU.dir.value.set(s / a.width, 0); pass(blurMat, a);
      blurU.tex.value = a.texture; blurU.dir.value.set(0, s / a.width); pass(blurMat, b);
      src = b;
    }
  };
  let lastT = -1;
  return {
    sharp: sharp.texture, soft: s2.texture, glow: g2.texture,
    update(t: number) {
      // the glyphs re-roll slowly: redraw ~20 times a second at most
      const q = Math.floor(t * 20) / 20;
      if (q === lastT) return; lastT = q;
      const prev = renderer.getRenderTarget();
      srcMat.uniforms.t.value = q;
      pass(srcMat, sharp);
      blur(sharp, s1, s2, [0.9, 1.3]);            // frosted: the glyphs run together into soft rows
      blur(s2, g1, g2, [1, 1.8, 2.4]);            // frosted deep: only a glow is left
      renderer.setRenderTarget(prev);
    },
    dispose() { for (const r of [sharp, s1, s2, g1, g2]) r.dispose(); at.dispose(); srcMat.dispose(); blurMat.dispose(); quad.dispose(); },
  };
}

/* ── the glass ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
// One shader for every piece of glass, on light paper: a milky film whose three faces take the drawing's greys (lighter: glass), mint at its edges,
// a fine highlight along its rims, the data's level for its role, green light from inside. `mode`: 0 a pane, 1 the column's frosted segments,
// 2 the frame's tubes and the satellites' leaves. In the bloom pass (uBloom) it draws only its green light, added.
const GLASS_VS = /* glsl */ `
  #include <clipping_planes_pars_vertex>
  varying vec3 vWP; varying vec3 vWN; varying vec3 vLP; varying vec3 vLN; varying vec3 vV;
  void main(){
    vLP = position; vLN = normal;
    vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; vWN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    vec4 mvPosition = viewMatrix * wp;
    #include <clipping_planes_vertex>
    gl_Position = projectionMatrix * mvPosition;
  }`;
const GLASS_FS = /* glsl */ `
  uniform sampler2D tSharp, tSoft, tGlow;
  uniform float uMode, uLevel, uOp, uBloom, uT, uCell, uHalf, uHole, uGain, uWave, uLit, uGlow, uHot, uPulseY, uPulse, uDrift, uFlow;
  uniform vec3 uShadow;   // the pane above: its half side, its hole's half side, its height above (a soft shadow on this one)
  uniform vec2 uKey;      // the key light's slant (the shadow's offset per unit of height)
  varying vec3 vWP; varying vec3 vWN; varying vec3 vLP; varying vec3 vLN; varying vec3 vV;
  #include <clipping_planes_pars_fragment>
  const vec3 INK = vec3(0.067), GREEN = vec3(0.0, 0.862, 0.553), GDEEP = vec3(0.043, 0.784, 0.514);
  float sq(vec2 p){ return max(abs(p.x), abs(p.y)); }
  void main(){
    #include <clipping_planes_fragment>
    vec3 n = normalize(vWN);
    float top = step(0.5, abs(vLN.y));
    // the drawing's three faces, lighter for glass: top, left (+Z), right (+X)
    vec3 face = top > 0.5 ? vec3(1.0) : (abs(n.z) > abs(n.x) ? vec3(0.965, 0.975, 0.97) : vec3(0.93, 0.945, 0.94));
    vec3 col; float a; float gl = 0.0;
    if (uMode < 0.5) {
      // ── a pane ──
      vec2 q = vLP.xz;
      float dOut = uHalf - sq(q), dIn = sq(q) - uHole;
      float rimD = min(dOut, dIn);
      float inner = smoothstep(0.1, 0.32, dOut) * smoothstep(0.08, 0.26, dIn);        // the data keeps off the rims
      vec2 uv = (q + vec2(uT * uDrift, 0.0)) / (uCell * ${CELLS.toFixed(1)});
      float s0 = smoothstep(0.1, 0.5, texture2D(tSharp, uv, -0.5).r), s1 = texture2D(tSoft, uv).r, s2 = texture2D(tGlow, uv).r;
      float rad = sq(q);
      float wave = exp(-pow((rad - uWave) / 0.45, 2.0)) * uLit;                         // the crossing: light spreads out from the column
      float nearC = 1.0 - smoothstep(uHole, uHole + 1.6, rad);                         // the core's light, strongest by the hole
      if (uLevel < 0.5) {
        // clear: a thin film; the data sharp, in ink (green where the light passes)
        float g = s0 * inner;
        col = mix(face, mix(INK, GDEEP * 0.9, clamp(wave * 1.4, 0.0, 1.0)), g * 0.92);
        a = 0.2 + g * (0.6 + wave * 0.25);
        gl = g * wave * 0.6;
      } else if (uLevel < 1.5) {
        // frosted: whiter; the data soft, grey going green
        float g = smoothstep(0.01, 0.12, s1) * inner;
        vec3 tint = mix(vec3(0.42, 0.5, 0.46), GDEEP, 0.25 + wave * 0.6);
        col = mix(face * vec3(0.985, 0.995, 0.99), tint, g * (0.6 + wave * 0.3));
        a = 0.62 + g * 0.25;
        gl = g * wave * 0.5;
      } else {
        // deep frosted: milky; only a green glow comes through, more by the core
        float g = (smoothstep(0.03, 0.068, s2) * inner * 0.8 + nearC * 0.35) * (0.45 + uGlow * 0.6 + wave * 0.8);
        col = mix(face * vec3(0.98, 0.995, 0.99), GDEEP, clamp(g * 0.6, 0.0, 0.8));
        a = 0.74 + clamp(g, 0.0, 1.0) * 0.16;
        gl = g * 0.22;
      }
      // the rims: a fine bright line just inside each edge, the glass's mint body at the very edge
      float hl = exp(-pow((rimD - 0.05) / 0.022, 2.0));
      col = mix(col, vec3(1.0), hl * 0.9 * top);
      col = mix(col, vec3(0.8, 0.93, 0.87), (1.0 - smoothstep(0.0, 0.03, rimD)) * 0.6 * top);
      a = max(a, hl * 0.55 * top);
      // the pane above: its soft shadow (lighter where its hole is)
      if (uShadow.x > 0.0) {
        vec2 s = q + uKey * uShadow.z;
        float sh = (1.0 - smoothstep(-0.12, 0.22, sq(s) - uShadow.x)) * smoothstep(-0.12, 0.22, sq(s) - uShadow.y);
        col *= 1.0 - sh * 0.055 * top; a += sh * 0.05 * top;
      }
      // the sides: the glass seen through its thickness, mint, lit by the green inside
      if (top < 0.5) { col = mix(vec3(0.78, 0.93, 0.86), GREEN, 0.12 + uLevel * 0.08 + uGlow * 0.1); a = 0.88; gl = uLevel * 0.2; }
    } else if (uMode < 1.5) {
      // ── the column's frosted glass: a milky body; inside it only soft green pulses of the data, rising; the proof's pulse runs up it ──
      float u = (abs(vLN.x) > 0.5 ? vLP.z : vLP.x) / ${(0.88).toFixed(2)} + 0.5;
      vec2 uv = vec2(u * 2.7 + (abs(vLN.x) > 0.5 ? 11.0 : 3.0), vWP.y / uCell - uT * uFlow) / ${CELLS.toFixed(1)};
      float s2 = smoothstep(0.035, 0.068, texture2D(tGlow, uv).r);
      float mid = 1.0 - pow(abs(u - 0.5) * 2.0, 2.0);                                   // brightest down the middle of a face (light inside)
      float pulse = exp(-pow((vWP.y - uPulseY) / 0.5, 2.0)) * uPulse;
      float g = s2 * s2 * (0.25 + uGlow * 0.55) * mid + pulse * (0.55 + mid * 0.6);
      col = mix(face * vec3(0.975, 0.99, 0.985), GDEEP, clamp(g * 0.7, 0.0, 0.9));
      float edge = exp(-pow((min(u, 1.0 - u) - 0.07) / 0.03, 2.0));
      col = mix(col, vec3(1.0), edge * 0.8 * (1.0 - top));
      if (top > 0.5) col = mix(vec3(0.86, 0.95, 0.91), GDEEP, 0.1 + pulse * 0.5);
      a = 0.9;
      gl = (g - pulse * 0.6) * 0.18 + pulse * 0.7;
    } else {
      // ── the frame's tubes and the leaves: a light mint glass, a soft hint of the data, green when the energy passes ──
      vec2 uv = (vWP.xz + vWP.y * 0.5) / (uCell * ${CELLS.toFixed(1)});
      float s1 = texture2D(tSoft, uv).r;
      col = mix(face * vec3(0.9, 0.975, 0.94), GREEN, 0.1 + s1 * 0.12 + uHot * 0.45);
      float fr = pow(1.0 - abs(dot(n, normalize(vV))), 2.0);
      col = mix(col, vec3(1.0), fr * 0.25);
      a = 0.5 + uHot * 0.2;
      gl = uHot * 0.7 + s1 * 0.05;
    }
    if (uBloom > 0.5) { gl_FragColor = vec4(GREEN * gl * uOp, 1.0); return; }
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * uOp);
  }`;

export type GlassUniforms = { [k: string]: THREE.IUniform };
/** a glass material (one per piece). Its `opacity` drives the shader's fade (the piece's fade writes it) */
export function glassMaterial(d: Data, mode: 0 | 1 | 2, cell: number, shared: GlassUniforms = {}) {
  const u: GlassUniforms = {
    tSharp: { value: d.sharp }, tSoft: { value: d.soft }, tGlow: { value: d.glow },
    uMode: { value: mode }, uLevel: { value: 0 }, uOp: { value: 1 }, uBloom: { value: 0 }, uT: { value: 0 }, uCell: { value: cell },
    uHalf: { value: 1 }, uHole: { value: 0.5 }, uGain: { value: 0 }, uWave: { value: -9 }, uLit: { value: 0 }, uGlow: { value: 0 }, uHot: { value: 0 },
    uPulseY: { value: -99 }, uPulse: { value: 0 }, uDrift: { value: 0.05 }, uFlow: { value: 0.6 },
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
