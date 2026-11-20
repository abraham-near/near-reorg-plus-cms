# near-reorg-plus-cms

The new near.org: the site's pages and the NEAR CMS (the blog's back office) in one Next.js 16 app. Production deploys from `main` on Railway: https://near-reorg-plus-cms-last-version.up.railway.app

- **`/index`** lists the **final pages**, one card each.
- **`/extra`** lists the **explorations**: the other versions of each page and the ones not chosen.
- The CMS has its own guide: [`src/cms/README.md`](src/cms/README.md). It covers roles, the editor, the Claude connector and the API.

## The site today

| Address | Page | Code |
|---|---|---|
| `/` (and `/home-v9`) | **Homepage**: home v9. One type-only section, "NEAR is privacy for onchain capital and the agent economy.", then the rail, the Stack in lit matte, proof and Go deeper. Home v7 (`/home-v7`, the film hero) stays at its own address, also on `/index`; v8 (`/home-v8`, the cycling word) is on `/extra`. | `src/components/v7` (on pieces of v1–v5) |
| `/blog` | **Blog**: version E (Lawrence's choice). The CMS's posts, the lead post always on screen, All / Blog / Press / Watch as large words, tag pills you can combine (the CMS's tags, with NEAR AI, NEAR Intents, near.com and NEAR Protocol first), and the homepage's ruled cards with date and tags, nine at a time. | `src/components/blog/e` |
| `/blog/<slug>` | **Blog post**: layout B (Cover) by default; `?layout=a\|c\|d` shows A, C or D. `/post-b` is the sample article. | `src/components/v3/post` |
| `/near-foundation` | **NEAR Foundation**: Foundation E (Living columns), with F's pillars and F's Council. | `src/components/foundation/e` (+ `f`) |
| `/analytics` | **Analytics**: X (MVP, the Nov 19 review). Sample figures until the live feed lands. | `src/components/analytics/x` |
| `/economics` | **Economics**: X (MVP), from the October 2026 doc. | `src/components/economics/x` |
| `/history` | **History** ("From 2017 to now" in the menu): X (MVP). | `src/components/history/x` |
| `/community` | **Community**: X (MVP), from the October 2026 doc. Sample figures and events. | `src/components/community/x` |
| `/solutions` | **Solutions**: X (MVP), from the October 2026 doc's Solutions Hub. | `src/components/solutions/x` |
| `/research` | **Research**: X (MVP), the technical papers. | `src/components/research/x` |
| `/protocol` | **Protocol** (Stack in the menu): version B, "The network lives", from the October 2026 doc. Illustrative motion, not live data. | `src/components/protocol/b` |
| `/contact` | **Contact**: a short about, the form (no backend yet) and NEAR's social links. | `src/components/contact` |
| any unknown address | **404**: A, "Lost in the mist". | `src/components/notfound/a` |
| `/index`, `/extra` | The two lists of pages (see below). | `src/app/(site)/index`, `src/app/(site)/extra` |
| `/admin` | The CMS. | `src/cms`, `src/app/(cms)` |

Explorations that still have their own routes are listed at `/extra`:
- the blog post layouts `/post-a`, `/post-b`, `/post-c` and `/post-d` (D: the October 2026 Figma's blog look; the CMS picker still offers A–C only);
- the blog index versions A–D at `/blog-index-a…d` (E is the live `/blog`; A is direction J, the previous `/blog`, `src/components/v3/blog/j`): B and D from the October 2026 Figma's two blog frames (nodes 980:723, 756:41), C is B on the homepage's soft ruled grid (`src/components/blog/<letter>`). Not `/blog-b…d`: those still redirect to `/blog` (the old directions A–L);
- the MVP versions X from the Nov 19 review (`src/components/<page>/x`) are the menu's Analytics, Community, History, Economics, Solutions and Research, at the plain addresses (`/analytics`…); `/analytics-x`, `/community-x`, `/history-x`, `/economics-x`, `/solutions-x` and `/research-x` still lead there (a temporary redirect). One version per page: mostly copy, no eyebrows or decorative numerals, no ruled grid by the header, the site's dot icons where they help, graphics as placeholders (`[[TBD: graphic by Ali]]`);
- Analytics A–E at `/analytics-a`…`/analytics-e` (C was `/analytics` until Nov 19, 2026);
- Economics A–C at `/economics-a…c`, History A–C at `/history-a…c` and Community A–C at `/community-a…c` (the menu's versions until Nov 19, 2026: Economics A, History C, Community B);
- Protocol A, C and D at `/protocol-a`, `/protocol-c`, `/protocol-d` (B is the menu's `/protocol`). Copy verbatim from the October 2026 doc in `src/components/protocol/content.ts`.
- Solutions, Research and Brand A–C at `/solutions-a…c`, `/research-a…c`, `/brand-a…c` (the menu's `/brand` isn't built yet: it redirects to `/brand-a` for now). Copy in `src/components/<page>/content.ts`: Solutions verbatim from the October 2026 doc, Research from its Technical Papers note and near.org/papers, Brand adapted from its agency brief.

### What changed (November 2026)

- **Homepage:** home v9 is the first page (v7 at `/home-v7`; v8 at `/home-v8`, on `/extra`). Homes v1–v6 were removed, with the code and assets only they used. `/home-v1`…`/home-v6` redirect to `/`.
- **Removed pages:**
  - the blog directions A–L (J, which was `/blog` until E was chosen, is at `/blog-index-a`);
  - the 404 previews and designs B and C;
  - `/template`;
  - Analytics C;
  - Foundation A, B, C, D and F (`/foundation`, `/foundation-b`…`-f` redirect to `/near-foundation`).
- **Moved pages:**
  - Foundation E moved to `/near-foundation`. It now has F's pillars and F's Council, and no badges on its drawings. It still uses a few of B's and C's pieces (`foundation/b`, `foundation/c`).
  - Analytics C (the ruled grid) was `/analytics` until Nov 19, 2026; it is at `/analytics-c` again (with A, B, D and E at their letters).
  - Nov 19, 2026: the X versions became the menu's Analytics, Economics, History, Community, Solutions and Research at the plain addresses; Economics A, History C and Community B moved to `/economics-a`, `/history-c`, `/community-b`, and `/<page>-x` redirects to `/<page>`.
  - Old addresses redirect: see `redirects()` in `next.config.ts`.
- **Header:** every page uses the homepage's header. At the top of the page it is spread out (the wordmark, the menus and Get started sit at the margins). On the first scroll it gathers into the pill, and it stays on screen. Opening a menu at the top no longer gathers it. Menu links: Blog → `/blog`, NEAR Foundation → `/near-foundation`, Analytics → `/analytics`, History → `/history`, Economics → `/economics`, Community → `/community`, Contact → `/contact`.
- **Page transitions:** the browser's cross-document View Transitions (`src/styles/view-transitions.css`, loaded by the site's layout only): the header holds still while the page under it changes. Two versions to compare: A "Quiet" (default: the page fades and lifts out, the next rises in) and B "Curtain" (the next page is drawn up over the last); `?vt=a` or `?vt=b` on any page picks one, remembered in that browser. Chrome/Edge 126+ and Safari 18.2+; elsewhere pages simply load. Reduced motion: no animation.
- **Type:** every h1, h2 and h3 sets its words in PP Neue Montreal Book and its accent in Kepler Std Medium Condensed Italic Display, as in the hero (see "Building a page").
- **Contact:** rebuilt as about + form + social links.
- **Hero film:** home v7's film is served from the media bucket (see "Big media").

## Pages: /index and /extra

There are two lists, and each page belongs to one of them.

| | `/index` | `/extra` |
|---|---|---|
| What | the final version of each page, at the address it ships at | explorations, versions to compare, versions not chosen |
| List | `src/app/(site)/index/pages.ts` (`FINALS`) | `src/app/(site)/extra/pages.ts` (`GROUPS`) |
| Pictures | `public/index/<id>.webp` | `public/extra/<name>.webp` |

Both show a 1200×750 picture per card. Make it with the dev server running:

```bash
npm run capture -- /contact public/index/contact.webp          # path, output, optional wait in ms (default 5000)
BASE=http://localhost:3000 npm run capture -- /blog public/index/blog.webp
```

`scripts/capture.mjs` loads the page in headless Chrome at 1440×900, hides the working aids (the Extra pages chip and the version switches) and saves the first screen as WebP. It reads from `BASE` (default `http://localhost:3300`) and uses Google Chrome on macOS unless `CHROME` names another binary.

### A new version of a page (an exploration)

1. **Route:** add it under `src/app/(site)/<page>-<letter>/page.tsx`, for example `/contact-b` or `/foundation-g`.
   - Its code goes in `src/components/<page>/<letter>/`.
   - Wrap it in `BlogShell` (`src/components/v3/blog/BlogShell.tsx`), which gives it the site's header, footer and v3 values.
2. **Switch (optional):** if the page has versions, add a switch to move between them. Copy `AnalyticsSwitch`; they sit under the header, at the top left.
3. **List it:** add an entry to the right group in `extra/pages.ts` (or a new group), then capture its picture into `public/extra/`.
4. **Leave the final page alone:** don't touch the final page or its entry in `index/pages.ts` until the new version is chosen.

### When a version is chosen

1. **Address:** move it to the final address.
   - Rename the route folder, for example `git mv src/app/(site)/contact-b src/app/(site)/contact`, after moving the old one aside or deleting it.
   - Give the old address a redirect in `next.config.ts` → `redirects()`.
2. **`/index`:** update the page's entry in `index/pages.ts` (note and tags) and capture its picture again into `public/index/`.
3. **`/extra`:** in `extra/pages.ts`, point the entry to the new address and mark it `featured: true`; unmark the old one.
4. **Links:**
   - Make sure the header (`src/components/v3/header/links.ts`) and footer (`src/components/v3/footer/Footer.tsx`) link to the final address.
   - Also check the older shared header and footer in `src/components/shared/`.
5. **Clean up:** delete versions nobody needs any more, with their components and pictures. Look for files nothing imports and assets nothing references before deleting.

## Building a page

- **Shell:**
  - `BlogShell` = `V3Header` (with `spread stay soft`) + `<main>` + `V3Footer` + the temporary Extra pages chip.
  - `FixVersion v="v3"` sets the page's values (`html[data-version="v3"]`, `src/styles/versions.css`).
- **Type:**
  - Fonts load in `src/styles/fonts.ts`. Montreal Medium and Regular for the header load from `src/components/v3/header/font.ts`.
  - Mark the accent word in a heading with `<span className="accent">`.
  - `src/app/globals.css` re-points the font variables on every `h1`, `h2` and `h3`: the words in Montreal Book, the accent in Kepler Condensed, and monospaced labels keep their face. A new page gets this for free. Don't set `font-family` with a literal name on a heading; use the variables (`--sans-display`, `--font-text`, `--font-acc` …).
- **Pieces:**
  - the tokens in `src/styles/tokens.css`;
  - the blog's pieces (`src/components/v3/blog/blog.css`: `.bl-btn`, `.bl-link`, `.accent`);
  - Blog J's fields and rail (`v3/blog/j/blog-j.css`);
  - the ruled grid of the Foundation and Analytics pages.
  - the homepage's close (`src/components/shared/CloseScene.tsx`): "NEAR belongs to you" over the meadow, with the page's own line, buttons and optional newsletter. Put it after the page's component in the route; pass `ruled` on pages built on the ruled grid.
- **Motion:**
  - Use `useScrollMotion` (`src/lib/motion/scroll.ts`) for GSAP and ScrollTrigger, and respect reduced motion.
  - A heading that rises word by word: split it with SplitText **without masks** and tween each word from `{ yPercent: 40, autoAlpha: 0 }`. A mask clips the italic accent and the descenders while the words rise, and reverting it at the end makes the text jump.
- **Links:** use plain `<a>` between the site's pages, on purpose. Each page loads fresh, so one page's global CSS and boot never meet another's.
- **404:**
  - `src/app/global-not-found.tsx` handles any URL no route matches (`experimental.globalNotFound`).
  - `src/app/(site)/not-found.tsx` handles a page that calls `notFound()`.
  - Both render `NotFoundA`.

## The homepage (home v7, v8 and v9)

- **Route and owner:** the homepage is home v9: `/` re-exports `/home-v9/page.tsx` (`src/app/(site)/page.tsx`), so changes to v9 show on both. `/home-v7` (earlier) and `/home-v8` (on `/extra`) are the other versions, on the same code. Lawrence owns `src/components/v7`.
- **Home v8 and v9** (`/home-v8`, `/home-v9`; v9 is `/`): Lawrence's branches `NEAR-is-private-CYCLE` and `NEAR-is-privacy-HEADLINE`, on the same `V7Page` with `top="private"` or `top="privacy"`. `top` swaps the hero and the intro for one type-only section (`v7/private`) and turns on those branches' lower page: the signed identity in the rail, Origin above Go deeper, the black-and-white photos, the voices one at a time (`v7/voices`) and the mailboxes. Their styles sit under `html[data-v7="priv"]` in `v7.css`, so `/home-v7` stays as it was.
- **Code:** `src/components/v7` builds the page from pieces of v1–v5:
  - `V1Page` and its boot (world, rail, Stack);
  - v4's rail and Stack;
  - v5's styles;
  - v3's header, footer and proof / Go deeper.
  These folders hold only what the homepage and the pages still use. Before deleting anything in them, check that nothing imports it.
- **Hero film:** `/cms/videos/home/home-hero-g1-timelapse-v2.mp4` (see "Big media").

## Performance (homepage)

The homepage boots a lot of motion; keep its first load light (Lighthouse desktop with CPU ×4 ≈ the production report):
- **Nothing heavy at first paint.** three.js loads on demand (the Stack's lit drawing, a screen and a half before it); the hero film gets its source on the first scroll intent or 5 s after load.
- **No work for what isn't on screen.** rAF loops run only while their section is near the screen (IntersectionObserver), the header's sleeps at rest, icons get their geometry when they come close.
- **Precompute, don't compute at load.** The Stack's outlines come from `scripts/stack-edges.ts` (`npx tsx scripts/stack-edges.ts` after changing `src/components/v7/stack/geometry.ts`).
- **One refresh.** Call `requestRefresh()` (`src/lib/motion/scroll.ts`) instead of `ScrollTrigger.refresh()`; split long boots with `yieldToMain()` (`src/lib/motion/yield.ts`).
- **Measure reads, then writes.** Read every size first and write after; a read after a write forces a layout of the whole page.
- **Images:** give big pictures a smaller version and a `srcset` (the hero still, the Go deeper covers' `-960.webp`).
- **Imports are bundled even when unused.** A component imported as a default or fallback ships to the browser even if it never renders.

## Big media

Large files (films, big images) go to the media bucket, not to the repo.

**Production.** `/cms/<path>` (`src/app/(cms)/cms/[...path]/route.ts`) redirects to a presigned bucket URL. That URL serves byte ranges, so a film can still be scrubbed with the scroll.

**Development.** Put the same file in `public/cms/<path>`; `public/cms/` is gitignored. Ask for the file, or download it from production.

**Uploading.**
- Upload with the S3 client and the service's `BUCKET`, `ENDPOINT`, `REGION`, `ACCESS_KEY_ID` and `SECRET_ACCESS_KEY` from Railway. Never paste these into code or chat.
- Use a new file name for each version (`-v2`, `-v3` …): bucket files are cached as immutable.
- Scrubbed films: H.264, a keyframe every 8 frames, no B-frames, `+faststart`. The G1 film: 1920×1080, CRF 27, `-tune film`, 4.2 MB.

## Develop

```bash
npm install                 # also generates the Prisma client
docker compose up -d        # local Postgres for the CMS on 127.0.0.1:5433 (see docker-compose.yml)
cp .env.example .env        # then fill DATABASE_URL, AUTH_SECRET …
npm run db:migrate
npx next dev -p 3300        # the port the capture script reads by default (npm run dev uses 3000)
```

Checks: `npm run lint`, `npm run typecheck`, `npm test`; `npm run check` runs lint, typecheck and a production build.

Dev notes:
- If a CSS change doesn't show, stop the dev server and delete `.next/dev`; the Tailwind loader caches CSS there.
- A browser extension that adds attributes to `<body>` is ignored (`suppressHydrationWarning` on the site's body).

## Deploy

- Railway builds the `Dockerfile` (`railway.json`) on every push to `main`. Before the new version starts, `npm run db:deploy` runs the CMS migrations.
- `main` is protected by the ruleset `main-solo-owner`: only the repo's owner can update it.
- Everyone else works on a branch and opens a pull request. Lawrence's branch is `Lawrence001`.
- Backups of `main` are kept as branches named `backup-YYYY-MM-DD`.
- **Search engines (launch switch).** Until launch nothing is indexed, on any host: meta robots `noindex` (site layout), the `X-Robots-Tag` header (`next.config.ts`) and `robots.txt` `Disallow: /`. Set `SITE_INDEXABLE=true` and `SITE_ORIGIN=https://near.org` on the launch service (Railway redeploys on a variable change) and the final pages become indexable: meta robots `index`, canonical URLs and Open Graph on `SITE_ORIGIN`, `robots.txt` with the sitemap, and `/sitemap.xml` with the final pages (`index/pages.ts`) and every live public post. The explorations (`/extra`, `/index`, `/post-a…c`, `/analytics-*`, `/community-*`, `/history-*`, `/economics-*`, `/solutions-*`, `/research-*`, `/brand-*`, `/home-v7…v9`), the CMS and the API stay out. Both live in `src/lib/site.ts`. The default share picture is `src/app/(site)/opengraph-image.jpg`.

## Working with Claude

Claude Code reads `CLAUDE.md` (which points here and to `AGENTS.md`). Before changing pages:
- Read "Pages: /index and /extra" above.
- Put new versions in `/extra`. A version reaches `/index` only once it is chosen.
- Capture a picture for every card you add.
- Keep this README's tables up to date.
