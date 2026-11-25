"use client"

import * as React from "react"
import { DynamicIcon, type IconName } from "lucide-react/dynamic"

import { isValidIconName } from "@/registry/default/lib/icon-picker-utils"
import { buttonVariants } from "@/registry/default/ui/button"
import { IconPicker } from "@/registry/default/ui/icon-picker"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/default/ui/popover"

export function IconPickerPopoverPreview() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [icon, setIcon] = React.useState("folder-open")

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        aria-label="Choose icon"
        className={buttonVariants({ variant: "outline" })}
      >
        {isValidIconName(icon) && (
          <DynamicIcon name={icon as IconName} className="size-4" />
        )}
        <span>{icon}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <IconPicker
          value={icon}
          onValueChange={(selected) => {
            setIcon(selected)
            setIsOpen(false)
          }}
          aria-label="Choose icon"
        />
      </PopoverContent>
    </Popover>
  )
}
