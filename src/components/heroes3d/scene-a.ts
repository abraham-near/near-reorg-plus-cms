// Hero A · "Light room": a dark room with a low haze and a wet floor, standing light tubes at many depths, out of focus in the distance, all white but one,
// the green one, nearest the headline's right. They switch on, flickering like fluorescent tubes, a few with each word of the cycle; the green one comes
// on last, on "by design", and its light runs across the floor. The pointer tilts the camera a little; scrolling walks it in between the tubes.
// Cheap on the GPU: no lights, no shadows; every glow is a soft texture on a sprite, the reflections are the tubes mirrored under a dark, half-clear floor.
import * as THREE from "three";
import { type Mount, GREEN, glow, damp, hash, ease, frameView, free, reduced, stage } from "./common";

/* the tubes: x, z (depth, negative is away), height; the last is the green one */
const TUBES: [number, number, number][] = [
  [-6.4, -2.6, 3.4], [-5.2, -4.4, 2.4], [-3.8, -3.2, 3.1], [-2.3, -6.8, 2.6], [-0.9, -4.6, 3.3], [0.5, -7.8, 2.2], [1.1, -2.4, 2.9],
  [2.0, -5.4, 2.5], [-7.8, -7.0, 2.5], [5.0, -3.8, 2.3], [5.9, -1.6, 3.2], [7.1, -5.2, 2.8], [8.2, -7.6, 2.6], [-1.6, -9.6, 2.4],
  [3.8, -8.8, 2.3], [-4.6, -9.0, 2.7], [4.3, -0.4, 2.7],
  [2.6, -0.9, 4.2],
];
const WHITE = new THREE.Color("#eef3f1");
const LIFT = 0.14;   // the stand under each tube

const HAZE_VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const HAZE_FS = /* glsl */ `
  uniform float t; uniform float a; uniform float seed; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + seed) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + 1.), f.x), f.y); }
  float fbm(vec2 p){ float v = 0., s = .5; for (int k = 0; k < 5; k++) { v += s * n(p); p *= 2.03; s *= .5; } return v; }
  void main(){
    vec2 p = vUv * vec2(4., 1.4);
    float q = fbm(p * 1.6 - vec2(t * .018, t * .006));
    float f = fbm(p + vec2(t * .025, 0.) + q);
    float band = smoothstep(0., .3, vUv.y) * smoothstep(.85, .2, vUv.y);
    float edge = smoothstep(0., .18, vUv.x) * smoothstep(1., .82, vUv.x);
    gl_FragColor = vec4(vec3(f * f * a * band * edge), 1.);
  }`;

export const mount: Mount = (canvas, section) => {
  const rm = reduced();
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050505, 0.05);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);

  const capsule = glow("capsule"), streak = glow("streak"), round = glow("round");
  const coreGeo = new THREE.CylinderGeometry(0.045, 0.045, 1, 14);
  const standGeo = new THREE.BoxGeometry(0.4, 0.012, 0.03);
  const standMat = new THREE.MeshBasicMaterial({ color: 0x161616 });

  type Tube = { core: THREE.MeshBasicMaterial; halo: THREE.SpriteMaterial; mirror: THREE.MeshBasicMaterial; mhalo: THREE.SpriteMaterial; pool: THREE.MeshBasicMaterial;
    color: THREE.Color; at: number; level: number; id: number };
  const tubes: Tube[] = [];
  const room = new THREE.Group(), under = new THREE.Group();
  scene.add(under, room);

  TUBES.forEach(([x, z, hgt], id) => {
    const green = id === TUBES.length - 1;
    const color = green ? new THREE.Color(GREEN) : WHITE.clone();
    const core = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false });
    const m = new THREE.Mesh(coreGeo, core); m.scale.set(1, hgt, 1); m.position.set(x, LIFT + hgt / 2, z); room.add(m);
    const halo = new THREE.SpriteMaterial({ map: capsule, color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const s = new THREE.Sprite(halo); s.scale.set(green ? 1.5 : 1.1, hgt * 1.35, 1); s.position.copy(m.position); room.add(s);
    // its stand: three short legs
    for (let k = 0; k < 3; k++) { const leg = new THREE.Mesh(standGeo, standMat); leg.position.set(x, 0.01, z); leg.rotation.y = (k * Math.PI * 2) / 3; leg.translateX(0.17); room.add(leg); }
    // the reflection: the tube mirrored under the floor, its glow stretched into a streak
    const mirror = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false, transparent: true, opacity: 0.55 });
    const mm = new THREE.Mesh(coreGeo, mirror); mm.scale.set(1, hgt, 1); mm.position.set(x, -(LIFT + hgt / 2), z); under.add(mm);
    const mhalo = new THREE.SpriteMaterial({ map: streak, color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const ms = new THREE.Sprite(mhalo); ms.center.set(0.5, 1); ms.scale.set(green ? 0.9 : 0.6, hgt * 1.9, 1); ms.position.set(x, -0.02, z + 0.01); under.add(ms);
    // the light on the floor around its foot
    const pool = new THREE.MeshBasicMaterial({ map: round, color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), pool); pm.rotation.x = -Math.PI / 2; pm.scale.setScalar(green ? 4.2 : 2.2); pm.position.set(x, 0.006, z); room.add(pm);
    tubes.push({ core, halo, mirror, mhalo, pool, color, at: -1, level: 0, id });
  });

  // the floor: dark and half clear, so the mirrored tubes show through it as reflections
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshBasicMaterial({ color: 0x060606, transparent: true, opacity: 0.8, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2; floor.renderOrder = 1; room.add(floor);
  room.children.forEach((c) => { if (c !== floor) c.renderOrder = 2; });

  // the green light's line across the floor, towards the viewer (it grows on "by design")
  const beamMat = new THREE.MeshBasicMaterial({ map: round, color: GREEN, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), beamMat); beam.rotation.x = -Math.PI / 2; beam.position.set(2.6, 0.008, 3); beam.scale.set(0.9, 0.01, 1);
  beam.renderOrder = 2; room.add(beam);

  // the haze: two broad bands of slow noise, one far, one nearer, brighter as more tubes are on
  const hazes = [-9, -4].map((z, k) => {
    const mat = new THREE.ShaderMaterial({ vertexShader: HAZE_VS, fragmentShader: HAZE_FS, uniforms: { t: { value: 0 }, a: { value: 0 }, seed: { value: k * 13.1 } },
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(30, 6.5), mat); m.position.set(0, 2.4, z); m.renderOrder = 3; room.add(m);
    return mat;
  });

  /* which tubes each word switches on: a few, far and near mixed, the green one last */
  const order = TUBES.slice(0, -1).map((_, i) => i).sort((a, b) => hash(a * 7.7) - hash(b * 7.7));
  let target = 0, settled = false;
  const switchOn = (n: number, t: number) => {
    for (let k = 0; k < n && k < order.length; k++) { const tb = tubes[order[k]]; if (tb.at < 0) tb.at = t + k * 0.06 * (rm ? 0 : 1); }
  };

  const st = stage(canvas, section, { clear: "#050505", exposure: 1 }, camera,
    (w, h, wide) => { camera.aspect = w / h; camera.fov = wide ? 30 : 42; camera.updateProjectionMatrix(); frameView(camera, w, h, wide, 0.1, 0.18); },
    (f) => {
      // three tubes on at once, then the rest as the words go by
      if (!settled) { switchOn(Math.max(3, target), f.t); }
      for (const tb of tubes) {
        let lv = 0;
        if (tb.at >= 0 && f.t >= tb.at) {
          const age = f.t - tb.at;
          // a fluorescent tube's start: a few blinks over 0.45 s, then steady
          lv = rm || age > 0.45 ? 1 : hash(Math.floor(age * 22) + tb.id * 31) > 0.45 ? 0.9 : 0.08;
        }
        tb.level = lv;
        const c = tb.color, g = tb.id === TUBES.length - 1 ? 1.25 : 1;
        tb.core.color.copy(c).multiplyScalar(lv * 1.6 * g);
        tb.mirror.color.copy(c).multiplyScalar(lv * 0.9);
        tb.halo.opacity = lv * 0.55 * g;
        tb.mhalo.opacity = lv * 0.32 * g;
        tb.pool.opacity = lv * 0.22 * g;
      }
      const lit = tubes.reduce((s, tb) => s + tb.level, 0) / tubes.length;
      const green = tubes[tubes.length - 1];
      beamMat.opacity = damp(beamMat.opacity, green.level * 0.5, 2, f.dt || 1);
      beam.scale.y = damp(beam.scale.y, green.level ? 7 : 0.01, rm ? 50 : 1.2, f.dt || 1);
      beam.position.z = -0.9 + beam.scale.y / 2;
      hazes.forEach((h, k) => { h.uniforms.t.value = f.t + k * 40; h.uniforms.a.value = 0.05 + lit * (k ? 0.14 : 0.22); });

      // the camera: a slow push in over the first seconds, the pointer's tilt, then a walk in between the tubes as the hero scrolls away
      const push = rm ? 1 : ease.outCubic(f.t / 9);
      camera.position.set(f.px * 0.45, 1.5 - f.py * 0.18 + f.p * 0.25, 10.2 - push * 0.9 - f.p * 6.5);
      camera.lookAt(0.6 + f.px * 0.15, 1.75, -3 - f.p * 4);
    });

  st.run(scene);
  return {
    step(i, last) {
      // back to the first word (the hero left the screen and came back): the room goes dark and plays again
      if (i === 0 && settled) { settled = false; for (const tb of tubes) tb.at = -1; }
      // each word lights about two more tubes; the green one waits for the last word
      target = 3 + Math.round((i / Math.max(1, last)) * (order.length - 3));
      switchOn(target, st.f.t);
      if (i >= last) { settled = true; switchOn(order.length, st.f.t); if (green().at < 0) green().at = st.f.t + (rm ? 0 : 0.5); }
      function green() { return tubes[tubes.length - 1]; }
    },
    dispose() { st.dispose(); free(scene); capsule.dispose(); streak.dispose(); round.dispose(); },
  };
};
