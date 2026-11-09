import { CloudsLayer } from "./CloudsLayer";
import type { HeroVariant } from "../types";

// A · Above the clouds (D90): a forested summit over a sea of cloud. Over 8 s the camera comes down and closer (Seedance
// 2.5's slow descent, with a digital crane added in the edit so the summit rises about 100 px; assets/generated/
// 2026-11-05_hero-clouds) while the cloud sea flows round the ridges like a slow time-lapse; the concept's layer is re-tracked to the footage (the ridges, the summit's sight and orbit, the tree tops
// and survey pins ride the land; the clouds never drag them). The poster is the video's first frame.
export const hero: HeroVariant = {
  key: "clouds",
  name: "Above the clouds",
  poster: "/images/home/home-hero-clouds-v1.webp",
  video: "/videos/home/home-hero-clouds-v1.mp4",
  layer: <CloudsLayer />,
  // D90 integrator: the photo band's crop below the nav (heroes/framing.ts); the green thread kept off the photo
  focal: { y: 0.15, clear: true },
  thread: false,
};
