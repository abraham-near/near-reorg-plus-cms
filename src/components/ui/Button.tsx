import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import "./ui.css";

// The site's pill (P1 · ink pill, the dot opens; ui.css). One component for every call to action: an <a> when it has href, a <button> otherwise.
//   variant  primary (ink fill) | secondary (outline that fills on hover)
//   size     lg 48 (page CTAs) | md 40 (header, cards) | sm 32 (inline)
//   tone     light (paper) | dark (the dark band); or set data-ui-tone="dark" on a section and leave it out
//   icon     arrow → (default) | ext ↗ (opens elsewhere) | none
//   external opens in a new tab (rel noopener) and defaults the icon to ↗
type Common = {
  children: ReactNode;
  variant?: "primary" | "secondary";
  size?: "lg" | "md" | "sm";
  tone?: "light" | "dark";
  icon?: "arrow" | "ext" | "none";
  full?: boolean;
  className?: string;
};
type AsLink = Common & { href: string; external?: boolean } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className" | "href">;
type AsButton = Common & { href?: undefined; external?: never } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">;
export type ButtonProps = AsLink | AsButton;

export const ArrowIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`ui-arr ${className}`} viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
export const ExtIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`ui-arr ui-ext ${className}`} viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 2h7v7M10 2 2 10" /></svg>
);

// The arrow relay (shared by Button and TextLink): two arrows in a clipped window; on hover the first runs out (right, or up-right for ↗) while the
// second comes in from the opposite side, so the arrow never looks pushed out of its place.
export function Relay({ ext = false }: { ext?: boolean }) {
  const I = ext ? ExtIcon : ArrowIcon;
  return <span className={`ui-swap${ext ? " ui-swap--ext" : ""}`} aria-hidden="true"><I className="ui-a1" /><I className="ui-a2" /></span>;
}

export function btnClass({ variant = "primary", size = "lg", tone, full, className }: Pick<Common, "variant" | "size" | "tone" | "full" | "className">) {
  return ["ui-btn", variant === "secondary" && "ui-btn--sec", size !== "lg" && `ui-btn--${size}`, tone === "dark" && "ui-dark", full && "ui-btn--full", className]
    .filter(Boolean).join(" ");
}

export function Button(props: ButtonProps) {
  const { children, variant, size, tone, icon, full, className, ...rest } = props;
  const cls = btnClass({ variant, size, tone, full, className });
  if (rest.href !== undefined) {
    const { href, external, ...a } = rest as AsLink;
    const ic = icon ?? (external ? "ext" : "arrow");
    return (
      <a className={cls} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...a}>
        <span>{children}</span>{ic === "none" ? null : <Relay ext={ic === "ext"} />}
      </a>
    );
  }
  const { type = "button", ...b } = rest as AsButton;
  const ic = icon ?? "arrow";
  return (
    <button className={cls} type={type} {...b}>
      <span>{children}</span>{ic === "none" ? null : <Relay ext={ic === "ext"} />}
    </button>
  );
}
