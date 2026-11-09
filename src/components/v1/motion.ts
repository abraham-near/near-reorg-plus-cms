"use client";
// v1's useScrollMotion: the shared hook's behaviour, but the section mounts only once the world, the rail and the Stack are up (ctx.ts whenReady).
import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReduced, type Mount } from "@/lib/motion/scroll";
import { whenReady } from "./ctx";

export { setter, scrub, prefersReduced, type Mount, type MotionCtx } from "@/lib/motion/scroll";

gsap.registerPlugin(ScrollTrigger);

const reducedNow = () => prefersReduced() || document.documentElement.hasAttribute("data-rm");

export function useScrollMotion(ref: RefObject<HTMLElement | null>, mount: Mount) {
  useEffect(() => {
    const root = ref.current; if (!root) return;
    let dead = false, cleanup: void | (() => void), gctx: gsap.Context | null = null;
    whenReady().then(() => {
      if (dead) return;
      gctx = gsap.context(() => { cleanup = mount(root, { gsap, ScrollTrigger, reduced: reducedNow() }); }, root);
      requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    return () => { dead = true; if (typeof cleanup === "function") cleanup(); gctx?.revert(); };
    // mount is a module-level function: the effect runs once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
