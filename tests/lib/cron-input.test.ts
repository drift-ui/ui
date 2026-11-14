import { describe, expect, it } from "vitest"

import {
  describeCron,
  getNextRunTimes,
  isCronMatch,
  parseCron,
} from "@/registry/default/lib/cron-input"

describe("parseCron", () => {
  it("parses valid 5-field cron expressions", () => {
    const result = parseCron("0 9 * * 1-5")
    expect(result.isValid).toBe(true)
    expect(result.fields?.minute).toEqual([0])
    expect(result.fields?.hour).toEqual([9])
    expect(result.fields?.dayOfMonth).toHaveLength(31)
    expect(result.fields?.month).toHaveLength(12)
    expect(result.fields?.dayOfWeek).toEqual([1, 2, 3, 4, 5])
    expect(result.isDomRestricted).toBe(false)
    expect(result.isDowRestricted).toBe(true)
  })

  it("handles step values and ranges", () => {
    const result = parseCron("*/15 9-17/2 * * *")
    expect(result.isValid).toBe(true)
    expect(result.fields?.minute).toEqual([0, 15, 30, 45])
    expect(result.fields?.hour).toEqual([9, 11, 13, 15, 17])
  })

  it("handles weekday names and month names case-insensitively", () => {
    const result = parseCron("0 12 * JAN,JUN MON-FRI")
    expect(result.isValid).toBe(true)
    expect(result.fields?.month).toEqual([1, 6])
    expect(result.fields?.dayOfWeek).toEqual([1, 2, 3, 4, 5])
  })

  it("normalizes Sunday as 0 and 7", () => {
    const res0 = parseCron("0 0 * * 0")
    const res7 = parseCron("0 0 * * 7")
    expect(res0.fields?.dayOfWeek).toEqual([0])
    expect(res7.fields?.dayOfWeek).toEqual([0])
  })

  it("rejects inherited object properties as field names", () => {
    const resMonth = parseCron("* * * constructor *")
    expect(resMonth.isValid).toBe(false)
    expect(resMonth.errorField).toBe("month")

    const resDow = parseCron("* * * * toString")
    expect(resDow.isValid).toBe(false)
    expect(resDow.errorField).toBe("day of week")
  })

  it("fails when expression is empty or missing", () => {
    expect(parseCron("").isValid).toBe(false)
    expect(parseCron(undefined).isValid).toBe(false)
    expect(parseCron("   ").isValid).toBe(false)
  })

  it("fails when field count is not 5", () => {
    const tooFew = parseCron("* * * *")
    expect(tooFew.isValid).toBe(false)
    expect(tooFew.error).toContain("Expected 5 fields, found 4")

    const tooMany = parseCron("* * * * * *")
    expect(tooMany.isValid).toBe(false)
    expect(tooMany.error).toContain("Expected 5 fields, found 6")
  })

  it("identifies the invalid field in error messages for out-of-range values", () => {
    const minErr = parseCron("60 * * * *")
    expect(minErr.isValid).toBe(false)
    expect(minErr.errorField).toBe("minute")
    expect(minErr.error).toContain("minute")

    const hourErr = parseCron("* 24 * * *")
    expect(hourErr.isValid).toBe(false)
    expect(hourErr.errorField).toBe("hour")
    expect(hourErr.error).toContain("hour")

    const domErr = parseCron("* * 32 * *")
    expect(domErr.isValid).toBe(false)
    expect(domErr.errorField).toBe("day of month")
    expect(domErr.error).toContain("day of month")

    const monthErr = parseCron("* * * 13 *")
    expect(monthErr.isValid).toBe(false)
    expect(monthErr.errorField).toBe("month")
    expect(monthErr.error).toContain("month")

    const dowErr = parseCron("* * * * 8")
    expect(dowErr.isValid).toBe(false)
    expect(dowErr.errorField).toBe("day of week")
    expect(dowErr.error).toContain("day of week")
  })

  it("rejects invalid step and range syntax", () => {
    const stepZero = parseCron("*/0 * * * *")
    expect(stepZero.isValid).toBe(false)
    expect(stepZero.error).toContain("step must be greater than 0")

    const invertedRange = parseCron("10-5 * * * *")
    expect(invertedRange.isValid).toBe(false)
    expect(invertedRange.error).toContain(
      "start must be less than or equal to end"
    )

    const invalidChar = parseCron("abc * * * *")
    expect(invalidChar.isValid).toBe(false)
    expect(invalidChar.error).toContain("minute")

    expect(parseCron("1,,2 * * * *").error).toContain("Invalid list syntax")
    expect(parseCron("1/2/3 * * * *").error).toContain("Invalid step syntax")
    expect(parseCron("*/foo * * * *").error).toContain("Invalid step")
    expect(parseCron("1-2-3 * * * *").error).toContain("Invalid range syntax")
    expect(parseCron("foo-5 * * * *").error).toContain("Invalid range start")
    expect(parseCron("5-bar * * * *").error).toContain("Invalid range end")
    expect(parseCron("foo/10 * * * *").error).toContain("Invalid value")

    const singleStep = parseCron("10/15 * * * *")
    expect(singleStep.isValid).toBe(true)
    expect(singleStep.fields?.minute).toEqual([10, 25, 40, 55])
  })
})

describe("POSIX Day-of-Month OR Day-of-Week matching", () => {
  it("returns false for invalid parsed cron", () => {
    expect(isCronMatch(parseCron("invalid"), new Date())).toBe(false)
  })

  it("checks month, hour, and minute mismatches correctly", () => {
    const parsed = parseCron("0 12 15 5 *")
    expect(isCronMatch(parsed, new Date(2026, 4, 15, 12, 0, 0))).toBe(true)
    // Month mismatch
    expect(isCronMatch(parsed, new Date(2026, 3, 15, 12, 0, 0))).toBe(false)
    // Hour mismatch
    expect(isCronMatch(parsed, new Date(2026, 4, 15, 13, 0, 0))).toBe(false)
    // Minute mismatch
    expect(isCronMatch(parsed, new Date(2026, 4, 15, 12, 1, 0))).toBe(false)
  })

  it("matches wildcard expression unconditionally", () => {
    expect(
      isCronMatch(parseCron("* * * * *"), new Date(2026, 0, 1, 12, 34, 0))
    ).toBe(true)
  })
  it("matches if EITHER day-of-month OR day-of-week matches when both are set", () => {
    // Cron: 0 0 13 * 5 -> Day 13 of the month OR Friday
    const parsed = parseCron("0 0 13 * 5")
    expect(parsed.isValid).toBe(true)

    // Friday Nov 13, 2026: both match
    const fri13 = new Date(2026, 10, 13, 0, 0, 0)
    expect(isCronMatch(parsed, fri13)).toBe(true)

    // Friday Nov 20, 2026: DOW matches (Friday), DOM does not (20 != 13)
    const fri20 = new Date(2026, 10, 20, 0, 0, 0)
    expect(isCronMatch(parsed, fri20)).toBe(true)

    // Tuesday Oct 13, 2026: DOM matches (13), DOW does not (Tuesday != Friday)
    const tue13 = new Date(2026, 9, 13, 0, 0, 0)
    expect(isCronMatch(parsed, tue13)).toBe(true)

    // Wednesday Oct 14, 2026: neither matches
    const wed14 = new Date(2026, 9, 14, 0, 0, 0)
    expect(isCronMatch(parsed, wed14)).toBe(false)
  })

  it("requires day-of-month match when only day-of-month is restricted", () => {
    const parsed = parseCron("0 0 15 * *")
    const match = new Date(2026, 10, 15, 0, 0, 0)
    const noMatch = new Date(2026, 10, 16, 0, 0, 0)
    expect(isCronMatch(parsed, match)).toBe(true)
    expect(isCronMatch(parsed, noMatch)).toBe(false)
  })

  it("requires day-of-week match when only day-of-week is restricted", () => {
    const parsed = parseCron("0 0 * * 1") // Monday
    const monday = new Date(2026, 10, 16, 0, 0, 0)
    const tuesday = new Date(2026, 10, 17, 0, 0, 0)
    expect(isCronMatch(parsed, monday)).toBe(true)
    expect(isCronMatch(parsed, tuesday)).toBe(false)
  })
})

describe("describeCron", () => {
  it("describes standard cron patterns in plain English", () => {
    expect(describeCron("* * * * *")).toBe("Every minute")
    expect(describeCron("*/5 * * * *")).toBe("Every 5 minutes")
    expect(describeCron("0 * * * *")).toBe("Every hour, at minute 0")
    expect(describeCron("15 * * * *")).toBe("At minute 15 of every hour")
    expect(describeCron("0 */2 * * *")).toBe("Every 2 hours, at minute 0")
    expect(describeCron("0 9 * * 1-5")).toBe("At 09:00, Monday through Friday")
    expect(describeCron("30 18 * * 1-5")).toBe(
      "At 18:30, Monday through Friday"
    )
    expect(describeCron("0 9 * * 0,6")).toBe("At 09:00, Saturday and Sunday")
    expect(describeCron("0 0 1 * *")).toBe("At 00:00, on day 1 of the month")
    expect(describeCron("0 0 1 1 *")).toBe(
      "At 00:00, on day 1 of the month, in January"
    )
  })

  it("describes both day of month and day of week when both are specified", () => {
    const desc = describeCron("0 9 1,15 * 1-5")
    expect(desc).toContain(
      "on day 1 and 15 of the month or Monday through Friday"
    )
  })

  it("returns empty string for invalid expressions", () => {
    expect(describeCron("invalid")).toBe("")
    expect(describeCron("")).toBe("")
    expect(describeCron("*/15 */2 * * *")).toBe(
      "Every 15 minutes, every 2 hours"
    )
    expect(describeCron("*/15 9-17/2 * * *")).toBe(
      "Every 15 minutes, every 2 hours from 09:00 through 17:59"
    )
    expect(describeCron("*/15 9-17 * * *")).toBe(
      "Every 15 minutes, 09:00 through 17:59"
    )
    expect(describeCron("*/15 9 * * *")).toBe("Every 15 minutes past hour 9")
    expect(describeCron("15,30 9,12 * * *")).toBe(
      "At minute 15,30 past hour 9,12 every day"
    )
    expect(describeCron("0 9 * * 1,3,5")).toBe(
      "At 09:00, on Monday, Wednesday, and Friday"
    )
    expect(describeCron("0 9 * * *")).toBe("At 09:00 every day")
    expect(describeCron("0 9 1 1,6 *")).toBe(
      "At 09:00, on day 1 of the month, in January and June"
    )
  })
})

describe("getNextRunTimes", () => {
  it("calculates next 5 run times deterministically from a reference date", () => {
    // Starting on Friday Nov 13, 2026 at 08:30:00
    const from = new Date(2026, 10, 13, 8, 30, 0)
    const runs = getNextRunTimes("0 9 * * 1-5", 5, from)

    expect(runs).toHaveLength(5)
    // Run 1: Friday Nov 13 at 09:00
    expect(runs[0].getFullYear()).toBe(2026)
    expect(runs[0].getMonth()).toBe(10)
    expect(runs[0].getDate()).toBe(13)
    expect(runs[0].getHours()).toBe(9)
    expect(runs[0].getMinutes()).toBe(0)

    // Run 2: Monday Nov 16 at 09:00 (skipping Sat 14 & Sun 15)
    expect(runs[1].getDate()).toBe(16)
    expect(runs[1].getDay()).toBe(1) // Monday

    // Run 3: Tuesday Nov 17 at 09:00
    expect(runs[2].getDate()).toBe(17)

    // Run 4: Wednesday Nov 18 at 09:00
    expect(runs[3].getDate()).toBe(18)

    // Run 5: Thursday Nov 19 at 09:00
    expect(runs[4].getDate()).toBe(19)
  })

  it("computes leap-day runs across multiple leap years", () => {
    const from = new Date(2025, 0, 1, 0, 0, 0)
    const runs = getNextRunTimes("0 0 29 2 *", 5, from)
    expect(runs).toHaveLength(5)
    expect(runs.map((r) => r.getFullYear())).toEqual([
      2028, 2032, 2036, 2040, 2044,
    ])
    for (const r of runs) {
      expect(r.getMonth()).toBe(1) // February
      expect(r.getDate()).toBe(29)
    }
  })

  it("returns empty array for invalid expression", () => {
    expect(getNextRunTimes("invalid cron", 5)).toEqual([])
  })

  it("advances past current minute if reference date has non-zero seconds", () => {
    // From 09:00:15 with "0 9 * * *"
    const from = new Date(2026, 10, 13, 9, 0, 15)
    const runs = getNextRunTimes("0 9 * * *", 1, from)
    // Next run must be tomorrow (Nov 14 at 09:00)
    expect(runs[0].getDate()).toBe(14)
    expect(runs[0].getHours()).toBe(9)
  })
})
