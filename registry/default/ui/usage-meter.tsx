"use client"

import * as React from "react"

import { Badge } from "@/registry/default/ui/badge"
import { cn } from "@/registry/default/lib/utils"
import {
  calculateMeterStatus,
  calculatePercentage,
  calculateSegments,
  formatUsageValue,
  getUsageAriaValueText,
  type CalculatedSegment,
  type UsageMeterSegment,
  type UsageMeterStatus,
} from "@/registry/default/lib/usage-meter-utils"

export type { UsageMeterSegment, UsageMeterStatus, CalculatedSegment }

export interface UsageMeterProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  min?: number
  unit?: string
  warningAt?: number
  dangerAt?: number
  segments?: UsageMeterSegment[]
  label?: React.ReactNode
  description?: React.ReactNode
  showValue?: boolean
  showLegend?: boolean
  showStatusBadge?: boolean
  size?: "sm" | "md" | "lg"
  locale?: string
  decimals?: number
  formatOptions?: Intl.NumberFormatOptions
  renderValue?: (
    value: number,
    max: number,
    percentage: number
  ) => React.ReactNode
}

const SIZE_VARIANTS = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
} as const

const STATUS_BAR_COLORS: Record<UsageMeterStatus, string> = {
  normal: "bg-primary",
  warning: "bg-chart-5",
  danger: "bg-destructive",
}

export function UsageMeter({
  value: valueProp,
  max = 100,
  min = 0,
  unit,
  warningAt = 0.8,
  dangerAt = 1.0,
  segments,
  label,
  description,
  showValue = true,
  showLegend,
  showStatusBadge = true,
  size = "md",
  locale = "en-US",
  decimals,
  formatOptions,
  renderValue,
  className,
  ...props
}: UsageMeterProps) {
  const safeMin = Math.max(0, min)
  const safeMax = Math.max(safeMin, max)

  const hasSegments = Array.isArray(segments) && segments.length > 0

  const totalValue = React.useMemo(() => {
    if (hasSegments) {
      const sum = segments.reduce((acc, s) => acc + Math.max(0, s.value), 0)
      return Math.round(sum * 10000) / 10000
    }
    return Math.max(0, valueProp ?? 0)
  }, [hasSegments, segments, valueProp])

  const calculatedSegments = React.useMemo(() => {
    if (!hasSegments) return []
    return calculateSegments(segments, safeMax, undefined, safeMin)
  }, [hasSegments, segments, safeMax, safeMin])

  const status = React.useMemo(
    () =>
      calculateMeterStatus({
        value: totalValue,
        max: safeMax,
        min: safeMin,
        warningAt,
        dangerAt,
      }),
    [totalValue, safeMax, safeMin, warningAt, dangerAt]
  )

  const percentage = React.useMemo(
    () => calculatePercentage(totalValue, safeMax, decimals ?? 1, safeMin),
    [totalValue, safeMax, decimals, safeMin]
  )

  const isOverLimit = totalValue > safeMax
  const overage = isOverLimit
    ? Math.round((totalValue - safeMax) * 10000) / 10000
    : 0

  const ariaValueText = React.useMemo(
    () =>
      getUsageAriaValueText({
        value: totalValue,
        max: safeMax,
        min: safeMin,
        unit,
        locale,
        decimals,
        formatOptions,
      }),
    [totalValue, safeMax, safeMin, unit, locale, decimals, formatOptions]
  )

  const formattedCurrent = React.useMemo(
    () =>
      formatUsageValue(totalValue, {
        unit,
        locale,
        decimals,
        formatOptions,
      }),
    [totalValue, unit, locale, decimals, formatOptions]
  )

  const formattedMax = React.useMemo(
    () =>
      formatUsageValue(safeMax, {
        unit,
        locale,
        decimals,
        formatOptions,
      }),
    [safeMax, unit, locale, decimals, formatOptions]
  )

  const formattedOverage = React.useMemo(
    () =>
      formatUsageValue(overage, {
        unit,
        locale,
        decimals,
        formatOptions,
      }),
    [overage, unit, locale, decimals, formatOptions]
  )

  const shouldShowLegend = showLegend ?? hasSegments
  const generatedId = React.useId()
  const internalLabelId = `usage-meter-label-${generatedId}`
  const labelId =
    props["aria-labelledby"] ?? (label ? internalLabelId : undefined)
  const descriptionId = description
    ? `usage-meter-desc-${generatedId}`
    : undefined
  const ariaDescribedBy = props["aria-describedby"] ?? descriptionId
  const ariaLabel = props["aria-label"] ?? (labelId ? undefined : "Usage")

  const hasStatusBadge =
    showStatusBadge && (isOverLimit || (!isOverLimit && status === "warning"))
  const hasHeader = Boolean(label || description || showValue || hasStatusBadge)

  const ariaValueNow = Math.min(safeMax, Math.max(safeMin, totalValue))
  const limitMarkerPercent =
    totalValue > safeMin
      ? Math.round(((safeMax - safeMin) / (totalValue - safeMin)) * 10000) / 100
      : 0

  return (
    <div
      data-slot="usage-meter"
      className={cn("flex w-full flex-col gap-2", className)}
      {...props}
    >
      {hasHeader && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <div className="flex min-w-0 flex-col">
            {label && (
              <span
                id={internalLabelId}
                className="text-sm font-medium text-foreground"
              >
                {label}
              </span>
            )}
            {description && (
              <span
                id={descriptionId}
                className="text-xs text-muted-foreground"
              >
                {description}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showStatusBadge && isOverLimit && (
              <Badge variant="destructive" className="shrink-0 text-xs">
                {formattedOverage} over limit
              </Badge>
            )}
            {showStatusBadge && !isOverLimit && status === "warning" && (
              <Badge
                variant="secondary"
                className="shrink-0 border-chart-5/40 text-xs text-chart-5"
              >
                {Math.round(percentage)}% used
              </Badge>
            )}

            {showValue && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {renderValue ? (
                  renderValue(totalValue, safeMax, percentage)
                ) : (
                  <>
                    <span className="font-semibold text-foreground">
                      {formattedCurrent}
                    </span>{" "}
                    / {formattedMax}
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Meter Track */}
      <div
        role="meter"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-labelledby={labelId}
        aria-describedby={ariaDescribedBy}
        aria-valuenow={ariaValueNow}
        aria-valuemin={safeMin}
        aria-valuemax={safeMax}
        aria-valuetext={ariaValueText}
        data-slot="usage-meter-track"
        data-status={status}
        className={cn(
          "relative flex w-full overflow-hidden rounded-full bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          SIZE_VARIANTS[size]
        )}
      >
        {hasSegments ? (
          // Segmented mode
          isOverLimit ? (
            // Over-limit scale: segments scale proportionally to totalValue, with limit line
            <>
              {calculatedSegments.map((seg, idx) => {
                const widthPercent = (seg.value / totalValue) * 100
                return (
                  <div
                    key={seg.id ?? `${seg.label}-${idx}`}
                    data-slot="usage-meter-segment"
                    style={{ width: `${widthPercent}%` }}
                    className={cn(
                      "h-full transition-[width] duration-300",
                      seg.color
                    )}
                    title={`${seg.label}: ${formatUsageValue(seg.value, { unit, locale, decimals, formatOptions })}`}
                  />
                )
              })}
              {/* Limit Marker Line */}
              <div
                data-slot="usage-meter-limit-marker"
                style={{ left: `${limitMarkerPercent}%` }}
                className="absolute top-0 bottom-0 z-10 w-0.5 -translate-x-1/2 bg-foreground/80 shadow-xs"
                title={`Limit: ${formattedMax}`}
              />
            </>
          ) : (
            // Within limit: segments scale relative to max
            calculatedSegments.map((seg, idx) => (
              <div
                key={seg.id ?? `${seg.label}-${idx}`}
                data-slot="usage-meter-segment"
                style={{ width: `${Math.min(100, seg.percentage)}%` }}
                className={cn(
                  "h-full transition-[width] duration-300",
                  seg.color
                )}
                title={`${seg.label}: ${formatUsageValue(seg.value, { unit, locale, decimals, formatOptions })}`}
              />
            ))
          )
        ) : (
          // Single value mode
          <div
            data-slot="usage-meter-bar"
            style={{
              width: isOverLimit
                ? "100%"
                : `${Math.min(100, Math.max(0, percentage))}%`,
            }}
            className={cn(
              "h-full rounded-full transition-[width,background-color] duration-300",
              STATUS_BAR_COLORS[status]
            )}
          />
        )}
      </div>

      {/* Legend for segments */}
      {shouldShowLegend && calculatedSegments.length > 0 && (
        <UsageMeterLegend
          segments={calculatedSegments}
          unit={unit}
          locale={locale}
          decimals={decimals}
          formatOptions={formatOptions}
        />
      )}
    </div>
  )
}

export interface UsageMeterLegendProps extends React.HTMLAttributes<HTMLUListElement> {
  segments: CalculatedSegment[]
  unit?: string
  locale?: string
  decimals?: number
  formatOptions?: Intl.NumberFormatOptions
}

export function UsageMeterLegend({
  segments,
  unit,
  locale = "en-US",
  decimals,
  formatOptions,
  className,
  ...props
}: UsageMeterLegendProps) {
  return (
    <ul
      data-slot="usage-meter-legend"
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs",
        className
      )}
      {...props}
    >
      {segments.map((seg, idx) => (
        <li
          key={seg.id ?? `${seg.label}-${idx}`}
          className="flex items-center gap-1.5 text-muted-foreground"
        >
          <span
            className={cn("size-2 shrink-0 rounded-full", seg.color)}
            aria-hidden="true"
          />
          <span className="font-medium text-foreground">{seg.label}</span>
          <span>
            {formatUsageValue(seg.value, {
              unit,
              locale,
              decimals,
              formatOptions,
            })}
          </span>
        </li>
      ))}
    </ul>
  )
}
