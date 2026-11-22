"use client"

import * as React from "react"

import {
  UsageMeter,
  type UsageMeterSegment,
} from "@/registry/default/ui/usage-meter"

const MEDIA_SEGMENTS: UsageMeterSegment[] = [
  { label: "PostgreSQL", value: 4.8 },
  { label: "Redis Cache", value: 1.5 },
  { label: "Blob Storage", value: 2.1 },
]

export function UsageMeterSegmentedPreview() {
  return (
    <div className="w-full max-w-md rounded-lg border bg-card p-4 text-card-foreground shadow-xs">
      <UsageMeter
        label="Database Storage"
        description="Managed cluster allocation by database engine"
        max={10}
        unit="GB"
        segments={MEDIA_SEGMENTS}
      />
    </div>
  )
}
