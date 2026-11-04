import { describe, expect, it } from "vitest"

import {
  describeRecurrence,
  formatRRule,
  occurrences,
  parseRRule,
} from "@/registry/default/lib/recurrence"

const TUESDAY = new Date(2026, 10, 3, 10, 0)

function days(rule: string, start: Date, limit: number) {
  return occurrences(parseRRule(rule), start, limit).map(
    (date) =>
      `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`
  )
}

describe("recurrence", () => {
  it("parses an RRULE, with or without the RRULE: prefix", () => {
    expect(
      parseRRule("RRULE:FREQ=MONTHLY;INTERVAL=2;BYDAY=-1FR;COUNT=10")
    ).toEqual({
      frequency: "MONTHLY",
      interval: 2,
      byDay: [{ weekday: "FR", ordinal: -1 }],
      byMonthDay: [],
      count: 10,
      until: undefined,
    })
    expect(parseRRule("freq=daily;bymonthday=15,-1").byMonthDay).toEqual([
      15, -1,
    ])
  })

  it("falls back to weekly every 1 for missing or invalid parts", () => {
    expect(parseRRule("FREQ=HOURLY;INTERVAL=0;BYDAY=XX;COUNT=-2")).toEqual({
      frequency: "WEEKLY",
      interval: 1,
      byDay: [],
      byMonthDay: [],
      count: undefined,
      until: undefined,
    })
  })

  it("reads UNTIL as a UTC date-time or a local end of day", () => {
    expect(parseRRule("FREQ=DAILY;UNTIL=20261231T120000Z").until).toEqual(
      new Date(Date.UTC(2026, 11, 31, 12))
    )
    expect(parseRRule("FREQ=DAILY;UNTIL=20261231").until).toEqual(
      new Date(2026, 11, 31, 23, 59, 59)
    )
  })

  it("formats in a stable order and round-trips", () => {
    const rule = "FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH;COUNT=4"
    expect(formatRRule(parseRRule(rule))).toBe(rule)
    expect(formatRRule(parseRRule("INTERVAL=1;FREQ=DAILY"))).toBe("FREQ=DAILY")
    expect(formatRRule(parseRRule("FREQ=DAILY;UNTIL=20261231T120000Z"))).toBe(
      "FREQ=DAILY;UNTIL=20261231T120000Z"
    )
  })

  it("describes rules in plain language", () => {
    const describe = (rule: string) =>
      describeRecurrence(parseRRule(rule), TUESDAY)
    expect(describe("FREQ=DAILY")).toBe("Daily")
    expect(describe("FREQ=WEEKLY;INTERVAL=2;BYDAY=TU")).toBe(
      "Every 2 weeks on Tuesday"
    )
    expect(describe("FREQ=WEEKLY;BYDAY=FR,MO,WE")).toBe(
      "Weekly on Monday, Wednesday and Friday"
    )
    expect(describe("FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;UNTIL=20261231")).toBe(
      "Every weekday until Dec 31, 2026"
    )
    expect(describe("FREQ=MONTHLY;BYDAY=-1FR;COUNT=10")).toBe(
      "Monthly on the last Friday, 10 times"
    )
    expect(describe("FREQ=MONTHLY;BYDAY=2TU")).toBe(
      "Monthly on the second Tuesday"
    )
    expect(describe("FREQ=MONTHLY;INTERVAL=3")).toBe("Every 3 months on day 3")
    expect(describe("FREQ=MONTHLY;BYMONTHDAY=-1;COUNT=1")).toBe(
      "Monthly on the last day, once"
    )
    expect(describe("FREQ=YEARLY")).toBe("Yearly on November 3")
  })

  it("lists daily and weekly occurrences from the start, keeping its time", () => {
    expect(days("FREQ=DAILY;INTERVAL=3", TUESDAY, 3)).toEqual([
      "2026-11-3 10:00",
      "2026-11-6 10:00",
      "2026-11-9 10:00",
    ])
    expect(days("FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,TU", TUESDAY, 3)).toEqual([
      "2026-11-3 10:00",
      "2026-11-16 10:00",
      "2026-11-17 10:00",
    ])
  })

  it("lists monthly occurrences by ordinal weekday and by month day", () => {
    expect(days("FREQ=MONTHLY;BYDAY=-1FR", TUESDAY, 3)).toEqual([
      "2026-11-27 10:00",
      "2026-12-25 10:00",
      "2027-1-29 10:00",
    ])
    expect(days("FREQ=MONTHLY;BYDAY=2TU", TUESDAY, 2)).toEqual([
      "2026-11-10 10:00",
      "2026-12-8 10:00",
    ])
    expect(days("FREQ=MONTHLY;BYMONTHDAY=31", TUESDAY, 2)).toEqual([
      "2026-12-31 10:00",
      "2027-1-31 10:00",
    ])
  })

  it("lists yearly occurrences on the start date", () => {
    expect(days("FREQ=YEARLY;INTERVAL=2", TUESDAY, 2)).toEqual([
      "2026-11-3 10:00",
      "2028-11-3 10:00",
    ])
  })

  it("stops at COUNT and UNTIL", () => {
    expect(days("FREQ=DAILY;COUNT=2", TUESDAY, 5)).toHaveLength(2)
    expect(days("FREQ=DAILY;UNTIL=20261105", TUESDAY, 5)).toEqual([
      "2026-11-3 10:00",
      "2026-11-4 10:00",
      "2026-11-5 10:00",
    ])
  })

  it("preserves unknown and unhandled RRULE parts on round-trip", () => {
    const rule =
      "FREQ=WEEKLY;INTERVAL=2;BYDAY=TU;WKST=SU;BYHOUR=9;X-CUSTOM=DRIFT"
    const parsed = parseRRule(rule)
    expect(parsed.unknownParts).toEqual({
      WKST: "SU",
      BYHOUR: "9",
      "X-CUSTOM": "DRIFT",
    })
    expect(formatRRule(parsed)).toBe(
      "FREQ=WEEKLY;INTERVAL=2;BYDAY=TU;WKST=SU;BYHOUR=9;X-CUSTOM=DRIFT"
    )
  })

  it("supports BYSETPOS for last weekday, first weekday, etc.", () => {
    const lastWeekdayRule = "FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1"
    const parsed = parseRRule(lastWeekdayRule)
    expect(parsed.bySetPos).toEqual([-1])
    expect(describeRecurrence(parsed, TUESDAY)).toBe(
      "Monthly on the last weekday"
    )
    expect(days(lastWeekdayRule, TUESDAY, 3)).toEqual([
      "2026-11-30 10:00",
      "2026-12-31 10:00",
      "2027-1-29 10:00",
    ])

    const firstWeekdayRule = "FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=1"
    expect(describeRecurrence(parseRRule(firstWeekdayRule), TUESDAY)).toBe(
      "Monthly on the first weekday"
    )
    expect(days(firstWeekdayRule, new Date(2026, 10, 1, 10, 0), 3)).toEqual([
      "2026-11-2 10:00",
      "2026-12-1 10:00",
      "2027-1-1 10:00",
    ])
  })

  it("supports BYMONTH and ordinals in yearly recurrence", () => {
    const rule = "FREQ=YEARLY;BYMONTH=3;BYDAY=2SU"
    const parsed = parseRRule(rule)
    expect(parsed.byMonth).toEqual([3])
    expect(describeRecurrence(parsed, TUESDAY)).toBe(
      "Yearly in March on the second Sunday"
    )
    expect(days(rule, new Date(2027, 0, 1, 10, 0), 3)).toEqual([
      "2027-3-14 10:00",
      "2028-3-12 10:00",
      "2029-3-11 10:00",
    ])
  })

  it("skips dates specified in EXDATE", () => {
    const multiLine = [
      "RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=TU",
      "EXDATE:20261110T100000Z,20261124T100000Z",
    ].join("\n")

    const parsed = parseRRule(multiLine)
    expect(parsed.exdates).toHaveLength(2)

    const startUtc = new Date(Date.UTC(2026, 10, 3, 10, 0))
    const results = occurrences(parsed, startUtc, 3, { tzid: "UTC" })
    expect(
      results.map(
        (d) => `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`
      )
    ).toEqual(["2026-11-3", "2026-11-17", "2026-12-1"])

    const optionsResults = occurrences(
      parseRRule("FREQ=WEEKLY;BYDAY=TU"),
      TUESDAY,
      3,
      {
        exdates: [new Date(2026, 10, 10)],
      }
    )
    expect(
      optionsResults.map(
        (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      )
    ).toEqual(["2026-11-3", "2026-11-17", "2026-11-24"])
  })

  it("keeps exact wall-clock time invariant across daylight saving transitions", () => {
    const nyFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    })

    const beforeSpringForward = new Date("2026-03-06T10:00:00-05:00")
    const springOccurrences = occurrences(
      parseRRule("FREQ=DAILY"),
      beforeSpringForward,
      5,
      { tzid: "America/New_York" }
    )
    expect(springOccurrences).toHaveLength(5)
    for (const occ of springOccurrences) {
      const parts = nyFormatter.formatToParts(occ)
      const hourPart = parts.find((p) => p.type === "hour")?.value
      const minPart = parts.find((p) => p.type === "minute")?.value
      expect(hourPart).toBe("10")
      expect(minPart).toBe("00")
    }

    const beforeFallBack = new Date("2026-10-30T10:00:00-04:00")
    const fallOccurrences = occurrences(
      parseRRule("FREQ=DAILY"),
      beforeFallBack,
      5,
      { tzid: "America/New_York" }
    )
    expect(fallOccurrences).toHaveLength(5)
    for (const occ of fallOccurrences) {
      const parts = nyFormatter.formatToParts(occ)
      const hourPart = parts.find((p) => p.type === "hour")?.value
      const minPart = parts.find((p) => p.type === "minute")?.value
      expect(hourPart).toBe("10")
      expect(minPart).toBe("00")
    }
  })

  it("skips nonexistent local time falling into spring-forward DST gap", () => {
    const start230 = new Date("2026-03-07T02:30:00-05:00")
    const result = occurrences(parseRRule("FREQ=DAILY"), start230, 3, {
      tzid: "America/New_York",
    })
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    })
    const formatted = result.map((d) => {
      const p = formatter.formatToParts(d)
      const m: Record<string, string> = {}
      for (const part of p) m[part.type] = part.value
      return `${m.year}-${m.month}-${m.day} ${m.hour}:${m.minute}`
    })
    expect(formatted).toEqual([
      "2026-3-7 02:30",
      "2026-3-9 02:30",
      "2026-3-10 02:30",
    ])
  })

  it("round-trips Google Calendar export fixtures", () => {
    const gcalWeekly = "RRULE:FREQ=WEEKLY;WKST=SU;BYDAY=MO,WE,FR"
    const parsed = parseRRule(gcalWeekly)
    expect(formatRRule(parsed, { prefix: true })).toBe(
      "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;WKST=SU"
    )

    const gcalExdate = [
      "RRULE:FREQ=WEEKLY;WKST=SU;BYDAY=TU",
      "EXDATE;TZID=America/New_York:20261110T100000",
    ].join("\n")
    const parsedExdate = parseRRule(gcalExdate)
    expect(parsedExdate.unknownParts?.WKST).toBe("SU")
    expect(parsedExdate.tzid).toBe("America/New_York")
    expect(parsedExdate.exdates).toHaveLength(1)
  })

  it("round-trips Outlook export fixtures", () => {
    const outlookMonthly =
      "RRULE:FREQ=MONTHLY;INTERVAL=1;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1"
    const parsed = parseRRule(outlookMonthly)
    expect(parsed.bySetPos).toEqual([-1])
    expect(formatRRule(parsed, { prefix: true })).toBe(
      "RRULE:FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1"
    )

    const outlookYearly = "RRULE:FREQ=YEARLY;INTERVAL=1;BYMONTH=3;BYDAY=2SU"
    const parsedYearly = parseRRule(outlookYearly)
    expect(parsedYearly.byMonth).toEqual([3])
    expect(formatRRule(parsedYearly, { prefix: true })).toBe(
      "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU"
    )
  })

  it("round-trips Apple Calendar export fixtures", () => {
    const appleYearly = "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU"
    const parsed = parseRRule(appleYearly)
    expect(parsed.byMonth).toEqual([11])
    expect(formatRRule(parsed, { prefix: true })).toBe(
      "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU"
    )

    const appleCustom =
      "RRULE:FREQ=WEEKLY;BYDAY=TU;X-APPLE-TRAVEL-ADVISORY-BEHAVIOR=AUTOMATIC"
    const parsedCustom = parseRRule(appleCustom)
    expect(
      parsedCustom.unknownParts?.["X-APPLE-TRAVEL-ADVISORY-BEHAVIOR"]
    ).toBe("AUTOMATIC")
    expect(formatRRule(parsedCustom, { prefix: true })).toBe(appleCustom)
  })

  it("handles awkward recurrences (5th Tuesday, leap day)", () => {
    const fifthTuesday = occurrences(
      parseRRule("FREQ=MONTHLY;BYDAY=5TU"),
      TUESDAY,
      2
    )
    expect(
      fifthTuesday.map(
        (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      )
    ).toEqual(["2026-12-29", "2027-3-30"])

    const leapDay = new Date(2024, 1, 29, 12, 0)
    const leapOccurrences = occurrences(parseRRule("FREQ=YEARLY"), leapDay, 2)
    expect(
      leapOccurrences.map(
        (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      )
    ).toEqual(["2024-2-29", "2028-2-29"])
  })

  it("satisfies scale limits: parses 1,000 rules and expands 500 occurrences deterministically", () => {
    let lastParsed
    for (let i = 0; i < 1000; i++) {
      lastParsed = parseRRule(
        "FREQ=MONTHLY;INTERVAL=2;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1;WKST=SU;X-DRIFT=1"
      )
    }
    expect(lastParsed?.bySetPos).toEqual([-1])
    expect(lastParsed?.unknownParts?.["X-DRIFT"]).toBe("1")

    const expanded = occurrences(
      parseRRule("FREQ=DAILY;INTERVAL=1"),
      TUESDAY,
      500
    )
    expect(expanded).toHaveLength(500)
    expect(expanded[0]).toEqual(TUESDAY)
  })

  it("normalizes lowercase BYDAY values like tu and preserves unknown parts", () => {
    const parsed = parseRRule("FREQ=WEEKLY;BYDAY=tu,we;X-CUSTOM=foo_Bar")
    expect(parsed.byDay).toEqual([{ weekday: "TU" }, { weekday: "WE" }])
    expect(parsed.unknownParts?.["X-CUSTOM"]).toBe("foo_Bar")
  })

  it("applies both BYDAY and BYMONTHDAY when combined", () => {
    const start = new Date(2026, 0, 1)
    const results = occurrences(
      parseRRule("FREQ=MONTHLY;BYDAY=MO;BYMONTHDAY=1"),
      start,
      3
    )
    for (const d of results) {
      expect(d.getDate()).toBe(1)
      expect(d.getDay()).toBe(1)
    }
  })

  it("evaluates ordinals across the full year for YEARLY rules without BYMONTH", () => {
    const start = new Date(2026, 0, 1)
    const results = occurrences(parseRRule("FREQ=YEARLY;BYDAY=1MO"), start, 2)
    expect(
      results.map(
        (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      )
    ).toEqual(["2026-1-5", "2027-1-4"])
  })

  it("evaluates BYSETPOS across the full year interval in YEARLY rules", () => {
    const start = new Date(2026, 0, 1)
    const results = occurrences(
      parseRRule("FREQ=YEARLY;BYMONTH=3,11;BYDAY=FR;BYSETPOS=-1"),
      start,
      2
    )
    expect(
      results.map(
        (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      )
    ).toEqual(["2026-11-27", "2027-11-26"])
  })

  it("stops counting after rule COUNT without refilling excluded instances", () => {
    const start = new Date(2026, 10, 3)
    const results = occurrences(parseRRule("FREQ=DAILY;COUNT=3"), start, 10, {
      exdates: [new Date(2026, 10, 4)],
    })
    expect(
      results.map(
        (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      )
    ).toEqual(["2026-11-3", "2026-11-5"])
  })

  it("distinguishes date-only vs date-time EXDATE precision", () => {
    const start = new Date(2026, 10, 3, 10, 0, 0)
    const differentTimeExdate = occurrences(
      parseRRule("FREQ=DAILY"),
      start,
      2,
      { exdates: ["20261103T140000"] }
    )
    expect(differentTimeExdate[0].getTime()).toBe(start.getTime())

    const sameTimeExdate = occurrences(parseRRule("FREQ=DAILY"), start, 2, {
      exdates: ["20261103T100000"],
    })
    expect(sameTimeExdate[0].getDate()).toBe(4)

    const dateOnlyExdate = occurrences(parseRRule("FREQ=DAILY"), start, 2, {
      exdates: ["20261103"],
    })
    expect(dateOnlyExdate[0].getDate()).toBe(4)
  })
})
