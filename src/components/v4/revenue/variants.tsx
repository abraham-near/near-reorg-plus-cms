// The revenue band's four options, side by side on /home-v4/a…d (the switch bottom left). Each lives in its own folder; data: ./data.ts.
import type { ComponentType } from "react";
import { RevenueA } from "./a/RevenueA";
import { RevenueB } from "./b/RevenueB";
import { RevenueC } from "./c/RevenueC";
import { RevenueD } from "./d/RevenueD";

export const REV_KEYS = ["a", "b", "c", "d"] as const;
export type RevKey = (typeof REV_KEYS)[number];
export const REV_NAMES: Record<RevKey, string> = { a: "Shutter", b: "Screen", c: "Dots", d: "Scroll story" };
export const REV_VARIANTS: Record<RevKey, ComponentType> = { a: RevenueA, b: RevenueB, c: RevenueC, d: RevenueD };

/** each option also closes the rail into the Stack its own way (rail/layer.ts drawExit, no dots) */
export const RAIL_EXIT: Record<RevKey, "floor" | "frame" | "seam" | "ruler" | "drop"> = { a: "drop", b: "frame", c: "seam", d: "ruler" };
/** how the rail marks the four steps: "line" = green over the ink line, no N tiles; "tiles" = the N tiles and a green run */
export const RAIL_STEPS: Record<RevKey, "tiles" | "line"> = { a: "line", b: "line", c: "line", d: "line" };
/** how the voices play (v3's ProofDeeper voicesMode): A v3's scene, shorter; B marquee; C pins on the ridges; D a short scrubbed deck */
/** Origin's photo shape */
export const ORIGIN_RATIO: Record<RevKey, "4/3" | "16/9"> = { a: "4/3", b: "4/3", c: "16/9", d: "16/9" };
export const VOICES_MODE: Record<RevKey, "short" | "marquee" | "pins" | "deck"> = { a: "short", b: "marquee", c: "pins", d: "deck" };
