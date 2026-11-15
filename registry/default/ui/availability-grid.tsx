"use client"

import * as React from "react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  convertAvailabilityTimeZone,
  DEFAULT_REFERENCE_DATE,
  formatSlotKey,
  formatSlotLabel,
  formatTimeLabel,
  generateTimeSlots,
  getAvailabilityAnnouncement,
  getAvailabilitySummary,
  rangesToSlots,
  setSlotsSelected,
  toggleSlot,
  WEEKDAY_NAMES,
  WEEKDAYS,
  type AvailabilityRange,
  type Weekday,
} from "@/registry/default/lib/availability-grid-utils"
import { cn } from "@/registry/default/lib/utils"

const EMPTY_RANGES: AvailabilityRange[] = []

export type AvailabilityGridProps = Omit<
  React.ComponentProps<"div">,
  "value" | "defaultValue" | "onChange"
> & {
  value?: AvailabilityRange[]
  defaultValue?: AvailabilityRange[]
  onValueChange?: (value: AvailabilityRange[]) => void
  timeZone?: string
  slotMinutes?: number
  startHour?: number
  endHour?: number
  weekdays?: Weekday[]
  referenceDate?: Date
  hourCycle?: 12 | 24
  disabled?: boolean
  readOnly?: boolean
  showSummary?: boolean
  showActions?: boolean
  clearLabel?: string
  selectAllLabel?: string
  "aria-label"?: string
}

function areRangesEqual(
  a: AvailabilityRange[],
  b: AvailabilityRange[]
): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].day !== b[i].day ||
      a[i].start !== b[i].start ||
      a[i].end !== b[i].end
    ) {
      return false
    }
  }
  return true
}

export function AvailabilityGrid({
  value,
  defaultValue = EMPTY_RANGES,
  onValueChange,
  timeZone,
  slotMinutes = 30,
  startHour = 8,
  endHour = 20,
  weekdays = WEEKDAYS,
  referenceDate = DEFAULT_REFERENCE_DATE,
  hourCycle = 24,
  disabled = false,
  readOnly = false,
  showSummary = true,
  showActions = true,
  clearLabel = "Clear",
  selectAllLabel = "Select all",
  "aria-label": ariaLabel = "Weekly availability schedule",
  className,
  ...props
}: AvailabilityGridProps) {
  const { value: ranges, setValue: setRanges } = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })

  const currentRanges = ranges ?? EMPTY_RANGES
  const prevRangesRef = React.useRef(currentRanges)
  const prevTimeZoneRef = React.useRef(timeZone)

  React.useEffect(() => {
    const prevZone = prevTimeZoneRef.current
    const rangesChanged = !areRangesEqual(prevRangesRef.current, currentRanges)
    prevRangesRef.current = currentRanges

    if (timeZone && prevZone && prevZone !== timeZone) {
      prevTimeZoneRef.current = timeZone
      if (!rangesChanged) {
        const converted = convertAvailabilityTimeZone(
          currentRanges,
          prevZone,
          timeZone,
          referenceDate
        )
        setRanges(converted)
        prevRangesRef.current = converted
      }
    } else {
      prevTimeZoneRef.current = timeZone
    }
  }, [timeZone, currentRanges, referenceDate, setRanges])

  const timeSlots = React.useMemo(
    () => generateTimeSlots(startHour, endHour, slotMinutes),
    [startHour, endHour, slotMinutes]
  )

  const activeSlots = React.useMemo(
    () => rangesToSlots(currentRanges, slotMinutes),
    [currentRanges, slotMinutes]
  )

  const [focusedCoord, setFocusedCoord] = React.useState<[number, number]>([
    0, 0,
  ])
  const anchorCoordRef = React.useRef<[number, number] | null>(null)
  const [dragState, setDragState] = React.useState<{
    isDragging: boolean
    mode: "select" | "deselect"
    anchor: [number, number]
  } | null>(null)

  React.useEffect(() => {
    if (!dragState?.isDragging) return
    const handleGlobalPointerUp = () => {
      setDragState(null)
    }
    window.addEventListener("pointerup", handleGlobalPointerUp)
    return () => {
      window.removeEventListener("pointerup", handleGlobalPointerUp)
    }
  }, [dragState?.isDragging])

  const gridRef = React.useRef<HTMLTableElement>(null)

  const focusCell = React.useCallback(
    (row: number, col: number) => {
      const clampedRow = Math.max(0, Math.min(timeSlots.length - 1, row))
      const clampedCol = Math.max(0, Math.min(weekdays.length - 1, col))
      setFocusedCoord([clampedRow, clampedCol])
      const cell = gridRef.current?.querySelector<HTMLElement>(
        `[data-row="${clampedRow}"][data-col="${clampedCol}"]`
      )
      cell?.focus()
    },
    [timeSlots.length, weekdays.length]
  )

  const handlePointerDown = (
    e: React.PointerEvent<HTMLTableCellElement>,
    day: Weekday,
    time: string,
    row: number,
    col: number
  ) => {
    if (disabled || readOnly || e.button !== 0) return
    e.preventDefault()
    focusCell(row, col)
    anchorCoordRef.current = [row, col]

    const isSelected = activeSlots.has(formatSlotKey(day, time))
    const mode = isSelected ? "deselect" : "select"

    const updated = toggleSlot(currentRanges, day, time, slotMinutes)
    setRanges(updated)

    setDragState({
      isDragging: true,
      mode,
      anchor: [row, col],
    })

    if (e.pointerType === "touch") {
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // Ignore if pointer capture is not supported
      }
    }
  }

  const handlePointerEnter = (
    day: Weekday,
    time: string,
    row: number,
    col: number
  ) => {
    if (!dragState?.isDragging || disabled || readOnly) return
    setFocusedCoord([row, col])
    const key = formatSlotKey(day, time)
    const has = activeSlots.has(key)

    if (
      (dragState.mode === "select" && !has) ||
      (dragState.mode === "deselect" && has)
    ) {
      const updated = setSlotsSelected(
        currentRanges,
        [{ day, time }],
        dragState.mode === "select",
        slotMinutes
      )
      setRanges(updated)
    }
  }

  const handlePointerUp = () => {
    if (dragState?.isDragging) {
      setDragState(null)
    }
  }

  const handleTouchMove = (e: React.PointerEvent<HTMLTableElement>) => {
    if (
      !dragState?.isDragging ||
      disabled ||
      readOnly ||
      e.pointerType !== "touch"
    )
      return

    const element = document.elementFromPoint(e.clientX, e.clientY)
    const cell = element?.closest<HTMLTableCellElement>(
      "[data-slot='availability-cell']"
    )
    if (!cell) return

    const d = cell.getAttribute("data-day") as Weekday
    const t = cell.getAttribute("data-time") as string
    const r = Number(cell.getAttribute("data-row"))
    const c = Number(cell.getAttribute("data-col"))

    if (d && t && !Number.isNaN(r) && !Number.isNaN(c)) {
      handlePointerEnter(d, t, r, c)
    }
  }

  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLTableCellElement>,
    row: number,
    col: number,
    day: Weekday,
    time: string
  ) => {
    if (disabled) return

    const isShift = e.shiftKey
    let targetRow = row
    let targetCol = col
    let handled = false

    switch (e.key) {
      case "ArrowUp":
        targetRow = Math.max(0, row - 1)
        handled = true
        break
      case "ArrowDown":
        targetRow = Math.min(timeSlots.length - 1, row + 1)
        handled = true
        break
      case "ArrowLeft":
        targetCol = Math.max(0, col - 1)
        handled = true
        break
      case "ArrowRight":
        targetCol = Math.min(weekdays.length - 1, col + 1)
        handled = true
        break
      case "Home":
        targetCol = 0
        handled = true
        break
      case "End":
        targetCol = weekdays.length - 1
        handled = true
        break
      case "PageUp":
        targetRow = Math.max(0, row - 4)
        handled = true
        break
      case "PageDown":
        targetRow = Math.min(timeSlots.length - 1, row + 4)
        handled = true
        break
      case " ":
      case "Spacebar": {
        e.preventDefault()
        if (readOnly) return
        anchorCoordRef.current = [row, col]
        const updated = toggleSlot(currentRanges, day, time, slotMinutes)
        setRanges(updated)
        return
      }
      default:
        break
    }

    if (!handled) return
    e.preventDefault()

    if (isShift && !readOnly) {
      const [anchorRow, anchorCol] = anchorCoordRef.current ?? [row, col]
      anchorCoordRef.current = [anchorRow, anchorCol]

      const minRow = Math.min(anchorRow, targetRow)
      const maxRow = Math.max(anchorRow, targetRow)
      const minCol = Math.min(anchorCol, targetCol)
      const maxCol = Math.max(anchorCol, targetCol)

      const slotsToApply: { day: Weekday; time: string }[] = []
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          slotsToApply.push({
            day: weekdays[c],
            time: timeSlots[r],
          })
        }
      }

      const anchorDay = weekdays[anchorCol]
      const anchorTime = timeSlots[anchorRow]
      const anchorSelected = activeSlots.has(
        formatSlotKey(anchorDay, anchorTime)
      )
      const targetMode = anchorSelected ? true : true

      const updated = setSlotsSelected(
        currentRanges,
        slotsToApply,
        targetMode,
        slotMinutes
      )
      setRanges(updated)
    } else {
      anchorCoordRef.current = [targetRow, targetCol]
    }

    focusCell(targetRow, targetCol)
  }

  const handleSelectAll = () => {
    if (disabled || readOnly) return
    const allSlots: { day: Weekday; time: string }[] = []
    for (const d of weekdays) {
      for (const t of timeSlots) {
        allSlots.push({ day: d, time: t })
      }
    }
    setRanges(setSlotsSelected(currentRanges, allSlots, true, slotMinutes))
  }

  const handleClear = () => {
    if (disabled || readOnly) return
    setRanges([])
  }

  const announcement = React.useMemo(
    () => getAvailabilityAnnouncement(currentRanges),
    [currentRanges]
  )
  const summary = React.useMemo(
    () => getAvailabilitySummary(currentRanges),
    [currentRanges]
  )

  return (
    <div
      data-slot="availability-grid"
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground shadow-sm",
        disabled && "pointer-events-none opacity-60",
        className
      )}
      {...props}
      onPointerUp={(e) => {
        handlePointerUp()
        props.onPointerUp?.(e)
      }}
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      <div className="overflow-x-auto">
        <table
          ref={gridRef}
          role="grid"
          aria-multiselectable="true"
          aria-label={ariaLabel}
          onPointerMove={handleTouchMove}
          className="w-full border-collapse touch-none text-xs select-none"
        >
          <thead role="rowgroup">
            <tr role="row" className="border-b">
              <th
                role="columnheader"
                aria-label="Time slot"
                className="w-16 p-2 text-left font-mono font-medium text-muted-foreground"
              >
                Time
              </th>
              {weekdays.map((day) => (
                <th
                  key={day}
                  role="columnheader"
                  scope="col"
                  aria-label={WEEKDAY_NAMES[day]}
                  className="p-2 text-center font-medium text-muted-foreground"
                >
                  <span className="hidden sm:inline">
                    {WEEKDAY_NAMES[day].slice(0, 3)}
                  </span>
                  <span className="sm:hidden" aria-hidden="true">
                    {day.slice(0, 1)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup">
            {timeSlots.map((time, rowIdx) => {
              const formattedTime = formatTimeLabel(time, hourCycle)
              return (
                <tr key={time} role="row" className="border-b border-border/40">
                  <th
                    role="rowheader"
                    scope="row"
                    aria-label={formattedTime}
                    className="p-1.5 text-left font-mono text-[11px] text-muted-foreground"
                  >
                    {formattedTime}
                  </th>
                  {weekdays.map((day, colIdx) => {
                    const isSelected = activeSlots.has(formatSlotKey(day, time))
                    const isFocused =
                      focusedCoord[0] === rowIdx && focusedCoord[1] === colIdx

                    return (
                      <td
                        key={day}
                        role="gridcell"
                        data-slot="availability-cell"
                        data-day={day}
                        data-time={time}
                        data-row={rowIdx}
                        data-col={colIdx}
                        aria-selected={isSelected}
                        aria-label={formatSlotLabel(
                          day,
                          time,
                          slotMinutes,
                          hourCycle
                        )}
                        tabIndex={isFocused && !disabled ? 0 : -1}
                        onPointerDown={(e) =>
                          handlePointerDown(e, day, time, rowIdx, colIdx)
                        }
                        onPointerEnter={() =>
                          handlePointerEnter(day, time, rowIdx, colIdx)
                        }
                        onKeyDown={(e) =>
                          handleCellKeyDown(e, rowIdx, colIdx, day, time)
                        }
                        className={cn(
                          "h-7 min-w-[32px] border border-border/30 text-center outline-hidden transition-colors",
                          readOnly
                            ? "cursor-default"
                            : "cursor-pointer hover:ring-1 hover:ring-ring/50",
                          isSelected
                            ? "bg-primary font-semibold text-primary-foreground"
                            : "bg-muted/20 hover:bg-muted/50",
                          isFocused &&
                            "z-10 ring-2 ring-ring ring-offset-1 ring-offset-background"
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

      {(showSummary || showActions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2.5 text-xs text-muted-foreground">
          {showSummary && (
            <div>
              {summary.totalMinutes > 0 ? (
                <span>
                  <strong className="font-semibold text-foreground">
                    {summary.totalHours} hrs
                  </strong>{" "}
                  available across {summary.daysCount} days
                  {timeZone && ` (${timeZone})`}
                </span>
              ) : (
                <span>No hours selected</span>
              )}
            </div>
          )}

          {showActions && !readOnly && (
            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectAll}
                disabled={disabled}
                className="rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
              >
                {selectAllLabel}
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled || activeSlots.size === 0}
                className="rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
              >
                {clearLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
