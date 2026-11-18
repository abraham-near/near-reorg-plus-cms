"use client";
// near.org/brand, version A · "Ruled grid": the Brand page as a specimen sheet on the homepage's ruled grid (v3/proof-deeper: ruled rows that draw in,
// + crosshairs, mono labels), with Blog J's ruled hero and bar, as Economics A and Community A use them. Every file is shown on its own plate and can be
// downloaded from it. From the top:
//   1 hero: the ruled head (the H1 and the two actions | the subhead), its bar (on this page · the file count), then the cover plates: the logo on paper,
//     the mark on ink, each with its file name and its size (the SVG's viewBox) in the corners;
//   2 principles: three ruled cells;
//   3 logo: the six files as asset cells on two ruled rows (a plate on paper, or on ink for the dark ones; name, use, an SVG download), then the do and
//     don't lists as two ruled columns, each line beside a small plate drawn on the real file (the don'ts: side by side, stretched, on a busy photo);
//   4 color: the swatches on two rows (the neutrals, then the greens), each with its name, hex, role and a copy button (one polite live region says "Copied");
//   5 type: the two faces as large specimens on the site's own font variables (Montreal, then Kepler, the .accent face);
//   6 voice: the rules as ruled rows, then the naming table (right | wrong);
//   7 the close: the homepage's scene (shared/CloseScene, on its ruled row), set after this component in the route (app/(site)/brand-a/page.tsx).
// Copy and files: ../content.ts and public/brand/. Only the small labels below are local (NAV, L, the glyph line, the SVG sizes).
/* eslint-disable @next/next/no-img-element -- the brand files are SVGs shown exactly as downloaded (next/image leaves SVG alone); the one photo is a small WebP */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { COLOR, HERO, LOGOS, PRINCIPLES, TYPE, VOICE, type Asset, type Swatch } from "../content";
import { mount } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./brand-a.css";

/** a heading from the content file with its Kepler word marked (the last occurrence of `a`); punctuation right after it stays on its line */
const Acc = ({ h, a }: { h: string; a?: string }) => {
  const i = a ? h.lastIndexOf(a) : -1;
  if (i < 0 || !a) return <>{h}</>;
  const end = i + a.length, p = /^[,.;:!?]*/.exec(h.slice(end))?.[0] ?? "";
  return <>{h.slice(0, i)}<span className="ba-nb"><span className="accent">{a}</span>{p}</span>{h.slice(end + p.length)}</>;
};
const idx = (i: number) => String(i + 1).padStart(2, "0");
const file = (src: string) => src.split("/").pop() ?? src;

/** local labels (the content file has none for these) */
const L = { principles: "Principles", do: "Do", dont: "Don't", right: "Right", wrong: "Wrong", copy: "Copy hex", copied: "Copied", download: "SVG", files: "files", svg: "SVG", naming: "Naming" };
const NAV = [
  { href: "#ba-principles", label: L.principles },
  { href: `#${LOGOS.id}`, label: LOGOS.h },
  { href: "#ba-color", label: COLOR.h },
  { href: "#ba-type", label: TYPE.h },
  { href: "#ba-voice", label: VOICE.h },
];
/** each SVG's viewBox size (public/brand/), shown on the plates as a spec */
const SIZE: Record<string, string> = { logo: "1656 × 567", "logo-rev": "1656 × 567", wordmark: "981 × 255", icon: "639 × 639", "icon-rev": "639 × 639", token: "1080 × 1080" };
/** the glyph line under each specimen (a type sheet's standard set) */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789";

const asset = (k: string) => LOGOS.assets.find((a) => a.k === k) as Asset;

const Arrow = ({ down }: { down?: boolean }) => (
  <svg className={`l-arr${down ? " ba-down" : ""}`} viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
/** a download glyph: the arrow into a tray */
const Dl = () => (
  <svg className="ba-dl" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M2.5 13.5h11" /></svg>
);
/** the mark beside a do (a tick) or a don't (a cross), drawn: the fonts have no such glyphs */
const Mark = ({ ok }: { ok: boolean }) => (
  <svg className={`ba-mk${ok ? " ba-mk--ok" : " ba-mk--no"}`} viewBox="0 0 12 12" aria-hidden="true" focusable="false">
    {ok ? <path d="M2.5 6.4 5 8.8l4.5-5.6" /> : <path d="M3 3l6 6M9 3 3 9" />}
  </svg>
);

/** a plate: the file on paper (or on ink), with + ticks in its corners */
function Plate({ a, className = "", children }: { a?: Asset; className?: string; children?: ReactNode }) {
  return (
    <div className={`ba-plate${a?.dark ? " ba-plate--ink" : ""} ${className}`}>
      <i className="ba-tk ba-tk--tl" aria-hidden="true" /><i className="ba-tk ba-tk--tr" aria-hidden="true" />
      <i className="ba-tk ba-tk--bl" aria-hidden="true" /><i className="ba-tk ba-tk--br" aria-hidden="true" />
      {children ?? (a && <img className={`ba-plate__img ba-img--${a.k}`} src={a.src} alt="" draggable={false} />)}
    </div>
  );
}

/* the small plates beside the do and don't lines, in their order (content.ts LOGOS.dos / donts) */
const DO_FIG = [
  <Plate key="room" className="ba-fig ba-fig--room"><span className="ba-room" aria-hidden="true"><img src={asset("logo").src} alt="" /></span></Plate>,
  <Plate key="asis" className="ba-fig" a={asset("logo")} />,
  <Plate key="rev" className="ba-fig" a={asset("logo-rev")} />,
];
const DONT_FIG = [
  <Plate key="side" className="ba-fig ba-fig--side"><span className="ba-side" aria-hidden="true"><img src={asset("icon").src} alt="" /><img src={asset("wordmark").src} alt="" /></span></Plate>,
  <Plate key="stretch" className="ba-fig ba-fig--stretch"><img className="ba-stretch" src={asset("logo").src} alt="" /></Plate>,
  <Plate key="busy" className="ba-fig ba-fig--busy">
    <img className="ba-busy__ph" src="/v3/bleed-ridges.webp" alt="" loading="lazy" decoding="async" />
    <img className="ba-busy__logo" src={asset("logo").src} alt="" />
  </Plate>,
];

function SwatchCell({ s, i, onCopy, copied }: { s: Swatch; i: number; onCopy: (s: Swatch, el: HTMLElement | null) => void; copied: boolean }) {
  const hexRef = useRef<HTMLParagraphElement>(null);
  return (
    <li className={`l-cell ba-sw${s.dark ? " ba-sw--dark" : ""}`} style={{ ["--j" as string]: i }}>
      <div className="ba-sw__chip" style={{ background: s.hex }} aria-hidden="true">
        <span className="ba-sw__k">{idx(i)} <span>/</span> {s.k}</span>
      </div>
      <div className="ba-sw__txt">
        <h3 className="ba-sw__n">{s.name}</h3>
        <p ref={hexRef} className="ba-sw__hex">{s.hex}</p>
        <p className="ba-sw__r">{s.role}</p>
        <button type="button" className="ba-copy" data-copied={copied ? "" : undefined} onClick={() => onCopy(s, hexRef.current)}
          aria-label={`${L.copy}: ${s.name}, ${s.hex}`}>
          <i aria-hidden="true" /><span>{copied ? L.copied : L.copy}</span>
        </button>
      </div>
    </li>
  );
}

export function BrandA() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);

  /* copy a hex: the button says "Copied" for a moment, the live region says it once */
  const [copied, setCopied] = useState<string | null>(null);
  const [say, setSay] = useState("");
  const tRef = useRef(0);
  useEffect(() => () => clearTimeout(tRef.current), []);
  const onCopy = async (s: Swatch, el: HTMLElement | null) => {
    clearTimeout(tRef.current);
    try {
      await navigator.clipboard.writeText(s.hex);
      setCopied(s.k); setSay(`${L.copied} ${s.hex}`);
    } catch {
      // no clipboard (an insecure origin, a refused permission): select the hex, so it can be copied by hand
      if (el) { const r = document.createRange(); r.selectNodeContents(el); const sel = getSelection(); sel?.removeAllRanges(); sel?.addRange(r); }
      setCopied(null); setSay("");
    }
    tRef.current = window.setTimeout(() => { setCopied(null); setSay(""); }, 1800);
  };

  const neutrals = COLOR.swatches.filter((s) => !s.k.startsWith("green"));
  const greens = COLOR.swatches.filter((s) => s.k.startsWith("green"));
  const rows = [LOGOS.assets.slice(0, 3), LOGOS.assets.slice(3)];
  const logo = asset("logo"), markRev = asset("icon-rev");

  return (
    <div ref={ref} className="l-page br-a">
      {/* ───────────── 1 · hero: the ruled head, its bar, the cover plates */}
      <section className="l-sec ba-hero" aria-labelledby="ba-h1">
        <div className="l-row ba-hero__row" data-row="" data-start="">
          <div className="l-cell ba-hero__title">
            <p className="ba-k" data-in=""><i className="ba-sq" aria-hidden="true" />NEAR <span aria-hidden="true">/</span> {HERO.eyebrow}</p>
            <h1 id="ba-h1" className="ba-h1" data-h1=""><Acc h={HERO.h1} a={HERO.accent} /></h1>
          </div>
          <div className="l-cell ba-hero__intro">
            <p className="l-lede" data-in="">{HERO.sub}</p>
            <p className="ba-acts" data-in="">
              <a className="l-btn ba-btn" href={HERO.primary.href}><span>{HERO.primary.label}</span><Arrow down /></a>
              <a className="l-link" href={HERO.secondary.href}><span>{HERO.secondary.label}</span><Arrow /></a>
            </p>
          </div>
        </div>
        <div className="l-row ba-bar" data-row="">
          <div className="l-cell ba-bar__cell">
            <nav className="ba-nav" aria-label="On this page">
              {NAV.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
            </nav>
            <p className="ba-count"><i aria-hidden="true" />{LOGOS.assets.length} {L.files} <span aria-hidden="true">·</span> {L.svg}</p>
          </div>
        </div>
        <div className="l-row ba-cover" data-row="">
          <figure className="l-cell ba-cover__c">
            <Plate className="ba-cover__plate"><img className="ba-cover__logo" src={logo.src} alt={`${logo.name}: ${logo.desc}`} /></Plate>
            <figcaption className="ba-spec"><span>{file(logo.src)}</span><span>{SIZE[logo.k]}</span></figcaption>
          </figure>
          <figure className="l-cell ba-cover__c ba-cover__c--ink">
            <Plate className="ba-cover__plate" a={markRev}><img className="ba-cover__mark" src={markRev.src} alt={`${markRev.name}: ${markRev.desc}`} /></Plate>
            <figcaption className="ba-spec"><span>{file(markRev.src)}</span><span>{SIZE[markRev.k]}</span></figcaption>
          </figure>
        </div>
      </section>

      {/* ───────────── 2 · principles: three ruled cells */}
      <section className="l-sec ba-sec ba-prin" id="ba-principles" aria-labelledby="ba-pr-t">
        <div className="l-row ba-head ba-head--one" data-row="">
          <div className="l-cell ba-head__h">
            <p className="ba-k" data-rv=""><i className="ba-sq" aria-hidden="true" />01 <span aria-hidden="true">/</span> {L.principles}</p>
            <h2 id="ba-pr-t" className="l-h2 l-h2--m ba-h2" data-split=""><Acc h={PRINCIPLES.h} a="confident" /></h2>
          </div>
        </div>
        <ul className="l-row ba-prin__row ba-stag" data-row="">
          {PRINCIPLES.items.map((p, i) => (
            <li key={p.k} className="l-cell ba-pr" style={{ ["--j" as string]: i }}>
              <p className="ba-pr__k">{idx(i)} <span aria-hidden="true">/</span> {p.k}</p>
              <h3 className="ba-pr__t">{p.title}</h3>
              <p className="ba-pr__b">{p.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────── 3 · logo: the asset cells, then do | don't */}
      <section className="l-sec ba-sec ba-logos" id={LOGOS.id} aria-labelledby="ba-lg-t">
        <div className="l-row ba-head" data-row="">
          <div className="l-cell ba-head__h">
            <p className="ba-k" data-rv=""><i className="ba-sq" aria-hidden="true" />02 <span aria-hidden="true">/</span> {LOGOS.h}</p>
            <h2 id="ba-lg-t" className="l-h2 l-h2--m ba-h2" data-split="">{LOGOS.h}</h2>
          </div>
          <div className="l-cell ba-head__end"><p className="l-lede" data-rv="">{LOGOS.intro}</p></div>
        </div>
        {rows.map((row, r) => (
          <ul key={r} className="l-row ba-assets ba-stag" data-row="">
            {row.map((a, i) => (
              <li key={a.k} className="l-cell ba-as" style={{ ["--j" as string]: i }}>
                <Plate a={a} className="ba-as__plate" />
                <div className="ba-as__txt">
                  <p className="ba-as__f"><span>{idx(r * 3 + i)}</span><span>{file(a.src)}</span><span>{SIZE[a.k]}</span></p>
                  <h3 className="ba-as__n">{a.name}</h3>
                  <p className="ba-as__d">{a.desc}</p>
                  <a className="ba-as__dl" href={a.src} download={file(a.src)} aria-label={`Download ${a.name} (${L.svg})`}>
                    <Dl /><span>{L.download}</span>
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ))}
        <div className="l-row ba-rules" data-row="">
          {([[L.do, LOGOS.dos, DO_FIG, true], [L.dont, LOGOS.donts, DONT_FIG, false]] as const).map(([label, list, figs, ok]) => (
            <div key={label} className={`l-cell ba-rule${ok ? "" : " ba-rule--no"}`}>
              <p className="ba-rule__h"><Mark ok={ok} />{label}</p>
              <ul className="ba-rule__l">
                {list.map((t, i) => (
                  <li key={t} className="ba-rule__i" style={{ ["--j" as string]: i }}>
                    {figs[i]}
                    <p className="ba-rule__t"><span className="ba-rule__n" aria-hidden="true">{idx(i)}</span>{t}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── 4 · color: the swatches, the neutrals then the greens */}
      <section className="l-sec ba-sec ba-color" id="ba-color" aria-labelledby="ba-cl-t">
        <div className="l-row ba-head" data-row="">
          <div className="l-cell ba-head__h">
            <p className="ba-k" data-rv=""><i className="ba-sq" aria-hidden="true" />03 <span aria-hidden="true">/</span> {COLOR.h}</p>
            <h2 id="ba-cl-t" className="l-h2 l-h2--m ba-h2" data-split="">{COLOR.h}</h2>
          </div>
          <div className="l-cell ba-head__end"><p className="l-lede" data-rv="">{COLOR.intro}</p></div>
        </div>
        <ul className="l-row ba-sws ba-sws--n ba-stag" data-row="">
          {neutrals.map((s, i) => <SwatchCell key={s.k} s={s} i={i} onCopy={onCopy} copied={copied === s.k} />)}
        </ul>
        <ul className="l-row ba-sws ba-sws--g ba-stag" data-row="">
          {greens.map((s, i) => <SwatchCell key={s.k} s={s} i={neutrals.length + i} onCopy={onCopy} copied={copied === s.k} />)}
        </ul>
        <p className="sr-only" role="status" aria-live="polite">{say}</p>
      </section>

      {/* ───────────── 5 · type: the two faces, large */}
      <section className="l-sec ba-sec ba-type" id="ba-type" aria-labelledby="ba-ty-t">
        <div className="l-row ba-head" data-row="">
          <div className="l-cell ba-head__h">
            <p className="ba-k" data-rv=""><i className="ba-sq" aria-hidden="true" />04 <span aria-hidden="true">/</span> {TYPE.h}</p>
            <h2 id="ba-ty-t" className="l-h2 l-h2--m ba-h2" data-split="">{TYPE.h}</h2>
          </div>
          <div className="l-cell ba-head__end"><p className="l-lede" data-rv="">{TYPE.intro}</p></div>
        </div>
        {TYPE.faces.map((f, i) => (
          <div key={f.k} className={`l-row ba-face ba-face--${f.k}`} data-row="">
            <div className="l-cell ba-face__meta">
              <p className="ba-face__aa" aria-hidden="true" data-rv="">Aa</p>
              <div className="ba-face__id">
                <p className="ba-face__k">{idx(i)} <span aria-hidden="true">/</span> {f.k}</p>
                <h3 className="ba-face__n">{f.name}</h3>
                <p className="ba-face__r">{f.role}</p>
              </div>
            </div>
            <div className="l-cell ba-face__spec">
              <p className="ba-face__s" data-rv="">{f.sample}</p>
              <p className="ba-face__g" aria-hidden="true" data-rv="">{GLYPHS}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ───────────── 6 · voice: the rules as ruled rows, then the naming table */}
      <section className="l-sec ba-sec ba-voice" id="ba-voice" aria-labelledby="ba-vo-t">
        <div className="l-row ba-head" data-row="">
          <div className="l-cell ba-head__h">
            <p className="ba-k" data-rv=""><i className="ba-sq" aria-hidden="true" />05 <span aria-hidden="true">/</span> {VOICE.h}</p>
            <h2 id="ba-vo-t" className="l-h2 l-h2--m ba-h2" data-split="">{VOICE.h}</h2>
          </div>
          <div className="l-cell ba-head__end"><p className="l-lede" data-rv="">{VOICE.intro}</p></div>
        </div>
        <ol className="ba-vr__l">
          {VOICE.rules.map((r, i) => (
            <li key={r.title} className="l-row ba-vr" data-row="">
              <div className="l-cell ba-vr__n"><span data-rv="">{idx(i)}</span></div>
              <div className="l-cell ba-vr__t"><h3 data-rv="">{r.title}</h3></div>
              <div className="l-cell ba-vr__b"><p data-rv="">{r.body}</p></div>
            </li>
          ))}
        </ol>
        <div className="ba-names" role="table" aria-label={L.naming}>
          <div className="l-row ba-nm ba-nm--h" role="row" data-row="">
            <p className="l-cell" role="columnheader"><Mark ok />{L.right}</p>
            <p className="l-cell" role="columnheader"><Mark ok={false} />{L.wrong}</p>
          </div>
          {VOICE.naming.map((n) => (
            <div key={n.right} className="l-row ba-nm" role="row" data-row="">
              <p className="l-cell ba-nm__r" role="rowheader"><span data-rv="">{n.right}</span></p>
              <p className="l-cell ba-nm__w" role="cell">
                <span data-rv="">{n.wrong.split(", ").map((w, i, all) => (
                  <span key={w}><s>{w}</s>{i < all.length - 1 && <span className="ba-nm__sep">, </span>}</span>
                ))}</span>
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
