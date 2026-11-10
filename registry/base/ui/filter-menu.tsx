"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { CheckIcon } from "lucide-react"

import { cn } from "@/registry/default/lib/utils"

function FilterMenu({
  trigger,
  defaultOpen,
  onOpenChange,
  onCloseAutoFocus,
  align = "start",
  children,
}: {
  trigger: React.ReactElement
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onCloseAutoFocus?: (event: Event) => void
  align?: MenuPrimitive.Positioner.Props["align"]
  children: React.ReactNode
}) {
  function shouldRestoreFocus() {
    const event = new Event("closeAutoFocus", { cancelable: true })
    onCloseAutoFocus?.(event)
    return !event.defaultPrevented
  }

  return (
    <MenuPrimitive.Root
      modal={false}
      defaultOpen={defaultOpen}
      onOpenChange={(open) => onOpenChange?.(open)}
    >
      <MenuPrimitive.Trigger render={trigger} />
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner
          align={align}
          sideOffset={4}
          className="isolate z-50"
        >
          <MenuPrimitive.Popup
            data-slot="filter-menu"
            finalFocus={shouldRestoreFocus}
            className="z-50 max-h-(--available-height) min-w-36 origin-(--transform-origin) overflow-y-auto rounded-box border bg-popover p-1 text-popover-foreground shadow-md outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95"
          >
            {children}
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  )
}

function FilterMenuItem({
  isSelected,
  onSelect,
  className,
  children,
  ...props
}: MenuPrimitive.Item.Props & {
  isSelected?: boolean
  onSelect?: () => void
}) {
  return (
    <MenuPrimitive.Item
      data-slot="filter-menu-item"
      onClick={onSelect}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
      {isSelected && <CheckIcon className="absolute right-2" />}
    </MenuPrimitive.Item>
  )
}

export { FilterMenu, FilterMenuItem }
