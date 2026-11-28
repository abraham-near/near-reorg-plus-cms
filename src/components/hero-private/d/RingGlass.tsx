"use client";
// Study D's drawing, "privacy through glass": the ring in three.js with its sides turned to frosted glass (./scene.ts: the three acts; geometry
// ./ring.ts, the frost ./glass.ts, effects ./fx.ts, post ./post.ts). As study C (../c/RingFx.tsx): the scene's code (with three.js) is its own chunk,
// fetched as soon as this module runs (alongside hydration); the canvas shows nothing until the scene has compiled, then the intro plays at once.
// The canvas covers the whole hero (.hp), not just .hp__art (negative offsets out to the hero's edges), so no piece is ever cut by a box edge; the
// scene frames the drawing exactly where the box is. `?glyph=abstract` draws the data as dashes instead of hex (the default).
// Its scroll: one trigger on the hero, "top top" → "bottom top" (the hero's hold; on phones, the hero leaving), into the scene. No WebGL: nothing is
// drawn and the hero stays clean. Reduced motion: a still frame, faded out by the scroll.
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReduced } from "@/lib/motion/scroll";

gsap.registerPlugin(ScrollTrigger);

let chunk: Promise<typeof import("./scene")> | null = null;
const load = () => (chunk ??= import("./scene"));
if (typeof window !== "undefined") void load().catch(() => { chunk = null; });

export function RingGlass() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current, box = canvas?.parentElement, hero = canvas?.closest<HTMLElement>(".hp");
    if (!canvas || !box || !hero) return;
    const rm = prefersReduced();
    const glyph = new URLSearchParams(location.search).get("glyph") === "abstract" ? "abstract" : "hex";
    const cover = () => {
      const h = hero.getBoundingClientRect(), b = box.getBoundingClientRect();
      Object.assign(canvas.style, { left: `${h.left - b.left}px`, top: `${h.top - b.top}px`, width: `${h.width}px`, height: `${h.height}px`, right: "auto", bottom: "auto" });
    };
    cover();
    const ro = new ResizeObserver(cover); ro.observe(hero); ro.observe(box);
    let dead = false, st: ScrollTrigger | null = null;
    let scene: { setProgress(p: number): void; dispose(): void } | null = null;
    (async () => {
      try {
        const mod = await load();
        if (dead) return;
        const s = await mod.mount(canvas, box, { reduced: rm, square: hero.querySelector<HTMLElement>(".hp__sq"), glyph });
        if (dead) { s.dispose(); return; }
        scene = s;
        const apply = (p: number) => { if (rm) canvas.style.opacity = String(1 - Math.min(1, p * 1.25)); else s.setProgress(p); };
        // not the scrub() helper: it reads a trigger starting at scroll 0 (this one) as done
        st = ScrollTrigger.create({
          trigger: hero, start: "top top", end: "bottom top",
          onUpdate: (t) => apply(t.progress), onRefresh: (t) => apply(t.progress),
        });
        apply(st.progress);
        if (!rm) canvas.style.opacity = "1";
      } catch (e) {
        console.warn("[hero-private d] no scene:", e);
      }
    })();
    return () => { dead = true; ro.disconnect(); st?.kill(); scene?.dispose(); scene = null; canvas.style.opacity = "0"; };
  }, []);
  return <canvas ref={ref} style={{ display: "block", opacity: 0 }} />;
}
