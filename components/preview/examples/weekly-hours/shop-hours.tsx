"use client"

import { WeeklyHours } from "@/registry/default/ui/weekly-hours"

export function WeeklyHoursShopHoursPreview() {
  return (
    <WeeklyHours
      aria-label="Opening hours"
      weekdays={["SU", "MO", "TU", "WE", "TH", "FR", "SA"]}
      hourCycle={12}
      minuteStep={30}
      defaultRange={{ start: "08:00", end: "18:00" }}
      unavailableLabel="Closed"
      defaultValue={[
        { day: "MO", start: "08:00", end: "18:00" },
        { day: "TU", start: "08:00", end: "18:00" },
        { day: "WE", start: "08:00", end: "18:00" },
        { day: "TH", start: "08:00", end: "20:00" },
        { day: "FR", start: "08:00", end: "20:00" },
        { day: "SA", start: "09:00", end: "13:00" },
      ]}
      className="w-full max-w-xl"
    />
  )
}
