"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  buildHistogramBuckets,
  clampRange,
} from "@/registry/default/lib/histogram-range.ts"
import { cn } from "@/registry/default/lib/utils"

export interface HistogramRangeProps extends Omit<
  React.ComponentProps<"div">,
  "value" | "defaultValue" | "onChange"
> {
  data?: number[]
  min?: number
  max?: number
  step?: number
  minStepsBetweenThumbs?: number
  value?: [number, number]
  defaultValue?: [number, number]
  onValueChange?: (value: [number, number]) => void
  onValueCommit?: (value: [number, number]) => void
  bins?: number
  formatValue?: (value: number) => string
  minThumbLabel?: string
  maxThumbLabel?: string
  showValues?: boolean
  showCount?: boolean
  renderCount?: (selectedCount: number, totalCount: number) => React.ReactNode
  barHeight?: number | string
  barColor?: string
  mutedBarColor?: string
  disabled?: boolean
}

function HistogramRange({
  data = [],
  min: minProp,
  max: maxProp,
  step = 1,
  minStepsBetweenThumbs = 0,
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  bins = 24,
  formatValue,
  minThumbLabel = "Minimum",
  maxThumbLabel = "Maximum",
  showValues = false,
  showCount = false,
  renderCount,
  barHeight = 64,
  barColor,
  mutedBarColor,
  disabled = false,
  className,
  ...props
}: HistogramRangeProps) {
  let derivedMin = Infinity
  let derivedMax = -Infinity
  for (const item of data) {
    if (typeof item === "number" && Number.isFinite(item)) {
      if (item < derivedMin) derivedMin = item
      if (item > derivedMax) derivedMax = item
    }
  }

  const effectiveMin = minProp ?? (derivedMin !== Infinity ? derivedMin : 0)
  const rawMax = maxProp ?? (derivedMax !== -Infinity ? derivedMax : 100)
  const effectiveMax = effectiveMin >= rawMax ? effectiveMin + 1 : rawMax

  const defaultRange: [number, number] = defaultValue ?? [
    effectiveMin,
    effectiveMax,
  ]

  const { value: currentRange, setValue: setRange } = useControllableState<
    [number, number]
  >({
    value,
    defaultValue: defaultRange,
    onChange: onValueChange,
  })

  const rawRange = clampRange(currentRange, effectiveMin, effectiveMax)
  const rangeStart = rawRange[0]
  const rangeEnd = rawRange[1]
  const clampedRange = React.useMemo<[number, number]>(
    () => [rangeStart, rangeEnd],
    [rangeStart, rangeEnd]
  )

  const { buckets, selectedCount, totalCount } = React.useMemo(
    () =>
      buildHistogramBuckets({
        data,
        min: effectiveMin,
        max: effectiveMax,
        bins,
        value: clampedRange,
      }),
    [data, effectiveMin, effectiveMax, bins, clampedRange]
  )

  const handleRangeChange = React.useCallback(
    (next: number[]) => {
      if (next.length >= 2) {
        setRange([next[0], next[1]])
      }
    },
    [setRange]
  )

  return (
    <div
      data-slot="histogram-range"
      role="group"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    >
      {(showValues || showCount) && (
        <div
          data-slot="histogram-range-header"
          className="flex items-center justify-between text-sm text-muted-foreground"
        >
          {showValues ? (
            <span
              data-slot="histogram-range-values"
              className="font-medium text-foreground"
            >
              {formatValue ? formatValue(clampedRange[0]) : clampedRange[0]} –{" "}
              {formatValue ? formatValue(clampedRange[1]) : clampedRange[1]}
            </span>
          ) : (
            <span />
          )}
          {showCount && (
            <span data-slot="histogram-range-count">
              {renderCount
                ? renderCount(selectedCount, totalCount)
                : `${selectedCount} of ${totalCount} results`}
            </span>
          )}
        </div>
      )}

      <div
        data-slot="histogram-chart"
        aria-hidden="true"
        style={{ height: barHeight }}
        className="flex w-full items-end gap-0.5 px-2 select-none"
      >
        {buckets.map((bucket) => (
          <div
            key={bucket.index}
            data-slot="histogram-bar"
            data-in-range={bucket.inRange ? "true" : "false"}
            className={cn(
              "flex-1 rounded-t-xs transition-colors duration-150",
              bucket.inRange
                ? (barColor ?? "bg-primary")
                : (mutedBarColor ?? "bg-muted-foreground/20")
            )}
            style={{
              height: bucket.count > 0 ? `${bucket.heightPercent}%` : "0%",
            }}
          />
        ))}
      </div>

      <SliderPrimitive.Root
        data-slot="histogram-range-slider"
        min={effectiveMin}
        max={effectiveMax}
        step={step}
        minStepsBetweenValues={minStepsBetweenThumbs}
        value={clampedRange}
        onValueChange={(val) => {
          if (Array.isArray(val) && val.length >= 2) {
            handleRangeChange([val[0], val[1]])
          }
        }}
        onValueCommitted={(val) => {
          if (onValueCommit && Array.isArray(val) && val.length >= 2) {
            onValueCommit([val[0], val[1]])
          }
        }}
        disabled={disabled}
        className={cn(
          "relative w-full touch-none select-none",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <SliderPrimitive.Control className="relative flex h-4 w-full items-center">
          <SliderPrimitive.Track
            data-slot="histogram-range-track"
            className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted"
          >
            <SliderPrimitive.Indicator
              data-slot="histogram-range-range"
              className="bg-primary"
            />
            <SliderPrimitive.Thumb
              index={0}
              data-slot="histogram-range-thumb-min"
              aria-label={minThumbLabel}
              aria-valuetext={
                formatValue ? formatValue(clampedRange[0]) : undefined
              }
              className="block size-4 rounded-full border-2 border-primary bg-background shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            />
            <SliderPrimitive.Thumb
              index={1}
              data-slot="histogram-range-thumb-max"
              aria-label={maxThumbLabel}
              aria-valuetext={
                formatValue ? formatValue(clampedRange[1]) : undefined
              }
              className="block size-4 rounded-full border-2 border-primary bg-background shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            />
          </SliderPrimitive.Track>
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>

      <div className="sr-only" aria-live="polite" role="status">
        {renderCount
          ? renderCount(selectedCount, totalCount)
          : `${selectedCount} of ${totalCount} results in selected range`}
      </div>
    </div>
  )
}

export { HistogramRange }
