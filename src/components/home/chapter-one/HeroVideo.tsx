"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// The hero's camera move (D29): a Seedance shot (the original's 10 s, D90's versions 8 s), scrubbed by the reader's
// scroll and never played on its own (so WCAG 2.2.2 stays met, D26). Any length and frame rate: the scroll maps onto
// the clip's own duration, stepped in its frames (`fps`, 24 by default). No `src` (a version that is still a still):
// the photo stays, with the same parallax on phones. Desktop with motion only: the video gets its source there, so phones
// never download it; it fades in over the photograph (its own first frame) once it can seek. Encoded with a keyframe
// every 4 frames and no B-frames so seeking is cheap; the playhead eases towards the scroll target, one seek at a time.
// Phones/tablets keep the still with a gentle parallax.
export const HERO_VIDEO = "/videos/home/home-hero-ridges-crane-v1.mp4";

export function HeroVideo({ src, fps: FPS = 24 }: { src?: string; fps?: number }) {
  const anchor = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const media = anchor.current?.closest<HTMLElement>("[data-ch='media']");
    const root = anchor.current?.closest<HTMLElement>("[data-ch='root']");
    const video = media?.querySelector<HTMLVideoElement>("[data-ch='video']");
    if (!media || !root || !video) return;

    const mm = gsap.matchMedia();
    mm.add({
      desktop: "(min-width: 1280px) and (prefers-reduced-motion: no-preference)",
      small: "(max-width: 1279px) and (prefers-reduced-motion: no-preference)",
    }, (ctx) => {
      const { desktop } = ctx.conditions as { desktop: boolean; small: boolean };
      if (!desktop) {
        // Phones/tablets: the photo band moves slower than the page
        gsap.fromTo(media, { yPercent: -4, scale: 1.08 }, {
          yPercent: 4, ease: "none",
          scrollTrigger: { trigger: media.parentElement, start: "top bottom", end: "bottom top", scrub: true },
        });
        return;
      }

      if (!src) return;
      let target = 0, raf = 0;
      // The move runs from the top of the page until the photo has closed on the line (ChapterOneMotion: the curtains
      // run from -75% to -120%), so it keeps moving through the close-in and never freezes on screen (D35)
      const st = ScrollTrigger.create({
        trigger: root, start: "top top", end: "top -120%",
        onUpdate: (s) => { target = s.progress; if (!raf) raf = requestAnimationFrame(tick); },
      });
      const frame = (t: number) => Math.round(t * FPS) / FPS;
      function tick() {
        raf = 0;
        if (!video!.duration) return; // waits for loadeddata, which calls tick
        if (video!.seeking) { raf = requestAnimationFrame(tick); return; }
        const goal = frame(target * (video!.duration - 1 / FPS));
        const now = video!.currentTime, diff = goal - now;
        if (Math.abs(diff) < 0.5 / FPS) return;
        // Ease towards the target (a third of the way per frame, at least one frame), so a fast flick still glides
        video!.currentTime = frame(now + Math.sign(diff) * Math.max(1 / FPS, Math.abs(diff) / 3));
        raf = requestAnimationFrame(tick);
      }
      const ready = () => {
        video!.setAttribute("data-ready", "");
        tick();
      };
      const loaded = () => { video!.currentTime = frame(target * (video!.duration - 1 / FPS)); };
      video.addEventListener("seeked", ready, { once: true });
      video.addEventListener("loadeddata", loaded, { once: true });
      video.preload = "auto";
      video.src = src;
      video.load();

      return () => {
        cancelAnimationFrame(raf);
        st.kill();
        video.removeEventListener("seeked", ready);
        video.removeEventListener("loadeddata", loaded);
        video.removeAttribute("data-ready");
        video.removeAttribute("src");
        video.load();
      };
    });
    return () => mm.revert();
  }, { scope: anchor, dependencies: [src, FPS] });

  return <span ref={anchor} hidden />;
}
