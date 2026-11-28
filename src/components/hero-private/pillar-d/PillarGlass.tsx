"use client";
// Hero study "Pillar D", privacy through glass: the pillar in three.js (./scene.ts; geometry ./pillar.ts; look ./fx.ts; the data and its diffusion
// ./glass.ts). Below the frame the column is the public chain (legible data rising), inside the frame three panes stack up round the core (clear,
// frosted, deep frosted), above it the column is frosted glass carrying only green light. Like C (../pillar-c/PillarFx.tsx), its canvas covers the
// whole hero (.hp), not just .hp__art, so no piece is ever clipped in the exit: a wrapper inside .hp__art pushed out to the hero's edges (the scene
// sets its offsets as it measures). The scene's code (with three.js) is its own chunk, fetched as soon as this module loads (in parallel with
// hydration); nothing shows until its first frame. Its scroll: one trigger on the hero, "top top" → "bottom top", progress 0..1 into the scene.
// The glyphs: `?glyph=hex` (legible hex words, bits, chained blocks) or `?glyph=abstract` (dashes and ticks, no characters; the default here).
// No WebGL: nothing is drawn and the hero stays clean.
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReduced } from "@/lib/motion/scroll";

gsap.registerPlugin(ScrollTrigger);
const load = typeof window !== "undefined" ? import("./scene") : null;
load?.catch(() => {});

export function PillarGlass() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current, wrap = canvas?.parentElement, art = wrap?.parentElement, hp = canvas?.closest<HTMLElement>(".hp");
    if (!canvas || !wrap || !art || !hp || !load) return;
    let dead = false, st: ScrollTrigger | null = null;
    let scene: { setProgress(p: number): void; dispose(): void } | null = null;
    const glyph = new URLSearchParams(location.search).get("glyph") === "hex" ? "hex" : "abstract";
    (async () => {
      try {
        const mod = await load;
        if (dead) return;
        scene = mod.mount(canvas, { hp, art, wrap, sq: hp.querySelector<HTMLElement>(".hp__sq") }, { reduced: prefersReduced(), glyph });
        const s = scene;
        // not the scrub() helper: it reads a trigger starting at scroll 0 (this one) as done
        st = ScrollTrigger.create({
          trigger: hp, start: "top top", end: "bottom top",
          onUpdate: (q) => s.setProgress(q.progress), onRefresh: (q) => s.setProgress(q.progress),
        });
        s.setProgress(st.progress);
      } catch (e) {
        console.warn("[hero-private pillar-d] no scene:", e);   // no WebGL: the hero stays without its drawing
      }
    })();
    return () => { dead = true; st?.kill(); scene?.dispose(); scene = null; canvas.style.opacity = "0"; };
  }, []);
  return (
    <div style={{ position: "absolute", pointerEvents: "none", left: 0, top: 0, width: "100%", height: "100%" }}>
      <canvas ref={ref} style={{ display: "block", width: "100%", height: "100%", opacity: 0 }} />
    </div>
  );
}
