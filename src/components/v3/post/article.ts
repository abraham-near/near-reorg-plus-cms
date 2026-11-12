// What the three post layouts (PostA / PostB / PostC) render: an Article. Its body is either typed blocks (the example below, which /post-a, /post-b and
// /post-c share) or sanitized HTML from the CMS (/blog/[slug], built in lib/blog). The example is a generic piece on AI agents, written as placeholder
// copy so the layouts can be compared on the same words and photos. Not NEAR's copy: no claims of ours, and the figures are marked as illustrative.
// Inline marks in block text: **bold** and *italic* (Body.tsx renders them).
import { POSTS, TYPE_LABEL, href, img, type Type } from "../blog/data";

export type Img = { src: string; alt: string; cap?: string; w?: number; h?: number };
export type Block =
  | { k: "p"; t: string; note?: string }
  | { k: "h2"; id: string; t: string }
  | { k: "h3"; t: string }
  | { k: "quote"; t: string; by?: string }
  | { k: "fig"; img: Img; size?: "col" | "wide" | "bleed" }
  | { k: "pair"; imgs: [Img, Img]; cap?: string }
  | { k: "list"; ordered?: boolean; items: string[] }
  | { k: "callout"; title: string; t: string }
  | { k: "stats"; items: { n: string; l: string }[]; note: string }
  | { k: "code"; lang: string; t: string };

export type Section = { id: string; t: string };
/** a post in Keep reading / Up next / Related */
export type MorePost = { key: string; title: string; href: string; img: string | null; label: string; source: string; type?: Type; note?: string };
export type Article = {
  category: string;
  type: string;
  title: string;
  dek: string;
  author: { name: string; role: string; initials: string; bio: string };
  date: string;
  dateIso: string;
  /** href "": no tag page to link to (a plain label) */
  tags: { name: string; href: string }[];
  /** null: no photo (the layouts fall back to a plain panel) */
  hero: Img | null;
  takeaways: string[];
  /** typed blocks (the example) or sanitized HTML (the CMS) */
  body: { blocks: Block[] } | { html: string };
  sections: Section[];
  readMin: number;
  more: MorePost[];
  /** where Blog / All posts go */
  blogHref: string;
};

const EXAMPLE = {
  category: "AI",
  type: "Read",
  title: "Agents that act: what it takes to build AI people can trust",
  dek: "Language models learned to answer. The next step is teaching them to act (book, pay, coordinate) without asking anyone to give up control.",
  author: { name: "Editorial team", role: "Example byline", initials: "ET" },
  date: "November 12, 2026",
  dateIso: "2026-11-12",
  tags: ["AI agents", "Privacy", "Infrastructure", "Product"],
  hero: { src: "/images/home/home-origin-attention-v1.webp", alt: "Threads of light converging on one bright point over dark water", cap: "Many signals, one decision: the job of an agent." } as Img,
  takeaways: [
    "An agent is a model wrapped in tools, memory and rules; the wrapper decides whether it can be trusted.",
    "Memory is where the value accrues, so it should belong to the person, not the provider.",
    "Guardrails only count when they can be checked: spending limits, approvals and logs anyone can read.",
  ],
  blocks: [
    { k: "p", t: "For most of the last few years, talking to an AI meant asking a question and reading an answer. The model was a very fast, very well-read librarian. Useful, but passive: whatever happened next was still up to you." },
    { k: "p", t: "That is changing. The same models are now being given **tools**: a calendar, an inbox, a browser, a wallet. With tools, an answer becomes an action. Instead of telling you which flight is cheapest, an agent books it. Instead of drafting the email, it sends it.", note: "“Agent” is used loosely across the industry. Here it means a model that can call tools and take steps on its own between your instructions." },

    { k: "h2", id: "from-answers", t: "From answers to actions" },
    { k: "p", t: "The jump from answering to acting sounds small. It is not. An answer can be wrong and you shrug; an action can be wrong and money has moved, a meeting has been cancelled, a message has gone to the wrong person. The bar for reliability rises by an order of magnitude the moment software starts doing things on your behalf." },
    { k: "p", t: "It also changes who the software works for. A chatbot that recommends a product is one thing. An agent that *buys* the product is a participant in the economy, with a budget, preferences and obligations. Whoever controls that agent controls a real share of your attention and your wallet." },
    { k: "fig", size: "wide", img: { src: "/images/home/home-paths-build-v3.webp", alt: "A white steel frame against a pale sky, one edge lit green", cap: "An agent is scaffolding around a model: the tools it may use, what it remembers, and the rules it follows." } },

    { k: "h2", id: "the-loop", t: "How an agent works" },
    { k: "p", t: "Under the hood, most agents run the same loop. It is worth knowing, because each step is a place where things can go right or wrong." },
    { k: "list", ordered: true, items: [
      "**Perceive.** Read the request and the context around it: the thread, the calendar, the last few things you asked for.",
      "**Plan.** Break the goal into steps and pick a tool for each one.",
      "**Act.** Call the tools: search, fill a form, send a payment.",
      "**Check.** Compare the result with the goal, and either finish, retry or ask you.",
    ] },
    { k: "p", t: "The model is only one part of this loop. The quality of an agent depends just as much on the tools it can reach, the context it is given and, above all, on when it decides to stop and ask." },
    { k: "quote", t: "The hardest thing to teach an agent is not how to act. It is when not to.", by: "A product lead, in an example interview" },

    { k: "h2", id: "memory", t: "Memory is the product" },
    { k: "p", t: "A model without memory meets you for the first time, every time. Agents get useful the moment they remember: your preferences, your past decisions, the people you work with, the things you never want to do again." },
    { k: "p", t: "That memory is also the most sensitive thing in the system. It is a detailed portrait of a person, assembled one task at a time. Where it lives, who can read it and whether it can be moved are not technical details; they decide who the agent really serves.", note: "A useful test: if you switched providers tomorrow, could you take your agent’s memory with you?" },
    { k: "pair", imgs: [
      { src: "/v3/deeper/venice.webp", alt: "A frosted glass cube on a concrete plinth in an empty room" },
      { src: "/v3/deeper/quantum-readiness.webp", alt: "A large cut crystal resting on grey sand, light splitting through it" },
    ], cap: "Private by design: memory that can be used without being exposed." },
    { k: "p", t: "The emerging answer is to keep memory on the person’s side: encrypted, portable, and processed in environments that can prove they did not keep a copy. The agent borrows the context it needs for a task and gives it back." },

    { k: "h2", id: "guardrails", t: "Guardrails you can verify" },
    { k: "p", t: "Every serious agent ships with rules: spend no more than this, never email that person, always ask before deleting. The question is whether anyone can check those rules are actually enforced, or whether we are asked to take them on faith." },
    { k: "callout", title: "The idea in one line", t: "A guardrail that only the provider can see is a promise. A guardrail that anyone can verify is a property of the system." },
    { k: "p", t: "In practice, verifiable guardrails look mundane, which is the point. A short policy, written in plain terms, that sits outside the model and is enforced before any action leaves the building:" },
    { k: "code", lang: "yaml", t: "policy:\n  spend_limit: 50 USD per day\n  require_approval:\n    - new payee\n    - any transfer over 20 USD\n  tools: [calendar, email.read, payments]\n  log: every action, signed" },
    { k: "p", t: "Pair a policy like this with a signed log of every action and you get something rare in software: a record you can audit without trusting whoever wrote the code." },

    { k: "h2", id: "measuring", t: "Measuring what matters" },
    { k: "p", t: "Benchmarks for models measure how often they get the right answer. Benchmarks for agents need to measure something harder: how often they finish the job, how often they ask at the right moment, and how rarely they do something you did not want." },
    { k: "stats", items: [
      { n: "73%", l: "of tasks finished without a human step" },
      { n: "1 in 40", l: "actions paused to ask for approval" },
      { n: "0", l: "actions outside the written policy" },
    ], note: "Illustrative figures for this example post." },
    { k: "fig", size: "bleed", img: { src: "/images/home/home-hero-clouds-v1.webp", alt: "A mountain peak rising out of a sea of clouds", cap: "Above the noise: the numbers that matter are the ones a user can feel." } },
    { k: "p", t: "The last number is the one that earns trust. People forgive an agent that is slow or asks too often. They do not forgive one that surprises them." },

    { k: "h2", id: "next", t: "What comes next" },
    { k: "p", t: "The next wave of agents will not live inside a single app. They will move between services, negotiate with other agents, and settle payments in seconds. That only works if the rails underneath are open: identity that travels with the person, payments that any agent can make, and computation that can prove what it did." },
    { k: "fig", size: "col", img: { src: "/images/home/home-hero-unfurl-v1.webp", alt: "A fern frond unfurling in soft morning mist", cap: "Early days: most of what agents will do has not been built yet." } },
    { k: "p", t: "Get those foundations right and agents become something closer to a good assistant than a clever autocomplete: capable, accountable, and clearly working for the person who set them in motion." },
  ] as Block[],
};

const { blocks: BLOCKS, ...META } = EXAMPLE;

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const WORDS = BLOCKS.reduce((n, b) => {
  if (b.k === "p" || b.k === "h2" || b.k === "h3" || b.k === "quote" || b.k === "callout") return n + words(b.t);
  if (b.k === "list") return n + b.items.reduce((m, i) => m + words(i), 0);
  return n;
}, words(META.dek));

/** related posts: ids from the blog index (blog/data.ts) */
const RELATED = ["agent-economy", "venice", "brave"];

export const ARTICLE: Article = {
  ...META,
  author: { ...META.author, bio: "Placeholder author for this example. A real post shows the writer’s name, role and a line about what they work on." },
  tags: META.tags.map((name) => ({ name, href: "#" })),
  body: { blocks: BLOCKS },
  /** the post's sections (its h2s), for the contents lists */
  sections: BLOCKS.flatMap((b) => (b.k === "h2" ? [{ id: b.id, t: b.t }] : [])),
  /** minutes at ~220 words a minute */
  readMin: Math.max(1, Math.round(WORDS / 220)),
  more: RELATED.flatMap((id) => POSTS.filter((p) => p.id === id)).map((p) => ({
    key: p.id, title: p.title, href: href(p), img: img(p.id), label: TYPE_LABEL[p.type], source: p.source, type: p.type, note: p.note,
  })),
  blogHref: "/blog-a",
};
