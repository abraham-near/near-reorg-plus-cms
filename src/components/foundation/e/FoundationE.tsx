"use client";
// near.org/foundation (/near-foundation): the Foundation page, version E with two sections of version F (the other versions were removed). From the top:
//   1 the hero (E): Foundation C's drawing (the plinth and its green columns) on paper, alive without scrolling (the columns breathe, signals run the
//     seams, it leans to the pointer; HeroColumns.tsx);
//   2 the pillars (F): one ruled row, three cells, each with its icon and a mono label (Structure / Focus / Direction);
//   3 "Our goal is to make ourselves smaller." (E): C's statement on two lines, the size of the screen, shrinking to the left as the text arrives on
//     the right; then the page scrolls on;
//   4 transparency (E): the glass Stiftung in a box on the ruled grid;
//   5 the Council (F): the Stack's dark, the heading | the text and who reports to whom;
//   6–8 how the Foundation operates, the ecosystem and the close (E).
// Copy: the October 2026 doc, verbatim (the pillars' labels and the Council's chain are the Figma page's, via F).
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { LOCKUP_LETTERS, LOCKUP_TILE, LOCKUP_VIEWBOX } from "../../v3/proof-deeper/lockup";
import { ArtGlass } from "../b/Art";
import { Arrow, CAREERS, COMMUNITY, ECOSYSTEM, Words } from "./parts";
import { HeroColumns } from "./HeroColumns";
import { OperateSection } from "./Operate";
import { mountAll } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "../b/foundation-b.css";
import "./foundation-e.css";
import "../../shared/close-mail.css";

// the pillars (from version F's Figma page): an icon, a mono label, the title and the text
const PILLARS = [
  { icon: "nonprofit", k: "Structure", t: "Nonprofit", b: "A Swiss nonprofit foundation (Stiftung), legally bound to its purpose, operating with the transparency that structure demands." },
  { icon: "growth", k: "Focus", t: "Ecosystem growth", b: "We support the growth of the NEAR ecosystem, directing resources to the people and projects building on it rather than competing with them." },
  { icon: "decentral", k: "Direction", t: "Decentralization", b: "We champion a decentralized, self-sufficient ecosystem, and work to devolve our own functions to it over time." },
];

export function FoundationE() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mountAll);
  return (
    <div ref={ref} className="l-page fb-page fe-page">
      {/* 1 · hero: C's plinth and columns, alive; scrolled, they settle into the stair below */}
      <section className="fb-hero fe-hero" aria-labelledby="fb-h1">
        <div className="fb-hero__stage">
          <HeroColumns />
          <div className="fb-hero__copy">
            <p className="fb-kick t-label" data-hero-rv=""><i aria-hidden="true" />NEAR Foundation</p>
            <h1 id="fb-h1" className="fb-h1"><Words text="Enabling community-driven innovation to benefit people around the world" accent="people" /></h1>
            <p className="fb-hero__sub" data-hero-rv="">NEAR Foundation is a Swiss nonprofit supporting the open infrastructure for the agent economy, where you own your assets, your intelligence, and your world. Our mandate is to place that infrastructure in the hands of the community it serves.</p>
          </div>
        </div>
      </section>

      {/* 2 · three pillars: Foundation F's ruled row (an icon, a mono label, the title and the text in each cell) */}
      <section className="l-sec ff-pillars" id="fb-pillars" aria-labelledby="fb-pillars-t">
        <h2 id="fb-pillars-t" className="sr-only">What the Foundation is</h2>
        <ul className="l-row ff-pillars__row" data-row="">
          {PILLARS.map((p) => (
            <li key={p.t} className="l-cell ff-pillar">
              <img className="ff-pillar__ic" src={`/foundation/icon-${p.icon}.svg`} alt="" width={32} height={32} />
              <p className="ff-k" data-rv="">{p.k}</p>
              <h3 className="ff-h3" data-rv="">{p.t}</h3>
              <p className="ff-body" data-rv="">{p.b}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 3 · the thesis on two lines: it shrinks to the left as the text arrives on the right */}
      <section className="fe-small" id="fb-mission" aria-labelledby="fe-small-t">
        <div className="fe-small__stage">
          <h2 id="fe-small-t" className="fe-small__h">
            <span className="fe-small__l">Our goal is to make</span> <span className="fe-small__l">ourselves <span className="accent fe-small__acc">smaller</span><span className="fe-small__sq" aria-hidden="true" /></span>
          </h2>
          <div className="fe-small__body">
            <p className="fe-small__lead"><span className="fe-sn">Most organizations exist to grow.</span> <span className="fe-sn">The NEAR Foundation exists to devolve.</span></p>
            <p className="fe-small__p"><span className="fe-sn">Our purpose is to support the ecosystem until it operates without us, moving functions and resources into the hands of the community and the decentralized infrastructure that carries them.</span> <span className="fe-sn">This is what ownership means at the level of the network itself: NEAR is built to belong to the people who use it.</span></p>
            <p className="fe-small__end"><span className="fe-sn">We support the network. We do not control it, and by design we could not.</span></p>
          </div>
        </div>
      </section>

      {/* 4 · transparency: the glass Stiftung, a box on the ruled grid (drawing | text), on the page's paper */}
      <section className="l-sec fb-tr fe-box fe-tr" id="fb-transparency" aria-labelledby="fb-tr-t">
        <div className="l-row fe-box__row" data-row="">
          <div className="l-cell fe-box__art">
            <figure className="fb-tr__art" data-glass=""><ArtGlass /></figure>
            <b className="l-x fe-x" aria-hidden="true" /><b className="l-x fe-x fe-x--r fe-x--m" aria-hidden="true" />
          </div>
          <div className="l-cell fe-box__txt fb-tr__txt">
            <h2 id="fb-tr-t" className="fb-h2" data-fb-rv="">Transparency is at the heart of who we are</h2>
            <p className="l-lede fb-tr__p" data-fb-rv="">The NEAR Foundation is a Swiss Stiftung. It is neither simple nor flexible to operate, by design: Swiss jurisdiction imposes strict regulatory oversight, and a Stiftung is legally bound to pursue its purpose. Funds given to it cannot be removed for any reason except the fulfillment of that purpose.</p>
            <p className="fb-tr__pull" data-fb-rv="">Transparency is not a value we chose. It is a condition of how we are built.</p>
            <b className="l-x fe-x" aria-hidden="true" /><b className="l-x fe-x fe-x--r" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* 5 · the Council: Foundation F's, on the Stack's dark (../foundation.css): the heading | the text and who reports to whom */}
      <section className="l-sec f-council" id="fb-council" aria-labelledby="fb-council-t">
        <div className="l-row f-council__row" data-row="">
          <div className="l-cell f-council__h">
            <i className="l-ic" data-icon="governance" data-icon-size="20" aria-hidden="true" />
            <h2 id="fb-council-t" className="l-h2 l-h2--m" data-rv="">The NEAR Foundation Council</h2>
          </div>
          <div className="l-cell f-council__b">
            <p className="l-lede" data-rv="">The NEAR Foundation Council is the governing body of the Foundation, responsible for its ultimate oversight and its most significant decisions. The Council is separate from the executive team, which the Council empowers to manage day-to-day operations and which reports back to it.</p>
            <ol className="f-chain" data-rv="" aria-label="Who reports to whom">
              <li><span className="f-chain__n">Council</span><span className="f-chain__r">Oversight and the most significant decisions</span></li>
              <li><span className="f-chain__n">Executive team</span><span className="f-chain__r">Day-to-day operations, reporting back to the Council</span></li>
            </ol>
          </div>
        </div>
      </section>

      {/* 6 · how the Foundation operates: one scene that morphs through the three activities (Operate.tsx) */}
      <OperateSection />

      {/* 7 · the ecosystem: the dApps grid as near.foundation shows it, on the ruled grid */}
      <section className="l-sec fb-eco" id="fb-ecosystem" aria-labelledby="fb-eco-t">
        <div className="l-row fb-eco__head" data-row="">
          <div className="l-cell fb-eco__h"><h2 id="fb-eco-t" className="fb-h2" data-rv="">Built by an <span className="accent">ecosystem</span>, not a company</h2></div>
          <div className="l-cell fb-eco__end">
            <p className="l-lede" data-rv="">Hundreds of applications, wallets, and protocols build on NEAR. The Foundation supports the ecosystem that builds them. The builders own what they make.</p>
            <p className="fb-eco__link" data-rv=""><a className="l-link" href={ECOSYSTEM}><span>Explore the ecosystem</span><Arrow /></a></p>
          </div>
        </div>
        <div className="l-row fb-eco__logos" data-row="">
          {/* [[TBD: the grid as our own files]] near.foundation's image, as the doc asks ("retain dApps logo grid from current site") */}
          <div className="l-cell fb-eco__cell"><img src="https://near.foundation/dapps-icons.svg" alt="Apps supported by NEAR Foundation" loading="lazy" decoding="async" data-rv="" /></div>
        </div>
      </section>

      {/* 8 · NEAR belongs to you: the close scene of the homepage (its stack of mail, shared/close-mail.css), with the doc's subhead and two buttons */}
      <section className="l-sec l-close" id="close" aria-labelledby="l-close-t">
        <div className="l-row l-spacer" data-row="" aria-hidden="true"><div className="l-cell" /></div>
        <div className="l-bleed-wrap">
          <div className="l-bleed l-close__bleed cs-mail" data-bleed="" data-close="">
            <div className="l-close__stage">
              <div className="l-ph l-bleed__ph l-close__ph" data-ph=""><div className="l-plate"><img className="l-img" src="/images/home/bw/close-mail-light.webp" alt="" loading="lazy" decoding="async" /></div></div>
              <div className="l-bleed__in l-close__in">
                <h2 id="l-close-t" className="l-display l-close__h">
                  <span className="l-close__logo">
                    <span className="sr-only">NEAR</span>
                    <svg className="l-close__svg" viewBox={LOCKUP_VIEWBOX} aria-hidden="true" focusable="false">
                      <defs><clipPath id="fe-close-clip"><rect x="520" y="100" width="1100" height="312" /></clipPath></defs>
                      <path className="l-close__m" d={LOCKUP_TILE} />
                      <g clipPath="url(#fe-close-clip)">{LOCKUP_LETTERS.map((d, c) => <path key={c} className="l-close__c" style={{ ["--c" as string]: c }} d={d} />)}</g>
                    </svg>
                  </span>
                  <span className="l-close__rest"> <span className="l-close__w" style={{ ["--w" as string]: 0 }}>belongs</span> <span className="l-close__w" style={{ ["--w" as string]: 1 }}>to</span> <span className="l-close__w accent" style={{ ["--w" as string]: 2 }}>you</span></span>
                </h2>
                <div className="l-close__nl fb-close__nl">
                  <p className="l-lede">Join the community, or build a career at the Foundation.</p>
                  <p className="fb-close__btns">
                    <a className="l-btn fb-btn--fill" href={COMMUNITY}><span>Join the community</span></a>
                    <a className="l-btn" href={CAREERS}><span>Careers</span></a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
