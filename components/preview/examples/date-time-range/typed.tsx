"use client"

import * as React from "react"

import {
  DateTimeRangePicker,
  type DateTimeRange,
} from "@/registry/default/ui/date-time-range"
import { Label } from "@/registry/default/ui/label"

export function DateTimeRangeTypedPreview() {
  const [range, setRange] = React.useState<DateTimeRange>({})
  const [max] = React.useState(() => new Date())

  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="range-typed">Log search</Label>
      <DateTimeRangePicker
        id="range-typed"
        value={range}
        onValueChange={setRange}
        max={max}
        placeholder="Open and type “last 24 hours”"
      />
    </div>
  )
}
