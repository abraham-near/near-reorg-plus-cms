import type { HeroAlt } from "../World";

/* /home-v7's hero, a placeholder (D178): round 16's G1, "Stark tower" (D173), as a still, under the new headline (D172). A blown-out white sky and the
   facade as a crisp black grid, the green panes its one colour. No film or traced layer yet: the motion comes next. G1's time-lapse (D167, ../g1) stays
   in the repo for that. The tower sits right: crop x 0 on desktop (the picture slides right, away from the copy), 70 % on phones and portrait tablets (the green
   panes in view), with a soft paper wash behind the copy on desktop. On phones and portrait tablets the facade's grid is too busy to sit behind the words,
   so the picture starts under the copy (smTop, 48 svh), its top faded into the paper, and the green panes land just under the button. */
export const TOWER_HERO: HeroAlt = {
  poster: "/images/home/home-hero-tower-still-v1.webp",
  x: 0, y: 50, sm: { x: 70 }, smTop: 48, wash: ["lg"],
  h1: <><span className="ln">Finance and AI,</span> <span className="ln ln--key">private by <em>default</em><span className="sq" aria-hidden="true" /><span className="sr-only">.</span></span></>,
};
