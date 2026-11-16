import type { ReactNode } from "react";
import { VIEWBOX, PILLAR, CUBES, INTENTS, COM, AI, COVERS, type Box } from "../geometry";
import { EDGES, fullEdges, type BoxEdges } from "../edges";

// Home v6's Stack drawing, still, in the looks that stay SVG (D148): "flat", as /home-v6 draws it today (StackArtV6, at rest, everything in); "graded",
// each face shaded by a light from above across the whole drawing, with a lit top edge and a darker foot on every side face; "engraved", the faces hatched in
// their layer's green (inverted engraving: the more light a face takes, the closer its lines), a faint wash of green under them, light edges, the N light on a clear cap. Same geometry, same paint order as
// StackArtV6 (the pillar, then each ring with the pillar drawn again over its back), no motion and no hover.
export type SvgLook = "flat" | "graded" | "engraved";
type Layer = "protocol" | "intents" | "ai" | "com";
const BOXES = { intents: INTENTS, com: COM, ai: AI.map(([, ...b]) => b as Box) };
/* tokens.css's greens (top, left, right), NEAR Intents toned down as stack-v6.css has it */
const TONE: Record<Layer, [string, string, string]> = {
  protocol: ["#5fe0ae", "#3cc994", "#22a374"], intents: ["#a6ecca", "#72d9ac", "#4cbf8e"], ai: ["#4fd09c", "#33b482", "#208e64"], com: ["#2a9a6d", "#1e7a55", "#145b3f"],
};
const KIND = ["l", "r", "t"] as const;   /* a box's faces, in order: left, right, top */
const TI = [1, 2, 0];                      /* ... and each one's tone in TONE (top, left, right) */
const [VX, VY, VW, VH] = VIEWBOX.split(" ").map(Number);

const H = PILLAR.height / CUBES;
const cube = (i: number): Box => {
  const { half: w, rise: r } = PILLAR, y0 = i * H, y1 = y0 + H;
  return [`${-w},${y1} 0,${y1 + r} 0,${y0 + r} ${-w},${y0}`, `${w},${y1} 0,${y1 + r} 0,${y0 + r} ${w},${y0}`, `0,${y0 - r} ${w},${y0} 0,${y0 + r} ${-w},${y0}`];
};
const ICON = 0.98;
const iconAt = (() => { const a = PILLAR.half * ICON, b = PILLAR.rise * ICON; return `matrix(${a},${b},${-a},${b},0,${-b})`; })();

type Pt = [number, number];
const pts = (s: string): Pt[] => s.split(" ").map((p) => p.split(",").map(Number) as Pt);
const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};
/* graded: the light from above, as each face kind takes it, from the drawing's top to its foot (a multiple of the token colour) */
const FALL: Record<(typeof KIND)[number], [number, number]> = { t: [1.1, 0.8], l: [1.08, 0.7], r: [1.02, 0.62] };
/* a side face's own shading (graded): a lit top edge and a darker foot, each a fixed depth (drawing units) whatever the face's height, so a bar made of
   several boxes shades as one (D148 critic: shading by each box's own height tiled the rings); the gradient's lines run with the face's edges */
const LIT = 6, FOOT = 12;   /* the lit edge a soft fade, not a band (D148 critic, second pass: a band read as a second bar) */
function along(face: Pt[]) {
  const [p0, , p2, p3] = face, ex = p2[0] - p3[0], ey = p2[1] - p3[1], el = Math.hypot(ex, ey) || 1;
  let nx = -ey / el, ny = ex / el;
  if (nx * (p0[0] - p3[0]) + ny * (p0[1] - p3[1]) < 0) { nx = -nx; ny = -ny; }
  const d = nx * (p0[0] - p3[0]) + ny * (p0[1] - p3[1]);
  return { a: { x1: p3[0], y1: p3[1], x2: p3[0] + nx * d, y2: p3[1] + ny * d }, lit: Math.min(0.3, LIT / d), foot: Math.max(0.35, (d - FOOT) / d) };
}

export function StackLookSvg({ look, id, className }: { look: SvgLook; id: string; className?: string }) {
  let n = 0;
  const defs: ReactNode[] = [];
  /* a face: its fill (and, graded, its own shading over it) */
  const face = (f: string, k: number, layer: Layer, key: string, cap = false) => {
    const kind = KIND[k], tone = TONE[layer][TI[k]];
    if (look === "flat") return <polygon key={key} points={f} fill={tone} stroke={tone} strokeWidth={1} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />;
    if (look === "engraved") return (
      <g key={key}>
        <polygon points={f} fill="#262626" stroke="#262626" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        {/* a faint wash of the face's tone under the lines, so the form stays solid at small sizes (D148 critic, second pass) */}
        <polygon points={f} fill={tone} fillOpacity={kind === "t" ? 0.16 : kind === "l" ? 0.11 : 0.07} />
        {!cap && <polygon points={f} fill={`url(#${id}-h-${layer}-${kind})`} />}
      </g>
    );
    const base = <polygon points={f} fill={`url(#${id}-fall-${layer}-${kind})`} stroke={`url(#${id}-fall-${layer}-${kind})`} strokeWidth={1} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />;
    if (kind === "t") return <g key={key}>{base}</g>;
    const g = `${id}-s${n++}`, { a, lit, foot } = along(pts(f));
    defs.push(
      <linearGradient key={g} id={g} gradientUnits="userSpaceOnUse" {...a}>
        <stop offset="0" stopColor="#fff" stopOpacity={0.11} /><stop offset={lit} stopColor="#fff" stopOpacity={0} />
        <stop offset={foot} stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.26} />
      </linearGradient>,
    );
    return <g key={key}>{base}<polygon points={f} fill={`url(#${g})`} /></g>;
  };
  const line = (d: string, key: string) => (
    <path key={key} d={d} fill="none" stroke="#f5f4f1" strokeOpacity={look === "engraved" ? 0.45 : look === "graded" ? 0.16 : 0.36} strokeWidth={look === "engraved" ? 0.9 : 0.8} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
  );
  /* a piece: all its faces, then all its outlines (StackArtV6's order) */
  const piece = (boxes: Box[], edges: BoxEdges[], layer: Layer, key: string, cap = false) => (
    <g key={key}>
      {boxes.flatMap((b, i) => b.map((f, k) => (edges[i].hide[k] ? null : face(f, k, layer, `${key}-${i}-${k}`, cap && k === 2))))}
      {boxes.flatMap((_, i) => edges[i].e.map((d, k) => (edges[i].hide[k] ? null : line(d, `${key}-e${i}-${k}`))))}
    </g>
  );
  const pillar = (key: string, clip?: string) => (
    <g key={key} clipPath={clip ? `url(#${clip})` : undefined}>
      {Array.from({ length: CUBES }, (_, k) => CUBES - 1 - k).map((i) => (
        <g key={i}>
          {piece([cube(i)], [fullEdges(cube(i))], "protocol", `${key}-c${i}`, i === 0)}
          {i === 0 && <image href="/v1/stack/stack-icon.svg" width="1" height="1" transform={iconAt} preserveAspectRatio="xMidYMid meet"
            style={look === "engraved" ? { filter: "invert(0.95)" } : undefined} />}
        </g>
      ))}
    </g>
  );
  const ring = (k: keyof typeof BOXES) => piece(BOXES[k], EDGES[k], k, k);
  const body = (
    <>
      {pillar("base")}
      {ring("intents")}{pillar("ci", `${id}-cover-intents`)}
      {ring("ai")}{pillar("ca", `${id}-cover-ai`)}
      {ring("com")}{pillar("cc", `${id}-cover-com`)}
    </>
  );
  const layers: Layer[] = ["protocol", "intents", "ai", "com"];
  return (
    <svg className={className} viewBox={VIEWBOX} role="img" aria-label="The NEAR Stack: the protocol pillar through three rings" focusable="false">
      <defs>
        {(["intents", "ai", "com"] as const).map((k) => (
          <clipPath key={k} id={`${id}-cover-${k}`}>{COVERS[k].map((p, i) => <polygon key={i} points={p} />)}</clipPath>
        ))}
        {look === "graded" && layers.flatMap((l) => KIND.map((kind, k) => (
          <linearGradient key={`${l}-${kind}`} id={`${id}-fall-${l}-${kind}`} gradientUnits="userSpaceOnUse" x1={0} y1={VY} x2={0} y2={VY + VH}>
            <stop offset="0" stopColor={shade(TONE[l][TI[k]], FALL[kind][0])} /><stop offset="1" stopColor={shade(TONE[l][TI[k]], FALL[kind][1])} />
          </linearGradient>
        )))}
        {/* engraved: light lines on the dark, closest where a face takes the most light (the tops), sparsest on the right faces; the tops along their
            back-right edges (150°), the sides upright */}
        {look === "engraved" && layers.flatMap((l) => [
          <pattern key={`${l}-t`} id={`${id}-h-${l}-t`} patternUnits="userSpaceOnUse" width={5.6} height={10} patternTransform="rotate(60)">
            <line x1={1.1} y1={0} x2={1.1} y2={10} stroke={TONE[l][0]} strokeWidth={2.1} />
          </pattern>,
          <pattern key={`${l}-l`} id={`${id}-h-${l}-l`} patternUnits="userSpaceOnUse" width={8} height={10}>
            <line x1={1} y1={0} x2={1} y2={10} stroke={TONE[l][0]} strokeWidth={1.8} strokeOpacity={0.85} />
          </pattern>,
          <pattern key={`${l}-r`} id={`${id}-h-${l}-r`} patternUnits="userSpaceOnUse" width={13} height={10}>
            <line x1={0.9} y1={0} x2={0.9} y2={10} stroke={TONE[l][0]} strokeWidth={1.6} strokeOpacity={0.7} />
          </pattern>,
        ])}
        {defs}
      </defs>
      <rect x={VX} y={VY} width={VW} height={VH} fill="#262626" />
      {body}
    </svg>
  );
}
