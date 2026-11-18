"use client";
// The word after "NEAR is private" (D200): Lawrence's list, in his order, one at a time, and it rests on the last ("by design"), where the green square
// lands. Each word's letters rise in one after another and lift away the same way as the next comes (private.css). All the words share one place at
// the end of the headline's line (D201), so nothing else moves when the width changes. Screen readers get one sentence, never the cycling. Reduced motion: the last word, still.
import { useEffect, useState, type CSSProperties } from "react";

export const WORDS = ["AI", "money", "markets", "assets", "agents", "inference", "cross-chain", "execution", "by design"] as const;
const FIRST_MS = 900;   // the first word holds this long after the page shows
const STEP_MS = 1300;   // then each word, its change included

export function Cycle() {
  const [i, setI] = useState(0);
  const [run, setRun] = useState(false);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setI(WORDS.length - 1); return; }
    setRun(true);
    let n = 0, t = window.setTimeout(function tick() {
      n++; setI(n);
      if (n < WORDS.length - 1) t = window.setTimeout(tick, STEP_MS);
    }, FIRST_MS);
    return () => window.clearTimeout(t);
  }, []);
  const last = WORDS.length - 1;
  return (
    <>
      <span className="ph__cy" aria-hidden="true" data-run={run ? "" : undefined}>
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
