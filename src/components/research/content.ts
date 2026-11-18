// near.org/research (Research, "White paper and protocol work" in the header's Learn menu), the copy of the Research versions (/research-a, -b, -c:
// components/research/<letter>). From "near.org-airnauts - October 2026 (7)": the sitemap ("Redirect near.org/papers to near.org/research") and
// its "Technical Papers" note ("follow a similar layout to the blog page and host all the technical research NEAR and its founders have put out"),
// whose HERO and paper list are used verbatim. Each paper's summary is the live near.org/papers page's, kept close to its wording. [[TBD]]: authors
// and dates the live page doesn't give, more papers (the doc says "all the technical research"), the white paper's PDF (the live page links a CMS file).

export const HERO = {
  eyebrow: "Research",
  h1: "The papers behind the user-owned internet",
  /** the accent word for the heading (`<span className="accent">`) */
  accent: "user-owned",
  sub: "Since 2018, the NEAR ecosystem has been a pioneer of many technical innovations. Spanning user-owned AI and blockchain scalability, these papers lay out the fundamentals for technology that will power the user-owned internet.",
};

export type Topic = "protocol" | "ai";
export const TOPICS: { k: Topic; label: string }[] = [
  { k: "protocol", label: "Blockchain scalability" },
  { k: "ai", label: "User-owned AI" },
];

export type Paper = { k: string; n: string; title: string; short: string; topic: Topic; year?: string; note?: string; body: string; href: string; source: string };
/** the doc's "Papers to include", in its order */
export const PAPERS: Paper[] = [
  { k: "whitepaper", n: "01", title: "The NEAR White Paper", short: "White Paper", topic: "protocol", note: "The original paper", body: "A plan for a decentralized application platform built for usability and scalability: its technical design, token economics, use cases, and security.", href: "https://www.near.org/cms/e3ef4da798012d26.pdf", source: "PDF" },
  { k: "nightshade", n: "02", title: "Sharding Design: Nightshade", short: "Nightshade", topic: "protocol", year: "2019", note: "Version 2.0, 2024", body: "NEAR Protocol's sharding design, which splits the blockchain into parallel shards so it scales horizontally. Version 2.0 adds stateless validation, dividing both state and processing among the shards.", href: "https://discovery-domain.org/papers/nightshade.pdf", source: "PDF" },
  { k: "por", n: "03", title: "Proof-of-Response", short: "Proof-of-Response", topic: "ai", body: "A primitive for decentralized systems that guarantees services stay live and responsive, and rewards reliability. It applies to AI, crypto, and other protocols.", href: "https://github.com/nearai/papers/blob/main/ProofOfResponse.pdf", source: "GitHub · NEAR AI" },
  { k: "dcml", n: "04", title: "Decentralized Confidential Machine Learning", short: "DCML", topic: "ai", body: "A decentralized, confidential machine-learning cloud that runs verifiable, private inference in Trusted Execution Environments on CPUs and GPUs, so closed- and open-source AI builders can both earn from their work.", href: "https://github.com/nearai/papers/blob/main/DecentralizedConfidentialMachineLearning.pdf", source: "GitHub · NEAR AI" },
];

/** related, from the header and the History page (no new claims) */
export const MORE = {
  h: "Keep reading",
  links: [
    { label: "Blog", desc: "News and deep dives", href: "/blog" },
    { label: "History", desc: "From 2017 to now", href: "/history" },
    { label: "Docs", desc: "Build on NEAR", href: "https://docs.near.org/" },
  ],
};

export const CLOSE = {
  h: "NEAR belongs to you",
  sub: "Read the research, then build on what it describes.",
  primary: { label: "Read the docs", href: "https://docs.near.org/" },
  secondary: { label: "See the roadmap", href: "https://roadmap.near.org/" },
};
