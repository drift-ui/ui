"use client"

import * as React from "react"
import { DynamicIcon, type IconName } from "lucide-react/dynamic"

import {
  isValidIconName,
  type IconItem,
} from "@/registry/default/lib/icon-picker-utils"
import { IconPicker } from "@/registry/default/ui/icon-picker"

const PROJECT_ICONS: IconItem[] = [
  { name: "folder", tags: ["directory", "project"] },
  { name: "folder-open", tags: ["directory", "active"] },
  { name: "file-text", tags: ["document", "notes"] },
  { name: "star", tags: ["favorite", "priority"] },
  { name: "bookmark", tags: ["saved", "flag"] },
  { name: "tag", tags: ["label", "category"] },
  { name: "flag", tags: ["milestone", "report"] },
  { name: "heart", tags: ["love", "like"] },
  { name: "smile", tags: ["happy", "mood"] },
  { name: "sparkles", tags: ["magic", "ai", "feature"] },
  { name: "zap", tags: ["fast", "energy", "action"] },
  { name: "shield", tags: ["security", "protect"] },
]

export function IconPickerCustomIconsPreview() {
  const [icon, setIcon] = React.useState("folder")

  return (
    <div className="flex flex-col items-center gap-3">
      <IconPicker
        icons={PROJECT_ICONS}
        value={icon}
        onValueChange={setIcon}
        columns={4}
        className="h-80 w-64"
        aria-label="Project icon"
      />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Project icon:</span>
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
