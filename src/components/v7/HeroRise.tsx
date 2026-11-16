"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// The hand-over at the foot of v6's ridges hero (D108): over the last part of the camera move the paper rises from the picture's foot, so the film
// ends in the page's light rather than on its darkest frame (the move ends deep in the trees). Desktop with motion only, where the picture sticks
// (v6.css); it sets --h6-rise (0 to 1) on the hero, which the picture's ::after gradient reads. Everywhere else the variable stays 0 and v6.css's
// static fade applies.
export function HeroRise() {
  const anchor = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const hero = anchor.current?.closest<HTMLElement>(".hero--v7");
    if (!hero) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1280px) and (prefers-reduced-motion: no-preference)", () => {
      // HeroVideo's range is the hero's top to -120 % (the picture sticks for exactly that long); the paper rises over its last 45 %
      const st = ScrollTrigger.create({
        trigger: hero, start: "top -66%", end: "top -120%",
        onUpdate: (s) => hero.style.setProperty("--h6-rise", s.progress.toFixed(3)),
        onRefresh: (s) => hero.style.setProperty("--h6-rise", s.progress.toFixed(3)),
      });
      return () => { st.kill(); hero.style.removeProperty("--h6-rise"); };
    });
    return () => mm.revert();
  }, { scope: anchor });

  return <span ref={anchor} hidden />;
}
