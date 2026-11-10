"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  children,
  side = "right",
  sideOffset = 8,
  className = "",
}: {
  children: React.ReactNode;
  side?: "right" | "left" | "top" | "bottom";
  sideOffset?: number;
  className?: string;
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        side={side}
        sideOffset={sideOffset}
        className={`z-50 overflow-hidden rounded-md bg-popover border border-border px-2.5 py-1.5 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 ${className}`}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
