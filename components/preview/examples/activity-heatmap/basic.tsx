"use client"

import * as React from "react"

import {
  ActivityHeatmap,
  type ActivityDayInput,
} from "@/registry/default/ui/activity-heatmap"

function generateData(): ActivityDayInput[] {
  const result: ActivityDayInput[] = []
  const end = new Date(Date.UTC(2026, 9, 31))

  let seed = 123
  function random() {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  for (let i = 180; i >= 0; i--) {
    const d = new Date(end.getTime() - i * 24 * 60 * 60 * 1000)
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, "0")
    const day = String(d.getUTCDate()).padStart(2, "0")
    const dateStr = `${y}-${m}-${day}`
    const count = random() > 0.4 ? Math.floor(random() * 8) + 1 : 0
    result.push({ date: dateStr, count })
  }

  return result
}

export function ActivityHeatmapBasicPreview() {
  const data = React.useMemo(() => generateData(), [])

  return (
    <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs">
      <ActivityHeatmap
        data={data}
        startDate="2026-05-01"
        endDate="2026-10-31"
        weekStartsOn={1}
      />
    </div>
  )
}
