"use client"

import * as React from "react"

import {
  UsageMeter,
  type UsageMeterSegment,
} from "@/registry/default/ui/usage-meter"

const OVERAGE_SEGMENTS: UsageMeterSegment[] = [
  { label: "Production Assets", value: 6.8 },
  { label: "Staging Assets", value: 3.4 },
  { label: "Build Artifacts", value: 2.3 },
]

export function UsageMeterOveragePreview() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6 rounded-lg border bg-card p-4 text-card-foreground shadow-xs">
      <UsageMeter
        label="Single Value Overage"
        description="Single meter exceeding limit with overage badge"
        value={12.5}
        max={10}
        unit="GB"
      />

      <UsageMeter
        label="Stacked Segment Overage"
        description="Segmented breakdown exceeding limit with boundary line"
        max={10}
        unit="GB"
        segments={OVERAGE_SEGMENTS}
      />
    </div>
  )
}
