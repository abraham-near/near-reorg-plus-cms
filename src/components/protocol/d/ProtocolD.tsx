"use client";
// near.org/protocol, version D · "The graphic transforms". B's layout (the ruled grid, one dark band), with every picture its own idea and none of
// them needing a word inside it:
//   1 hero (bare paper): the H1, the line and the button over convergence (hero.ts): sources at the edges (agents, apps, other chains, told apart by
//     shape) send transactions along threads that gather at one point and settle into one ordered ledger, green once final;
//   2 proof: the homepage's proof strip, seven figures: the ruled grid's first row;
//   3 the chapter, on the dark band (joined to the grid by spacer rows): one isometric model of the protocol (morph.ts) that transforms as the band
//     is scrolled, like the homepage's Stack: the network; Nightshade 3.0 (the lid of consensus lifts off execution, the validators' full copies
//     become thin witnesses); dynamic resharding (a shard swells past its threshold and splits); the private shard (a shard goes dark, one drawer
//     slides out lit); quantum security (an account's key turns once into the new one; the account stays). Phones and reduced motion: the steps
//     stacked, each with the same model at its own state;
//   4 Speed. Scale. Access.: the copy | deploy once, run everywhere (speed.ts: a field of shards beating at 600 ms; one contract lands in all at once);
//   5 Chain Signatures: the copy | one account, native transactions on other chains (sign.ts: a threshold of signers, a seal that becomes each
//     chain's own block on the way, no bridge);
//   6 developers: the points and the button | the code; 7 the AI layer | NEAR One; 8 Secure NEAR. Evolve NEAR.; 9 Go deeper (the homepage's);
//   10 the close: the homepage's scene (shared/CloseScene `ruled`, in the route), whose ruled row carries the grid down to the photo.
// Copy and links: ../content.ts (the doc, verbatim; regrouped for the story). Motion: ./motion.ts.
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { AI_LAYER, AI_SCALE, CHAIN_SIGNATURES, DEEPER, DEVELOPERS, HERO, NEAR_ONE, NIGHTSHADE, PRIVATE_SHARD, PROOF, QUANTUM, RESHARDING, SECURE, SPEED, type Link } from "../content";
import { mount } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./protocol-d.css";

const isExt = (h: string) => /^https?:/.test(h);
const ext = (h: string) => (isExt(h) ? { target: "_blank", rel: "noopener noreferrer" } : {});
const Arrow = () => <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>;
const Ext = () => <svg className="l-ext" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" /></svg>;
const Go = ({ href }: { href: string }) => (isExt(href) ? <><Ext /><span className="sr-only"> (opens another site)</span></> : <Arrow />);
const Btn = ({ l, line = false }: { l: Link; line?: boolean }) => (
  <a className={`l-btn pd-btn${line ? " pd-btn--line" : ""}`} href={l.href} {...ext(l.href)}><span>{l.label}</span><Go href={l.href} /></a>
);
const More = ({ l }: { l: Link }) => <a className="l-link pd-go" href={l.href} {...ext(l.href)}><span>{l.label}</span><Go href={l.href} /></a>;
/** a heading with its Kepler word marked (the last occurrence of `a`) */
const Acc = ({ h, a }: { h: string; a: string }) => {
  const i = h.lastIndexOf(a);
  return i < 0 ? <>{h}</> : <>{h.slice(0, i)}<span className="accent">{a}</span>{h.slice(i + a.length)}</>;
};
/** "5+ years" → "5+" and "years", as the homepage's value + unit */
const fig = (v: string) => { const i = v.indexOf(" "); return /^\$?\d/.test(v) && i > 0 ? { n: v.slice(0, i), u: v.slice(i + 1) } : { n: v, u: "" }; };
const Spacer = ({ after }: { after?: boolean }) => <div className="l-row l-spacer" data-row="" data-after-bleed={after ? "" : undefined} aria-hidden="true"><div className="l-cell" /></div>;

/** the chapter's steps after its opening (the model's states 1..4): which of the three properties each belongs to, and what the model shows */
const STEPS = [
  { k: "nightshade", of: 0, c: NIGHTSHADE, scene: "The lid of consensus lifts off the shards; the validators' full copies of the state flatten into thin witnesses, and green witnesses rise from each shard to them." },
  { k: "resharding", of: 0, c: RESHARDING, scene: "One shard swells past a dotted threshold and splits in two on its own; the other shards make room." },
  { k: "private", of: 1, c: PRIVATE_SHARD, scene: "The last shard turns dark; a single drawer slides out of it, lit, holding one green item." },
  { k: "quantum", of: 2, c: QUANTUM, scene: "An account rises at the front with its key standing on it; the key turns once and comes round as a green lattice. The account is unchanged." },
] as const;
const OPEN_SCENE = "An isometric model of NEAR Protocol: four light shards standing on a base, a lid of consensus resting on them, and on the lid four validators, each carrying a full dotted copy of the state.";

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

export function ProtocolD() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);
  const code = DEVELOPERS.code.split("\n");

  return (
    <div ref={ref} className="l-page pr-d">
      {/* ───────────── 1 · hero: the copy, then convergence across the page */}
      <section className="pd-hero" aria-labelledby="pd-h1">
        <div className="pd-hero__copy">
          <h1 id="pd-h1" className="pd-h1" data-h1=""><Acc h={HERO.h1} a="settlement" /></h1>
          <div className="pd-hero__side">
            <p className="pd-hero__body" data-in="">{HERO.body}</p>
            <p className="pd-acts" data-in=""><Btn l={HERO.cta} /></p>
          </div>
        </div>
        <figure className="pd-hero__art">
          <canvas className="pd-cv pd-cv--hero" data-scene="hero" aria-hidden="true" />
          <figcaption className="sr-only">An illustration: agents, apps and other chains at the edges send transactions along fine threads that gather at one point, NEAR, where they settle into a single ordered ledger of blocks that turn green once final.</figcaption>
        </figure>
      </section>

      {/* ───────────── 2 · proof: the homepage's strip, seven figures */}
      <section className="l-sec pd-proof" aria-label="NEAR Protocol in numbers">
        <ul className="l-row l-proof__row pd-proof__row" data-row="">
          <li className="l-green" aria-hidden="true" role="presentation" />
          {PROOF.map((p, i) => {
            const f = fig(p.value);
            return (
              <li key={p.value} className="l-cell l-fig pd-fig" style={{ ["--i" as string]: i }}>
                <p className="l-fig__v"><span className="l-fig__n">{f.n}</span>{f.u && <span className="l-fig__u">{f.u}</span>}</p>
                <p className="l-fig__c">{p.label}</p>
              </li>
            );
          })}
        </ul>
        <Spacer />
      </section>

      {/* ───────────── 3 · the chapter: the dark band; one model that transforms as it is scrolled (pinned on desktop) */}
      <section className="l-sec pd-band" aria-labelledby="pd-ai-t" data-nav-tone="dark">
        <div className="pd-stage" data-stage="">
          <div className="pd-stage__main">
            <div className="pd-steps">
              <article className="pd-step pd-step--open" data-step={0} aria-labelledby="pd-ai-t">
                <h2 id="pd-ai-t" className="l-h2 pd-h2" data-split=""><Acc h={AI_SCALE.h} a="day one" /></h2>
                <p className="l-lede pd-step__lede">{AI_SCALE.body}</p>
                <ul className="pd-props">
                  {AI_SCALE.items.map((it) => <li key={it.k}><b>{it.name}</b> {it.body}</li>)}
                </ul>
                <figure className="pd-step__art">
                  <canvas className="pd-cv pd-cv--step" data-scene="step" data-step={0} aria-hidden="true" />
                  <figcaption className="sr-only">{OPEN_SCENE}</figcaption>
                </figure>
              </article>
              {STEPS.map((s, i) => (
                <article key={s.k} className="pd-step" data-step={i + 1} aria-labelledby={`pd-st-${s.k}`}>
                  <p className="pd-step__n" aria-hidden="true">{AI_SCALE.items[s.of].name.replace(/\.$/, "")}</p>
                  <h3 id={`pd-st-${s.k}`} className="pd-step__h">{s.c.h}</h3>
                  <p className="pd-step__sub">{s.c.sub}</p>
                  <p className="pd-step__b">{s.c.body}</p>
                  {"link" in s.c && <p className="pd-step__a"><More l={s.c.link} /></p>}
                  {/* phones and reduced motion: each step keeps the model at its own state */}
                  <figure className="pd-step__art">
                    <canvas className="pd-cv pd-cv--step" data-scene="step" data-step={i + 1} aria-hidden="true" />
                    <figcaption className="sr-only">{s.scene}</figcaption>
                  </figure>
                </article>
              ))}
            </div>
            <figure className="pd-stage__art" aria-hidden="true">
              <canvas className="pd-cv pd-cv--chapter" data-scene="chapter" />
            </figure>
          </div>
          <ol className="pd-prog" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => <li key={i} className="pd-prog__s" data-seg={i}><i /></li>)}
          </ol>
        </div>
      </section>

      {/* ───────────── 4 · Speed. Scale. Access. */}
      <section className="l-sec pd-speed" aria-labelledby="pd-sp-t">
        <Spacer after />
        <div className="l-row pd-pair" data-row="">
          <div className="l-cell pd-pair__txt">
            <h2 id="pd-sp-t" className="l-h2 pd-h2" data-split="">{SPEED.h}</h2>
            <p className="l-lede" data-rv="">{SPEED.body}</p>
          </div>
          <div className="l-cell pd-pair__art">
            <figure className="pd-fig-art" data-rv="">
              <canvas className="pd-cv pd-cv--speed" data-scene="speed" aria-hidden="true" />
              <figcaption className="sr-only">An illustration: a field of shards beating together every 600 milliseconds; one contract drops into the middle shard and, on the next beat, is in every shard at once.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ───────────── 5 · Chain Signatures */}
      <section className="l-sec pd-cs" aria-labelledby="pd-cs-t">
        <Spacer />
        <div className="l-row pd-pair pd-pair--flip" data-row="">
          <div className="l-cell pd-pair__txt">
            <h2 id="pd-cs-t" className="l-h2 pd-h2" data-split="">{CHAIN_SIGNATURES.h}</h2>
            <p className="pd-sub" data-rv="">{CHAIN_SIGNATURES.sub}</p>
            <p className="pd-body" data-rv="">{CHAIN_SIGNATURES.body}</p>
            <p data-rv=""><More l={CHAIN_SIGNATURES.link} /></p>
          </div>
          <div className="l-cell pd-pair__art">
            <figure className="pd-fig-art" data-rv="">
              <canvas className="pd-cv pd-cv--chains" data-scene="chains" aria-hidden="true" />
              <figcaption className="sr-only">An illustration: a NEAR account in a ring of seven signers; five light up, and a green seal flies straight to one of three other chains, turning into that chain’s own kind of block as it lands on top.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ───────────── 6 · developers: the points | the code */}
      <section className="l-sec pd-dev" aria-labelledby="pd-dv-t">
        <Spacer />
        <div className="l-row l-head pd-head" data-row="">
          <div className="l-cell l-head__cell">
            <div>
              <h2 id="pd-dv-t" className="l-h2 pd-h2" data-split=""><Acc h={DEVELOPERS.h} a="developers" /></h2>
              <p className="pd-sub pd-head__sub" data-rv="">{DEVELOPERS.sub}</p>
            </div>
          </div>
        </div>
        <div className="l-row pd-dev__row" data-row="">
          <ul className="l-cell pd-pts">
            {DEVELOPERS.items.map((it) => (
              <li key={it.k} className="pd-pt" data-rv="">
                <i className="pd-pt__ic" data-icon={it.k === "lang" ? "code" : it.k === "gasless" ? "near-com" : "economics"} aria-hidden="true" />
                <p><b>{it.name}</b> {it.body}</p>
              </li>
            ))}
            <li className="pd-pt pd-pt--cta" data-rv=""><Btn l={DEVELOPERS.cta} /></li>
          </ul>
          <div className="l-cell pd-code-cell">
            <figure className="pd-code" data-rv="">
              <figcaption className="pd-code__bar"><span>contract.ts</span><span>near-sdk-js</span></figcaption>
              <pre><code>{code.map((ln, i) => (
                <span key={i} className="pd-code__ln" style={{ ["--n" as string]: i }}>
                  <span className="pd-code__no" aria-hidden="true">{i + 1}</span>
                  <span className="pd-code__t">{codeLine(ln).map((p, j) => (typeof p === "string" ? p : <span key={j} className={`pd-t-${p.c}`}>{p.t}</span>))}{"\n"}</span>
                </span>
              ))}</code></pre>
            </figure>
          </div>
        </div>
      </section>

      {/* ───────────── 7 · the AI layer | NEAR One */}
      <section className="l-sec pd-two" aria-label="NEAR for AI, and the team that builds it">
        <Spacer />
        <div className="l-row pd-two__row" data-row="">
          {[{ c: AI_LAYER, k: "ai", ic: "near-ai", a: AI_LAYER.cta }, { c: NEAR_ONE, k: "one", ic: "people", a: NEAR_ONE.link }].map(({ c, k, ic, a }) => (
            <article key={k} className="l-cell pd-card" aria-labelledby={`pd-${k}-t`}>
              <i className="pd-card__ic" data-icon={ic} aria-hidden="true" />
              <h2 id={`pd-${k}-t`} className="pd-card__h" data-rv="">{c.h}</h2>
              <p className="pd-sub" data-rv="">{c.sub}</p>
              <p className="pd-body" data-rv="">{c.body}</p>
              <p className="pd-card__a" data-rv=""><More l={a} /></p>
            </article>
          ))}
        </div>
      </section>

      {/* ───────────── 8 · Secure NEAR. Evolve NEAR. */}
      <section className="l-sec pd-sec" aria-labelledby="pd-se-t">
        <Spacer />
        <div className="l-row l-head pd-head" data-row="">
          <div className="l-cell l-head__cell"><h2 id="pd-se-t" className="l-h2 pd-h2" data-split="">{SECURE.h}</h2></div>
        </div>
        <ul className="l-row pd-sec__row" data-row="">
          {SECURE.items.map((it) => (
            <li key={it.k} className="l-cell pd-sec__i">
              <i className="pd-card__ic" data-icon={it.k === "validators" ? "near-protocol" : "governance"} aria-hidden="true" />
              <p data-rv=""><b>{it.name}</b> {it.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────── 9 · Go deeper: the homepage's (covers, then rows) */}
      <section className="l-sec pd-deeper" aria-labelledby="pd-gd-t">
        <Spacer />
        <div className="l-row l-head pd-head" data-row="">
          <div className="l-cell l-head__cell">
            <div>
              <h2 id="pd-gd-t" className="l-h2 pd-h2" data-split=""><Acc h={DEEPER.h} a="deeper" /></h2>
              <p className="pd-sub pd-head__sub" data-rv="">{DEEPER.sub}</p>
            </div>
          </div>
        </div>
        <div className="l-row pd-deeper__row" data-row="">
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
