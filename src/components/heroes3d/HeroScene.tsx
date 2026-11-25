"use client";
// The three hero studies for the homepage (Nov 24, 2026), on /extra as /hero-a, /hero-b and /hero-c: home v10 whole, with this in place of its type-only
// hero (V7Page's privHero). The copy is v10's, word for word ("NEAR is private" and the cycling word, the paragraph, the button: v7/private, used as is);
// behind it, a three.js scene (./scene-a|b|c.ts) that keeps step with the cycling word.
//   A · "Light room" (dark): standing light tubes in a hazy room, the green one comes on with "by design";
//   B · "The display case" (dark): the NEAR mark in green glass, in a glass case on a concrete plinth, lockers behind;
//   C · "The layered N" (light, isometric): the mark as stacked steel plates on green glass, a beam through its layers.
// The second round (D, E, F: the mark and light, kept clear of the copy, each handing over to the Stack): the hero is pinned (RUN: how many screens of
// scroll it holds), its scene plays the hand-off as the page scrolls, the copy fades up and away, and a veil closes to the Stack band's ink at the end.
//   D · "The N of light" (dark, long): a neon outline drawn by light; the camera goes through it to the Stack's pillar;
//   E · "Layers" (light to dark, long): C's plates fold into the pillar's cubes at the drawing's isometric angle;
//   F · "Prism" (dark, short): a beam split by a glass mark into a fan of rays; the Stack's rings open round it.
// The third round (G, H): dark, at E's isometric angle where it suits.
//   G · "Liquid metal" (dark): the mark in polished metal rises out of a dark liquid surface, then hands over to the Stack;
//   H · "Veils" (dark): the mark three times, in layers, each diffusing the light further (privacy as frosted glass), then hands over to the Stack.
// The scene's code loads after the page (its own chunk, with three.js) and fades in; until then, and without WebGL, the hero is its colour alone. It
// keeps the world's DOM contract that WorldPrivate keeps (.pin > .stage > canvas, .globe, .hero). Styles: ./heroes3d.css.
import { useCallback, useEffect, useRef } from "react";
import { Cycle, WORDS } from "../v7/private/Cycle";
import type { Scene } from "./common";
import "../v1/world/world.css";
import "../v7/private/private.css";
import "./heroes3d.css";

export type HeroV = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
const TONE: Record<HeroV, "dark" | "light"> = { a: "dark", b: "dark", c: "light", d: "dark", e: "light", f: "dark", g: "dark", h: "dark" };
const RUN: Partial<Record<HeroV, number>> = { d: 1.6, e: 1.4, f: 0.5, g: 1.4, h: 1.2 };   /* screens of scroll the hero stays pinned for */
const SCENES = { a: () => import("./scene-a"), b: () => import("./scene-b"), c: () => import("./scene-c"), d: () => import("./scene-d"), e: () => import("./scene-e"), f: () => import("./scene-f"), g: () => import("./scene-g"), h: () => import("./scene-h") };
const LAST = WORDS.length - 1;

export function HeroScene({ v }: { v: HeroV }) {
  const gl = useRef<HTMLCanvasElement>(null);
  const sec = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const scene = useRef<Scene | null>(null);
  const word = useRef(0);
  const onStep = useCallback((i: number) => { word.current = i; scene.current?.step(i, LAST); }, []);

  useEffect(() => {
    let dead = false, s: Scene | null = null;
    const canvas = gl.current, section = sec.current, track = RUN[v] ? pin.current ?? undefined : undefined;
    if (!canvas || !section) return;
    (async () => {
      try {
        const mod = await SCENES[v]();
        if (dead) return;
        s = mod.mount(canvas, section, track);
        scene.current = s;
        s.step(word.current, LAST);
        requestAnimationFrame(() => section.setAttribute("data-live", ""));
      } catch (e) {
        console.warn("[hero3d] no scene:", e);   // no WebGL: the hero stays its colour, the copy as on the homepage
      }
    })();
    return () => { dead = true; s?.dispose(); scene.current = null; section.removeAttribute("data-live"); };
  }, [v]);

  const run = RUN[v];
  const hero = (
    <section ref={sec} className="hero hero--priv hero--3d" data-v={v} data-tone={TONE[v]} data-nav-tone={TONE[v]} aria-labelledby="hero-h">
      <canvas ref={gl} className="h3d__gl" aria-hidden="true" />
      <div className="wrap ph">
        <h1 className="ph__h" id="hero-h">
          <span className="ph__l">NEAR is private</span> <Cycle onStep={onStep} />
        </h1>
        <p className="ph__p">
          One account, any chain, private by design. NEAR encrypts your prompts and transactions so you and your agents can think and trade in
          confidence. Fully sharded, quantum-ready, and permissionless to the core, NEAR is the infrastructure for a{" "}
          <span className="ph__mk">user-owned agent economy.</span>
        </p>
        <div className="ph__cta">
          <a className="cta" href="#paths">Get started <span className="arr" aria-hidden="true" /></a>
        </div>
      </div>
    </section>
  );
  return (
    <div ref={pin} className="pin pin--priv pin--3d" data-run={run ? "" : undefined} style={run ? ({ "--run": run } as React.CSSProperties) : undefined}>
      <div className="stage" aria-hidden="true"><canvas /></div>
      <div className="globe" aria-hidden="true" />
      {run ? <div className="h3d__stick">{hero}<div className="h3d__veil" aria-hidden="true" /></div> : hero}
    </div>
  );
}
