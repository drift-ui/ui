"use client"

import * as React from "react"

import { UptimeBar } from "@/registry/default/ui/uptime-bar"
import type { UptimeDay } from "@/registry/default/lib/uptime-bar-utils"

function generateDays(): UptimeDay[] {
  const result: UptimeDay[] = []
  const today = new Date()

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split("T")[0]

    if (i === 15) {
      result.push({
        date: dateStr,
        status: "degraded",
        uptime: 98.4,
        note: "Elevated latency during database migration",
      })
    } else if (i === 42) {
      result.push({
        date: dateStr,
        status: "down",
        uptime: 91.2,
        note: "DNS resolution failure in us-east",
      })
    } else if (i === 68) {
      result.push({
        date: dateStr,
        status: "degraded",
        uptime: 97.5,
        note: "Third-party payment gateway degraded",
      })
    } else if (i === 75) {
      result.push({
        date: dateStr,
        status: "no-data",
        note: "Scheduled metric telemetry upgrade",
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

export function UptimeBarPreview() {
  const days = React.useMemo(() => generateDays(), [])

  return (
    <div className="w-full max-w-xl rounded-lg border bg-card p-4 text-card-foreground shadow-xs">
      <UptimeBar title="API Service" days={days} />
    </div>
  )
}
