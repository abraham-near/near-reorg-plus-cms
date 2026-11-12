'use client'

import { DropdownMenu } from 'radix-ui'
import { Check } from 'lucide-react'
import { cn } from '@/cms/lib/utils'

// A small dropdown menu for the posts list (filters, row actions), on Radix for keyboard and focus
// handling. It pops from its trigger with .cms-pop and mounts inside .admin-wrapper so it keeps
// the admin theme.

export const Menu = DropdownMenu.Root
export const MenuTrigger = DropdownMenu.Trigger
export const MenuRadioGroup = DropdownMenu.RadioGroup

export function MenuContent({ className, align = 'end', children, ...props }: React.ComponentProps<typeof DropdownMenu.Content>) {
  const container = typeof document !== 'undefined' ? document.querySelector<HTMLElement>('.admin-wrapper') ?? undefined : undefined
  return (
    <DropdownMenu.Portal container={container}>
      <DropdownMenu.Content
        align={align}
        sideOffset={6}
        collisionPadding={12}
        style={{ '--origin': 'var(--radix-dropdown-menu-content-transform-origin)' } as React.CSSProperties}
        className={cn('cms-pop z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-44 overflow-y-auto rounded-[10px] border bg-popover p-[5px] text-popover-foreground shadow-[0_12px_30px_rgb(15_15_15/0.12)]', className)}
        {...props}
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  )
}

const itemClass = 'flex h-8 cursor-default select-none items-center gap-2 rounded-md px-2 text-[13px] outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground'

export function MenuItem({ className, destructive, ...props }: React.ComponentProps<typeof DropdownMenu.Item> & { destructive?: boolean }) {
  return <DropdownMenu.Item className={cn(itemClass, destructive && 'text-destructive [&_svg]:text-destructive data-[highlighted]:bg-destructive/10', className)} {...props} />
}

export function MenuRadioItem({ className, children, ...props }: React.ComponentProps<typeof DropdownMenu.RadioItem>) {
  return (
    <DropdownMenu.RadioItem className={cn(itemClass, 'relative pr-8', className)} {...props}>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <DropdownMenu.ItemIndicator className="absolute right-2 flex"><Check className="text-primary!" /></DropdownMenu.ItemIndicator>
    </DropdownMenu.RadioItem>
  )
}

export function MenuSeparator() {
  return <DropdownMenu.Separator className="-mx-[5px] my-[5px] h-px bg-border" />
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <DropdownMenu.Label className="px-2 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">{children}</DropdownMenu.Label>
}
