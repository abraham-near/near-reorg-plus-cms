"use client";
// near.org/foundation, version C: "The Stiftung". Dark, architectural, cinematic; home v4's brand (paper and ink, one green, Montreal with the Kepler accent,
// hairlines and + crosshairs, isometric line drawings) without v3's ruled grid. Copy: the October 2026 doc (near.org-airnauts (3)), verbatim.
// 1 the hero: the Foundation as a plinth, the ecosystem as green columns rising on it (ink, full screen; the camera eases in as paper rises over it)
// 2 the three pillars: a horizontal sequence, each with its drawing, the green moving along · 3 "Our goal is to make ourselves smaller": a statement that shrinks
// 4 transparency: the glass vault · 5 the Council: the diagram on ink · 6 how the Foundation operates: three numbered rows · 7 the ecosystem: the dApps strip
// 8 NEAR belongs to you: the hero's columns again, standing on their own.
import { Fragment, useRef, type CSSProperties, type ReactNode } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { LOCKUP_LETTERS, LOCKUP_TILE, LOCKUP_VIEWBOX } from "../../v3/proof-deeper/lockup";
import { HeroIso } from "./HeroIso";
import { IllNonprofit, IllEcosystem, IllDecentral, IllVault, IllCouncil, GlyphAllocate, GlyphFunctions, GlyphDevolve, IllClose } from "./Illus";
import { mount } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./foundation-c.css";

const PILLARS = [
  { t: "Nonprofit", b: "A Swiss nonprofit foundation (Stiftung), legally bound to its purpose, operating with the transparency that structure demands.", Ill: IllNonprofit },
  { t: "Ecosystem growth", b: "We support the growth of the NEAR ecosystem, directing resources to the people and projects building on it rather than competing with them.", Ill: IllEcosystem },
  { t: "Decentralization", b: "We champion a decentralized, self-sufficient ecosystem, and work to devolve our own functions to it over time.", Ill: IllDecentral },
];
const ACTS = [
  { t: "Allocate resources", b: "Ensure financial resources are properly allocated and distributed throughout the ecosystem.", G: GlyphAllocate },
  { t: "Support ecosystem functions", b: "Support ecosystem-level functions that do not yet have a steward, from communication and coordination to governance infrastructure and education.", G: GlyphFunctions },
  { t: "Champion decentralization", b: "Support the continuing devolution of functions and operations to the ecosystem itself.", G: GlyphDevolve },
];
// [[TBD: links]] Join the community / Careers: the doc names the buttons, not their targets
const COMMUNITY = "https://www.near.org/community", CAREERS = "https://careers.near.foundation", ECOSYSTEM = "https://www.near.org/ecosystem";
const idx = (i: number) => String(i + 1).padStart(2, "0");
const d = (n: number) => ({ "--d": `${n}s` }) as CSSProperties;

/** the h1, word by word: each word rises out of its own line, one after another */
const H1 = ["Enabling", "community-driven", "innovation", "to", "benefit", "people", "around", "the", "world."];
const Arrow = () => <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>;
const Kick = ({ children, n }: { children: ReactNode; n?: string }) => (
  <p className="fc-kick" data-rv="">{n && <span className="fc-kick__n">{n}</span>}<span className="t-label">{children}</span></p>
);

export function FoundationC() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);
  return (
    <div ref={ref} className="l-page fc">
      {/* 1 · hero */}
      <section className="fc-hero" data-nav-tone="dark" aria-labelledby="fc-h1">
        <div className="fc-hero__stage">
          <div className="fc-hero__glow" aria-hidden="true" />
          <div className="fc-hero__art" aria-hidden="true"><div className="fc-hero__cam"><HeroIso /></div></div>
          <div className="fc-hero__frame" aria-hidden="true"><i /><i /></div>
          <div className="fc-hero__copy">
            <p className="fc-hero__k" data-hr=""><i className="l-ic l-ic--s" data-icon="foundation" data-icon-size="16" aria-hidden="true" /><span className="t-label">NEAR Foundation</span></p>
            <h1 id="fc-h1" className="fc-h1">
              {H1.map((w, i) => (
                <Fragment key={w}>{i > 0 && " "}<span className={w.includes("-") ? "fc-w l-nb" : "fc-w"}><span className={w === "people" ? "accent" : undefined} style={{ "--w": i } as CSSProperties}>{w}</span></span></Fragment>
              ))}
            </h1>
            <p className="fc-hero__sub" data-hr="">NEAR Foundation is a Swiss nonprofit supporting the open infrastructure for the agent economy, where you own your assets, your intelligence, and your world. Our mandate is to place that infrastructure in the hands of the community it serves.</p>
          </div>
          <div className="fc-hud" data-hr="">
            <ul aria-label="The Foundation">
              <li><span className="fc-hud__dot" aria-hidden="true" />Swiss Stiftung</li>
              <li>Nonprofit</li>
              <li>Bound to its purpose</li>
            </ul>
            <a className="fc-hud__go" href="#fc-pillars"><span>Scroll</span><svg viewBox="0 0 10 14" aria-hidden="true" focusable="false"><path d="M5 1v11M1.5 8.5 5 12l3.5-3.5" /></svg></a>
          </div>
        </div>
      </section>

      {/* 2 · the three pillars: a horizontal sequence (desktop), the green moving along */}
      <section className="fc-pil" id="fc-pillars" aria-labelledby="fc-pil-t">
        <div className="fc-pil__stage">
          <div className="fc-pil__head">
            <h2 id="fc-pil-t" className="t-label fc-pil__label">What the Foundation is</h2>
            <div className="fc-prog" aria-hidden="true"><span className="fc-prog__n">01</span><span className="fc-prog__bar"><b /></span><span className="fc-prog__n">03</span></div>
          </div>
          <ol className="fc-pil__track">
            {PILLARS.map((p, i) => (
              <li key={p.t} className="fc-pil__panel" data-i={i}>
                <div className="fc-pil__art" data-ill=""><p.Ill /></div>
                <div className="fc-pil__txt">
                  <span className="fc-pil__n">{idx(i)}</span>
                  <h3 className="fc-pil__t">{p.t}</h3>
                  <p className="fc-pil__b">{p.b}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 3 · our goal is to make ourselves smaller: the statement shrinks as you read on */}
      <section className="fc-small" id="fc-mission" aria-labelledby="fc-small-t">
        <div className="fc-small__stage">
          <h2 id="fc-small-t" className="fc-small__h">
            <span className="fc-small__l">Our goal</span> <span className="fc-small__l">is to make</span> <span className="fc-small__l">ourselves</span> <span className="fc-small__l"><span className="accent fc-small__acc">smaller.</span><span className="fc-small__sq" aria-hidden="true" /></span>
          </h2>
          <div className="fc-small__body">
            <p className="fc-small__lead"><span className="fc-sn">Most organizations exist to grow.</span> <span className="fc-sn">The NEAR Foundation exists to devolve.</span></p>
            <p className="fc-small__p"><span className="fc-sn">Our purpose is to support the ecosystem until it operates without us, moving functions and resources into the hands of the community and the decentralized infrastructure that carries them.</span> <span className="fc-sn">This is what ownership means at the level of the network itself: NEAR is built to belong to the people who use it.</span></p>
            <p className="fc-small__end"><span className="fc-sn">We support the network. We do not control it, and by design we could not.</span></p>
          </div>
        </div>
      </section>

      {/* 4 · transparency: the glass vault */}
      <section className="fc-tr" id="fc-transparency" aria-labelledby="fc-tr-t">
        <div className="fc-tr__grid">
          <div className="fc-tr__txt">
            <Kick>Swiss Stiftung</Kick>
            <h2 id="fc-tr-t" className="l-h2 fc-h2" data-rv="" style={d(0.08)}>Transparency is at the <span className="accent">heart</span> of who we are.</h2>
            <p className="l-lede fc-tr__body" data-rv="" style={d(0.16)}>The NEAR Foundation is a Swiss Stiftung. It is neither simple nor flexible to operate, by design: Swiss jurisdiction imposes strict regulatory oversight, and a Stiftung is legally bound to pursue its purpose. Funds given to it cannot be removed for any reason except the fulfillment of that purpose.</p>
            <p className="fc-tr__pull" data-rv="" style={d(0.24)}>Transparency is not a value we chose. It is a condition of how we are built.</p>
          </div>
          <figure className="fc-tr__fig" data-ill=""><IllVault /></figure>
        </div>
      </section>

      {/* 5 · the Council, on ink */}
      <section className="fc-cn" id="fc-council" data-nav-tone="dark" aria-labelledby="fc-cn-t">
        <div className="fc-cn__grid">
          <div className="fc-cn__txt">
            <h2 id="fc-cn-t" className="l-h2 fc-h2" data-rv="" style={d(0.08)}>The NEAR Foundation <span className="accent">Council.</span></h2>
            <p className="l-lede fc-cn__body" data-rv="" style={d(0.16)}>The NEAR Foundation Council is the governing body of the Foundation, responsible for its ultimate oversight and its most significant decisions. The Council is separate from the executive team, which the Council empowers to manage day-to-day operations and which reports back to it.</p>
          </div>
          <figure className="fc-cn__fig" data-ill=""><IllCouncil /></figure>
        </div>
      </section>

      {/* 6 · how the Foundation operates: three numbered rows */}
      <section className="fc-op" id="fc-operates" aria-labelledby="fc-op-t">
        <div className="fc-op__head">
          <h2 id="fc-op-t" className="l-h2 fc-h2" data-rv="">How the Foundation <span className="accent">operates.</span></h2>
          <p className="l-lede" data-rv="" style={d(0.1)}>As one of the larger nodes supporting a decentralized ecosystem, the Foundation limits itself to indirect support. Its primary lever is the financial resources in its treasury, and its operations are deliberately lightweight, directed at three activities.</p>
        </div>
        <ol className="fc-op__rows">
          {ACTS.map((a, i) => (
            <li key={a.t} className="fc-op__row" data-rv="" style={d(i * 0.08)}>
              <span className="fc-op__n" aria-hidden="true">{idx(i)}</span>
              <div className="fc-op__g"><a.G /></div>
              <h3 className="fc-op__t">{a.t}</h3>
              <p className="fc-op__b">{a.b}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 7 · the ecosystem */}
      <section className="fc-eco" id="fc-ecosystem" aria-labelledby="fc-eco-t">
        <div className="fc-eco__head">
          <h2 id="fc-eco-t" className="l-h2 fc-h2" data-rv="">Built by an <span className="accent">ecosystem,</span> not a company.</h2>
          <p className="l-lede" data-rv="" style={d(0.1)}>Hundreds of applications, wallets, and protocols build on NEAR. The Foundation supports the ecosystem that builds them. The builders own what they make.</p>
          <p data-rv="" style={d(0.18)}><a className="l-link" href={ECOSYSTEM}><span>Explore the ecosystem</span><Arrow /></a></p>
        </div>
        <div className="fc-eco__panel" data-rv="">
          {/* [[TBD: the grid as our own files]] near.foundation's image, as the doc asks ("retain dApps logo grid from current site") */}
          {/* eslint-disable-next-line @next/next/no-img-element -- near.foundation's own SVG, kept as is */}
          <img className="fc-eco__img" src="https://near.foundation/dapps-icons.svg" alt="Apps supported by NEAR Foundation" loading="lazy" decoding="async" width={1440} height={249} />
        </div>
      </section>

      {/* 8 · NEAR belongs to you */}
      <section className="fc-close" id="close" aria-labelledby="fc-close-t">
        <div className="fc-close__in">
          <h2 id="fc-close-t" className="l-display fc-close__h" data-rv="">
            <span className="fc-close__logo"><span className="sr-only">NEAR</span>
              <svg viewBox={LOCKUP_VIEWBOX} aria-hidden="true" focusable="false"><path d={LOCKUP_TILE} />{LOCKUP_LETTERS.map((p, c) => <path key={c} d={p} />)}</svg>
            </span> belongs to <span className="accent">you.</span>
          </h2>
          <p className="l-lede fc-close__sub" data-rv="" style={d(0.1)}>Join the community, or build a career at the Foundation.</p>
          <p className="fc-close__btns" data-rv="" style={d(0.18)}>
            <a className="l-btn fc-btn--fill" href={COMMUNITY}><span>Join the community</span></a>
            <a className="l-btn" href={CAREERS}><span>Careers</span></a>
          </p>
        </div>
        <figure className="fc-close__fig" data-ill=""><IllClose /></figure>
      </section>
    </div>
  );
}
