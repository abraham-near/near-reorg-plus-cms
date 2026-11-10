"use client";

import { ReactNode } from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/cms/components/ui/tooltip";

export function SidebarTooltip({
  label,
  children,
  collapsed,
}: {
  label: ReactNode;
  children: ReactNode;
  collapsed: boolean;
}) {
  if (!collapsed) return <>{children}</>;

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
