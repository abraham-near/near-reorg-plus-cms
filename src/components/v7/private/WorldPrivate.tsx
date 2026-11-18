// Home v7, branch NEAR-is-private-CYCLE (D200): the hero and the intro under it merged into one section, type only. "NEAR is private", then a word that
// cycles (Cycle.tsx), then the intro's paragraph (World.tsx's statement, word for word, its marked phrase on the green), then the button. No picture,
// no film, no globe: the page's paper. It keeps the world's DOM contract (v1/world/boot.ts needs .pin > .stage > canvas and .globe; .hero quiets the
// header's action while it shows), but has no .statement, so nothing is pinned or wiped. Styles: ./private.css.
// copy "privacy" (branch NEAR-is-privacy-HEADLINE, D202): Lawrence's second option, one still headline, "NEAR is privacy for onchain capital and the agent
// economy.", and his two sentences under it, in place of the cycle and the statement.
import { Cycle } from "./Cycle";
import "../../v1/world/world.css";
import "./private.css";

export function WorldPrivate({ copy = "cycle" }: { copy?: "cycle" | "privacy" } = {}) {
  return (
    <div className="pin pin--priv">
      <div className="stage" aria-hidden="true"><canvas /></div>
      <div className="globe" aria-hidden="true" />
      <section className="hero hero--priv" aria-labelledby="hero-h" data-copy={copy}>
        <div className="wrap ph">
          {copy === "privacy" ? (
            <>
              <h1 className="ph__h ph__h--one" id="hero-h">
                NEAR is privacy for onchain capital and the agent <span className="ph__nb">economy.<span className="ph__sq" aria-hidden="true" /></span>
              </h1>
              <p className="ph__p">NEAR encrypts your prompts and transactions so you and your agents can think and trade in confidence. One account, any chain, private by design.</p>
            </>
          ) : (
            <>
              <h1 className="ph__h" id="hero-h">
                <span className="ph__l">NEAR is private</span> <Cycle />
              </h1>
              <p className="ph__p">
                One account, any chain, private by design. NEAR encrypts your prompts and transactions so you and your agents can think and trade in
                confidence. Fully sharded, quantum-ready, and permissionless to the core, NEAR is the infrastructure for a{" "}
                <span className="ph__mk">user-owned agent economy.</span>
              </p>
            </>
          )}
          <div className="ph__cta">
            {/* Lawrence: the hero's Get started jumps to Get into NEAR lower on the page (ProofDeeper #paths); the header's Get started keeps near.com */}
            <a className="cta" href="#paths">Get started <span className="arr" aria-hidden="true" /></a>
          </div>
        </div>
      </section>
    </div>
  );
}
