import { describe, expect, it } from "vitest"

import {
  calculateUptimePercentage,
  formatDateLabel,
  formatUptimePercentage,
  getNextSegmentIndex,
  getSegmentAccessibleLabel,
  normalizeDayStatus,
  type UptimeDay,
} from "@/registry/default/lib/uptime-bar"

describe("normalizeDayStatus", () => {
  it("normalizes canonical and variant status strings", () => {
    expect(normalizeDayStatus("operational")).toBe("operational")
    expect(normalizeDayStatus("OPERATIONAL")).toBe("operational")
    expect(normalizeDayStatus("degraded")).toBe("degraded")
    expect(normalizeDayStatus("down")).toBe("down")
    expect(normalizeDayStatus("outage")).toBe("down")
    expect(normalizeDayStatus("no data")).toBe("no-data")
    expect(normalizeDayStatus("no-data")).toBe("no-data")
    expect(normalizeDayStatus("nodata")).toBe("no-data")
    expect(normalizeDayStatus("unknown")).toBe("no-data")
  })
})

describe("calculateUptimePercentage", () => {
  it("returns 100 for all operational days", () => {
    const days: UptimeDay[] = [
      { date: "2026-10-01", status: "operational" },
      { date: "2026-10-02", status: "operational" },
    ]
    expect(calculateUptimePercentage(days)).toBe(100)
  })

  it("returns 100 when days list is empty", () => {
    expect(calculateUptimePercentage([])).toBe(100)
  })

  it("does not count days with no data against uptime", () => {
    const days: UptimeDay[] = [
      { date: "2026-10-01", status: "operational" },
      { date: "2026-10-02", status: "no-data" },
      { date: "2026-10-03", status: "no data" },
    ]
    expect(calculateUptimePercentage(days)).toBe(100)
  })

  it("returns 100 when all days have no data", () => {
    const days: UptimeDay[] = [
      { date: "2026-10-01", status: "no-data" },
      { date: "2026-10-02", status: "no data" },
    ]
    expect(calculateUptimePercentage(days)).toBe(100)
  })

  it("calculates percentage accurately with down days", () => {
    const days: UptimeDay[] = [
      { date: "2026-10-01", status: "operational" },
      { date: "2026-10-02", status: "down" },
    ]
    expect(calculateUptimePercentage(days)).toBe(50)
  })

  it("calculates degraded days using degradedWeight (default 0.5)", () => {
    const days: UptimeDay[] = [
      { date: "2026-10-01", status: "operational" },
      { date: "2026-10-02", status: "degraded" },
    ]
    // (1 + 0.5) / 2 = 75%
    expect(calculateUptimePercentage(days)).toBe(75)
  })

  it("supports custom degradedWeight and rounding decimals", () => {
    const days: UptimeDay[] = [
      { date: "2026-10-01", status: "operational" },
      { date: "2026-10-02", status: "degraded" },
      { date: "2026-10-03", status: "operational" },
    ]
    // (1 + 0.8 + 1) / 3 = 2.8 / 3 = 93.333%
    expect(
      calculateUptimePercentage(days, { degradedWeight: 0.8, decimals: 2 })
    ).toBe(93.33)
  })

  it("falls back to the status score when uptime is NaN", () => {
    const days: UptimeDay[] = [
      { date: "2026-10-01", status: "operational", uptime: Number.NaN },
      { date: "2026-10-02", status: "operational", uptime: 100 },
    ]
    expect(calculateUptimePercentage(days)).toBe(100)
  })

  it("uses explicit day.uptime value when provided", () => {
    const days: UptimeDay[] = [
      { date: "2026-10-01", status: "operational", uptime: 100 },
      { date: "2026-10-02", status: "degraded", uptime: 98.5 },
    ]
    expect(calculateUptimePercentage(days, { decimals: 2 })).toBe(99.25)
  })
})

describe("formatUptimePercentage", () => {
  it("formats percentage with decimals", () => {
    expect(formatUptimePercentage(99.984, 2)).toBe("99.98%")
    expect(formatUptimePercentage(100, 1)).toBe("100.0%")
  })
})

describe("formatDateLabel", () => {
  it("keeps date-only strings on the same calendar day", () => {
    expect(formatDateLabel("2026-01-01")).toBe("Jan 1, 2026")
  })

  it("returns out-of-range date-only strings unchanged", () => {
    expect(formatDateLabel("2024-13-01")).toBe("2024-13-01")
    expect(formatDateLabel("2025-02-29")).toBe("2025-02-29")
  })

  it("accepts leap days", () => {
    expect(formatDateLabel("2024-02-29")).toBe("Feb 29, 2024")
  })

  it("formats date strings into readable formats", () => {
    const label = formatDateLabel("2026-10-31")
    expect(label).toContain("Oct 31, 2026")
  })
})

describe("getSegmentAccessibleLabel", () => {
  it("generates descriptive label without note", () => {
    const day: UptimeDay = {
      date: "2026-10-30",
      status: "operational",
    }
    const label = getSegmentAccessibleLabel(day)
    expect(label).toContain("October 30, 2026")
    expect(label).toContain("operational")
  })

  it("includes note when present", () => {
    const day: UptimeDay = {
      date: "2026-10-31",
      status: "degraded",
      note: "Elevated API latency",
    }
    const label = getSegmentAccessibleLabel(day)
    expect(label).toContain("October 31, 2026")
    expect(label).toContain("degraded")
    expect(label).toContain("Elevated API latency")
  })
})

describe("getNextSegmentIndex", () => {
  it("navigates within bounds using Arrow keys", () => {
    expect(getNextSegmentIndex(2, "ArrowLeft", 5)).toBe(1)
    expect(getNextSegmentIndex(0, "ArrowLeft", 5)).toBe(0) // clamp

    expect(getNextSegmentIndex(2, "ArrowRight", 5)).toBe(3)
    expect(getNextSegmentIndex(4, "ArrowRight", 5)).toBe(4) // clamp
  })

  it("navigates to ends using Home and End", () => {
    expect(getNextSegmentIndex(2, "Home", 5)).toBe(0)
    expect(getNextSegmentIndex(2, "End", 5)).toBe(4)
  })
})
