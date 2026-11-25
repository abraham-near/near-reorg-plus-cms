// Hero B · "The display case": a concrete room in half-light, a wall of lockers behind, some with a green light by the lock; in front, a concrete plinth
// under a glass case, and in it the NEAR mark in green glass, turning slowly on a clear rod. One light from above, its cone seen in the air. On load the
// camera travels in from the side and comes to rest with the case right of the headline; each word of the cycle lights one more locker; on "by design"
// the light from above opens up, a green light wakes inside the case and the mark stops, facing you. The pointer moves the reflections; scrolling walks
// the camera up to the glass.
import * as THREE from "three";
import { type Mount, GREEN, surface, studio, nMark, glow, damp, ease, frameView, free, reduced, stage } from "./common";

const CASE = new THREE.Vector3(2.3, 0, 0.6);   // the plinth's foot
const PLINTH = 1.45, GLASS = 1.0, W = 1.05;

const CONE_VS = "varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }";
const CONE_FS = "uniform float a; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float facing = pow(abs(dot(vN, vV)), 2.2); float fall = pow(vUv.y, 1.4); gl_FragColor = vec4(vec3(1.), a * facing * fall); }";

export const mount: Mount = (canvas, section) => {
  const rm = reduced();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#080808");
  scene.fog = new THREE.FogExp2(0x080808, 0.06);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);

  const st = stage(canvas, section, { clear: "#080808", exposure: 1.05, shadows: true }, camera,
    (w, h, wide) => { camera.aspect = w / h; camera.fov = wide ? 26 : 38; camera.updateProjectionMatrix(); frameView(camera, w, h, wide, 0.2, 0.22); },
    (f) => frame(f));
  const renderer = st.renderer;
  renderer.shadowMap.enabled = true;
  scene.environment = studio(renderer);
  scene.environmentIntensity = 0.22;

  /* the room */
  const concrete = surface("concrete");
  const floorMap = concrete.clone(); floorMap.needsUpdate = true; floorMap.repeat.set(10, 10);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.32, metalness: 0, roughnessMap: floorMap }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  // the wall of lockers, turned a little so it runs away into the dark on the left
  const wall = new THREE.Group(); wall.position.set(-0.5, 0, -4.2); wall.rotation.y = 0.22; scene.add(wall);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(26, 6), new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.9 })); back.position.y = 3; back.receiveShadow = true; wall.add(back);
  const band = new THREE.Mesh(new THREE.PlaneGeometry(26, 1.2), new THREE.MeshStandardMaterial({ color: 0x5c5c5c, roughness: 0.95 })); band.position.set(0, 3.85, 0.02); wall.add(band);
  const COLS = 20, ROWS = [1.05, 1.0, 0.7], DW = 1.08;   // rows' heights from the floor up
  const doors = new THREE.InstancedMesh(new THREE.BoxGeometry(DW - 0.05, 1, 0.07), new THREE.MeshStandardMaterial({ color: 0x3b3b3b, roughness: 0.5, metalness: 0.35 }), COLS * ROWS.length);
  const knobs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.022, 10, 8), new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.3, metalness: 1 }), COLS * ROWS.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  let k = 0;
  const lockFor: THREE.Vector3[] = [];
  for (let c = 0; c < COLS; c++) {
    let y = 0.05;
    for (let r = 0; r < ROWS.length; r++) {
      const hgt = ROWS[r] - 0.05, x = (c - COLS / 2) * DW;
      doors.setMatrixAt(k, m4.compose(ps.set(x, y + hgt / 2, 0.06), q, sc.set(1, hgt, 1)));
      knobs.setMatrixAt(k, m4.compose(ps.set(x - DW / 2 + 0.14, y + hgt * 0.62, 0.11), q, sc.set(1, 1, 1)));
      lockFor.push(new THREE.Vector3(x + DW / 2 - 0.16, y + hgt * 0.62, 0.11));
      y += ROWS[r]; k++;
    }
  }
  doors.castShadow = doors.receiveShadow = true;
  wall.add(doors, knobs);

  // the green lights by the locks: one per word but the last, spread over the wall (seen from the front, right of the headline)
  const LEDS = [31, 40, 24, 46, 37, 52, 28, 43];
  const ledMat = LEDS.map(() => new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false }));
  const ledGlow = LEDS.map(() => new THREE.SpriteMaterial({ map: glow("round", 64), color: GREEN, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  const ledOn = LEDS.map(() => 0);
  LEDS.forEach((n, i) => {
    const p = lockFor[n];
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 8), ledMat[i]); led.position.copy(p); wall.add(led);
    const s = new THREE.Sprite(ledGlow[i]); s.scale.setScalar(0.34); s.position.copy(p).add(new THREE.Vector3(0, 0, 0.02)); wall.add(s);
  });

  /* the plinth, the glass case and the mark */
  const plinthMap = concrete.clone(); plinthMap.needsUpdate = true;
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(W, PLINTH, W), new THREE.MeshStandardMaterial({ color: 0xb4b4b4, roughness: 0.85, map: plinthMap }));
  plinth.position.set(CASE.x, PLINTH / 2, CASE.z); plinth.castShadow = plinth.receiveShadow = true; scene.add(plinth);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(W + 0.02, 0.03, W + 0.02), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15, emissive: 0x666666 }));
  slab.position.set(CASE.x, PLINTH + 0.015, CASE.z); slab.receiveShadow = true; scene.add(slab);

  const glass = new THREE.Mesh(new THREE.BoxGeometry(W, GLASS, W), new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.03, transmission: 1, thickness: 0.04, ior: 1.5, specularIntensity: 1, envMapIntensity: 1.6 }));
  glass.position.set(CASE.x, PLINTH + 0.03 + GLASS / 2, CASE.z); scene.add(glass);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(glass.geometry), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 }));
  edges.position.copy(glass.position); scene.add(edges);

  // (inside the transmissive case, nothing else may be transmissive: three draws only opaque things into what the glass shows behind it)
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.1, metalness: 0.9 }));
  rod.position.set(CASE.x, PLINTH + 0.03 + 0.15, CASE.z); scene.add(rod);
  const markGeo = nMark(0.42, 0.06, 0.06);
  const mark = new THREE.Mesh(markGeo, new THREE.MeshPhysicalMaterial({
    color: GREEN, metalness: 0.15, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.4, sheenColor: new THREE.Color(GREEN),
    emissive: GREEN, emissiveIntensity: 0.12, envMapIntensity: 1.6 }));
  mark.position.set(CASE.x, PLINTH + 0.03 + 0.3 + 0.21, CASE.z); mark.castShadow = true; scene.add(mark);

  /* the lights */
  scene.add(new THREE.HemisphereLight(0xffffff, 0x0a0a0a, 0.18));
  const top = new THREE.SpotLight(0xffffff, 0, 9, 0.36, 0.65, 1.2);
  top.position.set(CASE.x - 0.2, 4.6, CASE.z + 0.5); top.target.position.set(CASE.x, PLINTH, CASE.z); top.castShadow = true;
  top.shadow.mapSize.set(1024, 1024); top.shadow.bias = -0.0004; top.shadow.radius = 4; scene.add(top, top.target);
  const wash = new THREE.SpotLight(0xffffff, 0, 16, 0.9, 0.9, 1.4);   // the band of light along the top of the wall
  wash.position.set(-1, 4.6, -1.2); wash.target.position.set(-2, 3.6, -4.3); scene.add(wash, wash.target);
  const rim = new THREE.DirectionalLight(0xffffff, 0.35); rim.position.set(6, 3, -3); scene.add(rim);
  const inside = new THREE.PointLight(GREEN, 0, 1.6, 1.6); inside.position.set(CASE.x, PLINTH + 0.4, CASE.z); scene.add(inside);

  // the cone of the light from above, seen in the air
  const coneH = 4.4 - PLINTH;
  const coneMat = new THREE.ShaderMaterial({ vertexShader: CONE_VS, fragmentShader: CONE_FS, uniforms: { a: { value: 0 } }, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 1.05, coneH, 40, 1, true), coneMat);
  cone.position.set(CASE.x - 0.1, PLINTH + coneH / 2, CASE.z + 0.25); scene.add(cone);
  // the ceiling's two lamps
  for (const [x, z] of [[CASE.x - 0.2, CASE.z + 0.5], [-3.5, -1.5]]) {
    const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.09, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
    lamp.rotation.x = Math.PI / 2; lamp.position.set(x, 4.62, z); scene.add(lamp);
  }
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 1 })); ceil.rotation.x = Math.PI / 2; ceil.position.y = 4.64; scene.add(ceil);

  /* the motion */
  const SPIN = 0.35;   // the mark's turn, radians a second
  let words = 0, last = 8, final = false, finalAt = -1, spin = 0;
  const c = new THREE.Vector3(CASE.x, PLINTH + 0.45, CASE.z);
  const look = new THREE.Vector3();
  function frame(f: { t: number; dt: number; px: number; py: number; p: number }) {
    const dt = f.dt || 1 / 60;
    // the light comes up over the first second and a half, opens more on "by design"
    const on = rm ? 1 : ease.outCubic(f.t / 1.6);
    const open = final ? ease.outCubic((f.t - finalAt) / 1.4) : 0;
    top.intensity = (26 + open * 22) * on;
    wash.intensity = 30 * on;
    coneMat.uniforms.a.value = (0.05 + open * 0.05) * on;
    inside.intensity = damp(inside.intensity, final ? 1.6 : 0, 2, dt);
    (mark.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.12 + inside.intensity * 0.25;
    LEDS.forEach((_, i) => {
      ledOn[i] = damp(ledOn[i], i < words ? 1 : 0, 6, dt);
      ledMat[i].color.set(GREEN).multiplyScalar(ledOn[i] * 1.3); ledGlow[i].opacity = ledOn[i] * 0.8;
    });

    // the mark turns slowly; on "by design" it eases round to face the camera and stops
    if (!final) spin += SPIN * dt * (rm ? 0 : 1);
    else {
      const face = Math.atan2(camera.position.x - mark.position.x, camera.position.z - mark.position.z);
      const turns = Math.round((spin - face) / (Math.PI * 2));
      spin = damp(spin, face + turns * Math.PI * 2, rm ? 50 : 2.2, dt);
    }
    mark.rotation.y = spin;
    mark.position.y = PLINTH + 0.51 + (rm ? 0 : Math.sin(f.t * 0.9) * 0.008);

    // the camera: in from the side on an arc round the case over 6 s, then at rest; the pointer swings it a little; scrolling walks it up to the glass
    const tr = rm ? 1 : ease.inOutCubic(f.t / 6.2);
    const ang = THREE.MathUtils.lerp(-1.05, -0.36, tr) + f.px * 0.07;
    const rad = THREE.MathUtils.lerp(10.5, 8.6, tr) - f.p * 6;
    const y = THREE.MathUtils.lerp(2.9, 2.0, tr) - f.py * 0.14 + f.p * 0.2;
    camera.position.set(c.x + Math.sin(ang) * rad, y, c.z + Math.cos(ang) * rad);
    look.set(c.x - 0.3 * (1 - f.p), c.y + 0.25, c.z - 0.4);
    camera.lookAt(look);
  }

  st.run(scene);
  return {
    step(i, l) {
      last = l; words = Math.min(i, LEDS.length);
      if (i >= last && !final) { final = true; finalAt = st.f.t; }
      if (i === 0 && final) { final = false; words = 0; }   // the hero came back: the case dims and the words play again
    },
    dispose() { st.dispose(); free(scene); scene.environment?.dispose(); },
  };
};
