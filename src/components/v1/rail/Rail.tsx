// r17 v1's section.layer, the story rail (the Figma frames 384:8605 ... 459:4246): the three phrases, the problem, the title, the four stations. One pinned stage; the real text lives here
// (screen readers + the stacked page); the stage (.rs, aria-hidden) is built from it by rail/layer.ts, the illustrations by rail/vig2.
import "./rail.css";

export function Rail() {
  return (
    <section className="layer" id="layer" aria-labelledby="ly-h">
      <div className="rail__static">
        <h2 className="rail__h" id="ly-h"><span className="rail__s">AI is the frontend.</span> <span className="rail__s">Blockchain is the backend.</span> <span className="rail__s">NEAR is where they connect.</span></h2>
        <p className="rail__problem">Whoever runs the layer beneath your agents sees what they see and keeps what they earn.</p>
        <p className="rail__answer">On NEAR, that layer is <span className="rail__mark">user-owned.</span></p>
        <ol className="rail__list" role="list">
          <li data-own="data"><div className="rail__art va" data-art="data" aria-hidden="true"></div><h3>Own your <span className="acc">data.</span></h3><p>Transactions and prompts stay confidential, even from the infrastructure running them.</p></li>
          <li data-own="assets"><div className="rail__art va" data-art="assets" aria-hidden="true"></div><h3>Own your <span className="acc">assets.</span></h3><p>Hold, swap and move everything you have from one account only you control.</p></li>
          <li data-own="intelligence"><div className="rail__art va" data-art="intelligence" aria-hidden="true"></div><h3>Own your <span className="acc">intelligence.</span></h3><p>Inference and agents run inside hardware enclaves, and every request returns a signed proof of what ran.</p></li>
          <li data-own="identity"><div className="rail__art va" data-art="identity" aria-hidden="true"></div><h3>Own your <span className="acc">identity.</span></h3><p>One NEAR account that reads like a name, works across 35+ chains, and upgrades to post-quantum keys in a single rotation.</p></li>
        </ol>
      </div>
    </section>
  );
}
