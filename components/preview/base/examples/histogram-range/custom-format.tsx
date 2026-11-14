"use client"

import * as React from "react"

import { HistogramRange } from "@/registry/base/ui/histogram-range"

const SIZES = [2, 5, 8, 12, 16, 24, 32, 45, 64, 80, 100, 120, 150, 200]

export function HistogramRangeCustomFormatPreview() {
  const [range, setRange] = React.useState<[number, number]>([10, 100])

  return (
    <div className="w-full max-w-md">
      <HistogramRange
        data={SIZES}
        min={0}
        max={200}
        step={5}
        value={range}
        onValueChange={setRange}
        formatValue={(val) => `${val} MB`}
        minThumbLabel="Minimum file size"
        maxThumbLabel="Maximum file size"
        barColor="bg-chart-2"
        showValues
        showCount
        renderCount={(selected, total) => `${selected} / ${total} files`}
      />
    </div>
  )
}
