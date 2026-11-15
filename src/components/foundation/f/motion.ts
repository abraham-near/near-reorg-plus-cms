// Foundation F's motion (markup: FoundationF.tsx). The homepage's ruled grid (rows and crosshairs draw in, [data-rv] text rises) plus:
//   · the hero: on arrival its three lines rise one after another, then the lede and the buttons; scrolled away, the photo drifts down and grows a
//     little while the copy lifts and fades (parallax), so the page slides over it;
//   · the mission (desktop): the green band holds the screen; "Our goal is to make / ourselves smaller." starts the width of the screen and shrinks to
//     the left (the accent word a little more), the devolution text arrives on the right sentence by sentence, the MISSION label last; then it scrolls on;
//   · transparency: the Zug photo moves inside its cell as the row passes (parallax).
// Reduced motion: everything in its final place, still.
import type { Mount, MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const f = (n: number) => n.toFixed(3);

/* the hero: arrival, then the parallax as you leave it */
function mountHero(root: HTMLElement, { gsap, ScrollTrigger, reduced }: MotionCtx) {
  const hero = root.querySelector<HTMLElement>(".ff-hero"); if (!hero || reduced) return;
  const img = hero.querySelector<HTMLElement>(".ff-hero__img")!, copy = hero.querySelector<HTMLElement>(".ff-hero__in")!;
  const lines = Array.from(hero.querySelectorAll<HTMLElement>(".ff-l")), after = Array.from(hero.querySelectorAll<HTMLElement>(".ff-eyebrow, .ff-lede, .ff-ctas"));
  const tl = gsap.timeline({ delay: 0.1 });
  tl.from(img, { scale: 1.08, opacity: 0, duration: 1.6, ease: "power2.out" }, 0)
    .from(lines, { yPercent: 60, opacity: 0, duration: 1.1, ease: "power4.out", stagger: 0.09 }, 0.15)
    .from(after, { y: 18, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.1 }, 0.45);
  const st = ScrollTrigger.create({
    trigger: hero, start: "top top", end: "bottom top", scrub: 0.4,
    onUpdate: (s) => {
      const p = s.progress;
      img.style.transform = `translate3d(0, ${(p * 140).toFixed(1)}px, 0) scale(${f(1 + p * 0.08)})`;
      copy.style.transform = `translate3d(0, ${(-p * 70).toFixed(1)}px, 0)`;
      copy.style.opacity = f(1 - p * 0.9);
    },
  });
  return () => { tl.kill(); st.kill(); [img, copy, ...lines, ...after].forEach((el) => el.removeAttribute("style")); };
}

/* the mission: two lines that shrink to the left while the text arrives (desktop) */
function mountSmall(root: HTMLElement, { reduced, ScrollTrigger }: MotionCtx) {
  const sec = root.querySelector<HTMLElement>(".ff-mission");
  if (!sec || reduced || !matchMedia("(min-width: 1024px)").matches) return;
  const stage = sec.querySelector<HTMLElement>(".ff-mission__stage")!, h = sec.querySelector<HTMLElement>(".ff-mission__h")!;
  const right = sec.querySelector<HTMLElement>(".ff-mission__r")!, k = sec.querySelector<HTMLElement>(".ff-mission__k")!;
  const acc = sec.querySelector<HTMLElement>(".ff-mission__acc")!, sns = Array.from(sec.querySelectorAll<HTMLElement>(".ff-sn"));
  sec.classList.add("is-scene");
  let vh = innerHeight, big = 1, target = 0.5, H = 1;
  const measure = () => {
    vh = stage.clientHeight; h.style.transform = ""; h.style.letterSpacing = "";
    big = parseFloat(getComputedStyle(h).fontSize); H = h.offsetHeight;
    // it settles at the Figma page's size (80 px), and never past the text column on the right
    const room = right.getBoundingClientRect().left - stage.getBoundingClientRect().left - 72;
    target = Math.min(80 / big, room / Math.max(1, h.scrollWidth));
  };
  const apply = (p: number) => {
    const e = ease(seg(p, 0.06, 0.5)), s = 1 + (target - 1) * e;
    h.style.letterSpacing = `${f(-0.03 + 0.01 * e)}em`;
    h.style.transform = `translate3d(0, ${((vh - H * s) / 2).toFixed(1)}px, 0) scale(${f(s)})`;
    acc.style.transform = `scale(${f(1 - 0.1 * e)})`;
    sns.forEach((el, i) => { el.style.opacity = f(seg(p, 0.36 + i * 0.07, 0.46 + i * 0.07)); });
    k.style.opacity = f(seg(p, 0.42, 0.55));
    k.style.transform = `translate3d(0, ${((vh - H * s) / 2 - 44).toFixed(1)}px, 0)`;
  };
  const st = ScrollTrigger.create({ trigger: sec, start: "top top", end: "bottom bottom", onUpdate: (s) => apply(s.progress), onRefreshInit: measure, onRefresh: (s) => apply(s.progress) });
  measure(); apply(0);
  return () => { st.kill(); sec.classList.remove("is-scene"); [h, acc, k, ...sns].forEach((el) => el.removeAttribute("style")); };
}

/* transparency: Zug moves inside its cell */
function mountParallax(root: HTMLElement, { ScrollTrigger, reduced }: MotionCtx) {
  const cell = root.querySelector<HTMLElement>(".ff-tr__ph"), img = cell?.querySelector<HTMLElement>(".l-img");
  if (!cell || !img || reduced) return;
  img.style.scale = "1.14";
  const st = ScrollTrigger.create({ trigger: cell, start: "top bottom", end: "bottom top", scrub: 0.3,
    onUpdate: (s) => { img.style.translate = `0 ${((s.progress - 0.5) * 10).toFixed(2)}%`; } });
  return () => { st.kill(); img.style.scale = ""; img.style.translate = ""; };
}

export const mountAll: Mount = (root, ctx) => {
  const offs = [gridMount(root, ctx), mountHero(root, ctx), mountSmall(root, ctx), mountParallax(root, ctx)];
  return () => offs.forEach((o) => { if (typeof o === "function") o(); });
};
