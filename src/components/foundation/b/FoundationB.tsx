"use client";
// near.org/foundation, version B ("Devolve"): the page told by its drawings, in home v4's hand (paper, ink, one green, Montreal with a Kepler accent, isometric
// line art). Copy: the October 2026 doc (near.org-airnauts (3), "near.org/foundation — Page Copy"), verbatim.
//   1 the hero: the Foundation, one block, parts into the ecosystem as you scroll (HeroIso.tsx, hero-motion.ts);
//   2 three pillars, each with its own drawing, set as a descending stair (no grid);
//   3 "make ourselves smaller": one statement, its last word shrinking into place as you scroll;
//   4 transparency: a glass Stiftung, its funds in view;
//   5 the Council, on the Stack's ink: a diagram of who empowers whom and who reports back;
//   6 how the Foundation operates: a sticky story, three activities stepping one drawing through three states;
//   7 the ecosystem: the dApps grid from near.foundation, on the ruled grid (v3's rows, the brand's one ruled moment here);
//   8 NEAR belongs to you: the homepage's close scene, with the doc's subhead and two buttons.
import { useRef, type ReactNode } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { LOCKUP_LETTERS, LOCKUP_TILE, LOCKUP_VIEWBOX } from "../../v3/proof-deeper/lockup";
import { HeroIso } from "./HeroIso";
import { ArtCouncil, ArtGlass, ArtGrowth, ArtLattice, ArtOperate, ArtVault } from "./Art";
import { mountAll } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./foundation-b.css";

const PILLARS = [
  { t: "Nonprofit", b: "A Swiss nonprofit foundation (Stiftung), legally bound to its purpose, operating with the transparency that structure demands.", Art: ArtVault },
  { t: "Ecosystem growth", b: "We support the growth of the NEAR ecosystem, directing resources to the people and projects building on it rather than competing with them.", Art: ArtGrowth },
  { t: "Decentralization", b: "We champion a decentralized, self-sufficient ecosystem, and work to devolve our own functions to it over time.", Art: ArtLattice },
];
const ACTS = [
  { t: "Allocate resources", b: "Ensure financial resources are properly allocated and distributed throughout the ecosystem." },
  { t: "Support ecosystem functions", b: "Support ecosystem-level functions that do not yet have a steward, from communication and coordination to governance infrastructure and education." },
  { t: "Champion decentralization", b: "Support the continuing devolution of functions and operations to the ecosystem itself." },
];
// [[TBD: links]] Join the community / Careers: the doc names the buttons, not their targets
const COMMUNITY = "https://www.near.org/community", CAREERS = "https://careers.near.foundation", ECOSYSTEM = "https://www.near.org/ecosystem";
const idx = (i: number) => String(i + 1).padStart(2, "0");

const Arrow = () => (
  <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
/** a line of words, each in its own window (the hero's words rise out of them); `accent` names the word set in Kepler */
function Words({ text, accent }: { text: string; accent?: string }) {
  const out: ReactNode[] = [];
  text.split(" ").forEach((w, i) => {
    if (i) out.push(" ");
    out.push(<span key={i} className="fb-w"><span className={`fb-wi${w === accent ? " accent" : ""}`}>{w}</span></span>);
  });
  return <>{out}</>;
}

export function FoundationB() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mountAll);
  return (
    <div ref={ref} className="l-page fb-page">
      {/* 1 · hero: the Foundation, one block, becomes the ecosystem */}
      <section className="fb-hero" data-hero="" aria-labelledby="fb-h1">
        <div className="fb-hero__stage">
          <HeroIso />
          <div className="fb-hero__copy">
            <p className="fb-kick t-label" data-hero-rv=""><i aria-hidden="true" />NEAR Foundation</p>
            <h1 id="fb-h1" className="fb-h1"><Words text="Enabling community-driven innovation to benefit people around the world" accent="people" /></h1>
            <p className="fb-hero__sub" data-hero-rv="">NEAR Foundation is a Swiss nonprofit supporting the open infrastructure for the agent economy, where you own your assets, your intelligence, and your world. Our mandate is to place that infrastructure in the hands of the community it serves.</p>
          </div>
          <div className="fb-hud" data-hero-rv="" aria-hidden="true">
            <span className="t-label">Foundation</span><span className="fb-hud__track"><span className="fb-hud__fill" /></span><span className="t-label">Ecosystem</span>
          </div>
        </div>
      </section>

      {/* 2 · three pillars: a descending stair, each with its drawing */}
      <section className="fb-pillars" id="fb-pillars" aria-labelledby="fb-pillars-t">
        <h2 id="fb-pillars-t" className="sr-only">What the Foundation is</h2>
        <ol className="fb-pillars__list">
          {PILLARS.map(({ t, b, Art }, i) => (
            <li key={t} className="fb-pillar" data-pillar={i}>
              <div className="fb-pillar__art"><Art /></div>
              <div className="fb-pillar__txt" data-fb-rv="">
                <span className="fb-n">{idx(i)}</span>
                <h3 className="fb-h3">{t}</h3>
                <p className="fb-body">{b}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 3 · the thesis: one statement; its last word shrinks into place */}
      <section className="fb-mission" id="fb-mission" data-mission="" aria-labelledby="fb-mission-t">
        <div className="fb-mission__stage">
          <h2 id="fb-mission-t" className="fb-mission__h">
            <span className="fb-mission__lead">Our goal is to make ourselves</span>{" "}
            <span className="fb-mission__sm"><span className="fb-mission__smi accent">smaller</span></span>
          </h2>
          <p className="fb-mission__b l-lede">Most organizations exist to grow. The NEAR Foundation exists to devolve. Our purpose is to support the ecosystem until it operates without us, moving functions and resources into the hands of the community and the decentralized infrastructure that carries them. This is what ownership means at the level of the network itself: NEAR is built to belong to the people who use it. We support the network. We do not control it, and by design we could not.</p>
        </div>
      </section>

      {/* 4 · transparency: the glass Stiftung */}
      <section className="fb-tr" id="fb-transparency" aria-labelledby="fb-tr-t">
        <div className="fb-tr__in">
          <figure className="fb-tr__art" data-glass=""><ArtGlass /></figure>
          <div className="fb-tr__txt">
            <h2 id="fb-tr-t" className="fb-h2" data-fb-rv="">Transparency is at the heart of <span className="accent">who we are</span></h2>
            <p className="l-lede fb-tr__p" data-fb-rv="">The NEAR Foundation is a Swiss Stiftung. It is neither simple nor flexible to operate, by design: Swiss jurisdiction imposes strict regulatory oversight, and a Stiftung is legally bound to pursue its purpose. Funds given to it cannot be removed for any reason except the fulfillment of that purpose.</p>
            <p className="fb-tr__pull" data-fb-rv="">Transparency is not a value we chose. It is a condition of how we are built.</p>
          </div>
        </div>
      </section>

      {/* 5 · the Council, on the Stack's ink */}
      <section className="fb-council" id="fb-council" aria-labelledby="fb-council-t">
        <div className="fb-council__in">
          <div className="fb-council__txt">
            <h2 id="fb-council-t" className="fb-h2" data-fb-rv="">The NEAR Foundation <span className="accent">Council</span></h2>
            <p className="l-lede" data-fb-rv="">The NEAR Foundation Council is the governing body of the Foundation, responsible for its ultimate oversight and its most significant decisions. The Council is separate from the executive team, which the Council empowers to manage day-to-day operations and which reports back to it.</p>
          </div>
          <figure className="fb-council__art" data-council=""><ArtCouncil /></figure>
        </div>
      </section>

      {/* 6 · how the Foundation operates: a sticky story in three states */}
      <section className="fb-op" id="fb-operates" data-op="" aria-labelledby="fb-op-t">
        <div className="fb-op__head">
          <h2 id="fb-op-t" className="fb-h2" data-fb-rv="">How the Foundation <span className="accent">operates</span></h2>
          <p className="l-lede" data-fb-rv="">As one of the larger nodes supporting a decentralized ecosystem, the Foundation limits itself to indirect support. Its primary lever is the financial resources in its treasury, and its operations are deliberately lightweight, directed at three activities.</p>
        </div>
        <div className="fb-op__story">
          <div className="fb-op__fig">
            <div className="fb-op__sticky">
              <ArtOperate />
              <p className="fb-op__count" aria-hidden="true"><span className="fb-op__ci"><span>01</span><span>02</span><span>03</span></span><span>/ 03</span></p>
            </div>
          </div>
          <div className="fb-op__list">
          <span className="fb-op__rail" aria-hidden="true"><span className="fb-op__fill" /></span>
          <ol className="fb-op__steps">
            {ACTS.map((a, i) => (
              <li key={a.t} className="fb-op__step" data-step={i}>
                <span className="fb-n">{idx(i)}</span>
                <h3 className="fb-h3">{a.t}</h3>
                <p className="fb-body">{a.b}</p>
              </li>
            ))}
          </ol>
          </div>
        </div>
      </section>

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

      {/* 8 · NEAR belongs to you: the close scene of the homepage, with the doc's subhead and two buttons */}
      <section className="l-sec l-close" id="close" aria-labelledby="l-close-t">
        <div className="l-row l-spacer" data-row="" aria-hidden="true"><div className="l-cell" /></div>
        <div className="l-bleed-wrap">
          <div className="l-bleed l-close__bleed" data-bleed="" data-close="">
            <div className="l-close__stage">
              <div className="l-ph l-bleed__ph l-close__ph" data-ph=""><div className="l-plate"><img className="l-img" src="/v3/bleed-meadow.webp" alt="" loading="lazy" decoding="async" /></div></div>
              <div className="l-bleed__in l-close__in">
                <h2 id="l-close-t" className="l-display l-close__h">
                  <span className="l-close__logo">
                    <span className="sr-only">NEAR</span>
                    <svg className="l-close__svg" viewBox={LOCKUP_VIEWBOX} aria-hidden="true" focusable="false">
                      <defs><clipPath id="fb-close-clip"><rect x="520" y="100" width="1100" height="312" /></clipPath></defs>
                      <path className="l-close__m" d={LOCKUP_TILE} />
                      <g clipPath="url(#fb-close-clip)">{LOCKUP_LETTERS.map((d, c) => <path key={c} className="l-close__c" style={{ ["--c" as string]: c }} d={d} />)}</g>
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
