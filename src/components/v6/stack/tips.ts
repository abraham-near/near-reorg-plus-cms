// The boxes the v6 Stack drawing shows on hover (D124). A pill (a ring's name) or a card (title, a green line, a body). The pillar's six cubes run
// top (0) to bottom (5). A piece with no entry still lights (and the pillar still parts) but shows no box.
//
// Two sets:
// - REF: the near.org CMS preview's "The NEAR Stack" copy (near-org-cms-previews.up.railway.app, read 13 Nov 2026), verbatim, at Lawrence's request
//   ("match the content").
// - VERIFIED (shown): only what spec/PRODUCT.md backs. The REF copy names IronClaw (discontinued: never shown, D4 / PRODUCT §7) and claims that
//   are unconfirmed (Nightshade 3.0, Private Shard, Chain Signatures and "30+ chains" (F3: 35+), Agent Market, FIPS-204, global contracts, state
//   witnesses). D16: unverified claims are left out, not marked. Listed in spec/TASKS.md; Lawrence's call (D124).
// D131: every piece has a box, and every box the same design: a title, a green line (what it is), then its key facts. The cubes the reference gave
// unconfirmed topics (0, 3, 5) carry verified protocol facts instead. D136 (Lawrence: "not a two column bullet point. make it complete sentences"): the
// facts are a sentence or two, with a figure's date in its sentence, in place of D131's label / value rows and date note. The same facts, nothing added.
export type Tip = { kind?: "pill" | "card"; title: string; sub?: string; body?: string; facts?: string };

const USE_REF_COPY = false;

const REF: Record<string, Tip> = {
  cube0: {
    kind: "card", title: "Nightshade 3.0", sub: "Stateless validation is here",
    body: "The newest protocol upgrade decouples consensus from execution, adds multi-contract atomic interactions, and introduces a private shard for confidential transactions.",
  },
  cube1: {
    kind: "card", title: "Dynamic resharding", sub: "Capacity is a property of the network, not a governance decision.",
    body: "A shard now splits automatically when it hits its state-size threshold, validated by state witnesses, with no vote and no human intervention.",
  },
  cube2: {
    kind: "card", title: "Speed. Scale. Access.",
    body: "600ms blocks and 1.2s finality. Global contracts deploy once and run network-wide. In-memory state removes database latency.",
  },
  cube3: {
    kind: "card", title: "Private Shard", sub: "Confidential execution, directly at the protocol layer",
    body: "Transactions are shielded from public view, with selective disclosure for compliance-readiness. The foundation for Confidential Intents.",
  },
  cube4: {
    kind: "card", title: "Quantum security", sub: "Post-quantum signing is live on mainnet",
    body: "NEAR accounts are decoupled from cryptography, so upgrading to quantum-safe keys takes a single key rotation. NEAR supports FIPS-204 (ML-DSA), a NIST-approved post-quantum signing scheme.",
  },
  cube5: {
    kind: "card", title: "Chain Signatures", sub: "Native transactions across the multi-chain ecosystem",
    body: "Through threshold MPC, a single NEAR account signs and triggers native transactions across 30+ chains, including Bitcoin, Ethereum, Solana, and more, with no bridge contracts. Support spans both ECDSA and EdDSA signature schemes.",
  },
  intents: { kind: "pill", title: "NEAR Intents" },
  cloud: {
    kind: "card", title: "NEAR AI Cloud",
    body: "Confidential inference for enterprises and governments. Sensitive workloads run encrypted end to end, with attestation that proves exactly what code touched them.",
  },
  ironclaw: {
    kind: "card", title: "IronClaw",
    body: "The private AI assistant. Conversations and data live inside the enclave — verifiably out of reach of everyone, including the people running the hardware.",
  },
  market: {
    kind: "card", title: "Agent Market",
    body: "Where always-on agents live: published, discovered, and paid onchain, running around the clock inside secure enclaves.",
  },
  com: { kind: "pill", title: "near.com" },
};

const VERIFIED: Record<string, Tip> = {
  cube0: { title: "NEAR Protocol", sub: "The sharded, fast-finality base layer.", facts: "NEAR Protocol has been on mainnet since 2020, and more than 5.47 billion transactions have run on it since then." },   // F8, F20
  cube1: { title: "Dynamic resharding", sub: "Capacity is a property of the network, not a governance decision.", facts: "Dynamic resharding has been live on mainnet since July 2026, and the network now runs on 10 shards." },   // F9
  cube2: { title: "Speed", sub: "Fast blocks, fast finality.", facts: "A new block lands about every 600 milliseconds, and finality takes 1.2 seconds by protocol design." },   // F5, F6
  cube3: { title: "Scale", sub: "Throughput, tested in the open.", facts: "In December 2025, a public, reproducible benchmark on 70 shards passed one million transactions per second." },   // F7
  cube4: { title: "Quantum security", sub: "Accounts can sign with post-quantum keys.", facts: "Post-quantum ML-DSA account keys are live on mainnet today." },   // F10
  cube5: { title: "Low fees", sub: "A base-layer transaction costs under a cent.", facts: "The average L1 transaction fee was about $0.0055 as of 30 October 2026." },   // F15
  intents: {
    title: "NEAR Intents", sub: "The universal liquidity protocol: say what you want, the network finds the route.",
    facts: "NEAR Intents has settled more than $36.8 billion in all-time cross-chain volume as of 31 October 2026. It reaches more than 35 chains and 120 assets.",
  },   // F1, F3, F4
  ai: {
    title: "NEAR AI", sub: "Private inference and agents inside encrypted enclaves, with verifiable outputs.",
    facts: "NEAR began in 2017 as an AI lab, and one of its co-founders co-authored the Transformer paper.",
  },   // F18
  cloud: { title: "NEAR AI Cloud", sub: "Private inference on confidential hardware.", facts: "Inference runs on Intel TDX and NVIDIA confidential GPUs, with attestation on every request." },   // F17
  com: { title: "near.com", sub: "One account for every chain.", facts: "Swaps on near.com are confidential, and the same account handles transfers, perps, yield and RWAs." },   // PRODUCT §3
};

export const TIPS = USE_REF_COPY ? REF : VERIFIED;
/* the NEAR AI ring's boxes that light as a product of their own; the rest light the whole ring */
export const PRODUCTS = new Set<string>(USE_REF_COPY ? ["ironclaw", "cloud", "market"] : ["cloud"]);
