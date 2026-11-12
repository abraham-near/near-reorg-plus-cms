// v5's world: v4's (../v4/World.tsx), same copy and DOM contract, with no globe: the hero sits on a photo (a misty forest, from Lawrence's direction B) and
// the intro is one left-aligned paragraph under the N on its green tile (.statement--v5, v5.css). The page asks the boot for no globe (V5Page: data-gl="off"),
// so .stage / .globe stay in the DOM (the boot reads them) but never draw.
import type { CSSProperties } from "react";
import "../v1/world/world.css";
import "./v5.css";

const N = (
  <path d="M61.0741 15.4268L60.1503 15.6046L45.2764 28.5974C43.6305 29.4554 42.1009 27.9171 42.9636 26.2807L59.3426 2.19499C64.1334 -2.1196 71.7447 0.589276 72.4544 7.03665V65.6943C71.7753 72.6075 63.2278 74.6299 58.2046 70.8547L12.298 16.0152C11.9799 15.7271 11.3374 15.6781 11.1784 16.1623L11.1355 56.201L11.368 57.3103L12.2919 57.1325L27.1658 44.1397C28.4813 43.4288 29.9191 44.3358 29.7172 45.8496C29.6193 46.5728 26.1196 51.4819 25.4343 52.5176C21.4328 58.536 17.3335 64.4992 13.2219 70.444C8.44954 74.8628 0.728093 72.2336 0 65.6943V7.03665C0.679146 0.123497 9.22657 -1.89897 14.2498 1.8763L60.4134 56.8813L61.1108 56.8261L61.3128 16.5361L61.0803 15.4268H61.0741Z" />
);
const i = (n: number) => ({ "--i": n }) as CSSProperties;

export function WorldV5() {
  return (
    <div className="pin">
      <div className="stage" aria-hidden="true"><canvas /></div>
      <div className="globe" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- the poster (?gl=0 / no WebGL), a plain SVG */}
        <img className="globe__poster" src="/v1/world/poster-globe-a.svg" alt="" width={1000} height={1000} decoding="async" />
      </div>
      <section className="hero hero--v5" aria-labelledby="hero-h">
        <div className="hero__bg" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- one still, already compressed */}
          <img src="/v5/hero-mistforest.webp" alt="" width={900} height={672} decoding="async" fetchPriority="high" />
        </div>
        <div className="wrap hero__main">
          <div className="hero__copy">
            <h1 className="h1" id="hero-h"><span className="ln">Own your</span> <span className="ln ln--key"><em>world</em><span className="sq" aria-hidden="true" /><span className="sr-only">.</span></span></h1>
            <p className="hero__sub in" style={i(1)}><span className="bl">AI is starting to act for you. NEAR keeps your assets,</span> <span className="bl">your data, and your intelligence in your hands.</span></p>
            <div className="hero__cta in" style={i(2)}><a className="cta" href="https://near.com">Get started <span className="arr" aria-hidden="true" /><span className="sr-only"> (another NEAR site)</span></a></div>
          </div>
        </div>
      </section>
      <section className="statement statement--v5" aria-labelledby="st-h">
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
      </section>
    </div>
  );
}
