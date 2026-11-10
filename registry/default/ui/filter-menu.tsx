"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"

import { cn } from "@/registry/default/lib/utils"

function FilterMenu({
  trigger,
  defaultOpen,
  onOpenChange,
  onCloseAutoFocus,
  align = "start",
  children,
}: {
  trigger: React.ReactNode
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onCloseAutoFocus?: React.ComponentProps<
    typeof DropdownMenuPrimitive.Content
  >["onCloseAutoFocus"]
  align?: React.ComponentProps<typeof DropdownMenuPrimitive.Content>["align"]
  children: React.ReactNode
}) {
  return (
    <DropdownMenuPrimitive.Root
      modal={false}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <DropdownMenuPrimitive.Trigger asChild>
        {trigger}
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          data-slot="filter-menu"
          align={align}
          sideOffset={4}
          onCloseAutoFocus={onCloseAutoFocus}
          className="z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-36 origin-(--radix-dropdown-menu-content-transform-origin) overflow-y-auto rounded-box border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          {children}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
}

function FilterMenuItem({
  isSelected,
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  isSelected?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="filter-menu-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
      {isSelected && <CheckIcon className="absolute right-2" />}
    </DropdownMenuPrimitive.Item>
  )
}

export { FilterMenu, FilterMenuItem }
