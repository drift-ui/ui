import {
  WEEKDAYS,
  WEEKDAY_NAMES,
  type Weekday,
} from "@/registry/default/lib/recurrence"
import {
  getTimezoneOffset,
  parseOffsetMinutes,
} from "@/registry/default/lib/timezone-picker-utils"

export type { Weekday }
export { WEEKDAYS, WEEKDAY_NAMES }

export type AvailabilityRange = {
  day: Weekday
  start: string
  end: string
}

export type AvailabilityValue = AvailabilityRange[]

export const DEFAULT_REFERENCE_DATE = new Date("2026-01-05T00:00:00Z")

export function timeToMinutes(time: string): number {
  const parts = time.split(":")
  const hours = Number(parts[0]) || 0
  const minutes = Number(parts[1]) || 0
  return hours * 60 + minutes
}

export function minutesToTime(minutes: number): string {
  if (minutes >= 1440) return "24:00"
  const m = Math.max(0, minutes)
  const hours = Math.floor(m / 60)
  const mins = m % 60
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

export function formatTimeLabel(time: string, hourCycle: 12 | 24 = 24): string {
  if (hourCycle === 24) return time
  const total = timeToMinutes(time)
  const hours24 = Math.floor(total / 60) % 24
  const minutes = total % 60
  const period = hours24 >= 12 ? "PM" : "AM"
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`
}

export function formatSlotLabel(
  day: Weekday,
  time: string,
  slotMinutes: number,
  hourCycle: 12 | 24 = 24
): string {
  const dayName = WEEKDAY_NAMES[day] ?? day
  const startTimeLabel = formatTimeLabel(time, hourCycle)
  const endTime = minutesToTime(timeToMinutes(time) + slotMinutes)
  const endTimeLabel = formatTimeLabel(endTime, hourCycle)
  return `${dayName}, ${startTimeLabel} – ${endTimeLabel}`
}

export function generateTimeSlots(
  startHour = 8,
  endHour = 20,
  slotMinutes = 30
): string[] {
  if (slotMinutes <= 0) return []
  const slots: string[] = []
  const startMin = Math.max(0, startHour * 60)
  const endMin = Math.min(1440, endHour * 60)
  for (let min = startMin; min + slotMinutes <= endMin; min += slotMinutes) {
    slots.push(minutesToTime(min))
  }
  return slots
}

export function mergeRanges(ranges: AvailabilityRange[]): AvailabilityRange[] {
  const result: AvailabilityRange[] = []

  for (const day of WEEKDAYS) {
    const dayRanges = ranges
      .filter((r) => r.day === day)
      .map((r) => ({
        startMin: timeToMinutes(r.start),
        endMin: timeToMinutes(r.end),
      }))
      .filter((r) => r.startMin < r.endMin)
      .sort((a, b) => a.startMin - b.startMin)

    const merged: { startMin: number; endMin: number }[] = []
    for (const current of dayRanges) {
      const prev = merged[merged.length - 1]
      if (!prev) {
        merged.push({ ...current })
      } else if (current.startMin <= prev.endMin) {
        prev.endMin = Math.max(prev.endMin, current.endMin)
      } else {
        merged.push({ ...current })
      }
    }

    for (const m of merged) {
      result.push({
        day,
        start: minutesToTime(m.startMin),
        end: minutesToTime(m.endMin),
      })
    }
  }

  return result
}

export function formatSlotKey(day: Weekday, time: string): string {
  return `${day}|${time}`
}

export function parseSlotKey(key: string): { day: Weekday; time: string } {
  const [day, time] = key.split("|") as [Weekday, string]
  return { day, time }
}

export function rangesToSlots(
  ranges: AvailabilityRange[],
  slotMinutes = 30
): Set<string> {
  const slots = new Set<string>()
  if (slotMinutes <= 0) return slots

  for (const range of ranges) {
    const startMin = timeToMinutes(range.start)
    const endMin = timeToMinutes(range.end)
    if (endMin <= startMin) continue

    const firstSlotMin = Math.floor(startMin / slotMinutes) * slotMinutes
    for (let min = firstSlotMin; min < endMin; min += slotMinutes) {
      if (min + slotMinutes > startMin && min < endMin) {
        slots.add(formatSlotKey(range.day, minutesToTime(min)))
      }
    }
  }
  return slots
}

export function slotsToRanges(
  slots: Iterable<string>,
  slotMinutes = 30
): AvailabilityRange[] {
  if (slotMinutes <= 0) return []
  const byDay: Partial<Record<Weekday, number[]>> = {}

  for (const key of slots) {
    const { day, time } = parseSlotKey(key)
    if (!byDay[day]) byDay[day] = []
    byDay[day]!.push(timeToMinutes(time))
  }

  const ranges: AvailabilityRange[] = []
  for (const day of WEEKDAYS) {
    const minutesList = byDay[day]
    if (!minutesList || minutesList.length === 0) continue

    const sorted = [...new Set(minutesList)].sort((a, b) => a - b)
    let rangeStart = sorted[0]
    let rangeEnd = sorted[0] + slotMinutes

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i]
      if (current === rangeEnd) {
        rangeEnd += slotMinutes
      } else {
        ranges.push({
          day,
          start: minutesToTime(rangeStart),
          end: minutesToTime(rangeEnd),
        })
        rangeStart = current
        rangeEnd = current + slotMinutes
      }
    }
    ranges.push({
      day,
      start: minutesToTime(rangeStart),
      end: minutesToTime(rangeEnd),
    })
  }

  return ranges
}

export function isSlotSelected(
  ranges: AvailabilityRange[],
  day: Weekday,
  time: string,
  slotMinutes = 30
): boolean {
  const targetStart = timeToMinutes(time)
  const targetEnd = targetStart + slotMinutes
  return ranges.some(
    (range) =>
      range.day === day &&
      targetStart >= timeToMinutes(range.start) &&
      targetEnd <= timeToMinutes(range.end)
  )
}

export function setSlotsSelected(
  ranges: AvailabilityRange[],
  slotsToChange: { day: Weekday; time: string }[],
  select: boolean,
  slotMinutes = 30
): AvailabilityRange[] {
  const currentSlots = rangesToSlots(ranges, slotMinutes)
  for (const { day, time } of slotsToChange) {
    const key = formatSlotKey(day, time)
    if (select) {
      currentSlots.add(key)
    } else {
      currentSlots.delete(key)
    }
  }
  return slotsToRanges(currentSlots, slotMinutes)
}

export function toggleSlot(
  ranges: AvailabilityRange[],
  day: Weekday,
  time: string,
  slotMinutes = 30
): AvailabilityRange[] {
  const currentlySelected = isSlotSelected(ranges, day, time, slotMinutes)
  return setSlotsSelected(
    ranges,
    [{ day, time }],
    !currentlySelected,
    slotMinutes
  )
}

export function convertAvailabilityTimeZone(
  ranges: AvailabilityRange[],
  fromZone: string,
  toZone: string,
  referenceDate: Date = DEFAULT_REFERENCE_DATE
): AvailabilityRange[] {
  if (fromZone === toZone || ranges.length === 0) {
    return mergeRanges(ranges)
  }

  const fromOffset = parseOffsetMinutes(
    getTimezoneOffset(fromZone, referenceDate)
  )
  const toOffset = parseOffsetMinutes(getTimezoneOffset(toZone, referenceDate))
  const diffMinutes = toOffset - fromOffset

  if (diffMinutes === 0) {
    return mergeRanges(ranges)
  }

  const converted: AvailabilityRange[] = []
  const TOTAL_WEEK_MINUTES = 7 * 1440

  for (const range of ranges) {
    const dayIndex = WEEKDAYS.indexOf(range.day)
    if (dayIndex === -1) continue

    const startMin = timeToMinutes(range.start)
    const endMin = timeToMinutes(range.end)
    const duration = endMin - startMin
    if (duration <= 0) continue

    const weekStart = dayIndex * 1440 + startMin
    const shiftedStart = weekStart + diffMinutes

    const normStart =
      ((shiftedStart % TOTAL_WEEK_MINUTES) + TOTAL_WEEK_MINUTES) %
      TOTAL_WEEK_MINUTES
    const normEnd = normStart + duration

    if (normEnd > TOTAL_WEEK_MINUTES) {
      converted.push({
        day: "SU",
        start: minutesToTime(normStart % 1440),
        end: "24:00",
      })
      converted.push({
        day: "MO",
        start: "00:00",
        end: minutesToTime(normEnd - TOTAL_WEEK_MINUTES),
      })
    } else {
      const startDay = Math.floor(normStart / 1440)
      const endDay = Math.floor(normEnd / 1440)
      const dayIsSame = startDay === endDay || normEnd === (startDay + 1) * 1440

      if (dayIsSame) {
        converted.push({
          day: WEEKDAYS[startDay],
          start: minutesToTime(normStart % 1440),
          end: normEnd % 1440 === 0 ? "24:00" : minutesToTime(normEnd % 1440),
        })
      } else {
        converted.push({
          day: WEEKDAYS[startDay],
          start: minutesToTime(normStart % 1440),
          end: "24:00",
        })
        converted.push({
          day: WEEKDAYS[(startDay + 1) % 7],
          start: "00:00",
          end: minutesToTime(normEnd % 1440),
        })
      }
    }
  }

  return mergeRanges(converted)
}

export function getAvailabilitySummary(ranges: AvailabilityRange[]): {
  totalMinutes: number
  totalHours: number
  daysCount: number
} {
  const merged = mergeRanges(ranges)
  let totalMinutes = 0
  const activeDays = new Set<Weekday>()

  for (const range of merged) {
    const s = timeToMinutes(range.start)
    const e = timeToMinutes(range.end)
    if (e > s) {
      totalMinutes += e - s
      activeDays.add(range.day)
    }
  }

  return {
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    daysCount: activeDays.size,
  }
}

export function getAvailabilityAnnouncement(
  ranges: AvailabilityRange[]
): string {
  const { totalMinutes, daysCount } = getAvailabilitySummary(ranges)
  if (totalMinutes === 0) return "No availability selected"

  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  const timeStr = [
    hours > 0 ? `${hours} hr${hours === 1 ? "" : "s"}` : "",
    mins > 0 ? `${mins} min${mins === 1 ? "" : "s"}` : "",
  ]
    .filter(Boolean)
    .join(" ")

  return `${timeStr} available across ${daysCount} day${daysCount === 1 ? "" : "s"}`
}
