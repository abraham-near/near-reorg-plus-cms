/* r17 v1 · the rail's illustrations from the Figma isometrics (TJ38G7245lEghviUBaCTFJ: problem 459:527, data 501:4977, assets 508:5715, intelligence 521:6082,
 * identity 521:6785). r17 v1's js/vig2.js.
 *   createVignette(key, host) -> { el, set(a), idle(t, w), dispose() }
 *   set(a): a pure function of the playhead, a in [0, 2]: 0 = not arrived (nothing shows), 0 -> 1 = arriving, 1 = at rest, 1 -> 2 = leaving, 2 = gone. Cheap,
 *           allocation free. Calls made before the art has loaded are remembered: the last one is applied when it lands.
 *   idle(t, w): additive motion at rest (t seconds, w 0..1 how much); at w = 0 the DOM is exactly set(a)'s. Never called with reduced motion / on the static page.
 *   dispose(): cancels the pending load, disconnects its observers, removes its element from the host. Idempotent; set / idle are no-ops after it.
 * Each illustration is its own module, ./<key>.ts, exporting create(host). The art is public/v1/vig2/<key>.svg, fetched and inlined (the modules select
 * hooks inside it). */
import "./vig2.css";
import { create as problem } from "./problem";
import { create as data } from "./data";
import { create as assets } from "./assets";
import { create as intelligence } from "./intelligence";
import { create as identity } from "./identity";

export type VigKey = "problem" | "data" | "assets" | "intelligence" | "identity";
/** own(o): optional, the problem's only (home v5, .layer[data-beats="split"]): 0 someone else's stack, 1 the user's; drawn in place at rest */
export type Vignette = { el: HTMLElement; set: (a: number) => void; idle: (t: number, w: number) => void; own?: (o: number) => void; dispose?: () => void };

/** the four stations, in rail order (the problem is the gate's) */
export const KEYS: VigKey[] = ["data", "assets", "intelligence", "identity"];
const MOD: Record<VigKey, (host: HTMLElement) => Vignette> = { problem, data, assets, intelligence, identity };

export function createVignette(key: VigKey, host: HTMLElement): Vignette {
  const m = MOD[key];
  if (!m) throw new Error("[vig2] no illustration " + key);
  return m(host);
}
