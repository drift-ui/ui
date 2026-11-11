export interface ActivityDay {
  date: string
  count: number
  level: number
}

export interface ActivityDayInput {
  date: string
  count: number
  level?: number
}

export interface HeatmapCell {
  date: string
  count: number
  level: number
  weekIndex: number
  dayIndex: number // 0..6 relative to weekStartsOn
  dayOfWeek: number // 0..6 (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  inRange: boolean
  label: string
}

export interface HeatmapMonthLabel {
  monthName: string
  weekIndex: number
}

export interface HeatmapLayout {
  weeks: HeatmapCell[][]
  rows: HeatmapCell[][]
  monthLabels: HeatmapMonthLabel[]
  weekdayLabels: string[]
  totalCount: number
  totalDays: number
  startDate: string
  endDate: string
  maxCount: number
  defaultCoord: [number, number]
  dateToCoord: Record<string, [number, number]>
}

export interface BuildHeatmapOptions {
  data: ActivityDayInput[]
  startDate?: string
  endDate?: string
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  thresholds?: number[]
  unit?: string
}

const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

const MONTH_NAMES_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const WEEKDAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/**
 * Parses a "YYYY-MM-DD" calendar date in UTC to avoid time-zone shifts.
 */
export function parseUTCDate(dateStr: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim())
  if (!match) {
    const fallback = new Date(dateStr)
    if (isNaN(fallback.getTime())) {
      return new Date(Date.UTC(2000, 0, 1))
    }
    return new Date(
      Date.UTC(
        fallback.getUTCFullYear(),
        fallback.getUTCMonth(),
        fallback.getUTCDate()
      )
    )
  }
  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10) - 1
  const day = parseInt(match[3], 10)
  return new Date(Date.UTC(year, month, day))
}

/**
 * Formats a Date object as a "YYYY-MM-DD" string in UTC.
 */
export function formatUTCDate(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  const d = String(date.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/**
 * Adds integer days to a Date in UTC.
 */
export function addUTCDays(date: Date, days: number): Date {
  const result = new Date(date.getTime())
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

/**
 * Returns UTC day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday).
 */
export function getUTCDayOfWeek(date: Date): number {
  return date.getUTCDay()
}

/**
 * Formats a human-readable date label in UTC (e.g., "October 31" or "October 31, 2026").
 */
export function formatDateLabel(
  dateInput: string | Date,
  includeYear = true
): string {
  const d = typeof dateInput === "string" ? parseUTCDate(dateInput) : dateInput
  const month = MONTH_NAMES_FULL[d.getUTCMonth()]
  const day = d.getUTCDate()
  if (includeYear) {
    return `${month} ${day}, ${d.getUTCFullYear()}`
  }
  return `${month} ${day}`
}

/**
 * Formats an accessible cell label such as "7 contributions on October 31" or "No contributions on October 31".
 */
export function formatCellAccessibleLabel(
  count: number,
  dateStr: string,
  unit = "contributions"
): string {
  const formattedDate = formatDateLabel(dateStr, false)
  if (count <= 0) {
    return `No ${unit} on ${formattedDate}`
  }
  const singularUnit = unit.endsWith("s") ? unit.slice(0, -1) : unit
  const unitLabel = count === 1 ? singularUnit : unit
  return `${count} ${unitLabel} on ${formattedDate}`
}

/**
 * Maps an activity count to an intensity level from 0 to 4.
 */
export function calculateIntensityLevel(
  count: number,
  maxCount: number,
  thresholds?: number[]
): number {
  if (!Number.isFinite(count) || count <= 0) return 0

  if (thresholds && thresholds.length === 4) {
    if (count < thresholds[0]) return 0
    if (count < thresholds[1]) return 1
    if (count < thresholds[2]) return 2
    if (count < thresholds[3]) return 3
    return 4
  }

  if (!Number.isFinite(maxCount) || maxCount <= 0) {
    return count > 0 ? 1 : 0
  }

  const ratio = count / maxCount
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

/**
 * Returns the weekday names ordered according to weekStartsOn (0 = Sun, 1 = Mon, etc.).
 */
export function getWeekdayLabels(
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0
): string[] {
  const labels: string[] = []
  for (let i = 0; i < 7; i++) {
    const day = (weekStartsOn + i) % 7
    labels.push(WEEKDAY_NAMES_SHORT[day])
  }
  return labels
}

/**
 * Builds the full calendar heatmap layout: week columns, weekday rows, month labels, and metrics.
 */
export function buildHeatmapLayout(
  options: BuildHeatmapOptions
): HeatmapLayout {
  const {
    data = [],
    startDate: startDateProp,
    endDate: endDateProp,
    weekStartsOn = 0,
    thresholds,
    unit = "contributions",
  } = options

  // Aggregate duplicate dates and find data bounds
  const dataMap = new Map<string, { count: number; level?: number }>()
  let maxDataCount = 0
  let earliestDataDate: string | null = null
  let latestDataDate: string | null = null

  for (const item of data) {
    if (!item?.date) continue
    const dateStr = item.date.trim()
    const sanitizedCount =
      Number.isFinite(item.count) && item.count > 0 ? item.count : 0
    const existing = dataMap.get(dateStr)

    if (existing) {
      existing.count += sanitizedCount
      if (item.level !== undefined) existing.level = item.level
    } else {
      dataMap.set(dateStr, {
        count: sanitizedCount,
        level: item.level,
      })
    }

    const currentTotal = dataMap.get(dateStr)!.count
    if (currentTotal > maxDataCount) {
      maxDataCount = currentTotal
    }

    if (!earliestDataDate || dateStr < earliestDataDate) {
      earliestDataDate = dateStr
    }
    if (!latestDataDate || dateStr > latestDataDate) {
      latestDataDate = dateStr
    }
  }

  // Determine end date
  let effectiveEnd: Date
  if (endDateProp) {
    effectiveEnd = parseUTCDate(endDateProp)
  } else if (latestDataDate) {
    effectiveEnd = parseUTCDate(latestDataDate)
  } else {
    const now = new Date()
    effectiveEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    )
  }

  // Determine start date (default to 364 days before end date -> 52 full weeks)
  let effectiveStart: Date
  if (startDateProp) {
    effectiveStart = parseUTCDate(startDateProp)
  } else {
    effectiveStart = addUTCDays(effectiveEnd, -364)
  }

  if (effectiveStart > effectiveEnd) {
    const temp = effectiveStart
    effectiveStart = effectiveEnd
    effectiveEnd = temp
  }

  const startDateStr = formatUTCDate(effectiveStart)
  const endDateStr = formatUTCDate(effectiveEnd)

  // Align start to the weekStartsOn boundary
  const startDayOfWeek = getUTCDayOfWeek(effectiveStart)
  const daysBeforeStart = (((startDayOfWeek - weekStartsOn) % 7) + 7) % 7
  const calendarStart = addUTCDays(effectiveStart, -daysBeforeStart)

  // Align end to the week boundary end
  const endDayOfWeek = getUTCDayOfWeek(effectiveEnd)
  const daysAfterEnd = (6 - ((((endDayOfWeek - weekStartsOn) % 7) + 7) % 7)) % 7
  const calendarEnd = addUTCDays(effectiveEnd, daysAfterEnd)

  // Calculate total days on calendar grid
  const totalCalendarDays =
    Math.round(
      (calendarEnd.getTime() - calendarStart.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
  const weekCount = Math.ceil(totalCalendarDays / 7)

  // Calculate maxCount for in-range days only
  let inRangeMaxCount = 0
  let totalCount = 0
  let totalDays = 0

  for (let i = 0; i < totalCalendarDays; i++) {
    const current = addUTCDays(calendarStart, i)
    const dateStr = formatUTCDate(current)
    const inRange = dateStr >= startDateStr && dateStr <= endDateStr
    if (inRange) {
      totalDays++
      const dayData = dataMap.get(dateStr)
      const count = dayData?.count ?? 0
      totalCount += count
      if (count > inRangeMaxCount) {
        inRangeMaxCount = count
      }
    }
  }

  const effectiveMaxCount =
    maxDataCount > 0 ? maxDataCount : inRangeMaxCount > 0 ? inRangeMaxCount : 0

  // Construct weeks and rows
  const weeks: HeatmapCell[][] = []
  const rows: HeatmapCell[][] = Array.from({ length: 7 }, () => [])
  const dateToCoord: Record<string, [number, number]> = {}
  let defaultCoord: [number, number] = [0, 0]

  for (let w = 0; w < weekCount; w++) {
    const weekCells: HeatmapCell[] = []
    for (let d = 0; d < 7; d++) {
      const dayOffset = w * 7 + d
      const current = addUTCDays(calendarStart, dayOffset)
      const dateStr = formatUTCDate(current)
      const inRange = dateStr >= startDateStr && dateStr <= endDateStr
      const dayData = inRange ? dataMap.get(dateStr) : undefined
      const count = dayData?.count ?? 0
      const level = !inRange
        ? 0
        : dayData?.level !== undefined
          ? Math.max(0, Math.min(4, Math.floor(dayData.level)))
          : calculateIntensityLevel(count, effectiveMaxCount, thresholds)

      const label = inRange
        ? formatCellAccessibleLabel(count, dateStr, unit)
        : ""

      const cell: HeatmapCell = {
        date: dateStr,
        count,
        level,
        weekIndex: w,
        dayIndex: d,
        dayOfWeek: getUTCDayOfWeek(current),
        inRange,
        label,
      }

      if (inRange) {
        dateToCoord[dateStr] = [d, w]
        defaultCoord = [d, w]
      }

      weekCells.push(cell)
      rows[d].push(cell)
    }
    weeks.push(weekCells)
  }

  // Construct month labels
  const monthLabels: HeatmapMonthLabel[] = []
  let lastLabeledMonth = -1
  let lastLabeledWeek = -99

  for (let w = 0; w < weeks.length; w++) {
    // Find the first in-range day in this week, or the first day
    const firstDay = weeks[w].find((c) => c.inRange) ?? weeks[w][0]
    const d = parseUTCDate(firstDay.date)
    const month = d.getUTCMonth()

    if (month !== lastLabeledMonth && w - lastLabeledWeek >= 2) {
      monthLabels.push({
        monthName: MONTH_NAMES_SHORT[month],
        weekIndex: w,
      })
      lastLabeledMonth = month
      lastLabeledWeek = w
    }
  }

  const weekdayLabels = getWeekdayLabels(weekStartsOn)

  return {
    weeks,
    rows,
    monthLabels,
    weekdayLabels,
    totalCount,
    totalDays,
    startDate: startDateStr,
    endDate: endDateStr,
    maxCount: effectiveMaxCount,
    defaultCoord,
    dateToCoord,
  }
}

/**
 * 2D navigation helper that advances coordinates while ensuring the target lands on an in-range cell.
 */
export function stepHeatmapCoordinate(
  current: [number, number],
  key: string,
  layout: HeatmapLayout
): [number, number] {
  const [currentRow, currentCol] = current
  const rowCount = 7
  const colCount = layout.weeks.length

  let targetRow = currentRow
  let targetCol = currentCol

  switch (key) {
    case "ArrowUp":
      targetRow = Math.max(0, currentRow - 1)
      break
    case "ArrowDown":
      targetRow = Math.min(rowCount - 1, currentRow + 1)
      break
    case "ArrowLeft":
      targetCol = Math.max(0, currentCol - 1)
      break
    case "ArrowRight":
      targetCol = Math.min(colCount - 1, currentCol + 1)
      break
    case "Home":
      targetCol = 0
      break
    case "End":
      targetCol = colCount - 1
      break
    case "PageUp":
      targetRow = 0
      break
    case "PageDown":
      targetRow = rowCount - 1
      break
    default:
      return current
  }

  // If the target cell is inRange, return it
  if (layout.rows[targetRow]?.[targetCol]?.inRange) {
    return [targetRow, targetCol]
  }

  // If target cell is not in range, search along the column or row for the closest inRange cell
  // First search same column:
  for (let r = 0; r < rowCount; r++) {
    if (layout.rows[r]?.[targetCol]?.inRange) {
      return [r, targetCol]
    }
  }

  // If entire column is out of range, search adjacent columns
  const colStep = targetCol > currentCol ? 1 : -1
  for (let c = targetCol; c >= 0 && c < colCount; c += colStep) {
    if (layout.rows[targetRow]?.[c]?.inRange) {
      return [targetRow, c]
    }
  }

  // Fallback: stay on current
  return current
}

export interface TooltipPositionOptions {
  cellRect: {
    top: number
    left: number
    right?: number
    bottom?: number
    width: number
    height: number
  }
  containerRect: { top: number; left: number; width: number; height: number }
  scrollRect?: { left: number; right: number; width: number }
  tooltipWidth?: number
  tooltipHeight?: number
  margin?: number
}

export interface TooltipPositionResult {
  top: number
  left: number
  placement: "top" | "bottom"
  visible: boolean
}

/**
 * Calculates absolute coordinates and placement for a floating tooltip relative to
 * the heatmap root container, clamping horizontally and flipping vertically near edges.
 */
export function calculateTooltipPosition({
  cellRect,
  containerRect,
  scrollRect,
  tooltipWidth = 140,
  tooltipHeight = 44,
  margin = 8,
}: TooltipPositionOptions): TooltipPositionResult {
  const cellRight = cellRect.right ?? cellRect.left + cellRect.width
  const cellBottom = cellRect.bottom ?? cellRect.top + cellRect.height

  if (scrollRect && scrollRect.width > 0) {
    if (
      cellRight < scrollRect.left + 2 ||
      cellRect.left > scrollRect.right - 2
    ) {
      return { top: 0, left: 0, placement: "top", visible: false }
    }
  }

  const halfWidth = tooltipWidth / 2
  const rawCenterX = cellRect.left - containerRect.left + cellRect.width / 2

  let clampedLeft = rawCenterX
  if (containerRect.width > tooltipWidth + margin * 2) {
    clampedLeft = Math.max(
      halfWidth + margin,
      Math.min(containerRect.width - halfWidth - margin, rawCenterX)
    )
  }

  const spaceAbove = cellRect.top - containerRect.top
  const placement: "top" | "bottom" =
    spaceAbove < tooltipHeight + 12 ? "bottom" : "top"

  const top =
    placement === "top"
      ? cellRect.top - containerRect.top - margin
      : cellBottom - containerRect.top + margin

  return {
    top,
    left: clampedLeft,
    placement,
    visible: true,
  }
}
