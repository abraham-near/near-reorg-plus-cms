"use client";

// InlineScript as a client component (Next guide, "Preventing flash before hydration": extracting a reusable
// component): server-rendered it runs while the HTML is parsed; rendered on the client (hydration, or a client-side
// navigation into /home) it is inert text/plain, so React never renders a live <script>. RandomHero picks then.
export function PosterScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
