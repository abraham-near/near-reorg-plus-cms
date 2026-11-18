"use client";
// near.org/brand, version B: "Drawn". NEAR Foundation's hand (paper, ink hairlines, white tops, light grey sides, one green; v3's ruled grid), the
// same as Community B and Economics B, drawing the brand book as a construction drawing. From the top:
//   1 hero: the headline beside the real mark standing on its tile; as the page scrolls the construction builds round it (Construction.tsx: the grid,
//     the keylines, the mark's box, the clear-space box, the circles of its terminals, the dimensions);
//   2 the principles: one ruled row, three cells, each on its small drawn plinth (Glyphs.tsx);
//   3 the logo (#logos): the six files as specimen plates (paper, or ink for the reversed ones), each with its SVG to download; then the dos and the
//     don'ts as small drawn plates (the don'ts bend the real file with CSS);
//   4 colour: the palette as one iso column, each block as tall as its share of the page (lots of paper and ink, a thin slice of green), beside the
//     swatches with their hex and a copy button (ColorStack.tsx);
//   5 type: the two faces as specimens, their cap height, x-height and baseline drawn across the letters (motion.ts measures them);
//   6 voice: the rules, and the names written right and wrong;
//   7 the close: the homepage's scene (shared/CloseScene), set after this component in the route (app/(site)/brand-b/page.tsx).
// Copy and links: ../content.ts, verbatim. This version's own small labels (the section labels, Download SVG, Copy hex, Do / Don't, the guides'
// names, Write / Not) are in L below.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { HERO, PRINCIPLES, LOGOS, COLOR, TYPE, VOICE } from "../content";
import { Construction } from "./Construction";
import { ColorStack } from "./ColorStack";
import { GLYPHS } from "./Glyphs";
import { Copy, Down, Mark } from "./parts";
import { mountAll } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./brand-b.css";

/* eslint-disable @next/next/no-img-element -- the brand files are small SVGs, shown exactly as they download (next/image leaves SVG alone) */

/** this version's labels (not in content.ts) */
const L = {
  sections: ["Principles", "The files", "The palette", "The typefaces", "The words"],
  download: "Download SVG",
  copy: "Copy hex",
  copied: "Copied",
  copiedMsg: (name: string, hex: string) => `${name} ${hex} copied to the clipboard`,
  copyFail: (hex: string) => `Couldn't copy. The hex is ${hex}`,
  do: "Do",
  dont: "Don't",
  guides: { cap: "cap height", x: "x-height", base: "baseline" },
  write: "Write",
  not: "Not",
  charset: "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789",
};

const idx = (i: number) => String(i + 1).padStart(2, "0");
const file = (src: string) => src.split("/").pop() ?? src;
/** a heading with one word set in Kepler (<span className="accent">) */
function Acc({ text, accent }: { text: string; accent?: string }): ReactNode {
  const i = accent ? text.lastIndexOf(accent) : -1;
  if (!accent || i < 0) return text;
  return <>{text.slice(0, i)}<span className="accent">{accent}</span>{text.slice(i + accent.length)}</>;
}
function Btn({ href, label, fill }: { href: string; label: string; fill?: boolean }) {
  return <a className={`bb-btn${fill ? " bb-btn--fill" : ""}`} href={href}><span>{label}</span></a>;
}
function Head({ n, id, h, accent, lede }: { n: number; id: string; h: string; accent?: string; lede?: string }) {
  return (
    <div className={`l-row bb-head${lede ? "" : " bb-head--solo"}`} data-row="">
      <div className="l-cell bb-head__h">
        <p className="bb-eb" data-rv=""><span className="bb-n">{idx(n)}</span>{L.sections[n]}</p>
        <h2 id={id} className="bb-h2" data-rise=""><Acc text={h} accent={accent} /></h2>
      </div>
      {lede && <div className="l-cell bb-head__end"><p className="l-lede bb-lede" data-rv="">{lede}</p></div>}
    </div>
  );
}
/** a specimen plate: drafting paper (or ink), crop marks at its corners */
function Plate({ dark, cls = "", children }: { dark?: boolean; cls?: string; children: ReactNode }) {
  return (
    <div className={`bb-plate${dark ? " is-dark" : ""} ${cls}`}>
      <i className="bb-cm bb-cm--tl" /><i className="bb-cm bb-cm--tr" /><i className="bb-cm bb-cm--bl" /><i className="bb-cm bb-cm--br" />
      {children}
    </div>
  );
}

/* the dos and the don'ts, drawn: the real files, as they should be and bent out of shape */
const DO_FIGS: (() => ReactNode)[] = [
  () => <Plate cls="bb-dd__plate"><span className="bb-room"><img src="/brand/logo.svg" alt="" /><b className="bb-room__x bb-room__x--t">x</b><b className="bb-room__x bb-room__x--l">x</b></span></Plate>,
  () => <Plate cls="bb-dd__plate"><img className="bb-dd__logo" src="/brand/logo.svg" alt="" /></Plate>,
  () => <Plate cls="bb-dd__plate" dark><img className="bb-dd__logo" src="/brand/logo_rev.svg" alt="" /></Plate>,
];
const DONT_FIGS: (() => ReactNode)[] = [
  () => <Plate cls="bb-dd__plate"><span className="bb-pair"><img src="/brand/icon.svg" alt="" /><img src="/brand/near-wordmark.svg" alt="" /></span></Plate>,
  () => (
    <Plate cls="bb-dd__plate">
      <span className="bb-bent">
        <img className="is-stretch" src="/brand/icon.svg" alt="" />
        <img className="is-rotate" src="/brand/icon.svg" alt="" />
        <img className="is-outline" src="/brand/icon.svg" alt="" />
        <span className="is-recolor" />
      </span>
    </Plate>
  ),
  () => <Plate cls="bb-dd__plate bb-busy"><img className="bb-dd__logo" src="/brand/logo_rev.svg" alt="" /></Plate>,
];

export function BrandB() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mountAll);

  // copy hex: the clipboard, a polite message for screen readers, and the button's label for a moment
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = useCallback((name: string, hex: string) => {
    const done = (ok: boolean) => {
      setMsg(ok ? L.copiedMsg(name, hex) : L.copyFail(hex));
      setCopied(ok ? hex : null);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(null), 1800);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(hex).then(() => done(true), () => done(false));
    else done(false);
  }, []);
  const [hl, setHl] = useState<string | null>(null);

  return (
    <div ref={ref} className="l-page br-b">
      {/* ───────────── 1 · hero: the mark, and its construction building round it */}
      <section className="bb-hero" aria-labelledby="bb-h1">
        <div className="bb-hero__stage">
          <div className="bb-hero__copy">
            <p className="bb-kick" data-hero-up=""><i aria-hidden="true" />{HERO.eyebrow}</p>
            <h1 id="bb-h1" className="bb-h1"><Acc text={HERO.h1} accent={HERO.accent} /></h1>
            <p className="bb-hero__sub" data-hero-up="">{HERO.sub}</p>
            <p className="bb-hero__btns" data-hero-up="">
              <Btn href={HERO.primary.href} label={HERO.primary.label} fill />
              <Btn href={HERO.secondary.href} label={HERO.secondary.label} />
            </p>
          </div>
          <div className="bb-hero__art" aria-hidden="true"><Construction /></div>
        </div>
      </section>

      {/* ───────────── 2 · the principles, each on its plinth */}
      <section className="l-sec bb-pr" aria-labelledby="bb-pr-t">
        <Head n={0} id="bb-pr-t" h={PRINCIPLES.h} accent="forward-looking" />
        <ul className="l-row bb-pr__row" data-row="">
          {PRINCIPLES.items.map((p, i) => {
            const G = GLYPHS[p.k];
            return (
              <li key={p.k} className="l-cell bb-pr__cell">
                <div className="bb-pr__art">{G && <G />}</div>
                <p className="bb-n" data-rv="">{idx(i)}</p>
                <h3 className="bb-h3" data-rv="">{p.title}</h3>
                <p className="bb-body" data-rv="">{p.body}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ───────────── 3 · the logo: the files, then the dos and the don'ts */}
      <section className="l-sec bb-lg" id={LOGOS.id} aria-labelledby="bb-lg-t">
        <Head n={1} id="bb-lg-t" h={LOGOS.h} lede={LOGOS.intro} />
        <ul className="l-row bb-cards" data-row="">
          {LOGOS.assets.map((a, i) => (
            <li key={a.k} className="l-cell bb-card">
              <Plate dark={a.dark} cls="bb-card__plate">
                <span className={`bb-card__in bb-card__in--${a.k}`}><img src={a.src} alt="" /></span>
                <span className="bb-card__file" aria-hidden="true">{file(a.src)}</span>
              </Plate>
              <p className="bb-n bb-card__n">{idx(i)}</p>
              <h3 className="bb-card__t">{a.name}</h3>
              <p className="bb-card__d">{a.desc}</p>
              <a className="bb-dl" href={a.src} download aria-label={`${L.download}: ${a.name}`}><Down /><span>{L.download}</span></a>
            </li>
          ))}
        </ul>
        <div className="l-row bb-dd" data-row="">
          {([[L.do, LOGOS.dos, DO_FIGS, true], [L.dont, LOGOS.donts, DONT_FIGS, false]] as const).map(([label, items, figs, ok]) => (
            <div key={label} className="l-cell bb-dd__col">
              <h3 className="bb-dd__h" data-rv=""><Mark ok={ok} />{label}</h3>
              <ul className="bb-dd__list">
                {items.map((t, i) => (
                  <li key={t} className="bb-dd__item">
                    {figs[i]?.()}
                    <p className="bb-dd__t"><span className="bb-n">{idx(i)}</span>{t}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── 4 · colour: the column of blocks | the swatches */}
      <section className="l-sec bb-co" id="color" aria-labelledby="bb-co-t">
        <Head n={2} id="bb-co-t" h={COLOR.h} lede={COLOR.intro} />
        <div className="l-row bb-co__row" data-row="">
          <div className="l-cell bb-co__art"><figure className="bb-fig" data-hl={hl ?? undefined}><ColorStack /></figure></div>
          <div className="l-cell bb-co__list">
            <ul className="bb-sw">
              {COLOR.swatches.map((s) => (
                <li key={s.k} className="bb-sw__row" onPointerEnter={() => setHl(s.k)} onPointerLeave={() => setHl(null)} onFocus={() => setHl(s.k)} onBlur={() => setHl(null)}>
                  <span className="bb-sw__chip" style={{ background: s.hex }} aria-hidden="true" />
                  <span className="bb-sw__txt"><span className="bb-sw__name">{s.name}</span><span className="bb-sw__role">{s.role}</span></span>
                  <code className="bb-sw__hex">{s.hex}</code>
                  <button type="button" className={`bb-sw__btn${copied === s.hex ? " is-done" : ""}`} onClick={() => copy(s.name, s.hex)} aria-label={`${L.copy}: ${s.name}, ${s.hex}`}>
                    <Copy /><span>{copied === s.hex ? L.copied : L.copy}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="sr-only" role="status" aria-live="polite">{msg}</p>
          </div>
        </div>
      </section>

      {/* ───────────── 5 · type: the two faces, their guides drawn across */}
      <section className="l-sec bb-ty" id="type" aria-labelledby="bb-ty-t">
        <Head n={3} id="bb-ty-t" h={TYPE.h} lede={TYPE.intro} />
        <ul className="l-row bb-ty__row" data-row="">
          {TYPE.faces.map((t, i) => (
            <li key={t.k} className={`l-cell bb-spec bb-spec--${t.k}`}>
              <p className="bb-eb bb-spec__k"><span className="bb-n">{idx(i)}</span>{t.name}</p>
              <p className="bb-spec__role">{t.role}</p>
              <div className="bb-spec__aa" data-guides="" aria-hidden="true">
                <span className="bb-spec__glyph">Aa<span className="bb-spec__base" /></span>
                <span className="bb-guide bb-guide--cap"><b>{L.guides.cap}</b></span>
                <span className="bb-guide bb-guide--x"><b>{L.guides.x}</b></span>
                <span className="bb-guide bb-guide--base"><b>{L.guides.base}</b></span>
              </div>
              <p className="bb-spec__sample">{t.k === "kepler" ? <span className="accent">{t.sample}</span> : t.sample}</p>
              <p className="bb-spec__set" aria-hidden="true">{L.charset}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────── 6 · voice: the rules | the names */}
      <section className="l-sec bb-vo" id="voice" aria-labelledby="bb-vo-t">
        <Head n={4} id="bb-vo-t" h={VOICE.h} lede={VOICE.intro} />
        <div className="l-row bb-vo__row" data-row="">
          <div className="l-cell bb-vo__rules">
            <ol className="bb-rules">
              {VOICE.rules.map((r, i) => (
                <li key={r.title} className="bb-rule" data-rv="">
                  <span className="bb-n">{idx(i)}</span>
                  <h3 className="bb-rule__t">{r.title}</h3>
                  <p className="bb-rule__b">{r.body}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="l-cell bb-vo__names">
            <table className="bb-names">
              <thead><tr><th scope="col"><span><Mark ok />{L.write}</span></th><th scope="col"><span><Mark ok={false} />{L.not}</span></th></tr></thead>
              <tbody>
                {VOICE.naming.map((n) => (
                  <tr key={n.right} data-rv=""><td className="bb-names__ok">{n.right}</td><td className="bb-names__no">{n.wrong}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
