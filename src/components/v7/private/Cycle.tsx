"use client";
// The word after "NEAR is private" (D200): Lawrence's list, in his order, one at a time, and it rests on the last ("by design"), where the green square
// lands. Each word's letters rise in one after another and lift away the same way as the next comes (private.css). All the words share one place at
// the end of the headline's line (D201), so nothing else moves when the width changes. Screen readers get one sentence, never the cycling. Reduced motion: the last word, still.
// It plays again whenever the hero comes back on screen after leaving it (D229, D235).
import { useEffect, useRef, useState, type CSSProperties } from "react";

export const WORDS = ["AI", "money", "markets", "assets", "agents", "inference", "cross-chain", "execution", "by design"] as const;
// D235: 10% faster than D200's 900 and 1300 (Lawrence, D228); the letters' change in private.css is quicker by the same share
const FIRST_MS = 810;   // the first word holds this long after the page shows
const STEP_MS = 1170;   // then each word, its change included

/** onStep: told the word's place in WORDS each time it changes (the hero studies' pictures keep step with it, D224); firstMs: another first hold */
export function Cycle({ onStep, firstMs = FIRST_MS }: { onStep?: (i: number) => void; firstMs?: number } = {}) {
  const [i, setI] = useState(0);
  const [run, setRun] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setI(WORDS.length - 1); return; }
    setRun(true);
    /* D229, D235 (Lawrence: "when we scroll off the hero and then back, the hero animation should reset"): once the hero has left the screen whole, the
       cycle goes back to the first word; it plays again from there when a third of the hero is back in view. A small scroll does not restart it */
    let n = 0, t = 0, playing = false;
    const stop = () => { window.clearTimeout(t); playing = false; n = 0; setI(0); };
    const start = () => {
      if (playing) return;
      playing = true;
      t = window.setTimeout(function tick() { n++; setI(n); if (n < WORDS.length - 1) t = window.setTimeout(tick, STEP_MS); }, firstMs);
    };
    const hero = ref.current?.closest("section");
    if (!hero || typeof IntersectionObserver === "undefined") { start(); return () => window.clearTimeout(t); }
    const io = new IntersectionObserver(([e]) => { if (!e.isIntersecting) stop(); else if (e.intersectionRatio >= 0.33) start(); }, { threshold: [0, 0.33] });
    io.observe(hero);
    return () => { io.disconnect(); window.clearTimeout(t); };
  }, [firstMs]);
  useEffect(() => { onStep?.(i); }, [i, onStep]);
  const last = WORDS.length - 1;
  return (
    <>
      <span className="ph__cy" aria-hidden="true" data-run={run ? "" : undefined} ref={ref}>
        {WORDS.map((w, k) => (
          <span key={w} className="ph__w" data-on={k === i ? "" : undefined} data-out={k === i - 1 ? "" : undefined} data-last={k === last ? "" : undefined}>
            {[...w].map((c, j) => <span key={j} className="ph__c" style={{ "--j": j } as CSSProperties}>{c === " " ? " " : c}</span>)}
            {k === last && <span className="ph__sq" />}
          </span>
        ))}
      </span>
      <span className="sr-only">by design.</span>
    </>
  );
}
