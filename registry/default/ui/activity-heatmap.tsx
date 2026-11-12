"use client"

import * as React from "react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import { cn } from "@/registry/default/lib/utils"
import {
  buildHeatmapLayout,
  calculateTooltipPosition,
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
  showTooltip?: boolean
  renderTooltip?: (day: ActivityDay) => React.ReactNode
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
  showTooltip = true,
  renderTooltip,
  "aria-label": ariaLabel = "Activity heatmap",
  className,
  ...props
}: ActivityHeatmapProps) {
  const {
    ref: externalRef,
    onKeyDown: externalOnKeyDown,
    ...restDivProps
  } = props as React.ComponentProps<"div"> & { ref?: React.Ref<HTMLDivElement> }

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

  const tooltipId = React.useId()
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  React.useImperativeHandle(
    externalRef,
    () => containerRef.current as HTMLDivElement
  )

  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const tooltipRef = React.useRef<HTMLDivElement>(null)

  const [hoveredState, setHoveredState] = React.useState<{
    date: string
    element: HTMLTableCellElement
  } | null>(null)

  const [focusedState, setFocusedState] = React.useState<{
    date: string
    element: HTMLTableCellElement
  } | null>(null)

  const [dismissedDate, setDismissedDate] = React.useState<string | null>(null)

  const activeState = hoveredState ?? focusedState

  const activeCell = React.useMemo(() => {
    if (!activeState) return null
    const cell =
      layout.weeks
        .flat()
        .find((c) => c.date === activeState.date && c.inRange) ?? null
    if (!cell) return null
    return { cell, element: activeState.element }
  }, [layout, activeState])

  const isTooltipActive = Boolean(
    showTooltip && activeCell && dismissedDate !== activeCell.cell.date
  )

  const [tooltipPos, setTooltipPos] = React.useState<{
    top: number
    left: number
    placement: "top" | "bottom"
  } | null>(null)

  const updateTooltipPosition = React.useCallback(() => {
    if (!activeCell || !containerRef.current) {
      setTooltipPos(null)
      return
    }

    const cellEl = activeCell.element
    const containerEl = containerRef.current
    const scrollEl = scrollContainerRef.current

    const pos = calculateTooltipPosition({
      cellRect: cellEl.getBoundingClientRect(),
      containerRect: containerEl.getBoundingClientRect(),
      scrollRect: scrollEl?.getBoundingClientRect(),
      tooltipWidth: tooltipRef.current?.offsetWidth || 140,
      tooltipHeight: tooltipRef.current?.offsetHeight || 44,
      margin: 8,
    })

    if (!pos.visible) {
      setTooltipPos(null)
      return
    }

    setTooltipPos({
      top: pos.top,
      left: pos.left,
      placement: pos.placement,
    })
  }, [activeCell])

  React.useLayoutEffect(() => {
    if (isTooltipActive) updateTooltipPosition()
  }, [isTooltipActive, updateTooltipPosition])

  React.useEffect(() => {
    if (!isTooltipActive) return
    const handleResize = () => updateTooltipPosition()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [isTooltipActive, updateTooltipPosition])

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
      if (e.key === "Escape") {
        e.preventDefault()
        if (activeCell) {
          setDismissedDate(activeCell.cell.date)
        }
        return
      }

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
    [layout, handleSelect, activeCell]
  )

  const handleContainerKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      externalOnKeyDown?.(e)
      if (e.defaultPrevented) return

      if (e.key === "Escape" && activeCell) {
        e.preventDefault()
        setDismissedDate(activeCell.cell.date)
      }
    },
    [activeCell, externalOnKeyDown]
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
      ref={containerRef}
      data-slot="activity-heatmap"
      className={cn("relative flex flex-col gap-2.5", className)}
      onKeyDown={handleContainerKeyDown}
      {...restDivProps}
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
      <div
        ref={scrollContainerRef}
        className="w-full overflow-x-auto pb-1"
        onScroll={updateTooltipPosition}
      >
        <table
          role="grid"
          aria-label={ariaLabel}
          aria-rowcount={7}
          aria-colcount={layout.weeks.length + (showWeekdayLabels ? 1 : 0)}
          className="border-separate border-spacing-[3px] text-left select-none"
          onMouseLeave={() => setHoveredState(null)}
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
                      aria-hidden={month ? undefined : true}
                      className="relative h-4 min-w-[12px] p-0 leading-none font-normal"
                    >
                      {month && (
                        <span className="absolute top-0 left-0 whitespace-nowrap">
                          {month}
                        </span>
                      )}
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
                      {showThisLabel ? (
                        weekday
                      ) : (
                        <span className="sr-only">{weekday}</span>
                      )}
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

                    const isCellActive = activeCell?.cell.date === cell.date
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
                        aria-describedby={
                          isTooltipActive && isCellActive
                            ? tooltipId
                            : undefined
                        }
                        tabIndex={isFocused ? 0 : -1}
                        onClick={() => handleSelect(cell)}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIdx, colIdx)}
                        onMouseEnter={(e) => {
                          setHoveredState({
                            date: cell.date,
                            element: e.currentTarget,
                          })
                          setDismissedDate(null)
                        }}
                        onFocus={(e) => {
                          setFocusedState({
                            date: cell.date,
                            element: e.currentTarget,
                          })
                          setInternalFocusedCoord([rowIdx, colIdx])
                          setDismissedDate(null)
                        }}
                        onBlur={() => {
                          setFocusedState((prev) =>
                            prev?.date === cell.date ? null : prev
                          )
                        }}
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
            role="group"
            className="flex items-center gap-1.5"
            aria-label="Activity intensity scale"
          >
            <span className="text-[11px]">Less</span>
            {[0, 1, 2, 3, 4].map((lvl) => (
              <span
                key={lvl}
                role="img"
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

      {/* Floating Tooltip */}
      {isTooltipActive && activeCell && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          data-slot="activity-heatmap-tooltip"
          style={{
            top: tooltipPos?.top ?? 0,
            left: tooltipPos?.left ?? 0,
            transform:
              tooltipPos?.placement === "bottom"
                ? "translate(-50%, 0)"
                : "translate(-50%, -100%)",
            opacity: tooltipPos ? 1 : 0,
          }}
          className={cn(
            "pointer-events-none absolute z-50 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md"
          )}
        >
          {renderTooltip ? (
            renderTooltip(activeCell.cell)
          ) : (
            <div className="flex flex-col gap-0.5 text-center">
              <span className="font-medium text-popover-foreground">
                {activeCell.cell.count === 0
                  ? `No ${unit}`
                  : `${activeCell.cell.count.toLocaleString()} ${
                      activeCell.cell.count === 1
                        ? unit.endsWith("s")
                          ? unit.slice(0, -1)
                          : unit
                        : unit
                    }`}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {formatDateLabel(activeCell.cell.date, true)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
