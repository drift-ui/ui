"use client"

import * as React from "react"

import type { AvailabilityRange } from "@/registry/default/lib/availability-grid-utils"
import { AvailabilityGrid } from "@/registry/default/ui/availability-grid"

export function AvailabilityGridTimezonePreview() {
  const [timeZone, setTimeZone] = React.useState("UTC")
  const [value, setValue] = React.useState<AvailabilityRange[]>([
    { day: "MO", start: "16:00", end: "22:00" },
    { day: "WE", start: "16:00", end: "22:00" },
    { day: "FR", start: "16:00", end: "22:00" },
  ])

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <div className="flex items-center gap-2">
        <label
          htmlFor="example-timezone-select"
          className="text-xs font-medium"
        >
          Select Time Zone:
        </label>
        <select
          id="example-timezone-select"
          aria-label="Select Time Zone"
          value={timeZone}
          onChange={(e) => setTimeZone(e.target.value)}
          className="rounded-md border bg-background px-2 py-1 text-xs shadow-xs outline-hidden"
        >
          <option value="UTC">UTC (GMT+0)</option>
          <option value="Europe/Berlin">Europe/Berlin (GMT+1)</option>
          <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
          <option value="America/New_York">America/New_York (GMT-5)</option>
        </select>
      </div>

      <AvailabilityGrid
        value={value}
        onValueChange={setValue}
        timeZone={timeZone}
        startHour={0}
        endHour={24}
        slotMinutes={60}
      />
    </div>
  )
}
