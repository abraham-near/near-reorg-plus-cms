// Home v1 (near-reorg r17 v1, "Carril vivo"): the contract between the page's boot (world/), the rail (rail/), the Stack (stack/) and the sections after it.
import type { gsap } from "gsap";
import type { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";

export type Dispose = () => void;

/** what the world's boot hands the rail and the Stack (world/boot.ts builds it; it may carry more for its own modules) */
export type V1Ctx = {
  gsap: typeof gsap;
  ScrollTrigger: typeof ScrollTrigger;
  /** smooth scroll; null with reduced motion */
  lenis: Lenis | null;
  /** ?rm=1 or prefers-reduced-motion: no pins, no scrubs, the static stacked page; interactions still work */
  reduced: boolean;
  /** max-width: 760px, kept current on resize */
  mobile: boolean;
  /** true while the hero's scroll pin runs (false on the poster fallback and with reduced motion) */
  pinned: boolean;
  /** cb(p), p = 0..1 over the hero -> statement transition; called at once with the current p. Returns its own off. */
  progress: (cb: (p: number) => void) => Dispose;
  /** aborted when the page unmounts: every listener, observer and rAF a module adds stops with it */
  signal: AbortSignal;
};

/* The sections after the Stack wait for the world, the rail and the Stack to be mounted (their pins move every start / end below them). */
let open: () => void = () => {};
let gate = new Promise<void>((r) => { open = r; });
export const whenReady = () => gate;
export const markReady = () => open();
/** a fresh gate for a fresh boot (React's dev remount, HMR) */
export const resetReady = () => { gate = new Promise<void>((r) => { open = r; }); };
