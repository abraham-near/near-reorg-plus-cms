import type { HeroKey } from "./types";

// The homepage's random set (D107), client-safe (index.ts imports every version eagerly, so RandomHero can't use it).
// Keep in step with RANDOM_KEYS in index.ts.
export const RANDOM_KEYS: HeroKey[] = ["gate", "cliff", "birch", "blacksand", "mesa", "lake"];
