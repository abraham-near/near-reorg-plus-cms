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

## Deploying

- Run behind a proxy that sets `X-Real-IP` / `X-Forwarded-For` (Railway, Vercel). Per-IP sign-in limits trust those headers; exposed directly, a client could spoof them (per-account limits still apply).
- Set `CMS_ORIGIN` to the public address: emails link to it, Claude is told to use it, and same-origin checks accept it.
- Run `npm run db:deploy` on release. Secure cookies (`__Host-`) are used in production.

## Writing a post: story mode

Besides the text, a post can carry the parts the public layouts draw:
- **Layout** (properties): Cover (the default), Ruled or Notebook. `?layout=a|b|c` on the public URL still switches for a look.
- **Takeaways** (properties): up to three one-line key points; every layout shows them.
- **Format** (properties): Article, or **Video**. A video post (`Post.video`) plays its video at the top of the public page in the video layout (`/post-v`, `src/components/v3/post/v/PostV.tsx`), shows as **Watch** with a play mark in the blog index, and its text is optional. A post that becomes a video post goes in the **Watch** category, first (the editor picks it when Format turns to Video, and the server on save; the person can change it later; migration `watch_category` makes the category). The video is an MP4/WebM uploaded from the Video field (up to 100 MB, sent in parts: see Media uploads) or a YouTube/Vimeo link (stored as the privacy-mode player URL, `src/cms/lib/posts/video.ts`). The cover is the video's poster and the index picture. A media file used as a video can only be replaced by another MP4/WebM.
- **Blocks** (type `/`): Pull quote (a last line "— Name, role"), Callout (the first line is the title), Figures (2–4 numbers on an ink band, with a source note), Image pair, and an image's width (Column / Wide / Full bleed, on the selected image).
- **Footnotes**: type `/footnote` after a word, or select words and press the footnote button (✱) in the toolbar. A green number marks it; click it to edit or remove the note. The site numbers the notes in order and lists them at the end of the post (`src/lib/blog/html.ts`); the admin preview lists them too. Stored as `<sup data-type="footnote" data-footnote="…"></sup>`.

## Media uploads
- Files are typed by their bytes, never by name (`src/cms/lib/media.ts` `sniff`), stored in the bucket (or `public/cms` locally without one) and served from `/cms/<key>`. Photos become a WebP of at most 2000 px, with the original kept.
- **One request** (`POST /api/admin/media`): images and documents. A request passes `src/proxy.ts`, and Next hands a route at most 10 MB of a body behind a proxy, cut off silently, so videos in one request stop at 9 MB.
- **Videos, in parts** (`src/cms/lib/chunked-upload.ts`, `/api/admin/media/uploads`): MP4, WebM and MOV up to 100 MB go up in 6 MiB parts, one request each, so no body passes the proxy's limit and no request nears Railway's 5 minutes for a body. With a bucket the parts are an S3 multipart upload: nothing exists in the bucket until it is complete, and part 1 is checked by its bytes before it is stored. A failed part is sent again on its own; cancelling or leaving the page aborts the upload, and uploads left unfinished for a day are aborted in the background. Signed-in people only: Claude uploads images only. No change outside the repo (no CORS, no new variables).
- **Video posters and length** (`Media.posterUrl`, `Media.duration`): while a video goes up, the browser reads its size and length and takes a frame about a second in (`src/cms/components/media/video-poster.ts`); after complete the frame is sent to `PUT /api/admin/media/uploads/poster`, re-encoded to WebP like an imported image, and stored as an image of the library (`<name> poster.webp`). Tiles show the poster and the length; a video without one (uploaded before, or one the browser could not decode) shows a frame of itself, loaded once its tile is on screen. The detail panel can choose or remove a poster; deleting the image removes it from the video. Choosing a video for a post without a cover makes its poster the cover.
- Video keys are random (`cms/<32 hex>.<ext>`): the hash of a file sent in parts is not known up front, so the same video uploaded twice is stored twice.

## Claude

### Connector: Claude Desktop, Cowork and claude.ai

The CMS is a remote MCP server at `<CMS_ORIGIN>/api/mcp` with its own OAuth sign-in (`src/cms/lib/oauth`, `src/app/(cms)/api/oauth`, `src/app/(cms)/.well-known`). Turn it on with `CMS_MCP_ENABLED=true`.

- **Connecting.** People add the URL in Claude (Settings › Connectors › Add custom connector; on Team and Enterprise an Owner adds it once for everyone), click Connect, sign in to the CMS and allow it. The exact URL is in Settings › Claude, which also lists each person's connections with a Disconnect button.
- **What Claude can do.** The local MCP's tools, minus the file ones, limited by what the person allowed (read, write drafts, add images, publish) and by `TOKEN_CAP`. Never deletes, never manages people.
- **Publishing.** Publishing tools are marked destructive, so Claude asks before each call. They also take the title and `updatedAt` of the version the person reviewed: a post changed after the review is refused. At most 10 publish/schedule/unpublish actions an hour per connection. The owner gets an email for each one. Owners should set the publish tools to "Needs approval" in Claude.
- **Story mode.** `create_draft`, `update_post` and `update_live_post` also take `layout` (`"a"` Ruled, `"b"` Cover, `"c"` Notebook, `null` = Cover), `takeaways` (up to three lines) and `video` (a YouTube/Vimeo link or an uploaded MP4/WebM's `/cms/…` URL from `list_media` with `type: "video"`; `null` clears it); `get_post` returns them. Claude cannot upload videos. The guide (`src/cms/mcp/guide.ts`, "Story mode") tells Claude how to write the story blocks and footnotes in the body's HTML.
- **Images** come in only through Google Docs: `import_google_doc` makes a new draft with the Doc's text and images. Images attached in a chat never reach MCP tools (a Claude limitation).
- **Security model.**
  - Authorization code with PKCE S256 only, for public clients.
  - Clients are identified by metadata documents fetched only from `CMS_OAUTH_CLIENT_HOSTS`.
  - Redirects must match exactly: Claude's callback, or loopback for Claude Code.
  - Tokens are opaque, stored hashed and bound to the exact `/api/mcp` URL. Access tokens last 1 h; refresh tokens rotate, with reuse detection; a connection lasts 90 days at most.
  - Connections are revoked with password resets, role changes and deactivation.
  - `/api/mcp` serves only the `CMS_ORIGIN` host, refuses other web origins, and calls the `/api/admin` handlers in process: same checks and audit, and the token never reaches them.
- **Deploying it.** `CMS_ORIGIN` must be the exact public https address, with no redirects in front of `/api/mcp`; connectors are IPv4 only. Try the sign-in with MCP Inspector, with `CMS_OAUTH_DCR_ENABLED=true` on staging only.

### Google Doc import

`POST /api/admin/import/google-doc` (and the MCP tool `import_google_doc`) takes a Doc link, keeps only its id, and downloads it as .docx:

1. **Shared with the service account.** Through the Drive API, read-only, if the person shared the Doc with the service account email (`GOOGLE_SERVICE_ACCOUNT_JSON`). The Doc stays private.
2. **Public by link.** Otherwise through Google's public export, if the Doc is "Anyone with the link" (undocumented; `CMS_GOOGLE_PUBLIC_EXPORT=false` turns it off).

Setup:
1. Create a Google Cloud project, enable the Drive API and create a service account with a JSON key.
2. Set `GOOGLE_SERVICE_ACCOUNT_JSON` to the key, base64-encoded.
3. If the Workspace restricts sharing outside the organization, allow the service account's address.

The service account can read every Doc shared with it, so it is never a shortcut to someone else's Doc. The person importing must be able to open it in Google themselves: as owner, shared with their CMS email, or shared with their domain or "anyone with the link". Group shares cannot be checked. The audit log records the Doc id of each import.

The real safeguards for publishing are:
- the `cms:publish` scope (untick it when connecting to keep Claude to drafts);
- Claude's own approval prompt (set the publish tools to "Needs approval");
- the hourly limit and the email to the owner.

The title and version check in the publish tools stops stale or mistaken publishes, but a model can supply those values itself.

Fetches go through `safeFetch` (`src/cms/lib/safe-fetch.ts`): allowlisted https hosts only, resolved addresses checked against private and metadata ranges, no automatic redirects, size and time caps.

The document is untrusted:
- text a reader would not see is dropped;
- images are re-encoded to WebP with no metadata, and SVG and other formats are skipped;
- text that reads like instructions for an AI is reported;
- the result is always a draft.

### Claude Code

Either the connector (`claude mcp add --transport http near-cms <CMS_ORIGIN>/api/mcp`) or, from this repository, a personal token:

1. In the CMS: Settings › Claude › create a token.
2. `npm run mcp:cms:login` stores it (macOS Keychain, or `~/.config/near-cms` elsewhere).
3. Start Claude Code in this repository and approve the `near-cms` server (`.mcp.json`).

The local server can also upload images and import Word documents from the upload folder (`NEAR_CMS_UPLOAD_DIR`).

## Checks

```bash
npm run typecheck && npm run lint && npm test && npm run build
TEST_DATABASE_URL=postgresql://cms:cms@localhost:5433/near_cms_migrate_test npm test   # with the database suites
```
