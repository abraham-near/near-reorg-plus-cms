import { GateLayer } from "./GateLayer";
import type { HeroVariant } from "../types";

// The gate (D90, concept D, the non-organic one): a monumental chrome ring and frosted glass disc with a green glass
// sphere at its heart, on a misty hillside. The camera cranes down towards the slope and pushes in (round 3, a Figma
// Weave re-shoot): the grass rises, the ring climbs and grows, and the chrome's reflections of sky, mist and hill slide
// across it. Its layer (the static concept's, tracked to the footage) rides the ring, the sphere and the grass edge, and
// keeps a slow idle life of its own.
export const hero: HeroVariant = {
  key: "gate",
  name: "The gate",
  poster: "/images/home/home-hero-gate-v1.webp",
  video: "/videos/home/home-hero-gate-v1.mp4",
  // round 4: retimed to its content's real rate (the take was 30 fps content with frames dropped, 4 hitches a second)
  fps: 30,
  layer: <GateLayer />,
  // D90 integrator: the photo band's crop below the nav (heroes/framing.ts); the green thread kept off the photo.
  // dx: the desktop move's crop pushed right (0.3 by default), so at 16:10 (1440 × 900) the ring, which grows and drifts
  // right through the move, keeps ~140 px from the right edge at the start and ~110 px when the close-in begins
  focal: { x: 0.8, y: 0.42, clear: true, dx: 0.85, dy: 0.5 },
  thread: false,
};
