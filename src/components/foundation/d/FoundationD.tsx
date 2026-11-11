"use client";
// near.org/foundation, version D: "People around the world" (the network, light and open). Home v4's paper, ink and one green; the rail's isometric
// illustrations; fewer ruled rows, more scenes. Copy: the October 2026 doc (near.org-airnauts (3), "near.org/foundation — Page Copy"), verbatim.
// 1 the world (canvas, hero.ts) · 2 three pillars (tall illustrated cards that tilt) · 3 the devolution (a sticky split: the Foundation's slab gets smaller
// while the ecosystem multiplies, devolve.ts) · 4 transparency (the ridges, a card over them) · 5 the Council (an iso diagram on ink) · 6 how the
// Foundation operates (a horizontal track of three illustrated cards) · 7 the ecosystem (the dApps strip as a marquee) · 8 NEAR belongs to you (the
// homepage's close scene, driven by v3's motion). Motion: ./motion.ts.
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { LOCKUP_LETTERS, LOCKUP_TILE, LOCKUP_VIEWBOX } from "../../v3/proof-deeper/lockup";
import { IlloNonprofit, IlloGrowth, IlloDecentral, IlloAllocate, IlloFunctions, IlloChampion, IlloCouncil } from "./illos";
import { mount } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./foundation-d.css";

const PILLARS = [
  { Art: IlloNonprofit, t: "Nonprofit", b: "A Swiss nonprofit foundation (Stiftung), legally bound to its purpose, operating with the transparency that structure demands." },
  { Art: IlloGrowth, t: "Ecosystem growth", b: "We support the growth of the NEAR ecosystem, directing resources to the people and projects building on it rather than competing with them." },
  { Art: IlloDecentral, t: "Decentralization", b: "We champion a decentralized, self-sufficient ecosystem, and work to devolve our own functions to it over time." },
];
const ACTS = [
  { Art: IlloAllocate, t: "Allocate resources", b: "Ensure financial resources are properly allocated and distributed throughout the ecosystem." },
  { Art: IlloFunctions, t: "Support ecosystem functions", b: "Support ecosystem-level functions that do not yet have a steward, from communication and coordination to governance infrastructure and education." },
  { Art: IlloChampion, t: "Champion decentralization", b: "Support the continuing devolution of functions and operations to the ecosystem itself." },
];
// the devolution's body, in the order it is read (the doc's one paragraph, split where its sentences turn)
const STEPS = [
  "Most organizations exist to grow. The NEAR Foundation exists to devolve.",
  "Our purpose is to support the ecosystem until it operates without us, moving functions and resources into the hands of the community and the decentralized infrastructure that carries them.",
  "This is what ownership means at the level of the network itself: NEAR is built to belong to the people who use it.",
  "We support the network. We do not control it, and by design we could not.",
];
const CHIPS = ["APPS", "COMMUNITY", "BUILDERS", "NEAR FOUNDATION"];
// [[TBD: links]] Join the community / Careers: the doc names the buttons, not their targets
const COMMUNITY = "https://www.near.org/community", CAREERS = "https://careers.near.foundation", ECOSYSTEM = "https://www.near.org/ecosystem";
const DAPPS = "https://near.foundation/dapps-icons.svg";
const idx = (i: number) => String(i + 1).padStart(2, "0");

const Arrow = () => (
  <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
const Chip = ({ label, cls = "" }: { label: string; cls?: string }) => (
  <span className={`fd-chip${label === "NEAR FOUNDATION" ? " fd-chip--f" : ""}${cls ? " " + cls : ""}`} data-chip={label}><i />{label}</span>
);

export function FoundationD() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);
  return (
    <div ref={ref} className="l-page fd">
      {/* 1 · the world */}
      <section className="fd-hero" aria-labelledby="fd-h1">
        <div className="fd-hero__stage">
          <canvas className="fd-hero__cv" aria-hidden="true" />
          <div className="fd-hero__chips" aria-hidden="true">{CHIPS.map((c) => <Chip key={c} label={c} />)}</div>
          <div className="fd-hero__copy">
            <p className="fd-kicker"><span className="fd-kicker__dot" aria-hidden="true" />NEAR Foundation</p>
            <h1 id="fd-h1" className="fd-h1">
              <span className="fd-ln"><span>Enabling <span className="l-nb">community-driven</span></span></span>{" "}
              <span className="fd-ln"><span>innovation to benefit <span className="accent">people</span></span></span>{" "}
              <span className="fd-ln"><span>around the world<span className="fd-sq" aria-hidden="true" /><span className="sr-only">.</span></span></span>
            </h1>
            <p className="fd-hero__sub">NEAR Foundation is a Swiss nonprofit supporting the open infrastructure for the agent economy, where you own your assets, your intelligence, and your world. Our mandate is to place that infrastructure in the hands of the community it serves.</p>
          </div>
        </div>
      </section>

      {/* 2 · three pillars */}
      <section className="fd-sec fd-pillars" aria-labelledby="fd-pillars-t">
        <h2 id="fd-pillars-t" className="sr-only">What the Foundation is</h2>
        <ul className="fd-pillars__list">
          {PILLARS.map(({ Art, t, b }, i) => (
            <li key={t} className="fd-card" data-tilt="" data-fd="" style={{ ["--i" as string]: i }}>
              <div className="fd-card__in">
                <div className="fd-card__art"><Art /></div>
                <div className="fd-card__body">
                  <span className="fd-card__n">{idx(i)}</span>
                  <h3 className="fd-h3">{t}</h3>
                  <p className="fd-card__b">{b}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 3 · the devolution: the slab gets smaller, the ecosystem multiplies */}
      <section className="fd-dev" aria-labelledby="fd-dev-t">
        <div className="fd-dev__fig" aria-hidden="true">
          <div className="fd-dev__stage">
            <div className="fd-dev__cvbox"><canvas className="fd-dev__cv" /></div>
            <Chip label="NEAR FOUNDATION" cls="fd-dev__chip" />
            <div className="fd-dev__meter"><span>Foundation</span><b><i /></b><span>Ecosystem</span></div>
          </div>
        </div>
        <div className="fd-dev__txt">
          <h2 id="fd-dev-t" className="l-h2 fd-dev__h">Our goal is to make ourselves <span className="accent">smaller</span></h2>
          <div className="fd-dev__steps">
            {STEPS.map((s, i) => <p key={i} className="fd-step" data-step=""><span className="fd-step__n" aria-hidden="true">{idx(i)}</span>{s}</p>)}
          </div>
        </div>
      </section>

      {/* 4 · transparency: the Stiftung, over the ridges */}
      <section className="fd-tr" aria-labelledby="fd-tr-t">
        <div className="fd-tr__ph" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- a local webp, art-directed by CSS (cover + parallax) */}
          <img className="fd-tr__img" src="/v3/bleed-ridges.webp" alt="" loading="lazy" decoding="async" />
        </div>
        <div className="fd-tr__in">
          <div className="fd-tr__card" data-fd="">
            <b className="fd-x fd-x--tl" aria-hidden="true" /><b className="fd-x fd-x--tr" aria-hidden="true" /><b className="fd-x fd-x--bl" aria-hidden="true" /><b className="fd-x fd-x--br" aria-hidden="true" />
            <Chip label="STIFTUNG" cls="fd-tr__chip" />
            <h2 id="fd-tr-t" className="l-h2 fd-tr__h">Transparency is at the heart of <span className="accent">who we are</span></h2>
            <p className="l-lede fd-tr__b">The NEAR Foundation is a Swiss Stiftung. It is neither simple nor flexible to operate, by design: Swiss jurisdiction imposes strict regulatory oversight, and a Stiftung is legally bound to pursue its purpose. Funds given to it cannot be removed for any reason except the fulfillment of that purpose. Transparency is not a value we chose. It is a condition of how we are built.</p>
          </div>
        </div>
      </section>

      {/* 5 · the Council, as a diagram on ink */}
      <section className="fd-co" aria-labelledby="fd-co-t">
        <div className="fd-co__in">
          <div className="fd-co__txt" data-fd="">
            <h2 id="fd-co-t" className="l-h2 fd-co__h">The NEAR Foundation <span className="accent">Council</span></h2>
            <p className="l-lede fd-co__b">The NEAR Foundation Council is the governing body of the Foundation, responsible for its ultimate oversight and its most significant decisions. The Council is separate from the executive team, which the Council empowers to manage day-to-day operations and which reports back to it.</p>
          </div>
          <figure className="fd-co__fig" data-fd=""><IlloCouncil /></figure>
        </div>
      </section>

      {/* 6 · how the Foundation operates: a horizontal track (desktop) */}
      <section className="fd-op" aria-labelledby="fd-op-t">
        <div className="fd-op__pin">
          <div className="fd-op__track">
            <div className="fd-op__intro" data-fd="">
              <h2 id="fd-op-t" className="l-h2 fd-op__h">How the Foundation <span className="accent">operates</span></h2>
              <p className="l-lede">As one of the larger nodes supporting a decentralized ecosystem, the Foundation limits itself to indirect support. Its primary lever is the financial resources in its treasury, and its operations are deliberately lightweight, directed at three activities.</p>
            </div>
            <ol className="fd-op__list">
              {ACTS.map(({ Art, t, b }, i) => (
                <li key={t} className="fd-op__card" data-fd="">
                  <div className="fd-op__art"><Art /></div>
                  <div className="fd-op__body">
                    <span className="fd-card__n">{idx(i)} <span className="fd-op__of">/ 03</span></span>
                    <h3 className="fd-h3">{t}</h3>
                    <p className="fd-card__b">{b}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="fd-op__bar" aria-hidden="true"><b /></div>
        </div>
      </section>

      {/* 7 · the ecosystem: the dApps strip from near.foundation, as a marquee */}
      <section className="fd-eco" aria-labelledby="fd-eco-t">
        <h2 id="fd-eco-t" className="fd-eco__h" data-fd="">Built by an <span className="accent">ecosystem</span>, not a company</h2>
        {/* [[TBD: the strip as our own files]] near.foundation's image, as the doc asks ("retain dApps logo grid from current site") */}
        <div className="fd-eco__mq">
          <div className="fd-eco__track">
            {[0, 1, 2, 3].map((k) => (
              <div key={k} className="fd-eco__tile" aria-hidden={k ? "true" : undefined}>
                {/* eslint-disable-next-line @next/next/no-img-element -- near.foundation's own SVG, kept as is */}
                <img src={DAPPS} alt={k ? "" : "Apps supported by NEAR Foundation"} loading="lazy" decoding="async" width={1440} height={249} />
              </div>
            ))}
          </div>
        </div>
        <div className="fd-eco__foot" data-fd="">
          <p className="l-lede">Hundreds of applications, wallets, and protocols build on NEAR. The Foundation supports the ecosystem that builds them. The builders own what they make.</p>
          <a className="l-link" href={ECOSYSTEM}><span>Explore the ecosystem</span><Arrow /></a>
        </div>
      </section>

      {/* 8 · NEAR belongs to you: the homepage's close scene, with the doc's subhead and two buttons */}
      <section className="l-sec l-close fd-close" id="close" aria-labelledby="fd-close-t">
        <div className="l-bleed-wrap">
          <div className="l-bleed l-close__bleed" data-bleed="" data-close="">
            <div className="l-close__stage">
              <div className="l-ph l-bleed__ph l-close__ph" data-ph="">
                {/* eslint-disable-next-line @next/next/no-img-element -- the close scene's plate (v3's markup) */}
                <div className="l-plate"><img className="l-img" src="/v3/bleed-meadow.webp" alt="" loading="lazy" decoding="async" /></div>
              </div>
              <div className="l-bleed__in l-close__in">
                <h2 id="fd-close-t" className="l-display l-close__h">
                  <span className="l-close__logo">
                    <span className="sr-only">NEAR</span>
                    <svg className="l-close__svg" viewBox={LOCKUP_VIEWBOX} aria-hidden="true" focusable="false">
                      <defs><clipPath id="fd-close-clip"><rect x="520" y="100" width="1100" height="312" /></clipPath></defs>
                      <path className="l-close__m" d={LOCKUP_TILE} />
                      <g clipPath="url(#fd-close-clip)">{LOCKUP_LETTERS.map((d, c) => <path key={c} className="l-close__c" style={{ ["--c" as string]: c }} d={d} />)}</g>
                    </svg>
                  </span>
                  <span className="l-close__rest"> <span className="l-close__w" style={{ ["--w" as string]: 0 }}>belongs</span> <span className="l-close__w" style={{ ["--w" as string]: 1 }}>to</span> <span className="l-close__w accent" style={{ ["--w" as string]: 2 }}>you</span></span>
                </h2>
                <div className="l-close__nl fd-close__nl">
                  <p className="l-lede">Join the community, or build a career at the Foundation.</p>
                  <p className="fd-close__btns">
                    <a className="l-btn fd-btn--fill" href={COMMUNITY}><span>Join the community</span></a>
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
