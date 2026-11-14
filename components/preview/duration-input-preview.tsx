"use client"

import * as React from "react"

import { formatDuration } from "@/registry/default/lib/duration-input-utils"
import { DurationInput } from "@/registry/default/ui/duration-input"
import { Label } from "@/registry/default/ui/label"

export function DurationInputPreview() {
  const [limit, setLimit] = React.useState<number | null>(900000)

  return (
    <div className="flex w-64 flex-col gap-2">
      <Label>Stop the job after</Label>
      <DurationInput
        aria-label="Stop the job after"
        value={limit}
        onValueChange={setLimit}
      />
      <p className="mt-1 text-sm">
        {limit === null
          ? "No time limit"
          : `Stops after ${formatDuration(limit, ["h", "m", "s"])}`}
      </p>
      <p className="font-mono text-xs text-muted-foreground">
        Saved as {limit ?? "null"}
        {limit !== null && " ms"}
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        Try it: click a box, type 90, then press m.
      </p>
    </div>
  )
}
