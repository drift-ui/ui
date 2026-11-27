"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
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
    <div className="flex w-full max-w-md flex-col gap-5 rounded-lg border bg-card p-5 text-card-foreground shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">Team plan</p>
          <p className="text-sm text-muted-foreground">Resets on December 1</p>
        </div>
        <Button size="sm" variant="outline">
          Upgrade
        </Button>
      </div>

      <UsageMeter
        label="Build minutes"
        value={2140}
        max={3000}
        unit="min"
        warningAt={0.8}
      />

      <UsageMeter
        label="Storage"
        description="Across 3 projects"
        max={10}
        unit="GB"
        segments={STORAGE_SEGMENTS}
      />
    </div>
  )
}
