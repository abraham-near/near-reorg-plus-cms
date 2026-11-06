// Runs a tiny script during HTML parsing, before first paint (Next guide: "Preventing flash before hydration").
// The server emits a runnable script; the client renders it inert, and suppressHydrationWarning accepts the difference.
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
