import { HeroLayer } from "../layer/HeroLayer";
import type { HeroVariant } from "./types";

// The original (D50–D68, D71): the take j pull-back down misty forest ridges, with the tracked plexus and dust. D93: v2
// is the same take re-timed so its move steps evenly (it hitched every fourth frame), with the layer data moved to match
// (zj3)
export const hero: HeroVariant = {
  key: "original",
  name: "Ridges (original)",
  poster: "/images/home/home-hero-ridges-take-j-v2.webp",
  video: "/videos/home/home-hero-ridges-take-j-v2.mp4",
  layer: <HeroLayer look="plexusDust" data="zj3" />,
};
