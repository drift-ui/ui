import { describe, expect, it } from "vitest"

import {
  composeDuration,
  decomposeDuration,
  formatDuration,
  parseDurationString,
  readSegment,
  roundToSmallestUnit,
  segmentRange,
  segmentText,
  stepSegment,
  writeSegment,
} from "@/registry/default/lib/duration-input-utils"

describe("duration-input logic", () => {
  describe("decomposeDuration", () => {
    it("decomposes milliseconds into hours, minutes, seconds", () => {
      // 1h 30m 15s = 3600000 + 1800000 + 15000 = 5415000 ms
      expect(decomposeDuration(5415000, ["h", "m", "s"])).toEqual({
        h: 1,
        m: 30,
        s: 15,
      })
    })

    it("accumulates into the largest available unit", () => {
      // 90 minutes with only m and s
      expect(decomposeDuration(5400000, ["m", "s"])).toEqual({
        m: 90,
        s: 0,
      })
    })

    it("handles days and hours", () => {
      // 2d 4h = 2 * 86400000 + 4 * 3600000 = 187200000 ms
      expect(decomposeDuration(187200000, ["d", "h", "m"])).toEqual({
        d: 2,
        h: 4,
        m: 0,
      })
    })

    it("returns null for null or NaN", () => {
      expect(decomposeDuration(null, ["h", "m"])).toBeNull()
      expect(decomposeDuration(undefined, ["h", "m"])).toBeNull()
      expect(decomposeDuration(Number.NaN, ["h", "m"])).toBeNull()
    })
  })

  describe("composeDuration", () => {
    it("recomposes segment parts into milliseconds", () => {
      expect(composeDuration({ h: 1, m: 30, s: 0 })).toBe(5400000)
      expect(composeDuration({ d: 2, h: 4 })).toBe(187200000)
      expect(composeDuration({ s: 45, ms: 500 })).toBe(45500)
    })
  })

  describe("parseDurationString", () => {
    it("parses single unit shorthand", () => {
      expect(parseDurationString("90m")).toBe(5400000)
      expect(parseDurationString("45s")).toBe(45000)
      expect(parseDurationString("2d")).toBe(172800000)
      expect(parseDurationString("500ms")).toBe(500)
    })

    it("parses compound shorthand with spaces and variations", () => {
      expect(parseDurationString("1h 30m")).toBe(5400000)
      expect(parseDurationString("1h30m")).toBe(5400000)
      expect(parseDurationString("2d 4h")).toBe(187200000)
      expect(parseDurationString("1 hour 30 mins")).toBe(5400000)
      expect(parseDurationString("2 days 4 hours")).toBe(187200000)
    })

    it("parses fractional shorthand", () => {
      expect(parseDurationString("1.5h")).toBe(5400000)
      expect(parseDurationString("1,5h")).toBe(5400000)
      expect(parseDurationString("0.5m")).toBe(30000)
    })

    it("parses ISO 8601 durations", () => {
      expect(parseDurationString("PT1H30M")).toBe(5400000)
      expect(parseDurationString("PT90M")).toBe(5400000)
      expect(parseDurationString("P2DT4H")).toBe(187200000)
      expect(parseDurationString("PT45S")).toBe(45000)
    })

    it("parses bare numbers with fallback unit", () => {
      expect(parseDurationString("90", "m")).toBe(5400000)
      expect(parseDurationString("30", "s")).toBe(30000)
    })

    it("returns null for invalid strings", () => {
      expect(parseDurationString("")).toBeNull()
      expect(parseDurationString("   ")).toBeNull()
      expect(parseDurationString("random text")).toBeNull()
    })
  })

  describe("parseDurationString on malformed input", () => {
    it.each([
      "P1M",
      "P1Y2M10DT2H30M",
      "PT-5M",
      "1h 30",
      "1:30m",
      "-5m",
      "retry after 5m or 10m",
      "1,000ms",
      "1,000",
    ])("rejects %s", (input) => {
      expect(parseDurationString(input)).toBeNull()
    })

    it("still reads a decimal comma", () => {
      expect(parseDurationString("1,5")).toBe(90000)
      expect(parseDurationString("1,25h")).toBe(4500000)
    })
  })

  describe("roundToSmallestUnit", () => {
    it("rounds to the smallest of the given units", () => {
      expect(roundToSmallestUnit(1500, ["h", "m", "s"])).toBe(2000)
      expect(roundToSmallestUnit(20000, ["h", "m"])).toBe(0)
      expect(roundToSmallestUnit(1500, ["s", "ms"])).toBe(1500)
    })
  })

  describe("formatDuration", () => {
    it("formats milliseconds into readable shorthand", () => {
      expect(formatDuration(5400000, ["h", "m"])).toBe("1h 30m")
      expect(formatDuration(187200000, ["d", "h", "m"])).toBe("2d 4h")
      expect(formatDuration(0, ["h", "m"])).toBe("0m")
      expect(formatDuration(null, ["h", "m"])).toBe("")
    })
  })

  describe("segmentRange", () => {
    it("computes limits for subordinate units", () => {
      expect(segmentRange("m", ["h", "m", "s"])).toEqual({ min: 0, max: 59 })
      expect(segmentRange("s", ["h", "m", "s"])).toEqual({ min: 0, max: 59 })
      expect(segmentRange("h", ["d", "h", "m"])).toEqual({ min: 0, max: 23 })
    })

    it("bounds largest unit by max if provided", () => {
      expect(segmentRange("h", ["h", "m", "s"], 86400000)).toEqual({
        min: 0,
        max: 24,
      })
    })
  })

  describe("segmentRange on the largest unit", () => {
    it("grows past the default cap to include the current value", () => {
      expect(
        segmentRange("h", ["h", "m"], undefined, 0, 1200 * 3600000)
      ).toEqual({ min: 0, max: 1200 })
    })

    it("derives its lower bound from min", () => {
      expect(segmentRange("h", ["h", "m"], undefined, 7200000)).toEqual({
        min: 2,
        max: 999,
      })
    })
  })

  describe("readSegment and writeSegment", () => {
    it("reads and writes segment values, handling roll-over", () => {
      expect(readSegment(5400000, "h", ["h", "m", "s"])).toBe(1)
      expect(readSegment(5400000, "m", ["h", "m", "s"])).toBe(30)

      // writing 90 to minutes when hours exist rolls over to 1h 30m (5400000 ms)
      const rolled = writeSegment(0, "m", 90, ["h", "m", "s"])
      expect(rolled).toBe(5400000)
      expect(readSegment(rolled, "h", ["h", "m", "s"])).toBe(1)
      expect(readSegment(rolled, "m", ["h", "m", "s"])).toBe(30)
    })

    it("clamps to min and max", () => {
      expect(writeSegment(0, "m", -5, ["h", "m"], 100000, 0)).toBe(0)
      expect(writeSegment(0, "h", 100, ["h", "m"], 7200000, 0)).toBe(7200000)
    })
  })

  describe("stepSegment", () => {
    it("steps duration by delta and rolls over across units", () => {
      // 59m + 1m = 1h 00m = 3600000 ms
      const stepped = stepSegment(59 * 60000, "m", 1, ["h", "m", "s"])
      expect(stepped).toBe(3600000)
      expect(readSegment(stepped, "h", ["h", "m", "s"])).toBe(1)
      expect(readSegment(stepped, "m", ["h", "m", "s"])).toBe(0)
    })

    it("clamps stepping to min", () => {
      expect(stepSegment(0, "m", -1, ["h", "m", "s"])).toBe(0)
    })
  })

  describe("segmentText", () => {
    it("pads segments to two digits or returns placeholders", () => {
      expect(segmentText(null, "h", ["h", "m"])).toBe("--")
      expect(segmentText(5400000, "h", ["h", "m"])).toBe("01")
      expect(segmentText(5400000, "m", ["h", "m"])).toBe("30")
      expect(segmentText(187200000, "d", ["d", "h"])).toBe("2")
    })
  })
})
