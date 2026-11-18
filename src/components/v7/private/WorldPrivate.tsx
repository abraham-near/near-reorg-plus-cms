// Home v7, branch NEAR-is-private-CYCLE (D200): the hero and the intro under it merged into one section, type only. "NEAR is private", then a word that
// cycles (Cycle.tsx), then the intro's paragraph (World.tsx's statement, word for word, its marked phrase on the green), then the button. No picture,
// no film, no globe: the page's paper. It keeps the world's DOM contract (v1/world/boot.ts needs .pin > .stage > canvas and .globe; .hero quiets the
// header's action while it shows), but has no .statement, so nothing is pinned or wiped. Styles: ./private.css.
import { Cycle } from "./Cycle";
import "../../v1/world/world.css";
import "./private.css";

export function WorldPrivate() {
  return (
    <div className="pin pin--priv">
      <div className="stage" aria-hidden="true"><canvas /></div>
      <div className="globe" aria-hidden="true" />
      <section className="hero hero--priv" aria-labelledby="hero-h">
        <div className="wrap ph">
          <h1 className="ph__h" id="hero-h">
            <span className="ph__l">NEAR is private</span> <Cycle />
          </h1>
          <p className="ph__p">
            One account, any chain, private by design. NEAR encrypts your prompts and transactions so you and your agents can think and trade in
            confidence. Fully sharded, quantum-ready, and permissionless to the core, NEAR is the infrastructure for a{" "}
            <span className="ph__mk">user-owned agent economy.</span>
          </p>
          <div className="ph__cta">
            <a className="cta" href="https://near.com">Get started <span className="arr" aria-hidden="true" /><span className="sr-only"> (another NEAR site)</span></a>
          </div>
        </div>
      </section>
    </div>
  );
}
