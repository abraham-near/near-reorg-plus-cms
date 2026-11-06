import { DuneLayer } from "./DuneLayer";
import type { HeroVariant } from "../types";

// Dune (D90, concept C): a long dune crest between light and shadow in thin haze at first light. The camera cranes down
// along the dune and pushes in a little while the light moves as in a time-lapse (the sun travelling, the shadow side and
// the ripples' shadows sweeping) and fine sand blows off the crest. Its layer (the static concept's, tracked to the
// sand itself, not the moving shadows) rides the crest, the far crests and the ripples; the contour scale, protractor
// and sighted peak ride the dune, and a sun marker on the protractor reads the light.
export const hero: HeroVariant = {
  key: "dune",
  name: "Dune",
  poster: "/images/home/home-hero-dune-v1.webp",
  video: "/videos/home/home-hero-dune-v1.mp4",
  layer: <DuneLayer />,
  // D90 integrator: the photo band's crop below the nav (heroes/framing.ts); the green thread kept off the photo.
  // y 0.4: with reduced motion on wide screens the band shows the S-bend, not haze. dx 1: the desktop camera move's
  // crop takes all its slack from the left, so the dune sits further left and the sighted peak clears the nav's end
  // (at 16:10 that is 112 px; at 16:9 there is no slack); dy 0.35 keeps a little more sky above the peak on screens
  // wider than 16:9
  focal: { x: 0.95, y: 0.4, clear: true, dx: 1, dy: 0.35 },
  thread: false,
};
