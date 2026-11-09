"use client"

import * as React from "react"

import {
  ActivityHeatmap,
  type ActivityDayInput,
} from "@/registry/default/ui/activity-heatmap"

const HABIT_DATA: ActivityDayInput[] = [
  { date: "2026-10-18", count: 1 },
  { date: "2026-10-19", count: 4 },
  { date: "2026-10-20", count: 6 },
  { date: "2026-10-21", count: 12 },
  { date: "2026-10-22", count: 2 },
  { date: "2026-10-23", count: 8 },
  { date: "2026-10-24", count: 15 },
  { date: "2026-10-25", count: 3 },
  { date: "2026-10-26", count: 5 },
  { date: "2026-10-27", count: 10 },
  { date: "2026-10-28", count: 20 },
  { date: "2026-10-29", count: 7 },
  { date: "2026-10-30", count: 1 },
  { date: "2026-10-31", count: 14 },
]

export function ActivityHeatmapThresholdsPreview() {
  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs">
      <ActivityHeatmap
        data={HABIT_DATA}
        startDate="2026-10-01"
        endDate="2026-10-31"
        weekStartsOn={1}
        thresholds={[1, 5, 10, 15]}
        unit="tasks"
        summary={(total) => (
          <span className="font-semibold">
            {total} tasks completed in October
          </span>
        )}
      />
    </div>
  )
}
