"use client";

import { useEffect, useRef, useState } from "react";
import { HeroVideo } from "../HeroVideo";
import { choose, type PosterSet } from "./choose";
import { LOAD } from "./load";
import { RANDOM_KEYS } from "./pool";
import type { HeroKey, HeroVariant } from "./types";

// The homepage's hero version, once picked (D90). RandomPoster's inline script has already chosen it and shown its
// still before hydration; this reads the choice off the poster and imports only that version's code, then mounts its
// camera move (HeroVideo, desktop with motion only) and its tracked layer, exactly as a fixed hero would. After a
// client-side navigation the inline script never ran, so it chooses here instead. The server and the first client
// render are identical (nothing), so hydration never mismatches.
export function RandomHero({ posters }: { posters: PosterSet }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const [hero, setHero] = useState<HeroVariant | null>(null);

  useEffect(() => {
    const img = anchor.current?.closest("[data-ch='media']")?.querySelector<HTMLImageElement>("img[data-hero-poster]");
    if (!img) return;
    const key = (img.getAttribute("data-hero") ?? choose(posters, img, RANDOM_KEYS)) as HeroKey;
    // html[data-hero] keys each version's crop (ChapterOne) and thread (ChapterOneMotion); set again on every mount,
    // since this effect's cleanup (a navigation away, or React's development double mount) clears it
    document.documentElement.setAttribute("data-hero", key);
    let live = true;
    (LOAD[key] ?? LOAD.gate)().then((h) => { if (live) setHero(h); });
    return () => {
      live = false;
      document.documentElement.removeAttribute("data-hero");
    };
  }, [posters]);

  return (
    <>
      <span ref={anchor} hidden />
      {hero && <HeroVideo src={hero.video} fps={hero.fps} />}
      {hero?.layer}
    </>
  );
}
