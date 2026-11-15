"use client"

import * as React from "react"

import {
  type AvailabilityRange,
  getAvailabilitySummary,
} from "@/registry/default/lib/availability-grid-utils"
import { AvailabilityGrid } from "@/registry/default/ui/availability-grid"

const DEFAULT_SCHEDULE: AvailabilityRange[] = [
  { day: "MO", start: "09:00", end: "17:00" },
  { day: "TU", start: "09:00", end: "17:00" },
  { day: "WE", start: "09:00", end: "17:00" },
  { day: "TH", start: "09:00", end: "17:00" },
  { day: "FR", start: "09:00", end: "16:00" },
]

const TIMEZONES = [
  { value: "UTC", label: "UTC (GMT+0)" },
  { value: "Europe/London", label: "London (GMT+0)" },
  { value: "Europe/Berlin", label: "Berlin (GMT+1)" },
  { value: "America/New_York", label: "New York (GMT-5)" },
  { value: "America/Los_Angeles", label: "San Francisco (GMT-8)" },
  { value: "Asia/Kolkata", label: "Mumbai / Kolkata (GMT+5:30)" },
  { value: "Asia/Tokyo", label: "Tokyo (GMT+9)" },
]

export function AvailabilityGridPreview() {
  const [schedule, setSchedule] =
    React.useState<AvailabilityRange[]>(DEFAULT_SCHEDULE)
  const [timeZone, setTimeZone] = React.useState<string>("Europe/Berlin")

  const summary = React.useMemo(
    () => getAvailabilitySummary(schedule),
    [schedule]
  )

  const handleReset = () => {
    setSchedule(DEFAULT_SCHEDULE)
    setTimeZone("Europe/Berlin")
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="preview-timezone" className="text-xs font-medium">
            Time zone:
          </label>
          <select
            id="preview-timezone"
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
            className="rounded-md border bg-background px-2.5 py-1 text-xs shadow-xs outline-hidden"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border bg-background px-2.5 py-1 text-xs font-medium shadow-xs transition-colors hover:bg-muted"
        >
          Reset schedule
        </button>
      </div>

      <AvailabilityGrid
        value={schedule}
        onValueChange={setSchedule}
        timeZone={timeZone}
        startHour={8}
        endHour={19}
        slotMinutes={30}
      />

      <div className="rounded-md border bg-muted/30 p-3 text-xs">
        <div className="font-semibold text-foreground">
          Schedule ({summary.totalHours} hrs / {summary.daysCount} active days
          in {timeZone})
        </div>
        <div className="mt-1 font-mono text-[11px] whitespace-pre-wrap text-muted-foreground">
          {schedule.length === 0
            ? "No availability selected"
            : JSON.stringify(schedule, null, 2)}
        </div>
      </div>
    </div>
  )
}
