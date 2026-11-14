"use client"

import * as React from "react"

import { CronInput } from "@/registry/default/ui/cron-input"
import { Label } from "@/registry/default/ui/label"

const PRESETS = [
  { label: "Every 15 minutes", value: "*/15 * * * *" },
  { label: "Hourly", value: "0 * * * *" },
  { label: "Weekdays at 9am", value: "0 9 * * 1-5" },
  { label: "Midnight daily", value: "0 0 * * *" },
  { label: "Weekly (Sunday)", value: "0 0 * * 0" },
]

export function CronInputPreview() {
  const [cron, setCron] = React.useState("0 9 * * 1-5")

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Label htmlFor="preview-cron">Job schedule</Label>
      <CronInput
        value={cron}
        onValueChange={setCron}
        inputProps={{ id: "preview-cron", "aria-label": "Job schedule" }}
      />
      <div className="flex flex-wrap gap-1.5 pt-1">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => setCron(preset.value)}
            className="cursor-pointer rounded-control border border-input bg-transparent px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}
