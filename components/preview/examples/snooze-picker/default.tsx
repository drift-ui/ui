"use client"

import * as React from "react"

import { Label } from "@/registry/default/ui/label"
import { SnoozePicker } from "@/registry/default/ui/snooze-picker"

export function SnoozePickerDefaultPreview() {
  const [snoozeDate, setSnoozeDate] = React.useState<Date | null>(null)

  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="default-snooze">Remind me</Label>
      <SnoozePicker
        id="default-snooze"
        value={snoozeDate}
        onValueChange={setSnoozeDate}
      />
    </div>
  )
}
