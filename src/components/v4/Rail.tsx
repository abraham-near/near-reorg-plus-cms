// v4's story rail: v1's (../v1/rail/Rail.tsx), same classes and structure (rail/layer.ts builds the stage from this text), with the October 2026 copy.
// The answer runs on two lines in the stage: "On NEAR, that stack is [user-owned]," then .rail__next (layer.ts reads the text after the mark).
import "../v1/rail/rail.css";
import "./v4.css";

/** exit: how the rail closes into the Stack (rail/layer.ts drawExit): no dots in v4 */
/** steps: "line" drops the N tiles (the centre and the stations) and marks the steps in green over the ink line */
export function RailV4({ exit, steps }: { exit?: "floor" | "frame" | "seam" | "ruler" | "drop"; steps?: "tiles" | "line" }) {
  return (
    <section className="layer layer--v4" id="layer" aria-labelledby="ly-h" data-exit={exit} data-line="ink" data-steps={steps}>
      <div className="rail__static">
        <h2 className="rail__h" id="ly-h"><span className="rail__s">AI is the frontend.</span> <span className="rail__s">Blockchain is the backend.</span> <span className="rail__s">NEAR is where they connect.</span></h2>
        <p className="rail__problem">Whoever runs the stack beneath your agents can see your most sensitive data, control your assets, and capture the value you create.</p>
        <p className="rail__answer">On NEAR, that stack is <span className="rail__mark">user-owned</span>, <span className="rail__next">from inference to settlement.</span></p>
        <ol className="rail__list" role="list">
          <li data-own="data"><div className="rail__art va" data-art="data" aria-hidden="true"></div><h3>Own your <span className="acc">data.</span></h3><p>Your trades and prompts stay confidential, hidden from bots, competitors, and the public chain.</p></li>
          <li data-own="assets"><div className="rail__art va" data-art="assets" aria-hidden="true"></div><h3>Own your <span className="acc">assets.</span></h3><p>Crypto and tokenized assets across every chain you use, in one account only you control.</p></li>
          <li data-own="intelligence"><div className="rail__art va" data-art="intelligence" aria-hidden="true"></div><h3>Own your <span className="acc">intelligence.</span></h3><p>Run AI on hardware that can prove what it ran, sealed off even from NEAR.</p></li>
          <li data-own="identity"><div className="rail__art va" data-art="identity" aria-hidden="true"></div><h3>Own your <span className="acc">identity.</span></h3><p>One human-readable account that works across 35+ chains, with quantum-safe signing.</p></li>
        </ol>
      </div>
    </section>
  );
}
