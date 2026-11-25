// Hero E · "Layers": C's layered N carried on into the Stack. On the page's paper, seen from above at an isometric angle, the NEAR mark built of stacked
// plates of brushed steel on a plate of green glass; the key light drifts slowly, so the plates' shadows sweep the paper. On load the plates fall into
// place one by one; each word of the cycle sends a thin green beam through another layer; on "by design" the glass lights up and the beam comes to rest.
// Scrolling (the hero is pinned for 1.4 screens): the plates lift apart and the paper goes dark; then each steel plate folds into a cube of the Stack's
// pillar, stacked where the drawing has it and at its exact isometric angle; then the screen closes to the Stack band's ink.
import * as THREE from "three";
import { type Mount, GREEN, PAPER, STACK, surface, studio, nMark, glow, damp, ease, clamp, frameView, free, reduced, stage } from "./common";

const PLATES = 7, PT = 0.09, GAP = 0.018, BASE = 0.13;   // steel plates over one of glass, their thickness and the gaps between them
const SIZE = 3.4;                                          // the mark's height (lying down: its length across the floor)
const CA = 0.7, CH = 1.12;                                 // a pillar cube: width, height (the drawing's proportions, PILLAR in v7/stack/geometry.ts)
const ISO = Math.atan(1 / Math.SQRT2);                     // the drawing's camera pitch (true isometric)
const DARK = new THREE.Color("#1f1f1f");

export const mount: Mount = (canvas, section, track) => {
  const rm = reduced();
  const scene = new THREE.Scene();
  const bg = new THREE.Color(PAPER), paper = new THREE.Color(PAPER);
  scene.background = bg;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  let viewH = 6.8, aspect = 1;

  const st = stage(canvas, section, { clear: PAPER, tone: THREE.NeutralToneMapping, exposure: 1, shadows: true, track }, camera,
    (w, h) => { aspect = w / h; }, (f) => frame(f));
  scene.environment = studio(st.renderer);
  scene.environmentIntensity = 0.9;

  const floorMat = new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.16 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  /* the mark: plates lying flat */
  const shape = nMark(SIZE, PT, 0.012); shape.rotateX(-Math.PI / 2);
  const baseShape = nMark(SIZE, BASE, 0.01); baseShape.rotateX(-Math.PI / 2);
  const brushed = surface("brushed"); brushed.repeat.set(1.5, 1.5);
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xdfe2e4, metalness: 1, roughness: 0.34, roughnessMap: brushed, anisotropy: 0.6, envMapIntensity: 1.1 });
  const glass = new THREE.MeshPhysicalMaterial({ color: GREEN, metalness: 0, roughness: 0.1, transmission: 0.75, thickness: 0.5, ior: 1.5, emissive: GREEN, emissiveIntensity: 0.1,
    attenuationColor: new THREE.Color(GREEN), attenuationDistance: 0.6 });
  const mark = new THREE.Group(); mark.rotation.y = 0.62; scene.add(mark);
  const plates: { m: THREE.Mesh; rest: number; delay: number }[] = [];
  const base = new THREE.Mesh(baseShape, glass); base.castShadow = true; mark.add(base);
  plates.push({ m: base, rest: BASE / 2, delay: 0 });
  for (let i = 0; i < PLATES; i++) {
    const m = new THREE.Mesh(shape, steel); m.castShadow = m.receiveShadow = true; mark.add(m);
    plates.push({ m, rest: BASE + GAP + i * (PT + GAP) + PT / 2, delay: 0.25 + i * 0.12 });
  }
  const spillMat = new THREE.MeshBasicMaterial({ map: glow("round"), color: GREEN, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), spillMat);
  spill.rotation.x = -Math.PI / 2; spill.scale.set(SIZE * 1.9, SIZE * 1.9, 1); spill.position.y = 0.002; scene.add(spill);

  /* the beam through the stack, and its trace on the paper (as C) */
  const rail = new THREE.Group(); rail.position.set(-2.4, 0, 0.15); scene.add(rail);
  const long = (g: THREE.BufferGeometry) => g.translate(0.5, 0, 0);
  const beamCore = new THREE.Mesh(long(new THREE.BoxGeometry(1, 0.016, 0.016)), new THREE.MeshBasicMaterial({ color: GREEN, toneMapped: false, transparent: true, opacity: 0 }));
  const beamGlow = new THREE.Mesh(long(new THREE.PlaneGeometry(1, 0.22)), new THREE.MeshBasicMaterial({ map: glow("round", 128), color: GREEN, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  beamGlow.rotation.x = -Math.PI / 2;
  const trace = new THREE.Mesh(long(new THREE.PlaneGeometry(1, 0.06)), new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  trace.rotation.x = -Math.PI / 2; trace.position.y = 0.003;
  rail.add(beamCore, beamGlow, trace);
  const BEAM_LEN = 18;

  /* the Stack's pillar: six cubes in the drawing's greens with its cream outline, each grown out of a steel plate */
  const boxGeo = new THREE.BoxGeometry(CA, CH, CA), edgeGeo = new THREE.EdgesGeometry(boxGeo);
  const cubes = Array.from({ length: 6 }, (_, i) => {
    const mats = [STACK.r, STACK.r, STACK.t, STACK.t, STACK.l, STACK.l].map((c) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false }));
    const g = new THREE.Group(); g.visible = false;
    g.add(new THREE.Mesh(boxGeo, mats));
    g.add(new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0xf5f4f1, toneMapped: false })));
    scene.add(g);
    return { g, rest: CH / 2 + i * CH };
  });

  /* the lights: a key from the top left that drifts (the shadows sweep), a fill, the glass's light from under */
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.bias = -0.0005;
  Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 30 }); scene.add(key);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xdddddd, 0.6); scene.add(hemi);
  const under = new THREE.PointLight(GREEN, 0, 3, 1.5); under.position.set(0, 0.06, 0); mark.add(under);

  let final = false, beamAt = -10, beamH = 0.5;
  const dir = new THREE.Vector3(), wp = new THREE.Vector3();
  function frame(f: { t: number; dt: number; px: number; py: number; p: number; w: number; h: number; wide: boolean }) {
    const dt = f.dt || 1 / 60, t = f.t, p = f.p;
    // the scroll's three parts: the plates lift apart and the paper darkens (0 to 0.3); the plates fold into cubes (0.25 to 0.75); the pillar holds
    const lift = ease.inOutCubic(p / 0.3), dark = ease.inOutCubic((p - 0.08) / 0.3);
    bg.copy(paper).lerp(DARK, dark);
    floorMat.opacity = 0.16 * (1 - dark);
    hemi.intensity = 0.6 * (1 - dark * 0.5);
    section.dataset.navTone = dark > 0.5 ? "dark" : "light";

    const theta = -0.55 + (rm ? 0 : Math.sin(t * 0.09) * 0.55);
    key.position.set(Math.cos(theta) * 7, 10, Math.sin(theta) * 7);

    for (let i = 0; i < plates.length; i++) {
      const pl = plates[i];
      const k = rm ? 1 : ease.outBack((t - pl.delay) / 0.85, 1.1);
      pl.m.position.y = pl.rest + (1 - k) * 2.6 + lift * i * 0.3 + (rm ? 0 : Math.sin(t * 0.7 + i * 0.6) * 0.012 * i);
      // plates 1-6 fold into cubes 0-5 (a stagger up the stack); the glass and the top plate shrink away
      const c = i - 1, m = ease.inOutCubic((p - 0.26 - Math.max(0, c) * 0.05) / 0.2);
      const s = 1 - m;
      pl.m.scale.set(s, 1, s); pl.m.visible = s > 0.01;
      if (c >= 0 && c < 6) {
        const cube = cubes[c];
        cube.g.visible = m > 0.01;
        pl.m.getWorldPosition(wp);
        cube.g.position.set(wp.x * (1 - m), THREE.MathUtils.lerp(wp.y, cube.rest, m), wp.z * (1 - m));
        const g = Math.max(0.01, rm ? m : ease.outBack(m, 1.4));
        cube.g.scale.set(g, Math.max(0.01, m), g);
      }
    }
    const g = damp(glass.emissiveIntensity, final ? 0.75 : 0.12, 2.5, dt);
    glass.emissiveIntensity = g;
    under.intensity = g * 3;
    spillMat.opacity = g * 0.28 * (1 - clamp((p - 0.25) / 0.2)) + clamp((p - 0.6) / 0.2) * 0.22;   // the glass's light, then the pillar's foot

    const age = t - beamAt;
    const reach = final || rm ? 1 : ease.outExpo(age / 0.4);
    const fade = final ? 1 : 1 - ease.outCubic((age - 0.55) / 0.5);
    const a = Math.max(0, Math.min(reach * 1.4, fade)) * (1 - clamp(p / 0.2));
    beamCore.scale.x = beamGlow.scale.x = Math.max(0.001, BEAM_LEN * reach);
    beamCore.position.y = beamGlow.position.y = final ? 0.012 : beamH;
    (beamCore.material as THREE.MeshBasicMaterial).opacity = a;
    (beamGlow.material as THREE.MeshBasicMaterial).opacity = a * 0.55;
    const tr = trace.material as THREE.MeshBasicMaterial;
    tr.opacity = (final ? damp(tr.opacity, 0.5, 2, dt) : Math.max(0, damp(tr.opacity, age < 1.2 ? 0.16 * a : 0, 3, dt))) * (1 - clamp(p / 0.15));
    trace.scale.x = BEAM_LEN * reach;

    // the view: isometric, a slow settle on load, the pointer's few degrees; with the scroll, to the drawing's exact angle, centred, framing the pillar
    const settle = rm ? 1 : ease.outCubic(t / 3.5), hold = 1 - ease.inOutCubic((p - 0.08) / 0.3);
    const yaw = Math.PI / 4 + ((1 - settle) * 0.35 + f.px * 0.07 + (rm ? 0 : Math.sin(t * 0.18) * 0.03)) * hold;
    const pitch = THREE.MathUtils.lerp(0.62 - f.py * 0.04, ISO, 1 - hold);
    const zoom = ease.inOutCubic((p - 0.06) / 0.5);
    const lookY = THREE.MathUtils.lerp(0.6, cubes[0].rest + 2.5 * CH, zoom);
    dir.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(20);
    camera.position.copy(dir).add(wp.set(0, lookY, 0));
    camera.lookAt(0, lookY, 0);
    viewH = THREE.MathUtils.lerp(f.wide ? 6.8 : 10, f.wide ? 10.5 : 13, zoom);
    camera.left = (-viewH * aspect) / 2; camera.right = (viewH * aspect) / 2; camera.top = viewH / 2; camera.bottom = -viewH / 2;
    camera.zoom = 0.86 + 0.14 * settle;
    camera.updateProjectionMatrix();
    frameView(camera, f.w, f.h, f.wide, 0.3 * hold, 0.2 * hold);
  }

  st.run(scene);
  return {
    step(i, last) {
      if (i === 0 && final) final = false;
      if (i >= last) { final = true; beamAt = st.f.t; return; }
      if (i === 0) return;
      const layer = [2, 4, 6, 3, 5, 1, 7][(i - 1) % 7];
      beamH = BASE + GAP + (layer - 1) * (PT + GAP) + PT / 2;
      beamAt = st.f.t;
    },
    dispose() { st.dispose(); free(scene); scene.environment?.dispose(); },
  };
};
