// near.org/community, the copy of "near.org/community — Revamp: Layout & Copy" (near.org-airnauts, October 2026 (5)), verbatim. Shared by the
// Community versions (/community-a, -b, -c: components/community/<letter>). Order: Hero → Community stats → Events → The Legion → Socials →
// Ways to get involved → FAQ → Final CTA + newsletter.
// [[TBD]] marks what the doc leaves open: the figures ({X} in the doc: sample values here, flagged sample: true and shown as such), the FAQ's
// answers (the doc lists the questions only), and links the doc names without a URL (Legion, Luma, host / campus / content forms).

export const HERO = {
  h1: "The people building the open web",
  sub: "NEAR is built in the open by a global community of developers, creators, and contributors. Join the Legion, find your local crew, and help build the user-owned internet.",
  primary: { label: "Get involved", href: "#get-involved" },
  secondary: { label: "See upcoming events", href: "#events" },
};

/** "{X}+ Contributors · {X}+ Countries · {X}+ Builder groups · {X}+ Events / year": the doc's figures are open, so these are samples */
export type Stat = { value: string; label: string; sample: boolean };
export const STATS: Stat[] = [
  { value: "2,000+", label: "Contributors", sample: true },
  { value: "80+", label: "Countries", sample: true },
  { value: "120+", label: "Builder groups", sample: true },
  { value: "300+", label: "Events / year", sample: true },
];

// [[TBD: the NEAR community Luma calendar URL, and the "get it listed" form]]
export const LUMA = "https://lu.ma/near";
export const EVENTS_HEAD = {
  h: "Where the community meets",
  sub: "Hackathons, meetups, and builder nights happening around the world.",
  cta: { label: "View all events", href: LUMA },
  host: { label: "Hosting something? Get it listed", href: LUMA },
};
/** placeholder events until the Luma feed is wired (the doc: "Feed from a Luma calendar so it stays current without manual updates") */
export type Event = { title: string; city: string; date: string; dateIso: string; kind: "Hackathon" | "Meetup" | "Builder night"; href: string; sample: true };
export const EVENTS: Event[] = [
  { title: "NEAR Builder Night", city: "Lisbon", date: "Nov 21", dateIso: "2026-11-21", kind: "Builder night", href: LUMA, sample: true },
  { title: "Agents & Intents Hackathon", city: "Bangalore", date: "Nov 28", dateIso: "2026-11-28", kind: "Hackathon", href: LUMA, sample: true },
  { title: "NEAR Community Meetup", city: "Mexico City", date: "Dec 4", dateIso: "2026-12-04", kind: "Meetup", href: LUMA, sample: true },
  { title: "User-Owned AI Builder Night", city: "Berlin", date: "Dec 10", dateIso: "2026-12-10", kind: "Builder night", href: LUMA, sample: true },
  { title: "Chain Signatures Workshop", city: "Lagos", date: "Dec 12", dateIso: "2026-12-12", kind: "Meetup", href: LUMA, sample: true },
  { title: "NEAR Winter Hackathon", city: "Seoul", date: "Jan 16", dateIso: "2027-01-16", kind: "Hackathon", href: LUMA, sample: true },
];

// "This is NEAR's equivalent of the Ambassador program. Give it a wide, prominent placement." [[TBD: the Legion's URL]]
export const LEGION = {
  h: "Join the Legion.",
  body: "The Legion is NEAR's community of contributors — the people who host events, onboard builders, create content, and represent NEAR in their region. Get support, resources, and a direct line to the Foundation.",
  cta: { label: "Join the Legion", href: "https://www.near.org/legion" },
  /** "Supporting stat line (optional): {X} members across {X} countries." */
  stat: { line: "1,200 members across 60 countries.", sample: true },
};

export const SOCIALS_HEAD = { h: "Join the conversation", sub: "Wherever you already hang out, NEAR is there." };
export type Social = { key: string; name: string; line: string; cta: string; href: string };
export const SOCIALS: Social[] = [
  { key: "x", name: "X / Twitter", line: "News, launches, and community signal.", cta: "@NEARProtocol", href: "https://x.com/nearprotocol" },
  { key: "discord", name: "Discord", line: "Real-time chat, support, and dev help.", cta: "Join server", href: "https://near.chat/" },
  { key: "telegram", name: "Telegram", line: "Announcements and regional groups.", cta: "Join", href: "https://t.me/cryptonear" },
  { key: "github", name: "GitHub", line: "The code. Contribute and file issues.", cta: "View repos", href: "https://github.com/near" },
  { key: "reddit", name: "Reddit", line: "Long-form discussion and showcases.", cta: "r/nearprotocol", href: "https://www.reddit.com/r/nearprotocol/" },
  { key: "youtube", name: "YouTube", line: "Talks, tutorials, and recordings.", cta: "Subscribe", href: "https://www.youtube.com/@NEARProtocol" },
  // [[TBD: NEAR's Farcaster account]]
  { key: "farcaster", name: "Farcaster", line: "Onchain-native community chatter.", cta: "Follow", href: "https://farcaster.xyz/near" },
  { key: "linkedin", name: "LinkedIn", line: "Ecosystem and career updates.", cta: "Follow", href: "https://www.linkedin.com/company/near-protocol/" },
];

// [[TBD: the host / campus / content links]]
export const WAYS_HEAD = { h: "Bring your ideas to life" };
export type Way = { key: string; t: string; b: string; cta: string; href: string };
export const WAYS: Way[] = [
  { key: "host", t: "Host an event", b: "Run a meetup, hackathon, or builder night with support from the Foundation.", cta: "Apply to host", href: LUMA },
  { key: "campus", t: "NEAR on Campus", b: "Lead student builders at your university.", cta: "Learn more", href: "https://www.near.org/campus" },
  { key: "code", t: "Contribute code", b: "Ship to the protocol and ecosystem repos.", cta: "Start on GitHub", href: "https://github.com/near" },
  { key: "content", t: "Create content", b: "Write, stream, or teach and get amplified.", cta: "Get involved", href: "https://www.near.org/legion" },
];

/** the doc lists the questions; the answers are placeholders, flagged, until the community team writes them [[TBD]] */
export type Faq = { q: string; a: string; sample: true };
export const FAQ: Faq[] = [
  { q: "How do I get started building on NEAR?", a: "Start with the docs and the developer channels on Discord: they walk you from your first account to your first contract.", sample: true },
  { q: "What is the Legion and how do I join?", a: "The Legion is NEAR's community of contributors. Apply through the Legion page; the community team reviews every application.", sample: true },
  { q: "How do I find or start a community group in my city?", a: "Look for your city on the events calendar and the regional Telegram groups. If there is none yet, the Legion can help you start one.", sample: true },
  { q: "Can NEAR support my event or hackathon?", a: "Yes: apply to host, and the Foundation can help with venues, speakers, prizes and promotion.", sample: true },
  { q: "Where do I get technical help? (Discord / docs / GitHub)", a: "Ask in the developer channels on Discord, search the docs, or open an issue in the relevant GitHub repo.", sample: true },
  { q: "How can I get my project featured?", a: "Share it in the showcase channels on Discord and Reddit, and tell the community team: featured projects are picked from there.", sample: true },
  { q: "How do I reach the community team?", a: "Write to us from the contact page, or reach out on Discord.", sample: true },
];

export const CLOSE = {
  h: "Start building the open web.",
  sub: "Pick a channel, join the Legion, or come to an event — however you want in.",
  primary: { label: "Get involved", href: "#get-involved" },
  secondary: { label: "Read the docs", href: "https://docs.near.org/" },
  newsletter: { h: "Community in your inbox", sub: "Monthly highlights: events, featured builds, and ways to get involved.", cta: "Subscribe" },
};
