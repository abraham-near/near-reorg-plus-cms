// near.org/about ("History — From 2017 to now" in the header's Fundamentals menu), the copy for the History page versions (/about-a, -b, -c:
// components/history/<letter>). The October 2026 doc (near.org-airnauts (7)) has no page copy for it: the sitemap says "Redirect
// https://www.near.org/roadmap-history to near.org/about", so the timeline is the live roadmap-history page's milestones, kept close to its
// wording, and the opening / today / ahead lines are adapted from the doc's "Anthem Video" narrative beats (Illia's talking points), turned
// into page copy (not quoted). [[TBD]] marks what is still open: the exact month of each milestone, and the photos.

export const HERO = {
  eyebrow: "History",
  h1: "Before the world knew what it needed, NEAR was already building it",
  /** the accent word for the heading (`<span className="accent">`) */
  accent: "building",
  sub: "NEAR started as an AI company. Ten years later it is an integrated stack for the agent economy: a protocol, an intents network, AI and near.com. This is how it got here, from 2017 to now.",
  primary: { label: "See the roadmap", href: "https://roadmap.near.org/" },
  secondary: { label: "Read the papers", href: "/blog" },
};

/** Where NEAR came from (Anthem Video beats, "Where NEAR came from") */
export const ORIGIN = {
  h: "NEAR started as an AI company",
  body: [
    "Before NEAR, Illia Polosukhin was researching machine learning at Google, and co-authored the Transformer paper. Almost every model today is built on it; it is one of the most cited papers of the 21st century.",
    "What AI needed then was something blockchains could solve. Paying contributors around the world, without bank accounts, at scale. So the team set out to build the blockchain that could.",
  ],
  stat: { value: "2017", label: "Attention Is All You Need" },
};

export type Era = { id: string; label: string; from: number; to: number };
/** the timeline in four chapters (for versions that group it) */
export const ERAS: Era[] = [
  { id: "ai", label: "An AI company", from: 2017, to: 2018 },
  { id: "scale", label: "Built to scale", from: 2018, to: 2021 },
  { id: "abstraction", label: "Chain Abstraction", from: 2023, to: 2023 },
  { id: "agents", label: "The blockchain for AI", from: 2024, to: 2026 },
];

export type Milestone = { year: string; era: Era["id"]; title: string; body: string; tags: string[]; now?: boolean };
/** near.org/roadmap-history's milestones, in order */
export const MILESTONES: Milestone[] = [
  { year: "2017", era: "ai", title: "The paper that launched modern AI", body: "Illia co-authors the Transformer paper. Later that year, Illia and Alexander Skidanov start NEAR AI, to build models that write code from natural language.", tags: ["Transformer", "NEAR AI"] },
  { year: "2018", era: "ai", title: "The problem that created NEAR", body: "Training stalls on scaling limits and too few GPUs, and paying contributors around the world without bank accounts proves costly. The team turns to the problem underneath: a blockchain that can carry it.", tags: ["Founding"] },
  { year: "2018", era: "scale", title: "Designed for a billion users from the start", body: "NEAR Protocol is designed for global scale from day one, with sharding: computation and storage split across parallel parts of the network.", tags: ["Sharding", "Nightshade"] },
  { year: "2021", era: "scale", title: "Unifying the onchain economy", body: "NEAR passes one million accounts. Rainbow Bridge brings trustless transfers with Ethereum, and Aurora adds native EVM compatibility.", tags: ["1M accounts", "Rainbow Bridge", "Aurora"] },
  { year: "2023", era: "abstraction", title: "The dawn of Chain Abstraction", body: "Meta transactions ship, so people can transact without holding gas. NEAR DA launches in November. NEAR names and champions Chain Abstraction: one account, any chain.", tags: ["Meta transactions", "NEAR DA", "Chain Abstraction"] },
  { year: "2024", era: "agents", title: "The blockchain for AI", body: "Chain Signatures reach mainnet. The NEAR Foundation turns to user-owned AI in May; NEAR AI launches as a research arm for open, large-scale model development, and NEAR Intents enters beta in November.", tags: ["Chain Signatures", "NEAR AI", "Intents beta"] },
  // [[TBD: the live page gives no year for this one; 2025 by its place between 2024 and 2026]]
  { year: "2025", era: "agents", title: "NEAR Intents expands", body: "Wallets across the ecosystem integrate Intents, Chain Signatures reach more chains, and the relayer infrastructure matures.", tags: ["Intents", "Wallets", "Relayers"] },
  { year: "2026", era: "agents", title: "The original thesis is arriving", body: "Confidential Intents for private execution. NEAR AI and IronClaw for secure agents. Dynamic resharding, performance and quantum-safe signing in the protocol.", tags: ["Confidential Intents", "IronClaw", "Quantum-safe"], now: true },
];

/** Where NEAR is today (Anthem Video beats, "Where NEAR is today") */
export const TODAY = {
  h: "Not just a blockchain",
  body: "NEAR is an integrated stack: the base protocol, the intents network, AI, and near.com, one front end for everything NEAR has built. It has one of the most mature economic systems in the industry, with real revenue, onchain governance, and a Sovereign Fund for public goods.",
  layers: ["NEAR Protocol", "NEAR Intents", "NEAR AI", "near.com"],
  link: { label: "See how the economy works", href: "/economics" },
};

/** Where NEAR and the world are going (Anthem Video beats, "Where NEAR and the world is going" + Outro) */
export const AHEAD = {
  h: "AI is the front end. Crypto is the back end.",
  body: "AI will run on crypto rails: businesses want speed, reliability and security, and agents need automation, scale and liquidity. Underneath it all is one question, ownership.",
  owns: ["You own your assets", "You own your intelligence", "You own your alpha"],
  line: "Sovereignty is about claiming your own authority, not waiting for it. That's the world NEAR is building.",
};

/** "Join NEAR today" on the live page; the site's exit block */
export const CLOSE = {
  h: "NEAR belongs to you",
  sub: "See what ships next, or start building on what's already here.",
  primary: { label: "See the roadmap", href: "https://roadmap.near.org/" },
  secondary: { label: "Read the docs", href: "https://docs.near.org/" },
};
