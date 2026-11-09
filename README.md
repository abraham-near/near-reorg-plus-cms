# near-reorg-plus-cms

Two versions of the NEAR homepage in one Next.js app:

| Route | What |
|---|---|
| `/` | A selector: v1 or v2. |
| `/home-v1` | **v1 = near-reorg r17 v1 "Carril vivo"**, whole. |
| `/home-v2` | **v2 = Lawrence's hero → Stack + Abraham's sections.** |

The versions don't share components: each can change without touching the other. Links into and out of v1 are plain `<a>` (full page loads), so v1's global CSS and its boot never meet v2's. In production each route ships its own CSS.

## v1: `/home-v1`

r17 v1 (`near-reorg/sites/r17/v1`), ported 1:1. Same DOM, classes and CSS; the behaviour modules ported to TypeScript nearly line for line. Code in `src/components/v1/`:

- `V1Page.tsx`: the page.
- `V1Boot.tsx`: the boot, in r17's order:
  1. the world;
  2. the rail;
  3. the Stack;
  4. then the sections after it (`ctx.ts` `whenReady`).
- `world/`: the globe (three.js), the intro, the hero, the statement and the transition between them, Lenis, and the `<head>` flags (`head.ts`).
- `rail/`:
  - the story rail (`layer.ts`, one pinned stage of 9 screens);
  - the faint background globe (`railglobe.ts`);
  - the Figma isometrics (`vig2/`).
- `stack/`: r17's Stack.
- `header/`, `footer/`, `proof/`, `go-deeper/`, `origin/`, `voices/`, `get-into/`, `close/`: v1's own copies of these sections (r17 values: square header, footer takeover 100 px from the end).

URL flags:
- `?intro=0` skips the intro.
- `?rm=1` shows the static page (also with reduced motion).
- `?gl=0` shows the SVG poster instead of WebGL.

## v2: `/home-v2`

- **Hero → Stack:** Lawrence's (near-org-site, `direction-b` @ a4d088b):
  - one of his five heroes at random;
  - the rail in its Horizon look with the live Orbit stations;
  - the Stack.

  Code in `src/components/home/{chapter-one,story,stack}`.
- **Header, everything after the Stack, footer:** Abraham's (near-reorg r17 v1):
  - the header (b8's nav);
  - the proof strip;
  - Go deeper;
  - Origin;
  - the voices;
  - Get into NEAR;
  - Close;
  - the footer (near-org-cms's takeover).

  Code in `src/components/site/*` and `src/components/home/{proof,go-deeper,origin,voices,get-into,close}`, with the shared scroll helpers in `src/lib/motion`.

One token set (`src/styles/tokens.css`): Abraham's palette, under Lawrence's token names.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

Deploy: Railway (Next.js detected; build `npm run build`, start `npm start`, which listens on `$PORT`).

## Pending clean-up
- Lawrence's sections set text in `--color-ink` (#262626); Abraham's use `--ink` (#1C1917).
- His radii vs our square corners.
- His global type roles (`.t-h1`, `.btn` …) vs our per-section type.
- Plain `<img>` vs `next/image`.
