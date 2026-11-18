// near.org/solutions, the copy of "near.org/solutions — Solutions Hub Copy" in "near.org-airnauts - October 2026 (7)", verbatim. Shared by the
// Solutions versions (/solutions-a, -b, -c: components/solutions/<letter>). The doc's ⚑ on "30+ chains" (a figure to confirm) is kept as `flag`.
// The agent-economy post lives on near.org (not in this site's blog yet). "Talk to the team" goes to the contact page (the doc: "(contact form)"). The logo wall: the doc says to reuse the current near.org homepage's;
// the logos in the repo are public/brand/partners/ (Abound, Brave, Ledger, Venice, Zodl), the rest are names until their files are in [[TBD]].

export const CONTACT_URL = "/contact";
export const DOCS_URL = "https://docs.near.org/";

export const META = {
  title: "NEAR Solutions: Payments, DeFi, and AI Infrastructure | NEAR",
  description: "Build payments solutions, agentic finance, cross-chain DeFi, confidential trading, and user-owned AI on NEAR, the coordination layer behind $24B+ in volume.",
};

export const HERO = {
  eyebrow: "Solutions",
  h1: "Use cases powered by NEAR",
  /** the accent word for the heading (`<span className="accent">`) */
  accent: "powered",
  sub: "NEAR is where value moves across any chain, any asset, and any payment rail. Agents and users discover, negotiate, settle, and prove work on one integrated stack. Below are real-world solutions built on NEAR, and the global enterprises and DeFi leaders building them.",
  primary: { label: "Talk to the team", href: CONTACT_URL },
};

/** 2. Proof strip */
export const PROOF = [
  { value: "$24B+", label: "Cross-chain volume through NEAR Intents" },
  { value: "30+ chains", label: "Reached through one integration", flag: true },
  { value: "180+ assets", label: "Supported cross-chain" },
  { value: "Sub-cent", label: "Fees, with under 1s execution" },
  { value: "5+ years", label: "Proven on mainnet" },
];

export type Solution = { k: string; n: string; title: string; body: string; builders: string[]; link: { label: string; href: string } };
/** 3. Solutions: five blocks. `builders`: the names each block's body cites (for chips/logos; not extra copy) */
export const SOLUTIONS = {
  h: "What the world is building on NEAR",
  items: [
    { k: "payments", n: "01", title: "Payments", body: "Pay with any asset on any chain: the recipient gets their currency on the chain they choose. Stripe and Tempo's Machine Payments Protocol settles across 30+ chains on NEAR, and Abound uses NEAR AI to handle cross-border remittances.", builders: ["Stripe", "Tempo", "Abound"], link: { label: "Explore payments", href: "https://intents.near.org/use-cases/cross-pay" } },
    { k: "agentic", n: "02", title: "Agentic Finance", body: "NEAR is where agents transact: settling trades, routing payments, and rebalancing treasuries continuously, at machine speed and micro scale. On NEAR, agents reach liquidity across chains, discover and pay each other for work, and settle with finality no human-paced rail was built for.", builders: [], link: { label: "Explore how NEAR powers the agent economy", href: "https://www.near.org/blog/agent-economy" } },
    { k: "defi", n: "03", title: "Cross-Chain DeFi", body: "One-click, confidential swaps across 30+ chains and 180+ assets, filled by a competitive solver network in seconds for sub-cent fees, including routes bridges cannot reach like native BTC, XRP, and Zcash. Zodl, Ledger, Brave Wallet, Infinex, SwapKit, LayerZero, and other major DeFi protocols and infrastructure providers build on NEAR.", builders: ["Zodl", "Ledger", "Brave Wallet", "Infinex", "SwapKit", "LayerZero"], link: { label: "Explore NEAR Intents", href: "https://intents.near.org" } },
    { k: "treasury", n: "04", title: "Treasury Management", body: "Move and rebalance capital continuously across chains from one account, with assets staying in your control the whole time. The settlement layer for treasuries that operate at machine speed rather than banking hours.", builders: [], link: { label: "Explore NEAR Intents", href: "https://intents.near.org" } },
    { k: "ai", n: "05", title: "Confidential AI and Agents", body: "Run inference inside trusted execution environments where the host, the operator, and NEAR itself are cryptographically locked out, and deploy agents on IronClaw with credentials isolated by hardware. Abound, Venice AI, Brave, and global enterprises build on NEAR AI.", builders: ["Abound", "Venice AI", "Brave"], link: { label: "Explore NEAR AI", href: "https://near.ai" } },
  ] as Solution[],
};

/** 3. Spotlight: Confidential Intents */
export const SPOTLIGHT = {
  h: "Give your users confidentiality",
  body: "For the positions that move markets, NEAR’s Confidential Intents keeps transfers, deposits, withdrawals, and swaps out of public view, with selective disclosure when institutions need it. Powered by a NEAR private shard.",
  link: { label: "Explore Confidential Intents", href: "https://intents.near.org/confidential" },
};

/** 4. Who builds on NEAR: the logo wall. `src` where a file is in the repo, else the name is set in type */
export const BUILDERS = {
  h: "Integrated across enterprises, governments, wallets, and global infrastructure",
  logos: [
    { name: "Ledger", src: "/brand/partners/ledger.svg" },
    { name: "Brave", src: "/brand/partners/brave.png" },
    { name: "Zodl", src: "/brand/partners/zodl.png" },
    { name: "Abound", src: "/brand/partners/abound.svg" },
    { name: "Venice AI", src: "/brand/partners/venice.svg" },
    { name: "Stripe" }, { name: "Tempo" }, { name: "Infinex" }, { name: "SwapKit" }, { name: "LayerZero" },
  ] as { name: string; src?: string }[],
};

/** 5. Closing CTA (exit block) */
export const CLOSE = {
  h: "Build on NEAR",
  sub: "Developer, protocol, or enterprise, start with the solution that fits, or talk to our team of experts.",
  primary: { label: "Read the docs", href: DOCS_URL },
  secondary: { label: "Talk to the team", href: CONTACT_URL },
};
