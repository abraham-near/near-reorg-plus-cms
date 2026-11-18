// The v6 Stack drawing's outlines, without the joints (D131). A ring is drawn as boxes, and where two boxes meet on one flat side (an arm running into its
// corner, a post stacked on a post) their shared edge would be drawn as a line across what reads as one surface. Lawrence wants each piece to read as an
// extruded tube bending at right angles: only its real edges (the folds and the outline) are drawn.
//
// For each face, each edge is walked in 1-unit steps; a step is a joint (left out) where the point just outside it lies on another face of the same kind
// (top, left or right) of the same piece, or where the point just inside it lies under a box of the piece drawn later. A piece: a ring, or for NEAR AI one product (its three are drawn and lit apart). The pillar's cubes keep all their
// edges: each is a layer of its own.
//
// The outlines are computed ahead of time by scripts/stack-edges.ts into ./edges.json (walking every edge against every face took ~0.5 s of the main
// thread on a phone, at load, in every browser). Regenerate it after changing ./geometry.ts: npx tsx scripts/stack-edges.ts
import type { Box } from "./geometry";
import data from "./edges.json";

/* a box's faces: their outlines (left, right, top; joints left out), and which of them are buried */
export type BoxEdges = { e: [string, string, string]; hide: [boolean, boolean, boolean] };
export const EDGES = data.EDGES as { intents: BoxEdges[]; com: BoxEdges[]; ai: BoxEdges[] };
/* each ring's boxes behind the pillar that its front boxes (FRONT) partly cover (StackArtV7: #stk7-nofront) */
export const UNDER_FRONT = data.UNDER_FRONT as Record<"intents" | "com" | "ai", number[]>;
/* a box with all its edges (the pillar's cubes) */
export const fullEdges = (b: Box): BoxEdges => ({ e: b.map((f) => `M${f.split(" ").join("L").replace(/,/g, " ")}Z`) as [string, string, string], hide: [false, false, false] });
