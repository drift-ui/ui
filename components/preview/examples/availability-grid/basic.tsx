"use client"

import * as React from "react"

import type { AvailabilityRange } from "@/registry/default/lib/availability-grid-utils"
import { AvailabilityGrid } from "@/registry/default/ui/availability-grid"

export function AvailabilityGridBasicPreview() {
  const [value, setValue] = React.useState<AvailabilityRange[]>([
    { day: "MO", start: "09:00", end: "17:00" },
    { day: "TU", start: "09:00", end: "17:00" },
    { day: "WE", start: "09:00", end: "17:00" },
    { day: "TH", start: "09:00", end: "17:00" },
    { day: "FR", start: "09:00", end: "17:00" },
  ])

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <AvailabilityGrid
        value={value}
        onValueChange={setValue}
        startHour={8}
        endHour={18}
        slotMinutes={60}
      />
    </div>
  )
}
