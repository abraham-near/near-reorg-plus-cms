// Hero D · "The N of light": a dark room, a low haze, far light tubes out of focus (A's room, at a distance), and in front of them the NEAR mark as a slab
// of black glass standing on a wet floor, its outline a green neon line. On load a point of light draws the outline once, like a long exposure; each word
// of the cycle sends a comet of white light around it (more of the far tubes come on); on "by design" the whole line burns green and its light pools on
// the floor. Scrolling (the hero is pinned for 1.6 screens): the camera walks in and through the N, and beyond it the Stack's pillar is built of six
// cubes, dropping in one by one, while the view rises to the Stack drawing's isometric angle; then the screen closes to the Stack band's ink.
import * as THREE from "three";
import { type Mount, GREEN, STACK, glow, nMark, nOutline, studio, damp, hash, ease, clamp, frameView, free, reduced, stage } from "./common";
import { bloom } from "./post";

const SIZE = 3, DEPTH = 0.28, LIFT = 0.35, CY = LIFT + SIZE / 2;   // the mark: its height, thickness, gap above the floor, centre's height
const PILLAR = { x: 0, z: -9, a: 0.62, h: 1 };                     // the Stack's pillar, beyond the mark: its place, a cube's width and height

const LINE_VS = "varying float vS; void main(){ vS = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const LINE_FS = /* glsl */ `
  uniform float head, reveal, on, pulse; uniform vec3 col, hot; varying float vS;
  void main(){
    float drawn = 1.0 - smoothstep(reveal - 0.004, reveal + 0.002, vS);           // the part of the outline already drawn
    float tip = exp(-abs(vS - reveal) * 140.0) * step(0.001, reveal) * step(reveal, 0.999);  // the drawing point
    float comet = exp(-fract(head - vS) * 20.0) * pulse;                          // a light running round, its tail behind it
    vec3 c = col * drawn * on + mix(col, hot, 0.7) * (tip + comet) * 2.4;
    gl_FragColor = vec4(c, 1.0);
  }`;
const HAZE_VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const HAZE_FS = /* glsl */ `
  uniform float t; uniform float a; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + 1.), f.x), f.y); }
  float fbm(vec2 p){ float v = 0., s = .5; for (int k = 0; k < 5; k++) { v += s * n(p); p *= 2.03; s *= .5; } return v; }
  void main(){
    vec2 p = vUv * vec2(4., 1.4);
    float f = fbm(p + vec2(t * .02, 0.) + fbm(p * 1.6 - vec2(t * .015, 0.)));
    float band = smoothstep(0., .3, vUv.y) * smoothstep(.85, .2, vUv.y) * smoothstep(0., .2, vUv.x) * smoothstep(1., .8, vUv.x);
    gl_FragColor = vec4(vec3(f * f * a * band), 1.);
  }`;
const DUST_VS = /* glsl */ `
  uniform float t; attribute float k; varying float vA;
  void main(){
    vec3 p = position; p.y = mod(p.y + t * (0.05 + k * 0.08), 5.5); p.x += sin(t * 0.3 + k * 6.3) * 0.15;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (14.0 + k * 22.0) / -mv.z; vA = 0.25 + k * 0.5;
    gl_Position = projectionMatrix * mv;
  }`;
const DUST_FS = "uniform float a; varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(1.) * smoothstep(.5, 0., d) * vA * a, 1.); }";

export const mount: Mount = (canvas, section, track) => {
  const rm = reduced();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#060606");
  scene.fog = new THREE.FogExp2(0x060606, 0.035);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 90);
  let post: ReturnType<typeof bloom> | null = null;
  const st = stage(canvas, section, { clear: "#060606", exposure: 1.05, track, dpr: 1.5 }, camera,
    (w, h) => { camera.aspect = w / h; camera.updateProjectionMatrix(); post?.size(); }, (f) => frame(f));
  scene.environment = studio(st.renderer);
  scene.environmentIntensity = 0.35;
  post = bloom(st.renderer, scene, camera, 1.05, 0.55, 0.62);

  const capsule = glow("capsule"), round = glow("round");
  const world = new THREE.Group(), mirror = new THREE.Group();
  scene.add(mirror, world);

  /* the mark: black glass, its outline a neon line */
  const slabMat = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0b, roughness: 0.16, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08, transparent: true });
  const slab = new THREE.Mesh(nMark(SIZE, DEPTH, 0.02), slabMat); slab.position.y = CY; world.add(slab);
  const pts = nOutline(SIZE, 700); pts.pop();
  const curve = new THREE.CatmullRomCurve3(pts, true, "centripetal");
  const lineU = { head: { value: 0 }, reveal: { value: 0 }, on: { value: 0 }, pulse: { value: 0 }, col: { value: new THREE.Color(GREEN) }, hot: { value: new THREE.Color(1, 1, 1) } };
  const lineMat = new THREE.ShaderMaterial({ vertexShader: LINE_VS, fragmentShader: LINE_FS, uniforms: lineU, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const line = new THREE.Mesh(new THREE.TubeGeometry(curve, 1400, 0.017, 6, true), lineMat);
  line.position.set(0, CY, DEPTH / 2 + 0.03); line.renderOrder = 2; world.add(line);
  // the light the line throws: a point light that rides the drawing point (or the comet), on the slab's face and the wet floor
  const lamp = new THREE.PointLight(0xc8ffe8, 0, 7, 1.6); world.add(lamp);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: round, color: GREEN, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2; pool.scale.set(7, 4, 1); pool.position.set(0, 0.01, 0.4); pool.renderOrder = 2; world.add(pool);

  // its reflection: the slab and the line mirrored under a dark, half-clear floor
  const mSlab = new THREE.Mesh(slab.geometry, slabMat); mSlab.position.y = -CY; mirror.add(mSlab);
  const mLine = new THREE.Mesh(line.geometry, lineMat); mLine.position.set(0, -CY, line.position.z); mLine.scale.y = -1; mirror.add(mLine);
  mSlab.scale.y = -1;
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.32, metalness: 0.55, transparent: true, opacity: 0.84, depthWrite: false, envMapIntensity: 0.1 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), floorMat); floor.rotation.x = -Math.PI / 2; floor.renderOrder = 1; scene.add(floor);

  /* the room: far tubes out of focus, a haze, dust in the air */
  const far: { m: THREE.SpriteMaterial; at: number; id: number }[] = [];
  for (let i = 0; i < 18; i++) {
    const x = (hash(i * 3.1) - 0.5) * 30, z = -10 - hash(i * 7.7) * 14, hgt = 2 + hash(i * 1.9) * 2.4;
    const m = new THREE.SpriteMaterial({ map: capsule, color: 0xeef3f1, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const s = new THREE.Sprite(m); s.scale.set(1.3, hgt * 1.4, 1); s.position.set(x, hgt / 2 + 0.1, z); world.add(s);
    const ms = new THREE.Sprite(m); ms.scale.set(1.3, hgt * 1.4, 1); ms.position.set(x, -hgt / 2 - 0.1, z); mirror.add(ms);
    far.push({ m, at: -1, id: i });
  }
  const order = far.map((_, i) => i).sort((a, b) => hash(a * 5.3) - hash(b * 5.3));
  const hazes = [-12, -6].map((z) => {
    const mat = new THREE.ShaderMaterial({ vertexShader: HAZE_VS, fragmentShader: HAZE_FS, uniforms: { t: { value: 0 }, a: { value: 0 } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(40, 7), mat); m.position.set(0, 2.6, z); m.renderOrder = 3; world.add(m);
    return mat;
  });
  const N = 520, dp = new Float32Array(N * 3), dk = new Float32Array(N);
  for (let i = 0; i < N; i++) { dp[i * 3] = (hash(i * 1.3) - 0.5) * 14; dp[i * 3 + 1] = hash(i * 2.9) * 5.5; dp[i * 3 + 2] = 4 - hash(i * 4.1) * 16; dk[i] = hash(i * 9.7); }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dp, 3)); dustGeo.setAttribute("k", new THREE.BufferAttribute(dk, 1));
  const dustU = { t: { value: 0 }, a: { value: 0 } };
  const dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({ vertexShader: DUST_VS, fragmentShader: DUST_FS, uniforms: dustU, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  dust.frustumCulled = false; dust.renderOrder = 3; world.add(dust);

  /* the Stack's pillar, beyond the mark: six cubes in the drawing's greens, outlined in light (built as the hero scrolls away) */
  const { a: A, h: H } = PILLAR;
  const faceMats = () => [STACK.r, STACK.r, STACK.t, STACK.t, STACK.l, STACK.l].map((c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0 }));
  const boxGeo = new THREE.BoxGeometry(A, H, A), edgeGeo = new THREE.EdgesGeometry(boxGeo);
  const cubes = Array.from({ length: 6 }, (_, i) => {
    const g = new THREE.Group(); g.position.set(PILLAR.x, H / 2 + i * H, PILLAR.z);
    const mats = faceMats();
    const box = new THREE.Mesh(boxGeo, mats); g.add(box);
    const em = new THREE.LineBasicMaterial({ color: new THREE.Color(0xf5f4f1), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    g.add(new THREE.LineSegments(edgeGeo, em)); world.add(g);
    return { g, mats, em, rest: g.position.y };
  });
  const base = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: round, color: GREEN, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  base.rotation.x = -Math.PI / 2; base.scale.setScalar(4.5); base.position.set(PILLAR.x, 0.02, PILLAR.z); base.renderOrder = 2; world.add(base);

  /* the motion */
  let words = 0, final = false, cometAt = -10, cometFrom = 0;
  const pos = new THREE.Vector3(), look = new THREE.Vector3(), tmp = new THREE.Vector3();
  const T = new THREE.Vector3(PILLAR.x, 3, PILLAR.z);
  const ISO = new THREE.Vector3(Math.sin(Math.PI / 4) * Math.cos(0.52), Math.sin(0.52), Math.cos(Math.PI / 4) * Math.cos(0.52)).multiplyScalar(17).add(T);
  const DIVE = new THREE.Vector3(0, CY, -1.4), DIVE_LOOK = new THREE.Vector3(0, CY + 0.6, -13);

  function frame(f: { t: number; dt: number; px: number; py: number; p: number; w: number; h: number; wide: boolean }) {
    const dt = f.dt || 1 / 60, t = f.t, p = f.p;
    const gone = clamp((p - 0.3) / 0.25);   // the mark, once the camera has passed it
    // the outline drawn once, from 0.7 s, in 2.6 s; then steady, dim until "by design"
    const reveal = rm ? 1 : ease.inOutCubic((t - 0.7) / 2.6);
    lineU.reveal.value = reveal;
    lineU.on.value = damp(lineU.on.value, (final ? 1.6 : reveal >= 1 ? 0.45 : 0.9) * (1 - gone * 0.85), 2.2, dt);
    const age = t - cometAt, run = 1.5;
    lineU.pulse.value = rm ? 0 : age < run ? Math.sin(Math.PI * clamp(age / run)) : 0;
    lineU.head.value = cometFrom + ease.inOutCubic(age / run);
    // the light rides the drawing point, then the comet; between them it rests at the mark's middle, as bright as the line
    const at = reveal < 1 ? reveal : lineU.pulse.value > 0.02 ? lineU.head.value % 1 : -1;
    if (at >= 0) { curve.getPointAt(at, tmp); lamp.position.set(tmp.x, tmp.y + CY, line.position.z + 0.5); }
    else lamp.position.lerp(tmp.set(0, CY, 1.2), 1 - Math.exp(-2 * dt));
    lamp.intensity = damp(lamp.intensity, (reveal < 1 ? 5 : 0) + lineU.pulse.value * 6 + lineU.on.value * 2.5, 6, dt);
    (pool.material as THREE.MeshBasicMaterial).opacity = damp((pool.material as THREE.MeshBasicMaterial).opacity, final ? 0.5 : 0.12 * reveal, 2, dt);

    // the far tubes: two on at once, more with each word, all on "by design"; each flickers on like a fluorescent tube
    const lit = final ? far.length : Math.min(far.length, 2 + words * 2);
    for (let k = 0; k < far.length; k++) {
      const tb = far[order[k]];
      if (k < lit && tb.at < 0 && reveal > 0.4) tb.at = t + k * 0.05;
      const a2 = tb.at < 0 || t < tb.at ? 0 : t - tb.at;
      const lv = tb.at < 0 || t < tb.at ? 0 : rm || a2 > 0.45 ? 1 : hash(Math.floor(a2 * 22) + tb.id * 31) > 0.45 ? 0.9 : 0.1;
      tb.m.opacity = lv * 0.22;
    }

    // the scroll: walk in and through the mark (0 to 0.5), then rise to the pillar at the drawing's angle (0.45 to 0.9) as its cubes drop in
    const dive = ease.inOutCubic(p / 0.5), rise = ease.inOutCubic((p - 0.45) / 0.42);
    const push = rm ? 1 : ease.outCubic(t / 9);
    pos.set(f.px * 0.4 * (1 - dive), 1.55 - f.py * 0.15 + 0.4 * dive, 9.2 - push * 0.8);
    pos.lerp(DIVE, dive);
    look.set(0.25 * (1 - dive) + f.px * 0.12, CY, 0).lerp(DIVE_LOOK, dive);
    pos.lerp(ISO, rise); look.lerp(T, rise);
    camera.position.copy(pos); camera.lookAt(look);
    camera.fov = (f.wide ? 32 : 50) - rise * 8; camera.updateProjectionMatrix();
    frameView(camera, f.w, f.h, f.wide, 0.3 * (1 - clamp(p * 4)), 0.3 * (1 - clamp(p * 4)));
    // what the camera has passed fades: the mark, then the room; the pillar's cubes drop in, one after another
    slabMat.opacity = 1 - gone;
    hazes.forEach((h, k) => { h.uniforms.t.value = t + k * 40; h.uniforms.a.value = (0.05 + (lit / far.length) * (k ? 0.12 : 0.18)) * (1 - dive * 0.85); });
    dustU.t.value = t; dustU.a.value = damp(dustU.a.value, 0.6 * (1 - rise * 0.7), 1.5, dt);
    cubes.forEach((c, i) => {
      const k = rm ? clamp((p - 0.5) / 0.1) : ease.outCubic((p - 0.5 - i * 0.05) / 0.12);
      c.g.position.y = c.rest + (1 - k) * 2.2;
      c.g.visible = k > 0.005;
      c.mats.forEach((m) => { m.opacity = k; m.transparent = k < 0.999; });
      const land = clamp((p - 0.5 - i * 0.05 - 0.12) / 0.06);
      c.em.opacity = k * (1 + (1 - land) * (land > 0 ? 2 : 0));
    });
    (base.material as THREE.MeshBasicMaterial).opacity = clamp((p - 0.5) / 0.3) * 0.35;
  }

  st.run(scene, () => post?.draw());
  return {
    step(i, last) {
      if (i === 0 && final) { final = false; words = 0; for (const tb of far) tb.at = -1; }
      words = i;
      if (i >= last) final = true;
      if (i > 0) { cometFrom = (lineU.head.value % 1) + 0.0; cometAt = st.f.t; }
    },
    dispose() { st.dispose(); post?.dispose(); free(scene); capsule.dispose(); round.dispose(); scene.environment?.dispose(); },
  };
};
