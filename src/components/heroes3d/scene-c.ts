// Hero C · "The layered N": on the page's paper, seen from above at an isometric angle (an orthographic camera), the NEAR mark built of stacked plates of
// brushed steel on a plate of green glass that glows from below. On load the plates fall into place one by one, the glass first; each word of the cycle
// sends a thin green beam through the stack at another height; on "by design" the glass lights up and the beam comes to rest along the floor, running out
// of the picture. The pointer turns the view a few degrees; scrolling lifts the plates apart, the layers of the Stack that follows the hero.
import * as THREE from "three";
import { type Mount, GREEN, PAPER, surface, studio, nMark, glow, damp, ease, frameView, free, reduced, stage } from "./common";

const PLATES = 7, PT = 0.09, GAP = 0.018, BASE = 0.13;   // steel plates over one of glass, their thickness and the gaps between them
const SIZE = 3.4;                                          // the mark's height (lying down: its length across the floor)

export const mount: Mount = (canvas, section) => {
  const rm = reduced();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PAPER);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  let viewH = 6.2;

  const st = stage(canvas, section, { clear: PAPER, tone: THREE.NeutralToneMapping, exposure: 1, shadows: true }, camera,
    (w, h, wide) => {
      const a = w / h; viewH = wide ? 6.8 : 10;
      camera.left = (-viewH * a) / 2; camera.right = (viewH * a) / 2; camera.top = viewH / 2; camera.bottom = -viewH / 2;
      camera.updateProjectionMatrix(); frameView(camera, w, h, wide, 0.22, 0.2);
    },
    (f) => frame(f));
  const renderer = st.renderer;
  scene.environment = studio(renderer);
  scene.environmentIntensity = 0.9;

  /* the floor takes shadows only: the paper is the clear colour */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.16 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  /* the mark: plates lying flat (its shape in the XZ plane, thickness up) */
  const shape = nMark(SIZE, PT, 0.012); shape.rotateX(-Math.PI / 2);
  const baseShape = nMark(SIZE, BASE, 0.01); baseShape.rotateX(-Math.PI / 2);
  const brushed = surface("brushed"); brushed.repeat.set(1.5, 1.5);
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xdfe2e4, metalness: 1, roughness: 0.34, roughnessMap: brushed, anisotropy: 0.6, envMapIntensity: 1.1 });
  const glass = new THREE.MeshPhysicalMaterial({ color: GREEN, metalness: 0, roughness: 0.1, transmission: 0.75, thickness: 0.5, ior: 1.5, emissive: GREEN, emissiveIntensity: 0.1,
    attenuationColor: new THREE.Color(GREEN), attenuationDistance: 0.6 });
  const mark = new THREE.Group(); mark.rotation.y = 0.62; scene.add(mark);   // the N reads upright, a little turned
  const plates: { m: THREE.Mesh; rest: number; delay: number }[] = [];
  const base = new THREE.Mesh(baseShape, glass); base.castShadow = true; mark.add(base);
  plates.push({ m: base, rest: BASE / 2, delay: 0 });
  for (let i = 0; i < PLATES; i++) {
    const m = new THREE.Mesh(shape, steel); m.castShadow = m.receiveShadow = true; mark.add(m);
    plates.push({ m, rest: BASE + GAP + i * (PT + GAP) + PT / 2, delay: 0.25 + i * 0.12 });
  }

  // the glass's light on the paper around the mark (a soft green tint, stronger on "by design")
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glow("round"), color: GREEN, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  spill.rotation.x = -Math.PI / 2; spill.scale.set(SIZE * 1.9, SIZE * 1.9, 1); spill.position.y = 0.002; mark.add(spill);

  /* the beam: a thin green line through the stack, with a soft glow around it, and its trace on the paper */
  // along +x: from just inside the mark's far side, through it, and out of the picture at the bottom right (never across the copy)
  const rail = new THREE.Group(); rail.position.set(-2.4, 0, 0.15); scene.add(rail);
  const long = (g: THREE.BufferGeometry) => g.translate(0.5, 0, 0);
  const beamCore = new THREE.Mesh(long(new THREE.BoxGeometry(1, 0.016, 0.016)), new THREE.MeshBasicMaterial({ color: GREEN, toneMapped: false, transparent: true, opacity: 0 }));
  const halo = glow("round", 128);
  const beamGlow = new THREE.Mesh(long(new THREE.PlaneGeometry(1, 0.22)), new THREE.MeshBasicMaterial({ map: halo, color: GREEN, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  beamGlow.rotation.x = -Math.PI / 2;
  const trace = new THREE.Mesh(long(new THREE.PlaneGeometry(1, 0.06)), new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  trace.rotation.x = -Math.PI / 2; trace.position.y = 0.003;
  rail.add(beamCore, beamGlow, trace);
  const BEAM_LEN = 18;

  /* the lights: a soft key from the top left that casts the shadows, a fill */
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-6, 10, 4); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.bias = -0.0005;
  Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 30 }); scene.add(key);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xdddddd, 0.6));
  const under = new THREE.PointLight(GREEN, 0, 3, 1.5); under.position.set(0, 0.06, 0); mark.add(under);

  /* the motion */
  let final = false, beamAt = -10, beamH = 0.5;
  const dir = new THREE.Vector3();
  function frame(f: { t: number; dt: number; px: number; py: number; p: number }) {
    const dt = f.dt || 1 / 60;
    // the plates fall into place, each with a small settle; scrolling lifts them apart
    for (let i = 0; i < plates.length; i++) {
      const pl = plates[i];
      const k = rm ? 1 : ease.outBack((f.t - pl.delay) / 0.85, 1.1);
      const drop = (1 - k) * 2.6;
      pl.m.position.y = pl.rest + drop + f.p * i * 0.42;
      const mat = pl.m.material as THREE.Material;
      mat.transparent = false;
    }
    // the glass: a faint glow from the start, full on "by design"
    const g = damp(glass.emissiveIntensity, final ? 0.75 : 0.12, 2.5, dt);
    glass.emissiveIntensity = g;
    under.intensity = g * 3;
    (spill.material as THREE.MeshBasicMaterial).opacity = g * 0.28;

    // the beam: shoots through at its height, holds, fades; on "by design" it lies on the floor and stays
    const age = f.t - beamAt;
    const reach = final ? 1 : rm ? 1 : ease.outExpo(age / 0.4);
    const fade = final ? 1 : 1 - ease.outCubic((age - 0.55) / 0.5);
    const a = Math.max(0, Math.min(reach * 1.4, fade));
    beamCore.scale.x = beamGlow.scale.x = Math.max(0.001, BEAM_LEN * reach);
    beamCore.position.y = beamGlow.position.y = final ? 0.012 : beamH + f.p * 1.2;
    (beamCore.material as THREE.MeshBasicMaterial).opacity = a;
    (beamGlow.material as THREE.MeshBasicMaterial).opacity = a * 0.55;
    const tr = trace.material as THREE.MeshBasicMaterial;
    tr.opacity = final ? damp(tr.opacity, 0.5, 2, dt) : Math.max(0, damp(tr.opacity, age < 1.2 ? 0.16 * a : 0, 3, dt));
    trace.scale.x = BEAM_LEN * reach;

    // the view: isometric, turning a few degrees with the pointer and slowly by itself; a step back as the hero scrolls away
    const yaw = Math.PI / 4 + f.px * 0.07 + (rm ? 0 : Math.sin(f.t * 0.18) * 0.03);
    const pitch = 0.62 - f.py * 0.04;
    dir.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(20);
    camera.position.copy(dir).add(new THREE.Vector3(0, 0.6 + f.p * 1.2, 0));
    camera.lookAt(0, 0.6 + f.p * 1.2, 0);
    camera.zoom = 1 - f.p * 0.25; camera.updateProjectionMatrix();
  }

  st.run(scene);
  return {
    step(i, last) {
      if (i === 0 && final) final = false;   // the hero came back: the words play again
      if (i >= last) { final = true; beamAt = st.f.t; return; }
      if (i === 0) return;
      // each word's beam passes through a different layer, bottom to top and back
      const layer = [2, 4, 6, 3, 5, 1, 7][(i - 1) % 7];
      beamH = layer === 0 ? BASE / 2 : BASE + GAP + (layer - 1) * (PT + GAP) + PT / 2;
      beamAt = st.f.t;
    },
    dispose() { st.dispose(); free(scene); scene.environment?.dispose(); },
  };
};
