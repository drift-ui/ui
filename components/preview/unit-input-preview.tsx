"use client"

import * as React from "react"

import { BYTE_UNITS } from "@/registry/default/lib/unit-input-utils"
import { Label } from "@/registry/default/ui/label"
import { UnitInput } from "@/registry/default/ui/unit-input"

export function UnitInputPreview() {
  const [bytes, setBytes] = React.useState<number | null>(512_000_000)

  return (
    <div className="flex w-64 flex-col gap-2">
      <Label htmlFor="preview-memory">Memory limit</Label>
      <UnitInput
        id="preview-memory"
        value={bytes}
        onValueChange={setBytes}
        units={BYTE_UNITS}
        defaultUnit="MB"
        min={0}
        max={64_000_000_000}
      />
      <p className="font-mono text-xs text-muted-foreground">
        Saved as {bytes ?? "null"}
        {bytes !== null && " bytes"}
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        Try it: switch to GB, or type 2gb.
      </p>
    </div>
  )
}
