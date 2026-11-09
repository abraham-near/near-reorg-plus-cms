import { hero as original } from "./original";
import { hero as clouds } from "./clouds";
import { hero as unfurl } from "./unfurl";
import { hero as dune } from "./dune";
import { hero as gate } from "./gate";
import { hero as cliff } from "./ring-options/motion/cliff";
import { hero as birch } from "./ring-options/motion/birch";
import { hero as blacksand } from "./ring-options/motion/blacksand";
import { hero as mesa } from "./ring-options/motion/mesa";
import { hero as lake } from "./ring-options/motion/lake";
import type { HeroKey, HeroVariant } from "./types";
import { RANDOM_KEYS } from "./pool";

// Every hero version (D90, D106). ?hero=<key> shows any of them (review links).
export const HEROES: Record<HeroKey, HeroVariant> = { original, clouds, unfurl, dune, gate, cliff, birch, blacksand, mesa, lake };
export const HERO_KEYS = Object.keys(HEROES) as HeroKey[];
// D107 (Lawrence: "We only are keeping versions with the ring on the home page hero random set"): the homepage picks at
// random from the ring heroes only, the gate and the five ring options in motion. The earlier versions (the original
// ridges, clouds, unfurl, dune) keep their pages and ?hero= links but are no longer picked.
export { RANDOM_KEYS };
// Where each version's own review page is (the homepage with that hero only)
export const reviewPath = (k: HeroKey) => "/lab/" + ((RANDOM_KEYS.includes(k) && k !== "gate" ? "hero-ring-" : "hero-live-") + k);
export type { HeroKey, HeroVariant };
