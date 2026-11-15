"use client"

import * as React from "react"

import {
  WeeklyHours,
  type WeeklyHoursRange,
} from "@/registry/default/ui/weekly-hours"

export function WeeklyHoursWorkweekPreview() {
  const [hours, setHours] = React.useState<WeeklyHoursRange[]>([
    { day: "MO", start: "10:00", end: "16:00" },
    { day: "WE", start: "10:00", end: "16:00" },
  ])

  return (
    <div className="grid w-full max-w-xl gap-3">
      <WeeklyHours
        aria-label="Support rota"
        weekdays={["MO", "TU", "WE", "TH", "FR"]}
        value={hours}
        onValueChange={setHours}
      />
      <p className="font-mono text-xs text-muted-foreground">
        {hours
          .map((range) => `${range.day} ${range.start}–${range.end}`)
          .join(", ") || "No hours set"}
      </p>
    </div>
  )
}
