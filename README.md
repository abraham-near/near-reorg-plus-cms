# near-reorg-plus-cms

The new near.org: the site's pages and the NEAR CMS (the blog's back office) in one Next.js 16 app. Production deploys from `main` on Railway: https://near-reorg-plus-cms-last-version.up.railway.app

- **`/index`** lists the **final pages**, one card each.
- **`/extra`** lists the **explorations**: the other versions of each page and the ones not chosen.
- The CMS has its own guide: [`src/cms/README.md`](src/cms/README.md). It covers roles, the editor, the Claude connector and the API.

## The site today

| Address | Page | Code |
|---|---|---|
| `/` (and `/home-v7`) | **Homepage**: home v7. G1's time-lapse film is the hero, then the intro, the rail, the Stack in lit matte, proof and Go deeper. | `src/components/v7` (on pieces of v1–v5) |
| `/blog` | **Blog**: direction J. The CMS's posts, a rail with search, type, sort and view, and grid or list. | `src/components/v3/blog/j` |
| `/blog/<slug>` | **Blog post**: layout B (Cover) by default; `?layout=a\|c` shows A or C. `/post-b` is the sample article. | `src/components/v3/post` |
| `/near-foundation` | **NEAR Foundation**: Foundation E (Living columns). | `src/components/foundation/e` |
| `/analytics` | **Analytics**: B (Instrument panel). Sample figures until the live feed lands. | `src/components/analytics/b` |
| `/contact` | **Contact**: a short about, the form (no backend yet) and NEAR's social links. | `src/components/contact` |
| any unknown address | **404**: A, "Lost in the mist". | `src/components/notfound/a` |
| `/index`, `/extra` | The two lists of pages (see below). | `src/app/(site)/index`, `src/app/(site)/extra` |
| `/admin` | The CMS. | `src/cms`, `src/app/(cms)` |

Explorations that still have their own routes are listed at `/extra`:
- the blog post layouts `/post-a`, `/post-b` and `/post-c`;
- Foundation A–F: `/foundation`, `/foundation-b`, `-c`, `-d`, `/near-foundation` (E) and `/foundation-f`;
- Analytics A at `/analytics-a`.

### What changed (November 2026)

- **Homepage:** home v7 is the first page. Homes v1–v6 were removed, with the code and assets only they used. `/home-v1`…`/home-v6` redirect to `/`.
- **Removed pages:**
  - the blog directions A–L (J is `/blog`);
  - the 404 previews and designs B and C;
  - `/template`;
  - Analytics C.
- **Moved pages:**
  - Foundation E moved to `/near-foundation`.
  - Analytics B is `/analytics`, and A moved to `/analytics-a`.
  - Old addresses redirect: see `redirects()` in `next.config.ts`.
- **Header:** every page uses the homepage's header. At the top of the page it is spread out (the wordmark, the menus and Get started sit at the margins). On the first scroll it gathers into the pill, and it stays on screen. Opening a menu at the top no longer gathers it. Menu links: Blog → `/blog`, NEAR Foundation → `/near-foundation`, Analytics → `/analytics`, Contact → `/contact`.
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
2. **Switch (optional):** if the page has versions, add a switch to move between them. Copy `FoundationSwitch` or `AnalyticsSwitch`; they sit under the header, at the top left.
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
- **Motion:**
  - Use `useScrollMotion` (`src/lib/motion/scroll.ts`) for GSAP and ScrollTrigger, and respect reduced motion.
  - A heading that rises word by word with SplitText masks must revert the split when the rise ends (`onComplete: () => split.revert()`). Give the masks room (padding with an equal negative margin), or they clip the italic accent.
- **Links:** use plain `<a>` between the site's pages, on purpose. Each page loads fresh, so one page's global CSS and boot never meet another's.
- **404:**
  - `src/app/global-not-found.tsx` handles any URL no route matches (`experimental.globalNotFound`).
  - `src/app/(site)/not-found.tsx` handles a page that calls `notFound()`.
  - Both render `NotFoundA`.

## The homepage (home v7)

- **Route and owner:** `/home-v7/page.tsx` is the page, and `/` re-exports it (`src/app/(site)/page.tsx`), so changes to v7 show on both. Lawrence works on v7 on his branch, `Lawrence001`.
- **Code:** `src/components/v7` builds the page from pieces of v1–v5:
  - `V1Page` and its boot (world, rail, Stack);
  - v4's rail and Stack;
  - v5's styles;
  - v3's header, footer and proof / Go deeper.
  These folders hold only what the homepage and the pages still use. Before deleting anything in them, check that nothing imports it.
- **Hero film:** `/cms/videos/home/home-hero-g1-timelapse-v2.mp4` (see "Big media").

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

## Working with Claude

Claude Code reads `CLAUDE.md` (which points here and to `AGENTS.md`). Before changing pages:
- Read "Pages: /index and /extra" above.
- Put new versions in `/extra`. A version reaches `/index` only once it is chosen.
- Capture a picture for every card you add.
- Keep this README's tables up to date.
