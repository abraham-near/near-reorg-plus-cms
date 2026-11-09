import type { HeroVariant } from "../types";
import { UnfurlLayer } from "./UnfurlLayer";

// Unfurl (D90, concept B): a macro of a fern crozier with dew against pale misty forest. The camera moves down the stem
// with a slow drift back while the coil opens a little and the dew slides down; scrubbed by the scroll (HeroVideo). Its
// layer is the concept's (cinematic/layers/Fern.tsx) tracked to the footage: the spiral re-fitted to the coil every
// frame, rings on the drops themselves, the construction riding the coil's eye. Sources and tracking:
// assets/generated/2026-11-05_hero-unfurl/.
export const hero: HeroVariant = {
  key: "unfurl",
  name: "Unfurl",
  poster: "/images/home/home-hero-unfurl-v1.webp",
  video: "/videos/home/home-hero-unfurl-v1.mp4",
  // 30 fps: Seedance's take was 30 fps motion with every fifth frame dropped (a hitch four times a second); the missing
  // frames are rebuilt with optical flow (assets/generated/2026-11-05_hero-unfurl/retime.py), so every step is even
  fps: 30,
  layer: <UnfurlLayer />,
  // D90 integrator: the photo band's crop below the nav (heroes/framing.ts). The green thread is kept off the photo
  // (critic round: it hung ~50 px from the stem and made the picture green-heavy); it arrives as the curtains close
  focal: { y: 0.27, clear: true },
  thread: false,
};
