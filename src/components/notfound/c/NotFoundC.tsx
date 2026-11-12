// 404 C · typographic: one screen on paper, in home v5's hero language. A very large "404" set like the hero's "Own your world." (Montreal for "40", the last
// "4" in the hero's Kepler Light Italic, ending on the hero's emerald square), one short line, the hero's pill (Back home) and one text link (Blog).
// The one detail: a quiet corner of the site's dot globe (the hero's globe poster) at the right edge. Motion is CSS only (./notfound-c.css): the type rises
// once like the hero's; reduced motion = still. The shell: v3's header as home v5's (spread, stay, soft; light over the paper), the footer, the Extra chip.
import { FixVersion } from "@/components/shared/version";
import { ExtraChip } from "@/components/ExtraChip";
import { V3Header } from "@/components/v3/header/Header";
import { V3Footer } from "@/components/v3/footer/Footer";
import "@/components/v3/buttons.css";
import "./notfound-c.css";

/** the band alone (the real not-found can render it inside its own shell) */
export function NotFoundBandC({ home = "/home-v5", blog = "/blog-j" }: { home?: string; blog?: string }) {
  return (
    <section className="nfc" aria-labelledby="nfc-title">
      <div className="nfc-dots" aria-hidden="true" data-allow-overflow="">
        {/* eslint-disable-next-line @next/next/no-img-element -- the hero's globe poster, a plain SVG */}
        <img src="/v1/world/poster-globe-a.svg" alt="" width={1000} height={1000} decoding="async" />
      </div>
      <div className="nfc-inner">
        <h1 id="nfc-title" className="nfc-big">
          <span aria-hidden="true">40<em className="nfc-key">4</em><span className="nfc-sq" /></span>
          <span className="sr-only">404: page not found</span>
        </h1>
        <p className="nfc-sub">This page wandered off.</p>
        <div className="nfc-acts">
          <a className="nfc-home" href={home}>Back home<span className="nfc-arr" aria-hidden="true" /></a>
          <a className="nfc-link" href={blog}>Read the blog</a>
        </div>
      </div>
    </section>
  );
}

/** the whole page: header, the band, footer (as BlogShell, in v3's values) */
export function NotFoundC({ home = "/home-v5" }: { home?: string }) {
  return (
    <>
      <FixVersion v="v3" />
      <V3Header home={home} spread stay soft />
      <main id="main"><NotFoundBandC home={home} /></main>
      <V3Footer />
      <ExtraChip />{/* temporary way back to /extra: remove this line to drop it */}
    </>
  );
}
