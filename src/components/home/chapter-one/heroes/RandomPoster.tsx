import { getImageProps } from "next/image";
import { PosterScript } from "./PosterScript";
import { HEROES, HERO_KEYS, RANDOM_KEYS } from "./index";
import { choose, type PosterSet } from "./choose";
import { focalCss, threadAttr } from "./framing";

// The homepage's hero picked at random on each load (D90). /home is prerendered, so the server can't choose: it writes
// the poster with no source and an inline script right after it that picks a version (or the one ?hero= names) and
// gives the poster that version's still, during parsing and before the first paint. So the chosen still is the first
// thing seen, only it downloads (at high priority, as the LCP image), and no other version flashes. The poster keeps
// its server markup otherwise, and suppressHydrationWarning lets React accept the attributes the script added.
// Without JavaScript (and for crawlers that don't run it) the gate shows, from <noscript> (D107; it was the original).
// Only the posters' URLs come from the versions here: RandomHero (given HERO_POSTERS, placed after the <video> so the
// layer stacks above it) imports the chosen version's code on the client.
const base = { alt: "", fill: true, sizes: "100vw", quality: 75, loading: "eager", fetchPriority: "high" } as const;
export const HERO_POSTERS: PosterSet = Object.fromEntries(HERO_KEYS.map((k) => {
  const { props } = getImageProps({ ...base, src: HEROES[k].poster! });
  return [k, { src: props.src, srcSet: props.srcSet }];
}));
// Each version's photo-band crop and thread (framing.ts), for ChapterOne
export const HERO_FOCAL_CSS = focalCss(Object.fromEntries(HERO_KEYS.map((k) => [k, HEROES[k].focal])));
export const HERO_THREADS = threadAttr(Object.fromEntries(HERO_KEYS.map((k) => [k, HEROES[k].thread])));
// The markup every version shares (size, crop, priority); the script adds src and srcset
// (D107: without JavaScript the gate shows, the first of the ring heroes)
const { props: { src: fallback, srcSet: fallbackSet, ...shared } } = getImageProps({ ...base, src: HEROES.gate.poster! });

export function RandomPoster({ className }: { className: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- the srcset is set before paint; alt="" in shared */}
      <img {...shared} className={className} data-hero-poster="" suppressHydrationWarning />
      <PosterScript html={`(${choose.toString()})(${JSON.stringify(HERO_POSTERS)},document.currentScript.previousElementSibling,${JSON.stringify(RANDOM_KEYS)})`} />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- alt="" in shared */}
        <img {...shared} src={fallback} srcSet={fallbackSet} className={className} />
      </noscript>
    </>
  );
}
