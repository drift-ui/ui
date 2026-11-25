"use client"

import * as React from "react"
import { DynamicIcon, type IconName } from "lucide-react/dynamic"

import { isValidIconName } from "@/registry/default/lib/icon-picker-utils"
import { IconPicker } from "@/registry/default/ui/icon-picker"

export function IconPickerPreview() {
  const [icon, setIcon] = React.useState("folder-open")

  return (
    <div className="flex flex-col items-center gap-3">
      <IconPicker value={icon} onValueChange={setIcon} />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Selected:</span>
        {isValidIconName(icon) && (
          <DynamicIcon
            name={icon as IconName}
            className="size-4 text-foreground"
          />
        )}
        <span className="font-mono text-foreground">{icon}</span>
      </div>
    </div>
  )
}
