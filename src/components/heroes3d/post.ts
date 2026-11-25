// The glow over the light scenes (D, F): three's UnrealBloomPass between the scene and the output (which applies the tone mapping and sRGB), so the lit
// lines and beams bleed into the dark around them as a lens would. Kept in its own module so the studies without it (A, B, C, E) don't load it.
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

export function bloom(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, strength: number, radius: number, threshold: number) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const pass = new UnrealBloomPass(new THREE.Vector2(256, 256), strength, radius, threshold);
  composer.addPass(pass);
  composer.addPass(new OutputPass());
  const v = new THREE.Vector2();
  const size = () => { renderer.getSize(v); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(v.x, v.y); };
  size();
  return { pass, size, draw: () => composer.render(), dispose() { pass.dispose(); composer.dispose(); } };
}
