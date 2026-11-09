/* The intro's scroll hold (r17 v1 js/intro-hold.js): while the hero intro plays, the page scrolls freely (the pin runs, Lenis runs) but the hero's scroll transition does NOT advance.
 *
 *   mountHold(ctx, { running, skip, onDone });     // once, right after the boot (the intro may still be running)
 *     running()   true while the intro plays
 *     skip()      the intro's own skip (its end state at once + the fast reveal)
 *     onDone(cb)  cb is called once when the intro has finished or been skipped
 *
 * How: the boot's ScrollTrigger scrubs ctx.master (= the transition's timeline ctx.tl + the held rest). While we hold:
 *   - ctx.tl is PAUSED inside ctx.master. A paused child is skipped by its parent's render, so the scrub keeps moving master's playhead with the scroll but nothing of the
 *     transition renders (the globe stays the intro's, the hero copy and the statement stay at p = 0);
 *   - master's onUpdate (the boot's emit -> every ctx.progress callback) is muted, so nobody hears p > 0 (the transition's view capture does not fire during the intro).
 *   At the release: master is put back to 0 silently, tl is un-paused (it renders where it was held: 0) and emit is restored; then the transition catches up with the scroll:
 *   - the intro finished (onDone, also after Esc): master glides from 0 to the scroll's progress (power2.inOut, 0.6 - 1.2 s by distance). If the scroll moves meanwhile,
 *     ScrollTrigger's own scrub tween takes over from where the glide is (getTween().resetTo, what ScrollTrigger itself does on a scroll);
 *   - the cut (the user is scrolling the hero away): straight to the scrub tween, from 0.
 * The cut: ONLY when the hero is no longer really in view (the pin's scroll progress beyond CUT, or the page below the pin; also at mount, e.g. a restored scroll position or a
 * #hash below the hero): skip() + release at once. Wheel / touch / scroll / click never cut it; Esc calls skip() (the release then follows the intro's onDone; ESC_WAIT ms at most).
 * No intro running at mount: nothing at all. A failsafe releases after CAP ms whatever happens. */
import type { WorldCtx } from "./boot";

const CUT = 0.33;          /* the hero pin's progress beyond which the hero is leaving */
const CAP = 9000;          /* ms: never hold longer than this (the intro's own hard timeout is far shorter) */
const ESC_WAIT = 1500;     /* ms: after Esc, release by then even if onDone has not come */
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export type HoldOpts = { running: () => boolean; skip: () => void; onDone: (cb: () => void) => void };
export type Hold = { readonly held: boolean; release(): void; dispose(): void };

export function mountHold(ctx: WorldCtx, { running, skip, onDone }: HoldOpts): Hold {
  const none: Hold = { get held() { return false; }, release() {}, dispose() {} };
  const isRunning = () => { try { return !!running(); } catch { return false; } };
  const doSkip = () => { try { skip(); } catch (e) { console.warn("[intro-hold] skip failed", e); } };
  const { master, tl, gsap } = ctx;
  const st = master && master.scrollTrigger;                  /* the hero pin (ScrollTrigger sets animation.scrollTrigger) */
  if (!master || !tl || !st || ctx.reduced || !isRunning()) return none;

  /* where the scroll is in the hero pin (unclamped: > 1 below the pin); before the pin is measured, ScrollTrigger's own progress */
  const pinP = () => { const a = st.start, b = st.end; return b > a ? (st.scroll() - a) / (b - a) : st.progress || 0; };

  /* the hero is already gone (a restored scroll position, a #hash below it): the intro ends at once, nothing to hold */
  if (pinP() > CUT) { doSkip(); return none; }

  const emit = master.eventCallback("onUpdate");               /* the boot's emit (-> ctx.progress callbacks) */
  const mute = () => {};
  let held = true;
  const t0 = performance.now();

  /* a restored scroll may have moved the playhead before we came: back to the top WITH events (the transition's listeners hear p = 0 and let go) */
  if (master.totalProgress() !== 0) master.totalProgress(0);
  tl.paused(true);
  master.eventCallback("onUpdate", mute);

  let escT = 0, glide: gsap.core.Tween | null = null;
  const ac = new AbortController();
  function release(how: "done" | "cut") {
    if (!held) return;
    held = false;
    gsap.ticker.remove(watch);
    ac.abort();
    clearTimeout(escT);
    master!.totalProgress(0, true);                           /* silently: tl is still paused, nothing renders */
    tl!.paused(false);                                        /* it renders where it was held (0) */
    master!.eventCallback("onUpdate", emit || null);
    const to = clamp(pinP(), 0, 1);                           /* the trigger's progress = master's totalProgress (animation: master) */
    if (to <= 0) return;
    if (to >= 1) { master!.totalProgress(1); return; }        /* below the pin: nobody sees it, at once */
    const tw = st!.getTween && st!.getTween();
    /* the cut, or the scroll still settling (its scrub tween is live: it would fight a glide; never pause it either, ScrollTrigger would render it to its end on the
       next scroll): the scrub, re-aimed from 0 */
    if (how === "cut" || (tw && tw.isActive())) { scrubTo(to, 0); return; }
    glide = gsap.to(master!, {
      totalProgress: to, duration: clamp(0.45 + 1.5 * to, 0.6, 1.2), ease: "power2.inOut", overwrite: false,
      onUpdate() { const now = clamp(pinP(), 0, 1); if (Math.abs(now - to) > 1e-4) { this.kill(); glide = null; scrubTo(now, master!.totalProgress()); } },
      onComplete() { glide = null; },
    });
  }
  /* ScrollTrigger's scrub tween, re-aimed (from -> to): exactly what it does itself on a scroll */
  function scrubTo(to: number, from: number) {
    const tw = st!.getTween && st!.getTween();
    if (tw && tw.resetTo) tw.resetTo("totalProgress", to, from);
    else master!.totalProgress(to);
  }

  /* every tick while held: the hero leaving -> cut (the release itself comes from onDone: running() may turn false at the reveal while the world still flies) */
  function watch() {
    if (!held) return;
    if (pinP() > CUT) { doSkip(); release("cut"); return; }
    if (performance.now() - t0 > CAP) release("done");
  }
  gsap.ticker.add(watch);

  function onKey(e: KeyboardEvent) { if ((e.key === "Escape" || e.key === "Esc") && !escT) { escT = window.setTimeout(() => release("done"), ESC_WAIT); doSkip(); } }
  window.addEventListener("keydown", onKey, { capture: true, signal: ac.signal });
  ctx.signal.addEventListener("abort", () => ac.abort(), { once: true });

  try { onDone(() => release("done")); } catch (e) { console.warn("[intro-hold] onDone failed", e); }

  return {
    get held() { return held; },
    release: () => release("done"),
    dispose() { held = false; gsap.ticker.remove(watch); ac.abort(); clearTimeout(escT); if (glide) { glide.kill(); glide = null; } },
  };
}
