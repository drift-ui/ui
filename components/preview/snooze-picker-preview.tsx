"use client"

import * as React from "react"

import { Label } from "@/registry/default/ui/label"
import { SnoozePicker } from "@/registry/default/ui/snooze-picker"

export function SnoozePickerPreview() {
  const [snoozeDate, setSnoozeDate] = React.useState<Date | null>(null)

  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="preview-snooze">Snooze notification</Label>
      <SnoozePicker
        id="preview-snooze"
        value={snoozeDate}
        onValueChange={setSnoozeDate}
        placeholder="Pick when to snooze…"
      />
    </div>
  )
}
