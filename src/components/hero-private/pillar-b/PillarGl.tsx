"use client";
// Hero study "Pillar B": the pillar in three.js (./scene.ts, its geometry in ./pillar.ts). The canvas covers the whole hero (.hp), not just the art
// box (.hp__art, which only frames the drawing at rest): the exit's paths reach the h1's green square, and nothing is ever cut by a box edge. The
// scene's code (with three.js) loads after the page as its own chunk. Its scroll: one trigger on the hero, "top top" → "bottom top", scrubbed into
// the scene (the "seal"). No WebGL: nothing is drawn and the hero stays clean. Reduced motion: one still frame that the scroll fades.
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReduced } from "@/lib/motion/scroll";

gsap.registerPlugin(ScrollTrigger);

export function PillarGl() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current, box = canvas?.parentElement, hero = canvas?.closest<HTMLElement>(".hp");
    if (!canvas || !box || !hero) return;
    // the canvas: out from the art box to the hero's edges
    const cover = () => {
      const h = hero.getBoundingClientRect(), b = box.getBoundingClientRect();
      Object.assign(canvas.style, { left: `${h.left - b.left}px`, top: `${h.top - b.top}px`, width: `${h.width}px`, height: `${h.height}px` });
    };
    cover();
    const ro = new ResizeObserver(cover); ro.observe(hero); ro.observe(box);
    let dead = false, st: ScrollTrigger | null = null;
    let scene: { setProgress(p: number): void; dispose(): void } | null = null;
    (async () => {
      try {
        const mod = await import("./scene");
        if (dead) return;
        scene = mod.mount(canvas, box, { reduced: prefersReduced() });
        const s = scene;
        // not the scrub() helper: it reads a trigger starting at scroll 0 (this one) as done
        st = ScrollTrigger.create({
          trigger: hero, start: "top top", end: "bottom top",
          onUpdate: (q) => s.setProgress(q.progress), onRefresh: (q) => s.setProgress(q.progress),
        });
        s.setProgress(st.progress);
        canvas.style.visibility = "";
      } catch (e) {
        console.warn("[hero-private pillar-b] no scene:", e);   // no WebGL: the hero stays without its drawing
      }
    })();
    return () => { dead = true; ro.disconnect(); st?.kill(); scene?.dispose(); scene = null; canvas.style.visibility = "hidden"; };
  }, []);
  return <canvas ref={ref} style={{ display: "block", position: "absolute", inset: "auto", visibility: "hidden", pointerEvents: "none" }} />;
}
