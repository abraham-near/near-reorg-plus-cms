import * as THREE from "three";
import { kit, type Pal, type Tokens, type View } from "../gl";
import { axleStart, GIMBAL, type GimbalPose } from "./gimbal.scene";

// The identity station, the gimbal (D80, D81), in the shared studio (loaded with a dynamic import, client only). A thin
// frosted glass frame with a crisp chrome bevel on both edges and fine graduations cut into its face; behind it a fine
// chrome retaining ring that the frost visibly blurs; two thin polished chrome rings on fine machined pins, square to
// each other; the green ball at the exact centre on the vertical axle. The metal in front and the ball are
// drawn on screen only, so the glass never refracts their pixels beside them (D75); only what sits behind the glass
// is drawn into its transmission pass.
const { palette, mix, getEngine, backdrop, studio, polished, polishedDark, greenBall, onlyIn, cleanEdge, view } = kit;

// A flat ring in the xy plane, centred on z: its faces and its walls as two material groups, the edges bevelled
function annulus(rIn: number, rOut: number, depth: number, bev: number) {
  const shape = new THREE.Shape().absarc(0, 0, rOut, 0, Math.PI * 2, false);
  shape.holes.push(new THREE.Path().absarc(0, 0, rIn, 0, Math.PI * 2, true));
  const g = new THREE.ExtrudeGeometry(shape, { depth: depth - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 240 });
  g.translate(0, 0, -(depth - 2 * bev) / 2);
  return g;
}
// A pin from x0 to x1 along x (or y)
function pin(x0: number, x1: number, r: number, along: "x" | "y", segs = 24) {
  const g = new THREE.CylinderGeometry(r, r, Math.abs(x1 - x0), segs, 1);
  if (along === "x") g.rotateZ(Math.PI / 2);
  const m = (x0 + x1) / 2;
  g.translate(along === "x" ? m : 0, along === "y" ? m : 0, 0);
  return g;
}

// The frame's glass: clear frost (little tint, little attenuation) with a bright glow gathered at both its edges, the
// way light pipes to the edges of a glass ring (brighter toward the upper left, the key light), crisp to the bevel
function frame(pal: Pal, rIn: number, rOut: number) {
  const m = new THREE.MeshPhysicalMaterial({
    color: pal.onDark, metalness: 0, roughness: 0.3, transmission: 1, thickness: 0.07, ior: 1.42,
    specularIntensity: 1, envMapIntensity: 1.5, premultipliedAlpha: true,
  });
  const glow = mix(pal.onDark, pal.muted, 0.03);
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uGlow = { value: glow };
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vLoc;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvLoc = position;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uGlow;\nvarying vec3 vLoc;")
      .replace("#include <opaque_fragment>", `{
        float r = length(vLoc.xy);
        float e = min(r - ${rIn.toFixed(4)}, ${rOut.toFixed(4)} - r) / ${(rOut - rIn).toFixed(4)};
        float glow = 1.0 - smoothstep(0.0, 0.2, e);
        float key = 0.75 + 0.25 * dot(normalize(vLoc.xy + 1e-5), vec2(-0.6, 0.8));
        outgoingLight = outgoingLight * (1.0 - 0.06 * glow) + uGlow * glow * 0.5 * key;
      }
      #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => `gimbal-frame-${rIn}-${rOut}`;
  return m;
}

export function gimbalView(tokens: Tokens): View<GimbalPose> {
  const e = getEngine();
  const pal: Pal = palette(tokens);
  const scene = new THREE.Scene();
  const camera = studio(scene, e.env, pal);
  // the page as the glass sees it, at a lower alpha than the washer's, so the frame reads clearer
  scene.add(backdrop(pal.surface, 0.45));
  const { frame: F, outer: O, inner: I } = GIMBAL;

  const chrome = polished(pal), dark = polishedDark(pal);
  const metal = (g: THREE.BufferGeometry, m: THREE.Material = chrome) => onlyIn(new THREE.Mesh(g, m), false);
  const behind = (g: THREE.BufferGeometry, m: THREE.Material) => onlyIn(new THREE.Mesh(g, m), true);

  // the frame, leaned back
  const lean = new THREE.Group();
  lean.rotation.x = GIMBAL.lean;
  scene.add(lean);
  lean.add(new THREE.Mesh(annulus(F.rIn, F.rOut, F.depth, F.bevel), [frame(pal, F.rIn, F.rOut), chrome]));
  // the micro-bevel: on the front face a dark hairline at the very edge, at both edges (light, as the family is: the
  // glass leads); on the back face a dark one and a bright one just inside it, seen only through the frost
  for (const [r, k] of [[F.rOut - 0.002, -1], [F.rIn + 0.002, 1]] as const) {
    const front = metal(new THREE.TorusGeometry(r, 0.0044, 10, 320), dark);
    front.position.z = F.depth / 2;
    const d = behind(new THREE.TorusGeometry(r, 0.0048, 10, 320), dark.clone());
    const b = behind(new THREE.TorusGeometry(r + k * 0.013, 0.0036, 10, 320), chrome.clone());
    d.position.z = b.position.z = -F.depth / 2;
    lean.add(front, d, b);
  }
  // the graduations cut into the glass face: every 3°, longer every 15°, from just inside the outer bevel
  const cut = new THREE.MeshStandardMaterial({ color: mix(pal.ink, pal.surface2, 0.42), metalness: 0.2, roughness: 0.45 });
  const L0 = 0.016, L1 = 0.03;
  for (const [len, every, skip] of [[L0, 3, 15], [L1, 15, 0]] as const) {
    const n = 360 / every;
    const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(len, 0.0042, 0.0016), cut, n);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1);
    let i = 0;
    for (let k = 0; k < n; k++) {
      const deg = k * every;
      if (skip && deg % skip === 0) { m.makeScale(0, 0, 0); ticks.setMatrixAt(i++, m); continue; }
      const t = THREE.MathUtils.degToRad(deg), r = F.rOut - 0.024 - len / 2;
      q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), t);
      m.compose(new THREE.Vector3(r * Math.cos(t), r * Math.sin(t), F.depth / 2 + 0.0004), q, s);
      ticks.setMatrixAt(i++, m);
    }
    lean.add(onlyIn(ticks, false));
  }
  // behind the glass, a fine chrome retaining ring along the band's middle: the frost blurs it to a soft line
  const wire = behind(new THREE.TorusGeometry((F.rIn + F.rOut) / 2, 0.011, 12, 320), dark.clone());
  wire.position.z = -F.depth / 2 - 0.03;
  lean.add(wire);
  // the frame's bearings: a turned boss on the inner wall at each end of the horizontal diameter, and on the rim at
  // the top, where the inner ring's axis meets it, the dial's boss
  for (const s of [1, -1]) {
    lean.add(metal(pin(s * (F.rIn + 0.012), s * (F.rIn - 0.03), 0.03, "x", 40)));
    lean.add(metal(pin(s * (F.rIn - 0.03), s * (F.rIn - 0.04), 0.023, "x", 40), dark));
  }
  lean.add(metal(pin(F.rOut - 0.012, F.rOut + GIMBAL.dial.lift - 0.012, 0.024, "y", 40)));
  lean.add(metal(pin(F.rOut + GIMBAL.dial.lift - 0.012, F.rOut + GIMBAL.dial.lift, 0.017, "y", 40), dark));

  // the middle ring, on the frame's horizontal pins, with a collar at the ring
  const outer = new THREE.Group();
  lean.add(outer);
  const ringO = O.r - O.w / 2, ringO1 = O.r + O.w / 2;
  outer.add(metal(annulus(ringO, ringO1, O.depth, 0.008)));
  const grooveO = metal(new THREE.TorusGeometry(O.r, 0.003, 8, 320), dark); // one groove, on the front face
  grooveO.position.z = O.depth / 2;
  outer.add(grooveO);
  for (const s of [1, -1]) {
    outer.add(metal(pin(s * (ringO1 - 0.01), s * (F.rIn - 0.035), GIMBAL.pin, "x")));
    outer.add(metal(pin(s * (ringO1 - 0.004), s * (ringO1 + 0.026), GIMBAL.pin * 2.2, "x", 32)));
  }

  // the green ball at the exact centre (the assets station's ball, with the intelligence ball's clean edge), on the
  // vertical axle the middle ring carries through the inner ring's pivots: the rings turn about it, it never moves
  const R = GIMBAL.ball;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), cleanEdge(greenBall(pal), mix(pal.green, pal.ink, 0.5)));
  outer.add(onlyIn(ball, false));
  const ringI = I.r - I.w / 2, ringI1 = I.r + I.w / 2;
  // the axle, no collars on the ball: below, from the pole (behind the ball) to the inner ring; above, a unit pin
  // stretched each frame from where it leaves the ball's outline on screen (axleStart), so nothing shows on the green
  outer.add(metal(pin(-(R - 0.02), -(ringI + 0.01), GIMBAL.pin * 1.1, "y")));
  const top = metal(pin(0, 1, GIMBAL.pin * 1.1, "y"));
  outer.add(top);
  const reach = (a: number) => { const y0 = axleStart(a); top.position.y = y0; top.scale.y = ringI + 0.01 - y0; };
  reach(GIMBAL.rest);

  // the inner ring, on the vertical pins; its pins to the middle ring, with collars
  const inner = new THREE.Group();
  outer.add(inner);
  inner.add(metal(annulus(ringI, ringI1, I.depth, 0.007)));
  const grooveI = metal(new THREE.TorusGeometry(I.r, 0.003, 8, 280), dark);
  grooveI.position.z = I.depth / 2;
  inner.add(grooveI);
  for (const s of [1, -1]) {
    inner.add(metal(pin(s * (ringI1 - 0.01), s * (ringO + 0.01), GIMBAL.pin, "y")));
    inner.add(metal(pin(s * (ringI1 - 0.004), s * (ringI1 + 0.024), GIMBAL.pin * 2.1, "y", 32)));
    inner.add(metal(pin(s * (ringO + 0.004), s * (ringO - 0.02), GIMBAL.pin * 2.1, "y", 32)));
  }

  return view(scene, camera, (p) => {
    outer.rotation.x = p.a;
    reach(p.a);
    inner.rotation.y = p.b;
  });
}
