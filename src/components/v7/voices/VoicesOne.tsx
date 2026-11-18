"use client";
// Home v7: "What the world is saying about NEAR", one voice at a time (D190, after Figma 939:402 "Testimonials · E — Una a la vez"), on ProofDeeper's ruled grid.
// Rows: the heading and the rule under it; then the quote on show with who said it under, alone in a wide band of paper (Lawrence, D190: no list beside it,
// no bars under it, lots of room around it). D194: no count; the quote opens with a drawn quote mark hung in the margin beside the first line, in place of
// the typed marks; D195: the mark is an isometric solid like the rail's art, and comes in with each quote. The voices take turns on a clock (VOICE_MS each, round again): the
// next one rises in as the last lifts away, and its marked phrase is wiped in green, left to right. The clock starts once the quote is on the screen
// and runs only while the section is. Reduced motion: no clock, the first voice stays. The words are the shared voices' verbatim data
// (shared/voices/data.ts: Abraham's approved wording); never reword.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FEATURED, MORE, TITLE, type Voice } from "./data";
import { QM, QM_FLAT, QM_FLAT_VIEWBOX, QM_VIEWBOX } from "./qmark";
import "./voices-one.css";

const VOICES: Voice[] = [FEATURED, ...MORE];
/** how long each voice is up, its transition included (Lawrence: 1.75 s in D190, 2.25 s in D194) */
export const VOICE_MS = 2250;

/** a phrase of `text` wrapped (its first occurrence), the rest left as plain strings */
function wrap(parts: ReactNode[], phrase: string | undefined, f: (s: string) => ReactNode): ReactNode[] {
  if (!phrase) return parts;
  return parts.flatMap((p) => {
    if (typeof p !== "string") return [p];
    const i = p.indexOf(phrase);
    return i < 0 ? [p] : [p.slice(0, i), f(phrase), p.slice(i + phrase.length)].filter((s) => s !== "");
  });
}
function Words({ v }: { v: Voice }) {
  let parts: ReactNode[] = [v.text];   // the drawn mark opens it (D194), so no typed marks
  parts = wrap(parts, v.mark, (s) => <mark key="mk" className="l-vo__mk">{s}</mark>);
  parts = wrap(parts, v.nw, (s) => <span key="nw" className="l-nb">{s}</span>);
  return <p>{parts}</p>;
}

/** the opening quote mark in the rail's isometric art. D195 (option A, live; Lawrence's pick, D197): the mark standing up, extruded back, no green (D197).
    D196 (option B, kept): a slab lying flat on the floor. Each quote has its own, so it comes on and goes off with its quote, its two halves a beat apart (voices-one.css) */
const MARK: "flat" | "standing" = "standing";
function QuoteMark() {
  if (MARK === "flat") return (
    <svg className="l-vo__qm l-vo__qm--flat" viewBox={QM_FLAT_VIEWBOX} aria-hidden="true">
      {QM_FLAT.map((m, i) => (
        <g key={i} className="l-vo__qmg">
          <path className="l-vo__qm-l" d={m.left} /><path className="l-vo__qm-r" d={m.right} />
          <path className="l-vo__qm-ln" d={m.bottom} /><path className="l-vo__qm-ln" d={m.sil} />
          <path className="l-vo__qm-f" d={m.top} />
        </g>
      ))}
    </svg>
  );
  return (
    <svg className="l-vo__qm" viewBox={QM_VIEWBOX} aria-hidden="true">
      {QM.map((m, i) => (
        <g key={i} className="l-vo__qmg">
          <path className="l-vo__qm-t" d={m.top} /><path className="l-vo__qm-l" d={m.left} /><path className="l-vo__qm-r" d={m.right} />
          <path className="l-vo__qm-ln" d={m.back} /><path className="l-vo__qm-ln" d={m.sil} />
          <path className="l-vo__qm-f" d={m.front} />
        </g>
      ))}
    </svg>
  );
}

export function VoicesOne() {
  const ref = useRef<HTMLElement>(null);
  const n = VOICES.length;
  // cur: the voice on; prev: the one lifting away
  const [{ cur, prev }, set] = useState({ cur: 0, prev: -1 });
  /* the clock: it starts once the quote can be read (data-seen) and runs while any of the section is on the screen and the tab is shown; a frame-to-frame
     step is capped, so a stall never skips a voice */
  useEffect(() => {
    const sec = ref.current; if (!sec) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    sec.setAttribute("data-clock", "");
    let ready = false, seen = false, raf = 0, t = 0, last = 0;
    const loop = (now: number) => {
      raf = seen ? requestAnimationFrame(loop) : 0;
      const dt = Math.min(64, now - last); last = now;
      if (!ready || document.hidden) return;
      t += dt;
      if (t >= VOICE_MS) { t = 0; set((s) => ({ cur: (s.cur + 1) % n, prev: s.cur })); }
    };
    const start = () => { if (seen && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };
    const stage = sec.querySelector(".l-vo__stage");
    const rio = new IntersectionObserver(([e]) => { if (e.isIntersecting) { ready = true; rio.disconnect(); sec.setAttribute("data-seen", ""); } }, { threshold: 0.9 });
    if (stage) rio.observe(stage);
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; start(); });
    io.observe(sec);
    return () => { rio.disconnect(); io.disconnect(); cancelAnimationFrame(raf); ["data-clock", "data-seen"].forEach((a) => sec.removeAttribute(a)); };
  }, [n]);

  return (
    <section ref={ref} className="l-sec l-vo" id="voices" aria-labelledby="l-voices-t" data-on={cur}>
      <div className="l-row l-head" data-row="">
        <div className="l-cell l-head__cell l-vo__head">
          <h2 id="l-voices-t" className="l-h2 l-vo__h" data-rv="">{TITLE}</h2>
        </div>
      </div>
      <div className="l-row l-vo__row" data-row="">
        <div className="l-cell l-vo__stage" data-rv="">
          {VOICES.map((v, i) => (
            <figure key={v.id} className="l-vo__q" data-on={i === cur ? "" : undefined} data-out={i === prev && i !== cur ? "" : undefined} aria-hidden={i === cur ? undefined : "true"}>
              <QuoteMark />
              <blockquote><Words v={v} /></blockquote>
              <figcaption className="l-vo__by"><span className="l-vo__byn">{v.name}</span>{v.role && <span className="l-vo__byr">{v.role}</span>}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
