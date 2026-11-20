// Protocol A's motion. The homepage's ruled grid does the arrivals (../../v3/proof-deeper/motion.ts: rows draw in, [data-rv] rises, the proof strip's
// green rule and figures, the dot icons); on top of it:
//   - the h1 rises word by word on load, each h2 ([data-split]) as it comes in (SplitText, no masks: the Kepler word's overhang is never clipped);
//   - the hero drawing (HeroArt) builds as the page opens: the floor, the plate, the shards chunk by chunk from the bottom, the chain, the account and
//     its key. Then the three steps of "Built for AI scale": (1) a shard takes two more chunks up to its state threshold, its top lifts away and it
//     splits in two halves that part; (2) the private shard rises at the near end, its one row disclosed in green; (3) the account's key turns to a
//     quantum-safe one (ML-DSA). Desktop (≥ 1024 × 640): the stage pins for about three screens and the scroll scrubs them, the hero copy handing over
//     to Built for AI scale, each property lit as the drawing plays it. Smaller: no pin; the steps play once, after the build.
//     Then, only while the drawing is near the view, a quiet loop: transactions drop into the shards, the chain's blocks light one after another
//     (600 ms), the new key's halo breathes;
//   - the section drawings (live.ts).
// Reduced motion: no split, no build, no pin, no loop: the finished frame (the markup's), the hero copy and Built for AI scale one after the other.
import { SplitText } from "gsap/SplitText";
import type { MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";
import { whileNear } from "./kit";
import { HERO_GEO } from "./HeroArt";
import { mountArts } from "./live";

/** the stage pins only here (the CSS lays the stage out for it under the same query: protocol-a.css) */
export const PIN_Q = "(min-width: 1024px) and (min-height: 640px)";

type G = MotionCtx["gsap"];
type TL = ReturnType<G["timeline"]>;

function hero(root: HTMLElement, { gsap }: MotionCtx) {
  const stage = root.querySelector<HTMLElement>(".pa-stage"), art = stage?.querySelector<HTMLElement>(".pa-hero__art"), svg = art?.querySelector<SVGSVGElement>("svg.pa-iso");
  if (!stage || !art || !svg) return () => {};
  const q = <T extends Element = SVGElement>(s: string, el: ParentNode = svg) => [...el.querySelectorAll<T>(s)];
  const lab = (k: string) => q(`.pa-lab[data-k='${k}']`);
  const mm = gsap.matchMedia();

  mm.add({ pin: PIN_Q, flow: `not all and ${PIN_Q}` }, (c) => {
    const pin = !!c.conditions?.pin;
    svg.dataset.state = "live";

    /* ── the starting state: the four shards, no split, no private shard, the old key ── */
    const floor = q(".pa-floor"), plate = q(".pa-plate"), chunks = q(".pa-sh .pa-c, .pa-whole .pa-c.pa-bd"), chain = q(".pa-chain .pa-blk");
    const acct = q(".pa-acct > .pa-b"), teth = q(".pa-teth"), oldKey = q(".pa-key--o"), drops = q(".pa-drop");
    const xtra = q(".pa-xtra .pa-c"), lift = q(".pa-lift"), whole = q(".pa-whole"), thr = q(".pa-thr"), ha = q(".pa-half--a"), hb = q(".pa-half--b");
    const priv = q(".pa-priv"), win = q(".pa-priv__win"), kOld = q(".pa-key--o .pa-key__in"), kNew = q(".pa-key--q .pa-key__in"), halo = q(".pa-halo");
    gsap.set(floor, { opacity: 0 }); gsap.set(plate, { opacity: 0, y: 26 }); gsap.set(chunks, { opacity: 0, y: -46 }); gsap.set(chain, { opacity: 0, y: -12 });
    gsap.set(acct, { opacity: 0, y: -24 }); gsap.set([teth, oldKey], { opacity: 0 }); gsap.set(drops, { opacity: 0 });
    gsap.set(xtra, { opacity: 0, y: -60 }); gsap.set(thr, { opacity: 0 }); gsap.set([ha, hb], { opacity: 0 });
    gsap.set(ha, { x: HERO_GEO.SPLIT_OFF.a[0], y: HERO_GEO.SPLIT_OFF.a[1] }); gsap.set(hb, { x: HERO_GEO.SPLIT_OFF.b[0], y: HERO_GEO.SPLIT_OFF.b[1] });
    gsap.set(priv, { opacity: 0, y: 40 }); gsap.set(win, { scaleY: 0, transformOrigin: "50% 50%" });
    gsap.set(kNew, { scaleX: 0, transformOrigin: "50% 50%" }); gsap.set(halo, { opacity: 0 });
    gsap.set(q(".pa-lab"), { opacity: 0 });
    art.classList.add("is-ready");   // every starting state is set: the CSS gate lets the drawing show

    /* ── the build, on load ── */
    const build = gsap.timeline({ delay: 0.3 })
      .to(floor, { opacity: 1, duration: 0.9, ease: "power2.out" }, 0)
      .to(plate, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, 0.1)
      .to(chunks, { opacity: 1, y: 0, duration: 0.55, ease: "back.out(1.5)", stagger: 0.05 }, 0.45)
      .to(chain, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.025 }, 1.0)
      .to(acct, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.6)" }, 1.25)
      .to([teth, oldKey], { opacity: 1, duration: 0.5, ease: "power2.out" }, 1.55);

    /* ── the three steps (Built for AI scale), from `o` on the timeline ── */
    const T = { split: 0, priv: 2.8, key: 4.5, end: 5.6 };
    const steps = (tl: TL, o: number) => {
      tl.to(thr, { opacity: 1, duration: 0.4 }, o)
        .to(lab("thr"), { opacity: 1, duration: 0.3 }, o + 0.3)
        .to(xtra, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.3 }, o + 0.3)
        .to(lift, { y: -34, opacity: 0, duration: 0.5, ease: "power2.in" }, o + 1.3)
        .to([thr, lab("thr")], { opacity: 0, duration: 0.3 }, o + 1.5)
        .set(whole, { opacity: 0 }, o + 1.8).set([ha, hb], { opacity: 1 }, o + 1.8)
        .to([ha, hb], { x: 0, y: 0, duration: 0.6, ease: "power3.out" }, o + 1.85)
        .to(lab("split"), { opacity: 1, duration: 0.3 }, o + 2.2)
        .to(priv, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, o + T.priv)
        .to(win, { scaleY: 1, duration: 0.35, ease: "power2.out" }, o + T.priv + 0.7)
        .to(lab("priv"), { opacity: 1, duration: 0.3 }, o + T.priv + 0.8)
        .to(kOld, { scaleX: 0, duration: 0.3, ease: "power2.in" }, o + T.key)
        .to(kNew, { scaleX: 1, duration: 0.4, ease: "back.out(2)" }, o + T.key + 0.3)
        .to(halo, { opacity: 0.5, duration: 0.3 }, o + T.key + 0.45)
        .to(lab("key"), { opacity: 1, duration: 0.3 }, o + T.key + 0.6);
      return tl;
    };

    let play: TL | null = null;
    if (pin) {
      /* the stage pins; the hero copy hands over to Built for AI scale; each property lights as the drawing plays it */
      const copy = stage.querySelector(".pa-hero__copy"), scale = stage.querySelector(".pa-scale"), items = [...stage.querySelectorAll<HTMLElement>(".pa-step")];
      const bars = items.map((it) => it.querySelector(".pa-step__bar"));
      gsap.set(items, { opacity: 0.3 }); gsap.set(bars, { scaleX: 0, transformOrigin: "0 50%" });
      const O = 1.6;
      const tl = gsap.timeline({ scrollTrigger: { trigger: stage, start: "top top", end: () => "+=" + Math.round(innerHeight * 3.2), pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true } });
      tl.to(copy, { opacity: 0, y: -48, duration: 0.8, ease: "power2.in" }, 0.2)
        .fromTo(scale, { opacity: 0, y: 48 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, 0.9);
      [T.split, T.priv, T.key].forEach((t, i) => {
        if (i) tl.to(items[i - 1], { opacity: 0.3, duration: 0.3 }, O + t);
        tl.to(items[i], { opacity: 1, duration: 0.3 }, O + t).to(bars[i], { scaleX: 1, duration: 0.6, ease: "none" }, O + t);
      });
      steps(tl, O);
      tl.to({}, { duration: 0.8 });   // a beat at the end, all three told
    } else {
      play = steps(gsap.timeline({ paused: true }), 0);
      build.eventCallback("onComplete", () => { play?.play(); });
    }

    /* ── the quiet loop, near the view, once built: drops fall into shards 1, 2 and 4; the chain lights block by block; the halo breathes ── */
    const blkTops = chain.map((b) => b.querySelector(".pa-t"));
    let lit = -1;
    const off = whileNear(gsap, art, (t) => {
      if (build.progress() < 1) return;
      drops.forEach((d, i) => {
        const u = ((t + i * 0.9) % 2.7) / 2.7;
        const fall = Math.min(1, u / 0.3), land = u > 0.3 ? Math.min(1, (u - 0.3) / 0.12) : 0;
        gsap.set(d, { y: -HERO_GEO.DROP * (1 - fall * fall), opacity: u < 0.3 ? Math.min(1, u / 0.06) : 1 - land });
      });
      const k = Math.floor(t / 0.6) % blkTops.length;
      if (k !== lit) { blkTops[lit]?.classList.remove("is-lit"); lit = k; blkTops[k]?.classList.add("is-lit"); }
      const kp = pin || !play ? 1 : play.progress();
      if (kp >= 1 && Number(gsap.getProperty(kNew[0], "scaleX")) > 0.99) gsap.set(halo, { opacity: 0.3 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.5)) });
    });

    return () => {
      off(); play?.kill(); blkTops.forEach((b) => b?.classList.remove("is-lit"));
      art.classList.remove("is-ready"); svg.dataset.state = "final";
    };
  });
  return () => mm.revert();
}

export function mount(root: HTMLElement, ctx: MotionCtx) {
  const { reduced, gsap } = ctx;
  const grid = gridMount(root, ctx);
  let dead = false;
  const splits: SplitText[] = [], offs: (() => void)[] = [];

  if (!reduced) {
    gsap.registerPlugin(SplitText);
    const h1 = root.querySelector<HTMLElement>("[data-h1]");
    if (h1) {
      const s = SplitText.create(h1, { type: "words", wordsClass: "pa-w" }); splits.push(s);
      gsap.from(s.words, { yPercent: 40, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.07, delay: 0.1 });
    }
    root.querySelectorAll<HTMLElement>("[data-split]").forEach((h) => {
      const s = SplitText.create(h, { type: "words", wordsClass: "pa-w" }); splits.push(s);
      gsap.from(s.words, { yPercent: 40, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: h, start: "top 92%", once: true } });
    });
    root.querySelectorAll<HTMLElement>("[data-in]").forEach((el, i) => {
      el.style.setProperty("--d", `${(0.35 + i * 0.12).toFixed(2)}s`);
      requestAnimationFrame(() => requestAnimationFrame(() => { if (!dead) el.classList.add("is-in"); }));
    });
    offs.push(hero(root, ctx));
    offs.push(mountArts(root, ctx));
  }

  return () => {
    dead = true; splits.forEach((s) => s.revert()); offs.forEach((o) => o());
    root.querySelectorAll("[data-in]").forEach((el) => el.classList.remove("is-in"));
    if (typeof grid === "function") grid();
  };
}
