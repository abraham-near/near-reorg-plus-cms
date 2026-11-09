"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import styles from "./ChapterOne.module.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Chapter 1 choreography (D8, D29). The stage is pinned by CSS `position: sticky`; ScrollTrigger only measures.
// Scrubbed (0.6 s smoothing): the line, the photo closing in on it, the line landing beside the anthem and its wipe.
// The camera move down the ridges is HeroVideo's. Runs only where CSS shows motion mode.
const MOTION = "(min-width: 1280px) and (prefers-reduced-motion: no-preference)";
const SCRUB = 0.6;
const NS = "http://www.w3.org/2000/svg";

export function ChapterOneMotion() {
  const anchor = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const root = anchor.current?.closest<HTMLElement>('[data-ch="root"]');
    if (!root) return;
    const q = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
    const svg = q<SVGSVGElement>('[data-ch="lines"]');
    const photo = q<HTMLElement>('[data-ch="photo"]');
    const curtainL = q<HTMLElement>('[data-ch="curtain-l"]');
    const curtainR = q<HTMLElement>('[data-ch="curtain-r"]');
    const anthem = q<HTMLElement>("[data-wipe]");
    const mark = q<HTMLElement>('[data-ch="mark"]');
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const ease = gsap.parseEase("power3.out");
    // Scrubbed curtains move evenly through their range (an ease-out front-loads the close-in: audit 2026-11-02)
    const easeIO = gsap.parseEase("power1.inOut");

    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      const prog = { claim: 0, clip: 0, fade: 0, glide: 0, anthem: 0 };
      // One thread (D19, D35): it hangs in the photo right of the claim, the photo closes in on it, and it stays at that
      // same x, just right of the anthem's longest line: its head drops to the statement's first line as the anthem
      // arrives, it draws down beside the statement while it wipes on, and rises away with it. It never moves sideways.
      // D90: a hero version may move the line right (thread.x) or keep it off its photo (thread: false), so it never
      // crosses the version's subject (heroes/framing.ts). The settings ride on the svg as data-thread, one per version
      // ("*" for a fixed hero); the random hero's choice is html[data-hero].
      type Geo = { X: number; y: Record<string, number>; thread: SVGPathElement; head: SVGCircleElement; hide: boolean; key: string };
      let G: Geo | null = null;
      let settings: Record<string, { x?: number | string } | false> = {};
      try { settings = JSON.parse(svg.dataset.thread ?? "{}"); } catch { settings = {}; }
      const heroKey = () => document.documentElement.getAttribute("data-hero") ?? "*";
      const threadFor = (k: string) => settings[k] ?? settings["*"];
      // A CSS length (or a fraction of the width) in px, measured on a probe inside the stage
      const lengthPx = (v: number | string, W: number) => {
        if (typeof v === "number") return v * W;
        const probe = document.createElement("div");
        probe.style.cssText = `position:absolute;visibility:hidden;width:${v}`;
        svg.parentElement!.appendChild(probe);
        const w = probe.offsetWidth; probe.remove();
        return w;
      };

      const el = <K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number>) => {
        const n = document.createElementNS(NS, name);
        for (const k in attrs) n.setAttribute(k, String(attrs[k]));
        svg.appendChild(n);
        return n;
      };

      function build() {
        const W = svg.clientWidth, H = svg.clientHeight;
        if (!W || !H) return;
        // The page container's inner edge, measured from a beat's resolved padding (margin + any space beyond 1440).
        const pad = parseFloat(getComputedStyle(q('[data-beat="claim"]')).paddingLeft) || 32;
        const R = W - pad, svgLeft = svg.getBoundingClientRect().left;
        // A clear step (48 px) right of the anthem's longest line, inside the container's right edge; the claim's copy
        // is far narrower, so the same x hangs in the photo right of it
        const words = [...anthem.querySelectorAll<HTMLElement>("[aria-hidden] > span")];
        const textRight = Math.max(...words.map((w) => w.getBoundingClientRect().right)) - svgLeft;
        const key = heroKey(), t = threadFor(key), least = textRight + 48;
        let X = Math.min(R - 24, Math.max(pad + 700, least));
        if (t && t.x !== undefined) X = Math.min(W - 24, Math.max(least, lengthPx(t.x, W)));
        svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
        // Curtains meet exactly at the line (no 1 px seam of photo either side); widths only change on rebuild
        curtainL.style.width = `${X}px`;
        curtainR.style.width = `${W - X}px`;
        svg.replaceChildren();
        const thread = el("path", { class: "thread" }), head = el("circle", { class: "dot", r: 5, "data-ch": "head" });
        G = { X, y: { headStart: 0, headHero: H * 0.5 }, thread, head, hide: t === false, key }; // nothing on load: the line drops in with the scroll
        render();
      }

      function render() {
        if (!G) return;
        // After a client-side navigation the random hero is picked after this ran: rebuild for the version on screen
        if (G.key !== heroKey()) { G = null; build(); return; }
        const { y } = G, top = svg.getBoundingClientRect().top;
        const c = easeIO(prog.clip);
        curtainL.style.transform = curtainR.style.transform = `scaleX(${c})`;
        photo.style.opacity = String(1 - prog.fade);
        const g = ease(prog.glide);
        const markTop = mark.getBoundingClientRect().top - top + 2, textEnd = anthem.getBoundingClientRect().bottom - top;
        let h = lerp(y.headStart, y.headHero, ease(prog.claim));
        h = lerp(h, markTop, g);
        h = lerp(h, textEnd, prog.anthem);
        const x = G.X, v = Math.max(0, h);
        G.thread.setAttribute("d", v > 0 ? `M${x} 0 V${v}` : "");
        G.head.setAttribute("cx", String(x)); G.head.setAttribute("cy", String(v));
        // Kept off the photo (thread: false): it fades in only over the last 8% of the close-in, when the curtains have
        // all but met on it and the subject is gone, so the anthem keeps its line and it never crosses the picture
        const shown = G.hide ? gsap.utils.clamp(0, 1, (c - 0.92) / 0.08) : 1;
        G.thread.setAttribute("opacity", String(shown));
        G.head.setAttribute("opacity", String(v > 6 ? shown : 0));
      }

      build();

      const track = (key: keyof typeof prog, trigger: string | Element, start: string, end: string) =>
        gsap.to(prog, { [key]: 1, ease: "none", onUpdate: render, scrollTrigger: { trigger, start, end, scrub: SCRUB, invalidateOnRefresh: true } });
      const beat = (b: string) => q(`[data-beat="${b}"]`);
      // The claim has 90 vh of room after it (D29), so the camera move is seen whole before the photo closes in
      // The line starts at nothing on load and drops in over the first half-screen of scroll (Lawrence, 2026-11-03)
      track("claim", beat("claim"), "top top", "top -50%");
      track("clip", root, "top -75%", "top -120%");
      track("fade", root, "top -115%", "top -140%");
      track("glide", root, "top -125%", "top -180%"); // the head drops to the statement as the anthem arrives (pins at -190%)
      // Anthem wipe: while pinned, each character goes from 18% to full, left to right, with a short hold at the end.
      // "own your intelligence." wipes on in ink; each of its letters turns green only as it goes solid (D29).
      const chars = [...anthem.querySelectorAll<HTMLElement>("[aria-hidden] span span")];
      const STEP = 0.04, DUR = 0.3;
      const tl = gsap.timeline({ scrollTrigger: { trigger: beat("anthem"), start: "top top", end: "bottom bottom", scrub: SCRUB } })
        .fromTo(chars, { opacity: 0.18 }, { opacity: 1, ease: "none", duration: DUR, stagger: STEP }, 0);
      const green = chars.filter((c) => c.parentElement?.classList.contains(styles.hl));
      if (green.length) {
        const first = chars.indexOf(green[0]);
        tl.fromTo(green, { "--g": 0 }, { "--g": 1, ease: "power1.out", duration: DUR * 0.2, stagger: STEP }, first * STEP + DUR * 0.8);
      }
      tl.to({}, { duration: chars.length * STEP * 0.2 });
      track("anthem", beat("anthem"), "top top", "bottom bottom");
      // Hand-overs follow the copy's live position, so redraw on every scroll inside the chapter
      ScrollTrigger.create({ trigger: root, start: "top top", end: "bottom bottom", onUpdate: render });

      ScrollTrigger.addEventListener("refreshInit", build);
      return () => ScrollTrigger.removeEventListener("refreshInit", build);
    });
    // Phones and tablets (D15): the static thread comes alive with the reader's own scroll. The green rule draws down
    // the chapter and each beat's dot scales in as its beat arrives. Transform only (CSS reads --rule and data-dot).
    mm.add("(max-width: 1279px) and (prefers-reduced-motion: no-preference)", () => {
      const beats = q<HTMLElement>('[data-ch="beats"]');
      beats.setAttribute("data-dots", "");
      // Both begin only once the reader scrolls (the beats start at 42svh, below these points), so no green shows on load
      gsap.fromTo(beats, { "--rule": 0 }, { "--rule": 1, ease: "none", scrollTrigger: { trigger: beats, start: "top 35%", end: "bottom 70%", scrub: SCRUB } });
      beats.querySelectorAll<HTMLElement>("[data-beat]").forEach((b) => ScrollTrigger.create({
        trigger: b, start: "top 35%",
        onEnter: () => b.setAttribute("data-dot", ""), onLeaveBack: () => b.removeAttribute("data-dot"),
      }));
      return () => { beats.removeAttribute("data-dots"); beats.querySelectorAll("[data-dot]").forEach((b) => b.removeAttribute("data-dot")); };
    });
    return () => mm.revert();
  }, { scope: anchor });

  return <span ref={anchor} hidden />;
}
