"use client"

import * as React from "react"

import type { SnoozePreset } from "@/registry/default/lib/snooze-picker-utils"
import { Label } from "@/registry/default/ui/label"
import { SnoozePicker } from "@/registry/default/ui/snooze-picker"

const customPresets: SnoozePreset[] = [
  {
    id: "in-fifteen-mins",
    label: "In 15 minutes",
    resolve: (now) => new Date(now.getTime() + 15 * 60 * 1000),
  },
  {
    id: "in-two-hours",
    label: "In 2 hours",
    resolve: (now) => new Date(now.getTime() + 2 * 60 * 60 * 1000),
  },
  "tomorrow",
  "this-weekend",
]

export function SnoozePickerCustomPresetsPreview() {
  const [snoozeDate, setSnoozeDate] = React.useState<Date | null>(null)

  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="custom-presets-snooze">Quick deferral</Label>
      <SnoozePicker
        id="custom-presets-snooze"
        presets={customPresets}
        value={snoozeDate}
        onValueChange={setSnoozeDate}
        times={{ morning: "08:30" }}
        placeholder="Pick relative snooze..."
      />
    </div>
  )
}
