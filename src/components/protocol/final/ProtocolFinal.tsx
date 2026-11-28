// near.org/protocol, the final page (Nov 25, 2026): a mix of two versions, laid out after the team's Figma collage (the guide where they differ).
//   V = the Vercel page (near-homepage-directions.vercel.app/protocol, stack-kit r41): isometric plates, the hero's index, a dark run of sections;
//   B = our version B (../b, now at /protocol-b): the live lanes on canvas, the pinned chapter.
// From the top:
//   1 hero (V, bare paper): the h1 "Protocol" (the small label), the headline (an h2 at display size), the line and the button | the overview drawing
//     (six plates, one per part of the page);
//   2 the proof (V): the green rule and six figures, the ruled grid's first row, sitting right on the dark band (idle, the hero's plates
//     light in turn; a hover lights one);
//   3 the chapter (B): the dark band, "Built for AI scale from day one", the three properties, the pinned lanes through Nightshade 3.0, dynamic
//     resharding and the private shard (B's band without its quantum step: quantum is V's section below, and the index links to it);
//   4 Speed. Scale. Access. (V's §6): a light-gray band of three columns, each word over its sentence: the two speeds as display figures, the ten
//     shards as a count (one mint: deploy once, run on every shard), the in-memory plate;
//   5 the light run (V's layout, on the page's paper): Quantum security (the dial) | Chain Signatures (one account, many chains) on the ruled grid,
//     then A blockchain for developers (the editor | the three points and the button);
//   6 the AI layer | NEAR One, then Secure NEAR. Evolve NEAR. (B);
//   7 Go deeper (B's: two covers | the rows): the CMS's newest posts (./deeper.ts, read by the route), the doc's items filling any gap;
//   8 the close: the homepage's scene (shared/CloseScene, in the route) and the footer.
// Copy: ../content.ts (the doc, verbatim). Drawings: ./drawings.ts. Motion: ./motion.ts (B's, plus ./art.ts). Styles: B's (../b/protocol-b.css, the
// page runs under .pr-b too) and ./protocol-final.css (.pr-f). A server component: only FinalRoot runs in the browser.
import { CHAIN_SIGNATURES, DEVELOPERS, HERO, QUANTUM, SPEED } from "../content";
import { TextLink } from "@/components/ui";
import { AiAndNearOne, Band, Btn, codeLine, Deeper, More, Secure, Spacer, type DeeperItem } from "../b/parts";
import { ACCESS, HERO as HERO_ART, QUANTUM as QUANTUM_ART, SIGNATURES } from "./drawings";
import { FinalRoot } from "./FinalRoot";
import "../../v3/proof-deeper/proof-deeper.css";
import "../b/protocol-b.css";
import "./protocol-final.css";

/** a drawing, inlined (its box keeps the drawing's proportion before it paints) */
const Art = ({ id, d, className = "" }: { id: string; d: { w: number; h: number; svg: string }; className?: string }) => (
  <figure className={`pf-art ${className}`} data-art={id} style={{ aspectRatio: `${d.w} / ${d.h}` }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: d.svg }} />
);

/** the proof: V's six figures (the doc's values and labels; "100% uptime" carries "5+ years on mainnet" as its line) */
const FIGS = [
  { n: "100%", u: "uptime", c: "5+ years on mainnet" }, { n: "1M+", u: "TPS", c: "Publicly verifiable" }, { n: "600ms", c: "Block time" },
  { n: "1.2s", c: "Finality" }, { n: "10", u: "shards", c: "Plus a private shard" }, { n: "<$0.002", c: "Avg transaction fee" },
];

/** `deeper`: Go deeper's items (the route reads them: ./deeper.ts) */
export function ProtocolFinal({ deeper }: { deeper: readonly DeeperItem[] }) {
  const code = DEVELOPERS.code.split("\n");
  const [, scaleLine, accessLine] = SPEED.body.split(/(?<=\.)\s+/);   // the doc's three sentences: the speeds (set as figures below), scale, access
  return (
    <FinalRoot>
      {/* the first screen: the hero and the proof fill at least the viewport, the figures on its bottom edge, so the dark band starts below the fold */}
      <div className="pf-first">
      {/* ───────────── 1 · hero (V) */}
      <section className="pf-hero" aria-labelledby="pf-h1">
        <div className="pf-hero__text">
          {/* the page's h1 is its name, set as the small label; the headline under it is an h2 at display size (and keeps the h1's word rise) */}
          <h1 id="pf-h1" className="pf-h1" data-h1="">Protocol</h1>
          <h2 className="pf-sub" data-in="">{HERO.h1}</h2>
          <div className="pf-hero__end">
            <p className="pf-hero__lede" data-in="">{HERO.body}</p>
            <p data-in=""><Btn l={HERO.cta} /></p>
          </div>
        </div>
        <div className="pf-hero__art"><Art id="hero" d={HERO_ART} className="pf-art--hero" /></div>
      </section>

      {/* ───────────── 2 · the proof (V): the figures sit right on the dark band (no index row above, no stub below) */}
      <section className="l-sec pf-top" aria-label="NEAR Protocol at a glance">
        <ul className="l-row l-proof__row pf-proof" data-row="" aria-label="NEAR Protocol in numbers">
          <li className="l-green" aria-hidden="true" role="presentation" />
          {FIGS.map((f, i) => (
            <li key={f.n} className="l-cell l-fig pf-fig" style={{ ["--i" as string]: i }}>
              <p className="l-fig__v"><span className="l-fig__n">{f.n}</span>{f.u && <span className="l-fig__u">{f.u}</span>}</p>
              <p className="l-fig__c">{f.c}</p>
            </li>
          ))}
        </ul>
      </section>
      </div>

      {/* ───────────── 3 · the chapter (B): Nightshade 3.0, dynamic resharding and the private shard on the lanes; quantum is a section below */}
      <Band steps={["nightshade", "resharding", "private"]} ids elsewhere={{ quantum: "#quantum" }} />

      {/* ───────────── 4 · Speed. Scale. Access. (V): one heading and one sentence per column. The h2 is read whole ("Speed. Scale. Access."); the
          column words are its visible form (aria-hidden), each over its own sentence, so a phone stacks them in pairs */}
      <section id="speed" className="l-sec pf-speed" aria-labelledby="pf-sp-t">
        <Spacer after />
        <div className="pf-speed__gray">
          <h2 id="pf-sp-t" className="sr-only">{SPEED.h}</h2>
          <div className="l-row pf-speed__row" data-row="">
            <div className="l-cell pf-speed__col">
              <p className="l-h2 pf-speed__w" data-split="" aria-hidden="true">Speed.</p>
              <p className="pf-speed__s pf-nums" data-rv="">
                <span className="pf-pair"><span className="pf-num">600<span className="pf-num__u">ms</span></span> <span className="pf-lab">blocks</span></span>{" "}
                <span className="pf-and">and</span>{" "}
                <span className="pf-pair"><span className="pf-num">1.2<span className="pf-num__u">s</span></span> <span className="pf-lab">finality.</span></span>
              </p>
            </div>
            <div className="l-cell pf-speed__col">
              <p className="l-h2 pf-speed__w" data-split="" aria-hidden="true">Scale.</p>
              <p className="pf-speed__s" data-rv="">{scaleLine}</p>
              {/* the ten shards, every one carrying the contract; the mint one is where it was deployed */}
              <i className="pf-count" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} className={i === 0 ? "is-mark" : undefined} style={{ ["--i" as string]: i }} />)}</i>
            </div>
            <div className="l-cell pf-speed__col">
              <p className="l-h2 pf-speed__w" data-split="" aria-hidden="true">Access.</p>
              <p className="pf-speed__s" data-rv="">{accessLine}</p>
              <Art id="access" d={ACCESS} className="pf-speed__art" />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 5 · the light run (V's layout): quantum, Chain Signatures, developers */}
      <div className="pf-light">
        <section id="quantum" className="l-sec pf-feat" aria-labelledby="pf-q-t">
          <Spacer />
          <div className="l-row pf-feat__row pf-feat__row--q" data-row="">
            <div className="l-cell pf-feat__text">
              <h2 id="pf-q-t" className="l-h2 pf-h2" data-split="">{QUANTUM.h}</h2>
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
              <h2 id="pf-cs-t" className="l-h2 pf-h2" data-split="">{CHAIN_SIGNATURES.h}</h2>
              <div className="pf-feat__body">
                <p className="pf-sub" data-rv="">{CHAIN_SIGNATURES.sub}</p>
                <p className="pf-body" data-rv="">{CHAIN_SIGNATURES.body}</p>
              </div>
            </div>
            <div className="l-cell pf-feat__art pf-sig__art">
              <Art id="signatures" d={SIGNATURES} className="pf-art--sig" />
              <TextLink href={CHAIN_SIGNATURES.link.href} size="inherit" className="pf-cta" data-rv="">{CHAIN_SIGNATURES.link.label}</TextLink>
            </div>
          </div>
        </section>

        <section className="l-sec pf-dev" aria-labelledby="pf-dv-t">
          <Spacer />
          <div className="l-row pf-dev__head" data-row="">
            <div className="l-cell pf-dev__h"><h2 id="pf-dv-t" className="l-h2 pf-h2" data-split="">{DEVELOPERS.h}</h2></div>
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

      {/* ───────────── 6 · the AI layer | NEAR One; Secure NEAR. Evolve NEAR. (B) */}
      <AiAndNearOne />
      <Secure />

      {/* ───────────── 7 · Go deeper (B's): the CMS's newest posts */}
      <Deeper items={deeper} />
    </FinalRoot>
  );
}
