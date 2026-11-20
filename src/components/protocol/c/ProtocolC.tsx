"use client";
// near.org/protocol, version C · "Lateral chapter". B's layout and order, with a drawing of its own for each idea and no words inside the drawings
// (form, motion and the one green carry them; each has a description for screen readers). From the top:
//   1 hero (bare paper): the H1, the line and the button | the network as one body of dots (cloud.ts): a sphere cut into ten open shards and one dark
//     one (the private shard), turning; green bands run down the shards every 600 ms and they glow once final; the pointer leans it, the scroll opens it;
//   2 proof: the homepage's proof strip, seven figures under the green rule: the ruled grid's first row;
//   3 the chapter, on the dark band (joined to the grid by a spacer row above and below): pinned on desktop and read sideways, five panels: "Built for AI
//     scale from day one" with its three properties, then Nightshade 3.0, dynamic resharding, the private shard and quantum security, each with its own
//     drawing played by the scroll (panels.ts); a hairline with five marks shows where you are. Phones and reduced motion: the panels stacked;
//   4 Speed. Scale. Access.: the copy | a clock of the network's rhythm (speed.ts);
//   5 Chain Signatures: the copy | one account, a threshold of signers, one seal landing on other chains as their own blocks (chains.ts);
//   6 developers: the three points and the button | the code, in the site's hand;
//   7 the AI layer | NEAR One; 8 Secure NEAR. Evolve NEAR.; 9 Go deeper: the homepage's;
//   10 the close: the homepage's scene (shared/CloseScene `ruled`, in the route).
// Copy and links: ../content.ts (the doc, verbatim; regrouped for the story). Motion: ./motion.ts.
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { AI_LAYER, AI_SCALE, CHAIN_SIGNATURES, DEEPER, DEVELOPERS, HERO, NEAR_ONE, NIGHTSHADE, PRIVATE_SHARD, PROOF, QUANTUM, RESHARDING, SECURE, SPEED, type Link } from "../content";
import { mount } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./protocol-c.css";

const isExt = (h: string) => /^https?:/.test(h);
const ext = (h: string) => (isExt(h) ? { target: "_blank", rel: "noopener noreferrer" } : {});
const Arrow = () => <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>;
const Ext = () => <svg className="l-ext" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" /></svg>;
const Go = ({ href }: { href: string }) => (isExt(href) ? <><Ext /><span className="sr-only"> (opens another site)</span></> : <Arrow />);
const Btn = ({ l, line = false }: { l: Link; line?: boolean }) => (
  <a className={`l-btn pc-btn${line ? " pc-btn--line" : ""}`} href={l.href} {...ext(l.href)}><span>{l.label}</span><Go href={l.href} /></a>
);
const More = ({ l }: { l: Link }) => <a className="l-link pc-go" href={l.href} {...ext(l.href)}><span>{l.label}</span><Go href={l.href} /></a>;
/** a heading with its Kepler word marked (the last occurrence of `a`) */
const Acc = ({ h, a }: { h: string; a: string }) => {
  const i = h.lastIndexOf(a);
  return i < 0 ? <>{h}</> : <>{h.slice(0, i)}<span className="accent">{a}</span>{h.slice(i + a.length)}</>;
};
/** "5+ years" → "5+" and "years", as the homepage's value + unit */
const fig = (v: string) => { const i = v.indexOf(" "); return /^\$?\d/.test(v) && i > 0 ? { n: v.slice(0, i), u: v.slice(i + 1) } : { n: v, u: "" }; };
const Spacer = ({ after }: { after?: boolean }) => <div className="l-row l-spacer" data-row="" data-after-bleed={after ? "" : undefined} aria-hidden="true"><div className="l-cell" /></div>;

/** the chapter's four panels after its opening, each with its drawing's description */
const STEPS = [
  { k: "nightshade", c: NIGHTSHADE, scene: "A chain of blocks sits on four shards, each validator carrying a heavy stack of state. The chain lifts away from the shards, the stacks melt away, and each shard sends a small witness up to its validator instead. Then one green arc joins two shards into the same block." },
  { k: "resharding", c: RESHARDING, scene: "Among other shards, one fills with state dot by dot up to its line. A green seam opens down its middle and it divides in two, like a cell; each half settles at half the height while the neighbours make room." },
  { k: "private", c: PRIVATE_SHARD, scene: "Transactions ride a belt into a dark zone, where their contents disappear and only sealed shapes pass. The belt stops; a green lens opens one of them, and a green line hands what it shows to a single viewer." },
  { k: "quantum", c: QUANTUM, scene: "An account with its holdings circling it, tied to its key. Waves come from the right and run through the old key, shaking the account. The key turns over once, comes back green with a lattice pattern, and the waves stop at it; the account never changes." },
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

export function ProtocolC() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);
  const code = DEVELOPERS.code.split("\n");

  return (
    <div ref={ref} className="l-page pr-c">
      {/* ───────────── 1 · hero: the copy | the network as one body of dots */}
      <section className="pc-hero" aria-labelledby="pc-h1" data-hero="">
        <div className="pc-hero__copy" data-hero-copy="">
          <h1 id="pc-h1" className="pc-h1" data-h1=""><Acc h={HERO.h1} a="settlement" /></h1>
          <p className="pc-hero__body" data-in="">{HERO.body}</p>
          <p className="pc-acts" data-in=""><Btn l={HERO.cta} /></p>
        </div>
        <figure className="pc-hero__art">
          <canvas className="pc-cv pc-cv--hero" data-scene="hero" aria-hidden="true" />
          <figcaption className="sr-only">A sphere of dots, slowly turning, cut into eleven segments: ten open shards and one dark one, the private shard. Every 600 milliseconds a green band runs down one shard, and the shard glows green once the block is final.</figcaption>
        </figure>
      </section>

      {/* ───────────── 2 · proof: the homepage's strip, seven figures */}
      <section className="l-sec pc-proof" aria-label="NEAR Protocol in numbers">
        <ul className="l-row l-proof__row pc-proof__row" data-row="">
          <li className="l-green" aria-hidden="true" role="presentation" />
          {PROOF.map((p, i) => {
            const f = fig(p.value);
            return (
              <li key={p.value} className="l-cell l-fig pc-fig" style={{ ["--i" as string]: i }}>
                <p className="l-fig__v"><span className="l-fig__n">{f.n}</span>{f.u && <span className="l-fig__u">{f.u}</span>}</p>
                <p className="l-fig__c">{p.label}</p>
              </li>
            );
          })}
        </ul>
        <Spacer />
      </section>

      {/* ───────────── 3 · the chapter: the dark band, read sideways on desktop (five panels), stacked elsewhere */}
      <section className="l-sec pc-band" aria-labelledby="pc-ai-t" data-nav-tone="dark">
        <div className="pc-pin" data-pin="">
          <div className="pc-track" data-track="">
            <div className="pc-panel pc-panel--intro" data-panel="">
              <h2 id="pc-ai-t" className="l-h2 pc-h2" data-split=""><Acc h={AI_SCALE.h} a="day one" /></h2>
              <p className="l-lede pc-intro__lede" data-up="">{AI_SCALE.body}</p>
              <ul className="pc-props">
                {AI_SCALE.items.map((it) => (
                  <li key={it.k} className="pc-prop" data-up=""><i className="pc-prop__dot" aria-hidden="true" /><p><b>{it.name}</b> {it.body}</p></li>
                ))}
              </ul>
            </div>
            {STEPS.map((s, i) => (
              <article key={s.k} className="pc-panel" data-panel="" aria-labelledby={`pc-st-${s.k}`}>
                <div className="pc-panel__copy">
                  <h3 id={`pc-st-${s.k}`} className="pc-panel__h">{s.c.h}</h3>
                  <p className="pc-panel__sub">{s.c.sub}</p>
                  <p className="pc-panel__b">{s.c.body}</p>
                  {"link" in s.c && <p className="pc-panel__a"><More l={s.c.link} /></p>}
                </div>
                <figure className="pc-panel__art">
                  <canvas className="pc-cv" data-scene="panel" data-step={i} aria-hidden="true" />
                  <figcaption className="sr-only">{s.scene}</figcaption>
                </figure>
              </article>
            ))}
          </div>
          <div className="pc-prog" aria-hidden="true">
            <i className="pc-prog__fill" data-bar="" />
            {[0, 1, 2, 3, 4].map((k) => <i key={k} className="pc-prog__mark" data-mark={k} style={{ ["--k" as string]: k / 4 }} />)}
          </div>
        </div>
      </section>

      {/* ───────────── 4 · Speed. Scale. Access. */}
      <section className="l-sec pc-speed" aria-labelledby="pc-sp-t">
        <Spacer after />
        <div className="l-row pc-pair" data-row="">
          <div className="l-cell pc-pair__txt">
            <h2 id="pc-sp-t" className="l-h2 pc-h2" data-split="">{SPEED.h}</h2>
            <p className="l-lede" data-rv="">{SPEED.body}</p>
          </div>
          <div className="l-cell pc-pair__art">
            <figure className="pc-fig-art" data-reveal="">
              <canvas className="pc-cv pc-cv--speed" data-scene="speed" aria-hidden="true" />
              <figcaption className="sr-only">A clock face: a hand ticks every 600 milliseconds and leaves a block on the rim; each block turns green two ticks later, when it is final. Around the dial, twelve shards: a contract set down once at the centre appears in all of them at the same instant.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ───────────── 5 · Chain Signatures */}
      <section className="l-sec pc-cs" aria-labelledby="pc-cs-t">
        <Spacer />
        <div className="l-row pc-pair pc-pair--flip" data-row="">
          <div className="l-cell pc-pair__txt">
            <h2 id="pc-cs-t" className="l-h2 pc-h2" data-split="">{CHAIN_SIGNATURES.h}</h2>
            <p className="pc-sub" data-rv="">{CHAIN_SIGNATURES.sub}</p>
            <p className="pc-body" data-rv="">{CHAIN_SIGNATURES.body}</p>
            <p data-rv=""><More l={CHAIN_SIGNATURES.link} /></p>
          </div>
          <div className="l-cell pc-pair__art">
            <figure className="pc-fig-art" data-reveal="">
              <canvas className="pc-cv pc-cv--chains" data-scene="chains" aria-hidden="true" />
              <figcaption className="sr-only">One account asks a column of eight signers; five of them light and send their parts to one point, where a single green seal forms. The seal goes straight to another chain and lands on top of it as that chain&rsquo;s own next block, in turn on three chains with blocks of different shapes, with nothing in between.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ───────────── 6 · developers: the points | the code */}
      <section className="l-sec pc-dev" aria-labelledby="pc-dv-t">
        <Spacer />
        <div className="l-row l-head pc-head" data-row="">
          <div className="l-cell l-head__cell">
            <div>
              <h2 id="pc-dv-t" className="l-h2 pc-h2" data-split=""><Acc h={DEVELOPERS.h} a="developers" /></h2>
              <p className="pc-sub pc-head__sub" data-rv="">{DEVELOPERS.sub}</p>
            </div>
          </div>
        </div>
        <div className="l-row pc-dev__row" data-row="">
          <ul className="l-cell pc-pts">
            {DEVELOPERS.items.map((it) => (
              <li key={it.k} className="pc-pt" data-rv="">
                <i className="pc-pt__ic" data-icon={it.k === "lang" ? "code" : it.k === "gasless" ? "near-com" : "economics"} aria-hidden="true" />
                <p><b>{it.name}</b> {it.body}</p>
              </li>
            ))}
            <li className="pc-pt pc-pt--cta" data-rv=""><Btn l={DEVELOPERS.cta} /></li>
          </ul>
          <div className="l-cell pc-code-cell">
            <figure className="pc-code" data-rv="">
              <figcaption className="pc-code__bar"><span>contract.ts</span><span>near-sdk-js</span></figcaption>
              <pre><code>{code.map((ln, i) => (
                <span key={i} className="pc-code__ln" style={{ ["--n" as string]: i }}>
                  <span className="pc-code__no" aria-hidden="true">{i + 1}</span>
                  <span className="pc-code__t">{codeLine(ln).map((p, j) => (typeof p === "string" ? p : <span key={j} className={`pc-t-${p.c}`}>{p.t}</span>))}{"\n"}</span>
                </span>
              ))}</code></pre>
            </figure>
          </div>
        </div>
      </section>

      {/* ───────────── 7 · the AI layer | NEAR One */}
      <section className="l-sec pc-two" aria-label="NEAR for AI, and the team that builds it">
        <Spacer />
        <div className="l-row pc-two__row" data-row="">
          {[{ c: AI_LAYER, k: "ai", ic: "near-ai", a: AI_LAYER.cta }, { c: NEAR_ONE, k: "one", ic: "people", a: NEAR_ONE.link }].map(({ c, k, ic, a }) => (
            <article key={k} className="l-cell pc-card" aria-labelledby={`pc-${k}-t`}>
              <i className="pc-card__ic" data-icon={ic} aria-hidden="true" />
              <h2 id={`pc-${k}-t`} className="pc-card__h" data-rv="">{c.h}</h2>
              <p className="pc-sub" data-rv="">{c.sub}</p>
              <p className="pc-body" data-rv="">{c.body}</p>
              <p className="pc-card__a" data-rv=""><More l={a} /></p>
            </article>
          ))}
        </div>
      </section>

      {/* ───────────── 8 · Secure NEAR. Evolve NEAR. */}
      <section className="l-sec pc-sec" aria-labelledby="pc-se-t">
        <Spacer />
        <div className="l-row l-head pc-head" data-row="">
          <div className="l-cell l-head__cell"><h2 id="pc-se-t" className="l-h2 pc-h2" data-split="">{SECURE.h}</h2></div>
        </div>
        <ul className="l-row pc-sec__row" data-row="">
          {SECURE.items.map((it) => (
            <li key={it.k} className="l-cell pc-sec__i">
              <i className="pc-card__ic" data-icon={it.k === "validators" ? "near-protocol" : "governance"} aria-hidden="true" />
              <p data-rv=""><b>{it.name}</b> {it.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────── 9 · Go deeper: the homepage's (covers, then rows) */}
      <section className="l-sec pc-deeper" aria-labelledby="pc-gd-t">
        <Spacer />
        <div className="l-row l-head pc-head" data-row="">
          <div className="l-cell l-head__cell">
            <div>
              <h2 id="pc-gd-t" className="l-h2 pc-h2" data-split=""><Acc h={DEEPER.h} a="deeper" /></h2>
              <p className="pc-sub pc-head__sub" data-rv="">{DEEPER.sub}</p>
            </div>
          </div>
        </div>
        <div className="l-row pc-deeper__row" data-row="">
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
