"use client"

import * as React from "react"

import {
  ActivityHeatmap,
  type ActivityDay,
  type ActivityDayInput,
} from "@/registry/default/ui/activity-heatmap"

const RECENT_DATA: ActivityDayInput[] = [
  { date: "2026-10-25", count: 3 },
  { date: "2026-10-26", count: 0 },
  { date: "2026-10-27", count: 8 },
  { date: "2026-10-28", count: 14 },
  { date: "2026-10-29", count: 5 },
  { date: "2026-10-30", count: 2 },
  { date: "2026-10-31", count: 9 },
]

export function ActivityHeatmapInteractivePreview() {
  const [selected, setSelected] = React.useState<ActivityDay | null>({
    date: "2026-10-31",
    count: 9,
    level: 4,
  })

  return (
    <div className="w-full max-w-lg space-y-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs">
      <ActivityHeatmap
        data={RECENT_DATA}
        startDate="2026-10-01"
        endDate="2026-10-31"
        weekStartsOn={0}
        selectedDate={selected?.date}
        onDaySelect={setSelected}
        unit="commits"
      />
      <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        {selected ? (
          <p>
            Selected date:{" "}
            <span className="font-semibold text-foreground">
              {selected.date}
            </span>{" "}
            with{" "}
            <span className="font-semibold text-foreground">
              {selected.count} commits
            </span>{" "}
            (Intensity level {selected.level} of 4).
          </p>
        ) : (
          <p>Select any day in the grid to view details.</p>
        )}
      </div>
    </div>
  )
}
