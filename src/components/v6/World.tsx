// v6's world: v5's (../v5/World.tsx), same copy, statement and DOM contract, with Lawrence's ridges hero in place of the still forest photo (D108).
// The hero is home-v2's "original" (v2/chapter-one/heroes/original.tsx): the take j pull-back down misty forest ridges, scrubbed by the scroll and never
// played on its own (HeroVideo, desktop with motion only), under the plexus-and-dust layer tracked to the footage (HeroLayer "plexusDust", data zj3).
// Both are reused unchanged; they find each other through the data-ch hooks (root, stage, media, video, copy). On desktop with motion the hero is
// 220 svh tall: the photo stays (sticky) while the copy scrolls away and the camera moves, which is HeroVideo's scroll range (top to -120 %). Phones,
// tablets and reduced motion keep the still (the video's first frame) with the layer at frame 0 and a gentle parallax. Styles: ./v6.css.
import type { CSSProperties } from "react";
import { HeroVideo } from "../v2/chapter-one/HeroVideo";
import { HeroLayer } from "../v2/chapter-one/layer/HeroLayer";
import { HeroRise } from "./HeroRise";
import { StatementWipe } from "./StatementWipe";
import { TX, txEnd, type TxKey } from "./tx";
import "../v1/world/world.css";
import "../v5/v5.css";
import "./v6.css";
import "./tx/tx.css";

const POSTER = "/images/home/home-hero-ridges-take-j-v2.webp";   /* the video's first frame: first paint, LCP, and the still */
const VIDEO = "/videos/home/home-hero-ridges-take-j-v2.mp4";

const N = (
  <path d="M61.0741 15.4268L60.1503 15.6046L45.2764 28.5974C43.6305 29.4554 42.1009 27.9171 42.9636 26.2807L59.3426 2.19499C64.1334 -2.1196 71.7447 0.589276 72.4544 7.03665V65.6943C71.7753 72.6075 63.2278 74.6299 58.2046 70.8547L12.298 16.0152C11.9799 15.7271 11.3374 15.6781 11.1784 16.1623L11.1355 56.201L11.368 57.3103L12.2919 57.1325L27.1658 44.1397C28.4813 43.4288 29.9191 44.3358 29.7172 45.8496C29.6193 46.5728 26.1196 51.4819 25.4343 52.5176C21.4328 58.536 17.3335 64.4992 13.2219 70.444C8.44954 74.8628 0.728093 72.2336 0 65.6943V7.03665C0.679146 0.123497 9.22657 -1.89897 14.2498 1.8763L60.4134 56.8813L61.1108 56.8261L61.3128 16.5361L61.0803 15.4268H61.0741Z" />
);
const i = (n: number) => ({ "--i": n }) as CSSProperties;

// `tx`: one of the hero-to-intro transition studies (D109, ./tx): a longer pin (--tx-pin), the film stretched across it, no fade at the foot,
// and the study's own pieces in the stage. Without it: /home-v6 as built (D108), with the paper rising at the foot (HeroRise).
export function WorldV6({ tx }: { tx?: TxKey } = {}) {
  const T = tx ? TX[tx] : null;
  const pinStyle = T ? ({ "--tx-pin": `${T.pin}svh`, "--tx-pin-vh": `${T.pin}vh` } as CSSProperties) : undefined;
  return (
    <div className="pin" data-tx={tx} style={T ? ({ "--tx-over": `${T.over}svh`, "--tx-over-vh": `${T.over}vh` } as CSSProperties) : undefined}>
      <div className="stage" aria-hidden="true"><canvas /></div>
      <div className="globe" aria-hidden="true">
        {/* the poster (?gl=0 / no WebGL), a plain SVG. v6 never shows it (v5.css hides the globe); lazy, so the hidden 170 KB file isn't fetched ahead of the
            hero's film (D134) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="globe__poster" src="/v1/world/poster-globe-a.svg" alt="" width={1000} height={1000} decoding="async" loading="lazy" />
      </div>
      <section className="hero hero--v5 hero--v6" aria-labelledby="hero-h" data-ch="root" data-tx={tx} style={pinStyle}>
        <div className="hero__bg" aria-hidden="true" data-ch="stage">
          <div className="hero6__media" data-ch="media">
            {/* eslint-disable-next-line @next/next/no-img-element -- one still, already compressed (1920 x 1080 WebP, 32 KB) */}
            <img className="hero6__img" src={POSTER} alt="" width={1920} height={1080} decoding="async" fetchPriority="high" />
            <video className="hero6__video" data-ch="video" muted playsInline preload="none" tabIndex={-1} />
            <HeroVideo src={VIDEO} end={T ? `top -${T.key === "d" ? T.pin : txEnd(T)}%` : undefined} />
            <HeroLayer look="plexusDust" data="zj3" />
          </div>
          {T ? <T.C pin={T.pin} end={txEnd(T)} /> : <HeroRise />}
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
      <section className="statement statement--v5" aria-labelledby="st-h" data-reveal="wipe" data-hold="">
        <StatementWipe />
        <div className="statement__hold">
        <div className="wrap statement__inner">
          <span className="statement__tile" aria-hidden="true"><svg className="statement__n" viewBox="0 0 73 73" focusable="false">{N}</svg></span>
          <h2 className="st" id="st-h">
            <span className="st__l">One account, any chain, private by design.</span>{" "}
            <span className="st__l">NEAR encrypts your prompts and transactions</span>{" "}
            <span className="st__l">so you and your agents can think and trade in</span>{" "}
            <span className="st__l">confidence. Fully sharded, quantum-ready,</span>{" "}
            <span className="st__l">and permissionless to the core, NEAR is the</span>{" "}
            <span className="st__l">infrastructure for a <span className="st__mark">user-owned agent economy.</span></span>
          </h2>
        </div>
        </div>
      </section>
    </div>
  );
}
