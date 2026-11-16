export type SnoozePresetId =
  | "later-today"
  | "this-evening"
  | "tomorrow"
  | "this-weekend"
  | "next-week"
  | "next-weekend"

export type SnoozePresetConfig = {
  id: string
  label: string
  date?: Date
  resolve?: (now: Date, timeZone?: string) => Date | null
}

export type SnoozePreset = SnoozePresetId | SnoozePresetConfig

export type ResolvedPreset = {
  id: string
  label: string
  date: Date
  timeLabel: string
}

export type SnoozeTimes = {
  morning?: string
  afternoon?: string
  evening?: string
  weekendDay?: number
  workweekDay?: number
}

export const DEFAULT_SNOOZE_PRESETS: SnoozePresetId[] = [
  "later-today",
  "tomorrow",
  "this-weekend",
  "next-week",
]

export const DEFAULT_SNOOZE_TIMES: Required<SnoozeTimes> = {
  morning: "09:00",
  afternoon: "13:00",
  evening: "18:00",
  weekendDay: 6, // Saturday (0 = Sunday, 6 = Saturday)
  workweekDay: 1, // Monday
}

type ZonedDateParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  weekday: number
}

function parseHourMinute(timeStr: string): { hour: number; minute: number } {
  const [h = "9", m = "0"] = timeStr.split(":")
  const hour = Number.parseInt(h, 10)
  const minute = Number.parseInt(m, 10)
  return {
    hour: Number.isFinite(hour) ? Math.min(Math.max(hour, 0), 23) : 9,
    minute: Number.isFinite(minute) ? Math.min(Math.max(minute, 0), 59) : 0,
  }
}

export function isValidTimeZone(timeZone?: string): boolean {
  if (!timeZone) return false
  try {
    new Intl.DateTimeFormat(undefined, { timeZone })
    return true
  } catch {
    return false
  }
}

export function getZonedDateTimeParts(
  date: Date,
  timeZone?: string
): ZonedDateParts {
  if (!timeZone || !isValidTimeZone(timeZone)) {
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      weekday: date.getDay(),
    }
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      weekday: "short",
      hour12: false,
    })
    const parts = formatter.formatToParts(date)
    const map: Record<string, string> = {}
    for (const part of parts) {
      if (part.type !== "literal") {
        map[part.type] = part.value
      }
    }
    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    }
    return {
      year: Number(map.year) || date.getFullYear(),
      month: (Number(map.month) || 1) - 1,
      day: Number(map.day) || date.getDate(),
      hour: (Number(map.hour) || 0) % 24,
      minute: Number(map.minute) || 0,
      second: Number(map.second) || 0,
      weekday: weekdayMap[map.weekday ?? ""] ?? date.getDay(),
    }
  } catch {
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      weekday: date.getDay(),
    }
  }
}

export function makeZonedDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second = 0,
  timeZone?: string
): Date {
  if (!timeZone || !isValidTimeZone(timeZone)) {
    return new Date(year, month, day, hour, minute, second)
  }

  try {
    const utcGuess = Date.UTC(year, month, day, hour, minute, second)
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    })

    function getParts(ts: number) {
      const p = formatter.formatToParts(new Date(ts))
      const m: Record<string, number> = {}
      for (const part of p) {
        if (part.type !== "literal") m[part.type] = Number(part.value)
      }
      return {
        year: m.year,
        month: (m.month ?? 1) - 1,
        day: m.day,
        hour: (m.hour ?? 0) % 24,
        minute: m.minute ?? 0,
        second: m.second ?? 0,
      }
    }

    let cur = getParts(utcGuess)
    let curUtc = Date.UTC(
      cur.year,
      cur.month,
      cur.day,
      cur.hour,
      cur.minute,
      cur.second
    )
    let offset = curUtc - utcGuess
    const targetTs = utcGuess - offset

    cur = getParts(targetTs)
    curUtc = Date.UTC(
      cur.year,
      cur.month,
      cur.day,
      cur.hour,
      cur.minute,
      cur.second
    )
    offset = curUtc - targetTs
    const refinedTs = utcGuess - offset
    return new Date(refinedTs)
  } catch {
    return new Date(year, month, day, hour, minute, second)
  }
}

export function combineDateAndTime(
  date: Date,
  timeString: string,
  timeZone?: string
): Date {
  const dateParts = getZonedDateTimeParts(date, timeZone)
  const { hour, minute } = parseHourMinute(timeString)
  return makeZonedDate(
    dateParts.year,
    dateParts.month,
    dateParts.day,
    hour,
    minute,
    0,
    timeZone
  )
}

export function formatPresetTime(
  date: Date,
  now: Date,
  options?: { timeZone?: string; locale?: string; hourCycle?: 12 | 24 }
): string {
  const { timeZone, locale = "en-US", hourCycle } = options ?? {}
  const nowParts = getZonedDateTimeParts(now, timeZone)
  const dateParts = getZonedDateTimeParts(date, timeZone)

  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: hourCycle === 12 ? true : hourCycle === 24 ? false : undefined,
    timeZone: isValidTimeZone(timeZone) ? timeZone : undefined,
  })
  const timeStr = timeFormatter.format(date)

  const todayStart = makeZonedDate(
    nowParts.year,
    nowParts.month,
    nowParts.day,
    0,
    0,
    0,
    timeZone
  )
  const targetStart = makeZonedDate(
    dateParts.year,
    dateParts.month,
    dateParts.day,
    0,
    0,
    0,
    timeZone
  )

  const diffMs = targetStart.getTime() - todayStart.getTime()
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000))

  if (diffDays === 0) {
    return `Today ${timeStr}`
  }

  if (diffDays === 1) {
    const weekdayFormatter = new Intl.DateTimeFormat(locale, {
      weekday: "short",
      timeZone: isValidTimeZone(timeZone) ? timeZone : undefined,
    })
    const weekday = weekdayFormatter.format(date)
    return `Tomorrow · ${weekday} ${timeStr}`
  }

  if (diffDays > 1 && diffDays < 7) {
    const weekdayFormatter = new Intl.DateTimeFormat(locale, {
      weekday: "short",
      timeZone: isValidTimeZone(timeZone) ? timeZone : undefined,
    })
    const weekday = weekdayFormatter.format(date)
    return `${weekday} ${timeStr}`
  }

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: isValidTimeZone(timeZone) ? timeZone : undefined,
  })
  return `${dateFormatter.format(date)} · ${timeStr}`
}

export function resolvePreset(
  preset: SnoozePreset,
  now: Date,
  options?: {
    timeZone?: string
    times?: SnoozeTimes
    locale?: string
    hourCycle?: 12 | 24
  }
): ResolvedPreset | null {
  const { timeZone, times = {}, locale, hourCycle } = options ?? {}
  const mergedTimes: Required<SnoozeTimes> = {
    ...DEFAULT_SNOOZE_TIMES,
    ...times,
  }

  if (typeof preset === "object") {
    let date: Date | null = null
    if (preset.date) {
      date = preset.date
    } else if (preset.resolve) {
      date = preset.resolve(now, timeZone)
    }
    if (!date || Number.isNaN(date.getTime())) return null
    return {
      id: preset.id,
      label: preset.label,
      date,
      timeLabel: formatPresetTime(date, now, { timeZone, locale, hourCycle }),
    }
  }

  const nowParts = getZonedDateTimeParts(now, timeZone)
  const { hour: morningHour, minute: morningMinute } = parseHourMinute(
    mergedTimes.morning
  )
  const { hour: eveningHour, minute: eveningMinute } = parseHourMinute(
    mergedTimes.evening
  )

  switch (preset) {
    case "later-today": {
      // Hides when it is too late in the day (at or past 17:00, or within 1h of evening time)
      const cutoffHour = Math.max(0, eveningHour - 1)
      if (
        nowParts.hour > cutoffHour ||
        (nowParts.hour === cutoffHour && nowParts.minute >= eveningMinute)
      ) {
        return null
      }
      const date = makeZonedDate(
        nowParts.year,
        nowParts.month,
        nowParts.day,
        eveningHour,
        eveningMinute,
        0,
        timeZone
      )
      return {
        id: "later-today",
        label: "Later today",
        date,
        timeLabel: formatPresetTime(date, now, { timeZone, locale, hourCycle }),
      }
    }

    case "this-evening": {
      if (
        nowParts.hour > eveningHour ||
        (nowParts.hour === eveningHour && nowParts.minute >= eveningMinute)
      ) {
        return null
      }
      const date = makeZonedDate(
        nowParts.year,
        nowParts.month,
        nowParts.day,
        eveningHour,
        eveningMinute,
        0,
        timeZone
      )
      return {
        id: "this-evening",
        label: "This evening",
        date,
        timeLabel: formatPresetTime(date, now, { timeZone, locale, hourCycle }),
      }
    }

    case "tomorrow": {
      const date = makeZonedDate(
        nowParts.year,
        nowParts.month,
        nowParts.day + 1,
        morningHour,
        morningMinute,
        0,
        timeZone
      )
      return {
        id: "tomorrow",
        label: "Tomorrow",
        date,
        timeLabel: formatPresetTime(date, now, { timeZone, locale, hourCycle }),
      }
    }

    case "this-weekend": {
      const weekendDay = mergedTimes.weekendDay // default 6 (Saturday)
      // On Monday (1) through Friday (5), resolves to upcoming weekendDay
      // On weekend (Sat or Sun), "this weekend" does not apply, so hide it
      if (nowParts.weekday === 0 || nowParts.weekday >= weekendDay) {
        return null
      }
      const daysUntil = (weekendDay - nowParts.weekday + 7) % 7
      const date = makeZonedDate(
        nowParts.year,
        nowParts.month,
        nowParts.day + daysUntil,
        morningHour,
        morningMinute,
        0,
        timeZone
      )
      return {
        id: "this-weekend",
        label: "This weekend",
        date,
        timeLabel: formatPresetTime(date, now, { timeZone, locale, hourCycle }),
      }
    }

    case "next-week": {
      const workweekDay = mergedTimes.workweekDay // default 1 (Monday)
      let daysUntil = (workweekDay - nowParts.weekday + 7) % 7
      if (daysUntil === 0) {
        daysUntil = 7
      }
      const date = makeZonedDate(
        nowParts.year,
        nowParts.month,
        nowParts.day + daysUntil,
        morningHour,
        morningMinute,
        0,
        timeZone
      )
      return {
        id: "next-week",
        label: "Next week",
        date,
        timeLabel: formatPresetTime(date, now, { timeZone, locale, hourCycle }),
      }
    }

    case "next-weekend": {
      const weekendDay = mergedTimes.weekendDay // default 6
      let daysUntil = (weekendDay - nowParts.weekday + 7) % 7
      if (daysUntil === 0 || nowParts.weekday < weekendDay) {
        daysUntil += 7
      }
      const date = makeZonedDate(
        nowParts.year,
        nowParts.month,
        nowParts.day + daysUntil,
        morningHour,
        morningMinute,
        0,
        timeZone
      )
      return {
        id: "next-weekend",
        label: "Next weekend",
        date,
        timeLabel: formatPresetTime(date, now, { timeZone, locale, hourCycle }),
      }
    }

    default:
      return null
  }
}

export function resolvePresets(
  presets: SnoozePreset[],
  now: Date,
  options?: {
    timeZone?: string
    times?: SnoozeTimes
    locale?: string
    hourCycle?: 12 | 24
  }
): ResolvedPreset[] {
  const resolved: ResolvedPreset[] = []
  for (const preset of presets) {
    const item = resolvePreset(preset, now, options)
    if (item) {
      resolved.push(item)
    }
  }
  return resolved
}
