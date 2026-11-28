export type CronFieldName =
  "minute" | "hour" | "day of month" | "month" | "day of week"

export interface ParseCronResult {
  isValid: boolean
  error?: string
  errorField?: CronFieldName
  fields?: {
    minute: number[]
    hour: number[]
    dayOfMonth: number[]
    month: number[]
    dayOfWeek: number[]
  }
  rawFields?: [string, string, string, string, string]
  isDomRestricted?: boolean
  isDowRestricted?: boolean
}

const MONTH_NAMES: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
}

const WEEKDAY_NAMES: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
}

const MONTH_FULL_NAMES = [
  "",
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

const WEEKDAY_FULL_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

const SHORTCUTS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
}

interface FieldConfig {
  name: CronFieldName
  min: number
  max: number
  names?: Record<string, number>
}

const FIELD_CONFIGS: FieldConfig[] = [
  { name: "minute", min: 0, max: 59 },
  { name: "hour", min: 0, max: 23 },
  { name: "day of month", min: 1, max: 31 },
  { name: "month", min: 1, max: 12, names: MONTH_NAMES },
  { name: "day of week", min: 0, max: 7, names: WEEKDAY_NAMES },
]

function parseNumber(token: string, config: FieldConfig): number | null {
  const lower = token.toLowerCase()
  if (config.names && Object.hasOwn(config.names, lower)) {
    return config.names[lower]
  }
  if (!/^\d+$/.test(token)) {
    return null
  }
  const num = parseInt(token, 10)
  if (num < config.min || num > config.max) {
    return null
  }
  return num
}

function parseField(
  raw: string,
  config: FieldConfig
): { values: number[]; error?: string } {
  if (!raw || raw.trim().length === 0) {
    return { values: [], error: `Empty ${config.name} field` }
  }

  const items = raw.split(",")
  const valuesSet = new Set<number>()

  for (const item of items) {
    const trimmed = item.trim()
    if (!trimmed) {
      return { values: [], error: `Invalid list syntax in ${config.name}` }
    }

    // Check for step: e.g. */15, 1-30/2, 5/10
    const stepParts = trimmed.split("/")
    if (stepParts.length > 2) {
      return {
        values: [],
        error: `Invalid step syntax in ${config.name}: "${trimmed}"`,
      }
    }

    let step = 1
    if (stepParts.length === 2) {
      if (!/^\d+$/.test(stepParts[1])) {
        return {
          values: [],
          error: `Invalid step in ${config.name}: "${stepParts[1]}" (must be a positive integer)`,
        }
      }
      step = parseInt(stepParts[1], 10)
      if (step <= 0) {
        return {
          values: [],
          error: `Invalid step in ${config.name}: step must be greater than 0`,
        }
      }
    }

    const rangePart = stepParts[0]

    if (rangePart === "*") {
      for (let i = config.min; i <= config.max; i += step) {
        const val = config.name === "day of week" && i === 7 ? 0 : i
        valuesSet.add(val)
      }
    } else if (rangePart.includes("-")) {
      const bounds = rangePart.split("-")
      if (bounds.length !== 2) {
        return {
          values: [],
          error: `Invalid range syntax in ${config.name}: "${rangePart}"`,
        }
      }
      const start = parseNumber(bounds[0], config)
      const end = parseNumber(bounds[1], config)
      if (start === null) {
        return {
          values: [],
          error: `Invalid range start in ${config.name}: "${bounds[0]}" (expected ${config.min}-${config.max})`,
        }
      }
      if (end === null) {
        return {
          values: [],
          error: `Invalid range end in ${config.name}: "${bounds[1]}" (expected ${config.min}-${config.max})`,
        }
      }
      if (start > end) {
        return {
          values: [],
          error: `Invalid range in ${config.name}: "${rangePart}" (start must be less than or equal to end)`,
        }
      }
      for (let i = start; i <= end; i += step) {
        const val = config.name === "day of week" && i === 7 ? 0 : i
        valuesSet.add(val)
      }
    } else {
      // Single value
      if (stepParts.length === 2) {
        // e.g. 5/10 means from 5 to max with step
        const start = parseNumber(rangePart, config)
        if (start === null) {
          return {
            values: [],
            error: `Invalid value in ${config.name}: "${rangePart}" (expected ${config.min}-${config.max})`,
          }
        }
        for (let i = start; i <= config.max; i += step) {
          const val = config.name === "day of week" && i === 7 ? 0 : i
          valuesSet.add(val)
        }
      } else {
        const val = parseNumber(rangePart, config)
        if (val === null) {
          return {
            values: [],
            error: `Invalid ${config.name}: "${rangePart}" (must be between ${config.min} and ${config.max})`,
          }
        }
        valuesSet.add(config.name === "day of week" && val === 7 ? 0 : val)
      }
    }
  }

  const values = Array.from(valuesSet).sort((a, b) => a - b)
  return { values }
}

/**
 * Parses and validates a standard 5-field cron expression.
 */
export function parseCron(
  expression: string | undefined | null
): ParseCronResult {
  if (
    !expression ||
    typeof expression !== "string" ||
    expression.trim().length === 0
  ) {
    return {
      isValid: false,
      error: "Cron expression is required",
    }
  }

  const trimmed = expression.trim()
  if (trimmed.startsWith("@")) {
    const shortcut = trimmed.toLowerCase()
    if (shortcut === "@reboot") {
      return {
        isValid: false,
        error: "@reboot runs once at startup, so it has no schedule",
      }
    }
    if (!Object.hasOwn(SHORTCUTS, shortcut)) {
      return { isValid: false, error: `Unknown shortcut "${trimmed}"` }
    }
    return parseCron(SHORTCUTS[shortcut])
  }

  const parts = trimmed.split(/\s+/)
  if (parts.length !== 5) {
    return {
      isValid: false,
      error: `Expected 5 fields, found ${parts.length}`,
    }
  }

  const [rawMin, rawHour, rawDom, rawMonth, rawDow] = parts as [
    string,
    string,
    string,
    string,
    string,
  ]

  const parsedFields: {
    minute: number[]
    hour: number[]
    dayOfMonth: number[]
    month: number[]
    dayOfWeek: number[]
  } = {
    minute: [],
    hour: [],
    dayOfMonth: [],
    month: [],
    dayOfWeek: [],
  }

  for (let i = 0; i < FIELD_CONFIGS.length; i++) {
    const config = FIELD_CONFIGS[i]
    const raw = parts[i]
    const result = parseField(raw, config)
    if (result.error) {
      return {
        isValid: false,
        error: result.error,
        errorField: config.name,
      }
    }
    if (config.name === "minute") parsedFields.minute = result.values
    else if (config.name === "hour") parsedFields.hour = result.values
    else if (config.name === "day of month")
      parsedFields.dayOfMonth = result.values
    else if (config.name === "month") parsedFields.month = result.values
    else if (config.name === "day of week")
      parsedFields.dayOfWeek = result.values
  }

  return {
    isValid: true,
    fields: parsedFields,
    rawFields: [rawMin, rawHour, rawDom, rawMonth, rawDow],
    isDomRestricted: rawDom !== "*",
    isDowRestricted: rawDow !== "*",
  }
}

/**
 * Checks whether a given Date matches the parsed cron expression,
 * strictly implementing the POSIX day-of-month OR day-of-week rule.
 */
export function isCronMatch(parsed: ParseCronResult, date: Date): boolean {
  if (!parsed.isValid || !parsed.fields) return false

  const month = date.getMonth() + 1
  if (!parsed.fields.month.includes(month)) return false

  const dom = date.getDate()
  const dow = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  const domMatches = parsed.fields.dayOfMonth.includes(dom)
  const dowMatches = parsed.fields.dayOfWeek.includes(dow)

  let dayMatches = false
  if (parsed.isDomRestricted && parsed.isDowRestricted) {
    // POSIX rule: when both are set, match if EITHER matches
    dayMatches = domMatches || dowMatches
  } else if (parsed.isDomRestricted) {
    dayMatches = domMatches
  } else if (parsed.isDowRestricted) {
    dayMatches = dowMatches
  } else {
    dayMatches = true
  }

  if (!dayMatches) return false

  const hour = date.getHours()
  if (!parsed.fields.hour.includes(hour)) return false

  const minute = date.getMinutes()
  if (!parsed.fields.minute.includes(minute)) return false

  return true
}

/**
 * Calculates the next matching run times starting after a reference Date.
 * Takes a `from` date so calculations and tests are deterministic.
 */
export function getNextRunTimes(
  expression: string | undefined | null,
  count = 5,
  from: Date = new Date()
): Date[] {
  const parsed = parseCron(expression)
  if (!parsed.isValid || !parsed.fields) return []

  const results: Date[] = []
  const curr = new Date(from.getTime())

  // Advance to the start of the next minute
  curr.setSeconds(0, 0)
  curr.setMinutes(curr.getMinutes() + 1)

  const maxYear = curr.getFullYear() + 100

  while (results.length < count && curr.getFullYear() <= maxYear) {
    const month = curr.getMonth() + 1
    if (!parsed.fields.month.includes(month)) {
      // Jump to 1st of next month at 00:00
      curr.setDate(1)
      curr.setHours(0, 0, 0, 0)
      curr.setMonth(curr.getMonth() + 1)
      continue
    }

    const dom = curr.getDate()
    const dow = curr.getDay()
    const domMatches = parsed.fields.dayOfMonth.includes(dom)
    const dowMatches = parsed.fields.dayOfWeek.includes(dow)

    let dayMatches = false
    if (parsed.isDomRestricted && parsed.isDowRestricted) {
      dayMatches = domMatches || dowMatches
    } else if (parsed.isDomRestricted) {
      dayMatches = domMatches
    } else if (parsed.isDowRestricted) {
      dayMatches = dowMatches
    } else {
      dayMatches = true
    }

    if (!dayMatches) {
      // Jump to start of next day
      curr.setHours(0, 0, 0, 0)
      curr.setDate(curr.getDate() + 1)
      continue
    }

    const hour = curr.getHours()
    if (!parsed.fields.hour.includes(hour)) {
      // Jump to start of next hour
      curr.setMinutes(0, 0, 0)
      curr.setHours(curr.getHours() + 1)
      continue
    }

    const minute = curr.getMinutes()
    if (parsed.fields.minute.includes(minute)) {
      results.push(new Date(curr.getTime()))
    }

    curr.setMinutes(curr.getMinutes() + 1)
  }

  return results
}

function padTwo(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function formatList(items: string[]): string {
  if (items.length === 0) return ""
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`
}

function every(step: string, unit: "minute" | "hour"): string {
  return Number(step) === 1 ? `Every ${unit}` : `Every ${step} ${unit}s`
}

function describeMinutes(raw: string, minutes: number[]): string {
  if (raw === "*") return "Every minute"
  if (raw.includes("/")) {
    const [base, step] = raw.split("/")
    const text = every(step, "minute")
    if (base === "*" || base === "0") return text
    const [from, to] = base.split("-")
    return to
      ? `${text} from minute ${from} through ${to}`
      : `${text} from minute ${from}`
  }
  const list = formatList(minutes.map(String))
  return minutes.length === 1 ? `At minute ${list}` : `At minutes ${list}`
}

function describeHours(raw: string, hours: number[]): string {
  if (raw.startsWith("*/"))
    return `, ${every(raw.slice(2), "hour").toLowerCase()}`
  const [range, step] = raw.split("/")
  if (range.includes("-")) {
    const [h1, h2] = range.split("-")
    const span = `${padTwo(parseInt(h1, 10))}:00 through ${padTwo(parseInt(h2, 10))}:59`
    return step
      ? `, ${every(step, "hour").toLowerCase()} from ${span}`
      : `, ${span}`
  }
  return ` past hour ${formatList(hours.map(String))}`
}

/**
 * Returns a plain-English description of a cron expression.
 */
export function describeCron(expression: string | undefined | null): string {
  const parsed = parseCron(expression)
  if (!parsed.isValid || !parsed.rawFields) {
    return ""
  }

  const [rawMin, rawHour, rawDom, rawMonth, rawDow] = parsed.rawFields

  // Case 1: Every minute
  if (
    rawMin === "*" &&
    rawHour === "*" &&
    rawDom === "*" &&
    rawMonth === "*" &&
    rawDow === "*"
  ) {
    return "Every minute"
  }

  // Case 2: Every N minutes (e.g. */5 * * * *)
  if (
    rawMin.startsWith("*/") &&
    rawHour === "*" &&
    rawDom === "*" &&
    rawMonth === "*" &&
    rawDow === "*"
  ) {
    return every(rawMin.slice(2), "minute")
  }

  // Case 3: Every hour at a minute (e.g. 0 * * * *)
  if (
    !rawMin.includes("/") &&
    !rawMin.includes("-") &&
    rawHour === "*" &&
    rawDom === "*" &&
    rawMonth === "*" &&
    rawDow === "*"
  ) {
    if (rawMin === "0") {
      return "Every hour, at minute 0"
    }
    return `${describeMinutes(rawMin, parsed.fields!.minute)} of every hour`
  }

  // Case 4: Every N hours at minute (e.g. 0 */2 * * *)
  if (
    rawHour.startsWith("*/") &&
    rawDom === "*" &&
    rawMonth === "*" &&
    rawDow === "*"
  ) {
    const hours = every(rawHour.slice(2), "hour")
    if (rawMin.includes("*") || rawMin.includes("/")) {
      return `${describeMinutes(rawMin, parsed.fields!.minute)}, ${hours.toLowerCase()}`
    }
    const minText = describeMinutes(rawMin, parsed.fields!.minute)
    return `${hours}, ${minText.charAt(0).toLowerCase()}${minText.slice(1)}`
  }

  // Build time description:
  let timeStr = ""
  const isSpecificTime =
    !rawMin.includes("*") &&
    !rawMin.includes("/") &&
    !rawHour.includes("*") &&
    !rawHour.includes("/")

  if (isSpecificTime) {
    const mins = parsed.fields!.minute
    const hours = parsed.fields!.hour
    if (mins.length === 1 && hours.length === 1) {
      timeStr = `At ${padTwo(hours[0])}:${padTwo(mins[0])}`
    } else {
      timeStr = `At minute ${rawMin} past hour ${rawHour}`
    }
  } else if (rawMin === "0" && rawHour === "*") {
    timeStr = "Every hour, at minute 0"
  } else if (rawHour === "*") {
    const minutes = describeMinutes(rawMin, parsed.fields!.minute)
    timeStr =
      rawMin.includes("*") || rawMin.includes("/")
        ? minutes
        : `${minutes} of every hour`
  } else if (rawMin === "*" && /^\d+$/.test(rawHour)) {
    const hour = padTwo(parseInt(rawHour, 10))
    timeStr = `Every minute from ${hour}:00 through ${hour}:59`
  } else {
    timeStr = `${describeMinutes(rawMin, parsed.fields!.minute)}${describeHours(rawHour, parsed.fields!.hour)}`
  }

  // Build day description:
  const dayParts: string[] = []

  // Day of week
  let dowStr = ""
  if (rawDow !== "*") {
    if (rawDow === "1-5") {
      dowStr = "Monday through Friday"
    } else if (rawDow === "0,6" || rawDow === "6,7" || rawDow === "6,0") {
      dowStr = "Saturday and Sunday"
    } else {
      const dayNames = parsed.fields!.dayOfWeek.map(
        (d) => WEEKDAY_FULL_NAMES[d]
      )
      dowStr = `on ${formatList(dayNames)}`
    }
  }

  // Day of month
  let domStr = ""
  if (rawDom !== "*") {
    const domNums = parsed.fields!.dayOfMonth.map((d) => `${d}`)
    if (domNums.length === 1) {
      domStr = `on day ${domNums[0]} of the month`
    } else {
      domStr = `on day ${formatList(domNums)} of the month`
    }
  }

  // Combine day of month and day of week
  if (domStr && dowStr) {
    dayParts.push(`${domStr} or ${dowStr}`)
  } else if (domStr) {
    dayParts.push(domStr)
  } else if (dowStr) {
    dayParts.push(dowStr)
  }

  // Month
  if (rawMonth !== "*") {
    const mNames = parsed.fields!.month.map((m) => MONTH_FULL_NAMES[m])
    dayParts.push(`in ${formatList(mNames)}`)
  }

  if (dayParts.length > 0) {
    return `${timeStr}, ${dayParts.join(", ")}`
  }

  if (isSpecificTime) {
    return `${timeStr} every day`
  }

  return timeStr
}
