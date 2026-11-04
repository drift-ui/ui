"use client"

import * as React from "react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import { Badge } from "@/registry/default/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/default/ui/popover"
import { cn } from "@/registry/default/lib/utils"
import {
  calculateUptimePercentage,
  formatDateLabel,
  formatUptimePercentage,
  getNextSegmentIndex,
  getSegmentAccessibleLabel,
  normalizeDayStatus,
  STATUS_LABELS,
  type UptimeDay,
  type UptimeStatus,
} from "@/registry/default/lib/uptime-bar"

const STATUS_BG: Record<UptimeStatus, string> = {
  operational: "bg-chart-2",
  degraded: "bg-chart-5",
  down: "bg-destructive",
  "no-data": "bg-muted",
}

export interface UptimeBarProps extends Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "title"
> {
  days: UptimeDay[]
  title?: React.ReactNode
  showPercentage?: boolean
  showRangeLabels?: boolean
  startLabel?: React.ReactNode
  endLabel?: React.ReactNode
  degradedWeight?: number
  decimals?: number
  value?: number | null
  defaultValue?: number | null
  onValueChange?: (index: number | null) => void
  renderDayContent?: (day: UptimeDay, index: number) => React.ReactNode
}

export function UptimeBar({
  days = [],
  title,
  showPercentage = true,
  showRangeLabels = true,
  startLabel,
  endLabel,
  degradedWeight = 0.5,
  decimals = 2,
  value,
  defaultValue,
  onValueChange,
  renderDayContent,
  className,
  ...props
}: UptimeBarProps) {
  const { value: openIndex, setValue: setOpenIndex } = useControllableState<
    number | null
  >({
    value,
    defaultValue: defaultValue ?? null,
    onChange: onValueChange,
  })

  const [focusedIndex, setFocusedIndex] = React.useState<number>(() => {
    if (defaultValue !== undefined && defaultValue !== null) return defaultValue
    return Math.max(0, days.length - 1)
  })

  const segmentRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  const uptimePercentage = React.useMemo(
    () => calculateUptimePercentage(days, { degradedWeight, decimals }),
    [days, degradedWeight, decimals]
  )

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
      e.preventDefault()
      const nextIndex = getNextSegmentIndex(currentIndex, e.key, days.length)
      setFocusedIndex(nextIndex)
      segmentRefs.current[nextIndex]?.focus()
      if (openIndex !== null) {
        setOpenIndex(nextIndex)
      }
    }
  }

  const activeTabIndex =
    openIndex !== null && openIndex >= 0 && openIndex < days.length
      ? openIndex
      : Math.min(focusedIndex, Math.max(0, days.length - 1))

  return (
    <div
      data-slot="uptime-bar"
      className={cn("w-full min-w-0 space-y-2", className)}
      {...props}
    >
      {(title !== undefined || showPercentage) && (
        <div
          data-slot="uptime-bar-header"
          className="flex items-center justify-between text-sm"
        >
          {title !== undefined && (
            <div
              data-slot="uptime-bar-title"
              className="font-medium text-foreground"
            >
              {title}
            </div>
          )}
          {showPercentage && (
            <div
              data-slot="uptime-bar-percentage"
              className="ml-auto font-medium text-muted-foreground"
            >
              {formatUptimePercentage(uptimePercentage, decimals)} uptime
            </div>
          )}
        </div>
      )}

      <div
        data-slot="uptime-bar-segments"
        role="group"
        aria-label={
          typeof title === "string"
            ? `${title} uptime history`
            : "Uptime history"
        }
        className="flex w-full min-w-0 items-center gap-[min(0.125rem,0.5%)]"
      >
        {days.map((day, index) => {
          const status = normalizeDayStatus(day.status)
          const accessibleLabel = getSegmentAccessibleLabel(day)
          const isOpen = openIndex === index

          return (
            <Popover
              key={index}
              open={isOpen}
              onOpenChange={(nextOpen) => {
                setOpenIndex(nextOpen ? index : null)
              }}
            >
              <PopoverTrigger
                ref={(el: HTMLButtonElement | null) => {
                  segmentRefs.current[index] = el
                }}
                type="button"
                tabIndex={activeTabIndex === index ? 0 : -1}
                data-slot="uptime-bar-segment"
                data-status={status}
                aria-label={accessibleLabel}
                title={accessibleLabel}
                onFocus={() => setFocusedIndex(index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={cn(
                  "relative h-8 min-w-0 flex-1 rounded-xs transition-opacity hover:opacity-80 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-hidden",
                  STATUS_BG[status],
                  activeTabIndex === index && "ring-1 ring-ring/30"
                )}
              />
              <PopoverContent
                align="center"
                side="top"
                sideOffset={8}
                className="w-64 p-3 text-xs"
              >
                {renderDayContent ? (
                  renderDayContent(day, index)
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">
                        {formatDateLabel(day.date, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {typeof day.uptime === "number" && (
                        <span className="font-mono text-muted-foreground">
                          {formatUptimePercentage(day.uptime, 1)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1.5 px-2 py-0.5 text-xs font-normal",
                          status === "operational" &&
                            "border-chart-2/30 bg-chart-2/10 text-chart-2",
                          status === "degraded" &&
                            "border-chart-5/30 bg-chart-5/10 text-chart-5",
                          status === "down" &&
                            "border-destructive/30 bg-destructive/10 text-destructive",
                          status === "no-data" &&
                            "border-border bg-muted text-muted-foreground"
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            STATUS_BG[status]
                          )}
                        />
                        {STATUS_LABELS[status]}
                      </Badge>
                    </div>
                    {day.note ? (
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {day.note}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {status === "operational"
                          ? "No downtime recorded on this day."
                          : status === "no-data"
                            ? "No data recorded for this period."
                            : "Incident reported."}
                      </p>
                    )}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          )
        })}
      </div>

      {showRangeLabels && days.length > 0 && (
        <div
          data-slot="uptime-bar-footer"
          className="flex items-center justify-between text-xs text-muted-foreground"
        >
          <span data-slot="uptime-bar-start-label">
            {startLabel ?? `${days.length} days ago`}
          </span>
          <span data-slot="uptime-bar-end-label">{endLabel ?? "Today"}</span>
        </div>
      )}
    </div>
  )
}

export interface UptimeBarLegendProps extends React.ComponentProps<"div"> {
  statuses?: UptimeStatus[]
}

export function UptimeBarLegend({
  className,
  statuses = ["operational", "degraded", "down", "no-data"],
  ...props
}: UptimeBarLegendProps) {
  return (
    <div
      data-slot="uptime-bar-legend"
      className={cn(
        "flex flex-wrap items-center gap-4 text-xs text-muted-foreground",
        className
      )}
      {...props}
    >
      {statuses.map((status) => (
        <div key={status} className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", STATUS_BG[status])} />
          <span>{STATUS_LABELS[status]}</span>
        </div>
      ))}
    </div>
  )
}

export { UptimeBar as default }
