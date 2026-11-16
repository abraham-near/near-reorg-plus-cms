// Home v6's Stack drawing, in other looks (D148): still frames of the same drawing (same geometry, same framing, the band's #262626 behind), for
// /home-v6/stack-looks. The 3D ones are path-traced from the drawing's own 3D model (v2/stack/geometry.ts's boxes, which v6's iso faces were drawn from)
// with an orthographic camera on the same isometric view, so they lie exactly over today's drawing; the SVG ones are drawn live (./StackLookSvg.tsx).
import type { SvgLook } from "./StackLookSvg";

export type LookKey = "now" | "matte" | "graded" | "frosted" | "anodized" | "engraved";
export type Look = {
  key: LookKey; name: string; note: string; ships: string;
  /* a path-traced still (public/stack-looks/stack-look-<key>.webp), or an SVG look drawn live */
  img?: boolean; svg?: SvgLook; tag?: string; refs: { label: string; href: string }[];
};

export const LOOKS: Look[] = [
  {
    key: "now", name: "Today", svg: "flat", tag: "Flat · /home-v6 before D149",
    note: "The drawing as /home-v6 had it at rest until lit matte (D149): three flat tones per box (top lightest, left, right darkest) and a cream hairline on every edge.",
    ships: "Live SVG: the build, the hover, the parting cubes.", refs: [],
  },
  {
    key: "matte", name: "Lit matte", img: true, tag: "Picked · on /home-v6",
    note: "A painted, matte finish under real light: a large softbox close over the top, a fill low on the left, a little on the right. The light falls off down every side, the rings shade the pillar under them, the corners and the joints between the cubes darken. Each layer keeps its own green.",
    ships: "Picked: now live on /home-v6, drawn in three.js over the drawing, its shadows and occlusion worked out each frame from where the pieces are, so they follow the build and the hover (D149).",
    refs: [{ label: "three-gpu-pathtracer · the path tracer these were rendered with", href: "https://github.com/gkjohnson/three-gpu-pathtracer" }],
  },
  {
    key: "graded", name: "Graded", svg: "graded", tag: "Detailed gradients",
    note: "Still SVG, less flat: every face is shaded by one light from above across the whole drawing, so the pillar and the rings darken toward the foot; each side face also fades from a soft lit top edge to a darker foot, so the arms read as solid bars and the cubes as stacked blocks. The hairlines drop to a whisper.",
    ships: "The cheapest change: the same SVG, with gradients for flat fills. The build, the hover and the parting all keep working.", refs: [],
  },
  {
    key: "frosted", name: "Frosted glass", img: true, tag: "Glass",
    note: "Frosted glass, like sea glass: soft and milky, each layer tinted its own green and lit from behind, so the light comes through the bodies and the cubes of the pillar show as stacked blocks. The Commerce ring, the darkest tint, reads grey. Clear glass was tried and left out: in this straight-on isometric view polished glass only shows what it mirrors, and on the dark band it read muddy.",
    ships: "As rendered images, one per piece (real light through glass needs a path tracer); live, three.js’s transmission does a cheaper, flatter version.",
    refs: [{ label: "three-gpu-pathtracer · the path tracer these were rendered with", href: "https://github.com/gkjohnson/three-gpu-pathtracer" }],
  },
  {
    key: "anodized", name: "Anodized aluminium", img: true, tag: "From research",
    note: "Anodized aluminium, dyed green, as hardware is finished: a satin metal. Each face takes its sheen from the light in its own mirror direction, so bright bands run along the bars (the tops brightest, the right faces darkest) and the pieces catch a little of each other.",
    ships: "As rendered images, or live in three.js with an environment map; the reflections of one piece in another need the renders.",
    refs: [{ label: "Thisispaper · Teenage Engineering’s OP-1 field, natural anodized aluminium", href: "https://www.thisispaper.com/mag/op-1-field-teenage-engineering" }],
  },
  {
    key: "engraved", name: "Engraved", svg: "engraved", tag: "From research",
    note: "A technical engraving, inverted for the dark band: each face hatched in its layer’s green, the lines closest where a face takes the most light (the tops), sparsest on the right faces; a faint wash of the green under the lines so each face stays solid, thin light edges, the N light on a clear cap. No light, no gloss: the drawing as a diagram.",
    ships: "Live SVG (patterns clipped to each face): the build, the hover and the parting keep working.",
    refs: [
      { label: "spite/sketch · cross-hatching and engraving experiments in three.js", href: "https://github.com/spite/sketch" },
      { label: "three-edge-projection · a 3D model’s visible edges as flat lines", href: "https://github.com/gkjohnson/three-edge-projection" },
    ],
  },
];
