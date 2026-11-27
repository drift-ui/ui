"use client"

import * as React from "react"

import {
  WeeklyHours,
  type WeeklyHoursRange,
} from "@/registry/default/ui/weekly-hours"

export function WeeklyHoursPreview() {
  const [hours, setHours] = React.useState<WeeklyHoursRange[]>([
    { day: "MO", start: "09:00", end: "17:00" },
    { day: "TU", start: "09:00", end: "12:00" },
    { day: "TU", start: "14:00", end: "18:00" },
    { day: "WE", start: "09:00", end: "17:00" },
    { day: "TH", start: "09:00", end: "17:00" },
    { day: "FR", start: "09:00", end: "15:00" },
  ])

  return (
    <div className="w-full max-w-xl">
      <div className="space-y-1 pb-2">
        <h3 className="text-sm font-semibold">When can students book you?</h3>
        <p className="text-xs text-muted-foreground">
          Lessons are only offered inside these hours.
        </p>
      </div>
      <WeeklyHours
        value={hours}
        onValueChange={setHours}
        aria-label="Bookable hours"
      />
    </div>
  )
}
