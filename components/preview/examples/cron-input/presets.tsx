"use client"

import * as React from "react"

import { CronInput } from "@/registry/default/ui/cron-input"
import { Label } from "@/registry/default/ui/label"

const PRESETS = [
  { label: "Every 5m", value: "*/5 * * * *" },
  { label: "Hourly", value: "0 * * * *" },
  { label: "Daily at 00:00", value: "0 0 * * *" },
  { label: "Weekdays at 09:00", value: "0 9 * * 1-5" },
]

export function CronInputPresetsPreview() {
  const [schedule, setSchedule] = React.useState("0 0 * * *")

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="presets-cron">Database backup</Label>
        <CronInput
          value={schedule}
          onValueChange={setSchedule}
          inputProps={{ id: "presets-cron", "aria-label": "Database backup" }}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setSchedule(p.value)}
            className="cursor-pointer rounded-control border border-input bg-transparent px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
