import type { HeroAlt } from "../World";
import { G1Layer } from "./G1Layer";

/* /home-v7's hero (D167): G1 (Blog mute, D161) as a film (D162), a Seedance 2.5 crane down and in from S1's source as a fast time-lapse (the cloud sea
   streams, the light warms and dims from pale daylight to a dusky pink), re-timed to even steps and graded frame by frame with G1's grade, under its traced
   layer (D163-D165, G1Layer), tracked to the footage. Where the film never plays (phones, tablets, reduced motion), G1's own sharper still. The subject
   sits right: 70 % across on desktop, 80 % on phones and portrait tablets, with a soft paper wash behind the copy on desktop. */
/* the film's place at 41 even steps of its scroll (top to -150 %, transition I's end): close to even, about 1.22x the even pace at the start, easing
   gently (smoothstep, from a fifth of the way to nine tenths) to about 0.73x, so 75 % of it has played when the wipe starts (-100 %) and it keeps moving
   until the last box has gone. A steeper ease (1.36x to 0.41x) was too slow at the end for Lawrence (D162). From frame 140 on, the film has an optical-flow
   in-between after every frame, so its tail steps finely; the values are in the film's own time, so they bend where the frames double. */
const TIMING = [0, 0.0226, 0.0451, 0.0677, 0.0902, 0.1128, 0.1353, 0.1579, 0.1804, 0.203, 0.2254, 0.2478, 0.2699, 0.2919, 0.3135, 0.3348, 0.3558, 0.3764, 0.3965, 0.4162, 0.4354, 0.4542, 0.4725, 0.5011, 0.5357, 0.5694, 0.6022, 0.6341, 0.6651, 0.6954, 0.7249, 0.7538, 0.7821, 0.81, 0.8374, 0.8647, 0.8917, 0.9188, 0.9459, 0.9729, 1];

export const G1_HERO: HeroAlt = {
  poster: "/images/home/home-hero-g1-timelapse-v1.webp", video: "/videos/home/home-hero-g1-timelapse-v1.mp4", still: "/images/home/home-hero-g1-still-v1.webp",
  x: 70, y: 50, sm: { x: 80 }, timing: TIMING, wash: ["lg"], layer: <G1Layer />,
};
