"use client";
// Home v1's boot, in r17 v1's order: the world (the globe, the intro, the hero's pin, Lenis), the rail, the Stack; then the sections after it mount
// (ctx.ts whenReady). One boot per page: React's dev remount re-attaches to the running one instead of booting twice.
import { useEffect } from "react";
import { startWorld } from "./world/boot";
import { mountRail } from "./rail/motion";
import { mountStack } from "./stack/motion";
import { mountStatementWords } from "./world/words";
import { markReady, resetReady, type Dispose } from "./ctx";

type Live = { refs: number; kill: number; dispose: Dispose };
let live: Live | null = null;

export function V1Boot() {
  useEffect(() => {
    if (live) { live.refs++; window.clearTimeout(live.kill); }
    else live = start();
    const mine = live;
    return () => {
      mine.refs--;
      // a dev remount re-attaches within the same task; a real unmount does not
      mine.kill = window.setTimeout(() => { if (mine.refs > 0) return; mine.dispose(); if (live === mine) live = null; resetReady(); }, 0);
    };
  }, []);
  return null;
}

function start(): Live {
  const ac = new AbortController(), offs: Dispose[] = [];
  const html = document.documentElement;
  (async () => {
    const ctx = await startWorld(ac.signal);
    offs.push(ctx.dispose);
    if (ac.signal.aborted) return;
    // the header's action goes quiet while the hero shows: the pinned hero leaves by the transition's playhead, not by scrolling away
    const quiet = (on: boolean) => html.toggleAttribute("data-hero-in-view", on);
    if (ctx.pinned && !ctx.reduced) offs.push(ctx.progress((p) => quiet(p < 0.15)));
    else {
      const hero = document.querySelector(".hero");
      if (hero) { const io = new IntersectionObserver(([e]) => quiet(e.isIntersecting), { threshold: 0.35 }); io.observe(hero); offs.push(() => io.disconnect()); }
    }
    const words = mountStatementWords(ctx);     // opt-in (.statement[data-reveal="words"], home v5): the statement word by word, scrubbed
    if (words) offs.push(words);
    const rail = await mountRail(ctx);
    if (rail) offs.push(rail);
    if (ac.signal.aborted) return;
    offs.push(mountStack(ctx));
    markReady();
    requestAnimationFrame(() => ctx.ScrollTrigger.refresh());
  })().catch((e) => { console.error("[v1] boot", e); markReady(); });
  return {
    refs: 1, kill: 0,
    dispose: () => { ac.abort(); for (const f of offs.reverse()) { try { f(); } catch (e) { console.warn("[v1] dispose", e); } } html.removeAttribute("data-hero-in-view"); },
  };
}
