// near.org/protocol, the final page (Nov 25, 2026): a mix of two versions, laid out after the team's Figma collage (the guide where they differ).
//   V = the Vercel page (near-homepage-directions.vercel.app/protocol, stack-kit r41): isometric plates, the hero's index, a dark run of sections;
//   B = our version B (../b, now at /protocol-b): the live lanes on canvas, the pinned chapter.
// From the top:
//   1 hero (V, bare paper): the eyebrow, the H1, the line and the button | the overview drawing (six plates, one per part of the page);
//   2 the index and the proof (V): the six parts as links with their icons (a link lights its plate; idle, the plates light in turn), the green
//     rule, six figures: the ruled grid's first rows;
//   3 the chapter (B): the dark band, "Built for AI scale from day one", the three properties, the pinned lanes through Nightshade 3.0 and dynamic
//     resharding (B's private shard and quantum steps are V's sections below);
//   4 Speed. Scale. Access. (B): the copy | the metronome;
//   5 Private Shard (V): a centred statement under the sealed plate;
//   6 the dark run (V): Quantum security (the dial) | Chain Signatures (one account, many chains) | A blockchain for developers (the editor | the
//     three points and the button);
//   7 the AI layer | NEAR One, then Secure NEAR. Evolve NEAR. (B);
//   8 Go deeper (V, the gray ground): the heading over the shelf of five sheets | the five posts (a row lifts its sheet);
//   9 the close: the homepage's scene (shared/CloseScene, in the route) and the footer.
// Copy: ../content.ts (the doc, verbatim). Drawings: ./drawings.ts. Motion: ./motion.ts (B's, plus ./art.ts). Styles: B's (../b/protocol-b.css, the
// page runs under .pr-b too) and ./protocol-final.css (.pr-f). A server component: only FinalRoot runs in the browser.
import type { ReactNode } from "react";
import { CHAIN_SIGNATURES, DEEPER, DEVELOPERS, HERO, NIGHTSHADE, PRIVATE_SHARD, QUANTUM, RESHARDING, SPEED } from "../content";
import { Acc, AiAndNearOne, Arrow, Band, Btn, codeLine, ext, More, Secure, Spacer, Speed } from "../b/parts";
import { HERO as HERO_ART, PRIVATE, QUANTUM as QUANTUM_ART, SHELF, SIGNATURES } from "./drawings";
import { FinalRoot } from "./FinalRoot";
import "../../v3/proof-deeper/proof-deeper.css";
import "../b/protocol-b.css";
import "./protocol-final.css";

/** a drawing, inlined (its box keeps the drawing's proportion before it paints) */
const Art = ({ id, d, className = "" }: { id: string; d: { w: number; h: number; svg: string }; className?: string }) => (
  <figure className={`pf-art ${className}`} data-art={id} style={{ aspectRatio: `${d.w} / ${d.h}` }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: d.svg }} />
);

/** V's tab icons (stack-kit icons/tab-<part>.svg): the menu's line family, one mint dot each */
const ICONS: Record<string, ReactNode> = {
  nightshade: <><path d="M12 4.5l9 4.5-9 4.5-9-4.5z" /><path d="M9 6l9 4.5M6 7.5l9 4.5" strokeWidth="1" /><path d="M3 15l9 4.5 9-4.5" /><circle className="g" cx="9" cy="10.5" r="1.25" /></>,
  resharding: <><path d="M12 4.5l3.24 1.62-9 4.5L3 9z" /><path d="M17.76 7.38L21 9l-9 4.5-3.24-1.62z" /><path d="M3 15l9 4.5 9-4.5" /><circle className="g" cx="14.88" cy="10.44" r="1.25" /></>,
  speed: <><path d="M14 5l7 3.5-7 3.5-7-3.5z" /><path d="M2.5 7.5h3M3.5 10.5h3" /><path d="M3 15l9 4.5 9-4.5" /><circle className="g" cx="14" cy="8.5" r="1.25" /></>,
  private: <><path d="M12 4.5l9 4.5-9 4.5-9-4.5z" /><path d="M12 10v2.25" /><path d="M3 15l9 4.5 9-4.5" /><circle className="g" cx="12" cy="8.75" r="1.5" /></>,
  quantum: <><path d="M12 4.5l9 4.5-9 4.5-9-4.5z" /><ellipse cx="12" cy="9" rx="4.25" ry="2.1" /><path d="M3 15l9 4.5 9-4.5" /><circle className="g" cx="15.6" cy="10.2" r="1.25" /></>,
  signatures: <><path d="M12 9l9 4.5-9 4.5-9-4.5z" /><circle className="g" cx="12" cy="4" r="1.6" /><path d="M12 7v1.25" strokeWidth="1" /><circle className="f" cx="7.5" cy="13.5" r=".85" /><circle className="f" cx="16.5" cy="13.5" r=".85" /><circle className="f" cx="12" cy="15.75" r=".85" /></>,
};
const Icon = ({ k }: { k: string }) => (
  <svg className="pf-index__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{ICONS[k]}</svg>
);
const BlogIcon = () => (
  <svg className="pf-tile__g" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M14.5 5.5l4 4L9 19H5v-4z" /><path d="M12.5 7.5l4 4" /><path d="M12.5 19h4" /><circle className="g" cx="19.25" cy="19" r="1.25" />
  </svg>
);

/** the index: the six parts, by their own headings, in the page's order (the hero drawing's part names) */
const PARTS = [
  { k: "nightshade", label: NIGHTSHADE.h }, { k: "resharding", label: RESHARDING.h }, { k: "speed", label: SPEED.h },
  { k: "private", label: PRIVATE_SHARD.h }, { k: "quantum", label: QUANTUM.h }, { k: "signatures", label: CHAIN_SIGNATURES.h },
];
/** the proof: V's six figures (the doc's values and labels; "100% uptime" carries "5+ years on mainnet" as its line) */
const FIGS = [
  { n: "100%", u: "uptime", c: "5+ years on mainnet" }, { n: "1M+", u: "TPS", c: "Publicly verifiable" }, { n: "600ms", c: "Block time" },
  { n: "1.2s", c: "Finality" }, { n: "10", u: "shards", c: "Plus a private shard" }, { n: "<$0.002", c: "Avg transaction fee" },
];

export function ProtocolFinal() {
  const code = DEVELOPERS.code.split("\n");
  return (
    <FinalRoot>
      {/* ───────────── 1 · hero (V) */}
      <section className="pf-hero" aria-labelledby="pf-h1">
        <div className="pf-hero__text">
          <p className="pf-eyebrow" data-in="">Protocol</p>
          <h1 id="pf-h1" className="pf-h1" data-h1=""><Acc h={HERO.h1} a="agent" /></h1>
          <div className="pf-hero__end">
            <p className="pf-hero__lede" data-in="">{HERO.body}</p>
            <p data-in=""><Btn l={HERO.cta} /></p>
          </div>
        </div>
        <div className="pf-hero__art"><Art id="hero" d={HERO_ART} className="pf-art--hero" /></div>
      </section>

      {/* ───────────── 2 · the index and the proof (V) */}
      <section className="l-sec pf-top" aria-label="NEAR Protocol at a glance">
        <nav className="l-row pf-index" data-row="" aria-label="On this page">
          <div className="l-cell pf-index__cell">
            <ul className="pf-index__list">
              {PARTS.map((p) => <li key={p.k}><a href={`#${p.k}`} data-part={p.k}><Icon k={p.k} /><span>{p.label}</span></a></li>)}
            </ul>
          </div>
        </nav>
        <ul className="l-row l-proof__row pf-proof" data-row="" aria-label="NEAR Protocol in numbers">
          <li className="l-green" aria-hidden="true" role="presentation" />
          {FIGS.map((f, i) => (
            <li key={f.n} className="l-cell l-fig pf-fig" style={{ ["--i" as string]: i }}>
              <p className="l-fig__v"><span className="l-fig__n">{f.n}</span>{f.u && <span className="l-fig__u">{f.u}</span>}</p>
              <p className="l-fig__c">{f.c}</p>
            </li>
          ))}
        </ul>
        <Spacer />
      </section>

      {/* ───────────── 3 · the chapter (B): Nightshade 3.0 and dynamic resharding on the lanes */}
      <Band steps={["nightshade", "resharding"]} ids />

      {/* ───────────── 4 · Speed. Scale. Access. (B) */}
      <Speed id="speed" />

      {/* ───────────── 5 · Private Shard (V) */}
      <section id="private" className="l-sec pf-center" aria-labelledby="pf-pv-t">
        <div className="l-row" data-row="">
          <div className="l-cell pf-center__cell">
            <Art id="private" d={PRIVATE} className="pf-center__art" />
            <h2 id="pf-pv-t" className="l-h2 pf-h2" data-split=""><Acc h={PRIVATE_SHARD.h} a="Shard" /></h2>
            <p className="pf-sub" data-rv="">{PRIVATE_SHARD.sub}</p>
            <p className="pf-body" data-rv="">{PRIVATE_SHARD.body}</p>
            <p className="pf-more" data-rv=""><More l={PRIVATE_SHARD.link} /></p>
          </div>
        </div>
      </section>

      {/* ───────────── 6 · the dark run (V): quantum, Chain Signatures, developers */}
      <div className="pf-dark" data-nav-tone="dark">
        <section id="quantum" className="l-sec pf-feat" aria-labelledby="pf-q-t">
          <Spacer />
          <div className="l-row pf-feat__row pf-feat__row--q" data-row="">
            <div className="l-cell pf-feat__text">
              <h2 id="pf-q-t" className="l-h2 pf-h2" data-split=""><Acc h={QUANTUM.h} a="Quantum" /></h2>
              <div className="pf-feat__body">
                <p className="pf-sub" data-rv="">{QUANTUM.sub}</p>
                <p className="pf-body" data-rv="">{QUANTUM.body}</p>
                <p className="pf-more" data-rv=""><More l={QUANTUM.link} /></p>
              </div>
            </div>
            <div className="l-cell pf-feat__art"><Art id="quantum" d={QUANTUM_ART} className="pf-art--q" /></div>
          </div>
        </section>

        <section id="signatures" className="l-sec pf-feat" aria-labelledby="pf-cs-t">
          <Spacer />
          <div className="l-row pf-feat__row pf-feat__row--sig" data-row="">
            <div className="l-cell pf-feat__text">
              <h2 id="pf-cs-t" className="l-h2 pf-h2" data-split=""><Acc h={CHAIN_SIGNATURES.h} a="Signatures" /></h2>
              <div className="pf-feat__body">
                <p className="pf-sub" data-rv="">{CHAIN_SIGNATURES.sub}</p>
                <p className="pf-body" data-rv="">{CHAIN_SIGNATURES.body}</p>
              </div>
            </div>
            <div className="l-cell pf-feat__art pf-sig__art">
              <Art id="signatures" d={SIGNATURES} className="pf-art--sig" />
              <a className="pf-cta" href={CHAIN_SIGNATURES.link.href} data-rv=""><span>{CHAIN_SIGNATURES.link.label}</span><Arrow /></a>
            </div>
          </div>
        </section>

        <section className="l-sec pf-dev" aria-labelledby="pf-dv-t">
          <Spacer />
          <div className="l-row pf-dev__head" data-row="">
            <div className="l-cell pf-dev__h"><h2 id="pf-dv-t" className="l-h2 pf-h2" data-split=""><Acc h={DEVELOPERS.h} a="developers" /></h2></div>
            <div className="l-cell pf-dev__lede"><p className="pf-sub" data-rv="">{DEVELOPERS.sub}</p></div>
          </div>
          <div className="l-row pf-dev__row" data-row="">
            <div className="l-cell pf-code__cell">
              <figure className="pf-code" data-rv="">
                <figcaption className="pf-code__bar"><i /><i /><i /><span className="sr-only">A NEAR smart contract in JavaScript (near-sdk-js)</span></figcaption>
                <pre className="pf-code__pre"><code>{code.map((ln, i) => (
                  <span key={i} className="pf-code__ln" style={{ ["--n" as string]: i }}>
                    <span className="pf-code__no" aria-hidden="true">{i + 1}</span>
                    <span className="pf-code__t">{codeLine(ln).map((p, j) => (typeof p === "string" ? p : <span key={j} className={`pf-t-${p.c}`}>{p.t}</span>))}{i === code.length - 1 && <i className="pf-code__caret" aria-hidden="true" />}{"\n"}</span>
                  </span>
                ))}</code></pre>
              </figure>
            </div>
            <div className="l-cell pf-dev__side">
              <ul className="pf-feats">
                {DEVELOPERS.items.map((it) => <li key={it.k} data-rv=""><span className="pf-feats__t">{it.name}</span> <span className="pf-feats__b">{it.body}</span></li>)}
              </ul>
              <p data-rv=""><Btn l={DEVELOPERS.cta} /></p>
            </div>
          </div>
        </section>
      </div>

      {/* ───────────── 7 · the AI layer | NEAR One; Secure NEAR. Evolve NEAR. (B) */}
      <AiAndNearOne />
      <Secure />

      {/* ───────────── 8 · Go deeper (V): the shelf | the posts */}
      <section className="l-sec pf-deeper" aria-labelledby="pf-gd-t">
        <Spacer />
        <div className="pf-gray">
          <div className="l-row pf-deeper__row" data-row="">
            <div className="l-cell pf-deeper__head">
              <h2 id="pf-gd-t" className="l-h2 pf-h2" data-split=""><Acc h={DEEPER.h} a="deeper" /></h2>
              <p className="pf-sub pf-deeper__sub" data-rv="">{DEEPER.sub}</p>
              <Art id="shelf" d={SHELF} className="pf-shelf" />
            </div>
            <div className="l-cell pf-deeper__list">
              <ol className="pf-tiles">
                {DEEPER.items.map((it, j) => (
                  <li key={it.href} className="pf-tile">
                    <a className="pf-tile__a" href={it.href} data-part-link={j + 1} {...ext(it.href)}>
                      <BlogIcon />
                      <span className="pf-tile__t">{it.title}</span>
                      <span className="pf-tile__s">{it.body.charAt(0).toUpperCase() + it.body.slice(1)}<span className="sr-only"> (another site)</span></span>
                      <Arrow />
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>
    </FinalRoot>
  );
}
