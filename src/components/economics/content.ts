// near.org/economics, the copy of the Economics page in "near.org-airnauts - October 2026 (7)" (Hero → Section 2 … Section 6), verbatim
// except for the doc's typos ("teh", "towrd", "agentas"), fixed. Shared by the Economics versions (/economics-a, -b, -c:
// components/economics/<letter>). The doc has no Section 5 and no closing block: CLOSE below is the site's standard exit (homepage "Get into NEAR").
// The doc gives no live figures on purpose ("only structural facts that don't move"); the hero links out to revenue.near.org for numbers.

export const REVENUE_URL = "https://revenue.near.org/";

export const HERO = {
  eyebrow: "Economics",
  h1: "An economy that grows stronger the more it's used",
  /** the accent word for the heading (`<span className="accent">`) */
  accent: "stronger",
  sub: "NEAR isn't just a blockchain, it's an economic system where real usage generates real revenue, and that value flows back to the network itself. The more people and applications build and transact on NEAR, the more the whole system compounds. Here's how it works.",
  primary: { label: "See the live numbers", href: REVENUE_URL },
  secondary: { label: "How it works", href: "#how-it-works" },
};

/** Section 2: "Four structural facts (as cards or a row)" */
export const MATURE = {
  id: "mature",
  h: "Built on a foundation that's already set",
  intro: "Most crypto economies are still works in progress, supply still unlocking, inflation still high, governance still centralized. NEAR has already crossed the thresholds that most never reach.",
  facts: [
    { k: "supply", n: "01", title: "Supply is fully unlocked", body: "Every NEAR token is already in circulation. No locked allocations waiting to flood the market, no vesting cliffs hanging over holders. What you see is the whole supply.", figure: "100%", figureLabel: "of supply unlocked" },
    { k: "inflation", n: "02", title: "Inflation has been halved", body: "NEAR's maximum annual issuance was permanently cut by 50%. Fewer new tokens created means less dilution over time, a deliberate step toward a leaner economy, with more plans in the works to move toward deflation/fixed supply.", figure: "−50%", figureLabel: "max annual issuance" },
    { k: "governance", n: "03", title: "Governance is live and onchain", body: "NEAR's economic decisions are made through House of Stake, an onchain governance system that's already passing binding proposals. The community steers the system, not a company.", figure: "Onchain", figureLabel: "House of Stake", href: "https://houseofstake.org/" },
    { k: "uptime", n: "04", title: "Five years, zero downtime", body: "NEAR has run for over five years of continuous mainnet operation with 100% uptime. The economy described here isn't a plan, it's running on infrastructure that's already proven.", figure: "100%", figureLabel: "uptime, 5+ years" },
  ],
} as const;

/** Section 3: the flywheel, four steps and a closing line */
export const LOOP = {
  id: "how-it-works",
  h: "The loop at the center of it all",
  intro: "Most blockchains don't capture much from the activity happening on them. When people trade, swap, and transact, the fees mostly go to middlemen, validators, bots, liquidity providers, while the network itself earns little. NEAR is built differently. Here's the loop that makes it work.",
  steps: [
    { n: "1", short: "Usage", title: "Usage generates revenue", body: "Every time someone uses NEAR's infrastructure rails, swapping assets, moving value across chains, running AI agents, a small fee is generated. Nothing unusual so far; most systems charge fees. What's different is where those fees go next." },
    { n: "2", short: "Revenue", title: "Revenue flows back to the network", body: "Instead of leaking out to intermediaries, that revenue flows back toward NEAR itself. A portion is used to buy NEAR, real demand, funded by real usage, not by printing new tokens." },
    { n: "3", short: "Supply", title: "The supply tightens", body: "New tokens still enter circulation to secure the network, but usage-funded buybacks pull tokens back out. As usage grows, more is pulled back. Reach a high enough level of activity, and more tokens leave circulation than enter it, a point the system is designed to approach as it scales." },
    { n: "4", short: "Strength", title: "A stronger base attracts more usage", body: "A leaner, more transparent economy makes NEAR a more credible place to build and transact. More builders, applications, agents bring more usage, which starts the loop again, one turn stronger." },
  ],
  close: "That's the flywheel: usage creates revenue, revenue reinforces the network, a stronger network attracts more usage. It doesn't depend on hype or speculation. It depends on people actually using the system.",
} as const;

/** Section 4: where the revenue comes from */
export const SOURCES = {
  id: "revenue",
  h: "Real products. Real revenue.",
  items: [
    { k: "intents", n: "1", name: "NEAR Intents", title: "Settling billions in cross-chain value", body: "Intents lets anyone swap and move assets across dozens of chains by simply stating what they want. It's already settling billions in cross-chain volume, and every transaction generates fees that feed the loop. As more wallets, apps, and platforms plug in, that volume, and the revenue behind it, grows.", link: { label: "Explore NEAR Intents", href: "https://www.near.org/intents" } },
    { k: "ai", n: "2", name: "NEAR AI", title: "Powering the agent economy", body: "NEAR AI provides the confidential, verifiable infrastructure that AI applications and autonomous agents run on. As agents begin to transact, compute, and operate at scale, they pay for those services, and increasingly, they'll settle in NEAR. It's a second engine, pointed at one of the largest emerging markets in technology.", link: { label: "Explore NEAR AI", href: "https://near.ai/" } },
  ],
  tie: "These aren't side projects bolted onto a blockchain. They're the sources of the revenue that powers everything on this page, and they're built directly into the protocol, so the value they create stays in the system.",
} as const;

/** Section 6: one asset, three jobs */
export const CENTER = {
  id: "near",
  h: "One asset, holding it all together",
  intro: "Every part of this system, the products, the revenue, the governance, connects through a single asset: NEAR.",
  lead: "NEAR does three jobs at once.",
  jobs: [
    { k: "settlement", title: "The settlement asset", body: "The thing value is ultimately settled in when assets move and agents transact.", more: "More usage means more settlement in NEAR." },
    { k: "unit", title: "The unit of account", body: "The currency the network's own services are priced and paid in.", more: "More products mean more services paid in NEAR." },
    { k: "coordination", title: "The coordination mechanism", body: "What secures the network and what governance runs on.", more: "More at stake means more reason to participate in governance." },
  ],
  body: "Most tokens do one of these. NEAR does all three, and each reinforces the others. More usage means more settlement in NEAR. More products mean more services paid in NEAR. More at stake means more reason to participate in governance. The asset isn't a bystander to the economy, it's the thing the economy is built around.",
  forward: "The agentic economy is just getting started. As it grows, more flows through NEAR, and the loop compounds.",
} as const;

/** not in the doc: the site's standard exit block */
export const CLOSE = {
  h: "NEAR belongs to you",
  sub: "See the economy running in real time, or help steer it.",
  primary: { label: "See the live numbers", href: REVENUE_URL },
  secondary: { label: "Join House of Stake", href: "https://houseofstake.org/" },
};
