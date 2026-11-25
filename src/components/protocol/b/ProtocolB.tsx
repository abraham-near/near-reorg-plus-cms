"use client";
// near.org/protocol-b, version B · "The network lives" (the menu's /protocol until Nov 25, 2026; /protocol is now the final page, ../final). The doc's
// page told as one picture of the network at work, in the homepage's hand: shards as lanes, transactions flowing in from the right, a chunk per shard every 600 ms at the now line, the green final line 1.2 s behind it (net.ts).
// From the top:
//   1 hero (bare paper): the H1, the line and the button over the live scene (net.ts: ten shards and the private one, resharding on its own every
//     ~40 s), with its legend and an honest count (blocks at 600 ms since you arrived);
//   2 proof: the homepage's proof strip, seven figures under the green rule: the ruled grid's first row;
//   3 the chapter, on the dark band (joined to the grid by a spacer row above and below): "Built for AI scale from day one", its three properties
//     as an index, then a pinned stage (desktop) where the same lanes carry four steps, scrubbed: Nightshade 3.0 (consensus over execution, state
//     witnesses), dynamic resharding (a lane fills and splits, no vote), the private shard (shielded chunks, a selective-disclosure lens), quantum
//     security (an account rotates to ML-DSA in one transaction). Phones and reduced motion: the steps stacked, each with its own scene;
//   4 Speed. Scale. Access.: the copy | the metronome (three lanes, a global contract landing on all of them at once);
//   5 Chain Signatures: the copy | the lanes of other chains (chains.ts: a threshold of MPC signers, a native transaction, no bridge);
//   6 developers: the three points and the button | the code, in the site's hand;
//   7 the AI layer | NEAR One, side by side;
//   8 Secure NEAR. Evolve NEAR.: validators | NEPs;
//   9 Go deeper: the homepage's (two covers, the rest as rows);
//   10 the close: the homepage's scene (shared/CloseScene `ruled`, in the route), whose ruled row carries the grid down to the photo.
// Copy and links: ../content.ts (the doc, verbatim; regrouped for the story). Sections 3–9: ./parts.tsx (shared with the final page, ../final).
// Motion: ./motion.ts.
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { HERO, PROOF } from "../content";
import { AiAndNearOne, Acc, Band, Btn, ChainSignatures, Deeper, Developers, fig, Secure, Spacer, Speed } from "./parts";
import { mount } from "./motion";
import "../../v3/proof-deeper/proof-deeper.css";
import "./protocol-b.css";

export function ProtocolB() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);

  return (
    <div ref={ref} className="l-page pr-b">
      {/* ───────────── 1 · hero: the copy over the live scene */}
      <section className="pb-hero" aria-labelledby="pb-h1">
        <div className="pb-hero__copy">
          <h1 id="pb-h1" className="pb-h1" data-h1=""><Acc h={HERO.h1} a="settlement" /></h1>
          <div className="pb-hero__side">
            <p className="pb-hero__body" data-in="">{HERO.body}</p>
            <p className="pb-acts" data-in=""><Btn l={HERO.cta} /></p>
          </div>
        </div>
        <figure className="pb-hero__art" aria-labelledby="pb-hero-cap">
          <canvas className="pb-cv pb-cv--hero" data-scene="hero" aria-hidden="true" />
          <figcaption className="pb-legend" id="pb-hero-cap">
            <span className="sr-only">An illustrative simulation of NEAR at work: ten shards and a private shard as lanes; transactions come in from the right, each shard closes a chunk every 600 milliseconds, and chunks are final 1.2 seconds later. Now and then a busy shard splits in two.</span>
            <span className="pb-key" aria-hidden="true"><i className="pb-k pb-k--tx" />Transaction</span>
            <span className="pb-key" aria-hidden="true"><i className="pb-k pb-k--chunk" />Chunk, every 600 ms</span>
            <span className="pb-key" aria-hidden="true"><i className="pb-k pb-k--final" />Final at 1.2 s</span>
            <span className="pb-key" aria-hidden="true"><i className="pb-k pb-k--priv" />Private shard</span>
            <span className="pb-legend__note">
              <span aria-hidden="true">Illustrative simulation</span>
              <span className="pb-count" data-count="" aria-live="off">≈ <b data-blocks="">0</b> blocks since you arrived</span>
            </span>
          </figcaption>
        </figure>
      </section>

      {/* ───────────── 2 · proof: the homepage's strip, seven figures */}
      <section className="l-sec pb-proof" aria-label="NEAR Protocol in numbers">
        <ul className="l-row l-proof__row pb-proof__row" data-row="">
          <li className="l-green" aria-hidden="true" role="presentation" />
          {PROOF.map((p, i) => {
            const f = fig(p.value);
            return (
              <li key={p.value} className="l-cell l-fig pb-fig" style={{ ["--i" as string]: i }}>
                <p className="l-fig__v"><span className="l-fig__n">{f.n}</span>{f.u && <span className="l-fig__u">{f.u}</span>}</p>
                <p className="l-fig__c">{p.label}</p>
              </li>
            );
          })}
        </ul>
        <Spacer />
      </section>

      {/* ───────────── 3 · the chapter: the dark band, the three properties, the pinned stage */}
      <Band />
      {/* ───────────── 4 · Speed. Scale. Access. · 5 · Chain Signatures · 6 · developers */}
      <Speed />
      <ChainSignatures />
      <Developers />
      {/* ───────────── 7 · the AI layer | NEAR One · 8 · Secure NEAR. Evolve NEAR. · 9 · Go deeper */}
      <AiAndNearOne />
      <Secure />
      <Deeper />
    </div>
  );
}
