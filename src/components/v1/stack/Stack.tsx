// r17 v1's Stack (index.html section.stk): Lawrence's StackSection as r17 ported it (copy from his layers.ts, the drawing his buildStack() run once,
// faces / tones from his Stack.module.css). Normal flow, not pinned; dark (data-tone / data-nav-tone: the header turns dark over it).
// The tablist, the highlight, the build-in and the rise are stack/motion.ts (mountStack, run by V1Boot). Without JS every panel shows, stacked, and every ring is drawn.
import { StackIso } from "./StackIso";
import "./stack.css";

export function Stack() {
  return (
    <section className="stk" id="stack" aria-labelledby="stack-title" data-stack="" data-tone="dark" data-nav-tone="dark" data-active-layer="protocol">
      <div className="stk-inner">
        <div className="stk-grid">
          <header className="stk-head" data-rise="">
            <h2 id="stack-title" className="stk-h2">Four layers. One <span className="accent">system.</span></h2>
            <p className="stk-lede">Each layer does one job, and together they keep your world in your&nbsp;hands.</p>
          </header>
          <div className="stk-track" data-track="">
            <div className="stk-pin" data-pin="">
              <div className="stk-cols">
                <div className="stk-art"><StackIso /></div>
                <div className="stk-list" data-rise="" role="tablist" aria-orientation="vertical" aria-label="The four layers">
                <button type="button" role="tab" id="stack-tab-protocol" aria-controls="stack-panel-protocol" aria-selected="true" tabIndex={0} className="stk-tab" data-key="protocol"><span className="stk-index" aria-hidden="true">01</span><span className="stk-tabName">NEAR Protocol</span></button>
                <button type="button" role="tab" id="stack-tab-intents" aria-controls="stack-panel-intents" aria-selected="false" tabIndex={-1} className="stk-tab" data-key="intents"><span className="stk-index" aria-hidden="true">02</span><span className="stk-tabName">NEAR Intents</span></button>
                <button type="button" role="tab" id="stack-tab-ai" aria-controls="stack-panel-ai" aria-selected="false" tabIndex={-1} className="stk-tab" data-key="ai"><span className="stk-index" aria-hidden="true">03</span><span className="stk-tabName">NEAR AI</span></button>
                <button type="button" role="tab" id="stack-tab-com" aria-controls="stack-panel-com" aria-selected="false" tabIndex={-1} className="stk-tab" data-key="com"><span className="stk-index" aria-hidden="true">04</span><span className="stk-tabName">near.com</span></button>
                </div>
                <div className="stk-panels" data-rise="">
              <div role="tabpanel" id="stack-panel-protocol" aria-labelledby="stack-tab-protocol" className="stk-panel" data-active="">
                <div className="stk-panelTop"><p className="stk-label stk-role">Where it settles</p><a className="stk-url" href="https://nearprotocol.com">nearprotocol.com<svg viewBox="0 0 10 10" width="9" height="9" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.2"></path></svg><span className="sr-only"> (another NEAR site)</span></a></div>
                <p className="stk-line">Everything settles in about a second. NEAR Protocol is a sharded blockchain that adds capacity as demand grows, with post-⁠quantum signing live and five years on mainnet.</p>
                <ul className="stk-features"><li><p className="stk-featTitle">Dynamic Resharding</p><p className="stk-featDetail">Shards split and merge with demand. Live on mainnet since Jul 2026.</p></li><li><p className="stk-featTitle">Post-Quantum Signing</p><p className="stk-featDetail">ML-DSA account keys, live on mainnet.</p></li></ul>
                <ul className="stk-stats" aria-label="NEAR Protocol in numbers"><li><span className="stk-statValue">5+ years</span><span className="stk-statLabel">on mainnet</span></li><li><span className="stk-statValue">1M+</span><span className="stk-statLabel">TPS in a public benchmark</span></li><li><span className="stk-statValue">10</span><span className="stk-statLabel">shards</span></li><li><span className="stk-statValue">1.2 s</span><span className="stk-statLabel">finality</span></li></ul>
              </div>
              <div role="tabpanel" id="stack-panel-intents" aria-labelledby="stack-tab-intents" className="stk-panel">
                <div className="stk-panelTop"><p className="stk-label stk-role">How value moves</p><a className="stk-url" href="https://intents.near.org">intents.near.org<svg viewBox="0 0 10 10" width="9" height="9" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.2"></path></svg><span className="sr-only"> (another NEAR site)</span></a></div>
                <p className="stk-line">Say the outcome you want. Solvers compete to deliver it from whatever you hold, with no bridges and no wrapped tokens. NEAR Intents is the universal liquidity layer for onchain markets.</p>
                <ul className="stk-features"><li><p className="stk-featTitle">Confidential Intents</p><p className="stk-featDetail">About 40% of the last 30 days&#39; volume, as of 31 Oct 2026.</p></li><li><p className="stk-featTitle">In the Wallets People Use</p><p className="stk-featDetail">Ledger, Brave and Zodl route swaps through NEAR Intents.</p></li><li><p className="stk-featTitle">Revenue Funds Buybacks</p><p className="stk-featDetail">Fee switch live since Feb 2026.</p></li></ul>
                <ul className="stk-stats" aria-label="NEAR Intents in numbers"><li><span className="stk-statValue">$36.8B+</span><span className="stk-statLabel">settled, as of 31 Oct 2026</span></li><li><span className="stk-statValue">35+</span><span className="stk-statLabel">chains</span></li><li><span className="stk-statValue">120+</span><span className="stk-statLabel">assets</span></li></ul>
              </div>
              <div role="tabpanel" id="stack-panel-ai" aria-labelledby="stack-tab-ai" className="stk-panel">
                <div className="stk-panelTop"><p className="stk-label stk-role">Where your agents think</p><a className="stk-url" href="https://near.ai">near.ai<svg viewBox="0 0 10 10" width="9" height="9" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.2"></path></svg><span className="sr-only"> (another NEAR site)</span></a></div>
                <p className="stk-line">Inference and agents run inside hardware enclaves no one can see into: not the host, not the operator, not NEAR. Every request returns a signed proof of what ran.</p>
                <ul className="stk-features"><li><p className="stk-featTitle">NEAR AI Cloud</p><p className="stk-featDetail">Private inference on confidential hardware.</p></li><li><p className="stk-featTitle">Attestation</p><p className="stk-featDetail">A signed proof on every request.</p></li></ul>
                <ul className="stk-stats" aria-label="NEAR AI in numbers"><li><span className="stk-statValue">Zero</span><span className="stk-statLabel">operator access</span></li></ul>
              </div>
              <div role="tabpanel" id="stack-panel-com" aria-labelledby="stack-tab-com" className="stk-panel">
                <div className="stk-panelTop"><p className="stk-label stk-role">Where you act</p><a className="stk-url" href="https://near.com">near.com<svg viewBox="0 0 10 10" width="9" height="9" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.2"></path></svg><span className="sr-only"> (another NEAR site)</span></a></div>
                <p className="stk-line">One account for everything you hold. Swap, send and trade, confidential by default, with every transaction signed on your device.</p>
                <ul className="stk-features"><li><p className="stk-featTitle">Confidential Swaps and Transfers</p><p className="stk-featDetail">Across 35+ chains, from one account.</p></li><li><p className="stk-featTitle">Perps, Yield and RWAs</p><p className="stk-featDetail">In the same account.</p></li><li><p className="stk-featTitle">Signed on Your Device</p><p className="stk-featDetail">Every transaction.</p></li></ul>
                <ul className="stk-stats" aria-label="near.com in numbers"><li><span className="stk-statValue">35+</span><span className="stk-statLabel">chains</span></li><li><span className="stk-statValue">Confidential</span><span className="stk-statLabel">by default</span></li></ul>
              </div>
                </div>
              </div>
              <p className="stk-h3 stk-close" data-rise=""><span className="stk-sentence">Four layers, built as one system.</span> <span className="stk-sentence">At&nbsp;every one of them, the owner is you.</span></p>
            </div>
          </div>
        </div>
        <div className="stk-secondary" data-rise="">
          <div>
            <h3 className="stk-h4">Governance</h3>
            <p>The network is user-owned too. NEAR&#39;s direction is set onchain through House of Stake.</p>
            <a className="stk-more" href="https://houseofstake.org/">House of Stake<svg className="stk-ext" viewBox="0 0 10 10" width="9" height="9" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.2"></path></svg><span className="sr-only"> (another site)</span></a>
          </div>
          <div>
            <h3 className="stk-h4">Economics</h3>
            <p>How the network sustains itself, explained in one&nbsp;place.</p>
            <a className="stk-more" href="/economics">Read the fundamentals</a>
          </div>
        </div>
      </div>
    </section>
  );
}
