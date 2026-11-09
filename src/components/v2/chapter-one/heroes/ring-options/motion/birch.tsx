import type { HeroVariant } from "../../types";
import type { Track } from "../../gate/draw";
import { GateLayer } from "../../gate/GateLayer";
import track from "./birch.json";

// The birch clearing ring option in motion (/lab/hero-ring-birch): the gate's chrome ring, frosted disc and green sphere
// on a mossy slope in a pale birch wood in morning mist, made into a full hero like the gate (D90). Seedance 2.5 on Figma
// Weave from the option's still, with the gate's camera move: a slow crane down towards the moss with a gentle push in
// and a slight drift round the ring, so its reflections slide; fog drifts between the trunks and the ferns sway. Edited
// like the gate (the start bump trimmed, re-timed to even steps at 30 fps) and its layer tracked to the footage
// (assets/generated/2026-11-06_hero-ring-options/motion-birch: LOG.md, track.py), drawn by the gate's own layer.
// D107: a full hero version, in the homepage's random set (heroes/index.ts).
export const hero: HeroVariant = {
  key: "birch",
  name: "Birch clearing",
  poster: "/images/home/home-hero-ring-birch-v1.webp",
  video: "/videos/home/home-hero-ring-birch-v1.mp4",
  fps: 30,
  layer: <GateLayer track={track as Track} />,
  // the gate's framing: the photo band's crop below the nav, the ring kept clear of the right edge, the thread off the photo
  focal: { x: 0.8, y: 0.42, clear: true, dx: 0.85, dy: 0.5 },
  thread: false,
};
