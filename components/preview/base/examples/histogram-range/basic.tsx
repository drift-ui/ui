"use client"

import * as React from "react"

import { HistogramRange } from "@/registry/base/ui/histogram-range"

const PRICES = [20, 35, 40, 60, 80, 95, 100, 120, 150, 180, 220, 300, 450]

export function HistogramRangeBasicPreview() {
  const [range, setRange] = React.useState<[number, number]>([50, 250])

  return (
    <div className="w-full max-w-md">
      <HistogramRange
        data={PRICES}
        min={0}
        max={500}
        value={range}
        onValueChange={setRange}
        formatValue={(val) => `$${val}`}
        showValues
        showCount
      />
    </div>
  )
}
