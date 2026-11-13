// The statement, word by word (opt-in: .statement[data-reveal="words"], home v5). Instead of the whole statement fading in on view (boot.ts fallbackFade, the page
// without the globe) or its words dissolving in from the globe's dots (transition.ts), each word rises into place from below as it fades in, one after another in reading
// order, the N tile first; the green marker wipes in after the last word. Scrubbed by the scroll (a pure function of the progress, reversible), as the section comes up
// into the view. The words are split.ts's (.st__wi inside .st__w); the page's styles for it: v5/statement-v5.css.
// Reduced motion / no statement / not opted in: nothing (the page's own behaviour stays).
import type { V1Ctx, Dispose } from "../ctx";

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const s01 = (t: number) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const out3 = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const SF = 0.62;      /* the share of the run over which the words' starts are spread (each word takes the rest) */
const WY = 0.45;      /* the rise, in em of the word */
const MARK: [number, number] = [0.86, 1];   /* the marker's wipe, in the run's progress */

export function mountStatementWords(ctx: V1Ctx): Dispose | null {
  const sec = document.querySelector<HTMLElement>('.statement[data-reveal="words"]');
  if (!sec || ctx.reduced || document.documentElement.hasAttribute("data-rm")) return null;
  const tile = sec.querySelector<HTMLElement>(".statement__tile");
  const els = [...(tile ? [tile] : []), ...sec.querySelectorAll<HTMLElement>(".st__wi")];
  if (!els.length) return null;
  const mark = sec.querySelector<HTMLElement>(".st__mark");
  sec.classList.add("is-words");
  const n = els.length, run = MARK[0], d = 1 - SF, kc = new Int32Array(n).fill(-1);
  let lastMark = "";
  const apply = (p: number) => {
    const q = p / run;   /* the words take the run up to the marker */
    for (let i = 0; i < n; i++) {
      const a = clamp((q - (SF * i) / (n - 1)) / d, 0, 1), key = Math.round(a * 400);
      if (kc[i] === key) continue; kc[i] = key;
      const el = els[i];
      if (a >= 1) { el.style.transform = ""; el.style.opacity = ""; el.style.visibility = ""; continue; }
      if (a <= 0) { el.style.visibility = "hidden"; continue; }
      el.style.visibility = ""; el.style.transform = `translate3d(0,${((1 - out3(a)) * WY).toFixed(3)}em,0)`; el.style.opacity = s01(a * 1.2).toFixed(3);
    }
    if (mark) { const m = s01((p - MARK[0]) / (MARK[1] - MARK[0])).toFixed(3); if (m !== lastMark) { lastMark = m; mark.style.setProperty("--mark", m); } }
  };
  const P = { p: 0 };
  const tl = ctx.gsap.timeline({ paused: true }).to(P, { p: 1, duration: 1, ease: "none" });
  tl.eventCallback("onUpdate", () => apply(P.p));
  /* from the section's top at 85 % of the view to 12 %: the statement (centred in its screen-tall section) is whole as it reaches the middle */
  const st = ctx.ScrollTrigger.create({ trigger: sec, start: "top 85%", end: "top 12%", scrub: 0.8, animation: tl, invalidateOnRefresh: true });
  apply(0);
  return () => {
    st.kill(); tl.kill();
    for (const el of els) { el.style.transform = ""; el.style.opacity = ""; el.style.visibility = ""; }
    mark?.style.removeProperty("--mark");
    sec.classList.remove("is-words");
  };
}
