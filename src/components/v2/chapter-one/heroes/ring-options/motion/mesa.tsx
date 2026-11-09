import type { HeroVariant } from "../../types";
import type { Track } from "../../gate/draw";
import { GateLayer } from "../../gate/GateLayer";
import track from "./mesa.json";

// The mesa ledge in motion (ring option, /lab/hero-ring-mesa): the gate's chrome ring, frosted disc and green sphere on
// a flat sandstone ledge above a canyon, its layered walls dissolving into pale morning haze on the left. The camera
// cranes down towards the ledge with a push in and a drift round the ring, so the ledge rises, the ring grows and its
// reflections slide; made like the gate (Seedance 2.5 on Figma Weave from the still, its start bump trimmed; its pace
// was already even, so it keeps the take's own 24 fps frames; assets/generated/2026-11-06_hero-ring-options/motion-mesa,
// LOG.md). The gate's own layer rides it from a per-frame track of this footage (ring, sphere, the ledge either side).
// D107: a full hero version, in the homepage's random set (heroes/index.ts).
export const hero: HeroVariant = {
  key: "mesa",
  name: "Mesa ledge",
  poster: "/images/home/home-hero-ring-mesa-v1.webp",
  video: "/videos/home/home-hero-ring-mesa-v1.mp4",
  fps: 24,
  layer: <GateLayer track={track as Track} />,
  // the gate's framing: the photo band's crop below the nav, the ring kept clear of the right edge through the move
  focal: { x: 0.8, y: 0.42, clear: true, dx: 0.85, dy: 0.5 },
  thread: false,
};
