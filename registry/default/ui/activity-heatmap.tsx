"use client"

import * as React from "react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import { cn } from "@/registry/default/lib/utils"
import {
  buildHeatmapLayout,
  formatDateLabel,
  stepHeatmapCoordinate,
  type ActivityDay,
  type ActivityDayInput,
  type HeatmapCell,
} from "@/registry/default/lib/activity-heatmap.ts"

export type { ActivityDay, ActivityDayInput, HeatmapCell }

export interface ActivityHeatmapProps extends Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "value" | "onChange"
> {
  data: ActivityDayInput[]
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  startDate?: string
  endDate?: string
  selectedDate?: string | null
  defaultSelectedDate?: string | null
  onDaySelect?: (day: ActivityDay) => void
  thresholds?: number[]
  unit?: string
  showSummary?: boolean
  summary?:
    | React.ReactNode
    | ((total: number, startDate: string, endDate: string) => React.ReactNode)
  showLegend?: boolean
  showMonthLabels?: boolean
  showWeekdayLabels?: boolean
  levelColors?: Record<number, string>
  "aria-label"?: string
}

const DEFAULT_LEVEL_CLASSES: Record<number, string> = {
  0: "bg-muted/40 border border-border/30",
  1: "bg-primary/20",
  2: "bg-primary/45",
  3: "bg-primary/70",
  4: "bg-primary",
}

export function ActivityHeatmap({
  data = [],
  weekStartsOn = 0,
  startDate,
  endDate,
  selectedDate: selectedDateProp,
  defaultSelectedDate,
  onDaySelect,
  thresholds,
  unit = "contributions",
  showSummary = true,
  summary,
  showLegend = true,
  showMonthLabels = true,
  showWeekdayLabels = true,
  levelColors,
  "aria-label": ariaLabel = "Activity heatmap",
  className,
  ...props
}: ActivityHeatmapProps) {
  const { value: selectedDate, setValue: setSelectedDate } =
    useControllableState<string | null>({
      value: selectedDateProp,
      defaultValue: defaultSelectedDate ?? null,
    })

  const layout = React.useMemo(() => {
    return buildHeatmapLayout({
      data,
      startDate,
      endDate,
      weekStartsOn,
      thresholds,
      unit,
    })
  }, [data, startDate, endDate, weekStartsOn, thresholds, unit])

  const [internalFocusedCoord, setInternalFocusedCoord] = React.useState<
    [number, number] | null
  >(null)

  const selectedCoord = selectedDate
    ? (layout.dateToCoord[selectedDate] ?? null)
    : null
  const focusedCoord =
    internalFocusedCoord ?? selectedCoord ?? layout.defaultCoord

  const cellRefs = React.useRef<Map<string, HTMLTableCellElement>>(new Map())

  const handleSelect = React.useCallback(
    (cell: HeatmapCell) => {
      if (!cell.inRange) return
      setSelectedDate(cell.date)
      setInternalFocusedCoord([cell.dayIndex, cell.weekIndex])
      onDaySelect?.({
        date: cell.date,
        count: cell.count,
        level: cell.level,
      })
    },
    [setSelectedDate, onDaySelect]
  )

  const handleCellKeyDown = React.useCallback(
    (
      e: React.KeyboardEvent<HTMLTableCellElement>,
      row: number,
      col: number
    ) => {
      const currentCell = layout.rows[row]?.[col]
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault()
        if (currentCell && currentCell.inRange) {
          handleSelect(currentCell)
        }
        return
      }

      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Home",
          "End",
          "PageUp",
          "PageDown",
        ].includes(e.key)
      ) {
        e.preventDefault()
        const [nextRow, nextCol] = stepHeatmapCoordinate(
          [row, col],
          e.key,
          layout
        )
        setInternalFocusedCoord([nextRow, nextCol])
        const key = `${nextRow}-${nextCol}`
        const cellEl = cellRefs.current.get(key)
        cellEl?.focus()
      }
    },
    [layout, handleSelect]
  )

  // Map month labels by week index
  const monthByWeek = React.useMemo(() => {
    const map = new Map<number, string>()
    for (const m of layout.monthLabels) {
      map.set(m.weekIndex, m.monthName)
    }
    return map
  }, [layout.monthLabels])

  // Compute selected cell if any
  const selectedCell = React.useMemo(() => {
    if (!selectedDate) return null
    return (
      layout.weeks.flat().find((c) => c.date === selectedDate && c.inRange) ??
      null
    )
  }, [layout, selectedDate])

  const summaryText = React.useMemo(() => {
    if (!showSummary) return null
    if (typeof summary === "function") {
      return summary(layout.totalCount, layout.startDate, layout.endDate)
    }
    if (summary !== undefined) {
      return summary
    }
    return `${layout.totalCount.toLocaleString()} ${unit} in the last year`
  }, [showSummary, summary, layout, unit])

  return (
    <div
      data-slot="activity-heatmap"
      className={cn("flex flex-col gap-2.5", className)}
      {...props}
    >
      {/* Header Summary */}
      {(showSummary || selectedCell) && (
        <div className="flex items-center justify-between gap-4 text-sm">
          {summaryText && (
            <span className="font-medium text-foreground">{summaryText}</span>
          )}
          {selectedCell && (
            <span className="ml-auto text-xs text-muted-foreground">
              {selectedCell.count}{" "}
              {selectedCell.count === 1
                ? unit.endsWith("s")
                  ? unit.slice(0, -1)
                  : unit
                : unit}{" "}
              on {formatDateLabel(selectedCell.date, true)}
            </span>
          )}
        </div>
      )}

      {/* Heatmap Grid */}
      <div className="w-full overflow-x-auto pb-1">
        <table
          role="grid"
          aria-label={ariaLabel}
          aria-rowcount={7}
          aria-colcount={layout.weeks.length + (showWeekdayLabels ? 1 : 0)}
          className="border-separate border-spacing-[3px] text-left select-none"
        >
          {showMonthLabels && (
            <thead>
              <tr role="row" className="text-[10px] text-muted-foreground">
                {showWeekdayLabels && (
                  <th
                    role="presentation"
                    aria-hidden="true"
                    className="w-7 min-w-7 font-normal"
                  />
                )}
                {layout.weeks.map((_, weekIdx) => {
                  const month = monthByWeek.get(weekIdx)
                  return (
                    <th
                      key={weekIdx}
                      role="columnheader"
                      aria-colindex={weekIdx + (showWeekdayLabels ? 2 : 1)}
                      className="h-4 min-w-[12px] p-0 leading-none font-normal"
                    >
                      {month ?? ""}
                    </th>
                  )
                })}
              </tr>
            </thead>
          )}
          <tbody>
            {layout.rows.map((rowCells, rowIdx) => {
              const weekday = layout.weekdayLabels[rowIdx]
              // Show label on alternating days (e.g. Mon, Wed, Fri) to avoid vertical clutter
              const showThisLabel = rowIdx % 2 === 1

              return (
                <tr
                  key={rowIdx}
                  role="row"
                  aria-rowindex={rowIdx + 1}
                  className="h-3"
                >
                  {showWeekdayLabels && (
                    <th
                      role="rowheader"
                      aria-colindex={1}
                      className="w-7 min-w-7 pr-1.5 text-right text-[10px] leading-none font-normal text-muted-foreground"
                    >
                      {showThisLabel ? weekday : ""}
                    </th>
                  )}
                  {rowCells.map((cell, colIdx) => {
                    if (!cell.inRange) {
                      return (
                        <td
                          key={cell.date + colIdx}
                          role="presentation"
                          aria-hidden="true"
                          tabIndex={-1}
                          className="pointer-events-none size-3 min-w-[12px] rounded-[2px] opacity-0"
                        />
                      )
                    }

                    const isFocused =
                      focusedCoord[0] === rowIdx && focusedCoord[1] === colIdx
                    const isSelected = selectedDate === cell.date
                    const colorClass =
                      levelColors?.[cell.level] ??
                      DEFAULT_LEVEL_CLASSES[cell.level] ??
                      DEFAULT_LEVEL_CLASSES[0]

                    return (
                      <td
                        key={cell.date}
                        ref={(el) => {
                          const key = `${rowIdx}-${colIdx}`
                          if (el) {
                            cellRefs.current.set(key, el)
                          } else {
                            cellRefs.current.delete(key)
                          }
                        }}
                        role="gridcell"
                        aria-colindex={colIdx + (showWeekdayLabels ? 2 : 1)}
                        aria-selected={isSelected}
                        aria-label={cell.label}
                        title={cell.label}
                        tabIndex={isFocused ? 0 : -1}
                        onClick={() => handleSelect(cell)}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIdx, colIdx)}
                        className={cn(
                          "size-3 min-w-[12px] cursor-pointer rounded-[2px] outline-hidden transition-colors",
                          colorClass,
                          "hover:ring-1 hover:ring-ring/60",
                          isSelected &&
                            "ring-2 ring-ring ring-offset-1 ring-offset-background",
                          isFocused &&
                            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                        )}
                      />
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend & Range */}
      {showLegend && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-muted-foreground">
          <span className="text-[11px]">
            {formatDateLabel(layout.startDate, false)} &ndash;{" "}
            {formatDateLabel(layout.endDate, true)}
          </span>
          <div
            className="flex items-center gap-1.5"
            aria-label="Activity intensity scale"
          >
            <span className="text-[11px]">Less</span>
            {[0, 1, 2, 3, 4].map((lvl) => (
              <span
                key={lvl}
                aria-label={`Level ${lvl}`}
                className={cn(
                  "size-3 rounded-[2px]",
                  levelColors?.[lvl] ?? DEFAULT_LEVEL_CLASSES[lvl]
                )}
              />
            ))}
            <span className="text-[11px]">More</span>
          </div>
        </div>
      )}
    </div>
  )
}
