// Home v7 (Lawrence001, D153) = home v6 as committed in 5316b50, copied whole so the next changes land here and /home-v6 stays as it was. Its class
// names and attributes are v6's renamed (stk7, s7-, hero--v7, data-scope v7); the comments below still tell v6's history, which this carries.
// Home v6 (Lawrence001) = home v5 with Lawrence's ridges hero (D108): the scroll-scrubbed take j film and its tracked plexus-and-dust layer from home-v2's
// original, in place of v5's still forest photo, with v5's copy. Everything else is v5's: the page keeps html[data-home="v5"], so v5.css applies as it is,
// and the hero's own styles are scoped under .hero--v7 (./v7.css).
import { InlineScript } from "@/components/InlineScript";
import { V1Page } from "@/components/v1/V1Page";
import { V3Header } from "../v3/header/Header";
import { ProofDeeper } from "../v3/proof-deeper/ProofDeeper";
import { V3Footer } from "../v3/footer/Footer";
import { RailV4 } from "../v4/Rail";
import { StackV4 } from "../v4/Stack";
import { V4_DEEPER } from "../v4/content";
import { ORIGIN_RATIO } from "../v4/revenue/variants";
import { RevenueD } from "../v4/revenue/d/RevenueD";
import { VoicesOne } from "./voices/VoicesOne";
import { WorldV7, type HeroAlt } from "./World";
import { StackArtV7 } from "./stack/StackArtV7";
import { StackEnterV7 } from "./stack/StackEnterV7";
import type { TxKey } from "./tx";
import type { StKey } from "./intro";
import "../v3/buttons.css";
import "../v3/globe.css";
import "../v5/v5.css";
import "../v5/rail-v5.css";
import "../v5/statement-v5.css";
import "./v7.css";
import "./rail-v7.css";

// the lower page's photos: literal black and white with one green accent, after the CMS preview's story pictures (D170: Go deeper, the blog's own; D171: the rest; D177: the voices' crowd filming on a phone, in place of D171's ridges; D180: Origin's whiteboard, the Transformer's architecture as in the paper's
// Figure 1, among 2017-era machines, in place of D171's lab)
const BW = "/images/home/bw";
const PHOTOS = { deeper: "/images/blog", origin: `${BW}/origin-transformer.webp`, ridges: `${BW}/voices-crowd.webp`, meadow: `${BW}/close-meadow.webp` };
const PATH_IMG = [`${BW}/paths-trade.webp`, `${BW}/paths-integrate.webp`, `${BW}/paths-build.webp`];
// D179: Lawrence's title for Origin ("helped invent" in v4's copy, which other versions keep)
const ORIGIN_TITLE = <>Built by the people <span className="l-nb">who invented</span> <span className="l-nb">modern AI</span></>;   // no lone "who" on phones
const DEEPER = { ...V4_DEEPER, origin: { ...V4_DEEPER.origin, title: ORIGIN_TITLE }, paths: V4_DEEPER.paths.map((p, i) => ({ ...p, img: PATH_IMG[i] ?? p.img })) };

const REV = "a" as const;   /* v5's revenue band and Origin; the voices are v6's own ("timer": on a clock, not the scroll; D135) */

/** hero: another hero in place of the ridges (the hero options sheet, D155); tx: one of the hero-to-intro transition studies (D109), at /home-v6/<key>; st: one of the intro layout studies (D144), at /home-v6/intro/<key>;
 *  voices: another photo under "What the world is saying about NEAR" (the voices photo studies, D174);
 *  origin: another photo beside "Built by the people who invented modern AI" (the origin photo studies, D179);
 *  close: another picture behind "NEAR belongs to you" (the close studies, D186: photos and all-graphic treatments) */
export function V7Page({ tx, st, hero, voices, origin, close }: { tx?: TxKey; st?: StKey; hero?: HeroAlt; voices?: string; origin?: string; close?: string } = {}) {
  return (
    <>
      {/* as v5: no globe, and v5's style scope */}
      <InlineScript html="document.documentElement.setAttribute('data-gl','off');document.documentElement.setAttribute('data-home','v5')" />
      <V1Page v="v3" header={<V3Header home="/" spread stay soft />} world={<WorldV7 tx={tx} st={st} hero={hero} />} rail={<RailV4 exit="wipe" steps="tiles" beats="split" back="ridges" near="out" square="early" type="even" words="lines" identity="sign" />} stack={<StackV4 still steps stick enter="tide" art={<><StackArtV7 look="matte" /><StackEnterV7 /></>} />}
        afterStack={<ProofDeeper content={{ ...DEEPER, lead: <RevenueD flat />, voicesMode: "timer", voicesSlot: <VoicesOne />, originRatio: ORIGIN_RATIO[REV], originFirst: true, scope: "v7", photos: { ...PHOTOS, ...(voices && { ridges: voices }), ...(origin && { origin }), ...(close && { meadow: close }) } }} />} footer={<V3Footer />} />
    </>
  );
}
