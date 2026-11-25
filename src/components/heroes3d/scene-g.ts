// Hero G · "Liquid metal": E's isometric angle over a dark, half-clear liquid, lit only by one soft spot from straight above. Under the surface data
// flows by (rows of hashes, block numbers, a green figure here and there), seen blurred and bent through the water: you can tell it is there and moving,
// not read it (privacy). The NEAR mark lies flat in the liquid, face up, as E's plates lie on the paper; on load it rises up through the surface (its
// top first, then its sides coming out), still coated in the liquid, which drains off it, leaving soft satin metal under the spot. As it settles, one
// green flash: a ring of green light runs out across the liquid and a green light warms its edges. Then slow rings keep spreading from it, calmly.
// Scrolling (the hero is pinned for 1.4 screens): the data fades, the mark sinks back, the Stack's pillar of cubes rises out of the liquid where it
// was, the view settles on the drawing's exact angle, and the liquid darkens into the Stack band's ink.
import * as THREE from "three";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { type Mount, type Frame, GREEN, INK, STACK, nOutline, damp, hash, ease, frameView, free, reduced, stage } from "./common";
import { bloom } from "./post";

const SIZE = 3.2, DEPTH = 0.8, SINK = 0.1;                 // the mark: its length across the liquid, its thickness, how deep its foot stays in
const REST = DEPTH / 2 - SINK;                              // its centre's height at rest
const LOW = -DEPTH / 2 - 0.5;                               // and before it rises (all under the surface)
const RISE = [0.5, 3.4] as const;                           // the rise: from, to (s)
const FLASH = RISE[1] - 0.15;                               // the green flash, as it settles
const CA = 0.7, CH = 1.12;                                  // a pillar cube: width, height (PILLAR in v7/stack/geometry.ts)
const ISO = Math.atan(1 / Math.SQRT2);                      // the drawing's camera pitch (true isometric)
const RINGS = 10;                                           // ripples alive at once
const BLACK = new THREE.Color("#040404");
const EXPOSURE = 1;
// the Stack band's ink as the picture must hold it to come out as that ink: the neutral tone mapping darkens the darks (by 6.25 x² below 0.08), so the
// value is lifted to make up for it, and the veil closes on the same grey
const INKC = new THREE.Color(INK); INKC.setScalar(Math.sqrt(INKC.r / 6.25) / EXPOSURE);

/* the liquid: a flat plane, still but for its rings (whatever breaks its surface, and the slow ones the mark sends out: an analytic height field in its
   shading); a dim mirror of the scene above it; the spot's pool of light; through it, the data flowing on a floor below, sampled where the view ray
   meets that floor, bent by the slopes and blurred (a coarse level of its mip chain); and the green ring of the flash */
const LIQ_VS = /* glsl */ `
  uniform mat4 mirror; varying vec3 vW; varying vec4 vM;
  void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vM = mirror * w; gl_Position = projectionMatrix * viewMatrix * w; }`;
const LIQ_FS = /* glsl */ `
  uniform sampler2D tMirror, tData; uniform vec3 view, bg, green; uniform vec2 flow; uniform float t, gAt, gOn, fade, data;
  uniform vec4 ring[${RINGS}]; uniform float r0[${RINGS}];
  varying vec3 vW; varying vec4 vM;
  // the slope of the surface (dh/dx, dh/dz) at p: rings from a circle of radius r0, a front and a short trail of smaller waves, dying as they go
  vec2 slope(vec2 p){
    vec2 g = vec2(0.0);
    for (int i = 0; i < ${RINGS}; i++) {
      vec4 r = ring[i]; float age = t - r.z;
      if (r.w == 0.0 || age <= 0.0 || age > 6.0) continue;
      vec2 q = p - r.xy; float l = max(length(q), 1e-3), d = max(l - r0[i], 0.0);
      float x = d - age * 1.2;
      float env = exp(-max(x, 0.0) * max(x, 0.0) * 6.0 - min(x, 0.0) * min(x, 0.0) * 1.6) * exp(-age * 0.7) * smoothstep(0.0, 0.3, age) / (1.0 + d * 0.6);
      g += -r.w * env * 5.0 * sin(x * 5.0) * (q / l);
    }
    return g;
  }
  void main(){
    vec2 p = vW.xz;
    vec2 g = slope(p);
    vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
    float d = length(p);
    float fr = 0.12 + 0.4 * pow(1.0 - max(dot(n, view), 0.0), 5.0);          // a dark liquid: a dim mirror
    vec3 refl = texture2D(tMirror, vM.xy / vM.w - g * 0.05).rgb;
    // the data, 0.9 under the surface along the view ray, bent by the slopes: each row slides at its own pace; mostly blurred, sharper close to the mark
    vec2 f = p - view.xz * (0.9 / view.y) - g * 2.5;
    vec2 uv = vec2(dot(f, flow), dot(f, vec2(-flow.y, flow.x))) / vec2(9.0, 7.0);
    float row = floor(uv.y * 28.0);
    uv.x += t * (0.006 + fract(sin(row * 91.7) * 437.5) * 0.012) * (mod(row, 2.0) * 2.0 - 1.0);
    float bias = 2.2 + 1.6 * smoothstep(1.8, 5.5, d);
    vec3 dat = texture2D(tData, uv, bias).rgb * 0.6 + texture2D(tData, uv + vec2(0.004, 0.0), bias + 1.5).rgb * 0.4;
    float reach = smoothstep(-4.5, -0.5, dot(p, flow)) * (1.0 - smoothstep(2.5, 7.0, d));   // toward the copy (left on screen) it fades out
    vec3 c = mix(bg + dat * 0.09 * reach * data, refl, fr);
    // the spot from straight above: a soft pool on the liquid round the mark; the rings catch it
    float el = asin(clamp(reflect(-view, n).y, -1.0, 1.0));
    c += vec3(0.92, 0.95, 1.0) * exp(-pow(d / 3.2, 2.0)) * (0.012 + smoothstep(0.6, 0.9, el) * 0.08) * fade;
    // the green flash: a band of light running out from the mark, fading as it goes
    float ga = t - gAt;
    float band = exp(-pow((d - 1.6 - ga * 1.4) * 2.2, 2.0)) * exp(-ga * 0.9) * step(0.0, ga) * (1.0 - smoothstep(2.4, 5.0, d));   // it dies before it reaches the copy
    c += green * (band * 0.45 + exp(-max(d - 1.4, 0.0) * 1.6) * 0.02 * gOn) * fade;
    gl_FragColor = vec4(c, 1.0);
  }`;

/** what the metal reflects: a dark room with one soft disc of light straight above (the spot), turned into a blurred environment map, so the metal
    reads as satin under soft light rather than chrome under glare */
function softStudio(renderer: THREE.WebGLRenderer): THREE.Texture {
  const room = new THREE.Scene();
  room.background = new THREE.Color(0x030303);
  // each box lit brightest in its middle, fading to its edges (a canvas gradient), so the faces carry long soft gradients, never a hard edge
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const x = c.getContext("2d")!, gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "#fff"); gr.addColorStop(0.55, "#888"); gr.addColorStop(1, "#000");
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  const soft = new THREE.CanvasTexture(c); soft.colorSpace = THREE.SRGBColorSpace;
  const box = (w: number, h: number, az: number, el: number, k: number, col: THREE.ColorRepresentation = 0xffffff) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: soft, color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(10);
    m.lookAt(0, 0, 0); room.add(m);
  };
  const away = Math.PI / 4 + Math.PI;                       // beyond the mark, as the camera sees it
  box(44, 44, 0, Math.PI / 2, 1.6);                           // the spot's soft disc, straight above: the face catches its falloff
  box(6, 8, away - 1.2, 0.2, 0.25, GREEN);                    // a faint green one, far off
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(room, 0.06).texture;
  pm.dispose(); free(room); soft.dispose();
  return env;
}

/** the mark as one smooth solid: the outline extruded with a round bevel of many steps, its normals smoothed except across the true creases, and
    the two faces kept exactly flat (the shader rounds them a touch) */
function solidMark(): THREE.BufferGeometry {
  const pts = nOutline(SIZE, 900); pts.pop();
  const shape = new THREE.Shape(pts.map((v) => new THREE.Vector2(v.x, v.y)));
  const bev = 0.09;
  let g: THREE.BufferGeometry = new THREE.ExtrudeGeometry(shape, { depth: DEPTH - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.9, bevelSegments: 7, curveSegments: 1 });
  g.center();
  g = toCreasedNormals(g, 0.7);
  const n = g.getAttribute("normal") as THREE.BufferAttribute, pos = g.getAttribute("position") as THREE.BufferAttribute;
  const zf = DEPTH / 2 - 1e-3;
  for (let i = 0; i < pos.count; i += 3) {
    // a triangle of a face: all three corners on the face's plane
    const z0 = pos.getZ(i), z1 = pos.getZ(i + 1), z2 = pos.getZ(i + 2);
    const s = z0 > zf && z1 > zf && z2 > zf ? 1 : z0 < -zf && z1 < -zf && z2 < -zf ? -1 : 0;
    if (s) for (let k = 0; k < 3; k++) n.setXYZ(i + k, 0, 0, s);
  }
  return g;
}

export const mount: Mount = (canvas, section, track) => {
  const rm = reduced();
  const scene = new THREE.Scene();
  const bg = new THREE.Color().copy(BLACK);
  scene.background = bg;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 120);
  let aspect = 1, post: ReturnType<typeof bloom> | null = null;
  const mirrorRT = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType });
  const st = stage(canvas, section, { clear: "#040404", tone: THREE.NeutralToneMapping, exposure: EXPOSURE, track, dpr: 1.5 }, camera,
    (w, h) => {
      aspect = w / h; post?.size();
      const k = Math.min(devicePixelRatio || 1, 1.5) * 0.9;   // the mirror's frame is wider than the screen's (see mirrorPass)
      mirrorRT.setSize(Math.round(w * k), Math.round(h * k));
    }, (f) => frame(f));
  scene.environment = softStudio(st.renderer);
  post = bloom(st.renderer, scene, camera, 0.16, 0.5, 0.96);

  /* the mark: satin-polished metal lying flat, coated at first in the liquid, which drains off its face in a sheet and down its sides */
  const markU = { bulge: { value: 0.12 }, film: { value: rm ? -9 : DEPTH } };
  const metal = new THREE.MeshPhysicalMaterial({ color: 0xe9ebee, metalness: 0.82, roughness: 0.34, clearcoat: 0.35, clearcoatRoughness: 0.2, envMapIntensity: 1 });
  metal.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, markU);
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float bulge; varying vec3 vLoc;")
      .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\n  vLoc = position;\n  if (abs(objectNormal.z) > 0.999) objectNormal.xy += position.xy * bulge;");
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", /* glsl */ `#include <common>
        uniform float film; varying vec3 vLoc;
        // how much of the liquid still clings here: under a level that drains down through the mark's thickness, uneven across its face (the sheet
        // breaks up and slides off it in patches, its edges last)
        float wet(){
          float n = 0.14 * sin(vLoc.x * 2.1 + 0.7) * sin(vLoc.y * 1.6 - 0.4) + 0.06 * sin(vLoc.x * 5.3 - vLoc.y * 4.1);
          return 1.0 - smoothstep(film - 0.04, film + 0.03, vLoc.z + n);
        }`)
      .replace("#include <color_fragment>", "#include <color_fragment>\n  float wetK = wet();\n  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.01), wetK);")
      .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\n  metalnessFactor = mix(metalnessFactor, 0.0, wetK);")
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, 0.08, wetK);");
  };
  const mark = new THREE.Mesh(solidMark(), metal);
  mark.rotation.x = -Math.PI / 2;                             // lying flat, face up, its thickness upright
  const holder = new THREE.Group(); holder.rotation.y = 0.62; holder.add(mark);   // turned as E's plates are
  holder.position.y = rm ? REST : LOW;
  scene.add(holder);

  /* the lights: the spot straight above, and the green one of the flash */
  const spot = new THREE.SpotLight(0xf2f5fa, 60, 16, 0.42, 1, 1.6); spot.position.set(0, 9, 0); spot.target.position.set(0, 0, 0);
  scene.add(spot, spot.target);
  const rim = new THREE.PointLight(GREEN, 0, 7, 1.4); rim.position.set(-1.6, 1.1, -1.8); scene.add(rim);

  /* the liquid */
  const ring = Array.from({ length: RINGS }, () => new THREE.Vector4(0, 0, -99, 0));
  const r0 = new Array<number>(RINGS).fill(0);
  const view = new THREE.Vector3();
  /* the data under the surface: rows of hashes, block numbers and figures, drawn once on a canvas (its mip chain gives the blur) */
  const dataTex = (() => {
    const c = document.createElement("canvas"); c.width = 2048; c.height = 1024;
    const x = c.getContext("2d")!;
    x.fillStyle = "#000"; x.fillRect(0, 0, 2048, 1024);
    x.font = "500 22px ui-monospace, SFMono-Regular, Menlo, monospace"; x.textBaseline = "middle";
    const hex = (k: number, n: number) => Array.from({ length: n }, (_, i) => "0123456789abcdef"[Math.floor(hash(k * 13.1 + i * 7.3) * 16)]).join("");
    for (let r = 0; r < 28; r++) {
      let px = hash(r * 3.7) * 120, k = r * 50;
      while (px < 2048) {
        const kind = hash(k * 1.9);
        const s = kind < 0.45 ? "0x" + hex(k, 8 + Math.floor(hash(k * 2.3) * 24)) : kind < 0.65 ? "#" + Math.floor(1e5 + hash(k * 5.1) * 9e6).toLocaleString("en") : kind < 0.8 ? "▮▮ ▮▮▮ ▮" : hex(k, 4) + " " + hex(k + 1, 4) + " " + hex(k + 2, 4);
        x.fillStyle = hash(k * 8.7) > 0.88 ? GREEN : `rgba(225,230,235,${0.45 + hash(k * 4.3) * 0.55})`;
        x.fillText(s, px, (r + 0.5) * (1024 / 28));
        px += x.measureText(s).width + 28 + hash(k * 6.1) * 90; k++;
      }
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  })();
  const liqU = {
    tMirror: { value: mirrorRT.texture }, mirror: { value: new THREE.Matrix4() }, view: { value: view }, bg: { value: bg }, green: { value: new THREE.Color(GREEN) },
    tData: { value: dataTex }, flow: { value: new THREE.Vector2(Math.cos(Math.PI / 4), -Math.sin(Math.PI / 4)) }, data: { value: 1 },
    t: { value: 0 }, gAt: { value: rm ? -99 : FLASH }, gOn: { value: 0 }, fade: { value: 1 }, ring: { value: ring }, r0: { value: r0 },
  };
  const liquid = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.ShaderMaterial({ vertexShader: LIQ_VS, fragmentShader: LIQ_FS, uniforms: liqU }));
  liquid.rotation.x = -Math.PI / 2;
  scene.add(liquid);
  let ri = 0;
  const ripple = (amp: number, rad: number) => { ring[ri].set(0, 0, st.f.t, amp); r0[ri] = rad; ri = (ri + 1) % RINGS; };

  /* the Stack's pillar: six cubes in the drawing's greens with its cream outline, risen out of the liquid as the hero scrolls away */
  const pillar = new THREE.Group(); pillar.visible = false; scene.add(pillar);
  const boxGeo = new THREE.BoxGeometry(CA, CH, CA), edgeGeo = new THREE.EdgesGeometry(boxGeo);
  for (let i = 0; i < 6; i++) {
    const mats = [STACK.r, STACK.r, STACK.t, STACK.t, STACK.l, STACK.l].map((c) => new THREE.MeshBasicMaterial({ color: c }));
    const b = new THREE.Mesh(boxGeo, mats); b.position.y = CH / 2 + i * CH; pillar.add(b);
    const e = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0xf5f4f1 })); e.position.y = b.position.y; pillar.add(e);
  }

  /* the mirror: the scene seen from under the surface (the liquid hidden, everything below it cut away), into a texture the liquid looks up */
  const mcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 120);
  const cut = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)];
  const bias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
  const look = new THREE.Vector3();
  function mirrorPass() {
    const r = st.renderer;
    // the main camera mirrored in the surface, with a frame wider than its own (its view offset would point the wrong way once mirrored)
    mcam.position.set(camera.position.x, -camera.position.y, camera.position.z);
    mcam.up.set(0, 1, 0);
    mcam.lookAt(look.x, -look.y, look.z);
    const wx = (camera.right - camera.left) / camera.zoom, wy = (camera.top - camera.bottom) / camera.zoom;
    mcam.left = -wx * 0.95; mcam.right = wx * 0.95; mcam.top = wy * 0.95; mcam.bottom = -wy * 0.95;
    mcam.updateProjectionMatrix(); mcam.updateMatrixWorld();
    liqU.mirror.value.multiplyMatrices(bias, mcam.projectionMatrix).multiply(mcam.matrixWorldInverse);
    liquid.visible = false;
    const prev = r.getRenderTarget(), clip = r.clippingPlanes;
    r.clippingPlanes = cut;
    r.setRenderTarget(mirrorRT); r.clear(); r.render(scene, mcam);
    r.setRenderTarget(prev); r.clippingPlanes = clip;
    liquid.visible = true;
  }

  /* the motion */
  let lastRing = -99, lastCalm = 0, prevY = holder.position.y, prevP = 0;
  const dir = new THREE.Vector3();
  function frame(f: Frame) {
    const dt = f.dt || 1 / 60, t = f.t, p = f.p;
    liqU.t.value = t;

    // the scroll: the mark sinks back (0.04 to 0.42), the pillar rises where it was (0.34 to 0.78); the liquid darkens to the ink (0.55 to 0.9)
    const sink = ease.inOutCubic((p - 0.04) / 0.38), rise = ease.inOutCubic((p - 0.34) / 0.44), dark = ease.inOutCubic((p - 0.55) / 0.35);
    bg.copy(BLACK).lerp(INKC, dark);
    liqU.fade.value = 1 - dark * 0.9;
    liqU.data.value = 1 - ease.inOutCubic((p - 0.03) / 0.32);   // the data goes first

    // the mark: rises up through the surface on load, slowing to a stop with the least overshoot; sinks with the scroll
    const up = rm ? 1 : ease.outBack((t - RISE[0]) / (RISE[1] - RISE[0]), 0.6);
    const y = THREE.MathUtils.lerp(LOW, REST, up) - sink * (REST - LOW + 0.1);
    holder.position.y = y;
    holder.visible = y > LOW - 0.05;
    // the liquid it carried up drains off it: off its face first, then down its sides (from 1.4 s, over 3 s)
    markU.film.value = rm ? -9 : THREE.MathUtils.lerp(DEPTH / 2 + 0.25, -DEPTH / 2 - 0.4, ease.inOutCubic((t - 1.4) / 3.0));

    // ripples: only where something breaks the surface, as fast as it moves (the mark rising, settling and sinking; the pillar rising)
    const vy = (y - prevY) / dt; prevY = y;
    if (!rm && Math.abs(vy) > 0.06 && y > LOW && y < REST + 0.1 && t - lastRing > 0.45) { ripple(Math.min(0.03, Math.abs(vy) * 0.04), 1.5); lastRing = t; }
    // and, once it rests, slow rings from it, one after another, small
    if (!rm && t > RISE[1] + 1 && p < 0.05 && t - lastCalm > 2.4) { ripple(0.0075, 1.55); lastCalm = t; }
    pillar.position.y = THREE.MathUtils.lerp(-6 * CH - 0.2, 0, rise); pillar.visible = rise > 0.001;
    const pv = (rise - prevP) / dt; prevP = rise;
    if (!rm && pillar.visible && rise < 0.999 && Math.abs(pv) > 0.05 && t - lastRing > 0.45) { ripple(Math.min(0.025, Math.abs(pv) * 0.03), 0.4); lastRing = t; }

    // the green flash as it settles: a green light on its edges and a glow round it, swelling and then going (the ring itself is in the liquid)
    const ga = t - FLASH, g = rm ? 0 : ga < 0 ? 0 : Math.min(1, ga / 0.25) * Math.exp(-Math.max(0, ga - 0.25) * 0.8);
    liqU.gOn.value = g * (1 - sink);
    rim.intensity = g * 6 * (1 - sink);
    spot.intensity = damp(spot.intensity, 60 * (1 - dark * 0.6), 3, dt);

    // the view: isometric, a slow settle on load, the pointer's few degrees; with the scroll, the drawing's exact angle, centred, framing the pillar
    const settle = rm ? 1 : ease.outCubic(t / 4.5), hold = 1 - ease.inOutCubic((p - 0.05) / 0.4);
    const yaw = Math.PI / 4 + (f.px * 0.05 + (1 - settle) * -0.06) * hold;
    const pitch = ISO - f.py * 0.03 * hold;
    const zoom = ease.inOutCubic((p - 0.2) / 0.6);
    look.set(0, THREE.MathUtils.lerp(0.2, 2.9 * CH, zoom), 0);
    dir.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    view.copy(dir);
    camera.position.copy(dir).multiplyScalar(30).add(look);
    camera.lookAt(look);
    const viewH = THREE.MathUtils.lerp(f.wide ? 7.2 : 11, f.wide ? 10.5 : 13.5, zoom);
    camera.left = (-viewH * aspect) / 2; camera.right = (viewH * aspect) / 2; camera.top = viewH / 2; camera.bottom = -viewH / 2;
    camera.zoom = 0.94 + 0.06 * settle;
    camera.updateProjectionMatrix();
    frameView(camera, f.w, f.h, f.wide, 0.25 * hold, 0.24 * hold);
    camera.updateMatrixWorld();

    mirrorPass();
  }

  st.run(scene, () => post?.draw());
  return {
    step() {},   // the picture keeps still with the words: its one moment is the green flash as the mark settles
    dispose() { st.dispose(); post?.dispose(); mirrorRT.dispose(); dataTex.dispose(); free(scene); scene.environment?.dispose(); },
  };
};
