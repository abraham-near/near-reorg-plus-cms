import localFont from "next/font/local";

// Licensed fonts (D2). Files in src/fonts/; Kepler, Montreal 400/500 and Montreal Mono are subset to Latin (the full originals are in
// Work Local/Fonts). Bold isn't loaded: nothing uses it, and every preloaded face costs first paint.
export const montreal = localFont({
  src: [
    { path: "../fonts/PPNeueMontreal-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/PPNeueMontreal-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-montreal",
  display: "swap",
});

export const montrealMono = localFont({
  src: "../fonts/PPNeueMontrealMono-Regular.woff2",
  weight: "400",
  variable: "--font-montreal-mono",
  display: "swap",
  preload: false,
});

// Display optical size for accents at 48px and above.
export const keplerDisplay = localFont({
  src: "../fonts/KeplerStd-ItDisp.woff2",
  weight: "400",
  style: "italic",
  variable: "--font-kepler-display",
  display: "swap",
});

// Text optical size for editorial titles and smaller accents.
export const kepler = localFont({
  src: "../fonts/KeplerStd-Italic.woff2",
  weight: "400",
  style: "italic",
  variable: "--font-kepler",
  display: "swap",
  preload: false,
});

export const fontVariables = [montreal.variable, montrealMono.variable, keplerDisplay.variable, kepler.variable].join(" ");
