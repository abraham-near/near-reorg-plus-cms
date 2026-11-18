"use client";
// near.org/brand, version C · Editorial. The homepage v9's hand (big type in Montreal Book with one Kepler word, black-and-white photos that bleed, the
// Stack's and the Council's dark) read as a gallery-like brand book. From the top:
//   1 the hero: the logo set across the whole column on the paper, then the H1 (its Kepler word and the green square), the subhead and the two actions;
//   2 the principles: the heading, the crowd photo (bw, its one green phone) opening to the whole screen, the three principles in a ruled row;
//   3 the logos: the heading set huge in Kepler and the intro, then the files as large tiles on paper and the reversed ones on full-width ink bands, each
//     with its name, description and an SVG download; then the do's and don'ts set large in two columns;
//   4 the color: the heading and intro, the mailboxes photo (one green door in a white wall: green as a thread), then the palette as full-bleed bands
//     sized by their share of the page (paper and ink dominant, the green a thin line), each with its name, role, hex and a "copy hex" button;
//   5 the type: the two faces as giant specimens, each with its name, role and its alphabet;
//   6 the voice: the dark band. The rules as a large numbered list, then the naming table (write / not);
//   7 the close: the homepage's scene (shared/CloseScene), set after this component in the route (app/(site)/brand-c/page.tsx).
// Copy and files: ../content.ts and public/brand/ (verbatim). The small labels (LABELS, EYEBROWS) and the specimen alphabet are this version's own.
import { useEffect, useRef, useState } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { COLOR, HERO, LOGOS, PRINCIPLES, TYPE, VOICE, type Asset, type Swatch } from "../content";
import { Acc, Arrow, Copy, Cross, Down, Tick } from "./parts";
import { mount } from "./motion";
import "./brand-c.css";

/** this page's own small labels (not in content.ts) */
const EYEBROWS = { principles: "Principles", logos: "01 · Logo", color: "02 · Color", type: "03 · Type", voice: "04 · Voice" } as const;
const LABELS = {
  download: "Download SVG", copy: "Copy hex", copied: "Copied", doH: "Do", dontH: "Don't", naming: "Naming", write: "Write", not: "Not",
  alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789",
} as const;
/** each swatch's share of the palette's height: paper and ink dominant, the green a thread */
const WEIGHT: Record<string, number> = { paper: 5, "paper-1": 1.8, "paper-2": 1.3, ink: 4.4, graphite: 1.3, green: 0.6, "green-text": 1.1 };
const PHOTOS = {
  crowd: { src: "/images/home/bw/voices-crowd.webp", w: 2400, h: 1350 },
  mailboxes: { src: "/images/home/bw/close-mailboxes.webp", w: 2400, h: 1350 },
} as const;

const idx = (i: number) => String(i + 1).padStart(2, "0");
const file = (src: string) => src.split("/").pop() ?? src;

/** the logo files in rows: a light file alone is a wide tile, two in a row share it, a reversed one is a band of its own */
type Row = { kind: "band"; a: Asset; i: number } | { kind: "tiles"; items: { a: Asset; i: number }[] };
const ROWS = LOGOS.assets.reduce<Row[]>((rows, a, i) => {
  const last = rows[rows.length - 1];
  if (a.dark) rows.push({ kind: "band", a, i });
  else if (last?.kind === "tiles" && last.items.length < 2) last.items.push({ a, i });
  else rows.push({ kind: "tiles", items: [{ a, i }] });
  return rows;
}, []);

/** a file's caption: its number, name and description, and the download */
function Cap({ a, i }: { a: Asset; i: number }) {
  return (
    <figcaption className="br-c-cap">
      <span className="br-c-cap__n" aria-hidden="true">{idx(i)}</span>
      <div className="br-c-cap__t">
        <h3 className="br-c-cap__name">{a.name}</h3>
        <p className="br-c-cap__d">{a.desc}</p>
      </div>
      <a className="br-c-dl" href={a.src} download={file(a.src)}>
        <Down /><span>{LABELS.download}</span><span className="sr-only">: {a.name}</span><span className="br-c-dl__f" aria-hidden="true">{file(a.src)}</span>
      </a>
    </figcaption>
  );
}

/** copies a hex to the clipboard (the async API, or a hidden field where it's missing); resolves false if neither works */
async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fall through */ }
  try {
    const f = document.createElement("textarea");
    f.value = text; f.setAttribute("readonly", ""); f.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.appendChild(f); f.select();
    const ok = document.execCommand("copy");
    f.remove();
    return ok;
  } catch { return false; }
}

export function BrandC() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);

  /* the swatches' "copy hex": the button says "Copied" for a moment, and the live region says what was copied */
  const [copied, setCopied] = useState<string | null>(null);
  const [say, setSay] = useState("");
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = async (s: Swatch) => {
    const ok = await copyText(s.hex);
    window.clearTimeout(timer.current);
    setCopied(ok ? s.k : null);
    setSay(ok ? `${s.name}, ${s.hex}, copied` : `Couldn't copy. ${s.name} is ${s.hex}`);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div ref={ref} className="br-c">
      {/* ───────────── 1 · hero: the logo across the column, the line under it */}
      <header className="br-c-hero" aria-labelledby="br-c-h1">
        <p className="br-c-eye" data-rv=""><i aria-hidden="true" />{HERO.eyebrow}</p>
        <div className="br-c-hero__logo" data-rv="" style={{ ["--rv" as string]: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- the logo file itself (SVG, 3 KB), shown as it is downloaded */}
          <img src="/brand/logo.svg" alt="NEAR" width={1656} height={567} fetchPriority="high" />
        </div>
        <div className="br-c-hero__foot">
          <h1 id="br-c-h1" className="br-c-h1" data-rise="now"><Acc t={HERO.h1} a={HERO.accent} sq /></h1>
          <div className="br-c-hero__side">
            <p className="br-c-hero__sub" data-rv="" style={{ ["--rv" as string]: 3 }}>{HERO.sub}</p>
            <p className="br-c-actions" data-rv="" style={{ ["--rv" as string]: 4 }}>
              <a className="br-c-btn br-c-btn--ink" href={HERO.primary.href}><span>{HERO.primary.label}</span><Down /></a>
              <a className="br-c-link" href={HERO.secondary.href}><span>{HERO.secondary.label}</span><Arrow /></a>
            </p>
          </div>
        </div>
      </header>

      {/* ───────────── 2 · the principles: the heading, the crowd photo bleeds, three principles in a ruled row */}
      <section className="br-c-sec br-c-prin" aria-labelledby="br-c-prin-t">
        <p className="br-c-eye" data-rv=""><i aria-hidden="true" />{EYEBROWS.principles}</p>
        <h2 id="br-c-prin-t" className="br-c-h2 br-c-prin__h" data-rise=""><Acc t={PRINCIPLES.h} a="forward-looking" /></h2>
        <figure className="br-c-bleed br-c-prin__ph" data-open="">
          <div className="br-c-plate" data-par="">
            {/* eslint-disable-next-line @next/next/no-img-element -- one 2400 × 1350 bw still (106 KB WebP), the homepage's Voices photo */}
            <img src={PHOTOS.crowd.src} alt="" width={PHOTOS.crowd.w} height={PHOTOS.crowd.h} loading="lazy" decoding="async" />
          </div>
        </figure>
        <ol className="br-c-prin__list">
          {PRINCIPLES.items.map((p, i) => (
            <li key={p.k} className="br-c-prin__item" data-rv="" style={{ ["--rv" as string]: i }}>
              <span className="br-c-prin__n" aria-hidden="true">{idx(i)}</span>
              <h3 className="br-c-prin__t">{p.title}</h3>
              <p className="br-c-prin__b">{p.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────────── 3 · the logos: large tiles on paper, the reversed files on full-width ink bands, then the do's and don'ts */}
      <section className="br-c-sec br-c-logos" id={LOGOS.id} aria-labelledby="br-c-logos-t">
        <div className="br-c-head">
          <div>
            <p className="br-c-eye" data-rv=""><i aria-hidden="true" />{EYEBROWS.logos}</p>
            <h2 id="br-c-logos-t" className="br-c-title" data-rise=""><span className="accent">{LOGOS.h}</span></h2>
          </div>
          <p className="br-c-lede" data-rv="">{LOGOS.intro}</p>
        </div>
        <div className="br-c-files">
          {ROWS.map((r) => r.kind === "band" ? (
            <figure key={r.a.k} className="br-c-band" data-k={r.a.k} data-nav-tone="dark">
              {/* eslint-disable-next-line @next/next/no-img-element -- the SVG file itself, shown as it is downloaded */}
              <div className="br-c-band__art" data-rv=""><img src={r.a.src} alt="" loading="lazy" decoding="async" /></div>
              <Cap a={r.a} i={r.i} />
            </figure>
          ) : (
            <div key={r.items[0].a.k} className={`br-c-tiles br-c-tiles--${r.items.length}`}>
              {r.items.map(({ a, i }, j) => (
                <figure key={a.k} className="br-c-tile" data-k={a.k} data-rv="" style={{ ["--rv" as string]: j }}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- the SVG file itself, shown as it is downloaded */}
                  <div className="br-c-tile__art"><img src={a.src} alt="" loading="lazy" decoding="async" /></div>
                  <Cap a={a} i={i} />
                </figure>
              ))}
            </div>
          ))}
        </div>
        <div className="br-c-rules">
          <div className="br-c-rules__col" data-rv="">
            <h3 className="br-c-rules__h"><Tick />{LABELS.doH}</h3>
            <ul>{LOGOS.dos.map((d) => <li key={d} className="br-c-rules__i">{d}</li>)}</ul>
          </div>
          <div className="br-c-rules__col br-c-rules__col--no" data-rv="" style={{ ["--rv" as string]: 1 }}>
            <h3 className="br-c-rules__h"><Cross />{LABELS.dontH}</h3>
            <ul>{LOGOS.donts.map((d) => <li key={d} className="br-c-rules__i">{d}</li>)}</ul>
          </div>
        </div>
      </section>

      {/* ───────────── 4 · the color: the mailboxes photo, then the palette as full-bleed bands sized by their share */}
      <section className="br-c-sec br-c-color" id="color" aria-labelledby="br-c-color-t">
        <div className="br-c-head">
          <div>
            <p className="br-c-eye" data-rv=""><i aria-hidden="true" />{EYEBROWS.color}</p>
            <h2 id="br-c-color-t" className="br-c-title" data-rise=""><span className="accent">{COLOR.h}</span></h2>
          </div>
          <p className="br-c-lede" data-rv="">{COLOR.intro}</p>
        </div>
        <figure className="br-c-bleed br-c-color__ph" data-open="">
          <div className="br-c-plate" data-par="">
            {/* eslint-disable-next-line @next/next/no-img-element -- one 2400 × 1350 bw still (126 KB WebP), the homepage's close photo */}
            <img src={PHOTOS.mailboxes.src} alt="" width={PHOTOS.mailboxes.w} height={PHOTOS.mailboxes.h} loading="lazy" decoding="async" />
          </div>
        </figure>
        <ul className="br-c-swatches">
          {COLOR.swatches.map((s) => {
            const w = WEIGHT[s.k] ?? 1, on = copied === s.k;
            return (
              <li key={s.k} className="br-c-sw" data-k={s.k} data-size={w >= 3 ? "lg" : w < 1 ? "xs" : "sm"} data-dark={s.dark ? "" : undefined}
                style={{ ["--w" as string]: w, background: s.hex }}>
                <div className="br-c-sw__in" data-rv="">
                  <h3 className="br-c-sw__name">{s.name}</h3>
                  <p className="br-c-sw__role">{s.role}</p>
                  <p className="br-c-sw__hex">{s.hex}</p>
                  <button type="button" className="br-c-copy" data-on={on ? "" : undefined} onClick={() => copy(s)}>
                    {on ? <Tick className="br-c-arr" /> : <Copy />}
                    <span>{on ? LABELS.copied : LABELS.copy}</span><span className="sr-only">: {s.name}, {s.hex}</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="sr-only" role="status" aria-live="polite">{say}</p>
      </section>

      {/* ───────────── 5 · the type: two giant specimens */}
      <section className="br-c-sec br-c-type" id="type" aria-labelledby="br-c-type-t">
        <div className="br-c-head">
          <div>
            <p className="br-c-eye" data-rv=""><i aria-hidden="true" />{EYEBROWS.type}</p>
            <h2 id="br-c-type-t" className="br-c-title" data-rise=""><span className="accent">{TYPE.h}</span></h2>
          </div>
          <p className="br-c-lede" data-rv="">{TYPE.intro}</p>
        </div>
        <div className="br-c-faces">
          {TYPE.faces.map((f, i) => (
            <article key={f.k} className="br-c-face" data-k={f.k} aria-labelledby={`br-c-face-${f.k}`}>
              <div className="br-c-face__meta" data-rv="">
                <span className="br-c-face__n" aria-hidden="true">{idx(i)}</span>
                <h3 id={`br-c-face-${f.k}`} className="br-c-face__name">{f.name}</h3>
                <p className="br-c-face__role">{f.role}</p>
              </div>
              <p className="br-c-face__sample" data-rise="">{f.sample}</p>
              <p className="br-c-face__abc" data-rv="" aria-hidden="true">{LABELS.alphabet}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ───────────── 6 · the voice: the dark band, the rules as a large list, then the naming table */}
      <section className="br-c-voice" id="voice" aria-labelledby="br-c-voice-t" data-nav-tone="dark">
        <div className="br-c-head br-c-voice__head">
          <div>
            <p className="br-c-eye br-c-eye--on" data-rv=""><i aria-hidden="true" />{EYEBROWS.voice}</p>
            <h2 id="br-c-voice-t" className="br-c-title" data-rise=""><span className="accent">{VOICE.h}</span></h2>
          </div>
          <p className="br-c-lede br-c-lede--on" data-rv="">{VOICE.intro}</p>
        </div>
        <ol className="br-c-voice__rules">
          {VOICE.rules.map((r, i) => (
            <li key={r.title} className="br-c-vr" data-rv="">
              <span className="br-c-vr__n" aria-hidden="true">{idx(i)}</span>
              <h3 className="br-c-vr__t">{r.title}</h3>
              <p className="br-c-vr__b">{r.body}</p>
            </li>
          ))}
        </ol>
        <div className="br-c-naming" data-rv="">
          <p className="br-c-eye br-c-eye--on" aria-hidden="true"><i />{LABELS.naming}</p>
          <table className="br-c-names">
            <caption className="sr-only">{LABELS.naming}</caption>
            <thead><tr><th scope="col">{LABELS.write}</th><th scope="col">{LABELS.not}</th></tr></thead>
            <tbody>
              {VOICE.naming.map((n) => (
                <tr key={n.right}>
                  <th scope="row" className="br-c-names__ok"><Tick />{n.right}</th>
                  <td className="br-c-names__no"><Cross /><s>{n.wrong}</s></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
