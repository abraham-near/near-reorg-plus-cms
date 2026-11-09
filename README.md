# near-reorg-plus-cms

Two directions for the NEAR homepage in one Next.js app, while we choose one, and a base for the pages that come after.

| Route | What |
|---|---|
| `/` | A selector: v1 (Flat design), v2 (3D render) or v3 (Flat + b10). |
| `/home-v1` | **v1 = near-reorg r17 v1 "Carril vivo"**: dot globe, vector rail, flat isometrics. |
| `/home-v2` | **v2 = Lawrence's hero → Stack**: rendered film, 3D scenes. |
| `/home-v3` | **v3 = v1 with b10's header and buttons**: the same page as `/home-v1`, with near-homepage-directions /b10's floating pill nav (in our black) and its pill / text buttons. |
| `/template` | The starting point for new pages: shared pieces only, viewable as v1 or v2. |

## How it is split

Three layers, so nothing has to wait for the decision:

1. **Shared** (both versions, every page), `src/components/shared/`:
   - the header and the footer;
   - the sections after the Stack: proof, Go deeper, Origin, voices, Get into NEAR, Close;
   - the version switch (`VersionSwitch`) and `version.tsx`.

   They also rely on:
   - `src/lib/motion` (scroll motion);
   - `src/styles/tokens.css` (brand tokens);
   - `src/app/globals.css` (Tailwind and the page base).
2. **Per version**, `src/styles/versions.css`: the values that differ, under `<html data-version="v1|v2">`. Today these are the header's corners and its paint over dark bands. Shared components read only these variables, never a value of their own.
3. **One version only**:
   - `src/components/v1/`: r17's world (globe, intro, hero, statement), rail and Stack, and its boot;
   - `src/components/v2/`: Lawrence's heroes, StoryRail and Stack, plus `v2.css`, his type roles and buttons (`.t-h1`, `.btn` …), which load on `/home-v2` only.

### Which version a page renders in
- `/home-v1` and `/home-v2` fix their own (`<FixVersion>`).
- Any other page follows `?v=1` / `?v=2`, remembered in localStorage, else v1 (the root layout's head script).
- `/template` shows the switch (bottom left).

### New pages
Copy `src/app/template`. Build the page from shared pieces (new ones go in `components/shared`). Anything that should look different per version goes in a variable in `versions.css`, never in a version-specific copy.

### The day one version wins
1. Move its values in `versions.css` to `:root` and delete the other block.
2. Delete the other version's folder (`components/v1` or `components/v2`) and its home route.
3. If v2 loses, delete `v2.css` too. If v1 loses, delete `V1Gate` and the gate in `lib/motion/scroll.ts`.

Shared pages don't change.

## v3: `/home-v3`

v1's page (`V1Page` with `v="v3"`) plus `src/components/v3/`:
- `header/`: b10's nav (pill, panels that unfold out of it, dot icons, phone map), in our black; its icons and sprite in `public/nav`, Montreal Medium in `src/fonts`.
- `buttons.css`: b10's buttons on the shared sections (hero pill, Stack links, Go deeper filters and "View everything", Origin's pill, Get into NEAR's actions, the newsletter field), only under `html[data-version="v3"]`.

`/template?v=3` shows both. v1 and v2 keep the shared header and their own buttons.

## v1: `/home-v1`

r17 v1 (`near-reorg/sites/r17/v1`), ported 1:1: same DOM, classes and CSS, with the behaviour modules ported to TypeScript nearly line for line.

- `V1Page.tsx`: the page.
- `V1Boot.tsx`: the boot, in r17's order:
  1. the world;
  2. the rail;
  3. the Stack;
  4. then the shared sections, which wait on `V1Gate` (`ctx.ts` `whenReady`).
- `world/`: the globe (three.js), the intro, the hero, the statement and the transition between them, Lenis, and the `<head>` flags (`head.ts`).
- `rail/`:
  - the story rail (`layer.ts`, one pinned stage of 9 screens);
  - the faint background globe (`railglobe.ts`);
  - the Figma isometrics (`vig2/`).
- `stack/`: r17's Stack.

URL flags:
- `?intro=0` skips the intro.
- `?rm=1` shows the static page (also with reduced motion).
- `?gl=0` shows the SVG poster instead of WebGL.

## v2: `/home-v2`

Lawrence's hero → Stack (near-org-site, `direction-b` @ a4d088b), code in `src/components/v2/{chapter-one,story,stack}`:
- one of his five heroes at random;
- the rail in its Horizon look with the live Orbit stations;
- the Stack.

The header, the sections after the Stack and the footer are the shared ones.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

Deploy: Railway (Next.js detected; build `npm run build`, start `npm start`, which listens on `$PORT`).

Dev note: if a CSS change doesn't show up, stop the dev server and delete `.next/dev`. The Tailwind loader caches CSS output there across restarts.

## To decide (then it goes in `versions.css` or becomes the shared value)
- **Text face:** Montreal Book (the shared pieces) or Regular (Lawrence's pieces and r17's Stack). Both versions mix the two today.
- **Accent:** Kepler Condensed Medium (the shared pieces) or Kepler Italic/Display (Lawrence's pieces and r17's Stack).
- **Text black:** `--ink` #1C1917 or Lawrence's `--color-ink` #262626.
- **Fonts:** all are preloaded on every route; Kepler Condensed (126 KB) isn't subset to Latin yet.
- **Smooth scroll:** Lenis runs on `/home-v1` only; shared pages don't have it yet.
- **Images:** plain `<img>` vs `next/image`.
