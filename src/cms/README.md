# NEAR CMS (core)

The blog CMS: people with two roles, a Notion-like post editor, scheduling, search and social metadata, a media library, a dashboard, and an MCP server so Claude can draft and publish through a personal API token.

Ported from `near/near-org-website-primary` (commit `5133bfd`) and trimmed to the core. Banners, linktrees, forms, pages, redirects, downloads, preview links and the Claude Desktop extension were left out on purpose; they can be brought back later.

## Where it lives

| Path | What |
|---|---|
| `src/cms/lib` | Server logic: auth, sessions, permissions, posts, media, audit log, rate limits, sanitizing |
| `src/cms/components` | Admin UI (shadcn-style `ui/`, editor, media, posts, users) |
| `src/cms/mcp` | MCP server (stdio) for Claude Code; an HTTP client of `/api/admin/*` |
| `src/app/(cms)` | Routes: its own root layout, `/admin/*` pages, `/api/admin/*` handlers, `/cms/*` media |
| `src/proxy.ts` | Early sign-in check and no-store headers for `/admin` and `/api/admin` only |
| `prisma/schema.prisma` | The database, shared with the site; client generated into `src/generated/prisma` |

## The boundary with the site

The site (`src/app/(site)`, `src/components`, `src/lib`, `src/styles`) and the CMS share only the npm project and the database. Neither imports the other (ESLint `no-restricted-imports` in `eslint.config.mjs`), they have separate root layouts and stylesheets, and they do not call each other over HTTP.

A future public blog reads posts straight from the database with `src/generated/prisma`. The contract:

- A post is **live** when `status = 'PUBLISHED'` and `publishedAt <= now()`. A published post with a future `publishedAt` is **scheduled** and goes live on its own; nothing runs at that moment.
- `visibility = 'PUBLIC'` posts are listed and indexed; `UNLISTED` ones are reachable by URL only (noindex).
- `body` is sanitized HTML. Title fallbacks for sharing: `metaTitle` → `title`; description: `metaDescription` → `excerpt`; image: `metaImage` → `featuredImage`.
- Cached reads should use the tags `cms:posts`, `cms:post:<slug>` and `cms:categories`; the CMS expires them on every write (`src/cms/lib/cache-tags.ts`).

## Roles

- **Publisher**: write, schedule, publish and delete posts; upload and describe media; categories and tags; their own API tokens.
- **Admin**: everything, plus people, deleting media and taking over another editor's lock.

Permissions live in one place, `src/cms/lib/permissions.ts`. API tokens are capped further (`TOKEN_CAP`): no deletes, no people, no lock takeover, and a published post keeps its URL and visibility.

## Local setup

```bash
docker compose up -d            # Postgres 18 on 127.0.0.1:5433
cp .env.example .env            # set AUTH_SECRET
npm install                     # also runs prisma generate
npm run db:migrate
npm run cms:create-user -- --email you@near.org --name "You" --role ADMIN
npm run dev                     # http://localhost:3000/admin
```

Accounts created from the command line can sign in right away. Without `RESEND_API_KEY`, emails (invitations, password resets) are only logged.

## Claude (MCP)

1. In the CMS: Settings › Claude › create a token.
2. `npm run mcp:cms:login` stores it (macOS Keychain, or `~/.config/near-cms` elsewhere).
3. Start Claude Code in this repository and approve the `near-cms` server (`.mcp.json`).

Claude can draft, edit, schedule and publish posts, upload images and import Word documents from the upload folder (`NEAR_CMS_UPLOAD_DIR`). It always asks before publishing or changing a live post, and it cannot delete anything.

## Checks

```bash
npm run typecheck && npm run lint && npm test && npm run build
TEST_DATABASE_URL=postgresql://cms:cms@localhost:5433/near_cms_migrate_test npm test   # with the database suites
```
