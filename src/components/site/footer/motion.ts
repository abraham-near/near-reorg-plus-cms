/* The footer takeover (desktop >= 1024 px with motion; phones and reduced motion keep the static dark block).
 *   - a trigger PULL px from the bottom of the document: on enter the dark wipe grows to one screen (.5 s power3.out), the panel (headline + columns) arrives a beat later,
 *     the wordmark hops and lands with a bounce, and the scroll is pulled to the very bottom. Scrolling up by one pixel undoes it (the wipe drops in .25 s, linear).
 *   - only when the page has at least a screen of scroll and the footer is the last thing of the document (else the static footer stays). */
import type { Mount } from "@/lib/motion/scroll";

const PULL = 100;

export const mount: Mount = (root, { gsap, ScrollTrigger: ST, reduced }) => {
  if (reduced) return;
  const html = document.documentElement;
  const wipe = root.querySelector<HTMLElement>(".ft-wipe"), panel = root.querySelector<HTMLElement>(".ft-panel");
  const parts = Array.from(root.querySelectorAll<HTMLElement>("[data-bounce]"));
  if (!wipe || !panel) return;

  const desk = matchMedia("(min-width: 1024px)");
  const set = () => html.toggleAttribute("data-ft-take", desk.matches);
  set();
  const scroller = document.scrollingElement || html;

  const tl = gsap.timeline({ paused: true });
  tl.fromTo(panel, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out" }, 0.12)
    .fromTo(parts, { y: 0 }, { y: -9, duration: 0.16, ease: "power2.out" }, 0)
    .to(parts, { y: 0, duration: 0.7, ease: "bounce.out" }, 0.16);
  tl.reverse();

  const canTake = () => {
    if (!desk.matches || ST.maxScroll(window) < innerHeight) return false;
    return html.scrollHeight - (root.getBoundingClientRect().bottom + scrollY) < 4;
  };
  /* the pull tweens a proxy, not scrollTop itself: the gsap context records callback tweens and would scroll the page back when it reverts them on unmount */
  const sp = { y: 0 };
  const pull = () => {
    const target = ST.maxScroll(window); if (Math.abs(scroller.scrollTop - target) < 2) return;
    sp.y = scroller.scrollTop;
    gsap.to(sp, { y: target, duration: 0.45, ease: "power3.out", overwrite: true, onUpdate: () => { scroller.scrollTop = sp.y; } });
  };
  const take = (on: boolean) => {
    if (on) {
      if (!canTake()) return;
      tl.play(); gsap.to(wipe, { height: innerHeight, duration: 0.5, ease: "power3.out", overwrite: "auto" }); pull();
    } else {
      gsap.killTweensOf(sp);
      tl.reverse(); gsap.to(wipe, { height: 0, duration: 0.25, ease: "none", overwrite: "auto" });
    }
  };

  const st = ST.create({
    start: () => ST.maxScroll(window) - PULL, end: () => ST.maxScroll(window),
    onEnter: () => take(true), onLeaveBack: () => take(false),
    onUpdate: (s) => { if (s.direction === -1 && !tl.reversed()) take(false); else if (s.direction === 1 && tl.reversed()) take(true); },
  });

  /* the threshold follows the document's height (late images, fonts) and the viewport */
  let lastH = html.scrollHeight, t1 = 0, t2 = 0;
  const ro = new ResizeObserver(() => {
    const h = html.scrollHeight; if (Math.abs(h - lastH) < 4) return;
    lastH = h; clearTimeout(t1); t1 = window.setTimeout(() => st.refresh(), 150);
  });
  ro.observe(html);
  const onResize = () => {
    clearTimeout(t2);
    t2 = window.setTimeout(() => {
      set();
      if (!desk.matches) { tl.progress(0).reverse(); gsap.set(wipe, { height: 0 }); }
      st.refresh();
    }, 150);
  };
  addEventListener("resize", onResize);

  return () => {
    ro.disconnect(); removeEventListener("resize", onResize);
    clearTimeout(t1); clearTimeout(t2);
    st.kill(); gsap.killTweensOf(sp);
    html.removeAttribute("data-ft-take");
  };
};
