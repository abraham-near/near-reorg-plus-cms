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
export const RAIL_EXIT: Record<RevKey, "floor" | "frame" | "seam" | "ruler" | "sweep"> = { a: "sweep", b: "frame", c: "seam", d: "ruler" };
/** how the rail marks the four steps: "line" = green over the ink line, no N tiles; "tiles" = the N tiles and a green run */
export const RAIL_STEPS: Record<RevKey, "tiles" | "line"> = { a: "line", b: "tiles", c: "tiles", d: "tiles" };
