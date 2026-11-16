@AGENTS.md

# near-reorg-plus-cms: notes for Claude

Read `README.md` first. It lists the site's final pages and their addresses, and how a new page or version is added. The CMS has its own guide in `src/cms/README.md`.

- **Final pages vs explorations:**
  - `/index` (`src/app/(site)/index/pages.ts`) lists the final pages only.
  - New versions and explorations go to `/extra` (`src/app/(site)/extra/pages.ts`) under their own route, for example `/contact-b`.
  - Don't replace a final page until the user chooses the new version. Then follow "When a version is chosen" in the README: the final address, a redirect from the old one, the `/index` card and its picture.
- **Cards:** every card needs a 1200×750 picture. With the dev server on port 3300, run `npm run capture -- <path> public/index/<id>.webp` (or `public/extra/<name>.webp`).
- **Shell and type:**
  - Pages use `BlogShell` (the homepage's spread header and the footer).
  - Headings get Montreal Book and the Kepler Condensed accent from `src/app/globals.css`; use the font variables, never literal family names.
- **Boundaries:**
  - The site (`src/app/(site)`, `src/components`) and the CMS (`src/app/(cms)`, `src/cms`) don't import each other. Lint enforces this.
  - Home v7 (`src/components/v7`) is Lawrence's; coordinate before changing it.
- **Media:** big media goes to the bucket and is served from `/cms/...`; never commit large videos. Never print or commit secrets (`.env`, Railway variables, tokens).
- **Before handing back:** `npm run lint`, `npm run typecheck` (or `npx tsc --noEmit`), `npm test`. Commit only when asked. `main` deploys to production on push.
