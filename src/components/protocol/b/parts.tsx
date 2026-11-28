// Protocol B's sections as parts, shared by version B (ProtocolB.tsx, /protocol-b) and the final page (../final/ProtocolFinal.tsx, /protocol): the dark
// chapter (its steps chosen by the page), Speed. Scale. Access., Chain Signatures, developers, the AI layer | NEAR One, Secure NEAR. Evolve NEAR. and
// Go deeper, plus the small pieces they share (buttons, links, the Kepler word, the ruled spacer). No hooks here: the parts render on the server or the
// client alike; the motion is the page's (./motion.ts finds them by their markup). Styles: ./protocol-b.css, under .pr-b.
import { Button, TextLink } from "@/components/ui";
import { AI_LAYER, AI_SCALE, CHAIN_SIGNATURES, DEEPER, DEVELOPERS, NEAR_ONE, NIGHTSHADE, PRIVATE_SHARD, QUANTUM, RESHARDING, SECURE, SPEED, type Link } from "../content";

export const isExt = (h: string) => /^https?:/.test(h);
export const ext = (h: string) => (isExt(h) ? { target: "_blank", rel: "noopener noreferrer" } : {});
export const Arrow = () => <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>;
export const Ext = () => <svg className="l-ext" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" /></svg>;
export const Go = ({ href }: { href: string }) => (isExt(href) ? <><Ext /><span className="sr-only"> (opens another site)</span></> : <Arrow />);
const ExtSr = ({ href }: { href: string }) => (isExt(href) ? <span className="sr-only"> (opens another site)</span> : null);
/** the page's pill: the site's Button (P1, components/ui), primary or (line) secondary; ↗ and a new tab for another site */
export const Btn = ({ l, line = false }: { l: Link; line?: boolean }) => (
  <Button href={l.href} external={isExt(l.href)} variant={line ? "secondary" : "primary"} className="pb-btn">{l.label}<ExtSr href={l.href} /></Button>
);
/** the onward link: the site's TextLink (L3), inline so a long label wraps; ↗ and a new tab for another site */
export const More = ({ l }: { l: Link }) => (
  <TextLink href={l.href} external={isExt(l.href)} inline className="pb-go">{l.label}<ExtSr href={l.href} /></TextLink>
);
/** a heading with its Kepler word marked (the last occurrence of `a`) */
export const Acc = ({ h, a }: { h: string; a: string }) => {
  const i = h.lastIndexOf(a);
  return i < 0 ? <>{h}</> : <>{h.slice(0, i)}<span className="accent">{a}</span>{h.slice(i + a.length)}</>;
};
/** "5+ years" → "5+" and "years", as the homepage's value + unit */
export const fig = (v: string) => { const i = v.indexOf(" "); return /^\$?\d/.test(v) && i > 0 ? { n: v.slice(0, i), u: v.slice(i + 1) } : { n: v, u: "" }; };
export const Spacer = ({ after }: { after?: boolean }) => <div className="l-row l-spacer" data-row="" data-after-bleed={after ? "" : undefined} aria-hidden="true"><div className="l-cell" /></div>;

/** the chapter's four steps on the lanes: `kind` is the scene's step (motion.ts: stepParams), `of` the property it belongs to (the index) */
export const STEPS = [
  { k: "nightshade", kind: 0, of: 0, c: NIGHTSHADE, scene: "Consensus above the shards: each new chunk sends a state witness up to the block, and validators check it without holding the state." },
  { k: "resharding", kind: 1, of: 0, c: RESHARDING, scene: "One shard fills up; at its threshold it splits in two at the now line, with no vote." },
  { k: "private", kind: 2, of: 1, c: PRIVATE_SHARD, scene: "The private shard's chunks are shielded; a lens opens one window on their contents." },
  { k: "quantum", kind: 3, of: 2, c: QUANTUM, scene: "An account rotates its key from Ed25519 to ML-DSA in a single transaction." },
] as const;
export type StepKey = (typeof STEPS)[number]["k"];

/** Go deeper: two covers (the homepage's photos for the two posts it has), the rest as rows */
const COVERS: Record<string, string> = {
  "https://www.near.org/blog/agent-economy": "/images/home/deeper/home-deeper-who-owns-the-rails-v2.webp",
  "https://www.near.org/blog/making-near-protocol-post-quantum-safe": "/images/home/deeper/home-deeper-quantum-readiness-v2.webp",
};
/** a Go deeper item: its link, title, one line, and a cover (null: none) */
export type DeeperItem = { href: string; title: string; body: string; img: string | null };
/** the doc's Go deeper items (near.org posts), their lines capitalised, the two with the homepage's photos carrying them */
export const DEEPER_ITEMS: DeeperItem[] = DEEPER.items.map((it) => ({ href: it.href, title: it.title, body: it.body.charAt(0).toUpperCase() + it.body.slice(1), img: COVERS[it.href] ?? null }));
const FALLBACK_COVERS = Object.values(COVERS);

/** the code, coloured by a small hand-written pass (keywords, strings, decorators): no highlighter shipped for one block */
export function codeLine(s: string) {
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

/** 3 · the chapter: the dark band, the three properties, the pinned stage carrying `steps` (all four on B) */
export function Band({ steps = ["nightshade", "resharding", "private", "quantum"], ids = false, elsewhere = {} }: {
  steps?: readonly StepKey[];
  /** give each step its section's id (#nightshade …), for a page whose index links to them */
  ids?: boolean;
  /** a property with no step here, by its key (AI_SCALE.items): where on the page it lives instead (the index links there; it never lights) */
  elsewhere?: Partial<Record<string, string>>;
}) {
  const on = STEPS.filter((s) => steps.includes(s.k));
  const has = new Set<number>(on.map((s) => s.of));
  return (
    <section className="l-sec pb-band" aria-labelledby="pb-ai-t" data-nav-tone="dark" data-ui-tone="dark">
      <div className="pb-band__intro">
        <h2 id="pb-ai-t" className="l-h2 pb-h2" data-split=""><Acc h={AI_SCALE.h} a="day one" /></h2>
        <p className="l-lede" data-up="">{AI_SCALE.body}</p>
      </div>
      <div className="pb-stage" data-stage="">
        <ol className="pb-idx" aria-label="The three properties">
          {AI_SCALE.items.map((it, i) => {
            const away = !has.has(i) ? elsewhere[it.k] : undefined;
            return (
              <li key={it.k} className={`pb-idx__i${away ? " pb-idx__i--away" : ""}`} data-of={i}>
                <i className="pb-idx__dot" aria-hidden="true" />
                {away
                  ? <p><TextLink href={away} inline className="pb-idx__go"><b>{it.name}</b> {it.body}<span className="sr-only"> (further down the page)</span></TextLink></p>
                  : <p><b>{it.name}</b> {it.body}</p>}
              </li>
            );
          })}
        </ol>
        <div className="pb-stage__main">
          <div className="pb-steps">
            {on.map((s) => (
              <article key={s.k} id={ids ? s.k : undefined} className="pb-step" data-step={s.kind} data-of={s.of} aria-labelledby={`pb-st-${s.k}`}>
                <p className="pb-step__n" aria-hidden="true">{AI_SCALE.items[s.of].name.replace(/\.$/, "")}</p>
                <h3 id={`pb-st-${s.k}`} className="pb-step__h">{s.c.h}</h3>
                <p className="pb-step__sub">{s.c.sub}</p>
                <p className="pb-step__b">{s.c.body}</p>
                {"link" in s.c && <p className="pb-step__a"><More l={s.c.link} /></p>}
                {/* phones and reduced motion: each step keeps its own scene */}
                <figure className="pb-step__art">
                  <canvas className="pb-cv pb-cv--step" data-scene="step" data-step={s.kind} aria-hidden="true" />
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
  );
}

/** 4 · Speed. Scale. Access.: the copy | the metronome */
export function Speed({ id }: { id?: string }) {
  return (
    <section id={id} className="l-sec pb-speed" aria-labelledby="pb-sp-t">
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
  );
}

/** 5 · Chain Signatures: the copy | the lanes of other chains */
export function ChainSignatures() {
  return (
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
  );
}

/** 6 · developers: the points and the button | the code, in the site's hand */
export function Developers() {
  const code = DEVELOPERS.code.split("\n");
  return (
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
  );
}

/** 7 · the AI layer | NEAR One, side by side */
export function AiAndNearOne() {
  return (
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
  );
}

/** 8 · Secure NEAR. Evolve NEAR.: validators | NEPs */
export function Secure() {
  return (
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
  );
}

/** 9 · Go deeper: the homepage's (two covers, the rest as rows). `items`: the page's own (the first two as covers, a missing cover taking one of the
 *  homepage's photos); none: the doc's, the two with photos as covers */
export function Deeper({ items }: { items?: readonly DeeperItem[] } = {}) {
  const featured = items ? items.slice(0, 2).map((it, i) => ({ ...it, img: it.img ?? FALLBACK_COVERS[i % FALLBACK_COVERS.length] })) : DEEPER_ITEMS.filter((it) => it.img);
  const rows = items ? items.slice(2) : DEEPER_ITEMS.filter((it) => !it.img);
  return (
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
        {featured.map((it) => (
          <div key={it.href} className="l-cell l-feat-cell">
            <article className="l-feat">
              <a className="l-feat__a" href={it.href} {...ext(it.href)}>
                {/* eslint-disable-next-line @next/next/no-img-element -- the homepage's Go deeper covers, as its own markup (lazy, decoded off the main thread) */}
                <div className="l-ph l-feat__ph" data-ph=""><img className="l-img" src={it.img ?? ""} alt="" loading="lazy" decoding="async" /></div>
                <span className="l-feat__body">
                  <span className="l-meta t-label">Read</span>
                  <span className="l-feat__t">{it.title}{isExt(it.href) && <span className="sr-only"> (another site)</span>}</span>
                  {it.body && <span className="l-feat__src">{it.body}</span>}
                </span>
              </a>
            </article>
          </div>
        ))}
        <div className="l-cell l-list-cell">
          <ol className="l-tiles" aria-label="More deep dives">
            {rows.map((it, j) => (
              <li key={it.href} className="l-tile" style={{ ["--j" as string]: j }}>
                <a className="l-tile__a" href={it.href} {...ext(it.href)}>
                  <i className="l-glyph" data-icon="deeper-read" aria-hidden="true" /><span className="l-tile__meta t-label">Read</span>
                  <span className="l-tile__t">{it.title}{isExt(it.href) && <span className="sr-only"> (another site)</span>}</span>
                  {it.body && <span className="l-tile__src">{it.body}</span>}
                  <span className="l-tile__go" aria-hidden="true"><Arrow /></span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
