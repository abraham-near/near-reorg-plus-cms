"use client";
// Study B's drawing: the ring in three.js (./scene.ts, its geometry in ./ring.ts). The scene's code (with three.js) is fetched as soon as this module
// loads, in parallel with hydration, as its own chunk. The canvas covers the whole hero (.hp), placed from the art box out to the hero's edges, so no path
// of the intro or the exit is ever cut by a box edge (no masks); the scene frames the drawing exactly in the box. Its scroll: one trigger on the hero,
// "top top" → "bottom top" (the hero's hold), scrubbed into the scene; the exit lands the core on the h1's square (.hp__sq). No WebGL: nothing is drawn
// and the hero stays clean. Reduced motion: one still frame that fades as the page scrolls.
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReduced } from "@/lib/motion/scroll";

gsap.registerPlugin(ScrollTrigger);
const load = typeof window !== "undefined" ? import("./scene") : null;

export function RingGl() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current, box = canvas?.parentElement, hero = canvas?.closest<HTMLElement>(".hp");
    if (!canvas || !box || !hero || !load) return;
    // the canvas: from the box out to the hero's edges (the box may be translated; the rects account for it)
    const place = () => {
      const h = hero.getBoundingClientRect(), b = box.getBoundingClientRect();
      Object.assign(canvas.style, { left: `${h.left - b.left}px`, top: `${h.top - b.top}px`, width: `${h.width}px`, height: `${h.height}px`, right: "auto", bottom: "auto" });
    };
    place();
    const ro = new ResizeObserver(place); ro.observe(hero); ro.observe(box);
    addEventListener("resize", place);
    let dead = false, st: ScrollTrigger | null = null;
    let scene: { setProgress(p: number): void; dispose(): void } | null = null;
    (async () => {
      try {
        const mod = await load;
        if (dead) return;
        scene = mod.mount(canvas, box, { reduced: prefersReduced(), square: () => hero.querySelector<HTMLElement>(".hp__sq") });
        const s = scene;
        // not the scrub() helper: it reads a trigger starting at scroll 0 (this one) as done
        st = ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom top", onUpdate: (t) => s.setProgress(t.progress), onRefresh: (t) => s.setProgress(t.progress) });
        s.setProgress(st.progress);
        canvas.style.visibility = "visible";
      } catch (e) {
        console.warn("[hero-private b] no scene:", e);   // no WebGL: the hero stays without its drawing
      }
    })();
    return () => { dead = true; ro.disconnect(); removeEventListener("resize", place); st?.kill(); scene?.dispose(); scene = null; canvas.style.visibility = "hidden"; };
  }, []);
  return <canvas ref={ref} style={{ display: "block", visibility: "hidden" }} />;
}
