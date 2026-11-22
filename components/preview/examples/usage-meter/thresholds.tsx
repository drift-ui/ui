"use client"

import * as React from "react"

import { UsageMeter } from "@/registry/default/ui/usage-meter"

export function UsageMeterThresholdsPreview() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6 rounded-lg border bg-card p-4 text-card-foreground shadow-xs">
      <UsageMeter
        label="Team Seat Allocation"
        description="Warning threshold triggered at 80% capacity"
        value={18}
        max={20}
        unit="seats"
        warningAt={0.8}
      />

      <UsageMeter
        label="Monthly API Requests"
        description="Warning triggered at 80,000 of 100,000 quota"
        value={85000}
        max={100000}
        unit="calls"
        warningAt={80000}
      />
    </div>
  )
}
