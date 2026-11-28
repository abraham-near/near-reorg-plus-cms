import type { ReactNode } from "react";
import { Button } from "@/components/ui";
import "../v1/world/world.css";
import "./hero-private.css";

// "NEAR is private by design." with an isometric drawing (Figma 2026_10_Near_Web), the hero of the homepage studies on /extra: the homepage whole
// (V7Page, as /), this in place of its type-only hero (privHero). Copy on the left; the drawing (`art`) on the right:
//   fig "ring"   (node 1123:610, layout of node 1123:110): the square ring of modules, in a box at the frame's proportion, centred on the copy;
//   fig "pillar" (node 1120:6520, layout of node 1120:6515): the column through a square frame, the column running the hero's full height (to bleed).
// Each drawing comes in two studies: A, the Figma vector itself, animated by its named groups (./a, ./pillar-a); B, rebuilt in three.js (./b, ./pillar-b).
// Every study plays the same three acts: an intro as the page opens, a quiet loop while it rests, and, as the page scrolls, the drawing comes apart and
// leaves entirely while the hero holds still (sticky inside .hp-run for one screen); then the page carries on to the homepage's next section.
// The drawing's scroll: its own trigger on .hp, start "top top", end "bottom top" (= the stretch the hero holds still), progress 0..1.
// It keeps the world's DOM contract (v1/world/boot.ts: .pin > .stage > canvas, .globe, .hero). Styles: ./hero-private.css.
export function HeroPrivate({ fig, v, art }: { fig: "ring" | "pillar" | "stack" | "box"; v: "a" | "b" | "c" | "d"; art: ReactNode }) {
  return (
    <div className="pin pin--priv hp-pin">
      <div className="stage" aria-hidden="true"><canvas /></div>
      <div className="globe" aria-hidden="true" />
      <div className="hp-run">
        <section className="hero hp" data-fig={fig} data-v={v} data-nav-tone="light" aria-labelledby="hero-h">
          <div className="hp__in">
            <div className="hp__copy">
              <h1 className="hp__h" id="hero-h">
                NEAR is private <em className="hp__acc">by design</em><i className="hp__sq" aria-hidden="true" />
              </h1>
              <p className="hp__p">
                One account, any chain, private by design. NEAR encrypts your prompts and transactions so you and your agents can think and trade in
                confidence. Fully sharded, quantum-ready, and permissionless to the core, NEAR is the infrastructure for a{" "}
                <span className="hp__mk">user-owned agent economy.</span>
              </p>
              <div className="hp__cta"><Button href="#paths">Get started</Button></div>
            </div>
          </div>
          <div className="hp__art" aria-hidden="true">{art}</div>
        </section>
      </div>
    </div>
  );
}
