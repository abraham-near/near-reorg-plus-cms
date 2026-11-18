// Home v6's Stack, lit matte, live (D149). The path-traced still on /home-v6/stack-looks (D148) shows the look at rest; the drawing moves (the build,
// the hover's parting cubes, pieces going dark and ghosting), so it is drawn here in real time, on the same 3D model, the same isometric camera and
// the same three area lights, and its shadows and occlusion are worked out every frame from where the pieces are then:
//   - the lights: three.js's rect area lights (exact soft light from a rectangle: the tops brightest, falling off down the sides), as in the still;
//   - shadows and occlusion, exactly (D151, PARS_V): for every light and the room, how much of it each box takes from the point's view, so a cube
//     dropping in darkens the one under it as it comes, parted cubes let the light into the gaps between them, and a corner's shade falls on its floor;
//   - each box only counts where some of it is in front of the face (a box behind a face's plane can't shade it: no self-shadowing at the joints).
// Bounces: one, near (each face a point sees sends back its own light, in its paint, D151); the rest is made up by a little more ambient.
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { PIECES, BOX_COUNT, CAP, type Layer } from "./model";

/* the drawing's viewBox (../geometry.ts VIEWBOX) and room around it for what moves past it: the parted pillar's top cube (up 70) and bottom cube
   (down 90) */
export const VB = [-328.9, -97.5, 657.9, 783.0] as const;
export const PAD = { top: 16, bottom: 100 };
/* true isometric: world units are sqrt(1.5) times smaller than the drawing's (a vertical move of d in the world is d in the drawing) */
const K = Math.sqrt(1.5);

/* the still's matte paint (D148): each layer's top tone (tokens.css), NEAR Intents toned down as v6 has it, Commerce darker (critic, D148) */
export const ALBEDO: Record<Layer, string> = { protocol: "#5fe0ae", intents: "#a6ecca", ai: "#4fd09c", com: "#21845d" };

/* the lights, as in the still (looks.mjs "matte", final3.sh: key 4.4 over 640, fill 2.2, right .35) */
/* the key 4.15, not the still's 4.4: D149's occlusion dimmed every top a little (its shadow mixed with the sampled occlusion); worked out exactly
   (D151) nothing dims an open top, and the tops read 6% over the still */
const KEY = { at: new THREE.Vector3(-60, 320, 30), size: 640, I: 4.15 };

/* a piece as the drawing has it: its drop or parting (drawing units, down), how solid it shows, how much it is in the scene yet (its shadows), drawn over
   everything (the hovered cube, D129), its paint */
/* lift: an even glow, for a piece put back (graphite), so its faces in the shade don't go black */
/* line: its outline, as strong as the drawing has it (D150) */
/* hot: a NEAR AI bar running hot alone (D203): its boxes (by their place in the piece), painted hotColor */
/* passing: coming in or going away in the build (D203): it hides no outline behind it; they show through it as far as its body is clear */
export type PieceState = { dy: number; alpha: number; present: number; top: boolean; lift: number; dark: number; line: number; color: THREE.Color; hot: number[]; hotColor: THREE.Color; passing: boolean };
export type MatteGL = {
  /* joined: the pillar's cubes together, outlined as one piece */
  render: (s: { pieces: PieceState[]; mark: number; joined: boolean }) => void;
  resize: (cssW: number, cssH: number, dpr: number) => void;
  dispose: () => void;
};

const NB = BOX_COUNT;
/* the occlusion (D151), worked out exactly rather than sampled: for each box, the part of it in front of the face, and of that the faces turned to the
   point, each a polygon whose share of the point's view (its form factor, cosine weighted) comes from its edges (Lambert's formula, Arvo 1994). No
   falloff distance: a box near shades as much as it covers, one far as little, as in a path tracer (the "ground truth" occlusion of Jimenez et al. 2016,
   not the obscurance that fades with distance). Then, per light, only what of a box is between the point and that light counts against it (the box's
   faces clipped to the light's pyramid as the point sees it):
   - the room (the hemisphere light, sky over the horizon, ground under it): a floor by a wall loses the sky the wall covers, the wall only the
     dimmer ground the floor covers, so a corner's shade falls on its floor, and only a little on its wall;
   - the key, the fill and the right light: their light blocked exactly (soft shadows, as wide as the light is seen);
   - a piece's own boxes always count in full (its own corners are there the whole time it is); others' as much as they are in the scene yet;
   - within a piece the boxes' shares add (they abut, don't overlap); between pieces they multiply;
   - one bounce: what a box hides, its faces give back, in their paint and as lit as their way of facing is (uRad), so the ring faces by the lit pillar
     take its green as in the path-traced still, rather than going black. */
/* worked out per vertex (the mesh cut to a fine grid, ./solid), not per pixel: it changes slowly across a face, and per pixel it cost a frame a fifth of a second */
const PARS_V = /* glsl */ `
uniform vec4 uBoxC[${NB}];   // a box's centre, w: how much it is in the scene (0 to 1: its shade grows as it comes in)
uniform vec4 uBoxH[${NB}];   // its half size, w: its piece
uniform vec3 uLC[3];         // the area lights (the key, the fill, the right): centre, half the width, half the height
uniform vec3 uLU[3];
uniform vec3 uLV[3];
uniform vec2 uHemi;
          // the room's sky and ground (linear)
uniform float uSelf;         // the piece this is
uniform vec3 uAlb[${PIECES.length}];   // each piece's paint (linear), as solid as it shows
uniform vec3 uRad[6];        // the light a face sends out per unit of paint, by which way it faces (+x, -x, +y, -y, +z, -z), times pi
#define SV 10
/* a polygon's form factor from p (its vertices relative to p, all in front of the face): Lambert's sum over its edges */
float sFF(vec3 P[SV], int nv, vec3 n) {
  vec3 v = vec3(0.0);
  for (int i = 0; i < SV; i++) {
    if (i >= nv) break;
    vec3 a = P[i], b = P[i + 1 < nv ? i + 1 : 0];
    a /= max(length(a), 1e-5); b /= max(length(b), 1e-5);
    vec3 x = cross(a, b); float l = length(x);
    if (l > 1e-7) v += acos(clamp(dot(a, b), -1.0, 1.0)) * x / l;
  }
  return abs(dot(v, n)) / 6.2831853;
}
/* the polygon cut to dot(X, m) >= 0 (Sutherland-Hodgman); planes through p cut it to a pyramid of directions */
void sClip(inout vec3 P[SV], inout int nv, vec3 m) {
  vec3 Q[SV]; int nq = 0;
  for (int i = 0; i < SV; i++) {
    if (i >= nv) break;
    vec3 a = P[i], b = P[i + 1 < nv ? i + 1 : 0];
    float da = dot(a, m), db = dot(b, m);
    if (da >= 0.0 && nq < SV) { Q[nq] = a; nq++; }
    if (da * db < 0.0 && nq < SV) { Q[nq] = a + (b - a) * (da / (da - db)); nq++; }
  }
  for (int i = 0; i < SV; i++) if (i < nq) P[i] = Q[i];
  nv = nq;
}
/* a box's face across axis k at c, the box spanning A to B (relative to p) */
void sFace(int k, float c, vec3 A, vec3 B, out vec3 P[SV]) {
  if (k == 0) { P[0] = vec3(c, A.y, A.z); P[1] = vec3(c, B.y, A.z); P[2] = vec3(c, B.y, B.z); P[3] = vec3(c, A.y, B.z); }
  else if (k == 1) { P[0] = vec3(A.x, c, A.z); P[1] = vec3(B.x, c, A.z); P[2] = vec3(B.x, c, B.z); P[3] = vec3(A.x, c, B.z); }
  else { P[0] = vec3(A.x, A.y, c); P[1] = vec3(B.x, A.y, c); P[2] = vec3(B.x, B.y, c); P[3] = vec3(A.x, B.y, c); }
  for (int i = 4; i < SV; i++) P[i] = vec3(0.0);
}
/* how much of each light reaches p (x: the key, y: the fill, z: the right light, w: the room), the rest taken by the boxes in its way */
vec4 sVis(vec3 p, vec3 n, out vec3 bounce) {
  bounce = vec3(0.0);
  float lff[3]; vec3 pm[12];
  for (int j = 0; j < 3; j++) {
    vec3 c0 = uLC[j] - uLU[j] - uLV[j] - p, c1 = uLC[j] + uLU[j] - uLV[j] - p, c2 = uLC[j] + uLU[j] + uLV[j] - p, c3 = uLC[j] - uLU[j] + uLV[j] - p;
    vec3 L[SV]; L[0] = c0; L[1] = c1; L[2] = c2; L[3] = c3; for (int i = 4; i < SV; i++) L[i] = vec3(0.0);
    int nl = 4; sClip(L, nl, n);
    lff[j] = nl > 2 ? sFF(L, nl, n) : 0.0;
    /* its pyramid's four sides, facing in */
    vec3 mid = c0 + c2;
    vec3 m0 = cross(c0, c1), m1 = cross(c1, c2), m2 = cross(c2, c3), m3 = cross(c3, c0);
    pm[j * 4] = dot(m0, mid) < 0.0 ? -m0 : m0; pm[j * 4 + 1] = dot(m1, mid) < 0.0 ? -m1 : m1;
    pm[j * 4 + 2] = dot(m2, mid) < 0.0 ? -m2 : m2; pm[j * 4 + 3] = dot(m3, mid) < 0.0 ? -m3 : m3;
  }
  float E = mix(uHemi.y, uHemi.x, 0.5 + 0.5 * n.y);
  vec4 vis = vec4(1.0), acc = vec4(0.0);
  float cur = -1.0;
  for (int b = 0; b < ${NB}; b++) {
    float pc = uBoxH[b].w;
    if (pc != cur) { vis *= 1.0 - clamp(acc, 0.0, 1.0); acc = vec4(0.0); cur = pc; }
    float pr = abs(pc - uSelf) < 0.5 ? 1.0 : uBoxC[b].w;
    if (pr < 0.02) continue;
    vec3 lo = uBoxC[b].xyz - uBoxH[b].xyz - p, hi = uBoxC[b].xyz + uBoxH[b].xyz - p;
    /* only what of it is in front of the face (a box beside or behind can't shade it: no joints, no self-shading) */
    lo = mix(lo, max(lo, vec3(0.0)), step(0.5, n));
    hi = mix(hi, min(hi, vec3(0.0)), step(0.5, -n));
    vec3 sz = hi - lo;
    if (min(sz.x, min(sz.y, sz.z)) < 0.05) continue;
    /* the room: skipped where it can't take a 500th of the view (its bounding sphere's share) */
    vec3 mc = 0.5 * (lo + hi); float r2 = 0.25 * dot(sz, sz), d2 = dot(mc, mc);
    bool room = d2 < r2 * 500.0;
    /* the lights it can stand in front of */
    bool inL[3];
    bool use = room;
    for (int j = 0; j < 3; j++) {
      bool ok = lff[j] > 1e-5;
      for (int k = 0; k < 4; k++) { vec3 m = pm[j * 4 + k]; if (dot(mix(lo, hi, step(0.0, m)), m) <= 0.0) ok = false; }
      inL[j] = ok; use = use || ok;
    }
    if (!use) continue;
    for (int k = 0; k < 3; k++) {
      if (!(lo[k] > 0.0 || hi[k] < 0.0)) continue;
      vec3 F[SV]; sFace(k, lo[k] > 0.0 ? lo[k] : hi[k], lo, hi, F);
      vec3 P[SV]; int np;
      if (room) {
        P = F; np = 4; sClip(P, np, vec3(0.0, 1.0, 0.0)); float up = np > 2 ? sFF(P, np, n) : 0.0;
        P = F; np = 4; sClip(P, np, vec3(0.0, -1.0, 0.0)); float dn = np > 2 ? sFF(P, np, n) : 0.0;
        acc.w += pr * (uHemi.x * up + uHemi.y * dn) / E;
        /* one bounce: the face sends back its own light, in its paint, by its share of the view */
        bounce += pr * (up + dn) * uAlb[int(pc + 0.5)] * uRad[k * 2 + (lo[k] > 0.0 ? 1 : 0)];
      }
      for (int j = 0; j < 3; j++) {
        if (!inL[j]) continue;
        P = F; np = 4;
        for (int q = 0; q < 4; q++) if (np > 2) sClip(P, np, pm[j * 4 + q]);
        if (np > 2) acc[j] += pr * sFF(P, np, n) / lff[j];
      }
    }
  }
  return vis * (1.0 - clamp(acc, 0.0, 1.0));
}
`;
const PARS_F = /* glsl */ `
uniform vec4 uKey;           // the key: its centre, w its half width (a square, facing down)
uniform float uFloor;        // the least light a piece takes (the hovered cube, over everything, isn't left in the shade)
uniform float uDark;         // how far the piece is put back (graphite): its faces kept at least this light, lit or not, so none sinks into the band
uniform float uSelf;         // the piece this is (as the vertex shader's)
uniform float uHotPiece;     // D203: the piece with a bar running hot alone (-1 none), the bar's boxes (low and high corners, in the world), its paint
uniform int uHotN;
uniform vec3 uHotLo[6];
uniform vec3 uHotHi[6];
uniform vec3 uHotCol;
/* the key's light on a face, exactly: the part of the key in front of the face (a rectangle still), its form factor from its four edges. three.js's area
   light estimates a light partly behind a face, and over-lights the side faces just under the key (the pillar's top cube read a third too bright beside
   the path-traced still; D149 critic) */
float sEdge(vec3 a, vec3 b, vec3 n) { vec3 x = cross(a, b); float l = length(x); return l > 1e-6 ? acos(clamp(dot(a, b), -1.0, 1.0)) * dot(x / l, n) : 0.0; }
float sKeyFF(vec3 p, vec3 n) {
  vec2 lo = uKey.xz - uKey.w, hi = uKey.xz + uKey.w;
  if (n.x > 0.5) lo.x = max(lo.x, p.x); if (n.x < -0.5) hi.x = min(hi.x, p.x);
  if (n.z > 0.5) lo.y = max(lo.y, p.z); if (n.z < -0.5) hi.y = min(hi.y, p.z);
  if (hi.x <= lo.x || hi.y <= lo.y || uKey.y <= p.y || n.y < -0.5) return 0.0;
  vec3 a = normalize(vec3(lo.x, uKey.y, lo.y) - p), b = normalize(vec3(hi.x, uKey.y, lo.y) - p);
  vec3 c = normalize(vec3(hi.x, uKey.y, hi.y) - p), d = normalize(vec3(lo.x, uKey.y, hi.y) - p);
  return abs(sEdge(a, b, n) + sEdge(b, c, n) + sEdge(c, d, n) + sEdge(d, a, n)) / 6.2831853;
}
`;

/* the paint: the still's (MeshPhysicalMaterial, roughness .78, specular .35), with the shadow on the key and the occlusion on everything else */
function paint(opts: THREE.MeshPhysicalMaterialParameters, uni: Record<string, THREE.IUniform>, self: number) {
  const m = new THREE.MeshPhysicalMaterial(opts);
  m.userData.floor = { value: 0 };
  m.userData.dark = { value: 0 };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uni, { uFloor: m.userData.floor, uDark: m.userData.dark, uSelf: { value: self } });
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNor;\nvarying vec4 vVis;\nvarying vec3 vBounce;\n" + PARS_V)
      .replace("#include <project_vertex>", "#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWNor = normalize(mat3(modelMatrix) * objectNormal);\nvVis = sVis(vWPos, vWNor, vBounce);");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNor;\nvarying vec4 vVis;\nvarying vec3 vBounce;\n" + PARS_F)
      .replace("#include <color_fragment>", "#include <color_fragment>\nif (abs(uSelf - uHotPiece) < 0.5) { float sH = 0.0; for (int b = 0; b < 6; b++) { if (b >= uHotN) break; if (all(greaterThan(vWPos, uHotLo[b] - 0.05)) && all(lessThan(vWPos, uHotHi[b] + 0.05))) sH = 1.0; } diffuseColor.rgb = mix(diffuseColor.rgb, uHotCol, sH); }")
      .replace("#include <lights_fragment_begin>", "vec3 sN = normalize(vWNor);\n/* a top under a parted cube: shaded, but not to a hole (D149 critic) */\nfloat sUp = step(0.5, sN.y);\nvec4 sV = vVis;\nfloat sO = max(sV.w, max(uFloor, 0.55 * sUp));\nvec3 sL = max(sV.xyz, vec3(max(uFloor, 0.45 * sUp), vec2(max(uFloor, 0.55 * sUp))));\n#include <lights_fragment_begin>")
      .replace("#include <aomap_fragment>", "reflectedLight.indirectDiffuse = reflectedLight.indirectDiffuse * sO + vBounce * BRDF_Lambert(material.diffuseColor);\nreflectedLight.indirectSpecular *= sO;")
      /* graphite's floor, per face, worked back through the tone mapping to tops #3a, left faces #30, right faces #18 on the band: grey added only as far as
         the floor, so a face already over it (any green, a ghost) is left as it is, and a piece going dark never falls under it on the way */
      .replace("#include <opaque_fragment>", "outgoingLight += max(uDark * (sN.y > 0.5 ? 0.082 : sN.z > 0.5 ? 0.072 : 0.038) - dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722)), 0.0);\n#include <opaque_fragment>");
    /* the area lights' loop: each light's share, the key (the first) shadowed, the fills occluded */
    sh.fragmentShader = sh.fragmentShader.replace(
      /#include <lights_fragment_begin>/,
      THREE.ShaderChunk.lights_fragment_begin.replace(
        "RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );",
        `{ ReflectedLight sRL = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
          RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, sRL );
          if ( UNROLLED_LOOP_INDEX == 0 ) sRL.directDiffuse = rectAreaLight.color * material.diffuseColor * sKeyFF( vWPos, sN );
          float sF = sL[ UNROLLED_LOOP_INDEX ];
          reflectedLight.directDiffuse += sRL.directDiffuse * sF; reflectedLight.directSpecular += sRL.directSpecular * sF; }`,
      ),
    );
  };
  return m;
}

const GRID = 4;
/* a piece's boxes merged into one closed solid (only the faces between filled and empty cells: no inside walls, so a see-through piece shows no joints) */
function solid(boxes: { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number }[]) {
  const snap = (vs: number[]) => { const s = [...vs].sort((a, b) => a - b), out: number[] = []; for (const v of s) if (!out.length || v - out[out.length - 1] > 0.3) out.push(v); return out; };
  const X = snap(boxes.flatMap((b) => [b.x0, b.x1])), Y = snap(boxes.flatMap((b) => [b.y0, b.y1])), Z = snap(boxes.flatMap((b) => [b.z0, b.z1]));
  const ix = (A: number[], v: number) => A.findIndex((a) => Math.abs(a - v) <= 0.3);
  const nx = X.length - 1, ny = Y.length - 1, nz = Z.length - 1, fill = new Uint8Array(nx * ny * nz);
  const at = (i: number, j: number, k: number) => (i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz ? 0 : fill[(i * ny + j) * nz + k]);
  for (const b of boxes) for (let i = ix(X, b.x0); i < ix(X, b.x1); i++) for (let j = ix(Y, b.y0); j < ix(Y, b.y1); j++) for (let k = ix(Z, b.z0); k < ix(Z, b.z1); k++) fill[(i * ny + j) * nz + k] = 1;
  const pos: number[] = [], nor: number[] = [], idx: number[] = [];
  /* each face cut to a grid of cells at most GRID units across (the occlusion is worked out at its corners); an edge's cuts depend only on its length, so
     faces meeting along it are cut alike (no cracks) */
  const quad = (a: number[], b: number[], c: number[], d: number[], n: number[]) => {
    const nu = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / GRID - 1e-6));
    const nv = Math.max(1, Math.ceil(Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2]) / GRID - 1e-6));
    const base = pos.length / 3;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      for (let k = 0; k < 3; k++) pos.push(a[k] + ((b[k] - a[k]) * i) / nu + ((d[k] - a[k]) * j) / nv);
      nor.push(...n);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const p00 = base + j * (nu + 1) + i, p10 = p00 + 1, p01 = p00 + nu + 1, p11 = p01 + 1;
      idx.push(p00, p10, p11, p00, p11, p01);
    }
  };
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) {
    if (!at(i, j, k)) continue;
    const x0 = X[i], x1 = X[i + 1], y0 = Y[j], y1 = Y[j + 1], z0 = Z[k], z1 = Z[k + 1];
    if (!at(i + 1, j, k)) quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]);
    if (!at(i - 1, j, k)) quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]);
    if (!at(i, j + 1, k)) quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]);
    if (!at(i, j - 1, k)) quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]);
    if (!at(i, j, k + 1)) quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]);
    if (!at(i, j, k - 1)) quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

export async function createMatte(canvas: HTMLCanvasElement, markUrl: string): Promise<MatteGL> {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1;
  RectAreaLightUniformsLib.init();

  const scene = new THREE.Scene();
  /* the still's dim room (looks.mjs room(0.02)), a little brighter for the bounce the still has and this hasn't */
  const hemi = new THREE.HemisphereLight(0xffffff, 0x9a9a9a, 0.22);
  scene.add(hemi);
  /* each area light's rectangle, for the occlusion: its centre, half its width and half its height, in the world */
  const LC: THREE.Vector3[] = [], LU: THREE.Vector3[] = [], LV: THREE.Vector3[] = [], LL: THREE.Color[] = [];
  const rect = (color: THREE.ColorRepresentation, I: number, w: number, h: number, pos: THREE.Vector3, at: THREE.Vector3) => {
    const l = new THREE.RectAreaLight(color, I, w, h); l.position.copy(pos); l.lookAt(at); scene.add(l); l.updateMatrixWorld();
    const ax = new THREE.Vector3(), ay = new THREE.Vector3(), az = new THREE.Vector3();
    l.matrixWorld.extractBasis(ax, ay, az);
    LC.push(pos.clone()); LU.push(ax.normalize().multiplyScalar(w / 2)); LV.push(ay.normalize().multiplyScalar(h / 2)); LL.push(new THREE.Color(color).multiplyScalar(I));
  };
  rect("#ffffff", KEY.I, KEY.size, KEY.size, KEY.at, new THREE.Vector3(KEY.at.x, -400, KEY.at.z));                      // the key, over the top: first (shadowed)
  rect("#eef4f0", 2.2, 900, 1100, new THREE.Vector3(-250, -250, 900), new THREE.Vector3(0, -330, 0));                  // the fill, front left: the left faces
  rect("#ffffff", 0.35, 900, 1100, new THREE.Vector3(800, -300, -100), new THREE.Vector3(0, -330, 0));                 // a touch on the right faces

  /* the light a face sends out, per unit of paint, by which way it faces, at the middle of the stack (for the bounce): each area light's radiance times
     its form factor there (as three.js lights a face: radiance x paint x form factor), and the room's (its irradiance over pi); times pi, as the shader
     takes it in as irradiance */
  const NORMALS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const MID = new THREE.Vector3(0, -330, 0), BOUNCE = 0.45;
  const rad = NORMALS.map((n) => {
    const out = new THREE.Color(0, 0, 0);
    LC.forEach((c, j) => {
      let P = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => c.clone().addScaledVector(LU[j], u).addScaledVector(LV[j], v).sub(MID));
      /* the part in front of the face */
      const Q: THREE.Vector3[] = [];
      P.forEach((a, i) => { const b = P[(i + 1) % P.length], da = a.dot(n), db = b.dot(n); if (da >= 0) Q.push(a); if (da * db < 0) Q.push(a.clone().lerp(b, da / (da - db))); });
      P = Q;
      let f = 0;
      P.forEach((a, i) => { const A = a.clone().normalize(), B = P[(i + 1) % P.length].clone().normalize(), x = A.clone().cross(B), l = x.length(); if (l > 1e-9) f += Math.acos(Math.min(1, Math.max(-1, A.dot(B)))) * x.dot(n) / l; });
      out.add(LL[j].clone().multiplyScalar(Math.abs(f) / (2 * Math.PI)));
    });
    const sky = hemi.color.clone().multiplyScalar(hemi.intensity), ground = hemi.groundColor.clone().multiplyScalar(hemi.intensity);
    out.add(ground.lerp(sky, 0.5 + 0.5 * n.y).multiplyScalar(1 / Math.PI));
    /* the faces a corner sees are in that corner's shade too: a little under half lit (matched to the path-traced still beside the pillar and in the corners) */
    return new THREE.Vector3(out.r, out.g, out.b).multiplyScalar(Math.PI * BOUNCE);
  });
  const alb = PIECES.map(() => new THREE.Vector3());
  /* a piece put back (graphite) still gives back as much light as its paint at rest, in grey: so a lit piece beside it keeps its faces (Lawrence, D151;
     with the graphite's own dark grey, the lit ring's faces by a graphite pillar went dark) */
  const restGrey = PIECES.map((p) => { const c = new THREE.Color(ALBEDO[p.layer]); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; });
  const grey = new THREE.Vector3();
  const boxC = Array.from({ length: NB }, () => new THREE.Vector4()), boxH = Array.from({ length: NB }, () => new THREE.Vector4());
  const uni = {
    uBoxC: { value: boxC }, uBoxH: { value: boxH },
    uKey: { value: new THREE.Vector4(KEY.at.x, KEY.at.y, KEY.at.z, KEY.size / 2) },
    uLC: { value: LC }, uLU: { value: LU }, uLV: { value: LV },
    /* the room's sky and ground, as the shader has them (linear) */
    uHemi: { value: new THREE.Vector2(hemi.color.r, hemi.groundColor.r) },
    uRad: { value: rad }, uAlb: { value: alb },
    uHotPiece: { value: -1 }, uHotN: { value: 0 }, uHotCol: { value: new THREE.Vector3() },
    uHotLo: { value: Array.from({ length: 6 }, () => new THREE.Vector3()) }, uHotHi: { value: Array.from({ length: 6 }, () => new THREE.Vector3()) },
  };
  /* each piece: its mesh, and its boxes' places in the shader's list */
  let bi = 0;
  const meshes = PIECES.map((p, pi) => {
    const mat = paint({ color: ALBEDO[p.layer], roughness: 0.78, metalness: 0, specularIntensity: 0.35, transparent: true }, uni, pi);
    const mesh = new THREE.Mesh(solid(p.boxes), mat);
    scene.add(mesh);
    const first = bi;
    p.boxes.forEach((b, j) => {
      boxC[first + j].set((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2, 1);
      boxH[first + j].set((b.x1 - b.x0) / 2, (b.y1 - b.y0) / 2, (b.z1 - b.z0) / 2, pi);
    });
    bi += p.boxes.length;
    return { mesh, mat, first, n: p.boxes.length, rest: p.boxes.map((b) => (b.y0 + b.y1) / 2) };
  });

  /* the N: the official mark (public/v1/stack/stack-icon.svg) on the cap, its square laid on the cap's top face as v6 lays it (0.98 of the face) */
  const img = new Image(); img.src = markUrl; await img.decode();
  const mc = document.createElement("canvas"); mc.width = mc.height = 1024; mc.getContext("2d")!.drawImage(img, 0, 0, 1024, 1024);
  const tex = new THREE.CanvasTexture(mc); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const markMat = paint({ map: tex, transparent: true, color: "#ffffff", roughness: 1, metalness: 0, specularIntensity: 0, depthWrite: false }, uni, 0);
  const S = 2 * CAP.half * 0.98;
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(S, S), markMat);
  mark.rotation.x = -Math.PI / 2; mark.position.y = CAP.y + 0.05; mark.renderOrder = 25;
  meshes[0].mesh.add(mark);

  /* the camera: true isometric, orthographic, framing the viewBox and the room around it */
  const cam = new THREE.OrthographicCamera(VB[0] / K, (VB[0] + VB[2]) / K, -(VB[1] - PAD.top) / K, -(VB[1] + VB[3] + PAD.bottom) / K, 1, 6000);
  cam.position.set(1500, 1500, 1500); cam.up.set(0, 1, 0); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();

  /* the outline (D150): the drawing's cream line, over the lit pieces, on the edges that show. Each frame the pieces are drawn again, off screen, as which
     piece, which way each face faces and which plane it is in, and a line goes wherever that changes from one pixel to the next: on a piece's outside
     edges and its folds, where one piece passes in front of another, never between faces of one surface (a ring's beams outline as one shape; the
     pillar's cubes, together, as one tall piece) and never on an edge something hides. The line is on the near side of the edge, as wide as the
     drawing's .8 px, as strong as the drawing has that piece's (its fade in, ghost, dark) */
  const target = () => {
    const t = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true });
    t.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
    return t;
  };
  /* ids: every piece; held: only the pieces not passing (D203, Lawrence: near.com going away hid NEAR AI's outline under it, which came back all at once
     when it had gone; a piece coming in or going away is see-through, so what is behind it keeps its outline, seen through it) */
  const ids = target(), held = target();
  const idScene = new THREE.Scene();
  const idMeshes = meshes.map((m) => {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uId: { value: 0 }, uLine: { value: 0 }, uTop: { value: 0 } },
      /* the hovered cube, drawn over everything, is nearest here too: its depth put in front of all the rest (its own faces kept in order). At its true depth,
         its outline went on the far side of an edge where a ring piece really in front of it met it, and on its own side where the band did: the line
         stepped sideways along one edge (Lawrence, D129's cube over a front ring) */
      vertexShader: /* glsl */ `uniform float uTop; varying vec3 vN; varying float vPlane;
        void main() {
          vN = normal; vec4 w = modelMatrix * vec4(position, 1.0); vPlane = dot(abs(normal), w.xyz); gl_Position = projectionMatrix * viewMatrix * w;
          if (uTop > 0.5) gl_Position.z = (-1.0 + (gl_Position.z / gl_Position.w + 1.0) * 0.1) * gl_Position.w;
        }`,
      /* r: which way it faces (1 to 6, of 8; 0 nothing), g: which piece (of 32), b: its line's strength, a: its plane (the face's coordinate, 6 units a step) */
      fragmentShader: /* glsl */ `uniform float uId; uniform float uLine; varying vec3 vN; varying float vPlane;
        void main() {
          vec3 n = normalize(vN);
          float f = n.x > 0.5 ? 1.0 : n.x < -0.5 ? 2.0 : n.y > 0.5 ? 3.0 : n.y < -0.5 ? 4.0 : n.z > 0.5 ? 5.0 : 6.0;
          gl_FragColor = vec4(f / 8.0, uId / 32.0, uLine, clamp((vPlane + 800.0) / 1600.0, 0.0, 1.0));
        }`,
    });
    const mesh = new THREE.Mesh(m.mesh.geometry, mat);
    idScene.add(mesh);
    return { mesh, mat };
  });
  const lineMat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3, transparent: true, depthTest: false, depthWrite: false,
    uniforms: { tId: { value: ids.texture }, tDepth: { value: ids.depthTexture }, tHeld: { value: held.texture }, tHeldDepth: { value: held.depthTexture },
      uThrough: { value: 0 }, uClear: { value: new Array(16).fill(0) }, uW: { value: 1 }, uInk: { value: new THREE.Vector3(245 / 255, 244 / 255, 241 / 255) } },
    vertexShader: /* glsl */ `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `precision highp float;
      out vec4 outColor;
      uniform sampler2D tId; uniform sampler2D tDepth; uniform sampler2D tHeld; uniform sampler2D tHeldDepth; uniform int uW; uniform vec3 uInk;
      uniform bool uThrough; uniform float uClear[16];   // a passing piece's clearness (1 - its body's opacity), by its id
      bool other(vec4 c, vec4 o) { return o.r < 0.06 || abs(o.r - c.r) > 0.06 || abs(o.g - c.g) > 0.015 || abs(o.a - c.a) > 0.002; }
      /* the line at p in one map (which piece and its depth): c, what is there */
      float edge(sampler2D tI, sampler2D tD, ivec2 p, out vec4 c) {
        ivec2 sz = textureSize(tI, 0);
        c = texelFetch(tI, p, 0);
        if (c.r < 0.06) return 0.0;
        float dc = texelFetch(tD, p, 0).r, a = 0.0;
        for (int d = 0; d < 4; d++) {
          ivec2 dir = d == 0 ? ivec2(1, 0) : d == 1 ? ivec2(-1, 0) : d == 2 ? ivec2(0, 1) : ivec2(0, -1);
          for (int k = 1; k <= 4; k++) {
            if (k > uW) break;
            ivec2 q = clamp(p + dir * k, ivec2(0), sz - 1);
            vec4 o = texelFetch(tI, q, 0);
            if (!other(c, o)) continue;
            /* on the near side; where both sides are as near (a fold, two pieces meeting), on one side only */
            float dq = o.r < 0.06 ? 1.0 : texelFetch(tD, q, 0).r, tol = 4e-4 * float(k);
            if (dc < dq - tol || (abs(dc - dq) <= tol && (d == 0 || d == 2))) a = max(a, c.b);
          }
        }
        return a;
      }
      void main() {
        ivec2 p = ivec2(gl_FragCoord.xy);
        vec4 c, h;
        float a = edge(tId, tDepth, p, c);
        /* the outlines of the pieces held in place, seen through a passing piece over them, as far as it is clear */
        if (uThrough) {
          float b = edge(tHeld, tHeldDepth, p, h);
          if (b > 0.0) a = max(a, b * (abs(c.g - h.g) < 0.015 ? 1.0 : uClear[int(c.g * 32.0 + 0.5)]));
        }
        if (a <= 0.0) discard;
        outColor = vec4(uInk, a);
      }`,
  });
  const lineQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), lineMat);
  lineQuad.frustumCulled = false;
  const lineScene = new THREE.Scene();
  lineScene.add(lineQuad);
  const buf = new THREE.Vector2();
  const clear = lineMat.uniforms.uClear.value as number[];

  /* the shaders compiled before the first frame, off the main thread where the browser can (no stall as the band comes in) */
  await Promise.all([renderer.compileAsync(scene, cam), renderer.compileAsync(idScene, cam), renderer.compileAsync(lineScene, cam)]);

  return {
    resize(w, h, dpr) {
      renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
      renderer.getDrawingBufferSize(buf); ids.setSize(buf.x, buf.y); held.setSize(buf.x, buf.y);
      lineMat.uniforms.uW.value = Math.max(1, Math.round(0.8 * dpr));   /* the drawing's .8 px */
    },
    render({ pieces, mark: markA, joined }) {
      pieces.forEach((s, i) => {
        const m = meshes[i];
        m.mesh.position.y = -s.dy;
        for (let j = 0; j < m.n; j++) { boxC[m.first + j].y = m.rest[j] - s.dy; boxC[m.first + j].w = s.present; }
        m.mat.color.copy(s.color); m.mat.emissive.setScalar(s.lift);
        alb[i].set(s.color.r, s.color.g, s.color.b).lerp(grey.setScalar(restGrey[i]), Math.min(1, Math.max(0, s.dark))).multiplyScalar(Math.min(1, s.alpha));
        /* every piece is drawn as see-through (one shader: switching a piece's kind compiled another, a 100 ms stall on the first hover); a solid one
           still writes depth, so the order doesn't show. Over everything (the hovered cube): last, through everything */
        m.mat.opacity = s.alpha; m.mat.depthWrite = s.alpha > 0.5; m.mat.depthTest = !s.top;
        /* the solid pieces first; then the see-through ones, nearest first (the pillar's cubes top down, then the rings), so through a ghost or a piece
           fading in only the solid pieces behind it show, not another see-through one (no stacked glass) */
        m.mesh.renderOrder = s.top ? 30 : s.alpha < 0.999 ? 10 + i : 0;
        (m.mat.userData.floor as { value: number }).value = s.top ? 0.7 : 0;
        (m.mat.userData.dark as { value: number }).value = s.dark;
        m.mesh.visible = s.alpha > 0.002;
        if (i === 0) { markMat.depthTest = !s.top; mark.renderOrder = s.top ? 31 : 25; }
        /* its outline: the pillar's cubes one piece while together */
        const im = idMeshes[i];
        /* drawn for its outline even while its body is still clear (D203: a piece arrives as a wireframe, then fills in) */
        im.mesh.position.y = m.mesh.position.y; im.mesh.visible = m.mesh.visible || s.line > 0.002; im.mesh.renderOrder = m.mesh.renderOrder;
        im.mat.depthFunc = s.top ? THREE.AlwaysDepth : THREE.LessEqualDepth;
        im.mat.uniforms.uId.value = joined && i < 6 ? 1 : i + 2;
        im.mat.uniforms.uLine.value = Math.min(1, Math.max(0, s.line));
        im.mat.uniforms.uTop.value = s.top ? 1 : 0;
        clear[im.mat.uniforms.uId.value] = s.passing ? 1 - Math.min(1, Math.max(0, s.alpha)) : 0;
      });
      /* the pillar's cubes together share an id: as clear as the least clear of them */
      if (joined) clear[1] = Math.min(...pieces.slice(0, 6).map((s) => (s.passing ? 1 - Math.min(1, Math.max(0, s.alpha)) : 0)));
      /* a bar running hot alone (D203): its boxes where they are now */
      const hi = pieces.findIndex((s) => s.hot.length);
      uni.uHotPiece.value = hi; uni.uHotN.value = 0;
      if (hi >= 0) {
        const m = meshes[hi], s = pieces[hi];
        s.hot.slice(0, 6).forEach((j, n) => {
          const c = boxC[m.first + j], h = boxH[m.first + j];
          uni.uHotLo.value[n].set(c.x - h.x, c.y - h.y, c.z - h.z); uni.uHotHi.value[n].set(c.x + h.x, c.y + h.y, c.z + h.z);
          uni.uHotN.value = n + 1;
        });
        uni.uHotCol.value.set(s.hotColor.r, s.hotColor.g, s.hotColor.b);
      }
      markMat.opacity = markA;
      mark.visible = markA > 0.002;
      renderer.setRenderTarget(ids); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(idScene, cam);
      /* while a piece passes: the map again without it (and anything else passing) */
      const through = pieces.some((s, i) => s.passing && idMeshes[i].mesh.visible);
      lineMat.uniforms.uThrough.value = through;
      if (through) {
        const vis = idMeshes.map((m) => m.mesh.visible);
        idMeshes.forEach((m, i) => { m.mesh.visible = vis[i] && !pieces[i].passing; });
        renderer.setRenderTarget(held); renderer.clear(); renderer.render(idScene, cam);
        idMeshes.forEach((m, i) => { m.mesh.visible = vis[i]; });
      }
      renderer.setRenderTarget(null);
      renderer.render(scene, cam);
      renderer.autoClear = false; renderer.render(lineScene, cam); renderer.autoClear = true;
    },
    dispose() {
      meshes.forEach((m) => { m.mesh.geometry.dispose(); m.mat.dispose(); });
      mark.geometry.dispose(); markMat.dispose(); tex.dispose();
      idMeshes.forEach((m) => m.mat.dispose()); lineQuad.geometry.dispose(); lineMat.dispose(); ids.dispose(); ids.depthTexture?.dispose(); held.dispose(); held.depthTexture?.dispose(); renderer.dispose();
    },
  };
}
