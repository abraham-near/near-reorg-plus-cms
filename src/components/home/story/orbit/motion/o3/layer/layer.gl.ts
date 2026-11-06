import * as THREE from "three";
import { kit, type Pal, type Tokens, type View } from "../gl";
import { LAYER, shapeOf, tokenAt, type LayerPose } from "./layer.scene";

// The layer moments (D86, design B), in the shared studio (loaded with a dynamic import, client only). See
// layer.scene.ts for the scene, the change and the vectors.
//
// Made like the stations: every surface is lit by the studio (its reflections are real, not painted), and every edge is
// real geometry with a small rounded bevel that catches the light, rather than a drawn line.
//
// What the glass sees (three's transmission pass, where only opaque things are drawn): the brushed plate itself, so the
// tokens refract it; under the core only, an even light ground and pale stand-ins for the tokens (a disc and a darker
// rim), so the growing core blurs them to soft pale discs, the data hidden inside; outside it, a dark ring at each
// token's foot and the dotted track, which the tokens' own glass refracts. The core's collar, the people's metal and
// the tokens' chrome and glyphs are drawn on screen only, so the frost never smears chrome or stains beside them (D75).
// Glass never sees a glass (transmissive things are not drawn into that pass).
const { palette, mix, getEngine, studio, polished, polishedDark, onlyIn, view } = kit;

// A little value noise, for the brushed grain and the frost's grain (procedural, no texture)
const NOISE = `
float lHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float lNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(lHash(i), lHash(i + vec2(1.0, 0.0)), f.x), mix(lHash(i + vec2(0.0, 1.0)), lHash(i + vec2(1.0, 1.0)), f.x), f.y);
}`;

// ── The studio's softbox. The shared studio is an environment at infinity seen through a very long lens, so a flat
// surface reflects the same direction at every point and reads as one flat tone (the plate, a token's face, the core's
// top: "graphic"). A real studio has a large soft light close by, whose reflection lands on a different part of each flat
// surface: here a rectangle up and behind the drawing, to the left (the key light's side), whose reflection is found per
// pixel (the reflected ray against its plane), softened by the surface's roughness and the distance, weighted by the
// Fresnel, and added to the surface's light. Brushed metal spreads it along the brushing's cross direction (`aniso`).
// Everything here is in view space (the camera never moves).
type Box = { uBoxC: { value: THREE.Vector3 }; uBoxU: { value: THREE.Vector3 }; uBoxW: { value: THREE.Vector3 }; uBoxN: { value: THREE.Vector3 }; uBoxS: { value: THREE.Vector2 }; uBoxI: { value: number } };
const BOX_GLSL = `
uniform vec3 uBoxC; uniform vec3 uBoxU; uniform vec3 uBoxW; uniform vec3 uBoxN; uniform vec2 uBoxS; uniform float uBoxI;
// the softness is the reflected ray's spread where it meets the box (roughness × distance), never sharper than a soft
// edge (a hard one sweeps across a turning surface as a pop), and stretched along the brushing's cross direction for
// brushed metal: one continuous footprint, so nothing steps as the plate turns
float boxHit(vec3 P, vec3 R, float soft, vec3 T, float aniso) {
  float dn = dot(R, uBoxN);
  if (dn > -1e-3) return 0.0;
  float t = dot(uBoxC - P, uBoxN) / dn;
  vec3 H = P + R * t - uBoxC;
  float u = dot(H, uBoxU), w = dot(H, uBoxW);
  vec2 s = vec2(soft * t + 0.06) + aniso * t * vec2(abs(dot(T, uBoxU)), abs(dot(T, uBoxW)));
  return smoothstep(-uBoxS.x - s.x, -uBoxS.x + s.x, u) * (1.0 - smoothstep(uBoxS.x - s.x, uBoxS.x + s.x, u))
    * smoothstep(-uBoxS.y - s.y, -uBoxS.y + s.y, w) * (1.0 - smoothstep(uBoxS.y - s.y, uBoxS.y + s.y, w));
}
vec3 boxLight(vec3 P, vec3 N, vec3 V, float rough, vec3 F0, float F90, vec3 T, float aniso) {
  vec3 R = reflect(-V, N);
  float soft = rough * rough * 1.4;
  float c = boxHit(P, R, soft, T, aniso);
  float nv = clamp(dot(N, V), 0.0, 1.0);
  return uBoxI * c * (F0 + (F90 - F0) * pow(1.0 - nv, 5.0));
}`;
function boxed(m: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial, box: Box, gain = 1, aniso?: { dir: { value: THREE.Vector3 }; k: number }) {
  const prev = m.onBeforeCompile, key = m.customProgramCacheKey;
  const g = { value: gain };
  m.onBeforeCompile = (sh, r) => {
    prev.call(m, sh, r);
    Object.assign(sh.uniforms, box, { uBoxGain: g }, aniso ? { uAniDir: aniso.dir, uAniK: m.userData.aniK } : {});
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\n${BOX_GLSL}\nuniform float uBoxGain;\n${aniso ? "uniform vec3 uAniDir;\nuniform float uAniK;" : ""}`)
      .replace("#include <opaque_fragment>", `outgoingLight += uBoxGain * boxLight(-vViewPosition, normal, normalize(vViewPosition), material.roughness,
        material.specularColorBlended, material.specularF90, ${aniso ? "normalize(uAniDir)" : "vec3(0.0)"}, ${aniso ? "uAniK" : "0.0"});
      #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => `${key.call(m)}-box${aniso ? "a" : ""}`;
  if (aniso) m.userData.aniK = { value: aniso.k };
  m.userData.boxGain = g;
  return m;
}

// The layer's own studio orientation: the same room as the stations, turned so the flat, upward-facing surfaces reflect
// its walls and boxes rather than its bright ceiling (which washed every flat face to white), and each material's
// share of it set (three ignores envMapIntensity unless the material carries the map itself)
const ENV_TURN = new THREE.Euler(1.0, 0, 0);
function inStudio<M extends THREE.MeshStandardMaterial>(m: M, env: THREE.Texture, k = 1) {
  m.envMap = env;
  m.envMapIntensity = k;
  m.envMapRotation.copy(ENV_TURN);
  return m;
}

// A disc's or a ring's outline as a lathe: a flat top (handled by the caller), a quarter-round bevel `b` at the top
// edge, a straight wall, and a smaller round `f` at the foot. Each part is its own group (bevel 0, wall 1), so they take
// their own materials; the normals are the profile's own, so the bevels catch the studio light like a turned edge.
function lathe(R: number, top: number, bottom: number, b: number, f: number, seg: number) {
  const pts: { r: number; y: number; nr: number; ny: number; part: 0 | 1 }[] = [];
  const steps = 7;
  for (let i = steps; i >= 0; i--) { const a = (i / steps) * Math.PI / 2; pts.push({ r: R - b + b * Math.cos(a), y: top - b + b * Math.sin(a), nr: Math.cos(a), ny: Math.sin(a), part: 0 }); }
  pts.push({ r: R, y: top - b, nr: 1, ny: 0, part: 1 });
  for (let i = 0; i <= 4; i++) { const a = -(i / 4) * Math.PI / 2; pts.push({ r: R - f + f * Math.cos(a), y: bottom + f + f * Math.sin(a), nr: Math.cos(a), ny: Math.sin(a), part: 1 }); }
  const pos: number[] = [], nor: number[] = [], idx: number[][] = [[], []];
  const n = pts.length;
  for (const p of pts) for (let j = 0; j <= seg; j++) {
    const t = (j / seg) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
    pos.push(p.r * c, p.y, p.r * s);
    nor.push(p.nr * c, p.ny, p.nr * s);
  }
  // (top to bottom: each band's triangles face out)
  for (let i = 0; i < n - 1; i++) {
    const part = pts[i].part === pts[i + 1].part ? pts[i + 1].part : 0;
    for (let j = 0; j < seg; j++) {
      const a = i * (seg + 1) + j, b2 = a + 1, c = a + seg + 1, d = c + 1;
      idx[part].push(a, b2, c, b2, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex([...idx[0], ...idx[1]]);
  g.addGroup(0, idx[0].length, 0);
  g.addGroup(idx[0].length, idx[1].length, 1);
  return g;
}

// The plate's top: brushed aluminium, its grain straight across (as a sheet is brushed; a turned grain throws a radial
// fan, a CD). Isotropic in the studio's lookup (an anisotropic one swung the whole plate's tone as it turned in); the
// softbox's footprint carries the stretch across the grain. Lawrence: "the brushed grain texture is too heavy": a very
// faint grain in the albedo and roughness (value noise, stretched along the brushing), gone wherever it would crowd
// under a pixel or two, so it reads as satin up close and never as streaks.
function brushed(pal: Pal) {
  const m = new THREE.MeshPhysicalMaterial({
    color: mix(pal.onDark, pal.muted, 0.32), metalness: 1, roughness: 0.3, envMapIntensity: 1,
  });
  const grain = { uGrain: { value: 60 }, uGrainK: { value: 0.016 } };
  m.userData.grain = grain;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, grain);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vLoc;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvLoc = position;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vLoc;\nuniform float uGrain;\nuniform float uGrainK;\n${NOISE}`)
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
      {
        // the brushing: long streaks across, fine lines down
        vec2 q = vec2(vLoc.x * 3.0, vLoc.z * uGrain);
        float fq = fwidth(q.y);
        float g = lNoise(q) * 0.55 + lNoise(q * vec2(3.1, 2.3) + 17.0) * 0.45;
        float fade = 1.0 - smoothstep(0.12, 0.3, fq);
        g = mix(0.5, g, fade);
        diffuseColor.rgb *= 1.0 + uGrainK * (g - 0.5);
        roughnessFactor = clamp(roughnessFactor + 0.03 * (g - 0.5), 0.05, 1.0);
      }`);
  };
  m.customProgramCacheKey = () => "layer-brushed-4";
  return m;
}

// Clear polished glass, for the tokens: three's transmission, as the stations' glass, so each token refracts the real
// brushed plate under it (its grain and the softbox's streak shift as they pass through). Light is lost at the walls
// (bent away and turned back inside), most just under the top edge; the rounded top edge catches the studio.
function clearGlass(pal: Pal, R: number, H: number) {
  const dome = { value: 0.3 };
  const m = new THREE.MeshPhysicalMaterial({
    color: pal.onDark, metalness: 0, roughness: 0.02, transmission: 1, thickness: 0.16, ior: 1.5, specularIntensity: 1,
    attenuationColor: mix(pal.onDark, pal.muted, 0.4), attenuationDistance: 0.6, premultipliedAlpha: true,
  });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uDome = dome;
    // the face is ground very slightly domed, as a lens (its normals only; the geometry stays flat): so the plate under
    // it is magnified a little toward the middle and the studio slides across it, as on a real glass token
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vLoc;\nvarying vec3 vObjN;\nuniform float uDome;")
      .replace("#include <beginnormal_vertex>", `#include <beginnormal_vertex>
      if (objectNormal.y > 0.99) objectNormal = normalize(vec3(position.x * uDome / ${R.toFixed(4)}, 1.0, position.z * uDome / ${R.toFixed(4)}));`)
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvLoc = position;\nvObjN = normal;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vLoc;\nvarying vec3 vObjN;")
      .replace("#include <opaque_fragment>", `{
        // the wall: darker toward its foot (the thickness, light bent away), with a bright lip at the top where the
        // rounded edge turns up to the studio; so each token stands off the plate, dark below, light above
        if (vObjN.y < 0.6) {
          float up = clamp(vLoc.y / ${H.toFixed(4)}, 0.0, 1.0);
          outgoingLight *= 1.0 - (0.42 - 0.2 * up) * (1.0 - vObjN.y);
        } else if (vObjN.y < 0.99) {
          outgoingLight += vec3(0.07) * smoothstep(0.6, 0.95, vObjN.y);
        }
      }
      #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => "layer-clear-8";
  m.userData.dome = dome;
  return m;
}

// ── The core: frosted glass, neutral and darker (someone else's layer, D101), turning NEAR green. Real geometry: a flat
// frosted top, a polished quarter-round bevel at its edge, a satin wall. Each part is three's transmission (so the data
// inside is genuinely blurred by the frost), its colour the glass's own: Beer–Lambert, deeper where the light's path
// through the glass is longer (the wall, the bevel), and a scattered glow in the body (frosted glass lights up from
// inside), strongest toward the rim where light pipes along the glass.
type CorePart = "top" | "bevel" | "wall";
type CoreU = { uGreen: { value: number }; uR: { value: number }; uH: { value: number } };
function coreGlass(pal: Pal, part: CorePart, cu: CoreU) {
  // the tints: the neutral frost a darker grey (D101); the green the token green, a touch deeper
  // (D101 and after: Lawrence, "the center disk should feel like a darker tinted frosted glass": a smoky ink glass)
  const greyT = mix(pal.onDark, pal.ink, 0.42), greenT = mix(pal.green, pal.ink, 0.25);
  const greyGlow = mix(mix(pal.onDark, pal.muted, 0.3), pal.ink, 0.5), greenGlow = mix(greenT, pal.onDark, 0.42);
  const greyDeep = mix(pal.onDark, pal.ink, 0.78), greenDeep = mix(pal.green, pal.ink, 0.5);
  const spec = {
    top: { roughness: 0.34, thickness: 0.24, dist: 0.9, spec: 0.75, env: 1 },
    bevel: { roughness: 0.04, thickness: 0.12, dist: 0.25, spec: 1, env: 1.5 },
    wall: { roughness: 0.16, thickness: 0.7, dist: 0.5, spec: 0.9, env: 1.2 },
  }[part];
  const m = new THREE.MeshPhysicalMaterial({
    color: greyT.clone(), metalness: 0, roughness: spec.roughness, transmission: 1, thickness: spec.thickness, ior: 1.46,
    specularIntensity: spec.spec, envMapIntensity: spec.env, attenuationColor: greyT.clone(), attenuationDistance: spec.dist,
    premultipliedAlpha: true,
  });
  const u = { uGlow: { value: greyGlow.clone() }, uDeep: { value: greyDeep.clone() } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u, cu);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vLoc;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvLoc = position;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vLoc;\nuniform float uGreen;\nuniform float uR;\nuniform float uH;\nuniform vec3 uGlow;\nuniform vec3 uDeep;\n${NOISE}`)
      .replace("#include <opaque_fragment>", `{
        float rr = length(vLoc.xz) / uR;
        float facing = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
        // the key light's side (upper left, at the back)
        float key = clamp(0.5 + 0.5 * dot(vLoc.xz / uR, normalize(vec2(-0.6, -0.8))), 0.0, 1.0);
        ${part === "top" ? `
        // the frosted face: the light scattered in the frost (a soft body colour, brighter toward the rim, where light
        // pipes in from the wall), over what is seen through it; a fine grain, as real frosting has
        float pipe = smoothstep(0.55, 0.97, rr);
        vec3 body = uGlow * (0.42 + 0.12 * key + 0.14 * pipe);
        outgoingLight = outgoingLight * 0.55 + body;
        // toward the edge the eye looks through the wall's thickness: a deeper band just inside the bevel
        float band = smoothstep(0.82, 0.975, rr);
        outgoingLight = mix(outgoingLight, uDeep, 0.22 * band);
        vec2 gq = vLoc.xz * 260.0;
        float gr = (lNoise(gq) - 0.5) * (1.0 - smoothstep(0.4, 0.9, fwidth(gq.x)));
        outgoingLight *= 1.0 + 0.05 * gr;` : part === "bevel" ? `
        // the polished bevel: the deep colour of the glass's thickness, lit at its lip
        outgoingLight = outgoingLight * 0.85 + uGlow * 0.18 * (0.4 + 0.6 * key);` : `
        // the wall: the glass's thickness, where the colour is densest; brighter toward its top lip, where light from
        // the face pipes down; a little deeper toward the foot
        float up = clamp(vLoc.y / max(uH, 1e-3), 0.0, 1.0);
        outgoingLight = outgoingLight * mix(0.8, 1.0, up) + uGlow * (0.1 + 0.3 * smoothstep(0.5, 1.0, up)) * (0.6 + 0.4 * facing);`}
      }
      #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => `layer-core-${part}-1`;
  return {
    mat: m,
    set(g: number) {
      m.color.copy(greyT).lerp(greenT, g);
      m.attenuationColor.copy(greyT).lerp(greenT, g);
      u.uGlow.value.copy(greyGlow).lerp(greenGlow, g);
      u.uDeep.value.copy(greyDeep).lerp(greenDeep, g);
    },
  };
}

// The core's geometry, live: R and h change every frame of the change, but its bevel stays the same size in the world
// (a scaled cylinder would stretch it), so the positions are rewritten from a fixed profile (normals don't change).
// Groups: the wall 0, the bevel 1, the top 2.
function coreGeometry(seg: number, bev: number) {
  type V = { c: number; s: number; dr: number; top: boolean; dy: number };
  const vs: V[] = [], nor: number[] = [], idx: number[][] = [[], [], []];
  const ring = (dr: number, top: boolean, dy: number, nr: number, ny: number) => {
    const start = vs.length;
    for (let j = 0; j <= seg; j++) {
      const t = (j / seg) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
      vs.push({ c, s, dr, top, dy });
      nor.push(nr * c, ny, nr * s);
    }
    return start;
  };
  const band = (a0: number, a1: number, part: number) => {
    for (let j = 0; j < seg; j++) { const a = a0 + j, c = a0 + j + 1, b = a1 + j, d = a1 + j + 1; idx[part].push(a, b, c, c, b, d); }
  };
  // the wall, foot to the bevel
  band(ring(0, false, 0, 1, 0), ring(0, true, -bev, 1, 0), 0);
  // the bevel, a quarter round
  const steps = 8;
  let prev = ring(0, true, -bev, 1, 0);
  for (let i = 1; i <= steps; i++) {
    const a = (i / steps) * Math.PI / 2;
    const r = ring(-bev + bev * Math.cos(a), true, -bev + bev * Math.sin(a), Math.cos(a), Math.sin(a));
    band(prev, r, 1);
    prev = r;
  }
  // the top, a fan
  const rim = ring(-bev, true, 0, 0, 1);
  const centre = vs.length;
  vs.push({ c: 0, s: 0, dr: -1e9, top: true, dy: 0 });
  nor.push(0, 1, 0);
  for (let j = 0; j < seg; j++) idx[2].push(centre, rim + j + 1, rim + j);
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(vs.length * 3);
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex([...idx[0], ...idx[1], ...idx[2]]);
  let o = 0;
  idx.forEach((ix, k) => { g.addGroup(o, ix.length, k); o += ix.length; });
  let last = "";
  return {
    geo: g,
    set(R: number, h: number) {
      const key = `${R.toFixed(5)} ${h.toFixed(5)}`;
      if (key === last) return;
      last = key;
      vs.forEach((v, i) => {
        const r = v.dr < -1e8 ? 0 : R + v.dr;
        pos[i * 3] = r * v.c; pos[i * 3 + 1] = v.top ? h + v.dy : v.dy; pos[i * 3 + 2] = r * v.s;
      });
      g.attributes.position.needsUpdate = true;
      g.computeBoundingSphere();
    },
  };
}

// ── The people (D95, D97): three equal people in an even outline after Lawrence's reference (a ring for the head, the
// shoulders' outline tucking in under it, a flat foot), one in front and two behind it, higher and to either side, whose
// lines break with a clear gap where the front one passes in front of them. Units: the front figure's head centre is at
// (0, -0.285), the group spans about ±1.28 by ±1; a line 0.1 wide, the gap 0.09 (as the mask they were etched with).
//
// Made as a metal inlay: each line is a strip of polished chrome set into the glass's top face, its section a low
// half-round wire standing a hair proud of the face, so it carries the studio's reflections along its length and a
// bright line where it turns toward the light.
const FIG = { line: 0.1, gap: 0.09, scale: 0.34932, dy: 0.03 }; // figure units → the core's unit top (× R in the world)
function personPaths(dx: number, dy: number) {
  const head = new THREE.Path();
  head.absarc(dx, dy - 0.285, 0.405, 0, Math.PI * 2, false);
  const w = 0.7, r = 0.11, foot = 0.935;
  const body = new THREE.Path();
  body.moveTo(dx - 0.1, dy + 0.13);
  body.bezierCurveTo(dx - 0.3, dy + 0.2, dx - 0.5, dy + 0.25, dx - 0.6, dy + 0.34);
  body.bezierCurveTo(dx - 0.67, dy + 0.41, dx - w, dy + 0.48, dx - w, dy + 0.58);
  body.lineTo(dx - w, dy + foot - r);
  body.quadraticCurveTo(dx - w, dy + foot, dx - w + r, dy + foot);
  body.lineTo(dx + w - r, dy + foot);
  body.quadraticCurveTo(dx + w, dy + foot, dx + w, dy + foot - r);
  body.lineTo(dx + w, dy + 0.58);
  body.bezierCurveTo(dx + w, dy + 0.48, dx + 0.67, dy + 0.41, dx + 0.6, dy + 0.34);
  body.bezierCurveTo(dx + 0.5, dy + 0.25, dx + 0.3, dy + 0.2, dx + 0.1, dy + 0.13);
  const sample = (p: THREE.Path) => {
    const n = Math.ceil(p.getLength() / 0.006);
    return p.getSpacedPoints(n).map((v) => [v.x, v.y] as [number, number]);
  };
  return { head: sample(head), body: sample(body) };
}
type Run = { pts: [number, number][]; closed: boolean; caps: [boolean, boolean] };
function peopleRuns(): Run[] {
  const front = personPaths(0, 0);
  const headPts = front.head.slice(0, -1);
  const outline = [front.head, front.body];
  const distTo = (x: number, y: number) => {
    let best = Infinity;
    for (const pl of outline) for (let i = 0; i < pl.length - 1; i++) {
      const [ax, ay] = pl[i], [bx, by] = pl[i + 1];
      const vx = bx - ax, vy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy || 1)));
      best = Math.min(best, Math.hypot(x - ax - vx * t, y - ay - vy * t));
    }
    return best;
  };
  const inPoly = (x: number, y: number, poly: [number, number][]) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  const hidden = (x: number, y: number) =>
    Math.hypot(x, y + 0.285) < 0.405 || inPoly(x, y, front.body) || distTo(x, y) < FIG.line / 2 + FIG.gap;
  const runs: Run[] = [
    { pts: headPts, closed: true, caps: [false, false] },
    { pts: front.body, closed: false, caps: [true, true] },
  ];
  // the two behind, broken where the front one passes over them (flat cut ends there, round ends elsewhere)
  for (const dx of [-0.53, 0.53]) {
    const p = personPaths(dx, -0.27);
    for (const [pl, closed] of [[p.head.slice(0, -1), true], [p.body, false]] as const) {
      const keep = pl.map(([x, y]) => !hidden(x, y));
      if (keep.every(Boolean)) { runs.push({ pts: pl, closed, caps: [!closed, !closed] }); continue; }
      // start from a hidden point, so a closed loop's runs don't wrap
      const n = pl.length, s0 = closed ? keep.indexOf(false) : 0;
      let cur: [number, number][] = [], startCap = !closed && keep[0];
      for (let k = 0; k <= n; k++) {
        const i = closed ? (s0 + k) % n : k;
        if (k < n && keep[i]) { if (!cur.length && k > 0 && !closed) startCap = false; cur.push(pl[i]); continue; }
        if (cur.length > 2) runs.push({ pts: cur, closed: false, caps: [startCap, !closed && k === n] });
        cur = [];
        startCap = false;
        if (closed && k === n) break;
      }
    }
  }
  return runs;
}
function peopleGeometry() {
  const half = FIG.line / 2, K = 9; // across the strip
  const proud = 0.0022, sink = 0.004; // world units: how far it stands above the face, and is set below it
  const pos: number[] = [], nor: number[] = [], idx: number[] = [];
  // figure units → the core's unit top (x, z), as the mask had it
  const X = (x: number) => x * FIG.scale, Z = (y: number) => (y + FIG.dy) * FIG.scale;
  for (const run of peopleRuns()) {
    let pts = run.pts.slice();
    const n0 = pts.length;
    const tan = (i: number): [number, number] => {
      const a = run.closed ? pts[(i - 1 + n0) % n0] : pts[Math.max(0, i - 1)];
      const b = run.closed ? pts[(i + 1) % n0] : pts[Math.min(pts.length - 1, i + 1)];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
    };
    // widths along the run: full, tapering to a round end over the last half-width where it ends free
    let ts = pts.map((_, i) => tan(i));
    let ws = pts.map(() => 1);
    if (!run.closed) {
      const capAt = (end: 0 | 1) => {
        const i = end ? pts.length - 1 : 0, t = ts[i], sgn = end ? 1 : -1, extra: [number, number][] = [], ew: number[] = [];
        for (let k = 1; k <= 6; k++) {
          const d = (k / 6) * half;
          extra.push([pts[i][0] + sgn * t[0] * d, pts[i][1] + sgn * t[1] * d]);
          ew.push(Math.sqrt(Math.max(0, 1 - (d / half) ** 2)));
        }
        return { extra, ew, t };
      };
      if (run.caps[0]) { const c = capAt(0); pts = [...c.extra.reverse(), ...pts]; ws = [...c.ew.reverse(), ...ws]; ts = [...c.extra.map(() => c.t), ...ts]; }
      if (run.caps[1]) { const c = capAt(1); pts = [...pts, ...c.extra]; ws = [...ws, ...c.ew]; ts = [...ts, ...c.extra.map(() => c.t)]; }
    }
    const base = pos.length / 3, n = pts.length;
    pts.forEach(([x, y], i) => {
      const [tx, ty] = ts[i], nx = -ty, ny = tx, w = ws[i];
      for (let k = 0; k < K; k++) {
        const s = (k / (K - 1)) * 2 - 1; // −1 … 1 across
        const sx = x + nx * s * half * w, sy = y + ny * s * half * w;
        // a half-round wire: its normals those of a full round section, its height a low dome
        // a flat polished top, its shoulders rounding down into the glass (the bevels that catch the light)
        const sh = Math.max(0, (Math.abs(s) - 0.62) / 0.38), a = Math.abs(s) * 0.25 + sh * sh * 0.9; // a low crown, rounding off at the edges
        const up = Math.cos(a), side = Math.sign(s) * Math.sin(a);
        const c = Math.sqrt(Math.max(0, 1 - sh * sh));
        pos.push(X(sx), (proud + sink) * c * Math.sqrt(w) - sink, Z(sy));
        nor.push(nx * side, up, ny * side);
      }
    });
    const segs = run.closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const a = base + i * K, b = base + ((i + 1) % n) * K;
      for (let k = 0; k < K - 1; k++) idx.push(a + k, a + k + 1, b + k, a + k + 1, b + k + 1, b + k);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

// A glyph's outline as a flat shape (a regular polygon or a circle, `w` wide), or a filled dot
function outline(points: [number, number][], w: number) {
  const s = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  // the inner edge, offset inward by w along each corner's bisector
  const n = points.length, inner: THREE.Vector2[] = [];
  for (let i = 0; i < n; i++) {
    const p = new THREE.Vector2(...points[i]), a = new THREE.Vector2(...points[(i + n - 1) % n]), b = new THREE.Vector2(...points[(i + 1) % n]);
    const e0 = p.clone().sub(a).normalize(), e1 = b.clone().sub(p).normalize();
    const n0 = new THREE.Vector2(-e0.y, e0.x), n1 = new THREE.Vector2(-e1.y, e1.x); // inward for a counter-clockwise loop
    const bis = n0.clone().add(n1).normalize(), k = w / Math.max(0.2, bis.dot(n0));
    inner.push(p.clone().add(bis.multiplyScalar(k)));
  }
  s.holes.push(new THREE.Path(inner.reverse()));
  return new THREE.ShapeGeometry(s);
}
const ring = (r: number, w: number) => {
  const s = new THREE.Shape().absarc(0, 0, r, 0, Math.PI * 2, false);
  s.holes.push(new THREE.Path().absarc(0, 0, r - w, 0, Math.PI * 2, true));
  return new THREE.ShapeGeometry(s, 48);
};
const poly = (k: number, r: number, a0: number) => Array.from({ length: k }, (_, i) => {
  const a = a0 + (i / k) * Math.PI * 2;
  return [r * Math.cos(a), r * Math.sin(a)] as [number, number];
});
function glyph(i: number) {
  const w = 0.009;
  switch (i) {
    case 0: return new THREE.CircleGeometry(0.032, 40); // dot
    case 1: return outline(poly(4, 0.068, Math.PI / 4), w); // square
    case 2: return outline(poly(3, 0.07, Math.PI / 2), w); // triangle
    case 3: return outline(poly(4, 0.072, 0), w); // diamond
    case 4: return ring(0.062, w); // ring
    default: return outline([[-0.074, -0.042], [0.074, -0.042], [0.074, 0.042], [-0.074, 0.042]], w); // small rectangle
  }
}

export function layerView(tokens: Tokens): View<LayerPose> {
  const e = getEngine();
  const pal: Pal = palette(tokens);
  const scene = new THREE.Scene();
  const camera = studio(scene, e.env, pal);
  const { plate: P, token: T } = LAYER;
  // the softbox, placed in the world (up behind the drawing, to the left), handed to the shaders in view space
  camera.updateMatrixWorld();
  const box: Box = {
    uBoxC: { value: new THREE.Vector3() }, uBoxU: { value: new THREE.Vector3() }, uBoxW: { value: new THREE.Vector3() },
    uBoxN: { value: new THREE.Vector3() }, uBoxS: { value: new THREE.Vector2(0.4, 0.9) }, uBoxI: { value: 1.5 },
  };
  const placeBox = (c: [number, number, number], aim: [number, number, number]) => {
    const C = new THREE.Vector3(...c), N = new THREE.Vector3(...aim).sub(C).normalize();
    const U = new THREE.Vector3(0, 1, 0).cross(N).normalize(), Wv = N.clone().cross(U).normalize();
    const vm = camera.matrixWorldInverse;
    box.uBoxC.value.copy(C).applyMatrix4(vm);
    box.uBoxN.value.copy(N).transformDirection(vm);
    box.uBoxU.value.copy(U).transformDirection(vm);
    box.uBoxW.value.copy(Wv).transformDirection(vm);
  };
  placeBox([-0.9, 3.4, -2.6], [0, -0.12, 0]);
  const aniDir = { value: new THREE.Vector3(0, 0, 1) };

  // the plate, leaned toward the camera; everything on it turns with the arrival (yaw)
  const lean = new THREE.Group();
  lean.rotation.x = LAYER.tilt;
  lean.position.y = LAYER.y;
  scene.add(lean);
  const deck = new THREE.Group();
  lean.add(deck);

  // the plate: a thin disc of brushed aluminium, a polished quarter-round bevel at its top edge, a satin turned edge
  const pb = 0.014;
  const plateTop = new THREE.CircleGeometry(P.R - pb, 256);
  plateTop.rotateX(-Math.PI / 2);
  // (drawn into the glass's view too: the tokens refract it, the frost blurs it, softbox streak and all)
  // (isotropic, so its tone never changes as it turns in: an anisotropic env lookup swung the whole plate from white to
  // grey and back during the arrival turn; the brushing's stretch is carried by the softbox's footprint instead. Its
  // own share of the room, turned less than the rest: a light satin grey)
  const plateMat = boxed(inStudio(brushed(pal), e.env, 0.65), box, 1.33, { dir: aniDir, k: 0.1 });
  plateMat.envMapRotation.set(0.15, 0, 0);
  const plate = new THREE.Mesh(plateTop, plateMat);
  deck.add(plate);
  const edgeBevel = boxed(inStudio(new THREE.MeshPhysicalMaterial({ color: pal.onDark, metalness: 1, roughness: 0.1 }), e.env), box);
  const edgeSide = boxed(inStudio(new THREE.MeshPhysicalMaterial({ color: mix(pal.onDark, pal.surface2, 0.3), metalness: 1, roughness: 0.22 }), e.env), box);
  const plateEdge = new THREE.Mesh(lathe(P.R, 0, -P.depth, pb, 0.006, 320), [edgeBevel, edgeSide]);
  plateEdge.onBeforeRender = (r) => {
    const on = r.getRenderTarget() === null;
    [edgeBevel, edgeSide].forEach((m) => { m.colorWrite = on; m.depthWrite = on; });
  };
  deck.add(plateEdge);

  // the dotted track as the tokens' glass sees it (the vector track is drawn over the render and breaks where a token
  // sits, so here the glass carries it on underneath, refracted: dots magnified and shifted inside each token)
  const dotGeo = new THREE.CircleGeometry(0.0068, 10);
  dotGeo.rotateX(-Math.PI / 2);
  const nDots = Math.round((Math.PI * 2 * LAYER.track) / 0.045);
  const dots = new THREE.InstancedMesh(dotGeo, new THREE.MeshBasicMaterial({ color: mix(pal.ink, pal.surface2, 0.25) }), nDots);
  for (let i = 0; i < nDots; i++) {
    const a = (i / nDots) * Math.PI * 2;
    dots.setMatrixAt(i, new THREE.Matrix4().makeTranslation(LAYER.track * Math.cos(a), 0.0015, -LAYER.track * Math.sin(a)));
  }
  deck.add(onlyIn(dots, true));

  // the tokens: clear glass with a rounded top edge, a thin polished chrome band at the foot, a glyph cut into each top
  // and filled dark
  const glass = boxed(inStudio(clearGlass(pal, T.r, T.h), e.env, 0.35), box, 4), chrome = boxed(inStudio(polished(pal), e.env), box);
  const cut = inStudio(new THREE.MeshStandardMaterial({ color: mix(pal.ink, pal.surface2, 0.18), metalness: 0.3, roughness: 0.35 }), e.env);
  const tokenBody = lathe(T.r, T.h, 0, 0.012, 0.003, 96);
  tokenBody.clearGroups();
  const tokenFace = new THREE.CircleGeometry(T.r - 0.012, 64);
  tokenFace.rotateX(-Math.PI / 2);
  tokenFace.translate(0, T.h, 0);
  const bandGeo = new THREE.CylinderGeometry(T.r + 0.003, T.r + 0.003, 0.02, 96, 1, true);
  bandGeo.translate(0, 0.01, 0);
  const beadGeo = new THREE.TorusGeometry(T.r - 0.006, 0.0055, 12, 120);
  beadGeo.rotateX(Math.PI / 2);
  beadGeo.translate(0, T.h - 0.006, 0);
  // what the frost sees of a token (drawn into the transmission pass only): a pale disc with a darker rim, so under the
  // frost each token blurs to a soft pale disc (its polished chrome and dark glyph there would blur to dark stains,
  // which read as dirt); only where the core covers them, as the tokens' own glass refracts the plate and must never
  // see these
  const deckInv = new THREE.Matrix4(), coreR = { value: 0 };
  const underCore = (m: THREE.MeshBasicMaterial, outside = false) => {
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { uDeckInv: { value: deckInv }, uCoreR: coreR });
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vW;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvW = (modelMatrix * vec4(position, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vW;\nuniform mat4 uDeckInv;\nuniform float uCoreR;")
        .replace("void main() {", `void main() {\n  if ((length((uDeckInv * vec4(vW, 1.0)).xz) > uCoreR) != ${outside}) discard;`);
    };
    m.customProgramCacheKey = () => `layer-under-core-${outside}`;
    return m;
  };
  const seenRim = underCore(new THREE.MeshBasicMaterial({ color: mix(pal.onDark, pal.muted, 0.3) }));
  const seenTop = underCore(new THREE.MeshBasicMaterial({ color: mix(pal.onDark, pal.surface2, 0.15) }));
  // and, under the core only, an even light satin over the plate: what the frost blurs is then the same light ground
  // whatever the plate's tone, so the frost's colour is its own tint (and the data the only shapes in it)
  const seenGround = new THREE.CircleGeometry(P.R, 128);
  seenGround.rotateX(-Math.PI / 2);
  seenGround.translate(0, 0.0008, 0);
  deck.add(onlyIn(new THREE.Mesh(seenGround, underCore(new THREE.MeshBasicMaterial({ color: mix(pal.surface2, pal.onDark, 0.45) }))), true));
  // and outside it, the chrome foot as the tokens' own glass sees it (a dark ring): refracted up through the face, it
  // shows as the token's bottom edge seen through the glass, as thick clear glass does
  const seenFoot = underCore(new THREE.MeshBasicMaterial({ color: mix(pal.ink, pal.surface2, 0.45) }), true);
  const topGeo = new THREE.CircleGeometry(T.r - 0.01, 64);
  topGeo.rotateX(-Math.PI / 2);
  topGeo.translate(0, T.h - 0.004, 0);
  const pucks = T.at.map((_, i) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(tokenBody, glass), new THREE.Mesh(tokenFace, glass));
    g.add(onlyIn(new THREE.Mesh(bandGeo, chrome), false));
    g.add(onlyIn(new THREE.Mesh(bandGeo, seenRim), true), onlyIn(new THREE.Mesh(beadGeo, seenRim), true), onlyIn(new THREE.Mesh(topGeo, seenTop), true));
    g.add(onlyIn(new THREE.Mesh(bandGeo, seenFoot), true));
    const gl = glyph(i);
    gl.rotateX(-Math.PI / 2);
    gl.translate(0, T.h + 0.0008, 0);
    g.add(onlyIn(new THREE.Mesh(gl, cut), false));
    deck.add(g);
    return g;
  });

  // the core: frosted top, polished bevel, satin wall (no bottom: it sits on the plate)
  const cu: CoreU = { uGreen: { value: 0 }, uR: { value: 1 }, uH: { value: 0.2 } };
  const coreTop = coreGlass(pal, "top", cu), coreBevel = coreGlass(pal, "bevel", cu), coreWall = coreGlass(pal, "wall", cu);
  const coreGeo = coreGeometry(256, 0.022);
  ([[coreTop, 7], [coreBevel, 8], [coreWall, 5]] as const).forEach(([c, k]) => boxed(inStudio(c.mat, e.env), box, k));
  const core = new THREE.Mesh(coreGeo.geo, [coreWall.mat, coreBevel.mat, coreTop.mat]);
  core.position.y = 0.0015;
  deck.add(core);
  // where the core meets the plate, a fine dark line (on screen only): the contact, as real glass on metal has
  const footGeo = new THREE.TorusGeometry(1, 0.0035, 8, 320);
  footGeo.rotateX(Math.PI / 2);
  const foot = onlyIn(new THREE.Mesh(footGeo, inStudio(polishedDark(pal), e.env)), false);
  deck.add(foot);
  // the collar: a low polished chrome bezel rising round the core's foot as it becomes the user's, with a fine bead at
  // its lip (on screen only, so the frost never smears it)
  const collarGeo = new THREE.CylinderGeometry(1, 1, 1, 192, 1, true);
  collarGeo.translate(0, 0.5, 0);
  const collar = onlyIn(new THREE.Mesh(collarGeo, boxed(inStudio(polished(pal), e.env), box)), false);
  deck.add(collar);
  const lip = onlyIn(new THREE.Mesh(new THREE.TorusGeometry(1, 0.0065, 10, 320), boxed(inStudio(polished(pal), e.env), box)), false);
  lip.rotation.x = Math.PI / 2;
  deck.add(lip);
  // the people: polished chrome inlaid in the top (transparent while they arrive, so never in the frost's view)
  const inlayMat = new THREE.MeshPhysicalMaterial({
    color: mix(pal.onDark, pal.muted, 0.2), metalness: 1, roughness: 0.08, envMapIntensity: 1.1, transparent: true, opacity: 0,
  });
  boxed(inStudio(inlayMat, e.env, 1.3), box, 3);
  const people = new THREE.Mesh(peopleGeometry(), inlayMat);
  deck.add(people);

  const apply = (p: LayerPose) => {
    const S = shapeOf(p.own);
    deck.rotation.y = p.yaw;
    scene.updateMatrixWorld();
    deckInv.copy(deck.matrixWorld).invert();
    coreR.value = S.R;
    aniDir.value.set(0, 0, 1).transformDirection(deck.matrixWorld).transformDirection(camera.matrixWorldInverse);
    pucks.forEach((g, i) => g.position.set(...tokenAt(i, S.rT)));
    coreGeo.set(S.R, S.h);
    cu.uR.value = S.R;
    cu.uH.value = S.h;
    coreTop.set(S.green); coreBevel.set(S.green); coreWall.set(S.green);
    foot.scale.set(S.R + 0.001, 1, S.R + 0.001);
    foot.position.y = 0.0025;
    // the people, in the top's unit frame (× R), standing on the face
    people.visible = S.mark > 0.002;
    people.scale.set(S.R, 1, S.R);
    people.position.y = core.position.y + S.h;
    inlayMat.opacity = S.mark;
    const c = S.collar;
    collar.visible = lip.visible = c > 0.002;
    // a low bezel round the foot, a third of the core's height, so the frosted green wall shows above it (B2)
    const ch = S.h * 0.33 * c;
    collar.scale.set(S.R + 0.006, Math.max(1e-3, ch), S.R + 0.006);
    lip.scale.set(S.R + 0.003, S.R + 0.003, 1);
    lip.position.y = ch;
  };
  return view(scene, camera, apply);
}
