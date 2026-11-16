// v6's world: v5's (../v5/World.tsx), same copy, statement and DOM contract, with Lawrence's ridges hero in place of the still forest photo (D108).
// The hero is home-v2's "original" (v2/chapter-one/heroes/original.tsx): the take j pull-back down misty forest ridges, scrubbed by the scroll and never
// played on its own (HeroVideo, desktop with motion only), under the plexus-and-dust layer tracked to the footage (HeroLayer "plexusDust", data zj3).
// Both are reused unchanged; they find each other through the data-ch hooks (root, stage, media, video, copy). On desktop with motion the hero is
// 220 svh tall: the photo stays (sticky) while the copy scrolls away and the camera moves, which is HeroVideo's scroll range (top to -120 %). Phones,
// tablets and reduced motion keep the still (the video's first frame) with the layer at frame 0 and a gentle parallax. Styles: ./v7.css.
import type { CSSProperties, ReactNode } from "react";
import { HeroVideo } from "../v2/chapter-one/HeroVideo";
import { HeroRise } from "./HeroRise";
import { StatementWipe } from "./StatementWipe";
import { TX, txEnd, type TxKey } from "./tx";
import type { StKey } from "./intro";
import "../v1/world/world.css";
import "../v5/v5.css";
import "./v7.css";
import "./tx/tx.css";
import "./intro/intro.css";

const POSTER = "/images/home/home-hero-ridges-take-j-v2.webp";   /* the video's first frame: first paint, LCP, and the still */
const VIDEO = "/videos/home/home-hero-ridges-take-j-v2.mp4";

const N = (
  <path d="M61.0741 15.4268L60.1503 15.6046L45.2764 28.5974C43.6305 29.4554 42.1009 27.9171 42.9636 26.2807L59.3426 2.19499C64.1334 -2.1196 71.7447 0.589276 72.4544 7.03665V65.6943C71.7753 72.6075 63.2278 74.6299 58.2046 70.8547L12.298 16.0152C11.9799 15.7271 11.3374 15.6781 11.1784 16.1623L11.1355 56.201L11.368 57.3103L12.2919 57.1325L27.1658 44.1397C28.4813 43.4288 29.9191 44.3358 29.7172 45.8496C29.6193 46.5728 26.1196 51.4819 25.4343 52.5176C21.4328 58.536 17.3335 64.4992 13.2219 70.444C8.44954 74.8628 0.728093 72.2336 0 65.6943V7.03665C0.679146 0.123497 9.22657 -1.89897 14.2498 1.8763L60.4134 56.8813L61.1108 56.8261L61.3128 16.5361L61.0803 15.4268H61.0741Z" />
);
const i = (n: number) => ({ "--i": n }) as CSSProperties;

/* another hero in place of the ridges (the hero options sheet, D155): its still (the video's first frame), its camera move, its tracked layer (home-v2's
   heroes, which find the picture through the same data-ch hooks) and its crop (object-position, %; sm: phones and portrait tablets, v7.css). /home-v7
   ships G1's time-lapse this way (./g1/hero.tsx, D167). Without it: v6's ridges. */
type Crop = { x?: number; y?: number };
/* no video: a still (it stays put through the pin). wash: a soft paper wash for the copy where a picture is busy behind it, on the left on desktop (lg) and
   from the top on phones and portrait tablets (sm), as v5's (v7.css) */
/* still: where the film never plays (below 1280 px, or reduced motion), a sharper still in place of the film's first frame (D162): one URL, or a srcset
   with its stillSizes (the still covers the hero, so it is drawn wider than the screen on a phone held upright). timing: the film's place at
   even steps of its scroll range (HeroVideo), so its time-lapse can play out before the hand-over and still keep moving until it is gone (D162) */
export type HeroAlt = { poster: string; video?: string; still?: string; stillSizes?: string; timing?: number[]; layer?: ReactNode; sm?: Crop; wash?: ("lg" | "sm" | "smx")[] } & Crop;

// `tx`: one of the hero-to-intro transition studies (D109, ./tx): a longer pin (--tx-pin), the film stretched across it, no fade at the foot,
// and the study's own pieces in the stage. Without it: /home-v6 as built (D108), with the paper rising at the foot (HeroRise).
// `st`: one of the intro layout studies (D144, ./intro), at /home-v6/intro/<key>: the same words, wipe and marker, laid out another way (intro.css).
export function WorldV7({ tx, st, hero }: { tx?: TxKey; st?: StKey; hero?: HeroAlt } = {}) {
  const T = tx ? TX[tx] : null;
  const pc = (v?: number) => (v === undefined ? undefined : `${v}%`);
  const fr = (v?: number) => (v === undefined ? undefined : String(v / 100));
  /* the crop twice over: as object-position for the picture (--h6-x/y, v7.css) and as fractions for the heroes' still SVGs (--hero-fx/fy, which home v2's
     ChapterOne sets; without them the clouds still falls back to 78 % across and misses the picture on phones and tablets) */
  const crop = hero ? (Object.fromEntries(Object.entries({
    "--alt-x": pc(hero.x), "--alt-y": pc(hero.y), "--alt-x-sm": pc(hero.sm?.x), "--alt-y-sm": pc(hero.sm?.y),
    "--alt-fx": fr(hero.x), "--alt-fy": fr(hero.y), "--alt-fx-sm": fr(hero.sm?.x), "--alt-fy-sm": fr(hero.sm?.y),
  }).filter(([, v]) => v)) as CSSProperties) : undefined;
  const pinStyle = T ? ({ ...crop, "--tx-pin": `${T.pin}svh`, "--tx-pin-vh": `${T.pin}vh` } as CSSProperties) : crop;
  return (
    <div className="pin" data-tx={tx} style={T ? ({ "--tx-over": `${T.over}svh`, "--tx-over-vh": `${T.over}vh` } as CSSProperties) : undefined}>
      <div className="stage" aria-hidden="true"><canvas /></div>
      <div className="globe" aria-hidden="true">
        {/* the poster (?gl=0 / no WebGL), a plain SVG. v6 never shows it (v5.css hides the globe); lazy, so the hidden 170 KB file isn't fetched ahead of the
            hero's film (D134) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="globe__poster" src="/v1/world/poster-globe-a.svg" alt="" width={1000} height={1000} decoding="async" loading="lazy" />
      </div>
      <section className="hero hero--v5 hero--v7" aria-labelledby="hero-h" data-ch="root" data-tx={tx} data-alt={hero ? "" : undefined} data-wash={hero?.wash?.join(" ") || undefined} style={pinStyle}>
        <div className="hero__bg" aria-hidden="true" data-ch="stage">
          <div className="hero6__media" data-ch="media">
            {hero?.still ? (
              <picture>
                <source media="(max-width: 1279px), (prefers-reduced-motion: reduce)" srcSet={hero.still} sizes={hero.stillSizes} />
                <img className="hero6__img" src={hero.poster} alt="" width={1920} height={1080} decoding="async" fetchPriority="high" />
              </picture>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element -- one still, already compressed (1920 x 1080 WebP, 32 KB) */
              <img className="hero6__img" src={hero?.poster ?? POSTER} alt="" width={1920} height={1080} decoding="async" fetchPriority="high" />
            )}
            <video className="hero6__video" data-ch="video" muted playsInline preload="none" tabIndex={-1} />
            {(!hero || hero.video) && <HeroVideo src={hero?.video ?? VIDEO} timing={hero?.timing} end={T ? `top -${T.key === "d" ? T.pin : txEnd(T)}%` : undefined} />}
            {hero?.layer /* v6's ridges had HeroLayer ("plexusDust", zj3) here; every hero now brings its own */}
          </div>
          {T?.C ? <T.C pin={T.pin} end={txEnd(T)} /> : <HeroRise />}
        </div>
        <div className="wrap hero__main">
          <div className="hero__copy" data-ch="copy">
            <h1 className="h1" id="hero-h"><span className="ln">Own your</span> <span className="ln ln--key"><em>world</em><span className="sq" aria-hidden="true" /><span className="sr-only">.</span></span></h1>
            <p className="hero__sub in" style={i(1)}><span className="bl">AI is starting to act for you. NEAR keeps your assets,</span> <span className="bl">your data, and your intelligence in your hands.</span></p>
            <div className="hero__cta in" style={i(2)}><a className="cta" href="https://near.com">Get started <span className="arr" aria-hidden="true" /><span className="sr-only"> (another NEAR site)</span></a></div>
          </div>
        </div>
      </section>
      {/* the intro holds on the screen while its faint text is wiped to ink, then the marker wipes in (D113: StatementWipe, v6.css) */}
      <section className="statement statement--v5" aria-labelledby="st-h" data-reveal="wipe" data-hold="" data-st={st}>
        <StatementWipe />
        <div className="statement__hold">
        <div className="wrap statement__inner">
          <span className="statement__tile" aria-hidden="true"><svg className="statement__n" viewBox="0 0 73 73" focusable="false">{N}</svg></span>
          <h2 className="st" id="st-h">
            {/* the lead, and the rest in a wrapper with no box of its own (display: contents; the intro studies lay the two out apart, D145) */}
            <span className="st__l st__lead">One account, any chain, private by design.</span>{" "}
            <span className="st__rest">
              <span className="st__l">NEAR encrypts your prompts and transactions</span>{" "}
              <span className="st__l">so you and your agents can think and trade in</span>{" "}
              <span className="st__l">confidence. Fully sharded, quantum-ready,</span>{" "}
              <span className="st__l">and permissionless to the core, NEAR is the</span>{" "}
              <span className="st__l">infrastructure for a <span className="st__mark">user-owned agent economy.</span></span>
            </span>
          </h2>
        </div>
        </div>
      </section>
    </div>
  );
}
