// near.org/brand (Brand, "Logos and guidelines" in the header's Connect menu), the copy of the Brand versions (/brand-a, -b, -c:
// components/brand/<letter>). The October 2026 doc lists the page ("Not started · Design") with no copy, and near.org/brand is a 404 today, so
// this is adapted from the doc's agency brief (Logo, The green question, Fonts, Voice and tone), turned into page copy, plus the site's own tokens
// (src/styles/tokens.css, the homepage's paper / ink / green) and the files in public/brand/. [[TBD]]: a press kit zip, the logo's clear-space
// and minimum-size rules (the brief: "we are perfecting it"), the secondary accent colour (the brief asks for one, not chosen yet), a brand contact.

export const HERO = {
  eyebrow: "Brand",
  h1: "The NEAR brand, ready to use",
  /** the accent word for the heading (`<span className="accent">`) */
  accent: "ready",
  sub: "Logos, colors, type and voice for anyone writing about, building on, or partnering with NEAR. Download what you need, and use it the way it's meant to be used.",
  primary: { label: "Download the logos", href: "#logos" },
  secondary: { label: "Contact the team", href: "/contact" },
};

/** the brief's "What it should feel like", as the brand's principles */
export const PRINCIPLES = {
  h: "Human, confident, forward-looking",
  items: [
    { k: "human", title: "Human and approachable", body: "Warmth has been part of NEAR from the start. It's a position to protect, not just a look." },
    { k: "quiet", title: "Quiet authority", body: "Confident and elegant, without dazzling. Clean and grown-up, with a light touch of play." },
    { k: "proof", title: "Proof first", body: "Lead with what NEAR does, then show the evidence. Let proof carry the claim." },
  ],
};

export type Asset = { k: string; name: string; desc: string; src: string; dark?: boolean };
/** the files in public/brand/ (SVG) */
export const LOGOS = {
  id: "logos",
  h: "Logo",
  intro: "The NEAR logo is tied to the token and to a decade of recognition. Use the full logo or the mark on its own, never both side by side.",
  assets: [
    { k: "logo", name: "Logo", desc: "Mark and wordmark, for light backgrounds", src: "/brand/logo.svg" },
    { k: "logo-rev", name: "Logo, reversed", desc: "For dark backgrounds", src: "/brand/logo_rev.svg", dark: true },
    { k: "wordmark", name: "Wordmark", desc: "NEAR set on its own", src: "/brand/near-wordmark.svg" },
    { k: "icon", name: "Mark", desc: "For small spaces and avatars", src: "/brand/icon.svg" },
    { k: "icon-rev", name: "Mark, reversed", desc: "For dark backgrounds", src: "/brand/icon_rev.svg", dark: true },
    { k: "token", name: "NEAR token", desc: "The token symbol", src: "/brand/NEAR_token.svg" },
  ] as Asset[],
  dos: ["Give the logo room to breathe", "Use the files as they are", "Use the reversed logo on dark backgrounds"],
  donts: ["Set the mark and the wordmark side by side", "Stretch, rotate, outline or recolor it", "Place it on busy photos without contrast"],
};

export type Swatch = { k: string; name: string; hex: string; role: string; dark?: boolean };
/** the site's palette (tokens.css): a strong neutral base, with green as a thread, not a flood */
export const COLOR = {
  h: "Color",
  intro: "A strong neutral base, with green as a thread. Green marks what matters; it never floods the page.",
  swatches: [
    { k: "paper", name: "Paper", hex: "#F5F4F1", role: "The page" },
    { k: "paper-1", name: "Paper 1", hex: "#EDECE8", role: "Panels and cards" },
    { k: "paper-2", name: "Paper 2", hex: "#E2E1DE", role: "Lines and fills" },
    { k: "ink", name: "Ink", hex: "#262626", role: "Text and dark bands", dark: true },
    { k: "graphite", name: "Graphite", hex: "#3D3E3F", role: "Secondary text", dark: true },
    { k: "green", name: "NEAR Green", hex: "#00DC8D", role: "Accent, used sparingly" },
    { k: "green-text", name: "Green text", hex: "#00774F", role: "Green as text, on paper", dark: true },
  ] as Swatch[],
};

/** the brief's Fonts */
export const TYPE = {
  h: "Typography",
  intro: "Two typefaces: a clean sans for everything, and a condensed italic serif for the one word that carries the line.",
  faces: [
    { k: "montreal", name: "PP Neue Montreal", role: "Primary · headings, body, interface", sample: "Own your world." },
    { k: "kepler", name: "Kepler", role: "Secondary · the accent word, in Medium Condensed Italic Display", sample: "belongs to you" },
  ],
};

/** the brief's Voice and tone */
export const VOICE = {
  h: "Voice",
  intro: "NEAR sounds like infrastructure that knows its position: declarative, specific, and backed by proof.",
  rules: [
    { title: "Declarative and proof-first", body: "Lead with what NEAR does, then show the evidence." },
    { title: "Tense tracks status", body: "Present tense for shipped features, future tense for roadmap items." },
    { title: "No superlatives", body: "Drop “leading,” “revolutionary,” “best-in-class.” Let proof carry the claim." },
    { title: "Pass the swap test", body: "If another L1's name could replace NEAR and the sentence still holds, rewrite it." },
    { title: "Plain, precise words", body: "Say it the simple way." },
  ],
  naming: [
    { right: "NEAR", wrong: "Near, near" },
    { right: "NEAR Intents", wrong: "Near intents, Intents Protocol" },
    { right: "NEAR AI", wrong: "Near.ai, NearAI" },
    { right: "near.com", wrong: "Near.com, NEAR.com" },
  ],
};

export const CLOSE = {
  h: "NEAR belongs to you",
  sub: "Need something that isn't here, or writing about NEAR? Talk to the team.",
  primary: { label: "Contact the team", href: "/contact" },
  secondary: { label: "Read the blog", href: "/blog" },
};
