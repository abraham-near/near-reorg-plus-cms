"use client";
// 404 C · Ruled: the blog's ruled grid (v3/blog/blog.css + grid.ts: hairlines, a + where lines meet, rows that draw in) holding the error.
// Row 1: three equal cells, one digit each, set very large ("4", "0", "4"); the "0" cell is ink, an emerald square in its corner.
// Row 2: the line ("This page doesn't exist.") and a short note on the left, the way out on the right (Back home, the blog).
// Motion: grid.ts draws the rows and the crosshairs; the digits rise one after another, then the text. Reduced motion: still.
// The shell: v3's header as home v5's (spread, stay, soft), the footer, the Extra chip.
import { useRef } from "react";
import { useScrollMotion, type MotionCtx } from "@/lib/motion/scroll";
import { FixVersion } from "@/components/shared/version";
import { ExtraChip } from "@/components/ExtraChip";
import { V3Header } from "@/components/v3/header/Header";
import { V3Footer } from "@/components/v3/footer/Footer";
import { mountGrid } from "@/components/v3/blog/grid";
import { Arrow } from "@/components/v3/blog/parts";
import "@/components/v3/buttons.css";
import "@/components/v3/blog/blog.css";
import "./notfound-c.css";

function mount(root: HTMLElement, ctx: MotionCtx) {
  const grid = mountGrid(root, ctx);
  return () => grid.dispose();
}

const LABELS = ["Error", "Page", "Not found"];

/** the ruled band alone (the real not-found can render it inside its own shell) */
export function NotFoundBandC({ home = "/home-v5", blog = "/blog" }: { home?: string; blog?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);
  return (
    <div ref={ref} className="bl nfc">
      <section aria-labelledby="nfc-t">
        <div className="bl-row nfc-digits" data-row="" data-start="">
          {["4", "0", "4"].map((d, i) => (
            <div key={i} className={`bl-cell nfc-d${i === 1 ? " nfc-d--ink" : ""}`} aria-hidden="true">
              <span className="nfc-lbl" data-rv="" style={{ ["--rv" as string]: `${0.15 + i * 0.08}s` }}>{LABELS[i]}</span>
              <span className="nfc-n" data-rv="" style={{ ["--rv" as string]: `${0.2 + i * 0.1}s` }}>{d}</span>
              {i === 1 && <span className="nfc-sq" />}
            </div>
          ))}
        </div>
        <div className="bl-row bl-row--end nfc-say" data-row="">
          <div className="bl-cell nfc-say__l">
            <h1 id="nfc-t" className="nfc-h" data-rv="">This page doesn’t <em>exist.</em><span className="sr-only"> Error 404.</span></h1>
            <p className="nfc-note" data-rv="" style={{ ["--rv" as string]: "0.3s" }}>The link may be old, or the page has moved. Start again from home or read the latest on the blog.</p>
          </div>
          <div className="bl-cell nfc-say__r" data-rv="" style={{ ["--rv" as string]: "0.4s" }}>
            <a className="bl-btn bl-btn--ink" href={home}>Back home <Arrow /></a>
            <a className="bl-link" href={blog}>Read the blog <Arrow /></a>
          </div>
        </div>
      </section>
    </div>
  );
}

/** the whole page: header, the band, footer */
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
