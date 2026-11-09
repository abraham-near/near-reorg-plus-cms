// The "goes somewhere" glyph for the two main "Get started" buttons only (D28, after Stripe; DESIGN §6 still bans an
// arrow on every link). A chevron at rest; on hover the chevron steps right as a shaft fades in behind it, so › becomes
// →. Styled in globals.css (.btn-go: transform and opacity only).
export function GoArrow() {
  return (
    <svg className="btn-go" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false">
      <path className="btn-go-shaft" d="M2.5 6h8" />
      <path className="btn-go-head" d="M5 2.5 8.5 6 5 9.5" />
    </svg>
  );
}
