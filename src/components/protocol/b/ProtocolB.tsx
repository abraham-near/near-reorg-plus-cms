"use client";
// near.org/protocol, version B · "The network lives". The doc's page told as one picture of the network at work, in the homepage's hand: shards as
// lanes, transactions flowing in from the right, a chunk per shard every 600 ms at the now line, the green final line 1.2 s behind it (net.ts).
// From the top:
//   1 hero (bare paper): the H1, the line and the button over the live scene (net.ts: ten shards and the private one, resharding on its own every
//     ~40 s), with its legend and an honest count (blocks at 600 ms since you arrived);
//   2 proof: the homepage's proof strip, seven figures under the green rule: the ruled grid's first row;
//   3 the chapter, on the dark band (joined to the grid by a spacer row above and below): "Built for AI scale from day one", its three properties
//     as an index, then a pinned stage (desktop) where the same lanes carry four steps, scrubbed: Nightshade 3.0 (consensus over execution, state
//     witnesses), dynamic resharding (a lane fills and splits, no vote), the private shard (shielded chunks, a selective-disclosure lens), quantum
//     security (an account rotates to ML-DSA in one transaction). Phones and reduced motion: the steps stacked, each with its own scene;
//   4 Speed. Scale. Access.: the copy | the metronome (three lanes, a global contract landing on all of them at once);
//   5 Chain Signatures: the copy | the lanes of other chains (chains.ts: a threshold of MPC signers, a native transaction, no bridge);
//   6 developers: the three points and the button | the code, in the site's hand;
//   7 the AI layer | NEAR One, side by side;
//   8 Secure NEAR. Evolve NEAR.: validators | NEPs;
//   9 Go deeper: the homepage's (two covers, the rest as rows);
//   10 the close: the homepage's scene (shared/CloseScene `ruled`, in the route), whose ruled row carries the grid down to the photo.
// Copy and links: ../content.ts (the doc, verbatim; regrouped for the story). Motion: ./motion.ts.
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { AI_LAYER, AI_SCALE, CHAIN_SIGNATURES, DEEPER, DEVELOPERS, HERO, NEAR_ONE, NIGHTSHADE, PRIVATE_SHARD, PROOF, QUANTUM, RESHARDING, SECURE, SPEED, type Link } from "../content";
import { mount } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./protocol-b.css";

const isExt = (h: string) => /^https?:/.test(h);
const ext = (h: string) => (isExt(h) ? { target: "_blank", rel: "noopener noreferrer" } : {});
const Arrow = () => <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>;
const Ext = () => <svg className="l-ext" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" /></svg>;
const Go = ({ href }: { href: string }) => (isExt(href) ? <><Ext /><span className="sr-only"> (opens another site)</span></> : <Arrow />);
const Btn = ({ l, line = false }: { l: Link; line?: boolean }) => (
  <a className={`l-btn pb-btn${line ? " pb-btn--line" : ""}`} href={l.href} {...ext(l.href)}><span>{l.label}</span><Go href={l.href} /></a>
);
const More = ({ l }: { l: Link }) => <a className="l-link pb-go" href={l.href} {...ext(l.href)}><span>{l.label}</span><Go href={l.href} /></a>;
/** a heading with its Kepler word marked (the last occurrence of `a`) */
const Acc = ({ h, a }: { h: string; a: string }) => {
  const i = h.lastIndexOf(a);
  return i < 0 ? <>{h}</> : <>{h.slice(0, i)}<span className="accent">{a}</span>{h.slice(i + a.length)}</>;
};
/** "5+ years" → "5+" and "years", as the homepage's value + unit */
const fig = (v: string) => { const i = v.indexOf(" "); return /^\$?\d/.test(v) && i > 0 ? { n: v.slice(0, i), u: v.slice(i + 1) } : { n: v, u: "" }; };
const Spacer = ({ after }: { after?: boolean }) => <div className="l-row l-spacer" data-row="" data-after-bleed={after ? "" : undefined} aria-hidden="true"><div className="l-cell" /></div>;

/** the chapter's four steps on the lanes: which of the three properties each belongs to */
const STEPS = [
  { k: "nightshade", of: 0, c: NIGHTSHADE, scene: "Consensus above the shards: each new chunk sends a state witness up to the block, and validators check it without holding the state." },
  { k: "resharding", of: 0, c: RESHARDING, scene: "One shard fills up; at its threshold it splits in two at the now line, with no vote." },
  { k: "private", of: 1, c: PRIVATE_SHARD, scene: "The private shard's chunks are shielded; a lens opens one window on their contents." },
  { k: "quantum", of: 2, c: QUANTUM, scene: "An account rotates its key from Ed25519 to ML-DSA in a single transaction." },
] as const;

/** Go deeper: two covers (the homepage's photos for the two posts it has), the rest as rows */
const COVERS: Record<string, string> = {
  "https://www.near.org/blog/agent-economy": "/images/home/deeper/home-deeper-who-owns-the-rails-v2.webp",
  "https://www.near.org/blog/making-near-protocol-post-quantum-safe": "/images/home/deeper/home-deeper-quantum-readiness-v2.webp",
};
const FEATURED = DEEPER.items.filter((it) => COVERS[it.href]), ROWS = DEEPER.items.filter((it) => !COVERS[it.href]);

/** the code, coloured by a small hand-written pass (keywords, strings, decorators): no highlighter shipped for one block */
function codeLine(s: string) {
  const out: (string | { t: string; c: string })[] = [];
  const re = /('[^']*'|"[^"]*"|@\w+|\b(?:import|from|class|return|this)\b|\b(?:String)\b)/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const t = m[0];
    out.push({ t, c: t[0] === "'" || t[0] === '"' ? "s" : t[0] === "@" ? "d" : t === "String" ? "y" : "k" });
    last = m.index + t.length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

export function ProtocolB() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);
  const code = DEVELOPERS.code.split("\n");

  return (
    <div ref={ref} className="l-page pr-b">
      {/* ───────────── 1 · hero: the copy over the live scene */}
      <section className="pb-hero" aria-labelledby="pb-h1">
        <div className="pb-hero__copy">
          <h1 id="pb-h1" className="pb-h1" data-h1=""><Acc h={HERO.h1} a="settlement" /></h1>
          <div className="pb-hero__side">
            <p className="pb-hero__body" data-in="">{HERO.body}</p>
            <p className="pb-acts" data-in=""><Btn l={HERO.cta} /></p>
          </div>
        </div>
        <figure className="pb-hero__art" aria-labelledby="pb-hero-cap">
          <canvas className="pb-cv pb-cv--hero" data-scene="hero" aria-hidden="true" />
          <figcaption className="pb-legend" id="pb-hero-cap">
            <span className="sr-only">An illustrative simulation of NEAR at work: ten shards and a private shard as lanes; transactions come in from the right, each shard closes a chunk every 600 milliseconds, and chunks are final 1.2 seconds later. Now and then a busy shard splits in two.</span>
            <span className="pb-key" aria-hidden="true"><i className="pb-k pb-k--tx" />Transaction</span>
            <span className="pb-key" aria-hidden="true"><i className="pb-k pb-k--chunk" />Chunk, every 600 ms</span>
            <span className="pb-key" aria-hidden="true"><i className="pb-k pb-k--final" />Final at 1.2 s</span>
            <span className="pb-key" aria-hidden="true"><i className="pb-k pb-k--priv" />Private shard</span>
            <span className="pb-legend__note">
              <span aria-hidden="true">Illustrative simulation</span>
              <span className="pb-count" data-count="" aria-live="off">≈ <b data-blocks="">0</b> blocks since you arrived</span>
            </span>
          </figcaption>
        </figure>
      </section>

      {/* ───────────── 2 · proof: the homepage's strip, seven figures */}
      <section className="l-sec pb-proof" aria-label="NEAR Protocol in numbers">
        <ul className="l-row l-proof__row pb-proof__row" data-row="">
          <li className="l-green" aria-hidden="true" role="presentation" />
          {PROOF.map((p, i) => {
            const f = fig(p.value);
            return (
              <li key={p.value} className="l-cell l-fig pb-fig" style={{ ["--i" as string]: i }}>
                <p className="l-fig__v"><span className="l-fig__n">{f.n}</span>{f.u && <span className="l-fig__u">{f.u}</span>}</p>
                <p className="l-fig__c">{p.label}</p>
              </li>
            );
          })}
        </ul>
        <Spacer />
      </section>

      {/* ───────────── 3 · the chapter: the dark band, the three properties, the pinned stage */}
      <section className="l-sec pb-band" aria-labelledby="pb-ai-t" data-nav-tone="dark">
        <div className="pb-band__intro">
          <h2 id="pb-ai-t" className="l-h2 pb-h2" data-split=""><Acc h={AI_SCALE.h} a="day one" /></h2>
          <p className="l-lede" data-up="">{AI_SCALE.body}</p>
        </div>
        <div className="pb-stage" data-stage="">
          <ol className="pb-idx" aria-label="The three properties">
            {AI_SCALE.items.map((it, i) => (
              <li key={it.k} className="pb-idx__i" data-of={i}>
                <i className="pb-idx__dot" aria-hidden="true" />
                <p><b>{it.name}</b> {it.body}</p>
              </li>
            ))}
          </ol>
          <div className="pb-stage__main">
            <div className="pb-steps">
              {STEPS.map((s, i) => (
                <article key={s.k} className="pb-step" data-step={i} aria-labelledby={`pb-st-${s.k}`}>
                  <p className="pb-step__n" aria-hidden="true">{AI_SCALE.items[s.of].name.replace(/\.$/, "")}</p>
                  <h3 id={`pb-st-${s.k}`} className="pb-step__h">{s.c.h}</h3>
                  <p className="pb-step__sub">{s.c.sub}</p>
                  <p className="pb-step__b">{s.c.body}</p>
                  {"link" in s.c && <p className="pb-step__a"><More l={s.c.link} /></p>}
                  {/* phones and reduced motion: each step keeps its own scene */}
                  <figure className="pb-step__art">
                    <canvas className="pb-cv pb-cv--step" data-scene="step" data-step={i} aria-hidden="true" />
                    <figcaption className="sr-only">{s.scene}</figcaption>
                  </figure>
                </article>
              ))}
            </div>
            <figure className="pb-stage__art" aria-hidden="true">
              <canvas className="pb-cv pb-cv--chapter" data-scene="chapter" />
            </figure>
          </div>
          <div className="pb-stage__bar" aria-hidden="true"><i data-bar="" /></div>
        </div>
      </section>

      {/* ───────────── 4 · Speed. Scale. Access. */}
      <section className="l-sec pb-speed" aria-labelledby="pb-sp-t">
        <Spacer after />
        <div className="l-row pb-pair" data-row="">
          <div className="l-cell pb-pair__txt">
            <h2 id="pb-sp-t" className="l-h2 pb-h2" data-split="">{SPEED.h}</h2>
            <p className="l-lede" data-rv="">{SPEED.body}</p>
          </div>
          <div className="l-cell pb-pair__art">
            <figure className="pb-fig-art" data-rv="">
              <canvas className="pb-cv pb-cv--speed" data-scene="speed" aria-hidden="true" />
              <figcaption className="pb-cap">Three shards at 600 ms; a global contract lands on every shard in the same block. Illustrative.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ───────────── 5 · Chain Signatures */}
      <section className="l-sec pb-cs" aria-labelledby="pb-cs-t">
        <Spacer />
        <div className="l-row pb-pair pb-pair--flip" data-row="">
          <div className="l-cell pb-pair__txt">
            <h2 id="pb-cs-t" className="l-h2 pb-h2" data-split="">{CHAIN_SIGNATURES.h}</h2>
            <p className="pb-sub" data-rv="">{CHAIN_SIGNATURES.sub}</p>
            <p className="pb-body" data-rv="">{CHAIN_SIGNATURES.body}</p>
            <p data-rv=""><More l={CHAIN_SIGNATURES.link} /></p>
          </div>
          <div className="l-cell pb-pair__art">
            <figure className="pb-fig-art" data-rv="">
              <canvas className="pb-cv pb-cv--chains" data-scene="chains" aria-hidden="true" />
              <figcaption className="pb-cap">A NEAR account asks; a threshold of MPC signers signs; the signature lands on the other chain as its own native transaction. Illustrative.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ───────────── 6 · developers: the points | the code */}
      <section className="l-sec pb-dev" aria-labelledby="pb-dv-t">
        <Spacer />
        <div className="l-row l-head pb-head" data-row="">
          <div className="l-cell l-head__cell">
            <div>
              <h2 id="pb-dv-t" className="l-h2 pb-h2" data-split=""><Acc h={DEVELOPERS.h} a="developers" /></h2>
              <p className="pb-sub pb-head__sub" data-rv="">{DEVELOPERS.sub}</p>
            </div>
          </div>
        </div>
        <div className="l-row pb-dev__row" data-row="">
          <ul className="l-cell pb-pts">
            {DEVELOPERS.items.map((it) => (
              <li key={it.k} className="pb-pt" data-rv="">
                <i className="pb-pt__ic" data-icon={it.k === "lang" ? "code" : it.k === "gasless" ? "near-com" : "economics"} aria-hidden="true" />
                <p><b>{it.name}</b> {it.body}</p>
              </li>
            ))}
            <li className="pb-pt pb-pt--cta" data-rv=""><Btn l={DEVELOPERS.cta} /></li>
          </ul>
          <div className="l-cell pb-code-cell">
            <figure className="pb-code" data-rv="">
              <figcaption className="pb-code__bar"><span>contract.ts</span><span>near-sdk-js</span></figcaption>
              <pre><code>{code.map((ln, i) => (
                <span key={i} className="pb-code__ln" style={{ ["--n" as string]: i }}>
                  <span className="pb-code__no" aria-hidden="true">{i + 1}</span>
                  <span className="pb-code__t">{codeLine(ln).map((p, j) => (typeof p === "string" ? p : <span key={j} className={`pb-t-${p.c}`}>{p.t}</span>))}{"\n"}</span>
                </span>
              ))}</code></pre>
            </figure>
          </div>
        </div>
      </section>

      {/* ───────────── 7 · the AI layer | NEAR One */}
      <section className="l-sec pb-two" aria-label="NEAR for AI, and the team that builds it">
        <Spacer />
        <div className="l-row pb-two__row" data-row="">
          {[{ c: AI_LAYER, k: "ai", ic: "near-ai", a: AI_LAYER.cta }, { c: NEAR_ONE, k: "one", ic: "people", a: NEAR_ONE.link }].map(({ c, k, ic, a }) => (
            <article key={k} className="l-cell pb-card" aria-labelledby={`pb-${k}-t`}>
              <i className="pb-card__ic" data-icon={ic} aria-hidden="true" />
              <h2 id={`pb-${k}-t`} className="pb-card__h" data-rv="">{c.h}</h2>
              <p className="pb-sub" data-rv="">{c.sub}</p>
              <p className="pb-body" data-rv="">{c.body}</p>
              <p className="pb-card__a" data-rv=""><More l={a} /></p>
            </article>
          ))}
        </div>
      </section>

      {/* ───────────── 8 · Secure NEAR. Evolve NEAR. */}
      <section className="l-sec pb-sec" aria-labelledby="pb-se-t">
        <Spacer />
        <div className="l-row l-head pb-head" data-row="">
          <div className="l-cell l-head__cell"><h2 id="pb-se-t" className="l-h2 pb-h2" data-split="">{SECURE.h}</h2></div>
        </div>
        <ul className="l-row pb-sec__row" data-row="">
          {SECURE.items.map((it) => (
            <li key={it.k} className="l-cell pb-sec__i">
              <i className="pb-card__ic" data-icon={it.k === "validators" ? "near-protocol" : "governance"} aria-hidden="true" />
              <p data-rv=""><b>{it.name}</b> {it.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────── 9 · Go deeper: the homepage's (covers, then rows) */}
      <section className="l-sec pb-deeper" aria-labelledby="pb-gd-t">
        <Spacer />
        <div className="l-row l-head pb-head" data-row="">
          <div className="l-cell l-head__cell">
            <div>
              <h2 id="pb-gd-t" className="l-h2 pb-h2" data-split=""><Acc h={DEEPER.h} a="deeper" /></h2>
              <p className="pb-sub pb-head__sub" data-rv="">{DEEPER.sub}</p>
            </div>
          </div>
        </div>
        <div className="l-row pb-deeper__row" data-row="">
          {FEATURED.map((it) => (
            <div key={it.href} className="l-cell l-feat-cell">
              <article className="l-feat">
                <a className="l-feat__a" href={it.href} {...ext(it.href)}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- the homepage's Go deeper covers, as its own markup (lazy, decoded off the main thread) */}
                  <div className="l-ph l-feat__ph" data-ph=""><img className="l-img" src={COVERS[it.href]} alt="" loading="lazy" decoding="async" /></div>
                  <span className="l-feat__body">
                    <span className="l-meta t-label">Read</span>
                    <span className="l-feat__t">{it.title}<span className="sr-only"> (another site)</span></span>
                    <span className="l-feat__src">{it.body.charAt(0).toUpperCase() + it.body.slice(1)}</span>
                  </span>
                </a>
              </article>
            </div>
          ))}
          <div className="l-cell l-list-cell">
            <ol className="l-tiles" aria-label="More deep dives">
              {ROWS.map((it, j) => (
                <li key={it.href} className="l-tile" style={{ ["--j" as string]: j }}>
                  <a className="l-tile__a" href={it.href} {...ext(it.href)}>
                    <i className="l-glyph" data-icon="deeper-read" aria-hidden="true" /><span className="l-tile__meta t-label">Read</span>
                    <span className="l-tile__t">{it.title}<span className="sr-only"> (another site)</span></span>
                    <span className="l-tile__src">{it.body.charAt(0).toUpperCase() + it.body.slice(1)}</span>
                    <span className="l-tile__go" aria-hidden="true"><Arrow /></span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
