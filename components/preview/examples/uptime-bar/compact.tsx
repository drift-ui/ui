"use client"

import * as React from "react"

import { UptimeBar } from "@/registry/default/ui/uptime-bar"
import type { UptimeDay } from "@/registry/default/lib/uptime-bar-utils"

function generateThirtyDays(): UptimeDay[] {
  const result: UptimeDay[] = []
  const today = new Date()

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split("T")[0]

    if (i === 5) {
      result.push({
        date: dateStr,
        status: "degraded",
        uptime: 98.7,
        note: "Elevated response times during peak load",
      })
    } else {
      result.push({
        date: dateStr,
        status: "operational",
        uptime: 100,
      })
    }
  }

  return result
}

export function UptimeBarCompactPreview() {
  const days = React.useMemo(() => generateThirtyDays(), [])

  return (
    <div className="w-full max-w-lg space-y-4 rounded-lg border bg-card p-4 text-card-foreground shadow-xs">
      <UptimeBar
        title="Web App"
        days={days}
        startLabel="30 days ago"
        endLabel="Today"
      />
      <UptimeBar
        title="Database Cluster"
        days={days}
        startLabel="30 days ago"
        endLabel="Today"
      />
    </div>
  )
}
