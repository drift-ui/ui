"use client"

import * as React from "react"

import {
  ActivityHeatmap,
  type ActivityDay,
  type ActivityDayInput,
} from "@/registry/default/ui/activity-heatmap"
import { Badge } from "@/registry/default/ui/badge"

function generateData(): ActivityDayInput[] {
  const result: ActivityDayInput[] = []
  const end = new Date(Date.UTC(2026, 9, 31))

  let seed = 789
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
    const count = random() > 0.35 ? Math.floor(random() * 15) + 1 : 0
    result.push({ date: dateStr, count })
  }

  return result
}

export function ActivityHeatmapTooltipPreview() {
  const data = React.useMemo(() => generateData(), [])

  return (
    <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs">
      <ActivityHeatmap
        data={data}
        startDate="2026-05-01"
        endDate="2026-10-31"
        weekStartsOn={1}
        renderTooltip={(day: ActivityDay) => {
          const commits = Math.floor(day.count * 0.7)
          const reviews = day.count - commits

          return (
            <div className="flex flex-col gap-1.5 p-0.5 text-left">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-foreground">
                  {day.count} {day.count === 1 ? "activity" : "activities"}
                </span>
                <Badge
                  variant="outline"
                  className="h-4 px-1 text-[10px] font-normal"
                >
                  Level {day.level}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">{day.date}</p>
              {day.count > 0 && (
                <div className="border-t border-border/50 pt-1 text-[10px] text-muted-foreground">
                  <span>{commits} commits</span> &bull;{" "}
                  <span>{reviews} reviews</span>
                </div>
              )}
            </div>
          )
        }}
      />
    </div>
  )
}
