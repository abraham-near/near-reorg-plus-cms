// Protocol A's section drawings in motion (Arts.tsx). Each builds once as it arrives (kit.ts buildTimeline: the floor, the faces, the pieces, the
// labels), then its own loop runs, only while it is near the view (kit.ts whileNear):
//   ns · consensus lifts off execution as the band passes (scrubbed), state witnesses climb from each shard to it, an atomic call arcs between two;
//   rs · the glass shard fills to its threshold, the check lands, it splits in two halves that part; then again;
//   sp · a block every 600 ms slides in, the one 1.2 s old turns final (green), the height counts;
//   pv · the disclosed row moves from one transaction to another, the auditor's line of sight follows it;
//   qt · once: the old key lifts out, the quantum-safe one sets in; then its halo breathes;
//   cs · a signature runs from the account to each chain in turn and its plinth lights; the MPC nodes turn;
//   ag · signals pass between the enclaves.
// Reduced motion: none of it (the markup is the finished frame).
import type { MotionCtx } from "@/lib/motion/scroll";
import { P, along, box, ease3, f, faces, lerp, seg, tr, wireAll, buildTimeline, whileNear, type B6 } from "./kit";
import { AG_ARCS, CS_ARCS, NS, NS_WIT, PV, RS, SP, rsFill, rsGlass } from "./Arts";

type G = MotionCtx["gsap"];
const $ = <T extends Element = SVGElement>(el: ParentNode, s: string) => el.querySelector<T>(s);
const $$ = <T extends Element = SVGElement>(el: ParentNode, s: string) => [...el.querySelectorAll<T>(s)];

/** redraw a box (Blk) or a glass box (Glass) in place */
function setBlk(g: Element | null, b: B6) {
  if (!g) return;
  const fc = faces(box(...b));
  g.querySelector(".pa-l")?.setAttribute("points", fc.left); g.querySelector(".pa-r")?.setAttribute("points", fc.right); g.querySelector(".pa-t")?.setAttribute("points", fc.top);
}
function setGlass(g: Element | null, b: B6) {
  if (!g) return;
  const bx = box(...b), fc = faces(bx), w = wireAll(bx);
  g.querySelector(".pa-gl__l")?.setAttribute("points", fc.left); g.querySelector(".pa-gl__r")?.setAttribute("points", fc.right); g.querySelector(".pa-gl__t")?.setAttribute("points", fc.top);
  g.querySelector(".pa-gl__h")?.setAttribute("d", w.slice(w.indexOf("M", 1)));
}
const op = (el: Element | null | undefined, v: number) => { if (el) (el as SVGElement).style.opacity = f(v); };
const sinU = (u: number) => Math.sin(Math.PI * Math.min(1, Math.max(0, u)));

/* ── the loops, by scene: each gets the svg and returns its tick (t in seconds since the loop began) ── */
const LOOPS: Record<string, (svg: SVGSVGElement, gsap: G) => (t: number) => void> = {
  ns(svg, gsap) {
    const cons = $(svg, ".ns-cons"), dots = $$<SVGCircleElement>(svg, ".ns-wd");
    return (t) => {
      const lift = Number(gsap.getProperty(cons, "y")) || 0;   // the consensus layer's offset (scrubbed): the witnesses stop under it
      dots.forEach((d, i) => {
        const w = NS_WIT[i], u = (t * 0.45 + i * 0.31) % 1;
        d.setAttribute("cx", f(lerp(w.a[0], w.b[0], u))); d.setAttribute("cy", f(lerp(w.a[1], w.b[1] + lift, u)));
        op(d, sinU(u));
      });
    };
  },
  rs(svg) {
    const W = $(svg, ".rs-w"), A = $(svg, ".rs-a"), B = $(svg, ".rs-b"), thr = $(svg, ".rs-thr"), ok = $(svg, ".rs-ok");
    const y0a = RS.y, y0b = RS.y + RS.d - RS.hd, half = RS.thr / 2, PER = 6.6;
    return (t) => {
      const u = t % PER;
      const grow = seg(u, 0, 3.4), split = seg(u, 3.9, 4.6), back = seg(u, 6, PER);
      const whole = u < 3.9 ? 1 : back, halves = u < 3.9 ? 0 : 1 - back;
      op(W, whole); op(A, halves); op(B, halves);
      if (whole > 0) { const z = u < 3.9 ? lerp(RS.fill0, RS.thr, ease3(grow)) : RS.fill0; setBlk(W?.querySelector(".rs-fill") ?? null, rsFill(RS.y, RS.d, z)); }
      if (halves > 0) {
        const e = ease3(split), ya = lerp(y0a, RS.ay, e), yb = lerp(y0b, RS.by, e);
        setBlk(A?.querySelector(".rs-fill") ?? null, rsFill(ya, RS.hd, half)); setGlass(A?.querySelector(".pa-gl") ?? null, rsGlass(ya, RS.hd));
        setBlk(B?.querySelector(".rs-fill") ?? null, rsFill(yb, RS.hd, half)); setGlass(B?.querySelector(".pa-gl") ?? null, rsGlass(yb, RS.hd));
      }
      thr?.classList.toggle("is-hot", u > 3.1 && u < 4.4);
      op(ok, u < 3.4 ? 0 : u < 6 ? seg(u, 3.4, 3.7) : 1 - back);
    };
  },
  sp(svg) {
    const bs = $$<SVGGElement>(svg, ".sp-b"), txt = bs.map((b) => b.querySelector("text")), num = $(svg, ".sp-h__n");
    let last = -1;
    return (t) => {
      const k = Math.floor(t / 0.6), ph = t - k * 0.6, h = SP.h0 + k;
      if (k !== last) {
        last = k;
        txt.forEach((tx, i) => { if (tx) tx.textContent = String((h - i) % 1000).padStart(3, "0"); });
        if (num) num.textContent = "#" + h.toLocaleString("en-US");
      }
      const off = SP.pitch * (1 - ease3(Math.min(1, ph / 0.34)));
      bs.forEach((b, i) => {
        b.setAttribute("transform", `translate(${f(SP.right - SP.size - i * SP.pitch + off)} ${SP.y})`);
        if (i === 0) op(b, Math.min(1, ph / 0.22)); else if (i === SP.n) op(b, 1 - Math.min(1, ph / 0.3)); else op(b, 1);
      });
    };
  },
  pv(svg) {
    const open = $(svg, ".pv-open"), look = $(svg, ".pv-look"), order = [2, 0, 3, 1, 4], z = PV.b[5], eye = P(PV.aud[0], PV.aud[1], 21);
    return (t) => {
      const per = 2.8, k = Math.floor(t / per), u = seg(t - k * per, 0, 0.6), e = ease3(u);
      const from = PV.rows[order[k % order.length]], to = PV.rows[order[(k + 1) % order.length]], b = lerp(from, to, e);
      open?.setAttribute("transform", `translate(0 ${f(b)})`);
      const r = P(75, b + 4, z);
      look?.setAttribute("d", `M${f(eye[0])},${f(eye[1])}L${f(r[0])},${f(r[1])}`);
    };
  },
  qt(svg) {
    const halo = $(svg, ".pa-halo"), lat = $$(svg, ".qt-new .pa-key__lat circle");
    return (t) => {
      op(halo, 0.25 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.6)));
      lat.forEach((c, i) => op(c, 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.4 + i * 0.9))));
    };
  },
  cs(svg) {
    const sigs = $$<SVGCircleElement>(svg, ".cs-sig"), flash = $$(svg, ".cs-flash"), nodes = $$<SVGCircleElement>(svg, ".cs-mpc__n");
    const PER = CS_ARCS.length * 0.95 + 0.8;
    return (t) => {
      const u0 = t % PER;
      CS_ARCS.forEach((a, j) => {
        const u = (u0 - j * 0.95) / 0.8, p = along(a.ps, ease3(Math.min(1, Math.max(0, u))));
        sigs[j]?.setAttribute("transform", tr(p));
        op(sigs[j], u > 0 && u < 1 ? 1 : 0);
        op(flash[j], u >= 1 && u < 1.8 ? 1 - (u - 1) / 0.8 : 0);
      });
      nodes.forEach((n, i) => { const a = t * 0.7 + (i * 2 * Math.PI) / 3; n.setAttribute("cx", f(26 * Math.cos(a))); n.setAttribute("cy", f(9 * Math.sin(a))); });
    };
  },
  ag(svg) {
    const sigs = $$<SVGCircleElement>(svg, ".ag-sig");
    return (t) => {
      AG_ARCS.forEach((a, j) => {
        const w = (t * 0.32 + j * 0.5) % 1, u = w < 0.5 ? w * 2 : 2 - w * 2;
        sigs[j]?.setAttribute("transform", tr(along(a.ps, ease3(u))));
        op(sigs[j], 0.2 + 0.8 * Math.sin(Math.PI * ((w * 2) % 1)));
      });
    };
  },
};

/** the section drawings: build on arrival, then their loops; Nightshade's lift is scrubbed by the band's passage; the quantum key turns once */
export function mountArts(root: HTMLElement, { gsap, ScrollTrigger, reduced }: MotionCtx) {
  if (reduced) return () => {};
  const offs: (() => void)[] = [];
  $$<SVGSVGElement>(root, "svg.pa-art").forEach((svg) => {
    const scene = svg.dataset.scene ?? "", loop = LOOPS[scene];
    const start = () => { if (loop) { const tick = loop(svg, gsap); offs.push(whileNear(gsap, svg, (t) => tick(t))); } };
    if (scene === "qt") {
      const old = $(svg, ".qt-old"), neu = $(svg, ".qt-new");
      gsap.set(old, { opacity: 0, y: 0 }); gsap.set(neu, { opacity: 0, y: -30 });
    }
    if (scene === "ns") {
      const cons = $(svg, ".ns-cons"), wits = $$(svg, ".ns-wit");
      gsap.timeline({ scrollTrigger: { trigger: svg, start: "top 90%", end: "center 40%", scrub: 0.6 } })
        .fromTo(cons, { y: NS.lift }, { y: 0, ease: "none" }, 0)
        .fromTo(wits, { scaleY: 0.08, transformOrigin: "50% 100%" }, { scaleY: 1, ease: "none" }, 0);
    }
    if (!svg.hasAttribute("data-draw")) {   // a 2D drawing (the speed track): no build, its loop from the start
      start(); return;
    }
    const tl = buildTimeline(gsap, svg);
    if (scene === "qt") {
      const old = $(svg, ".qt-old"), neu = $(svg, ".qt-new");
      tl.to(old, { opacity: 1, duration: 0.4 }, 1.1)
        .to(old, { y: -30, opacity: 0, duration: 0.45, ease: "power2.in" }, 2.1)
        .to(neu, { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.6)" }, 2.5);
    }
    tl.eventCallback("onComplete", start);
    ScrollTrigger.create({ trigger: svg, start: "top 82%", once: true, onEnter: () => tl.play() });
  });
  return () => offs.forEach((o) => o());
}
