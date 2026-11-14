"use client"

import * as React from "react"

import { HistogramRange } from "@/registry/base/ui/histogram-range"

const PRICES = [
  35, 42, 45, 50, 55, 60, 65, 70, 75, 78, 80, 85, 90, 95, 100, 105, 110, 115,
  120, 125, 130, 135, 140, 150, 160, 175, 180, 190, 200, 210, 225, 240, 250,
  275, 290, 300, 320, 350, 375, 400, 420, 450, 480, 500,
]

export function HistogramRangePreview() {
  const [range, setRange] = React.useState<[number, number]>([80, 300])

  return (
    <div className="w-full max-w-md">
      <HistogramRange
        data={PRICES}
        min={0}
        max={500}
        step={5}
        value={range}
        onValueChange={setRange}
        formatValue={(val) => `$${val}`}
        minThumbLabel="Minimum price"
        maxThumbLabel="Maximum price"
        showValues
        showCount
      />
    </div>
  )
}
