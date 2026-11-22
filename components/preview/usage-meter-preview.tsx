"use client"

import * as React from "react"

import {
  UsageMeter,
  type UsageMeterSegment,
} from "@/registry/default/ui/usage-meter"

const STORAGE_SEGMENTS: UsageMeterSegment[] = [
  { label: "Images", value: 4.1 },
  { label: "Video", value: 3.1 },
  { label: "Documents", value: 1.2 },
]

export function UsageMeterPreview() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6 rounded-lg border bg-card p-5 text-card-foreground shadow-xs">
      <UsageMeter
        label="Storage Used"
        description="Standard single-value usage meter with warning threshold"
        value={7.2}
        max={10}
        unit="GB"
        warningAt={0.8}
      />

      <UsageMeter
        label="Storage Breakdown"
        description="Segmented breakdown across content categories with legend"
        max={10}
        unit="GB"
        segments={STORAGE_SEGMENTS}
      />
    </div>
  )
}
