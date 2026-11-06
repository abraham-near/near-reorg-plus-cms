import gsap from "gsap";
import type { RailLook } from "./RailLooks";

// Each look's moves on the rail's scrubbed timeline (D32; units as in StoryRailMotion: 100 in all), transform and opacity
// only. Returns what to run on every timeline update: the back layers follow the track's travel at their own depth
// (data-depth), so the world has parallax; the window rides the track until the layer drawing (the gate) and then hangs back at 0.3×.
type Ctx = {
  tl: gsap.core.Timeline;
  root: HTMLElement;
  world: HTMLElement;
  gateX: () => number; // the track's x when the layer drawing is centred
  steps: number[];
};

// The window: 53–83vw × 24–64% of the screen (its top clear of the answer heading), i.e. the sky band above the line
// (0–100vw × 0–64%) scaled about the point (75.71%, line); see RailLooks.module.css
const WIN = { sx: 0.3, sy: (64 - 24) / 64, ox: 0.7571 };

export function addLook(look: RailLook, { tl, root, world, gateX, steps }: Ctx): () => void {
  const q = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(`[data-s="${s}"]`);
  const qa = <T extends Element = HTMLElement>(s: string) => [...root.querySelectorAll<T>(`[data-s="${s}"]`)];
  const layers = [...root.querySelectorAll<HTMLElement>("[data-depth]")].map((el) => ({ set: gsap.quickSetter(el, "x", "px"), k: Number(el.dataset.depth) }));
  let extra: (wx: number) => void = () => {};

  if (look === "horizon") {
    const finder = q("finder")!, playhead = q("playhead")!;
    // A slow camera pull-back across the whole rail; corners lock onto each station as it reaches the centre.
    // D95, the playhead: the reader's place on the line from the moment NEAR's tile lands between AI and blockchain
    // (it grows out round the tile just after it). The tiles stay on the line and leave with it; the box holds the
    // centre, so it travels on, empty, to the layer, where a tile lands in it as the disc turns green (StoryRailMotion),
    // and on to each station, whose tile lands in it in turn. Every tile is the same size, and so is the box.
    tl.fromTo(q("plate"), { scale: 1.08 }, { scale: 1, duration: 100, ease: "none" }, 0)
      .fromTo(playhead, { autoAlpha: 0, scale: 48 / 56 }, { autoAlpha: 1, scale: 1, duration: 2.5, ease: "power3.out", immediateRender: false }, 8.5);
    steps.forEach((at, i) => {
      tl.fromTo(finder, { autoAlpha: 0, scale: 1.14 }, { autoAlpha: 1, scale: 1, duration: 3, ease: "power3.out", immediateRender: false }, at - 2.5);
      if (i < steps.length - 1) tl.to(finder, { autoAlpha: 0, duration: 2, ease: "power1.in" }, steps[i + 1] - 6);
    });
  }

  if (look === "window") {
    const frame = q("window")!, inner = q("windowInner")!, dark = q("windowDark")!;
    const corners = qa("wcorner");
    const zoom = { z: 1.1 };
    gsap.set(frame, { scaleX: WIN.sx, scaleY: WIN.sy });
    // While the problem is read the view goes grey and dark; it clears as the problem goes, and once the answer has
    // formed (by 50) the frame opens out to the whole sky above the line, the picture settling from a
    // slight zoom; the corners ride the frame's edges and fade once it is open; then the landscape steps back
    tl.to(dark, { opacity: 1, duration: 8 }, 24)
      .to(dark, { opacity: 0, duration: 5 }, 44)
      .to(frame, { scaleX: 1, scaleY: 1, duration: 9, ease: "power3.inOut" }, 51)
      .to(zoom, { z: 1, duration: 12, ease: "power2.out" }, 51)
      .to(corners, { autoAlpha: 0, duration: 3 }, 58)
      .to(frame, { opacity: 0.6, duration: 8 }, 60);
    const setFrameX = gsap.quickSetter(frame, "x", "px");
    const setInner = { x: gsap.quickSetter(inner, "x", "px"), sx: gsap.quickSetter(inner, "scaleX"), sy: gsap.quickSetter(inner, "scaleY") };
    const setCorner = corners.map((c) => ({ c: c.dataset.c!, x: gsap.quickSetter(c, "x", "px"), y: gsap.quickSetter(c, "y", "px") }));
    extra = (wx) => {
      // Until the gate, the window travels with the track; from there the frame stays and its picture hangs back at 0.3×
      const d = wx - gateX(), fx = d > 0 ? d : 0;
      const sx = Number(gsap.getProperty(frame, "scaleX")), sy = Number(gsap.getProperty(frame, "scaleY"));
      setFrameX(fx);
      setInner.x(d > 0 ? 0 : d * 0.3);
      setInner.sx(zoom.z / sx);
      setInner.sy(zoom.z / sy);
      // Each corner follows its corner of the scaled frame: offset = (origin − corner) × (1 − scale), plus the frame's x
      const W = frame.offsetWidth, H = frame.offsetHeight, ox = W * WIN.ox;
      setCorner.forEach(({ c, x, y }) => {
        const px = c[1] === "l" ? 0 : W, py = c[0] === "t" ? 0 : H;
        x((ox - px) * (1 - sx) + fx);
        y((H - py) * (1 - sy));
      });
    };
  }

  if (look === "drafting") {
    const fan = qa<SVGPathElement>("fan").flatMap((s) => [...s.querySelectorAll("path")]);
    const orbits = qa("orbits");
    gsap.set(fan, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(orbits.slice(1), { autoAlpha: 0 });
    // Beat 1: the hairlines run in from both edges and gather at the point just before the green arrives; they and the
    // point's rings step back as the world starts to move
    tl.to(fan, { strokeDashoffset: 0, duration: 6, stagger: 0.15, ease: "power2.inOut" }, 0)
      .to([...qa("fan"), orbits[0]], { autoAlpha: 0, duration: 4 }, 13)
      // The selection frame locks onto the layer drawing while the problem is read, and lets go as the answer arrives
      .fromTo(q("select"), { autoAlpha: 0, scale: 1.5 }, { autoAlpha: 1, scale: 1, duration: 4, ease: "power3.out", immediateRender: false }, 22)
      .to(q("select"), { autoAlpha: 0, scale: 1.25, duration: 4, ease: "power1.in" }, 45);
    // Rings around the station being read only (its neighbours' would be cut by the screen's edges)
    steps.forEach((at, i) => {
      tl.to(orbits[i + 1], { autoAlpha: 1, duration: 4 }, at - 4);
      if (i < steps.length - 1) tl.to(orbits[i + 1], { autoAlpha: 0, duration: 3 }, steps[i + 1] - 6);
    });
    // The dashed ring turns with the track (centred by GSAP, so its rotation composes with the centring)
    const dashed = orbits.map((o) => o.children[1] as HTMLElement);
    gsap.set(dashed, { x: 0, y: 0, xPercent: -50, yPercent: -50 });
    const turns = dashed.map((d) => gsap.quickSetter(d, "rotation", "deg"));
    extra = (wx) => turns.forEach((t) => t(wx * 0.015));
  }

  return () => {
    const wx = Number(gsap.getProperty(world, "x"));
    layers.forEach((l) => l.set(wx * l.k));
    extra(wx);
  };
}
