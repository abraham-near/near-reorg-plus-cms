// near.org/protocol (Stack → Protocol in the menu): the copy of "near.org/protocol" in "near.org-airnauts - October 2026 (7)", verbatim. Shared by the
// Protocol versions (/protocol-a, /protocol-b: components/protocol/<letter>). The versions may regroup or reorder the sections for the story, but
// keep the words. Blog links go to near.org (the posts are not in this site's blog yet).

export const DOCS_URL = "https://docs.near.org/";

export const META = {
  title: "NEAR Protocol: The Settlement Layer for the Agent Economy",
  description: "A sharded blockchain built for AI scale: 1M+ TPS, 1.2s finality, confidential execution, and quantum-safe accounts. Proven on mainnet for 5+ years.",
};

export type Link = { label: string; href: string };

/** 1. Hero */
export const HERO = {
  h1: "The settlement layer for the agent economy",
  body: "1 million TPS scalability, confidential by default, quantum ready. Proven on mainnet for five years.",
  cta: { label: "Start building", href: DOCS_URL } as Link,
};

/** 2. Proof strip: value, then its label */
export const PROOF = [
  { value: "100%", label: "uptime" },
  { value: "5+ years", label: "on mainnet" },
  { value: "1M+ TPS", label: "Publicly verifiable" },
  { value: "600ms", label: "Block time" },
  { value: "1.2s", label: "Finality" },
  { value: "10 shards", label: "Plus a private shard" },
  { value: "<$0.002", label: "Avg transaction fee" },
];

/** 3. Built for AI scale */
export const AI_SCALE = {
  h: "Built for AI scale from day one",
  body: "A machine-speed economy needs three properties at once. NEAR ships all three today.",
  items: [
    { k: "sharding", name: "Scalable sharding.", body: "More shards, more throughput, no change for the developer." },
    { k: "confidential", name: "Confidential execution.", body: "A private shard runs confidential transactions at the protocol layer." },
    { k: "quantum", name: "Quantum-safe accounts.", body: "Post-quantum signing, live on mainnet, rotated in a single transaction." },
  ],
};

/** 4. Nightshade 3.0 */
export const NIGHTSHADE = {
  h: "Nightshade 3.0",
  sub: "Stateless validation is here",
  body: "The newest protocol upgrade decouples consensus from execution, adds multi-contract atomic interactions, and introduces a private shard for confidential transactions.",
};

/** 5. Dynamic resharding */
export const RESHARDING = {
  h: "Dynamic resharding",
  sub: "Capacity is a property of the network, not a governance decision.",
  body: "A shard now splits automatically when it hits its state-size threshold, validated by state witnesses, with no vote and no human intervention.",
  link: { label: "Learn more", href: "https://www.near.org/blog/introducing-dynamic-resharding" } as Link,
};

/** 6. Speed, scale, access */
export const SPEED = {
  h: "Speed. Scale. Access.",
  body: "600ms blocks and 1.2s finality. Global contracts deploy once and run network-wide. In-memory state removes database latency.",
};

/** 7. Private Shard */
export const PRIVATE_SHARD = {
  h: "Private Shard",
  sub: "Confidential execution, directly at the protocol layer",
  body: "Transactions are shielded from public view, with selective disclosure for compliance-readiness. The foundation for Confidential Intents.",
  link: { label: "Learn more", href: "https://www.near.org/blog/announcing-general-availability-confidential-intents" } as Link,
};

/** 8. Quantum-safe accounts */
export const QUANTUM = {
  h: "Quantum security",
  sub: "Post-quantum signing is live on mainnet",
  body: "NEAR accounts are decoupled from cryptography, so upgrading to quantum-safe keys takes a single key rotation. NEAR supports FIPS-204 (ML-DSA), a NIST-approved post-quantum signing scheme.",
  link: { label: "Preparing NEAR for the Quantum Computing Era", href: "https://www.near.org/blog/making-near-protocol-post-quantum-safe" } as Link,
};

/** 9. Chain Signatures */
export const CHAIN_SIGNATURES = {
  h: "Chain Signatures",
  sub: "Native transactions across the multi-chain ecosystem",
  body: "Through threshold MPC, a single NEAR account signs and triggers native transactions across 30+ chains, including Bitcoin, Ethereum, Solana, and more, with no bridge contracts. Support spans both ECDSA and EdDSA signature schemes.",
  link: { label: "Explore chain abstraction", href: "/chain-abstraction" } as Link,
};

/** 10. A blockchain for developers */
export const DEVELOPERS = {
  h: "A blockchain for developers",
  sub: "Build in familiar languages, ship without friction",
  items: [
    { k: "lang", name: "Rust or JS.", body: "A WebAssembly runtime for smart contracts." },
    { k: "gasless", name: "Gasless UX.", body: "Meta-transactions cover gas on behalf of your users." },
    { k: "earn", name: "Earn as they run.", body: "30% of burned gas returns to the contract's developer." },
  ],
  code: [
    "import { NearBindgen, view } from 'near-sdk-js';",
    "",
    "@NearBindgen({})",
    "class SmartContract {",
    '  greeting: String = "Hello NEAR";',
    "",
    "  @view({})",
    "  get_greeting(): String {",
    "    return this.greeting;",
    "  }",
    "}",
  ].join("\n"),
  cta: { label: "Start building", href: DOCS_URL } as Link,
};

/** 11. A new operating layer for AI */
export const AI_LAYER = {
  h: "A new operating layer for AI",
  sub: "A blockchain agents can actually use",
  body: "Confidential compute in Trusted Execution Environments, low-latency finality, and resharding that scales with agent demand",
  cta: { label: "Explore NEAR AI", href: "https://www.near.ai/" } as Link,
};

/** 12. NEAR One */
export const NEAR_ONE = {
  h: "NEAR One",
  sub: "The engineering team building NEAR Protocol",
  body: "NEAR One develops the core technology, drives research on architecture and scaling, and delivers the sharding roadmap that takes NEAR to billions of users.",
  link: { label: "Learn more", href: "https://nearone.org" } as Link,
};

/** 13. Secure it, evolve it */
export const SECURE = {
  h: "Secure NEAR. Evolve NEAR.",
  items: [
    { k: "validators", name: "Validators.", body: "Run a node or chunk validator and help safeguard the protocol." },
    { k: "neps", name: "NEAR Enhancement Proposals.", body: "Weigh in on the protocol's specifications and standards." },
  ],
};

/** 14. Content gallery */
export const DEEPER = {
  h: "Go deeper on NEAR",
  sub: "Protocol deep dives, coverage, and more",
  items: [
    { title: "Introducing Dynamic Resharding", body: "how the network adds shards automatically.", href: "https://www.near.org/blog/introducing-dynamic-resharding" },
    { title: "Preparing NEAR for the Quantum Computing Era", body: "the post-quantum roadmap.", href: "https://www.near.org/blog/making-near-protocol-post-quantum-safe" },
    { title: "Confidential Intents: Now Open to All", body: "confidential execution, generally available.", href: "https://www.near.org/blog/announcing-general-availability-confidential-intents" },
    { title: "The Agent Economy: Who Owns the Rails AI Runs On", body: "the thesis behind the stack.", href: "https://www.near.org/blog/agent-economy" },
    { title: "NEAR Foundation Joins the x402 Foundation", body: "advancing open infrastructure for the agent economy.", href: "https://www.near.org/blog/near-foundation-joins-x402-foundation" },
  ],
};

/** 15. Closing CTA (CloseScene: the homepage's "NEAR belongs to you" carries the heading; this is its line and button) */
export const CLOSE = {
  h: "The settlement layer for the agent economy.",
  sub: "Proven on mainnet. Ready for what agents need next.",
  primary: { label: "Start building", href: DOCS_URL } as Link,
};
