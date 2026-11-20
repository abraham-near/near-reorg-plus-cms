"use client";
// near.org/protocol, version A · "The stack builds". The protocol told as one drawing that keeps building, then as a calm read on the homepage's grid.
// From the top:
//   1 the stage (bare paper, no rules near the header): the H1, its line and Start building beside the hero drawing (HeroArt: the protocol as a plate of
//     shards, the chain on its edge, an account and its key), which builds on load. On desktop the stage then pins: the hero copy hands over to "Built for
//     AI scale from day one" and its three properties, and the drawing plays each one as it is read (a shard fills and splits · the private shard rises ·
//     the key turns quantum-safe). Below 1024 px (or a short screen) nothing pins: the copy follows the drawing, which plays the three steps once;
//   2 the proof strip, the grid's first row (the homepage's: the green rule, the figures);
//   3 Nightshade 3.0 on the dark band, joined to the grid by an empty ruled row above and below (consensus lifts off execution as it passes);
//   4 what it brings, one ruled row each (copy | drawing, alternating): Dynamic resharding, Speed. Scale. Access., Private Shard, Quantum security,
//     Chain Signatures;
//   5 A blockchain for developers: the three points | the contract, typed in;
//   6 A new operating layer for AI: copy | agents in enclaves;
//   7 NEAR One | Secure NEAR. Evolve NEAR.;
//   8 Go deeper on NEAR: five reads as cells;
//   9 the close: the homepage's scene (shared/CloseScene `ruled`, set after this in the route), the grid running into it.
// Copy and links: ../content.ts (the doc, verbatim); the drawings' labels are this version's (Arts.tsx, HeroArt.tsx).
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import {
  AI_LAYER, AI_SCALE, CHAIN_SIGNATURES, DEEPER, DEVELOPERS, HERO, NEAR_ONE, NIGHTSHADE, PRIVATE_SHARD, PROOF, QUANTUM, RESHARDING, SECURE, SPEED, type Link,
} from "../content";
import { HeroArt } from "./HeroArt";
import { ArtAgents, ArtChains, ArtNightshade, ArtPrivate, ArtQuantum, ArtReshard, ArtSpeed } from "./Arts";
import { mount } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./protocol-a.css";

/** a heading with its Kepler word marked (the last occurrence of `a`) */
const Acc = ({ h, a }: { h: string; a?: string }) => {
  const i = a ? h.lastIndexOf(a) : -1;
  return i < 0 || !a ? <>{h}</> : <>{h.slice(0, i)}<span className="accent">{a}</span>{h.slice(i + a.length)}</>;
};
const isExt = (h: string) => /^https?:/.test(h);
const ext = (h: string) => (isExt(h) ? { target: "_blank", rel: "noopener noreferrer" } : {});
const Arrow = () => <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>;
const Ext = () => <svg className="l-ext" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" /></svg>;
const Go = ({ href }: { href: string }) => (isExt(href) ? <><Ext /><span className="sr-only"> (opens another site)</span></> : <Arrow />);
const Btn = ({ l, line = false }: { l: Link; line?: boolean }) => (
  <a className={`l-btn pa-btn${line ? " pa-btn--line" : ""}`} href={l.href} {...ext(l.href)}><span>{l.label}</span><Go href={l.href} /></a>
);
const More = ({ l }: { l: Link }) => <a className="l-link pa-go" href={l.href} {...ext(l.href)}><span>{l.label}</span><Go href={l.href} /></a>;
/** a figure split at its first space when it starts with a number ("5+ years" → "5+" + "years") */
const fig = (v: string) => { const i = v.indexOf(" "); return /^[<$]*\d/.test(v) && i > 0 ? { n: v.slice(0, i), u: v.slice(i + 1) } : { n: v, u: "" }; };
/** the contract's quiet tints: strings, decorators, keywords */
const tint = (ln: string) => ln.split(/('[^']*'|"[^"]*"|@\w+|\b(?:import|from|class|return)\b)/).map((t, i) => {
  if (!t) return null;
  const k = /^['"]/.test(t) ? "s" : t.startsWith("@") ? "d" : /^(import|from|class|return)$/.test(t) ? "k" : "";
  return k ? <span key={i} className={`pa-tk--${k}`}>{t}</span> : t;
});
const Spacer = ({ bleed = false }: { bleed?: boolean }) => (
  <div className="l-row l-spacer" data-row="" data-after-bleed={bleed ? "" : undefined} aria-hidden="true"><div className="l-cell" /></div>
);

/** 4 · the features: one ruled row each, the drawing on alternating sides */
const FEATS = [
  { id: "resharding", c: RESHARDING, art: <ArtReshard /> },
  { id: "speed", c: SPEED, art: <ArtSpeed /> },
  { id: "private-shard", c: PRIVATE_SHARD, art: <ArtPrivate /> },
  { id: "quantum", c: QUANTUM, art: <ArtQuantum /> },
  { id: "chain-signatures", c: CHAIN_SIGNATURES, art: <ArtChains /> },
] as const;

const DEV_ICON: Record<string, string> = { lang: "code", gasless: "near-com", earn: "economics" };
const SEC_ICON: Record<string, string> = { validators: "near-protocol", neps: "docs" };

export function ProtocolA() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);
  const code = DEVELOPERS.code.split("\n");

  return (
    <div ref={ref} className="l-page pr-a">
      {/* ───────────── 1 · the stage: the hero, then Built for AI scale (pinned on desktop) */}
      <section className="pa-stage" aria-labelledby="pa-h1">
        <div className="pa-stage__in">
          <div className="pa-hero__copy">
            <h1 id="pa-h1" className="pa-h1" data-h1=""><Acc h={HERO.h1} a="settlement" /></h1>
            <p className="pa-hero__sub" data-in="">{HERO.body}</p>
            <p className="pa-acts" data-in=""><Btn l={HERO.cta} /></p>
          </div>
          <figure className="pa-hero__art"><HeroArt /></figure>
          <div className="pa-scale" aria-labelledby="pa-scale-t">
            <h2 id="pa-scale-t" className="pa-scale__h"><Acc h={AI_SCALE.h} a="day one" /></h2>
            <p className="pa-scale__b">{AI_SCALE.body}</p>
            <ol className="pa-steps">
              {AI_SCALE.items.map((it, i) => (
                <li key={it.k} className="pa-step" data-k={it.k} style={{ ["--i" as string]: i }}>
                  <i className="pa-step__bar" aria-hidden="true" />
                  <p><strong>{it.name}</strong> {it.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ───────────── 2 · proof: the homepage's strip, the grid's first row */}
      <section className="l-sec pa-proof" aria-label="NEAR Protocol in numbers">
        {/* two ruled rows of four (the first carries the green rule; the last cell is empty), so each row has its own + */}
        {[PROOF.slice(0, 4), PROOF.slice(4)].map((row, r) => (
          <ul key={r} className="l-row l-proof__row pa-proof__row" data-row="">
            {r === 0 && <li className="l-green" aria-hidden="true" role="presentation" />}
            {row.map((p, i) => {
              const v = fig(p.value);
              return (
                <li key={p.value} className="l-cell l-fig pa-fig" style={{ ["--i" as string]: i }}>
                  <p className="l-fig__v"><span className="l-fig__n">{v.n}</span>{v.u && <span className="l-fig__u">{v.u}</span>}</p>
                  <p className="l-fig__c">{p.label}</p>
                </li>
              );
            })}
            {r === 1 && <li className="l-cell pa-fig pa-fig--x" aria-hidden="true" />}
          </ul>
        ))}
        <Spacer />
      </section>

      {/* ───────────── 3 · Nightshade 3.0: the dark band, off the grid (no rules, no +) */}
      <section className="l-sec pa-ns" aria-labelledby="pa-ns-t" data-nav-tone="dark">
        <div className="l-row pa-ns__row" data-row="">
          <div className="l-cell pa-ns__txt">
            <h2 id="pa-ns-t" className="l-h2 pa-h2" data-split=""><Acc h={NIGHTSHADE.h} a="3.0" /></h2>
            <p className="pa-sub" data-rv="">{NIGHTSHADE.sub}</p>
            <p className="l-lede" data-rv="">{NIGHTSHADE.body}</p>
          </div>
          <div className="l-cell pa-ns__art"><figure className="pa-fig-art"><ArtNightshade /></figure></div>
        </div>
      </section>

      {/* ───────────── 4 · the features */}
      <section className="l-sec pa-feats" aria-label="What Nightshade 3.0 brings">
        <Spacer bleed />
        {FEATS.map((ft, i) => {
          const txt = (
            <div className="l-cell pa-ft__txt">
              <h2 id={`pa-${ft.id}-t`} className="pa-h3" data-rv="">{ft.c.h}</h2>
              {"sub" in ft.c && <p className="pa-sub" data-rv="">{ft.c.sub}</p>}
              <p className="pa-body" data-rv="">{ft.c.body}</p>
              {"link" in ft.c && <p className="pa-more" data-rv=""><More l={ft.c.link} /></p>}
            </div>
          );
          const art = <div className="l-cell pa-ft__art"><figure className="pa-fig-art" data-rv="">{ft.art}</figure></div>;
          // a flipped row has its drawing first in the markup, so the grid's rules and + fall between the cells (one column puts the copy back on top)
          return (
            <article key={ft.id} id={ft.id} className={`l-row pa-ft${i % 2 ? " pa-ft--flip" : ""}`} data-row="" aria-labelledby={`pa-${ft.id}-t`}>
              {i % 2 ? <>{art}{txt}</> : <>{txt}{art}</>}
            </article>
          );
        })}
        <Spacer />
      </section>

      {/* ───────────── 5 · developers */}
      <section className="l-sec pa-dev" aria-labelledby="pa-dev-t">
        <div className="l-row l-head pa-head" data-row="">
          <div className="l-cell l-head__cell">
            <h2 id="pa-dev-t" className="l-h2 pa-h2" data-split=""><Acc h={DEVELOPERS.h} a="developers" /></h2>
            <p className="pa-sub" data-rv="">{DEVELOPERS.sub}</p>
          </div>
        </div>
        <div className="l-row pa-dev__row" data-row="">
          <div className="l-cell pa-dev__pts">
            <ul className="pa-pts">
              {DEVELOPERS.items.map((it) => (
                <li key={it.k} data-rv=""><i className="pa-ic" data-icon={DEV_ICON[it.k]} aria-hidden="true" /><p><strong>{it.name}</strong> {it.body}</p></li>
              ))}
            </ul>
            <p data-rv=""><Btn l={DEVELOPERS.cta} /></p>
          </div>
          <div className="l-cell pa-dev__code">
            <figure className="pa-code" data-rv="">
              <figcaption className="pa-code__cap"><span>contract.ts</span><span>near-sdk-js</span></figcaption>
              <pre><code>{code.map((ln, i) => <span key={i} className="pa-code__ln" style={{ ["--i" as string]: i }}>{ln ? tint(ln) : " "}{"\n"}</span>)}</code></pre>
            </figure>
          </div>
        </div>
        <Spacer />
      </section>

      {/* ───────────── 6 · AI layer */}
      <section className="l-sec pa-ai" aria-labelledby="pa-ai-t">
        <div className="l-row pa-ft pa-ft--wide" data-row="">
          <div className="l-cell pa-ft__txt">
            <h2 id="pa-ai-t" className="l-h2 pa-h2" data-split=""><Acc h={AI_LAYER.h} a="AI" /></h2>
            <p className="pa-sub" data-rv="">{AI_LAYER.sub}</p>
            <p className="pa-body" data-rv="">{AI_LAYER.body}</p>
            <p data-rv=""><Btn l={AI_LAYER.cta} line /></p>
          </div>
          <div className="l-cell pa-ft__art"><figure className="pa-fig-art" data-rv=""><ArtAgents /></figure></div>
        </div>
        <Spacer />
      </section>

      {/* ───────────── 7 · NEAR One | Secure NEAR. Evolve NEAR. */}
      <section className="l-sec pa-one" aria-label="Who builds and secures NEAR">
        <div className="l-row pa-one__row" data-row="">
          <article className="l-cell pa-one__c" aria-labelledby="pa-one-t">
            <h2 id="pa-one-t" className="pa-h3" data-rv="">{NEAR_ONE.h}</h2>
            <p className="pa-sub" data-rv="">{NEAR_ONE.sub}</p>
            <p className="pa-body" data-rv="">{NEAR_ONE.body}</p>
            <p className="pa-more" data-rv=""><More l={NEAR_ONE.link} /></p>
          </article>
          <article className="l-cell pa-one__c" aria-labelledby="pa-sec-t">
            <h2 id="pa-sec-t" className="pa-h3" data-rv=""><Acc h={SECURE.h} a="Evolve" /></h2>
            <ul className="pa-pts">
              {SECURE.items.map((it) => (
                <li key={it.k} data-rv=""><i className="pa-ic" data-icon={SEC_ICON[it.k]} aria-hidden="true" /><p><strong>{it.name}</strong> {it.body}</p></li>
              ))}
            </ul>
          </article>
        </div>
        <Spacer />
      </section>

      {/* ───────────── 8 · Go deeper */}
      <section className="l-sec pa-deep" aria-labelledby="pa-deep-t">
        <div className="l-row l-head pa-head" data-row="">
          <div className="l-cell l-head__cell">
            <h2 id="pa-deep-t" className="l-h2 pa-h2" data-split=""><Acc h={DEEPER.h} a="deeper" /></h2>
            <p className="pa-sub" data-rv="">{DEEPER.sub}</p>
          </div>
        </div>
        <ul className="l-row pa-reads" data-row="">
          {DEEPER.items.map((r, j) => (
            <li key={r.href} className="l-cell pa-read" style={{ ["--j" as string]: j }}>
              <a className="pa-read__a" href={r.href} {...ext(r.href)}>
                <i className="pa-read__ic" data-icon="deeper-read" aria-hidden="true" />
                <span className="pa-read__t">{r.title}</span>
                <span className="pa-read__b">{r.body}</span>
                <span className="pa-read__go" aria-hidden="true">{isExt(r.href) ? <Ext /> : <Arrow />}</span>
                {isExt(r.href) && <span className="sr-only"> (opens another site)</span>}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
