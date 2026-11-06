import { StackDrawing } from "./StackDrawing";
import { StackInteractions } from "./StackInteractions";
import { StackLayers } from "./StackLayers";
import styles from "./Stack.module.css";

const words = (s: string) => s.split(" ").map((w, i) => <span key={i} className={styles.w}>{w} </span>);

// Section 2 (spec/pages/home.md §2, D7, D14, D17, D18, D38): an ink band. The heading, then three columns: the four
// layers as a numbered list (core first), the selected layer's detail, and the isometric Stack on the right (the
// Protocol pillar inside the Intents, NEAR AI and near.com frames), centred on the heading and the columns together. On
// desktop with motion the heading and columns pin while the reader scrolls through the four layers and the drawing
// builds outwards, one layer per step (StackInteractions). Hovering a layer in the list or the drawing highlights it;
// clicking one in the drawing selects it. Then the secondary row.
export function StackSection() {
  return (
    <section className={styles.band} aria-labelledby="stack-title" data-stack data-tone="dark" data-active-layer="protocol">
      <span className={styles.handoff} aria-hidden="true" data-stack-thread />
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.track} data-track>
            <div className={styles.pin} data-pin>
              <span className={styles.pinLine} aria-hidden="true" data-stack-thread />
              {/* Inside the pin (D38), so the section's title stays on screen while the layers build */}
              <header className={styles.head}>
                {/* Word by word (.w), so after the rail each line can rise into place as the section arrives (StoryRailMotion) */}
                <h2 id="stack-title" className="t-h2">
                  {words("Four layers. One")}<span className={styles.w}><span className="accent">system.</span></span>
                </h2>
                <p className="t-lede">{words("Each layer does one job, and together they keep your world in your\u00a0hands.")}</p>
              </header>
              <div className={styles.cols}>
                <div className={styles.art} data-stack-art><StackDrawing /></div>
                <StackLayers />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.secondary}>
          <div>
            <h3 className="t-h4">Governance</h3>
            <p>The network is user-owned too. NEAR&apos;s direction is set onchain through House of Stake.</p>
            <a className={styles.more} href="https://houseofstake.org/">House of Stake<svg className={styles.ext} viewBox="0 0 10 10" width="9" height="9" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg><span className="sr-only"> (another site)</span></a>
          </div>
          <div>
            <h3 className="t-h4">Economics</h3>
            <p>How the network sustains itself, explained in one&nbsp;place.</p>
            <a className={styles.more} href="/economics">Read the fundamentals</a>
          </div>
        </div>
      </div>
      <StackInteractions />
    </section>
  );
}
