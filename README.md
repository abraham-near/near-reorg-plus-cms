# near-reorg-plus-cms

The NEAR homepage, one Next.js page made from two sources:

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

One token set (`src/styles/tokens.css`): Abraham's palette, under Lawrence's token names, so both halves read it.

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
