import type { HeroVariant } from "../../types";
import type { Track } from "../../gate/draw";
import { GateLayer } from "../../gate/GateLayer";
import track from "./lake.json";

// The lake shore ring option in motion (/lab/hero-ring-lake): the gate's chrome ring, frosted disc and green sphere on
// the gravel shore of a still lake at first light, made into a full hero like the gate (D90). Seedance 2.5 on Figma
// Weave from the option's still, with the gate's camera move: a slow crane down towards the shore with a gentle push in
// and a slight drift round the ring, so its reflections slide; mist drifts over the water and the reeds sway. Edited
// like the gate (the start bump trimmed, re-timed to even steps at 25 fps) and its layer tracked to the footage
// (assets/generated/2026-11-06_hero-ring-options/motion-lake: LOG.md, track.py), drawn by the gate's own layer.
export const hero: HeroVariant = {
  key: "lake",
  name: "Lake shore",
  poster: "/images/home/home-hero-ring-lake-v1.webp",
  video: "/videos/home/home-hero-ring-lake-v1.mp4",
  // the take's content rate (one frame dropped per second, re-timed): the video and its track are 25 fps
  fps: 25,
  layer: <GateLayer track={track as Track} />,
  // the gate's framing: the photo band's crop below the nav, the ring kept clear of the right edge, the thread off the photo
  focal: { x: 0.8, y: 0.42, clear: true, dx: 0.85, dy: 0.5 },
  thread: false,
};
