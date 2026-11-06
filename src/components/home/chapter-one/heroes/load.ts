import type { HeroKey, HeroVariant } from "./types";

// Each hero version's code, fetched on its own (D90): the homepage's client imports only the version it picked, so the
// others' layers, tracking data and videos never download. Client-safe: unlike index.ts it imports no version eagerly.
export const LOAD: Record<HeroKey, () => Promise<HeroVariant>> = {
  original: () => import("./original").then((m) => m.hero),
  clouds: () => import("./clouds").then((m) => m.hero),
  unfurl: () => import("./unfurl").then((m) => m.hero),
  dune: () => import("./dune").then((m) => m.hero),
  gate: () => import("./gate").then((m) => m.hero),
  cliff: () => import("./ring-options/motion/cliff").then((m) => m.hero),
  birch: () => import("./ring-options/motion/birch").then((m) => m.hero),
  blacksand: () => import("./ring-options/motion/blacksand").then((m) => m.hero),
  mesa: () => import("./ring-options/motion/mesa").then((m) => m.hero),
  lake: () => import("./ring-options/motion/lake").then((m) => m.hero),
};
