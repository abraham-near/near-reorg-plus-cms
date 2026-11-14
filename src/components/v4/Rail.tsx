// v4's story rail: v1's (../v1/rail/Rail.tsx), same classes and structure (rail/layer.ts builds the stage from this text), with the October 2026 copy.
// The answer runs on two lines in the stage: "On NEAR, that stack is [user-owned]," then .rail__next (layer.ts reads the text after the mark).
import "../v1/rail/rail.css";
import "./v4.css";

/** exit: how the rail closes into the Stack (rail/layer.ts drawExit): no dots in v4 */
/** steps: "line" drops the N tiles (the centre and the stations) and marks the steps in green over the ink line */
/** beats: "split" (home v5) runs the thesis and the problem as two separate beats (the thesis leaves whole, nothing docks; the problem's drawing becomes the user's in place) */
/** back: "ridges" (home v5) puts Lawrence's ridges panorama behind the rail instead of the dot globe */
/** near: "out" (home v6, with beats="split") keeps "NEAR is where they connect." in place after the other two lines leave, then lets it go whole before the problem;
    nothing docks, and the answer's "NEAR" comes in as one of its own words (rail/layer.ts NEAROUT) */
/** square: "early" (home v6, with beats="split") draws the playhead's square round NEAR's tile from the start; it holds the centre as the line travels (rail/layer.ts EARLY) */
/** words: "lines" (home v6, with beats="split") moves the type line by line, not word by word, and brings line 3 in after a beat (rail/layer.ts LINES) */
/** type: "even" (home v6) sets the thesis, the problem and the answer (all the type above the line) in one size (v6/rail-v6.css) */
export function RailV4({ exit, steps, beats, back, near, square, type, words }: { exit?: "floor" | "frame" | "seam" | "ruler" | "drop"; steps?: "tiles" | "line"; beats?: "split"; back?: "ridges"; near?: "out"; square?: "early"; type?: "even"; words?: "lines" }) {
  return (
    <section className="layer layer--v4" id="layer" aria-labelledby="ly-h" data-exit={exit} data-line="ink" data-steps={steps} data-beats={beats} data-back={back} data-near={near} data-square={square} data-type={type} data-words={words}>
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
