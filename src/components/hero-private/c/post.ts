// Study C's post-processing for the ring (./scene.ts), after the repo's bloom (../../heroes3d/post.ts) but selective, so the paper and the white blocks
// never bloom, only the green light:
//   · the glow's source is drawn on its own, at half size: first everything solid on the OCC layer in plain black (it hides the light behind it), then
//     what glows on the GLOW layer with its own materials (rails, the energy, the sealed cube; `uGlowPass` = 1 tones the rails' resting green down);
//     three's UnrealBloomPass blurs it (its mips start at a quarter size) and the blur alone is added to the frame;
//   · the frame: the scene (HalfFloat target) → depth of field (BokehPass, only while the camera moves: the intro, the exit; off at rest) → the mix (bloom,
//     a faint vignette and film grain) → output (sRGB) → SMAA (displays under 1.75 dpr; on denser ones the pixels do it).
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";

export const OCC = 1, GLOW = 2;

const MIX = {
  uniforms: {
    tDiffuse: { value: null }, tBloom: { value: null }, uBloom: { value: 1 }, uGrain: { value: 0 }, uVig: { value: 0 }, uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) }, uCenter: { value: new THREE.Vector2(0.75, 0.5) },
  },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: /* glsl */ `
uniform sampler2D tDiffuse, tBloom; uniform float uBloom, uGrain, uVig, uTime; uniform vec2 uRes, uCenter; varying vec2 vUv;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec3 col = texture2D(tDiffuse, vUv).rgb + texture2D(tBloom, vUv).rgb * uBloom;
  vec2 d = (vUv - uCenter) * vec2(uRes.x / uRes.y, 1.0);
  col *= 1.0 - uVig * smoothstep(0.45, 1.5, length(d));
  col += (h(floor(vUv * uRes) + fract(uTime) * vec2(113.1, 71.7)) - 0.5) * uGrain;
  gl_FragColor = vec4(col, 1.0);
}`,
};

export type Post = ReturnType<typeof createPost>;
export function createPost(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, glowPass: { value: number },
  opts: { dof: boolean }) {
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const bokeh = opts.dof ? new BokehPass(scene, camera, { focus: 100, aperture: 0, maxblur: 0.006 }) : null;
  if (bokeh) { bokeh.enabled = false; composer.addPass(bokeh); }
  const mix = new ShaderPass(MIX);
  composer.addPass(mix);
  composer.addPass(new OutputPass());
  const smaa = new SMAAPass();
  composer.addPass(smaa);

  // the glow's source and its blur
  const glowRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.3, 0);
  const black = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const clear = new THREE.Color();
  const drawGlow = () => {
    const mask = camera.layers.mask, ac = renderer.autoClear, ca = renderer.getClearAlpha();
    renderer.getClearColor(clear);
    renderer.autoClear = false;
    renderer.setRenderTarget(glowRT); renderer.setClearColor(0x000000, 1); renderer.clear();
    camera.layers.set(OCC); scene.overrideMaterial = black; renderer.render(scene, camera);
    camera.layers.set(GLOW); scene.overrideMaterial = null; glowPass.value = 1; renderer.render(scene, camera); glowPass.value = 0;
    camera.layers.mask = mask; renderer.autoClear = ac; renderer.setClearColor(clear, ca); renderer.setRenderTarget(null);
    bloom.render(renderer, glowRT, glowRT, 0, false);
    mix.uniforms.tBloom.value = bloom.renderTargetsHorizontal[0].texture;
  };

  return {
    mix: mix.uniforms, bloom, bokeh,
    setSize(w: number, h: number, pr: number) {
      composer.setPixelRatio(pr); composer.setSize(w, h);
      smaa.enabled = pr < 1.75;
      const gw = Math.max(1, Math.round((w * pr) / 2)), gh = Math.max(1, Math.round((h * pr) / 2));
      glowRT.setSize(gw, gh); bloom.setSize(gw, gh);
      mix.uniforms.uRes.value.set(w * pr, h * pr);
    },
    render(shadows: () => void) {
      drawGlow();
      shadows();   // the shadow map is drawn once a frame, with the scene itself (not by the glow's two draws)
      composer.render();
    },
    dispose() {
      bloom.dispose(); bokeh?.dispose(); smaa.dispose(); mix.dispose(); glowRT.dispose(); black.dispose();
      composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); composer.dispose();
    },
  };
}
