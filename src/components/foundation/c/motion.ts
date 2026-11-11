// Foundation C's motion (gsap + ScrollTrigger, through useScrollMotion). Reduced motion: nothing moves; the markup is the finished page.
// · the hero: the plinth's lines draw, the columns' wireframes draw, then the columns rise inside them; idle, some columns breathe and green signals run the
//   seams; scrolled (desktop), the camera eases in and the columns keep rising while the copy lifts away and the paper of the next section covers the stage
// · the pillars (desktop): the stage holds while the three panels pass sideways; the green on the progress line moves with them; each drawing builds as it arrives
// · "smaller" (desktop): the statement starts the size of the screen and shrinks (and tightens) to a heading as the text beside it arrives
// · everything else: [data-rv] text rises once, [data-ill] drawings build once (CSS); the ecosystem strip drifts; the coins of "Ecosystem growth" travel.
import type { MotionCtx } from "@/lib/motion/scroll";
import { mountIcons } from "../../v3/header/icons";
import { PILLARS, LANES, pFaces } from "./hero-geo";
import { f } from "./iso";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export function mount(root: HTMLElement, { reduced, gsap, ScrollTrigger }: MotionCtx) {
  const icons = mountIcons(root, reduced);
  const scene = !reduced && matchMedia("(min-width: 860px)").matches;
  const cleanups: (() => void)[] = [() => icons.dispose()];
  if (!reduced) root.setAttribute("data-motion", "");

  /* ---------------------------------------------------------------- arrivals: text and drawings, once */
  const once = (el: Element, start = "top 86%") => {
    if (reduced) { el.classList.add("is-in"); return; }
    ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => el.classList.add("is-in") });
  };
  root.querySelectorAll("[data-rv]").forEach((el) => once(el));
  root.querySelectorAll(".fc-tr__fig, .fc-cn__fig, .fc-close__fig").forEach((el) => once(el, "top 72%"));

  /* ---------------------------------------------------------------- 1 · the hero */
  const hero = root.querySelector<HTMLElement>(".fc-hero");
  if (hero) cleanups.push(mountHero(hero, { reduced, gsap, ScrollTrigger }, scene));

  /* ---------------------------------------------------------------- 2 · the pillars */
  const pil = root.querySelector<HTMLElement>(".fc-pil");
  if (pil) cleanups.push(mountPillars(pil, { reduced, gsap, ScrollTrigger }, scene));

  /* ---------------------------------------------------------------- 3 · smaller */
  const small = root.querySelector<HTMLElement>(".fc-small");
  if (small && scene) cleanups.push(mountSmall(small, { reduced, gsap, ScrollTrigger }));

  /* ---------------------------------------------------------------- 7 · the strip drifts */
  const img = root.querySelector<HTMLElement>(".fc-eco__img");
  if (img && !reduced) {
    ScrollTrigger.create({ trigger: img, start: "top bottom", end: "bottom top", scrub: 0.6,
      onUpdate: (s) => img.style.setProperty("--drift", `${f((0.5 - s.progress) * 7)}%`) });
  }
  return () => cleanups.forEach((c) => c());
}

/* ==================================================================== the hero */
function mountHero(hero: HTMLElement, { reduced, gsap, ScrollTrigger }: MotionCtx, scene: boolean) {
  const svg = hero.querySelector<SVGSVGElement>(".fc-hiso");
  if (reduced || !svg) { hero.classList.add("is-in"); return () => {}; }
  const cam = hero.querySelector<HTMLElement>(".fc-hero__cam")!, copy = hero.querySelector<HTMLElement>(".fc-hero__copy")!, hud = hero.querySelector<HTMLElement>(".fc-hud")!;
  const q = <T extends Element>(s: string) => Array.from(svg.querySelectorAll<T>(s));
  const edges = q<SVGPathElement>(".fc-h-edge"), fills = q<SVGPolygonElement>(".fc-h-fill");
  const cols = q<SVGGElement>(".fc-col"), sig = q<SVGPolygonElement>(".fc-h-sig polygon");
  const solids = cols.map((g) => { const ps = g.querySelectorAll("polygon"); return ps.length ? { l: ps[0], r: ps[1], t: ps[2] } : null; });
  const wires = cols.map((g) => g.querySelector<SVGPathElement>(".fc-col__w")!);

  // the columns' heights: grow (the build, 0..1) × breath (idle) × lift (scroll)
  const grow = PILLARS.map(() => 0), last = PILLARS.map(() => -1);
  let lift = 1, time = 0;
  const draw = () => {
    for (let k = 0; k < PILLARS.length; k++) {
      const s = solids[k]; if (!s) continue;
      const p = PILLARS[k], b = p.breathe >= 0 ? 1 + 0.07 * Math.sin(time * 0.9 + p.breathe) : 1;
      const t = grow[k] * b * (1 + (lift - 1) * (0.4 + 0.6 * (p.h / 330)));
      if (Math.abs(t - last[k]) < 0.0004) continue;
      last[k] = t;
      const fc = pFaces(p, t);
      s.l.setAttribute("points", fc.left); s.r.setAttribute("points", fc.right); s.t.setAttribute("points", fc.top);
    }
  };

  gsap.set(edges, { strokeDashoffset: 1 });
  gsap.set([...fills, svg.querySelector(".fc-h-ground"), svg.querySelector(".fc-h-grid"), ...sig, ...q(".fc-h-lead path"), ...q(".fc-chip")], { opacity: 0 });
  wires.forEach((w, k) => gsap.set(w, { strokeDashoffset: 1, opacity: 1, ...(solids[k] ? {} : {}) }));
  solids.forEach((s) => s && gsap.set([s.l, s.r, s.t], { opacity: 0 }));
  draw();
  hero.classList.add("is-in");

  const tl = gsap.timeline({ delay: 0.15 });
  tl.to(svg.querySelector(".fc-h-ground"), { opacity: 1, duration: 1.6, ease: "power2.out" }, 0)
    .to(edges, { strokeDashoffset: 0, duration: 1.3, ease: "power2.inOut", stagger: 0.18 }, 0.1)
    .to(fills, { opacity: 1, duration: 0.9, ease: "power2.out" }, 0.75)
    .to(svg.querySelector(".fc-h-grid"), { opacity: 1, duration: 0.8 }, 1.0)
    .to(wires, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", stagger: { amount: 0.9 } }, 0.95);
  // the columns rise inside their wireframes, back to front; a solid column's wire fades once it is full
  const st0 = 1.55;
  PILLARS.forEach((p, k) => {
    const s = solids[k]; if (!s) return;
    const at = st0 + (k / PILLARS.length) * 1.0, o = { v: 0 };
    tl.to([s.l, s.r, s.t], { opacity: 1, duration: 0.25 }, at)
      .to(o, { v: 1, duration: 1.4, ease: "expo.out", onUpdate: () => { grow[k] = o.v; } }, at)
      .to(wires[k], { opacity: 0, duration: 0.8 }, at + 0.9);
  });
  tl.to([...q(".fc-h-lead path"), ...q(".fc-chip")], { opacity: 1, duration: 0.7, stagger: 0.12 }, st0 + 1.4)
    .to(sig, { opacity: 1, duration: 0.6 }, st0 + 1.6);

  // the camera (desktop): scrubbed by the hero's height; the pointer leans it a little
  let pt = 0, pc = 0, mx = 0, my = 0, cx = 0, cy = 0, alive = true;
  if (scene) {
    ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom bottom", onUpdate: (s) => { pt = s.progress; }, onRefresh: (s) => { pt = s.progress; } });
  }
  ScrollTrigger.create({ trigger: hero, start: "top bottom", end: "bottom top", onToggle: (s) => { alive = s.isActive; } });
  const onMove = (e: PointerEvent) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
  hero.addEventListener("pointermove", onMove);

  const tick = (_t: number, dt: number) => {
    if (!alive) return;
    time += dt / 1000;
    pc += (pt - pc) * 0.12; cx += (mx - cx) * 0.05; cy += (my - cy) * 0.05;
    const e = ease(seg(pc, 0, 0.75));
    lift = 1 + 0.3 * e;
    draw();
    cam.style.transform = `translate3d(${f(-9 * e + cx * -1.6)}vw, ${f(-5 * e + cy * -1.2)}vh, 0) scale(${f(1 + 0.32 * e)})`;
    const out = seg(pc, 0.02, 0.4);
    copy.style.opacity = hud.style.opacity = f(1 - out);
    copy.style.translate = `0 ${f(-70 * ease(out))}px`;
    // the signals: green squares running the seams of the top
    for (let i = 0; i < sig.length; i++) {
      const L = LANES[i], u = (time * (0.07 + i * 0.012) + i * 0.27) % 1;
      const x = L.a[0] + (L.b[0] - L.a[0]) * u, y = L.a[1] + (L.b[1] - L.a[1]) * u;
      sig[i].setAttribute("transform", `translate(${f(x)} ${f(y)})`);
      sig[i].style.fillOpacity = f(Math.min(1, u * 8, (1 - u) * 8));
    }
  };
  gsap.ticker.add(tick);
  return () => { gsap.ticker.remove(tick); hero.removeEventListener("pointermove", onMove); tl.kill(); };
}

/* ==================================================================== the pillars */
function mountPillars(sec: HTMLElement, { reduced, gsap, ScrollTrigger }: MotionCtx, scene: boolean) {
  const track = sec.querySelector<HTMLElement>(".fc-pil__track")!, panels = Array.from(sec.querySelectorAll<HTMLElement>(".fc-pil__panel"));
  const arts = panels.map((p) => p.querySelector<HTMLElement>(".fc-pil__art")!);
  const prog = sec.querySelector<HTMLElement>(".fc-prog")!, num = prog.querySelector<HTMLElement>(".fc-prog__n")!;
  const coins = mountCoins(sec, gsap);
  const setOn = (i: number) => panels.forEach((p, k) => {
    p.classList.toggle("is-on", k === i);
    if (k === i) { arts[k].classList.add("is-in"); if (arts[k].querySelector(".fc-ill--eco")) coins.play(); }
  });
  if (reduced) { arts.forEach((a) => a.classList.add("is-in")); panels.forEach((p) => p.classList.add("is-on")); return () => coins.kill(); }
  if (!scene) {
    panels.forEach((p, k) => ScrollTrigger.create({ trigger: p, start: "top 70%", once: true, onEnter: () => { arts[k].classList.add("is-in"); p.classList.add("is-on"); if (arts[k].querySelector(".fc-ill--eco")) coins.play(); } }));
    return () => coins.kill();
  }
  let dist = 0, cur = -1;
  const measure = () => {
    dist = Math.max(0, track.scrollWidth - innerWidth + parseFloat(getComputedStyle(track).paddingLeft));
    sec.style.setProperty("--pil-h", `${Math.round(innerHeight * 1.2 + dist * 1.15)}px`);
  };
  measure();
  // stepped: each panel holds, then the track glides to the next (ease in-out); the green on the line follows the track
  const n = panels.length, HOLD = 0.17, MOVE = (1 - n * HOLD) / Math.max(1, n - 1);
  const apply = (p: number) => {
    const pw = n > 1 ? panels[1].offsetLeft - panels[0].offsetLeft : 0, stop = (i: number) => Math.min(i * pw, dist);
    let x = stop(n - 1), i = n - 1;
    for (let k = 0; k < n; k++) {
      const a = k * (HOLD + MOVE);
      if (p < a + HOLD) { x = stop(k); i = k; break; }
      if (k < n - 1 && p < a + HOLD + MOVE) { const t = (p - a - HOLD) / MOVE, e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; x = stop(k) + (stop(k + 1) - stop(k)) * e; i = e < 0.5 ? k : k + 1; break; }
    }
    track.style.transform = `translate3d(${f(-x)}px, 0, 0)`;
    prog.style.setProperty("--pp", f(dist ? x / dist : 0));
    if (i !== cur) { cur = i; setOn(i); num.textContent = String(i + 1).padStart(2, "0"); }
  };
  ScrollTrigger.create({ trigger: sec, start: "top 55%", once: true, onEnter: () => setOn(Math.max(0, cur)) });
  ScrollTrigger.create({ trigger: sec, start: "top top", end: "bottom bottom", onUpdate: (s) => apply(s.progress), onRefreshInit: measure, onRefresh: (s) => apply(s.progress) });
  apply(0);
  return () => { coins.kill(); sec.style.removeProperty("--pil-h"); };
}

/** "Ecosystem growth": one green coin after another travels each arc out to a builder's tower */
function mountCoins(sec: HTMLElement, gsap: MotionCtx["gsap"]) {
  const arcs = Array.from(sec.querySelectorAll<SVGPathElement>(".fc-eco-arcs path")), dots = Array.from(sec.querySelectorAll<SVGCircleElement>(".fc-eco-coins circle"));
  const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.4 });
  arcs.forEach((a, i) => {
    const d = dots[i]; if (!d) return;
    const len = a.getTotalLength(), o = { u: 0 };
    tl.fromTo(o, { u: 0 }, { u: 1, duration: 1.3, ease: "power1.inOut", onUpdate: () => {
      const pt = a.getPointAtLength(o.u * len); d.setAttribute("cx", f(pt.x)); d.setAttribute("cy", f(pt.y - 4)); d.style.opacity = f(Math.min(1, o.u * 6, (1 - o.u) * 6 + 0.35));
    } }, i * 0.55);
  });
  let started = false;
  return { play: () => { if (!started) { started = true; tl.play(0); } }, kill: () => tl.kill() };
}

/* ==================================================================== smaller */
function mountSmall(sec: HTMLElement, { gsap, ScrollTrigger }: MotionCtx) {
  const h = sec.querySelector<HTMLElement>(".fc-small__h")!, body = sec.querySelector<HTMLElement>(".fc-small__body")!;
  const acc = sec.querySelector<HTMLElement>(".fc-small__acc")!, sq = sec.querySelector<HTMLElement>(".fc-small__sq")!;
  const sns = Array.from(sec.querySelectorAll<HTMLElement>(".fc-sn")), probe = document.querySelector<HTMLElement>(".fc-tr .l-h2");
  gsap.set(sns, { opacity: 0 });
  let vh = innerHeight, big = 1, target = 56, H = 1, accW = 0;
  const measure = () => {
    vh = innerHeight; big = parseFloat(getComputedStyle(h).fontSize); target = (probe ? parseFloat(getComputedStyle(probe).fontSize) : 56) * 1.3;
    h.style.letterSpacing = "0em"; H = h.offsetHeight; accW = acc.offsetWidth;
  };
  const apply = (p: number) => {
    const e = ease(seg(p, 0.1, 0.55)), s = 1 + (target / big - 1) * e;
    h.style.letterSpacing = `${f(-0.012 - 0.03 * e)}em`;
    const left = 0, top = (vh - H * s) / 2 - vh * 0.02 * e;
    h.style.transform = `translate3d(${f(left)}px, ${f(top)}px, 0) scale(${f(s)})`;
    acc.style.transform = `scale(${f(1 - 0.16 * e)})`;
    sq.style.transform = `translateX(${f(-accW * 0.16 * e)}px) scale(${f(1 - 0.45 * e)})`; sq.style.borderRadius = `${f(50 * e)}%`;
    sns.forEach((el, i) => { el.style.opacity = f(seg(p, 0.42 + i * 0.07, 0.52 + i * 0.07)); });
  };
  body.style.top = "50%"; body.style.bottom = "auto"; body.style.translate = "0 -50%";
  ScrollTrigger.create({ trigger: sec, start: "top top", end: "bottom bottom", onUpdate: (s) => apply(s.progress), onRefreshInit: measure, onRefresh: (s) => apply(s.progress) });
  measure(); apply(0);
  return () => { [h, acc, sq, body, ...sns].forEach((el) => el.removeAttribute("style")); };
}
