export interface TimezoneOption {
  value: string
  label: string
  offset: string
  offsetMinutes: number
}

// V8 lists these under old names that nobody searches for. Every engine accepts the new ones.
const RENAMED_ZONES: Record<string, string> = {
  "America/Buenos_Aires": "America/Argentina/Buenos_Aires",
  "America/Godthab": "America/Nuuk",
  "Asia/Calcutta": "Asia/Kolkata",
  "Asia/Katmandu": "Asia/Kathmandu",
  "Asia/Rangoon": "Asia/Yangon",
  "Asia/Saigon": "Asia/Ho_Chi_Minh",
  "Atlantic/Faeroe": "Atlantic/Faroe",
  "Europe/Kiev": "Europe/Kyiv",
  "Pacific/Enderbury": "Pacific/Kanton",
  "Pacific/Ponape": "Pacific/Pohnpei",
  "Pacific/Truk": "Pacific/Chuuk",
}

const validity = new Map<string, boolean>()

// Intl throws a RangeError for unknown names, so check before formatting.
export function isValidTimeZone(timeZone: string) {
  let valid = validity.get(timeZone)
  if (valid === undefined) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone })
      valid = true
    } catch {
      valid = false
    }
    validity.set(timeZone, valid)
  }
  return valid
}

export function toCurrentTimezoneName(timeZone: string) {
  return RENAMED_ZONES[timeZone] ?? timeZone
}

export function getTimezoneIds(): string[] {
  const ids = [
    ...new Set(Intl.supportedValuesOf("timeZone").map(toCurrentTimezoneName)),
  ]
  // Some engines leave UTC out of the list.
  return ids.includes("UTC") ? ids : ["UTC", ...ids]
}

export function formatTimezoneLabel(timeZone: string) {
  return timeZone.replaceAll("_", " ").replaceAll("/", " / ")
}

// Building a DateTimeFormat is the slow part, so keep one per zone.
const offsetFormatters = new Map<string, Intl.DateTimeFormat>()
const timeFormatters = new Map<string, Intl.DateTimeFormat>()

function cached(
  cache: Map<string, Intl.DateTimeFormat>,
  key: string,
  create: () => Intl.DateTimeFormat
) {
  let formatter = cache.get(key)
  if (!formatter) {
    formatter = create()
    cache.set(key, formatter)
  }
  return formatter
}

// Offsets move with daylight saving, so callers pass the date to read them at.
export function getTimezoneOffset(timeZone: string, date: Date) {
  const offset = cached(
    offsetFormatters,
    timeZone,
    () =>
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        timeZoneName: "shortOffset",
      })
  )
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value

  return offset === "GMT" || !offset ? "GMT+0" : offset
}

export function parseOffsetMinutes(offset: string) {
  const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(offset)
  if (!match) return 0
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0)
  return match[1] === "-" ? -minutes : minutes
}

export function formatTimezoneTime(
  timeZone: string,
  date: Date,
  locale?: string
) {
  return cached(
    timeFormatters,
    `${locale ?? ""}|${timeZone}`,
    () =>
      new Intl.DateTimeFormat(locale, {
        timeZone,
        hour: "numeric",
        minute: "2-digit",
      })
  ).format(date)
}

export function listTimezones(
  date: Date,
  ids: string[] = getTimezoneIds()
): TimezoneOption[] {
  return [...new Set(ids.map(toCurrentTimezoneName))]
    .filter(isValidTimeZone)
    .map((value) => {
      const offset = getTimezoneOffset(value, date)
      return {
        value,
        label: formatTimezoneLabel(value),
        offset,
        offsetMinutes: parseOffsetMinutes(offset),
      }
    })
    .sort(
      (a, b) =>
        a.offsetMinutes - b.offsetMinutes || a.value.localeCompare(b.value)
    )
}

function normalize(text: string) {
  return text.toLowerCase().replaceAll("_", " ").trim()
}

export function filterTimezones(options: TimezoneOption[], query: string) {
  const needle = normalize(query)
  if (!needle) return options

  return options.filter(
    (option) =>
      normalize(option.value).includes(needle) ||
      normalize(option.label).includes(needle) ||
      option.offset.toLowerCase().includes(needle)
  )
}
