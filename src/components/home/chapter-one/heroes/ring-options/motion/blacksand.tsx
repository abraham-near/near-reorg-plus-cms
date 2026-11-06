import type { HeroVariant } from "../../types";
import type { Track } from "../../gate/draw";
import { GateLayer } from "../../gate/GateLayer";
import track from "./blacksand.json";

// Black sand in motion (ring option, /lab/hero-ring-blacksand): the gate's chrome ring, frosted disc and green sphere on
// a slope of black volcanic sand and pale moss under fog, a grey coastline on the left. The camera cranes down towards
// the slope with a gentle push in and a drift round the ring, made like the gate (Seedance 2.5 on Figma Weave from the
// still, its start bump trimmed and its pace evened; assets/generated/2026-11-06_hero-ring-options/motion-blacksand,
// LOG.md). The gate's own layer rides it from a per-frame track of this footage (ring, sphere, the ground either side).
// D107: a full hero version, in the homepage's random set (heroes/index.ts).
export const hero: HeroVariant = {
  key: "blacksand",
  name: "Black sand",
  poster: "/images/home/home-hero-ring-blacksand-v1.webp",
  video: "/videos/home/home-hero-ring-blacksand-v1.mp4",
  fps: 30,
  layer: <GateLayer track={track as Track} />,
  // the gate's framing: the photo band's crop below the nav, the ring kept clear of the right edge through the move
  focal: { x: 0.8, y: 0.42, clear: true, dx: 0.85, dy: 0.5 },
  thread: false,
};
