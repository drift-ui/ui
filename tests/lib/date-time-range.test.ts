import { describe, expect, it, vi } from "vitest"

import {
  clampDate,
  formatRange,
  hourCycleOf,
  isRangeAllowed,
  isSameRange,
  monthToShow,
  parseRangeText,
  pickDays,
  resolveTypedRange,
  setRangeTime,
  timeOf,
  timeZoneLabel,
  withTime,
} from "@/registry/default/lib/date-time-range-utils"

const MIN = new Date(2026, 2, 5, 8, 0)
const MAX = new Date(2026, 2, 20, 18, 0)
const BOUNDS = { min: MIN, max: MAX }

describe("timeOf", () => {
  it("formats hours and minutes with leading zeros", () => {
    expect(timeOf(new Date(2026, 2, 10, 7, 5), "09:00")).toBe("07:05")
  })

  it("falls back when there is no date", () => {
    expect(timeOf(undefined, "09:00")).toBe("09:00")
  })
})

describe("withTime", () => {
  it("sets the time and zeroes seconds without touching the input", () => {
    const date = new Date(2026, 2, 10, 8, 30, 45, 500)
    expect(withTime(date, "17:15")).toEqual(new Date(2026, 2, 10, 17, 15))
    expect(date).toEqual(new Date(2026, 2, 10, 8, 30, 45, 500))
  })

  it("leaves the date alone for an empty or malformed time", () => {
    const date = new Date(2026, 2, 10, 8, 30)
    expect(withTime(date, "")).toBe(date)
    expect(withTime(date, "24:00")).toBe(date)
    expect(withTime(date, "9:00")).toBe(date)
  })

  it("returns undefined without a date", () => {
    expect(withTime(undefined, "09:00")).toBeUndefined()
  })
})

describe("clampDate", () => {
  it("pulls dates inside the bounds", () => {
    expect(clampDate(new Date(2026, 2, 1), BOUNDS)).toEqual(MIN)
    expect(clampDate(new Date(2026, 3, 1), BOUNDS)).toEqual(MAX)
  })

  it("returns a copy of the bound, not the bound itself", () => {
    expect(clampDate(new Date(2026, 2, 1), BOUNDS)).not.toBe(MIN)
  })

  it("keeps dates already inside, and any date without bounds", () => {
    const inside = new Date(2026, 2, 10)
    expect(clampDate(inside, BOUNDS)).toBe(inside)
    expect(clampDate(inside, {})).toBe(inside)
  })
})

describe("monthToShow", () => {
  it("shows the start of the range, or its end when only the end is set", () => {
    const from = new Date(2026, 5, 1)
    const to = new Date(2026, 7, 1)
    expect(monthToShow({ from, to }, BOUNDS)).toBe(from)
    expect(monthToShow({ to }, BOUNDS)).toBe(to)
  })

  it("shows today, pulled inside the bounds, when there is no start", () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    try {
      vi.setSystemTime(new Date(2026, 2, 10, 12, 0))
      expect(monthToShow({}, {})).toEqual(new Date(2026, 2, 10, 12, 0))
      expect(monthToShow({}, { min: new Date(2026, 5, 1) })).toEqual(
        new Date(2026, 5, 1)
      )
      expect(monthToShow({}, { max: new Date(2026, 0, 31) })).toEqual(
        new Date(2026, 0, 31)
      )
    } finally {
      vi.useRealTimers()
    }
  })
})

describe("isRangeAllowed", () => {
  it("checks every set edge against the bounds", () => {
    expect(isRangeAllowed({ from: MIN, to: MAX }, BOUNDS)).toBe(true)
    expect(isRangeAllowed({ from: new Date(2026, 2, 5, 7, 59) }, BOUNDS)).toBe(
      false
    )
    expect(isRangeAllowed({ to: new Date(2026, 2, 20, 18, 1) }, BOUNDS)).toBe(
      false
    )
    expect(isRangeAllowed({}, BOUNDS)).toBe(true)
  })

  it("rejects a range whose end is before its start", () => {
    expect(
      isRangeAllowed(
        { from: new Date(2026, 2, 10), to: new Date(2026, 2, 9) },
        {}
      )
    ).toBe(false)
  })
})

describe("isSameRange", () => {
  it("compares by time value", () => {
    expect(
      isSameRange(
        { from: new Date(2026, 2, 5), to: new Date(2026, 2, 6) },
        { from: new Date(2026, 2, 5), to: new Date(2026, 2, 6) }
      )
    ).toBe(true)
    expect(isSameRange({}, {})).toBe(true)
    expect(isSameRange({ from: new Date(2026, 2, 5) }, {})).toBe(false)
  })
})

describe("pickDays", () => {
  const times = { start: "09:00", end: "17:00" }

  it("applies the start and end times to the picked days", () => {
    expect(
      pickDays(
        { from: new Date(2026, 2, 10), to: new Date(2026, 2, 12) },
        times
      )
    ).toEqual({
      from: new Date(2026, 2, 10, 9, 0),
      to: new Date(2026, 2, 12, 17, 0),
    })
  })

  it("returns an empty range when the selection is cleared", () => {
    expect(pickDays(undefined, times)).toEqual({})
  })

  it("clamps times on the first and last allowed days", () => {
    expect(
      pickDays(
        { from: new Date(2026, 2, 5), to: new Date(2026, 2, 20) },
        { start: "06:00", end: "23:00" },
        BOUNDS
      )
    ).toEqual({ from: MIN, to: MAX })
  })

  it("never puts the end before the start on a one day range", () => {
    expect(
      pickDays(
        { from: new Date(2026, 2, 10), to: new Date(2026, 2, 10) },
        { start: "18:00", end: "17:00" }
      )
    ).toEqual({
      from: new Date(2026, 2, 10, 18, 0),
      to: new Date(2026, 2, 10, 18, 0),
    })
  })
})

describe("setRangeTime", () => {
  const range = {
    from: new Date(2026, 2, 10, 9, 0),
    to: new Date(2026, 2, 10, 17, 0),
  }

  it("sets the time on one edge", () => {
    expect(setRangeTime(range, "from", "10:30")).toEqual({
      ...range,
      from: new Date(2026, 2, 10, 10, 30),
    })
  })

  it("keeps the start at or before the end", () => {
    expect(setRangeTime(range, "from", "18:00").from).toEqual(range.to)
  })

  it("keeps the end at or after the start", () => {
    expect(setRangeTime(range, "to", "08:00").to).toEqual(range.from)
  })

  it("clamps to min and max", () => {
    const edges = {
      from: new Date(2026, 2, 5, 9, 0),
      to: new Date(2026, 2, 20, 17, 0),
    }
    expect(setRangeTime(edges, "from", "06:00", BOUNDS).from).toEqual(MIN)
    expect(setRangeTime(edges, "to", "23:00", BOUNDS).to).toEqual(MAX)
  })

  it("ignores an edge with no date and an empty time", () => {
    expect(setRangeTime({ from: range.from }, "to", "10:00")).toEqual({
      from: range.from,
    })
    expect(setRangeTime(range, "from", "")).toBe(range)
  })
})

describe("hourCycleOf", () => {
  it("reads 12 or 24 hours from the locale", () => {
    expect(hourCycleOf("en-US")).toBe(12)
    expect(hourCycleOf("en-GB")).toBe(24)
    expect(hourCycleOf("de-DE")).toBe(24)
  })
})

describe("timeZoneLabel", () => {
  it("returns the short zone name for the date", () => {
    const date = new Date(2026, 2, 10)
    const expected = new Intl.DateTimeFormat("en-US", {
      timeZoneName: "short",
    })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value

    expect(timeZoneLabel(date, "en-US")).toBe(expected)
    expect(timeZoneLabel(date, "en-US")).not.toBe("")
  })
})

describe("formatRange", () => {
  it("formats a full range, a start only, an end only, and nothing", () => {
    const from = new Date(2026, 2, 10, 9, 0)
    const to = new Date(2026, 2, 12, 17, 0)
    expect(formatRange({ from, to }, "en-US")?.replace(/\s/g, " ")).toBe(
      "Mar 10, 2026, 9:00 AM – Mar 12, 2026, 5:00 PM"
    )
    expect(formatRange({ from }, "en-US")?.replace(/\s/g, " ")).toBe(
      "Mar 10, 2026, 9:00 AM"
    )
    expect(formatRange({ to }, "en-US")?.replace(/\s/g, " ")).toBe(
      "Mar 12, 2026, 5:00 PM"
    )
    expect(formatRange({}, "en-US")).toBeNull()
  })
})

// Friday 13 March 2026, 10:30
const NOW = new Date(2026, 2, 13, 10, 30)

function day(date: number, hours = 0, minutes = 0) {
  return new Date(2026, 2, date, hours, minutes)
}

function wholeDay(date: number) {
  return { from: day(date), to: day(date, 23, 59) }
}

describe("parseRangeText", () => {
  it("reads rolling ranges back from or forward to now", () => {
    expect(parseRangeText("last 7 days", NOW)).toEqual({
      from: day(6, 10, 30),
      to: NOW,
    })
    expect(parseRangeText("past 2 hours", NOW)).toEqual({
      from: day(13, 8, 30),
      to: NOW,
    })
    expect(parseRangeText("last 15m", NOW)).toEqual({
      from: day(13, 10, 15),
      to: NOW,
    })
    expect(parseRangeText("last hour", NOW)).toEqual({
      from: day(13, 9, 30),
      to: NOW,
    })
    expect(parseRangeText("next 3 days", NOW)).toEqual({
      from: NOW,
      to: day(16, 10, 30),
    })
    expect(parseRangeText("last 2 weeks", NOW)).toEqual({
      from: new Date(2026, 1, 27, 10, 30),
      to: NOW,
    })
  })

  it("counts minutes and hours as elapsed time across a clock change", () => {
    // 03:30 on the day US clocks spring forward from 02:00 to 03:00
    const afterSpringForward = new Date(2026, 2, 8, 3, 30)
    const range = parseRangeText("last 2 hours", afterSpringForward)
    expect(afterSpringForward.getTime() - range!.from!.getTime()).toBe(
      2 * 60 * 60 * 1000
    )
    const ninetyMinutes = parseRangeText("last 90 minutes", afterSpringForward)
    expect(afterSpringForward.getTime() - ninetyMinutes!.from!.getTime()).toBe(
      90 * 60 * 1000
    )
  })

  it("keeps month and year steps inside the target month", () => {
    const endOfMarch = new Date(2026, 2, 31, 12, 0)
    expect(parseRangeText("last month", endOfMarch)?.from).toEqual(
      new Date(2026, 1, 28, 12, 0)
    )
    const leapDay = new Date(2028, 1, 29)
    expect(parseRangeText("last year", leapDay)?.from).toEqual(
      new Date(2027, 1, 28)
    )
  })

  it("covers the whole day for today, yesterday and tomorrow", () => {
    expect(parseRangeText("today", NOW)).toEqual(wholeDay(13))
    expect(parseRangeText("yesterday", NOW)).toEqual(wholeDay(12))
    expect(parseRangeText("tomorrow", NOW)).toEqual(wholeDay(14))
  })

  it("resolves next and last weekdays strictly after and before today", () => {
    expect(parseRangeText("next fri", NOW)).toEqual(wholeDay(20))
    expect(parseRangeText("last friday", NOW)).toEqual(wholeDay(6))
    expect(parseRangeText("next mon", NOW)).toEqual(wholeDay(16))
    expect(parseRangeText("last mon", NOW)).toEqual(wholeDay(9))
    expect(parseRangeText("next thu", NOW)).toEqual(wholeDay(19))
    expect(parseRangeText("last sat", NOW)).toEqual(wholeDay(7))
  })

  it("resolves a bare or this weekday to today or the coming one", () => {
    expect(parseRangeText("fri", NOW)).toEqual(wholeDay(13))
    expect(parseRangeText("this friday", NOW)).toEqual(wholeDay(13))
    expect(parseRangeText("mon", NOW)).toEqual(wholeDay(16))
    expect(parseRangeText("thurs", NOW)).toEqual(wholeDay(19))
  })

  it("sets only the start for a single moment", () => {
    expect(parseRangeText("next fri 3pm", NOW)).toEqual({ from: day(20, 15) })
    expect(parseRangeText("next fri at 3:30 pm", NOW)).toEqual({
      from: day(20, 15, 30),
    })
    expect(parseRangeText("tomorrow 09:15", NOW)).toEqual({
      from: day(14, 9, 15),
    })
    expect(parseRangeText("noon", NOW)).toEqual({ from: day(13, 12) })
    expect(parseRangeText("now", NOW)).toEqual({ from: NOW })
    expect(parseRangeText("3 days ago", NOW)).toEqual({ from: day(10, 10, 30) })
  })

  it("reads 12 am and 12 pm as midnight and noon", () => {
    expect(parseRangeText("today 12am", NOW)).toEqual({ from: day(13) })
    expect(parseRangeText("today 12pm", NOW)).toEqual({ from: day(13, 12) })
    expect(parseRangeText("today midnight", NOW)).toEqual({ from: day(13) })
  })

  it("reads A to B, starting at the start of A's day and ending at the end of B's", () => {
    expect(parseRangeText("yesterday to now", NOW)).toEqual({
      from: day(12),
      to: NOW,
    })
    expect(parseRangeText("mon to fri", NOW)).toEqual({
      from: day(16),
      to: day(20, 23, 59),
    })
    expect(parseRangeText("last mon until yesterday", NOW)).toEqual({
      from: day(9),
      to: day(12, 23, 59),
    })
    expect(parseRangeText("mon-fri", NOW)).toEqual(
      parseRangeText("mon to fri", NOW)
    )
    expect(parseRangeText("3 days ago – in 2 hours", NOW)).toEqual({
      from: day(10, 10, 30),
      to: day(13, 12, 30),
    })
  })

  it("puts an end that is only a time on the start's day", () => {
    expect(parseRangeText("next fri 3pm to 5pm", NOW)).toEqual({
      from: day(20, 15),
      to: day(20, 17),
    })
    expect(parseRangeText("yesterday 22:00 to today 02:00", NOW)).toEqual({
      from: day(12, 22),
      to: day(13, 2),
    })
  })

  it("ignores case and extra spaces", () => {
    expect(parseRangeText("  Last   7 DAYS ", NOW)).toEqual(
      parseRangeText("last 7 days", NOW)
    )
  })

  it("returns null for text it can't read", () => {
    for (const text of [
      "",
      "banana",
      "last days",
      "last 0 days",
      "13pm",
      "25:00",
      "9",
      "next fri to",
      "mon to tue to wed",
      "fri tomorrow",
    ]) {
      expect(parseRangeText(text, NOW), text).toBeNull()
    }
  })
})

describe("resolveTypedRange", () => {
  it("returns the parsed range", () => {
    expect(resolveTypedRange("last 7 days", NOW)).toEqual({
      range: { from: day(6, 10, 30), to: NOW },
    })
  })

  it("explains text that doesn't parse or ends before it starts", () => {
    expect(resolveTypedRange("banana", NOW).error).toMatch(/couldn't read/i)
    expect(resolveTypedRange("tomorrow to yesterday", NOW).error).toMatch(
      /before the start/i
    )
  })

  it("clamps to min and max, and rejects a range entirely outside them", () => {
    expect(resolveTypedRange("last 30 days", NOW, BOUNDS)).toEqual({
      range: { from: MIN, to: NOW },
    })
    expect(resolveTypedRange("next 2 weeks", NOW, BOUNDS)).toEqual({
      range: { from: NOW, to: MAX },
    })
    expect(
      resolveTypedRange("10 days ago to 9 days ago", NOW, BOUNDS).error
    ).toMatch(/outside/i)
    expect(resolveTypedRange("in 2 weeks", NOW, BOUNDS).error).toMatch(
      /outside/i
    )
  })

  it("rejects a range with dates too far away to represent", () => {
    expect(resolveTypedRange("last 999999999 days", NOW).error).toMatch(
      /couldn't read/i
    )
    expect(
      resolveTypedRange("x", NOW, {}, () => ({ from: new Date(NaN) })).error
    ).toMatch(/couldn't read/i)
  })

  it("uses a custom parser", () => {
    const range = { from: day(1), to: day(2) }
    const parse = vi.fn(() => range)
    expect(resolveTypedRange("erster März", NOW, {}, parse)).toEqual({ range })
    expect(parse).toHaveBeenCalledWith("erster März", NOW)
    expect(resolveTypedRange("x", NOW, {}, () => null).error).toBeDefined()
    expect(resolveTypedRange("x", NOW, {}, () => ({})).error).toBeDefined()
  })
})
