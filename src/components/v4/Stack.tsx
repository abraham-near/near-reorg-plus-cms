// v4's Stack: v1's (../v1/stack/Stack.tsx), same classes (stack/motion.ts runs on it unchanged), with the October 2026 copy: each layer's role, line and
// three features. The doc has no per-layer figures, no closing sentence and no Governance / Economics blocks, so those are left out.
import { StackIso } from "../v1/stack/StackIso";
import "../v1/stack/stack.css";
import "./stack-live.css";

type Layer = { key: string; n: string; name: string; role: string; url: string; host: string; line: string; features: [string, string][] };
const LAYERS: Layer[] = [
  {
    key: "protocol", n: "01", name: "NEAR Protocol", role: "Where value settles", url: "https://nearprotocol.com", host: "nearprotocol.com",
    line: "The settlement layer for machine-speed volume. NEAR Protocol has run on mainnet for 6+ years with zero downtime. It automatically scales as demand grows, so capacity keeps pace with agent activity.",
    features: [
      ["1M Transactions Per Second", "Publicly verifiable throughput."],
      ["Dynamic Resharding", "Shards split and merge automatically with demand."],
      ["Post-Quantum Signing", "NIST-approved ML-DSA keys, live on mainnet."],
    ],
  },
  {
    key: "intents", n: "02", name: "NEAR Intents", role: "How value moves", url: "https://intents.near.org", host: "intents.near.org",
    line: "The universal liquidity layer for onchain markets. State the outcome you want, and solvers compete to deliver it from whatever you hold, with no manual bridging or wrapping required. NEAR Intents has settled over $38 billion across 35+ chains and 180+ assets.",
    features: [
      ["Confidential Intents", "About 40% of volume over the last 30 days was confidential."],
      ["In the Wallets People Use", "Ledger, Brave and Zodl route swaps through NEAR Intents."],
      ["Revenue Funds Buybacks", "NEAR Intents fees fund NEAR buybacks."],
    ],
  },
  {
    key: "ai", n: "03", name: "NEAR AI", role: "Where your agents think", url: "https://near.ai", host: "near.ai",
    line: "NEAR AI is the confidential compute layer for AI. Open-model inference runs inside hardware enclaves sealed off from the host, the GPU operator, and NEAR itself, and every request returns a signed proof of what ran.",
    features: [
      ["Confidential Inference", "NEAR AI Cloud runs open models inside Intel TDX trust domains with encrypted memory."],
      ["Independent Attestation", "Intel Trust Authority verifies every attestation, so the proof doesn’t depend on NEAR."],
      ["Frontier Models, Privately", "A TEE gateway routes requests to frontier models without revealing who sent them."],
    ],
  },
  {
    key: "com", n: "04", name: "near.com", role: "Where you act", url: "https://near.com", host: "near.com",
    line: "One account for every market. Swap, send, stake, and trade across 35+ chains, confidentially, with every transaction signed on your device.",
    features: [
      ["Confidential by Default", "Swaps, transfers, and deposits stay off the public ledger."],
      ["Every Market", "Crypto, tokenized US stocks and ETFs, gold, perpetuals, NEAR staking, and yield, all from a single balance."],
      ["Signed on Your Device", "Every transaction is authorized with your passkey or wallet."],
    ],
  },
];
const ExtMark = () => (
  <svg viewBox="0 0 10 10" width="9" height="9" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.2"></path></svg>
);

/** still: the drawing without its build-in and its live loop (home v5) */
export function StackV4({ still = false }: { still?: boolean }) {
  return (
    <section className="stk stk--v4" id="stack" aria-labelledby="stack-title" data-stack="" data-still={still ? "" : undefined} data-tone="dark" data-nav-tone="dark" data-active-layer="protocol">
      <div className="stk-inner">
        <div className="stk-grid">
          <header className="stk-head" data-rise="">
            <h2 id="stack-title" className="stk-h2">Four layers. One <span className="accent">system.</span></h2>
            <p className="stk-lede">Each layer does one job. Together they keep your world in your&nbsp;hands.</p>
          </header>
          <div className="stk-track" data-track="">
            <div className="stk-pin" data-pin="">
              <div className="stk-cols">
                <div className="stk-art"><StackIso /></div>
                <div className="stk-list" data-rise="" role="tablist" aria-orientation="vertical" aria-label="The four layers">
                  {LAYERS.map((l, i) => (
                    <button key={l.key} type="button" role="tab" id={`stack-tab-${l.key}`} aria-controls={`stack-panel-${l.key}`} aria-selected={i === 0} tabIndex={i === 0 ? 0 : -1}
                      className="stk-tab" data-key={l.key}><span className="stk-index" aria-hidden="true">{l.n}</span><span className="stk-tabName">{l.name}</span></button>
                  ))}
                </div>
                <div className="stk-panels" data-rise="">
                  {LAYERS.map((l, i) => (
                    <div key={l.key} role="tabpanel" id={`stack-panel-${l.key}`} aria-labelledby={`stack-tab-${l.key}`} className="stk-panel" data-active={i === 0 ? "" : undefined}>
                      <div className="stk-panelTop"><p className="stk-label stk-role">{l.role}</p><a className="stk-url" href={l.url}>{l.host}<ExtMark /><span className="sr-only"> (another NEAR site)</span></a></div>
                      <p className="stk-line">{l.line}</p>
                      <ul className="stk-features">{l.features.map(([t, d]) => <li key={t}><p className="stk-featTitle">{t}</p><p className="stk-featDetail">{d}</p></li>)}</ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
