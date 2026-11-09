import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { CAM, CAM_POS } from "./geo";
import {
  ASSETS, DATA, DATA_TILT, INTEL, INTEL_BALL, intelFrame, intelSpin,
  type AssetsPose, type DataPose, type IntelPose,
} from "./scenes";

// Option 3's WebGL (D72), loaded with a dynamic import on the client only. One renderer for the whole page: each
// drawing renders its scene into the corner of the shared canvas and copies it into its own 2D canvas straight away
// (transparent, so the page shows round the glass). A neutral studio (RoomEnvironment through PMREM) lights everything;
// one soft key light from the upper left. The frosted glass is MeshPhysicalMaterial transmission with roughness, so the
// green ball behind the disc is genuinely blurred by three's transmission pass.
//
// The glass sees a backdrop of the page's own surface colour (drawn into the transmission pass only, never on screen),
// at partial alpha, so the frost reads as milky glass over the light page and lets the lines under it show, muted.

// Every material colour comes from the page's tokens, read at runtime
export type Tokens = { green: string; surface: string; surface2: string; onDark: string; ink: string; muted: string };
type Pal = { green: THREE.Color; surface: THREE.Color; surface2: THREE.Color; onDark: THREE.Color; ink: THREE.Color; muted: THREE.Color };
const palette = (t: Tokens): Pal => ({
  green: new THREE.Color(t.green), surface: new THREE.Color(t.surface), surface2: new THREE.Color(t.surface2),
  onDark: new THREE.Color(t.onDark), ink: new THREE.Color(t.ink), muted: new THREE.Color(t.muted),
});
const mix = (a: THREE.Color, b: THREE.Color, k: number) => a.clone().lerp(b, k);
type Engine = { renderer: THREE.WebGLRenderer; env: THREE.Texture; users: number };
let engine: Engine | null = null;
let release = 0;

function getEngine(): Engine {
  if (engine) { clearTimeout(release); return engine; }
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(1); // the drawings pass device pixels (capped at 2×) themselves
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.autoClear = false;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.06).texture; // a little blurred, so chrome reads as smooth studio light
  room.dispose();
  pmrem.dispose();
  engine = { renderer, env, users: 0 };
  return engine;
}

function dropEngine() {
  if (!engine || --engine.users > 0) return;
  // a short grace, so a remount (fast refresh, a re-render) doesn't rebuild the studio
  release = window.setTimeout(() => {
    if (!engine || engine.users > 0) return;
    engine.env.dispose();
    engine.renderer.dispose();
    engine.renderer.forceContextLoss();
    engine = null;
  }, 1500);
}

// The page surface, seen by the glass only
function backdrop(color: THREE.Color, alpha: number) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { c: { value: color }, a: { value: alpha } },
    vertexShader: "void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 c; uniform float a; void main(){ gl_FragColor = vec4(c, a); }",
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mat);
  mesh.position.set(-CAM_POS[0] * 0.8, -CAM_POS[1] * 0.8, -CAM_POS[2] * 0.8); // well behind everything, facing the lens
  mesh.lookAt(...CAM_POS);
  mesh.renderOrder = -1;
  mesh.onBeforeRender = (r) => { mat.colorWrite = r.getRenderTarget() !== null; };
  return mesh;
}

function studio(scene: THREE.Scene, env: THREE.Texture, pal: Pal) {
  scene.environment = env;
  scene.environmentIntensity = 1;
  const key = new THREE.DirectionalLight(pal.onDark, 1.1);
  key.position.set(-4, 6, 5);
  scene.add(key);
  const camera = new THREE.PerspectiveCamera(CAM.fov, 4 / 3, 1, 120);
  camera.position.set(...CAM_POS);
  camera.lookAt(0, 0, 0);
  return camera;
}

const frosted = (tint: THREE.Color, pal: Pal, roughness: number) => new THREE.MeshPhysicalMaterial({
  color: tint, metalness: 0, roughness, transmission: 1, thickness: 0.18, ior: 1.45,
  specularIntensity: 0.9, attenuationColor: pal.surface, attenuationDistance: 1.6, premultipliedAlpha: true,
});
const polished = (pal: Pal) => new THREE.MeshPhysicalMaterial({ color: pal.onDark, metalness: 1, roughness: 0.08 });
const polishedDark = (pal: Pal) => new THREE.MeshPhysicalMaterial({ color: mix(pal.ink, pal.surface2, 0.35), metalness: 1, roughness: 0.2 });
const greenBall = (pal: Pal) => new THREE.MeshPhysicalMaterial({
  color: pal.green, metalness: 0.92, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06,
});

// Draw a mesh only into the glass's transmission pass (seen through the frost), or only on screen
const onlyIn = (mesh: THREE.Mesh, glass: boolean) => {
  const m = mesh.material as THREE.Material;
  mesh.onBeforeRender = (r) => { const on = (r.getRenderTarget() !== null) === glass; m.colorWrite = on; m.depthWrite = on; };
  return mesh;
};

// A radial mask (centre to edge) for the disc's soft inner glow toward its rim
function rimMask() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, "black"); grad.addColorStop(0.55, "black"); grad.addColorStop(0.9, "gray"); grad.addColorStop(1, "white");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

// A soft round shadow (an alpha mask in the ink colour), for a ball sitting on the glass and the ring over the page
function softShadow(ink: THREE.Color, opacity: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "white"); grad.addColorStop(0.45, "gray"); grad.addColorStop(1, "black");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const mask = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshBasicMaterial({ color: ink, alphaMap: mask, transparent: true, opacity, depthWrite: false, toneMapped: false });
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.mask = mask;
  return mesh;
}

export type View<P> = { update: (pose: P) => void; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; dispose: () => void };

function view<P>(scene: THREE.Scene, camera: THREE.Camera, update: (pose: P) => void): View<P> {
  const e = getEngine();
  e.users++;
  return {
    update,
    draw(ctx, w, h) {
      const r = e.renderer, c = r.domElement;
      if (c.width < w || c.height < h) r.setSize(Math.max(c.width, w), Math.max(c.height, h), false);
      r.setViewport(0, 0, w, h);
      r.setScissor(0, 0, w, h);
      r.setScissorTest(true);
      r.clear();
      r.render(scene, camera);
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(c, 0, c.height - h, w, h, 0, 0, w, h);
    },
    dispose() {
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
          (o.userData.mask as THREE.Texture | undefined)?.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => (m as THREE.MeshPhysicalMaterial).emissiveMap?.dispose());
        }
      });
      scene.clear();
      dropEngine();
    },
  };
}

export function dataView(tokens: Tokens): View<DataPose> {
  const e = getEngine();
  const pal = palette(tokens);
  const scene = new THREE.Scene();
  const camera = studio(scene, e.env, pal);
  // the page as the glass sees it, a touch brighter than the page, so the frost reads milky and light
  scene.add(backdrop(mix(pal.surface, pal.onDark, 0.5), 0.86));

  const frame = new THREE.Group();
  frame.rotation.x = DATA_TILT;
  scene.add(frame);
  const disc = new THREE.Group();
  frame.add(disc);
  // the frosted disc: bright milky glass with a soft glow toward its rim; its round side polished metal
  const body = new THREE.CylinderGeometry(DATA.R, DATA.R, DATA.thick, 160, 1);
  body.rotateX(Math.PI / 2);
  const glass = frosted(pal.onDark, pal, 0.55);
  glass.emissive = pal.onDark.clone();
  glass.emissiveMap = rimMask();
  glass.emissiveIntensity = 0.32;
  disc.add(new THREE.Mesh(body, [polished(pal), glass, glass]));
  // the micro bevel on each face: a dark hairline at the very edge and a bright one just inside it
  for (const z of [DATA.thick / 2, -DATA.thick / 2]) {
    const dark = new THREE.Mesh(new THREE.TorusGeometry(DATA.R - 0.002, 0.0062, 12, 240), polishedDark(pal));
    const bright = new THREE.Mesh(new THREE.TorusGeometry(DATA.R - 0.017, 0.0058, 12, 240), polished(pal));
    dark.position.z = bright.position.z = z;
    disc.add(dark, bright);
  }
  // the ball: polished metal on screen; through the frost the glass sees a quieter, matte version of the same green,
  // so the diffused ball stays the token's green instead of blooming into a bright mint
  const sphere = new THREE.SphereGeometry(DATA.ball, 64, 48);
  const ball = onlyIn(new THREE.Mesh(sphere, greenBall(pal)), false);
  const seen = onlyIn(new THREE.Mesh(sphere.clone(), new THREE.MeshStandardMaterial({ color: mix(mix(pal.green, pal.ink, 0.45), pal.surface2, 0.12), metalness: 0.2, roughness: 0.6 })), true);
  frame.add(ball, seen);

  return view(scene, camera, (p) => {
    disc.rotation.y = p.yaw;
    ball.position.set(...p.ball);
    seen.position.set(...p.ball);
  });
}

export function assetsView(tokens: Tokens): View<AssetsPose> {
  const e = getEngine();
  const pal = palette(tokens);
  const scene = new THREE.Scene();
  const camera = studio(scene, e.env, pal);
  scene.add(backdrop(pal.surface, 0.62));

  const frame = new THREE.Group();
  frame.rotation.x = ASSETS.tilt;
  frame.position.y = ASSETS.y;
  scene.add(frame);
  // the washer: a frosted annulus with polished, slightly bevelled edges
  const shape = new THREE.Shape().absarc(0, 0, ASSETS.rOut, 0, Math.PI * 2, false);
  shape.holes.push(new THREE.Path().absarc(0, 0, ASSETS.rIn, 0, Math.PI * 2, true));
  const bev = 0.012;
  const ring = new THREE.ExtrudeGeometry(shape, { depth: ASSETS.thick - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 180 });
  ring.translate(0, 0, -(ASSETS.thick - 2 * bev) / 2);
  ring.rotateX(-Math.PI / 2);
  frame.add(new THREE.Mesh(ring, [frosted(mix(pal.surface2, pal.onDark, 0.2), pal, 0.42), polished(pal)]));
  // the ball is drawn on screen only: if the frosted washer saw it in its transmission pass, it would smear a green
  // haze across the glass beside the ball (the refraction offset samples the ball's pixels)
  const ball = onlyIn(new THREE.Mesh(new THREE.SphereGeometry(ASSETS.ball, 64, 48), greenBall(pal)), false);
  frame.add(ball);
  // where the ball sits on the glass, and the ring's own soft shadow on the page below
  const contact = softShadow(pal.ink, 0.5);
  contact.scale.setScalar(ASSETS.ball * 3.6);
  frame.add(contact);
  const ground = softShadow(pal.ink, 0.07);
  ground.scale.set(ASSETS.rOut * 2.5, 1, ASSETS.rOut * 2.2);
  ground.position.y = -0.55;
  frame.add(ground);
  const top = ASSETS.thick / 2 + 0.003;

  return view(scene, camera, (p) => {
    ball.position.set(...p.green);
    contact.position.set(p.green[0], top, p.green[2]);
  });
}

// Machined chrome: clean polished metal (its studio reflections stay broad and smooth) with fine concentric lathe
// hairlines cut into it about `axis`, in the mesh's own frame, so they turn with it. Procedural, no texture: each
// hairline darkens the metal's reflectance along a thin ring (by the angle from the groove axis), antialiased to the
// pixel and faded out where the rings crowd tighter than about 4 px, near the core's outline and toward the grooves'
// poles, so they never shimmer and no bullseye draws the eye. Every few rings a slightly deeper cut and a slow
// variation between passes give the rings something to carry as the core turns.
function machined(pal: Pal, axis: THREE.Vector3) {
  // green anodised metal under a clear coat (D79: the core is the green ball, the ball outside is chrome)
  const m = new THREE.MeshPhysicalMaterial({ color: pal.green, metalness: 0.92, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.06 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uGroove = { value: axis };
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vObjN;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObjN = normal;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uGroove;\nvarying vec3 vObjN;")
      .replace("#include <color_fragment>", `#include <color_fragment>
      {
        vec3 on = normalize(vObjN);
        float th = atan(length(cross(on, uGroove)), dot(on, uGroove)); // the angle from the pole, stable near it
        float u = th * 14.0;                         // 14 rings a radian: about 44 pole to pole, 5 px apart at 2×
        float fu = fwidth(u);
        float d = abs(fract(u) - 0.5) / max(fu, 1e-4);   // distance to the ring's centre, in pixels
        float line = 1.0 - smoothstep(0.35, 1.1, d);
        float deep = step(0.8, fract(floor(u) / 5.0));  // every fifth ring a deeper cut
        float pass = 0.75 + 0.25 * sin(th * 7.0);       // the machining passes
        float fade = 1.0 - smoothstep(0.2, 0.34, fu);
        // and toward the grooves' poles: no bullseye, and no comb where the rings close round a pole near the outline;
        // the rings show as a broad belt of hairlines that sways and drifts across the core as it turns
        fade *= smoothstep(0.5, 0.88, sin(th));
        fade *= smoothstep(0.15, 0.4, dot(normalize(vNormal), normalize(vViewPosition)));
        diffuseColor.rgb *= 1.0 - line * fade * pass * mix(0.45, 0.62, deep);
      }`);
  };
  m.customProgramCacheKey = () => "o3-machined-5";
  return m;
}

// A milky veil on glass, by the angle between the surface and the view (`e`, 0 facing the camera, 1 at the outline):
// a glow from `inner` to `outer` toward the edge (brighter on the upper left, toward the key light), a soft shading
// (`shade`) in a ring just inside the edge, so a frosted ball has its volume, and in the last pixel or two the glow
// gives way, so the glass keeps a fine contour on the light page
function veiled(m: THREE.MeshPhysicalMaterial, color: THREE.Color, inner: number, outer: number, power = 2.2, shade = 0) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uVeil = { value: color };
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uVeil;")
      .replace("#include <opaque_fragment>", `{
        float e = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
        float rim = 1.0 - smoothstep(0.8, 1.0, e);
        float ring = smoothstep(0.2, 0.62, e) * (1.0 - smoothstep(0.72, 0.9, e));
        float key = 0.82 + 0.14 * normal.y - 0.08 * normal.x;
        outgoingLight = outgoingLight * (1.0 - ${shade.toFixed(3)} * ring)
          + uVeil * mix(${inner.toFixed(3)}, ${outer.toFixed(3)}, pow(e, ${power.toFixed(2)})) * rim * key;
      }
      #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => `o3-veil-${inner}-${outer}-${power}-${shade}`;
  return m;
}

// The green ball's silhouette: on a small ball the polished coat's grazing reflections flick between the studio's light
// and dark from pixel to pixel, which reads as a speckled grey fringe on the light page. Here the last sliver toward the
// outline settles to a deep shade of the ball's own green instead (this station's ball only)
function cleanEdge(m: THREE.MeshPhysicalMaterial, edge: THREE.Color) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uEdge = { value: edge };
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uEdge;")
      .replace("#include <tonemapping_fragment>", `{
        float facing = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, uEdge, smoothstep(0.62, 0.9, 1.0 - facing));
      }
      #include <tonemapping_fragment>`);
  };
  m.customProgramCacheKey = () => "o3-clean-edge";
  return m;
}

export function intelligenceView(tokens: Tokens): View<IntelPose> {
  const e = getEngine();
  const pal = palette(tokens);
  const scene = new THREE.Scene();
  const camera = studio(scene, e.env, pal);
  // the page as the glass sees it: a light grey, cooled a little with the muted ink (the only cool token), so the glass
  // reads neutral like Orbit's still, and the veil and the rim give it its volume
  scene.add(backdrop(mix(pal.surface2, pal.muted, 0.12), 0.93));

  // the sphere's frame: rolled about the view at its centre, then pitched (the entry turn), then the core's spin
  const outer = new THREE.Group();
  outer.position.set(...INTEL.S);
  scene.add(outer);
  const frame = new THREE.Group();
  outer.add(frame);
  const spin = new THREE.Group();
  frame.add(spin);

  // the seal: one sphere in three zones, flush (no lip anywhere): frosted caps above and below, and a narrow clear
  // zone at the equator, the band, where the core is seen sharply
  const { R, band: h } = INTEL;
  const b = Math.asin(h / 2 / R); // the band's half-height as an angle from the equator
  const frost = veiled(new THREE.MeshPhysicalMaterial({
    color: pal.onDark, metalness: 0, roughness: 0.06, transmission: 1, thickness: 0.15, ior: 1.25, specularIntensity: 1, envMapIntensity: 1.6,
    premultipliedAlpha: true,
  }), mix(pal.onDark, pal.muted, 0.04), 0.05, 0.9, 2.6, 0.2);
  frame.add(
    new THREE.Mesh(new THREE.SphereGeometry(R, 192, 64, 0, Math.PI * 2, 0, Math.PI / 2 - b), frost),
    new THREE.Mesh(new THREE.SphereGeometry(R, 192, 64, 0, Math.PI * 2, Math.PI / 2 + b, Math.PI / 2 - b), frost),
  );
  // the band: clear polished glass, barely refracting (a thin shell), a little brighter at its very edge like the
  // frost, between two fine polished seams
  const clear = veiled(new THREE.MeshPhysicalMaterial({
    color: pal.onDark, metalness: 0, roughness: 0, transmission: 1, thickness: 0.08, ior: 1.3, specularIntensity: 1.2, envMapIntensity: 2.6,
    premultipliedAlpha: true,
  }), mix(pal.onDark, pal.muted, 0.04), 0.05, 0.8, 2.4);
  frame.add(new THREE.Mesh(new THREE.SphereGeometry(R, 256, 6, 0, Math.PI * 2, Math.PI / 2 - b, 2 * b), clear));
  // (centred on the surface, on screen only: the near halves show, the far halves stay hidden by the glass in front)
  const seam = 0.0036, rs = R * Math.cos(b), ys = R * Math.sin(b);
  const edgeTop = onlyIn(new THREE.Mesh(new THREE.TorusGeometry(rs, seam, 10, 256), polished(pal)), false);
  const edgeBottom = onlyIn(new THREE.Mesh(new THREE.TorusGeometry(rs, seam, 10, 256), polished(pal)), false);
  edgeTop.rotation.x = edgeBottom.rotation.x = Math.PI / 2;
  edgeTop.position.y = ys;
  edgeBottom.position.y = -ys;
  frame.add(edgeTop, edgeBottom);
  // the seams' far halves, seen only through the glass (quieter, so the band reads as a whole ellipse when it tilts)
  const far = new THREE.MeshStandardMaterial({ color: mix(pal.onDark, pal.muted, 0.12), metalness: 0, roughness: 0.6 });
  for (const y of [ys, -ys]) {
    const t = onlyIn(new THREE.Mesh(new THREE.TorusGeometry(rs * 0.99, seam * 1.5, 8, 256, Math.PI), far.clone()), true);
    t.rotation.x = Math.PI / 2;
    t.rotation.z = Math.PI; // the half toward -z, away from the camera at rest
    t.position.y = y;
    frame.add(t);
  }
  // the core: machined chrome, turning; its grooves' pole sits high on the core, so the rings cross its face as near
  // level arcs and sway and drift as it turns (the pole itself only passes the top edge, foreshortened)
  const axis = new THREE.Vector3(0, Math.cos(INTEL.grooves), Math.sin(INTEL.grooves));
  // (an icosphere: no poles in the mesh, whose thin triangle fans would put teeth in the hairlines)
  spin.add(new THREE.Mesh(new THREE.IcosahedronGeometry(INTEL.core, 28), machined(pal, axis)));

  // the chrome ball outside (D79), still, on screen only (if the glass saw it, its transmission would smear it beside
  // it, D75)
  const ball = onlyIn(new THREE.Mesh(new THREE.SphereGeometry(INTEL.ball, 64, 48), cleanEdge(polished(pal), mix(pal.ink, pal.surface2, 0.45))), false);
  ball.position.set(...INTEL_BALL);
  scene.add(ball);

  return view(scene, camera, (p) => {
    const f = intelFrame(p.lean);
    outer.rotation.z = f.roll;
    frame.rotation.x = f.pitch;
    spin.rotation.y = intelSpin(p.t);
  });
}

// The kit, for the identity options' scenes (D80, lab): the shared studio, materials and render loop, so every option
// is lit and made like the three stations on the rail. Read-only for the options; the stations above don't use it.
export type { Pal };
export const kit = { palette, mix, getEngine, backdrop, studio, frosted, polished, polishedDark, greenBall, onlyIn, softShadow, machined, veiled, cleanEdge, view };
