import type { HourCycle } from "@/registry/default/lib/time-segments"

export type DateTimeRange = { from?: Date; to?: Date }
export type DateTimeRangePreset = { label: string; value: DateTimeRange }
export type DateTimeBounds = { min?: Date; max?: Date }
export type RangeEdge = keyof DateTimeRange

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

export function timeOf(date: Date | undefined, fallback: string) {
  if (!date) return fallback
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

export function withTime(date: Date | undefined, time: string) {
  const match = TIME_PATTERN.exec(time)
  if (!date || !match) return date
  const next = new Date(date)
  next.setHours(Number(match[1]), Number(match[2]), 0, 0)
  return next
}

function latest(...dates: (Date | undefined)[]) {
  return dates.reduce<Date | undefined>(
    (best, date) => (date && (!best || date > best) ? date : best),
    undefined
  )
}

function earliest(...dates: (Date | undefined)[]) {
  return dates.reduce<Date | undefined>(
    (best, date) => (date && (!best || date < best) ? date : best),
    undefined
  )
}

export function clampDate(date: Date, { min, max }: DateTimeBounds) {
  if (min && date < min) return new Date(min)
  if (max && date > max) return new Date(max)
  return date
}

export function monthToShow(range: DateTimeRange, bounds: DateTimeBounds) {
  return range.from ?? range.to ?? clampDate(new Date(), bounds)
}

export function isRangeAllowed(
  range: DateTimeRange,
  { min, max }: DateTimeBounds
) {
  const isOrdered = !range.from || !range.to || range.from <= range.to
  return (
    isOrdered &&
    [range.from, range.to].every(
      (date) => !date || ((!min || date >= min) && (!max || date <= max))
    )
  )
}

export function isSameRange(a: DateTimeRange, b: DateTimeRange) {
  return (
    a.from?.getTime() === b.from?.getTime() &&
    a.to?.getTime() === b.to?.getTime()
  )
}

function boundsFor(
  edge: RangeEdge,
  range: DateTimeRange,
  { min, max }: DateTimeBounds
): DateTimeBounds {
  return edge === "from"
    ? { min, max: earliest(max, range.to) }
    : { min: latest(min, range.from), max }
}

export function pickDays(
  days: DateTimeRange | undefined,
  times: { start: string; end: string },
  bounds: DateTimeBounds = {}
): DateTimeRange {
  const startDay = withTime(days?.from, times.start)
  const from = startDay && clampDate(startDay, bounds)
  const endDay = withTime(days?.to, times.end)
  const to = endDay && clampDate(endDay, boundsFor("to", { from }, bounds))
  return { from, to }
}

export function setRangeTime(
  range: DateTimeRange,
  edge: RangeEdge,
  time: string,
  bounds: DateTimeBounds = {}
): DateTimeRange {
  const date = range[edge]
  if (!date || !TIME_PATTERN.test(time)) return range
  const timed = withTime(date, time) ?? date
  return { ...range, [edge]: clampDate(timed, boundsFor(edge, range, bounds)) }
}

export function hourCycleOf(locale?: string): HourCycle {
  const { hourCycle } = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
  }).resolvedOptions()
  return hourCycle === "h11" || hourCycle === "h12" ? 12 : 24
}

export function timeZoneLabel(date: Date, locale?: string) {
  return (
    new Intl.DateTimeFormat(locale, { timeZoneName: "short" })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value ?? ""
  )
}

export function formatRange(range: DateTimeRange, locale?: string) {
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  })
  if (range.from && range.to) return formatter.formatRange(range.from, range.to)
  if (range.from) return formatter.format(range.from)
  if (range.to) return formatter.format(range.to)
  return null
}

export type RangeParser = (text: string, now: Date) => DateTimeRange | null
export type TypedRangeResult =
  | { range: DateTimeRange; error?: undefined }
  | { range?: undefined; error: string }

type Unit = "minute" | "hour" | "day" | "week" | "month" | "year"
type Moment = { date: Date; hasTime: boolean }

const UNIT =
  "(minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|wks?|w|months?|mo|years?|yrs?|y)"
const ROLLING_PATTERN = new RegExp(`^(last|past|next) (?:(\\d+) ?)?${UNIT}$`)
const SINGULAR_UNIT = /^(minute|hour|day|week|month|year)$/
const AGO_PATTERN = new RegExp(`^(\\d+) ?${UNIT} ago$`)
const IN_PATTERN = new RegExp(`^in (\\d+) ?${UNIT}$`)
const CLOCK_PATTERN =
  /(?:^| )(?:at )?(?:(noon|midnight)|(\d{1,2})(?::(\d{2}))? ?(am|pm)|(\d{1,2}):(\d{2}))$/
const WEEKDAY_PATTERN =
  /^(?:(next|last|this) )?(sun|mon|tue|wed|thu|fri|sat)[a-z]*$/
const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
const WEEKDAY_NAMES = [
  "sun sunday",
  "mon monday",
  "tue tues tuesday",
  "wed weds wednesday",
  "thu thur thurs thursday",
  "fri friday",
  "sat saturday",
]
const RANGE_SEPARATOR = / (?:to|until|through) | ?[-–—] ?/

function unitOf(token: string): Unit {
  if (token === "m" || token.startsWith("min")) return "minute"
  if (token.startsWith("h")) return "hour"
  if (token.startsWith("d")) return "day"
  if (token.startsWith("w")) return "week"
  if (token.startsWith("mo")) return "month"
  return "year"
}

function shift(date: Date, amount: number, unit: Unit) {
  if (unit === "minute" || unit === "hour") {
    const minutes = unit === "hour" ? amount * 60 : amount
    return new Date(date.getTime() + minutes * 60 * 1000)
  }
  const next = new Date(date)
  if (unit === "day") next.setDate(next.getDate() + amount)
  if (unit === "week") next.setDate(next.getDate() + amount * 7)
  if (unit === "month" || unit === "year") {
    const months = unit === "year" ? amount * 12 : amount
    const target = new Date(next.getFullYear(), next.getMonth() + months + 1, 0)
    next.setFullYear(
      target.getFullYear(),
      target.getMonth(),
      Math.min(next.getDate(), target.getDate())
    )
  }
  return next
}

function startOfDay(date: Date, days = 0) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59)
}

function parseClock(match: RegExpExecArray) {
  const [, word, hours12, minutes12, meridiem, hours24, minutes24] = match
  if (word) return { hours: word === "noon" ? 12 : 0, minutes: 0 }
  if (hours24 !== undefined) {
    const hours = Number(hours24)
    const minutes = Number(minutes24)
    return hours < 24 && minutes < 60 ? { hours, minutes } : null
  }
  const hours = Number(hours12)
  const minutes = Number(minutes12 ?? 0)
  if (hours < 1 || hours > 12 || minutes > 59) return null
  return { hours: (hours % 12) + (meridiem === "pm" ? 12 : 0), minutes }
}

function weekdayOf(token: string) {
  const index = WEEKDAY_NAMES.findIndex((names) =>
    names.split(" ").includes(token)
  )
  return index === -1 ? null : index
}

function parseDay(text: string, today: Date, onOrAfter = today) {
  if (text === "today") return startOfDay(today)
  if (text === "yesterday") return startOfDay(today, -1)
  if (text === "tomorrow") return startOfDay(today, 1)
  const match = WEEKDAY_PATTERN.exec(text)
  if (!match) return null
  const words = text.split(" ")
  const target = weekdayOf(words[words.length - 1])
  if (target === null || WEEKDAYS[target] !== match[2]) return null
  const forward = (target - today.getDay() + 7) % 7
  if (match[1] === "next") return startOfDay(today, forward || 7)
  if (match[1] === "last") {
    return startOfDay(today, -((today.getDay() - target + 7) % 7 || 7))
  }
  return startOfDay(onOrAfter, (target - onOrAfter.getDay() + 7) % 7)
}

function parseMoment(text: string, now: Date, day?: Date): Moment | null {
  if (text === "now") return { date: new Date(now), hasTime: true }
  const ago = AGO_PATTERN.exec(text)
  if (ago) {
    return { date: shift(now, -Number(ago[1]), unitOf(ago[2])), hasTime: true }
  }
  const later = IN_PATTERN.exec(text)
  if (later) {
    return {
      date: shift(now, Number(later[1]), unitOf(later[2])),
      hasTime: true,
    }
  }

  const clockMatch = CLOCK_PATTERN.exec(text)
  const dayText = clockMatch ? text.slice(0, clockMatch.index) : text
  const date = dayText ? parseDay(dayText, now, day) : startOfDay(day ?? now)
  if (!date) return null
  if (!clockMatch) return { date, hasTime: false }
  const clock = parseClock(clockMatch)
  if (!clock) return null
  date.setHours(clock.hours, clock.minutes)
  return { date, hasTime: true }
}

export function parseRangeText(text: string, now: Date): DateTimeRange | null {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, " ")
  if (!normalized) return null

  const rolling = ROLLING_PATTERN.exec(normalized)
  if (rolling) {
    const amount = rolling[2] === undefined ? 1 : Number(rolling[2])
    if (amount < 1 || (!rolling[2] && !SINGULAR_UNIT.test(rolling[3]))) {
      return null
    }
    const unit = unitOf(rolling[3])
    return rolling[1] === "next"
      ? { from: new Date(now), to: shift(now, amount, unit) }
      : { from: shift(now, -amount, unit), to: new Date(now) }
  }

  const parts = normalized.split(RANGE_SEPARATOR)
  if (parts.length > 2) return null
  if (parts.length === 2) {
    const start = parseMoment(parts[0], now)
    const end = start && parseMoment(parts[1], now, start.date)
    if (!start || !end) return null
    return {
      from: start.date,
      to: end.hasTime ? end.date : endOfDay(end.date),
    }
  }

  const moment = parseMoment(normalized, now)
  if (!moment) return null
  return moment.hasTime
    ? { from: moment.date }
    : { from: moment.date, to: endOfDay(moment.date) }
}

function isValidDate(date: Date | undefined): date is Date {
  return date !== undefined && Number.isFinite(date.getTime())
}

export function resolveTypedRange(
  text: string,
  now: Date,
  { min, max }: DateTimeBounds = {},
  parse: RangeParser = parseRangeText
): TypedRangeResult {
  const range = parse(text, now) ?? {}
  const first = range.from ?? range.to
  const last = range.to ?? range.from
  if (!isValidDate(first) || !isValidDate(last)) {
    return {
      error: `Couldn't read that range. Try "last 7 days" or "mon to fri".`,
    }
  }
  if (first > last) return { error: "The end is before the start." }
  if ((min && last < min) || (max && first > max)) {
    return { error: "That range is outside the allowed dates." }
  }
  return {
    range: {
      from: range.from && clampDate(range.from, { min, max }),
      to: range.to && clampDate(range.to, { min, max }),
    },
  }
}
