"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "@/cms/lib/client";
import { Settings, LogOut, ExternalLink, ChevronUp, Sparkles, Check } from "lucide-react";
import { useTheme, type ThemeChoice } from "@/cms/components/ThemeProvider";
import { LogoutConfirmationModal } from "@/cms/components/LogoutConfirmationModal";
import { SidebarTooltip } from "@/cms/components/SidebarTooltip";

interface SidebarProfileMenuProps {
  userName: string;
  userEmail?: string;
  role: string;
  collapsed?: boolean;
  /** Shows "Connect to Claude" (people who can create API tokens). */
  canConnectClaude?: boolean;
}

export function SidebarProfileMenu({ userName, role, collapsed = false, canConnectClaude = false }: SidebarProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const { choice, setChoice } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const initials = userName
    ? userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const roleBadgeColor =
    role === "ADMIN" ? "text-primary" : "text-sky-700 dark:text-sky-300";

  return (
    <div ref={containerRef} className="relative">
      {/* Dropdown */}
      {open && (
        <div className={`cms-pop absolute bottom-full left-0 mb-2 w-[272px] bg-popover border border-border rounded-xl shadow-[0_16px_40px_rgb(var(--shadow)/.12)] overflow-hidden z-50 [--origin:bottom_left]`}>
          <ThemePicker choice={choice} onChange={setChoice} />
          <div className="border-t border-border py-1">
            <Link
              href="/admin/settings"
              data-tour-id="settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50 transition"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
              Settings
            </Link>
            {canConnectClaude && (
              <Link
                href="/admin/settings?tab=claude"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50 transition"
              >
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                Connect to Claude
              </Link>
            )}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50 transition"
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
              View site
            </a>
            <div className="my-1 border-t border-border" />
            <button
              onClick={() => setLogoutConfirmOpen(true)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Collapsed: avatar only */}
      {collapsed ? (
        <SidebarTooltip label={<><span className="font-medium">{userName}</span><br /><span className="opacity-60 text-[10px]">{role}</span></>} collapsed>
          <button
            onClick={() => setOpen((v) => !v)}
            className={`w-full flex justify-center p-1.5 rounded-xl border transition ${
              open ? "bg-muted border-border" : "border-transparent hover:bg-muted/50 hover:border-border"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
          </button>
        </SidebarTooltip>
      ) : (
        /* Expanded: full card */
        <button
          onClick={() => setOpen((v) => !v)}
          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition ${
            open ? "bg-muted border-border" : "border-transparent hover:bg-muted/50 hover:border-border"
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium truncate leading-tight">{userName || "User"}</p>
            <p className={`text-xs leading-tight ${roleBadgeColor}`}>{role}</p>
          </div>
          <ChevronUp
            className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "" : "rotate-180"}`}
          />
        </button>
      )}

      <LogoutConfirmationModal
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        onConfirm={() => signOut()}
      />
    </div>
  );
}

/** Tiny window previews in each theme's colours (fixed on purpose: they show the theme, not the current one). */
const PREVIEWS: Record<ThemeChoice, { label: string; bg: string; side: string; bar: string; text: string }> = {
  light: { label: "Light", bg: "#ffffff", side: "#f4f4f2", bar: "#e6e6e2", text: "#c9c9c4" },
  dark: { label: "Dark", bg: "#1d1d1c", side: "#151514", bar: "#363532", text: "#4b4a46" },
  system: { label: "System", bg: "", side: "", bar: "", text: "" },
};

function WindowPreview({ theme }: { theme: "light" | "dark" }) {
  const c = PREVIEWS[theme];
  return (
    <span className="absolute inset-0 flex" style={{ background: c.bg }}>
      <span className="flex w-[30%] flex-col gap-[3px] p-[5px]" style={{ background: c.side }}>
        <span className="h-[3px] w-3/4 rounded-full" style={{ background: c.text }} />
        <span className="h-[3px] w-full rounded-full" style={{ background: c.bar }} />
        <span className="h-[3px] w-2/3 rounded-full" style={{ background: c.bar }} />
      </span>
      <span className="flex flex-1 flex-col gap-[3px] p-[6px]">
        <span className="h-[4px] w-1/2 rounded-full" style={{ background: c.text }} />
        <span className="h-[3px] w-full rounded-full" style={{ background: c.bar }} />
        <span className="h-[3px] w-4/5 rounded-full" style={{ background: c.bar }} />
        <span className="mt-auto h-[6px] w-[38%] self-end rounded-[2px] bg-[#3ecf98]" />
      </span>
    </span>
  );
}

function ThemePicker({ choice, onChange }: { choice: ThemeChoice; onChange: (choice: ThemeChoice) => void }) {
  const options: ThemeChoice[] = ["light", "dark", "system"];
  return (
    <div className="px-3 pt-3 pb-3">
      <p id="theme-label" className="mb-2 text-[11px] font-semibold tracking-[.05em] text-muted-foreground">APPEARANCE</p>
      <div
        role="radiogroup"
        aria-labelledby="theme-label"
        className="grid grid-cols-3 gap-2"
        onKeyDown={(event) => {
          const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
          if (!step) return;
          event.preventDefault();
          const next = options[(options.indexOf(choice) + step + options.length) % options.length];
          onChange(next);
          event.currentTarget.querySelector<HTMLButtonElement>(`[data-theme-option="${next}"]`)?.focus();
        }}
      >
        {options.map((option) => {
          const active = choice === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              data-theme-option={option}
              onClick={() => onChange(option)}
              className="group flex flex-col items-center gap-1.5 rounded-lg outline-none"
            >
              <span
                className={`relative block aspect-[4/3] w-full overflow-hidden rounded-lg transition-shadow duration-[var(--dur-fast)] ${
                  active
                    ? "shadow-[0_0_0_2px_var(--popover),0_0_0_4px_var(--primary)]"
                    : "shadow-[0_0_0_1px_var(--border)] group-hover:shadow-[0_0_0_1px_var(--border-strong)] group-focus-visible:shadow-[0_0_0_2px_var(--popover),0_0_0_4px_var(--ring)]"
                }`}
              >
                {option === "system" ? (
                  <>
                    <WindowPreview theme="light" />
                    <span className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)]"><WindowPreview theme="dark" /></span>
                  </>
                ) : (
                  <WindowPreview theme={option} />
                )}
                {active && (
                  <span className="cms-pop absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground [--origin:center]">
                    <Check className="size-2.5" strokeWidth={3.5} />
                  </span>
                )}
              </span>
              <span className={`text-xs ${active ? "font-semibold text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>{PREVIEWS[option].label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
