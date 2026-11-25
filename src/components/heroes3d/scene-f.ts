// Hero F · "Prism": a dark stage, a wet floor, dust in the air. A beam of white light falls from the top left onto the NEAR mark in clear glass, and
// leaves it split into a fan of rays that sweep slowly across the room, one of them green, each striking the floor far off. Each word of the cycle flares
// one ray; on "by design" the fan turns green and a ring of light opens on the floor around the mark. Scrolling (a short pin, half a screen): the rays
// go out and the view rises over the mark as the Stack's three rings (Intents, AI, near.com) open round it in their greens; then the screen closes to
// the Stack band's ink.
import * as THREE from "three";
import { type Mount, GREEN, glow, nMark, studio, damp, hash, ease, clamp, frameView, free, reduced, stage } from "./common";
import { bloom } from "./post";

const SIZE = 2.6, DEPTH = 0.5, CY = 0.3 + SIZE / 2;
const C = new THREE.Vector3(0, CY, 0);                    // where the light meets the glass
const SRC = new THREE.Vector3(2.5, 12, -5);                 // where it comes from: high, behind, a little right (never across the copy)
const RAYS = 7, GREEN_RAY = 4, RAY_LEN = 22;
const RINGS = [{ r: 2.3, y: 0.55, c: "#d4f8e7" }, { r: 3.1, y: 0.3, c: "#4fd09c" }, { r: 3.9, y: 0.08, c: "#2a9a6d" }];   // --stack-intents|ai|com-t

const BEAM_VS = /* glsl */ `
  varying vec3 vN; varying vec3 vV; varying float vY;
  void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); vY = uv.y; gl_Position = projectionMatrix * mv; }`;
const BEAM_FS = /* glsl */ `
  uniform vec3 col; uniform float a, reach, far; varying vec3 vN; varying vec3 vV; varying float vY;
  void main(){
    float core = pow(abs(dot(normalize(vN), normalize(vV))), 3.0);                // bright along the middle, soft at the sides
    float along = smoothstep(0.0, 0.03, vY) * (1.0 - smoothstep(far, 1.0, vY)) * (1.0 - smoothstep(reach - 0.04, reach, vY));
    gl_FragColor = vec4(col * core * along * a, 1.0);
  }`;
const DUST_VS = /* glsl */ `
  uniform float t; attribute float k; varying float vA;
  void main(){
    vec3 p = position; p.y = mod(p.y + t * (0.04 + k * 0.07), 6.0); p.x += sin(t * 0.25 + k * 6.3) * 0.2;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (12.0 + k * 20.0) / -mv.z; vA = 0.2 + k * 0.5;
    gl_Position = projectionMatrix * mv;
  }`;
const DUST_FS = "uniform float a; varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(1.) * smoothstep(.5, 0., d) * vA * a, 1.); }";

/** a beam: an open cone from `from`, `len` long along `dir`, narrow at its start; drawn with BEAM_FS */
function beam(len: number, r0: number, r1: number, color: THREE.ColorRepresentation, far = 0.55) {
  const g = new THREE.CylinderGeometry(r1, r0, len, 32, 1, true); g.translate(0, len / 2, 0);
  const u = { col: { value: new THREE.Color(color) }, a: { value: 0 }, reach: { value: 0 }, far: { value: far } };
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: BEAM_VS, fragmentShader: BEAM_FS, uniforms: u, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.renderOrder = 3; m.frustumCulled = false;
  return { m, u };
}
const UP = new THREE.Vector3(0, 1, 0);

export const mount: Mount = (canvas, section, track) => {
  const rm = reduced();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#050505");
  scene.fog = new THREE.FogExp2(0x050505, 0.03);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 90);
  let post: ReturnType<typeof bloom> | null = null;
  const st = stage(canvas, section, { clear: "#050505", exposure: 1.05, track, dpr: 1.5 }, camera,
    (w, h) => { camera.aspect = w / h; camera.updateProjectionMatrix(); post?.size(); }, (f) => frame(f));
  scene.environment = studio(st.renderer);
  scene.environmentIntensity = 0.45;
  post = bloom(st.renderer, scene, camera, 0.75, 0.5, 0.82);
  const round = glow("round");

  /* the mark in clear glass: faint body, bright edges, a glow inside where the light enters */
  const markGeo = nMark(SIZE, DEPTH, 0.03);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x9fb3ab, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.16, clearcoat: 1, clearcoatRoughness: 0.04,
    iridescence: 0.45, iridescenceIOR: 1.3, envMapIntensity: 0.9, side: THREE.DoubleSide, depthWrite: false });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const mark = new THREE.Group(); mark.position.copy(C); mark.rotation.y = -0.32; scene.add(mark);
  const body = new THREE.Mesh(markGeo, glassMat); body.renderOrder = 2; mark.add(body);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(markGeo, 25), edgeMat); edges.renderOrder = 4; mark.add(edges);
  const coreMat = new THREE.SpriteMaterial({ map: round, color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const core = new THREE.Sprite(coreMat); core.position.copy(C).add(new THREE.Vector3(-0.15, 0.25, 0.1)); core.renderOrder = 5; scene.add(core);

  // its reflection, and the floor
  const mirror = new THREE.Group(); mirror.position.set(0, -CY, 0); mirror.rotation.y = -0.32; mirror.scale.y = -1; scene.add(mirror);
  mirror.add(new THREE.Mesh(markGeo, glassMat), new THREE.LineSegments(edges.geometry, edgeMat));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshStandardMaterial({ color: 0x060606, roughness: 0.3, metalness: 0.5, transparent: true, opacity: 0.86, depthWrite: false, envMapIntensity: 0.1 }));
  floor.rotation.x = -Math.PI / 2; floor.renderOrder = 1; scene.add(floor);
  const fill = new THREE.PointLight(0xffffff, 0, 9, 1.4); fill.position.copy(C).add(new THREE.Vector3(-1.2, 1.4, 1.5)); scene.add(fill);

  /* the light: in from the top left, out as a fan */
  const inc = beam(SRC.distanceTo(C), 0.05, 0.35, 0xffffff, 0.75);
  inc.m.position.copy(C); inc.m.quaternion.setFromUnitVectors(UP, SRC.clone().sub(C).normalize()); scene.add(inc.m);
  const rays = Array.from({ length: RAYS }, (_, i) => {
    const green = i === GREEN_RAY;
    const b = beam(RAY_LEN, 0.025, 0.3 + hash(i * 3.3) * 0.3, green ? GREEN : 0xf2f6f4);
    b.m.position.copy(C); scene.add(b.m);
    const spot = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: round, color: green ? GREEN : 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    spot.rotation.x = -Math.PI / 2; spot.renderOrder = 2; scene.add(spot);
    return { ...b, spot, green, base: green ? 1.1 : 0.4 + hash(i * 7.1) * 0.4, az: 0.05 + hash(i * 2.9) * 0.4, el: 0.3 - (i / (RAYS - 1)) * 0.62, flareAt: -10,
      white: new THREE.Color(green ? GREEN : 0xf2f6f4) };
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.02, 8, 200), new THREE.MeshBasicMaterial({ color: new THREE.Color(GREEN).multiplyScalar(1.6), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.02; ring.renderOrder = 3; scene.add(ring);
  const stackRings = RINGS.map((r) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r.r, 0.035, 8, 220), new THREE.MeshBasicMaterial({ color: new THREE.Color(r.c).multiplyScalar(1.4), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.x = Math.PI / 2; m.renderOrder = 3; scene.add(m);
    return { m, ...r };
  });

  const N = 600, dp = new Float32Array(N * 3), dk = new Float32Array(N);
  for (let i = 0; i < N; i++) { dp[i * 3] = (hash(i * 1.7) - 0.5) * 16; dp[i * 3 + 1] = hash(i * 2.3) * 6; dp[i * 3 + 2] = 4 - hash(i * 4.9) * 16; dk[i] = hash(i * 8.3); }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dp, 3)); dustGeo.setAttribute("k", new THREE.BufferAttribute(dk, 1));
  const dustU = { t: { value: 0 }, a: { value: 0 } };
  const dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({ vertexShader: DUST_VS, fragmentShader: DUST_FS, uniforms: dustU, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  dust.frustumCulled = false; dust.renderOrder = 3; scene.add(dust);

  let final = false, finalAt = -10;
  const d = new THREE.Vector3(), pos = new THREE.Vector3(), look = new THREE.Vector3();
  const TOP = new THREE.Vector3(0.4, 9.5, 6.5), TOP_LOOK = new THREE.Vector3(0, 0.6, 0);
  function frame(f: { t: number; dt: number; px: number; py: number; p: number; w: number; h: number; wide: boolean }) {
    const dt = f.dt || 1 / 60, t = f.t, p = f.p;
    // the beam comes on at 0.6 s (a flash in the glass), the fan opens 0.35 s later
    const on = rm ? 1 : ease.outExpo((t - 0.6) / 0.5), open = rm ? 1 : ease.outCubic((t - 0.95) / 1.6);
    const out = 1 - ease.inOutCubic(p / 0.45);   // the rays go out with the scroll
    inc.u.a.value = on * 0.9 * out; inc.u.reach.value = 1.05;
    const flash = rm ? 0 : Math.exp(-Math.max(0, t - 0.6) * 3) * on;
    coreMat.opacity = (0.35 * on + flash * 0.7) * (0.6 + 0.4 * out); core.scale.setScalar(1 + flash * 2 + (final ? 0.5 : 0));
    edgeMat.opacity = damp(edgeMat.opacity, (0.2 + 0.35 * on) * (final ? 1.3 : 1), 3, dt);
    fill.intensity = on * 3;
    const fin = final ? ease.inOutCubic((t - finalAt) / 1.2) : 0;
    rays.forEach((r, i) => {
      // the fan sweeps slowly, each ray on its own phase
      const az = r.az + (rm ? 0 : Math.sin(t * 0.21 + i * 1.3) * 0.07) - fin * (r.az - 0.4) * 0.25, el = r.el;
      d.set(Math.cos(el) * Math.cos(az), Math.sin(el), -0.6 * Math.cos(el) * Math.sin(az) + 0.08).normalize();
      r.m.quaternion.setFromUnitVectors(UP, d);
      const fl = rm ? 0 : Math.exp(-Math.max(0, t - r.flareAt) * 1.6) * (t >= r.flareAt ? 1 : 0);
      r.u.reach.value = open * (0.4 + 0.6 * clamp(open * 1.4 - i * 0.05));
      r.u.a.value = (r.base * (1 + fl * 1.8)) * open * out * (final ? 1.15 : 1);
      r.u.col.value.copy(r.white).lerp(new THREE.Color(GREEN), fin * 0.85);
      // where it meets the floor
      const hit = -C.y / d.y;
      r.spot.position.set(C.x + d.x * hit, 0.012, C.z + d.z * hit);
      r.spot.scale.set(1.2 + hit * 0.12, 0.9 + hit * 0.05, 1);
      (r.spot.material as THREE.MeshBasicMaterial).opacity = hit > 0 && hit < RAY_LEN * r.u.reach.value ? r.u.a.value * 0.35 : 0;
      (r.spot.material as THREE.MeshBasicMaterial).color.copy(r.u.col.value);
    });
    (ring.material as THREE.MeshBasicMaterial).opacity = fin * 0.9 * out;
    ring.scale.setScalar(0.6 + 0.4 * ease.outExpo((t - finalAt) / 1.4));
    dustU.t.value = t; dustU.a.value = damp(dustU.a.value, 0.55 * on, 1.5, dt);

    // the scroll: the view rises over the mark, the Stack's rings open round it (outermost last)
    const rise = ease.inOutCubic(p / 0.8);
    stackRings.forEach((r, k) => {
      const s = ease.outCubic((p - 0.2 - k * 0.12) / 0.4);
      r.m.scale.setScalar(0.5 + 0.5 * s); r.m.position.y = r.y + (1 - s) * 1.2;
      (r.m.material as THREE.MeshBasicMaterial).opacity = s * 0.7;
    });
    const push = rm ? 1 : ease.outCubic(t / 8);
    pos.set(0.3 + f.px * 0.4, 1.7 - f.py * 0.15, 9 - push * 0.7).lerp(TOP, rise);
    look.set(0.6 + f.px * 0.1, CY * 0.85, 0).lerp(TOP_LOOK, rise);
    camera.position.copy(pos); camera.lookAt(look);
    camera.fov = f.wide ? 32 : 50; camera.updateProjectionMatrix();
    frameView(camera, f.w, f.h, f.wide, 0.32 * (1 - rise), 0.32 * (1 - rise));
  }

  st.run(scene, () => post?.draw());
  return {
    step(i, last) {
      if (i === 0 && final) final = false;
      if (i >= last) { if (!final) finalAt = st.f.t; final = true; return; }
      if (i > 0) rays[(i * 3) % RAYS].flareAt = st.f.t;
    },
    dispose() { st.dispose(); post?.dispose(); free(scene); round.dispose(); scene.environment?.dispose(); },
  };
};
