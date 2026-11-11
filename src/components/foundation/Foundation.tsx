"use client";
// near.org/foundation in home v4's design: v3's ruled page (proof-deeper.css: rows, cells, crosshairs, [data-rv] arrivals, photos, the close scene; motion.ts
// runs it all), with the copy of the October 2026 doc (near.org-airnauts (3), "near.org/foundation — Page Copy") verbatim.
// Sections: the hero, three pillars (under a green rule), the devolution thesis (a block that gives itself away as you scroll), transparency (the ridges),
// the Council (on the Stack's dark), how the Foundation operates (three activities), the ecosystem (the dApps grid from near.foundation), NEAR belongs to you.
import { useRef } from "react";
import { useScrollMotion, type Mount } from "@/lib/motion/scroll";
import { mount as gridMount } from "../v3/proof-deeper/motion";
import { LOCKUP_LETTERS, LOCKUP_TILE, LOCKUP_VIEWBOX } from "../v3/proof-deeper/lockup";
import "../v3/proof-deeper/proof-deeper.css";
import "./foundation.css";

const PILLARS = [
  { icon: "foundation", t: "Nonprofit", b: "A Swiss nonprofit foundation (Stiftung), legally bound to its purpose, operating with the transparency that structure demands." },
  { icon: "solutions", t: "Ecosystem growth", b: "We support the growth of the NEAR ecosystem, directing resources to the people and projects building on it rather than competing with them." },
  { icon: "people", t: "Decentralization", b: "We champion a decentralized, self-sufficient ecosystem, and work to devolve our own functions to it over time." },
];
const ACTS = [
  { icon: "economics", t: "Allocate resources", b: "Ensure financial resources are properly allocated and distributed throughout the ecosystem." },
  { icon: "governance", t: "Support ecosystem functions", b: "Support ecosystem-level functions that do not yet have a steward, from communication and coordination to governance infrastructure and education." },
  { icon: "people", t: "Champion decentralization", b: "Support the continuing devolution of functions and operations to the ecosystem itself." },
];
const TOC = [
  { id: "f-pillars", t: "What we are" }, { id: "f-mission", t: "Our goal" }, { id: "f-transparency", t: "Transparency" },
  { id: "f-council", t: "The Council" }, { id: "f-operates", t: "How we operate" }, { id: "f-ecosystem", t: "The ecosystem" },
];
// [[TBD: links]] Join the community / Careers: the doc names the buttons, not their targets
const COMMUNITY = "https://www.near.org/community", CAREERS = "https://careers.near.foundation", ECOSYSTEM = "https://www.near.org/ecosystem";
const idx = (i: number) => String(i + 1).padStart(2, "0");

const Arrow = () => (
  <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);

/* the devolution: one block (the Foundation) breaks into 36 pieces that spread over a lattice (the ecosystem) as you scroll; the block keeps a small core.
   Each piece starts inside the block and ends on its own lattice point; --p (0..1) is set by mountDevolve. */
const GRID = 9, STEP = 44, ORIGIN = 200 - ((GRID - 1) * STEP) / 2;
const PIECES = (() => {
  const out: { x0: number; y0: number; x1: number; y1: number; g: boolean; d: number }[] = [];
  let k = 0;
  for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) {
    const x1 = ORIGIN + c * STEP, y1 = ORIGIN + r * STEP, dc = Math.abs(c - 4), dr = Math.abs(r - 4);
    if (dc <= 1 && dr <= 1) continue;          /* the core keeps the middle */
    if ((c * 7 + r * 3) % 5 === 0) continue;   /* a sparse lattice: some points stay empty */
    const x0 = 200 + ((k * 37) % 9 - 4) * 9, y0 = 200 + ((k * 53) % 9 - 4) * 9;
    out.push({ x0, y0, x1, y1, g: (c + r * 2) % 7 === 0, d: Math.max(dc, dr) / 4 }); k++;
  }
  return out;
})();

const mountDevolve: Mount = (root, { reduced, ScrollTrigger }) => {
  const fig = root.querySelector<HTMLElement>(".f-dev"); if (!fig) return;
  if (reduced) { fig.style.setProperty("--p", "1"); return; }
  const st = ScrollTrigger.create({
    trigger: fig, start: "top 85%", end: "bottom 30%", scrub: 0.6,
    onUpdate: (s) => fig.style.setProperty("--p", s.progress.toFixed(4)),
  });
  return () => st.kill();
};
const mountAll: Mount = (root, ctx) => {
  const a = gridMount(root, ctx), b = mountDevolve(root, ctx);
  return () => { if (typeof a === "function") a(); if (typeof b === "function") b(); };
};

export function Foundation() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mountAll);
  return (
    <div ref={ref} className="l-page f-page">
      {/* 1 · hero */}
      <section className="l-sec f-hero" aria-labelledby="f-h1">
        <div className="l-row f-hero__top" data-row="">
          <div className="l-cell f-hero__k"><i className="l-ic l-ic--s" data-icon="foundation" data-icon-size="16" aria-hidden="true" /><span className="t-label">NEAR Foundation</span></div>
        </div>
        <div className="l-row f-hero__h" data-row="">
          <div className="l-cell">
            <h1 id="f-h1" className="l-display f-h1" data-rv="">Enabling <span className="l-nb">community-driven</span> innovation to benefit <span className="accent">people</span> around the world</h1>
          </div>
        </div>
        <div className="l-row f-hero__b" data-row="">
          <div className="l-cell f-hero__sub"><p className="l-lede" data-rv="">NEAR Foundation is a Swiss nonprofit supporting the open infrastructure for the agent economy, where you own your assets, your intelligence, and your world. Our mandate is to place that infrastructure in the hands of the community it serves.</p></div>
          <nav className="l-cell f-toc" aria-label="On this page">
            <p className="t-label" data-rv="">On this page</p>
            <ol data-rv="">{TOC.map((s, i) => <li key={s.id}><a href={`#${s.id}`}><span className="f-toc__n">{idx(i)}</span><span>{s.t}</span><Arrow /></a></li>)}</ol>
          </nav>
        </div>
      </section>

      {/* 2 · three pillars, under the green rule */}
      <section className="l-sec f-pillars" id="f-pillars" aria-labelledby="f-pillars-t">
        <h2 id="f-pillars-t" className="sr-only">What the Foundation is</h2>
        <ul className="l-row l-proof__row f-cards" data-row="">
          <li className="l-green" aria-hidden="true" role="presentation" />
          {PILLARS.map((p, i) => (
            <li key={p.t} className="l-cell f-card">
              <i className="l-ic" data-icon={p.icon} data-icon-size="20" aria-hidden="true" />
              <span className="f-card__n" data-rv="">{idx(i)}</span>
              <h3 className="f-h3" data-rv="">{p.t}</h3>
              <p className="f-card__b" data-rv="">{p.b}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 3 · the devolution thesis */}
      <section className="l-sec f-mission" id="f-mission" aria-labelledby="f-mission-t">
        <div className="l-row f-split" data-row="">
          <div className="l-cell f-split__txt">
            <h2 id="f-mission-t" className="l-h2 l-h2--m" data-rv="">Our goal is to make ourselves <span className="accent">smaller</span></h2>
            <p className="l-lede f-body" data-rv="">Most organizations exist to grow. The NEAR Foundation exists to devolve. Our purpose is to support the ecosystem until it operates without us, moving functions and resources into the hands of the community and the decentralized infrastructure that carries them. This is what ownership means at the level of the network itself: NEAR is built to belong to the people who use it. We support the network. We do not control it, and by design we could not.</p>
          </div>
          <div className="l-cell f-split__fig">
            <figure className="f-dev" aria-hidden="true">
              <svg viewBox="0 0 400 400">
                <g className="f-dev__lat">{PIECES.map((q, i) => <circle key={i} cx={q.x1} cy={q.y1} r="1.6" />)}</g>
                <rect className="f-dev__core" x="140" y="140" width="120" height="120" rx="14" />
                <g className="f-dev__ps">
                  {PIECES.map((q, i) => (
                    <rect key={i} className={q.g ? "is-g" : undefined} x={q.x0 - 7} y={q.y0 - 7} width="14" height="14" rx="3"
                      style={{ ["--dx" as string]: q.x1 - q.x0, ["--dy" as string]: q.y1 - q.y0, ["--d" as string]: q.d.toFixed(2) }} />
                  ))}
                </g>
              </svg>
              <figcaption className="f-dev__cap"><span className="t-label">Foundation</span><span className="f-dev__arr" /><span className="t-label">Ecosystem</span></figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* 4 · transparency: the Stiftung, over the ridges */}
      <section className="l-sec l-origin f-transparency" id="f-transparency" aria-labelledby="f-tr-t">
        <div className="l-row l-origin__row" data-row="">
          <div className="l-cell l-origin__ph"><div className="l-ph l-ph--fill" data-ph=""><img className="l-img" src="/v3/bleed-ridges.webp" alt="" loading="lazy" decoding="async" /></div></div>
          <div className="l-cell l-origin__body">
            <h2 id="f-tr-t" className="l-h2 l-h2--m" data-rv="">Transparency is at the heart of <span className="accent">who we are</span></h2>
            <div className="l-origin__text" data-rv="">
              <p className="l-lede">The NEAR Foundation is a Swiss Stiftung. It is neither simple nor flexible to operate, by design: Swiss jurisdiction imposes strict regulatory oversight, and a Stiftung is legally bound to pursue its purpose. Funds given to it cannot be removed for any reason except the fulfillment of that purpose. Transparency is not a value we chose. It is a condition of how we are built.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5 · the Council, on the Stack's dark */}
      <section className="l-sec f-council" id="f-council" aria-labelledby="f-council-t">
        <div className="l-row f-council__row" data-row="">
          <div className="l-cell f-council__h">
            <i className="l-ic" data-icon="governance" data-icon-size="20" aria-hidden="true" />
            <h2 id="f-council-t" className="l-h2 l-h2--m" data-rv="">The NEAR Foundation <span className="accent">Council</span></h2>
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

      {/* 6 · how the Foundation operates */}
      <section className="l-sec f-operates" id="f-operates" aria-labelledby="f-op-t">
        <div className="l-row f-split f-split--head" data-row="">
          <div className="l-cell"><h2 id="f-op-t" className="l-h2 l-h2--m" data-rv="">How the Foundation <span className="accent">operates</span></h2></div>
          <div className="l-cell f-split__end"><p className="l-lede" data-rv="">As one of the larger nodes supporting a decentralized ecosystem, the Foundation limits itself to indirect support. Its primary lever is the financial resources in its treasury, and its operations are deliberately lightweight, directed at three activities.</p></div>
        </div>
        <ol className="l-row f-cards f-acts" data-row="">
          {ACTS.map((a, i) => (
            <li key={a.t} className="l-cell f-card">
              <i className="l-ic" data-icon={a.icon} data-icon-size="20" aria-hidden="true" />
              <span className="f-card__n" data-rv="">{idx(i)}</span>
              <h3 className="f-h3" data-rv="">{a.t}</h3>
              <p className="f-card__b" data-rv="">{a.b}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 7 · the ecosystem: the dApps grid as near.foundation shows it */}
      <section className="l-sec f-eco" id="f-ecosystem" aria-labelledby="f-eco-t">
        <div className="l-row f-split f-split--head" data-row="">
          <div className="l-cell"><h2 id="f-eco-t" className="l-h2 l-h2--m" data-rv="">Built by an <span className="accent">ecosystem</span>, not a company</h2></div>
          <div className="l-cell f-split__end">
            <p className="l-lede" data-rv="">Hundreds of applications, wallets, and protocols build on NEAR. The Foundation supports the ecosystem that builds them. The builders own what they make.</p>
            <p className="f-link" data-rv=""><a className="l-link" href={ECOSYSTEM}><span>Explore the ecosystem</span><Arrow /></a></p>
          </div>
        </div>
        <div className="l-row f-logos" data-row="">
          {/* [[TBD: the grid as our own files]] near.foundation's image, as the doc asks ("retain dApps logo grid from current site") */}
          <div className="l-cell f-logos__cell"><img src="https://near.foundation/dapps-icons.svg" alt="Apps supported by NEAR Foundation" loading="lazy" decoding="async" data-rv="" /></div>
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
                      <defs><clipPath id="f-close-clip"><rect x="520" y="100" width="1100" height="312" /></clipPath></defs>
                      <path className="l-close__m" d={LOCKUP_TILE} />
                      <g clipPath="url(#f-close-clip)">{LOCKUP_LETTERS.map((d, c) => <path key={c} className="l-close__c" style={{ ["--c" as string]: c }} d={d} />)}</g>
                    </svg>
                  </span>
                  <span className="l-close__rest"> <span className="l-close__w" style={{ ["--w" as string]: 0 }}>belongs</span> <span className="l-close__w" style={{ ["--w" as string]: 1 }}>to</span> <span className="l-close__w accent" style={{ ["--w" as string]: 2 }}>you</span></span>
                </h2>
                <div className="l-close__nl f-close__nl">
                  <p className="l-lede">Join the community, or build a career at the Foundation.</p>
                  <p className="f-close__btns">
                    <a className="l-btn f-btn--fill" href={COMMUNITY}><span>Join the community</span></a>
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
