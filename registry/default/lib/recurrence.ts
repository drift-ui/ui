export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"

export type Weekday = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU"

export type WeekdayRule = { weekday: Weekday; ordinal?: number }

export type Recurrence = {
  frequency: Frequency
  interval: number
  byDay: WeekdayRule[]
  byMonthDay: number[]
  byMonth?: number[]
  bySetPos?: number[]
  count?: number
  until?: Date
  exdates?: Date[]
  tzid?: string
  unknownParts?: Record<string, string>
}

export const FREQUENCIES: Frequency[] = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]

export const WEEKDAYS: Weekday[] = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"]

export const WEEKDAY_NAMES: Record<Weekday, string> = {
  MO: "Monday",
  TU: "Tuesday",
  WE: "Wednesday",
  TH: "Thursday",
  FR: "Friday",
  SA: "Saturday",
  SU: "Sunday",
}

export const MONTH_NAMES: Record<number, string> = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
}

const UNITS: Record<Frequency, string> = {
  DAILY: "day",
  WEEKLY: "week",
  MONTHLY: "month",
  YEARLY: "year",
}

const ADVERBS: Record<Frequency, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
}

const ORDINALS: Record<number, string> = {
  1: "first",
  2: "second",
  3: "third",
  4: "fourth",
  5: "fifth",
  [-1]: "last",
  [-2]: "second to last",
}

const BY_DAY = /^([+-]?\d{1,2})?(MO|TU|WE|TH|FR|SA|SU)$/
const UNTIL = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/
const DAY_MS = 86_400_000
const SEARCH_LIMIT_DAYS = 366 * 100
const SUMMARY_DATE = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" })

const KNOWN_KEYS = new Set([
  "FREQ",
  "INTERVAL",
  "BYDAY",
  "BYMONTHDAY",
  "BYMONTH",
  "BYSETPOS",
  "COUNT",
  "UNTIL",
  "EXDATE",
  "TZID",
])

function positiveInteger(text: string | undefined) {
  const parsed = Number(text)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function parseByDay(text = ""): WeekdayRule[] {
  return text.split(",").flatMap((part) => {
    const match = BY_DAY.exec(part.trim().toUpperCase())
    if (!match) return []
    const [, ordinal, weekday] = match
    return [
      ordinal
        ? { weekday: weekday as Weekday, ordinal: Number(ordinal) }
        : { weekday: weekday as Weekday },
    ]
  })
}

function getZonedDateTimeParts(date: Date, timeZone?: string) {
  if (!timeZone) {
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
    }
  }
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
  const parts = formatter.formatToParts(date)
  const map: Record<string, number> = {}
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = Number(part.value)
    }
  }
  return {
    year: map.year ?? date.getFullYear(),
    month: (map.month ?? 1) - 1,
    day: map.day ?? 1,
    hour: (map.hour ?? 0) % 24,
    minute: map.minute ?? 0,
    second: map.second ?? 0,
  }
}

function makeZonedDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone?: string
): Date | null {
  if (!timeZone) {
    const d = new Date(year, month, day, hour, minute, second)
    if (d.getHours() !== hour || d.getMinutes() !== minute) return null
    return d
  }

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
  if (
    cur.hour !== hour ||
    cur.minute !== minute ||
    cur.day !== day ||
    cur.month !== month ||
    cur.year !== year
  ) {
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
    const refinedParts = getParts(refinedTs)
    if (
      refinedParts.hour !== hour ||
      refinedParts.minute !== minute ||
      refinedParts.day !== day
    ) {
      return null
    }
    return new Date(refinedTs)
  }
  return new Date(targetTs)
}

type DateWithPrecision = Date & { isDateOnly?: boolean }

function markDateOnly(date: Date, value: boolean): DateWithPrecision {
  const tagged = date as DateWithPrecision
  tagged.isDateOnly = value
  return tagged
}

function isDateOnly(date: Date): boolean {
  if (
    "isDateOnly" in date &&
    typeof (date as DateWithPrecision).isDateOnly === "boolean"
  ) {
    return Boolean((date as DateWithPrecision).isDateOnly)
  }
  return (
    date.getHours() === 0 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0
  )
}

function parseIcalDate(
  text = "",
  tzid?: string
): DateWithPrecision | undefined {
  const trimmed = text.trim()
  const match = UNTIL.exec(trimmed)
  if (!match) {
    const parsed = new Date(trimmed)
    if (Number.isNaN(parsed.getTime())) return undefined
    if (!trimmed.includes("T") && !/\d{1,2}:\d{2}/.test(trimmed)) {
      markDateOnly(parsed, true)
    }
    return parsed as DateWithPrecision
  }
  const [, year, month, day, hours, minutes, seconds, utc] = match
  const y = Number(year)
  const m = Number(month) - 1
  const d = Number(day)

  if (hours === undefined) {
    const date =
      makeZonedDate(y, m, d, 0, 0, 0, tzid) ?? new Date(y, m, d, 0, 0, 0)
    return markDateOnly(date, true)
  }

  const h = Number(hours)
  const min = Number(minutes)
  const sec = Number(seconds)
  if (utc) {
    const date = new Date(Date.UTC(y, m, d, h, min, sec))
    return markDateOnly(date, false)
  }

  const date =
    makeZonedDate(y, m, d, h, min, sec, tzid) ?? new Date(y, m, d, h, min, sec)
  return markDateOnly(date, false)
}

function parseUntil(text = "", tzid?: string): DateWithPrecision | undefined {
  const trimmed = text.trim()
  const match = UNTIL.exec(trimmed)
  if (!match) return parseIcalDate(trimmed, tzid)

  const [, year, month, day, hours, minutes, seconds, utc] = match
  const y = Number(year)
  const m = Number(month) - 1
  const d = Number(day)

  if (hours === undefined) {
    const date =
      makeZonedDate(y, m, d, 23, 59, 59, tzid) ?? new Date(y, m, d, 23, 59, 59)
    return markDateOnly(date, true)
  }

  const h = Number(hours)
  const min = Number(minutes)
  const sec = Number(seconds)
  const date = utc
    ? new Date(Date.UTC(y, m, d, h, min, sec))
    : (makeZonedDate(y, m, d, h, min, sec, tzid) ??
      new Date(y, m, d, h, min, sec))
  return markDateOnly(date, false)
}

function formatIcalDate(date: Date) {
  if (isDateOnly(date)) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}${m}${d}`
  }
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "")
}

export function parseRRule(rule: string): Recurrence {
  const lines = rule
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  let rruleLine = ""
  const exdates: Date[] = []
  let tzid: string | undefined

  for (const line of lines) {
    if (/^RRULE:/i.test(line)) {
      rruleLine = line.replace(/^RRULE:/i, "")
    } else if (/^EXDATE/i.test(line)) {
      const colonIdx = line.indexOf(":")
      if (colonIdx !== -1) {
        const header = line.slice(0, colonIdx)
        const dateStr = line.slice(colonIdx + 1)
        const tzMatch = /TZID=([^;:]+)/i.exec(header)
        const lineTzid = tzMatch ? tzMatch[1] : undefined
        if (lineTzid && !tzid) {
          tzid = lineTzid
        }
        for (const item of dateStr.split(",")) {
          const d = parseIcalDate(item, lineTzid ?? tzid)
          if (d) exdates.push(d)
        }
      }
    } else if (/^DTSTART/i.test(line)) {
      const tzMatch = /TZID=([^;:]+)/i.exec(line)
      if (tzMatch && !tzid) {
        tzid = tzMatch[1]
      }
    } else if (!rruleLine) {
      if (/^RRULE:/i.test(line)) {
        rruleLine = line.replace(/^RRULE:/i, "")
      } else {
        rruleLine = line
      }
    }
  }

  if (!rruleLine) {
    rruleLine = rule.trim()
    if (/^RRULE:/i.test(rruleLine)) {
      rruleLine = rruleLine.replace(/^RRULE:/i, "")
    }
  }

  const parts = new Map<string, string>()
  for (const part of rruleLine.split(";")) {
    const eqIdx = part.indexOf("=")
    if (eqIdx === -1) continue
    const key = part.slice(0, eqIdx).trim().toUpperCase()
    const value = part.slice(eqIdx + 1).trim()
    if (key) parts.set(key, value)
  }

  if (parts.has("TZID") && !tzid) {
    tzid = parts.get("TZID")
  }

  if (parts.has("EXDATE")) {
    const val = parts.get("EXDATE") ?? ""
    for (const item of val.split(",")) {
      const d = parseIcalDate(item, tzid)
      if (d) exdates.push(d)
    }
  }

  const unknownParts: Record<string, string> = {}
  for (const [key, value] of parts.entries()) {
    if (!KNOWN_KEYS.has(key)) {
      unknownParts[key] = value
    }
  }

  const frequency = parts.get("FREQ")?.toUpperCase() as Frequency
  const byMonthDay = (parts.get("BYMONTHDAY") ?? "")
    .split(",")
    .map(Number)
    .filter((day) => Number.isInteger(day) && day !== 0 && Math.abs(day) <= 31)

  const byMonth = (parts.get("BYMONTH") ?? "")
    .split(",")
    .map(Number)
    .filter((m) => Number.isInteger(m) && m >= 1 && m <= 12)

  const bySetPos = (parts.get("BYSETPOS") ?? "")
    .split(",")
    .map(Number)
    .filter((pos) => Number.isInteger(pos) && pos !== 0 && Math.abs(pos) <= 366)

  const recurrence: Recurrence = {
    frequency: FREQUENCIES.includes(frequency) ? frequency : "WEEKLY",
    interval: positiveInteger(parts.get("INTERVAL")) ?? 1,
    byDay: parseByDay(parts.get("BYDAY")),
    byMonthDay,
    count: positiveInteger(parts.get("COUNT")),
    until: parseUntil(parts.get("UNTIL"), tzid),
  }

  if (byMonth.length > 0) recurrence.byMonth = byMonth
  if (bySetPos.length > 0) recurrence.bySetPos = bySetPos
  if (exdates.length > 0) recurrence.exdates = exdates
  if (tzid) recurrence.tzid = tzid
  if (Object.keys(unknownParts).length > 0)
    recurrence.unknownParts = unknownParts

  return recurrence
}

export function formatRRule(
  recurrence: Recurrence,
  options?: { prefix?: boolean; multiline?: boolean }
): string {
  const {
    frequency,
    interval,
    byDay,
    byMonthDay,
    byMonth,
    bySetPos,
    count,
    until,
    unknownParts,
    exdates,
  } = recurrence

  const parts = [`FREQ=${frequency}`]
  if (interval > 1) parts.push(`INTERVAL=${interval}`)
  if (byMonth && byMonth.length > 0) parts.push(`BYMONTH=${byMonth.join(",")}`)
  if (byDay.length > 0) {
    parts.push(
      `BYDAY=${byDay.map((rule) => `${rule.ordinal ?? ""}${rule.weekday}`).join(",")}`
    )
  }
  if (byMonthDay.length > 0) parts.push(`BYMONTHDAY=${byMonthDay.join(",")}`)
  if (bySetPos && bySetPos.length > 0)
    parts.push(`BYSETPOS=${bySetPos.join(",")}`)
  if (count) parts.push(`COUNT=${count}`)
  else if (until) {
    parts.push(`UNTIL=${formatIcalDate(until)}`)
  }

  if (unknownParts) {
    for (const [key, value] of Object.entries(unknownParts)) {
      if (value !== undefined && value !== "") {
        parts.push(`${key}=${value}`)
      }
    }
  }

  if (options?.multiline) {
    const rruleBody = parts.join(";")
    const firstLine = options?.prefix ? `RRULE:${rruleBody}` : rruleBody
    const lines = [firstLine]
    if (exdates && exdates.length > 0) {
      lines.push(`EXDATE:${exdates.map(formatIcalDate).join(",")}`)
    }
    return lines.join("\n")
  }

  if (exdates && exdates.length > 0) {
    parts.push(`EXDATE=${exdates.map(formatIcalDate).join(",")}`)
  }

  const finalBody = parts.join(";")
  return options?.prefix ? `RRULE:${finalBody}` : finalBody
}

export function weekdayOf(date: Date): Weekday {
  return WEEKDAYS[(date.getDay() + 6) % 7]
}

export function ordinalWeekOf(date: Date) {
  return Math.ceil(date.getDate() / 7)
}

export function isLastWeekOf(date: Date) {
  return date.getDate() + 7 > daysInMonth(date)
}

function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

function dayNumber(date: Date) {
  return Math.round(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS
  )
}

function weekdaysOf(recurrence: Recurrence, start: Date) {
  return recurrence.byDay.length > 0
    ? recurrence.byDay.map((rule) => rule.weekday)
    : [weekdayOf(start)]
}

function resolveSetPos<T>(items: T[], setPos: number[]): T[] {
  const result: T[] = []
  for (const pos of setPos) {
    if (pos > 0 && pos <= items.length) {
      result.push(items[pos - 1])
    } else if (pos < 0 && Math.abs(pos) <= items.length) {
      result.push(items[items.length + pos])
    }
  }
  return result
}

function weekdayOrdinalInYear(date: Date): {
  fromStart: number
  fromEnd: number
} {
  const year = date.getFullYear()
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const totalDays = isLeap ? 366 : 365

  const jan1 = new Date(year, 0, 1)
  const jan1Day = (jan1.getDay() + 6) % 7
  const targetDay = (date.getDay() + 6) % 7
  const daysToFirst = (targetDay - jan1Day + 7) % 7

  const diffTime =
    Date.UTC(year, date.getMonth(), date.getDate()) - Date.UTC(year, 0, 1)
  const dayOfYear = Math.round(diffTime / DAY_MS)
  const fromStart = Math.floor((dayOfYear - daysToFirst) / 7) + 1

  const dec31 = new Date(year, 11, 31)
  const dec31Day = (dec31.getDay() + 6) % 7
  const daysFromLast = (dec31Day - targetDay + 7) % 7
  const lastDayOfYear = totalDays - 1 - daysFromLast
  const fromEnd = -Math.floor((lastDayOfYear - dayOfYear) / 7) - 1

  return { fromStart, fromEnd }
}

function matchesDayRules(
  recurrence: Recurrence,
  date: Date,
  period: "month" | "year" = "month"
) {
  const lastDay = daysInMonth(date)
  let dayMatches = true

  if (recurrence.byDay.length > 0) {
    if (
      period === "year" &&
      (!recurrence.byMonth || recurrence.byMonth.length === 0)
    ) {
      const { fromStart, fromEnd } = weekdayOrdinalInYear(date)
      dayMatches = recurrence.byDay.some(
        (rule) =>
          rule.weekday === weekdayOf(date) &&
          (rule.ordinal === undefined ||
            rule.ordinal === fromStart ||
            rule.ordinal === fromEnd)
      )
    } else {
      const fromEnd = -Math.ceil((lastDay - date.getDate() + 1) / 7)
      dayMatches = recurrence.byDay.some(
        (rule) =>
          rule.weekday === weekdayOf(date) &&
          (rule.ordinal === undefined ||
            rule.ordinal === ordinalWeekOf(date) ||
            rule.ordinal === fromEnd)
      )
    }
  }

  let monthDayMatches = true
  if (recurrence.byMonthDay.length > 0) {
    monthDayMatches = recurrence.byMonthDay.some(
      (day) => date.getDate() === (day > 0 ? day : lastDay + day + 1)
    )
  }

  return dayMatches && monthDayMatches
}

function matchesSetPos(
  recurrence: Recurrence,
  date: Date,
  period: "month" | "year"
): boolean {
  if (!recurrence.bySetPos || recurrence.bySetPos.length === 0) return true

  if (period === "month") {
    const totalDays = daysInMonth(date)
    const candidates: number[] = []
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(date.getFullYear(), date.getMonth(), day)
      if (matchesDayRules(recurrence, d, "month")) {
        candidates.push(day)
      }
    }
    const selectedDays = resolveSetPos(candidates, recurrence.bySetPos)
    return selectedDays.includes(date.getDate())
  }

  const year = date.getFullYear()
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const totalYearDays = isLeap ? 366 : 365
  const cur = new Date(year, 0, 1)
  const matchingDates: number[] = []

  for (let i = 0; i < totalYearDays; i++) {
    const month = cur.getMonth() + 1
    if (
      (!recurrence.byMonth || recurrence.byMonth.includes(month)) &&
      matchesDayRules(
        recurrence,
        cur,
        recurrence.byMonth && recurrence.byMonth.length > 0 ? "month" : "year"
      )
    ) {
      matchingDates.push(cur.getTime())
    }
    cur.setDate(cur.getDate() + 1)
  }

  const selectedTimestamps = resolveSetPos(matchingDates, recurrence.bySetPos)
  const target = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime()
  return selectedTimestamps.includes(target)
}

function matchesDayOfMonth(recurrence: Recurrence, start: Date, date: Date) {
  if (recurrence.bySetPos && recurrence.bySetPos.length > 0) {
    return matchesSetPos(recurrence, date, "month")
  }

  if (recurrence.byDay.length > 0 || recurrence.byMonthDay.length > 0) {
    return matchesDayRules(recurrence, date, "month")
  }

  return date.getDate() === start.getDate()
}

function matches(recurrence: Recurrence, start: Date, date: Date) {
  const { frequency, interval } = recurrence
  const days = dayNumber(date) - dayNumber(start)
  const months =
    (date.getFullYear() - start.getFullYear()) * 12 +
    date.getMonth() -
    start.getMonth()

  if (recurrence.byMonth && recurrence.byMonth.length > 0) {
    if (!recurrence.byMonth.includes(date.getMonth() + 1)) {
      return false
    }
  }

  switch (frequency) {
    case "DAILY":
      return days % interval === 0
    case "WEEKLY": {
      const weeks = Math.floor((days + ((start.getDay() + 6) % 7)) / 7)
      return (
        weeks % interval === 0 &&
        weekdaysOf(recurrence, start).includes(weekdayOf(date))
      )
    }
    case "MONTHLY":
      return (
        months % interval === 0 && matchesDayOfMonth(recurrence, start, date)
      )
    case "YEARLY": {
      const years = date.getFullYear() - start.getFullYear()
      if (years % interval !== 0) return false

      if (
        !recurrence.byMonth &&
        recurrence.byDay.length === 0 &&
        recurrence.byMonthDay.length === 0 &&
        date.getMonth() !== start.getMonth()
      ) {
        return false
      }

      if (recurrence.bySetPos && recurrence.bySetPos.length > 0) {
        return matchesSetPos(recurrence, date, "year")
      }

      if (recurrence.byDay.length > 0 || recurrence.byMonthDay.length > 0) {
        return matchesDayRules(
          recurrence,
          date,
          recurrence.byMonth && recurrence.byMonth.length > 0 ? "month" : "year"
        )
      }

      return date.getDate() === start.getDate()
    }
  }
}

function isSameDayOrTime(
  exdate: Date,
  occurrence: Date,
  timeZone?: string
): boolean {
  if (exdate.getTime() === occurrence.getTime()) return true

  if (isDateOnly(exdate)) {
    const occParts = getZonedDateTimeParts(occurrence, timeZone)
    const exParts = getZonedDateTimeParts(exdate, timeZone)
    return (
      occParts.year === exParts.year &&
      occParts.month === exParts.month &&
      occParts.day === exParts.day
    )
  }

  return false
}

export function occurrences(
  recurrence: Recurrence,
  start: Date,
  limit: number,
  options?: { exdates?: (Date | string)[]; tzid?: string }
): Date[] {
  if (limit <= 0) return []
  const found: Date[] = []
  const timeZone = options?.tzid ?? recurrence.tzid
  const startParts = getZonedDateTimeParts(start, timeZone)

  const parsedOptionExdates = (options?.exdates ?? [])
    .map((item) =>
      item instanceof Date ? item : parseIcalDate(item, timeZone)
    )
    .filter(Boolean) as Date[]

  const allExdates = [...(recurrence.exdates ?? []), ...parsedOptionExdates]

  let generatedCount = 0

  for (let dayOffset = 0; dayOffset < SEARCH_LIMIT_DAYS; dayOffset++) {
    const refDate = new Date(
      Date.UTC(startParts.year, startParts.month, startParts.day + dayOffset)
    )
    const curYear = refDate.getUTCFullYear()
    const curMonth = refDate.getUTCMonth()
    const curDay = refDate.getUTCDate()

    const anchorDate = new Date(
      startParts.year,
      startParts.month,
      startParts.day
    )
    const testDate = new Date(curYear, curMonth, curDay)

    if (matches(recurrence, anchorDate, testDate)) {
      const occurrence = makeZonedDate(
        curYear,
        curMonth,
        curDay,
        startParts.hour,
        startParts.minute,
        startParts.second,
        timeZone
      )

      if (!occurrence) {
        continue
      }

      if (recurrence.until && occurrence > recurrence.until) {
        break
      }

      generatedCount++

      const isExcluded = allExdates.some((exdate) =>
        isSameDayOrTime(exdate, occurrence, timeZone)
      )

      if (!isExcluded) {
        found.push(occurrence)
      }

      if (found.length >= limit) {
        break
      }

      if (recurrence.count && generatedCount >= recurrence.count) {
        break
      }
    }
  }

  return found
}

function joinWords(words: string[]) {
  if (words.length < 2) return words.join("")
  return `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`
}

function ordinalWord(ordinal: number) {
  return ORDINALS[ordinal] ?? String(ordinal)
}

function isWorkweekDays(byDay: WeekdayRule[]) {
  return (
    byDay.length === 5 &&
    WEEKDAYS.slice(0, 5).every((w) => byDay.some((r) => r.weekday === w))
  )
}

function isWeekendDays(byDay: WeekdayRule[]) {
  return (
    byDay.length === 2 &&
    ["SA", "SU"].every((w) => byDay.some((r) => r.weekday === w))
  )
}

export function describeDays(recurrence: Recurrence, start: Date): string {
  switch (recurrence.frequency) {
    case "WEEKLY": {
      const weekdays = weekdaysOf(recurrence, start)
      return `on ${joinWords(
        WEEKDAYS.filter((weekday) => weekdays.includes(weekday)).map(
          (weekday) => WEEKDAY_NAMES[weekday]
        )
      )}`
    }
    case "MONTHLY": {
      if (recurrence.bySetPos && recurrence.bySetPos.length > 0) {
        const posText = joinWords(recurrence.bySetPos.map(ordinalWord))
        if (isWorkweekDays(recurrence.byDay)) {
          return `on the ${posText} weekday`
        }
        if (isWeekendDays(recurrence.byDay)) {
          return `on the ${posText} weekend day`
        }
        if (recurrence.byDay.length > 0) {
          const daysText = joinWords(
            recurrence.byDay.map((r) => WEEKDAY_NAMES[r.weekday])
          )
          return `on the ${posText} ${daysText}`
        }
        return `on the ${posText} day`
      }

      if (recurrence.byDay.length > 0) {
        return `on ${joinWords(
          recurrence.byDay.map((rule) =>
            rule.ordinal === undefined
              ? `every ${WEEKDAY_NAMES[rule.weekday]}`
              : `the ${ordinalWord(rule.ordinal)} ${WEEKDAY_NAMES[rule.weekday]}`
          )
        )}`
      }
      return `on ${joinWords(
        (recurrence.byMonthDay.length > 0
          ? recurrence.byMonthDay
          : [start.getDate()]
        ).map((day) => (day > 0 ? `day ${day}` : `the ${ordinalWord(day)} day`))
      )}`
    }
    case "YEARLY": {
      const monthPrefix =
        recurrence.byMonth && recurrence.byMonth.length > 0
          ? `in ${joinWords(recurrence.byMonth.map((m) => MONTH_NAMES[m] ?? `month ${m}`))}`
          : ""

      if (recurrence.bySetPos && recurrence.bySetPos.length > 0) {
        const posText = joinWords(recurrence.bySetPos.map(ordinalWord))
        const dayDesc = isWorkweekDays(recurrence.byDay)
          ? `${posText} weekday`
          : recurrence.byDay.length > 0
            ? `${posText} ${joinWords(recurrence.byDay.map((r) => WEEKDAY_NAMES[r.weekday]))}`
            : `${posText} day`

        return monthPrefix
          ? `${monthPrefix} on the ${dayDesc}`
          : `on the ${dayDesc}`
      }

      if (recurrence.byDay.length > 0) {
        const dayDesc = joinWords(
          recurrence.byDay.map((rule) =>
            rule.ordinal === undefined
              ? `every ${WEEKDAY_NAMES[rule.weekday]}`
              : `the ${ordinalWord(rule.ordinal)} ${WEEKDAY_NAMES[rule.weekday]}`
          )
        )
        return monthPrefix ? `${monthPrefix} on ${dayDesc}` : `on ${dayDesc}`
      }

      if (recurrence.byMonthDay.length > 0) {
        const dayDesc = joinWords(
          recurrence.byMonthDay.map((d) =>
            d > 0 ? `day ${d}` : `the ${ordinalWord(d)} day`
          )
        )
        return monthPrefix ? `${monthPrefix} on ${dayDesc}` : `on ${dayDesc}`
      }

      if (monthPrefix) {
        return `${monthPrefix} on day ${start.getDate()}`
      }

      return `on ${start.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
    }
    default:
      return ""
  }
}

export function describeRecurrence(recurrence: Recurrence, start: Date) {
  const { frequency, interval, byDay, count, until } = recurrence
  const isWorkweek =
    frequency === "WEEKLY" &&
    interval === 1 &&
    byDay.length === 5 &&
    WEEKDAYS.slice(0, 5).every((weekday) =>
      byDay.some((rule) => rule.weekday === weekday)
    )
  const base = isWorkweek
    ? "Every weekday"
    : interval === 1
      ? ADVERBS[frequency]
      : `Every ${interval} ${UNITS[frequency]}s`
  const days = isWorkweek ? "" : describeDays(recurrence, start)
  const end = count
    ? count === 1
      ? ", once"
      : `, ${count} times`
    : until
      ? ` until ${SUMMARY_DATE.format(until)}`
      : ""
  return `${[base, days].filter(Boolean).join(" ")}${end}`
}
