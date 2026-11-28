import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Relay } from "./Button";
import "./ui.css";

// The site's text link (L3 · arrow relay; ui.css): label + arrow, no box. Hover: the arrow runs out right while a new one comes in from the left, the
// rule enters from the left and leaves to the right. It takes the colour of where it sits (currentColor); tone="dark" or data-ui-tone="dark" on an
// ancestor gives it the dark band's paper.
//   icon      arrow → (default) | ext ↗ (default when external) | none
//   inline    sits in running text, wraps, inherits the text's size; the arrow rides the last line
//   size      "inherit" keeps the parent's font size (headline-sized links); default 15 px
type Common = { children: ReactNode; icon?: "arrow" | "ext" | "none"; inline?: boolean; size?: "inherit"; tone?: "light" | "dark"; className?: string };
type AsLink = Common & { href: string; external?: boolean } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className" | "href">;
type AsButton = Common & { href?: undefined; external?: never } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">;
export type TextLinkProps = AsLink | AsButton;


export function TextLink(props: TextLinkProps) {
  const { children, icon, inline, size, tone, className, ...rest } = props;
  const cls = ["ui-link", inline && "ui-link--inline", size === "inherit" && "ui-link--size-inherit", tone === "dark" && "ui-link--dark ui-dark", className].filter(Boolean).join(" ");
  const external = rest.href !== undefined && (rest as AsLink).external;
  const ic = icon ?? (external ? "ext" : "arrow");
  // inline: a word joiner keeps the arrow on the last word's line (it never wraps alone)
  const inner = <><span className="ui-link__t">{children}</span>{ic !== "none" && <>{inline && "\u2060"}<Relay ext={ic === "ext"} /></>}</>;
  if (rest.href !== undefined) {
    const { href, external: ex, ...a } = rest as AsLink;
    return <a className={cls} href={href} {...(ex ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...a}>{inner}</a>;
  }
  const { type = "button", ...b } = rest as AsButton;
  return <button className={cls} type={type} {...b}>{inner}</button>;
}
