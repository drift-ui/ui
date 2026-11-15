import {
  WEEKDAYS,
  WEEKDAY_NAMES,
  type Weekday,
} from "@/registry/default/lib/recurrence"

export type { Weekday }
export { WEEKDAYS, WEEKDAY_NAMES }

export type WeeklyHoursRange = { day: Weekday; start: string; end: string }

export type TimeRange = { start: string; end: string }

const LAST_MINUTE = 23 * 60 + 59

export function toMinutes(time: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time)
  if (!match || Number(match[2]) > 59) return null
  const minutes = Number(match[1]) * 60 + Number(match[2])
  return minutes > LAST_MINUTE ? null : minutes
}

export function fromMinutes(minutes: number): string {
  const clamped = Math.max(0, Math.min(LAST_MINUTE, minutes))
  const hours = Math.floor(clamped / 60)
  return `${String(hours).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`
}

export function getDayRanges(
  value: WeeklyHoursRange[],
  day: Weekday
): WeeklyHoursRange[] {
  return value.filter((range) => range.day === day)
}

function replaceDay(
  value: WeeklyHoursRange[],
  day: Weekday,
  ranges: TimeRange[]
): WeeklyHoursRange[] {
  return [
    ...value.filter((range) => range.day !== day),
    ...ranges.map(({ start, end }) => ({ day, start, end })),
  ].sort((a, b) => WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day))
}

export function getNextRange(
  dayRanges: TimeRange[],
  defaultRange: TimeRange
): TimeRange | null {
  if (dayRanges.length === 0) return defaultRange
  const ends = dayRanges.map((range) => toMinutes(range.end))
  if (ends.some((end) => end === null)) return null
  const latestEnd = Math.max(...(ends as number[]))
  const start = latestEnd + 60
  if (start >= LAST_MINUTE) return null
  return { start: fromMinutes(start), end: fromMinutes(start + 60) }
}

export function setDayAvailable(
  value: WeeklyHoursRange[],
  day: Weekday,
  available: boolean,
  defaultRange: TimeRange
): WeeklyHoursRange[] {
  return replaceDay(value, day, available ? [defaultRange] : [])
}

export function addRange(
  value: WeeklyHoursRange[],
  day: Weekday,
  defaultRange: TimeRange
): WeeklyHoursRange[] {
  const dayRanges = getDayRanges(value, day)
  const next = getNextRange(dayRanges, defaultRange)
  if (!next) return value
  return replaceDay(value, day, [...dayRanges, next])
}

export function updateRange(
  value: WeeklyHoursRange[],
  day: Weekday,
  index: number,
  patch: Partial<TimeRange>
): WeeklyHoursRange[] {
  const dayRanges = getDayRanges(value, day).map((range, i) =>
    i === index ? { ...range, ...patch } : range
  )
  return replaceDay(value, day, dayRanges)
}

export function removeRange(
  value: WeeklyHoursRange[],
  day: Weekday,
  index: number
): WeeklyHoursRange[] {
  return replaceDay(
    value,
    day,
    getDayRanges(value, day).filter((_, i) => i !== index)
  )
}

export function copyDayToAvailableDays(
  value: WeeklyHoursRange[],
  fromDay: Weekday,
  days: Weekday[]
): WeeklyHoursRange[] {
  const source = getDayRanges(value, fromDay)
  return days.reduce(
    (next, day) =>
      day === fromDay || getDayRanges(next, day).length === 0
        ? next
        : replaceDay(next, day, source),
    value
  )
}

export function getRangeError(
  dayRanges: TimeRange[],
  index: number
): string | null {
  const range = dayRanges[index]
  const start = toMinutes(range.start)
  const end = toMinutes(range.end)
  if (start === null || end === null) return "Enter a start and end time"
  if (end <= start) return "End time must be after the start time"
  const overlaps = dayRanges.some((other, i) => {
    if (i === index) return false
    const otherStart = toMinutes(other.start)
    const otherEnd = toMinutes(other.end)
    if (otherStart === null || otherEnd === null) return false
    return start < otherEnd && otherStart < end
  })
  return overlaps ? "Overlaps another time range" : null
}
