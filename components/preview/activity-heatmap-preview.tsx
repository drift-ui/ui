"use client"

import * as React from "react"

import {
  ActivityHeatmap,
  type ActivityDay,
  type ActivityDayInput,
} from "@/registry/default/ui/activity-heatmap"

function generateYearData(): ActivityDayInput[] {
  const result: ActivityDayInput[] = []
  const end = new Date(Date.UTC(2026, 9, 31)) // 2026-10-31

  // Deterministic pseudorandom generator for consistent SSR/CSR rendering
  let seed = 42
  function random() {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  for (let i = 364; i >= 0; i--) {
    const d = new Date(end.getTime() - i * 24 * 60 * 60 * 1000)
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, "0")
    const day = String(d.getUTCDate()).padStart(2, "0")
    const dateStr = `${y}-${m}-${day}`

    // Weekday check: weekends have less activity
    const dayOfWeek = d.getUTCDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    const rand = random()
    let count = 0
    if (isWeekend) {
      if (rand > 0.7) count = Math.floor(random() * 4) + 1
    } else {
      if (rand > 0.25) count = Math.floor(random() * 12) + 1
    }

    result.push({ date: dateStr, count })
  }

  return result
}

export function ActivityHeatmapPreview() {
  const data = React.useMemo(() => generateYearData(), [])
  const [selected, setSelected] = React.useState<ActivityDay | null>(null)

  return (
    <div className="w-full max-w-4xl space-y-3 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs">
      <ActivityHeatmap
        data={data}
        startDate="2025-11-01"
        endDate="2026-10-31"
        weekStartsOn={1}
        selectedDate={selected?.date}
        onDaySelect={setSelected}
      />
      {selected && (
        <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Selected:{" "}
          <span className="font-semibold text-foreground">{selected.date}</span>{" "}
          with{" "}
          <span className="font-semibold text-foreground">
            {selected.count} contributions
          </span>
          .
        </div>
      )}
    </div>
  )
}
