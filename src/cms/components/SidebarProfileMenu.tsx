"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "@/cms/lib/client";
import { Settings, LogOut, ExternalLink, ChevronUp, Sparkles } from "lucide-react";
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
    role === "ADMIN" ? "text-primary" : "text-sky-700";

  return (
    <div ref={containerRef} className="relative">
      {/* Dropdown */}
      {open && (
        <div className="cms-pop absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-xl shadow-[0_16px_40px_rgb(15_15_15/.12)] overflow-hidden z-50 [--origin:bottom_left]">
          <div className="py-1">
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
