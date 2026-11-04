"use client"

import * as React from "react"

import { UptimeBar, UptimeBarLegend } from "@/registry/default/ui/uptime-bar"
import type { UptimeDay } from "@/registry/default/lib/uptime-bar"

const SAMPLE_DAYS: UptimeDay[] = [
  { date: "2026-10-25", status: "operational", uptime: 100 },
  { date: "2026-10-26", status: "operational", uptime: 100 },
  {
    date: "2026-10-27",
    status: "degraded",
    uptime: 98.2,
    note: "Packet loss in central region",
  },
  {
    date: "2026-10-28",
    status: "down",
    uptime: 88.5,
    note: "Major power interruption at facility",
  },
  {
    date: "2026-10-29",
    status: "no-data",
    note: "System maintenance window",
  },
  { date: "2026-10-30", status: "operational", uptime: 100 },
  { date: "2026-10-31", status: "operational", uptime: 100 },
]

export function UptimeBarLegendPreview() {
  return (
    <div className="w-full max-w-lg space-y-4 rounded-lg border bg-card p-4 text-card-foreground shadow-xs">
      <UptimeBar
        title="Payment Gateway"
        days={SAMPLE_DAYS}
        startLabel="Oct 25, 2026"
        endLabel="Oct 31, 2026"
      />
      <div className="border-t pt-3">
        <UptimeBarLegend />
      </div>
    </div>
  )
}
