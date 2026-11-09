// The four voices, verbatim (approved v4 board wording). `mark` is the phrase that is highlighted (emphasis only, it appears in `text`); `nw` a phrase kept on one line. Never reword.
export type Voice = {
  id: string;
  text: string;
  mark: string;
  name: string;
  role: string | null;
  nw?: string;
};

export const TITLE = "What the world is saying about NEAR";

export const FEATURED: Voice = {
  id: "federa",
  text: "Their AI work is the only AI x Crypto thing I’m looking forward to.",
  mark: "the only AI x Crypto thing",
  name: "Austin Federa",
  role: "Co-founder of DoubleZero",
};

export const MORE: Voice[] = [
  { id: "horsley", text: "I wouldn’t bet against NEAR.", mark: "bet against NEAR", name: "Hunter Horsley", role: "CEO of Bitwise" },
  { id: "mumtaz", text: "NEAR still feels like the most underrated team in crypto…", mark: "the most underrated team", name: "Mert Mumtaz", role: "Co-founder of Helius" },
  {
    id: "swihart",
    text: "…unlocking global access to encrypted wealth. Game changing at a multi-generational scale.",
    mark: "Game changing",
    nw: "a multi-generational",
    name: "Josh Swihart",
    role: null,
  },
];
