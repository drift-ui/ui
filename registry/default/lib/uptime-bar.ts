export type UptimeStatus = "operational" | "degraded" | "down" | "no-data"

export interface UptimeDay {
  date: string | Date
  status: UptimeStatus | "no data"
  uptime?: number
  note?: string
}

export const STATUS_LABELS: Record<UptimeStatus, string> = {
  operational: "Operational",
  degraded: "Degraded performance",
  down: "Major outage",
  "no-data": "No data",
}

/**
 * Normalizes user-provided status strings into canonical UptimeStatus values.
 */
export function normalizeDayStatus(status: string): UptimeStatus {
  const s = status
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
  if (s === "operational") return "operational"
  if (s === "degraded") return "degraded"
  if (s === "down" || s === "outage") return "down"
  if (s === "no-data" || s === "nodata") return "no-data"
  return "no-data"
}

/**
 * Calculates overall uptime percentage over a list of days.
 * Days with 'no-data' do not count against uptime.
 */
export function calculateUptimePercentage(
  days: UptimeDay[],
  options?: { degradedWeight?: number; decimals?: number }
): number {
  const degradedWeight = options?.degradedWeight ?? 0.5
  const decimals = options?.decimals ?? 2

  const eligibleDays = days.filter(
    (day) => normalizeDayStatus(day.status) !== "no-data"
  )

  if (eligibleDays.length === 0) {
    return 100
  }

  let totalScore = 0
  for (const day of eligibleDays) {
    if (typeof day.uptime === "number" && !Number.isNaN(day.uptime)) {
      totalScore += Math.max(0, Math.min(100, day.uptime)) / 100
    } else {
      const norm = normalizeDayStatus(day.status)
      if (norm === "operational") {
        totalScore += 1
      } else if (norm === "degraded") {
        totalScore += degradedWeight
      } else {
        totalScore += 0
      }
    }
  }

  const percentage = (totalScore / eligibleDays.length) * 100
  const factor = Math.pow(10, decimals)
  return Math.round(percentage * factor) / factor
}

/**
 * Formats uptime percentage into human-readable string.
 */
export function formatUptimePercentage(
  percentage: number,
  decimals = 2
): string {
  return `${percentage.toFixed(decimals)}%`
}

/**
 * Formats a date into a localized string.
 */
export function formatDateLabel(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
): string {
  const dateOnly =
    typeof date === "string" && /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const d = dateOnly
    ? new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3])
      )
    : typeof date === "string"
      ? new Date(date)
      : date
  if (Number.isNaN(d.getTime())) {
    return String(date)
  }
  return new Intl.DateTimeFormat("en-US", options).format(d)
}

/**
 * Generates an accessible aria-label for an individual uptime segment.
 */
export function getSegmentAccessibleLabel(day: UptimeDay): string {
  const dateStr = formatDateLabel(day.date, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  const status = normalizeDayStatus(day.status)
  const statusText = STATUS_LABELS[status].toLowerCase()
  const noteText = day.note ? `: ${day.note}` : ""
  return `${dateStr}, ${statusText}${noteText}`
}

/**
 * Calculates next roving segment index based on keyboard arrow keys.
 */
export function getNextSegmentIndex(
  currentIndex: number,
  key: string,
  totalCount: number
): number {
  if (totalCount <= 0) return 0
  switch (key) {
    case "ArrowLeft":
      return Math.max(0, currentIndex - 1)
    case "ArrowRight":
      return Math.min(totalCount - 1, currentIndex + 1)
    case "Home":
      return 0
    case "End":
      return totalCount - 1
    default:
      return currentIndex
  }
}
