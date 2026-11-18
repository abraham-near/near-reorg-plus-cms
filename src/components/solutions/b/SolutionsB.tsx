"use client";
// near.org/solutions, version B: "Drawn". NEAR Foundation's hand (paper, ink hairlines, white tops, light grey sides, one green; v3's ruled grid), the
// same as Economics B and Community B, drawing each solution as a small machine you could build. From the top (the doc's order):
//   1 hero: the headline beside the hub (Hero.tsx): NEAR at the centre, the five solutions round it as stations, signals running the routes;
//   2 the proof strip: the five figures in one ruled row, each on its small drawn plinth (Proof.tsx), counting once;
//   3 "What the world is building on NEAR" (#solutions): the five solutions, one ruled row each, the text beside its drawing (Scenes.tsx), the sides
//      alternating; each drawing builds as it arrives and then lives;
//   4 the spotlight (#confidential): Confidential Intents beside the private shard (Shard.tsx), its entries under their bars, one opened;
//   5 "Integrated across…" (#builders): the logo wall, quiet: the logos in the repo in one ink and one height, the rest set as names;
//   6 the close: the homepage's scene (shared/CloseScene), set after this component in the route (app/(site)/solutions-b/page.tsx).
// Copy and links: ../content.ts, verbatim. The section labels (Solutions, Confidential Intents, Who builds on NEAR) and the accent words are this version's.
import { useRef, type ReactNode } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { HERO, PROOF, SOLUTIONS, SPOTLIGHT, BUILDERS } from "../content";
import { HeroHub } from "./Hero";
import { PROOF_ART } from "./Proof";
import { SCENES } from "./Scenes";
import { Shard } from "./Shard";
import { Arrow, Count, Ext } from "./parts";
import { mountAll } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./solutions-b.css";

const ext = (h: string) => /^https?:/.test(h);
const out = (h: string) => (ext(h) ? { target: "_blank", rel: "noopener" } : {});
/** a heading with one word set in Kepler (<span className="accent">) */
function Acc({ text, accent }: { text: string; accent: string }): ReactNode {
  const i = text.lastIndexOf(accent);
  if (i < 0) return text;
  return <>{text.slice(0, i)}<span className="accent">{accent}</span>{text.slice(i + accent.length)}</>;
}
function Btn({ href, label, fill }: { href: string; label: string; fill?: boolean }) {
  return <a className={`sb-btn${fill ? " sb-btn--fill" : ""}`} href={href} {...out(href)}><span>{label}</span>{ext(href) && <Ext className="sb-ext sb-btn__ext" />}</a>;
}
function Go({ href, label }: { href: string; label: string }) {
  return <a className="l-link sb-go" href={href} {...out(href)}><span>{label}</span>{ext(href) ? <Ext /> : <Arrow />}</a>;
}
function Head({ label, id, h, accent }: { label: string; id: string; h: string; accent: string }) {
  return (
    <div className="l-row sb-head" data-row="">
      <div className="l-cell">
        <p className="sb-eb" data-rv=""><i aria-hidden="true" />{label}</p>
        <h2 id={id} className="sb-h2" data-rise=""><Acc text={h} accent={accent} /></h2>
      </div>
    </div>
  );
}

export function SolutionsB() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mountAll);
  return (
    <div ref={ref} className="l-page so-b">
      {/* ───────────── 1 · hero: NEAR and the five solutions round it */}
      <section className="sb-hero" aria-labelledby="sb-h1">
        <div className="sb-hero__stage">
          <div className="sb-hero__art" aria-hidden="true"><div className="sb-hero__cam"><HeroHub /></div></div>
          <div className="sb-hero__copy">
            <p className="sb-kick" data-hero-up=""><i aria-hidden="true" />{HERO.eyebrow}</p>
            <h1 id="sb-h1" className="sb-h1"><Acc text={HERO.h1} accent={HERO.accent} /></h1>
            <p className="sb-hero__sub" data-hero-up="">{HERO.sub}</p>
            <p className="sb-hero__btns" data-hero-up=""><Btn href={HERO.primary.href} label={HERO.primary.label} fill /></p>
          </div>
        </div>
      </section>

      {/* ───────────── 2 · the proof strip: five figures, each on its plinth */}
      <section className="l-sec sb-pf" aria-label="NEAR in figures">
        <ul className="l-row sb-pf__row" data-row="">
          {PROOF.map((p, i) => {
            const G = PROOF_ART[i];
            return (
              <li key={p.value} className="l-cell sb-pf__cell">
                <div className="sb-pf__art">{G && <G />}</div>
                <p className="sb-pf__v"><Count v={p.value} delay={i * 90} /></p>
                <p className="sb-pf__l">{p.label}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ───────────── 3 · the five solutions, each beside its drawing */}
      <section className="l-sec sb-sol" id="solutions" aria-labelledby="sb-sol-t">
        <Head label="Solutions" id="sb-sol-t" h={SOLUTIONS.h} accent="building" />
        {SOLUTIONS.items.map((s, i) => {
          const Art = SCENES[s.k];
          return (
            <article key={s.k} id={s.k} className={`l-row sb-item${i % 2 ? " sb-item--flip" : ""}`} data-row="" aria-labelledby={`sb-${s.k}`}>
              <div className="l-cell sb-item__txt">
                <p className="sb-n" data-rv="">{s.n}</p>
                <h3 id={`sb-${s.k}`} className="sb-h3" data-rise="">{s.title}</h3>
                <p className="sb-body" data-rv="">{s.body}</p>
                {s.builders.length > 0 && (
                  <ul className="sb-chips" data-rv="">{s.builders.map((b) => <li key={b}>{b}</li>)}</ul>
                )}
                <p className="sb-item__cta" data-rv=""><Go href={s.link.href} label={s.link.label} /></p>
              </div>
              <div className="l-cell sb-item__art"><figure className="sb-fig">{Art && <Art />}</figure></div>
            </article>
          );
        })}
      </section>

      {/* ───────────── 4 · the spotlight: Confidential Intents, the private shard */}
      <section className="l-sec sb-sp" id="confidential" aria-labelledby="sb-sp-t">
        <div className="l-row sb-sp__row" data-row="">
          <div className="l-cell sb-sp__art"><figure className="sb-fig"><Shard /></figure></div>
          <div className="l-cell sb-sp__txt">
            <p className="sb-eb" data-rv=""><i aria-hidden="true" />Confidential Intents</p>
            <h2 id="sb-sp-t" className="sb-h2" data-rise=""><Acc text={SPOTLIGHT.h} accent="confidentiality" /></h2>
            <p className="sb-body sb-sp__body" data-rv="">{SPOTLIGHT.body}</p>
            <p className="sb-sp__cta" data-rv=""><Btn href={SPOTLIGHT.link.href} label={SPOTLIGHT.link.label} /></p>
          </div>
        </div>
      </section>

      {/* ───────────── 5 · who builds on NEAR: the logo wall */}
      <section className="l-sec sb-bd" id="builders" aria-labelledby="sb-bd-t">
        <Head label="Who builds on NEAR" id="sb-bd-t" h={BUILDERS.h} accent="infrastructure" />
        <ul className="l-row sb-bd__row" data-row="">
          {BUILDERS.logos.map((l) => (
            <li key={l.name} className="l-cell sb-bd__cell">
              {l.src
                // eslint-disable-next-line @next/next/no-img-element
                ? <img className="sb-bd__logo" src={l.src} alt={l.name} loading="lazy" decoding="async" data-rv="" />
                : <span className="sb-bd__name" data-rv="">{l.name}</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
