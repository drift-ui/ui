import { describe, expect, it } from "vitest"

import {
  addUTCDays,
  buildHeatmapLayout,
  calculateIntensityLevel,
  calculateTooltipPosition,
  formatCellAccessibleLabel,
  formatDateLabel,
  formatUTCDate,
  getUTCDayOfWeek,
  getWeekdayLabels,
  parseUTCDate,
  stepHeatmapCoordinate,
} from "@/registry/default/lib/activity-heatmap"

describe("UTC date utilities", () => {
  it("parses and formats dates strictly in UTC", () => {
    const parsed = parseUTCDate("2026-10-31")
    expect(parsed.getUTCFullYear()).toBe(2026)
    expect(parsed.getUTCMonth()).toBe(9) // 0-indexed October
    expect(parsed.getUTCDate()).toBe(31)

    expect(formatUTCDate(parsed)).toBe("2026-10-31")
  })

  it("handles leap years correctly", () => {
    const leap = parseUTCDate("2024-02-29")
    expect(leap.getUTCDate()).toBe(29)
    expect(formatUTCDate(leap)).toBe("2024-02-29")

    const nextDay = addUTCDays(leap, 1)
    expect(formatUTCDate(nextDay)).toBe("2024-03-01")
  })

  it("adds UTC days across year boundaries", () => {
    const endOfYear = parseUTCDate("2025-12-31")
    const newYear = addUTCDays(endOfYear, 1)
    expect(formatUTCDate(newYear)).toBe("2026-01-01")

    const prevDay = addUTCDays(newYear, -1)
    expect(formatUTCDate(prevDay)).toBe("2025-12-31")
  })

  it("computes day of week consistently", () => {
    // 2026-10-31 is Saturday (day 6)
    expect(getUTCDayOfWeek(parseUTCDate("2026-10-31"))).toBe(6)
    // 2026-11-01 is Sunday (day 0)
    expect(getUTCDayOfWeek(parseUTCDate("2026-11-01"))).toBe(0)
  })

  it("formats date labels with and without year", () => {
    expect(formatDateLabel("2026-10-31", true)).toBe("October 31, 2026")
    expect(formatDateLabel("2026-10-31", false)).toBe("October 31")
  })
})

describe("formatCellAccessibleLabel", () => {
  it("formats zero, singular, and plural counts", () => {
    expect(formatCellAccessibleLabel(0, "2026-10-31", "contributions")).toBe(
      "No contributions on October 31"
    )
    expect(formatCellAccessibleLabel(1, "2026-10-31", "contributions")).toBe(
      "1 contribution on October 31"
    )
    expect(formatCellAccessibleLabel(7, "2026-10-31", "contributions")).toBe(
      "7 contributions on October 31"
    )
  })

  it("formats custom unit names", () => {
    expect(formatCellAccessibleLabel(1, "2026-05-15", "commits")).toBe(
      "1 commit on May 15"
    )
    expect(formatCellAccessibleLabel(12, "2026-05-15", "commits")).toBe(
      "12 commits on May 15"
    )
  })
})

describe("calculateIntensityLevel", () => {
  it("returns 0 for zero, negative, or invalid counts", () => {
    expect(calculateIntensityLevel(0, 100)).toBe(0)
    expect(calculateIntensityLevel(-5, 100)).toBe(0)
    expect(calculateIntensityLevel(Number.NaN, 100)).toBe(0)
  })

  it("calculates quartile levels when maxCount is provided", () => {
    expect(calculateIntensityLevel(20, 100)).toBe(1)
    expect(calculateIntensityLevel(50, 100)).toBe(2)
    expect(calculateIntensityLevel(75, 100)).toBe(3)
    expect(calculateIntensityLevel(90, 100)).toBe(4)
  })

  it("supports custom thresholds", () => {
    const thresholds = [1, 5, 10, 20]
    expect(calculateIntensityLevel(0, 100, thresholds)).toBe(0)
    expect(calculateIntensityLevel(2, 100, thresholds)).toBe(1)
    expect(calculateIntensityLevel(7, 100, thresholds)).toBe(2)
    expect(calculateIntensityLevel(15, 100, thresholds)).toBe(3)
    expect(calculateIntensityLevel(25, 100, thresholds)).toBe(4)
  })
})

describe("getWeekdayLabels", () => {
  it("orders weekdays starting on Sunday", () => {
    expect(getWeekdayLabels(0)).toEqual([
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
    ])
  })

  it("orders weekdays starting on Monday", () => {
    expect(getWeekdayLabels(1)).toEqual([
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ])
  })
})

describe("buildHeatmapLayout", () => {
  it("builds a layout with 7 rows and week columns", () => {
    const layout = buildHeatmapLayout({
      data: [
        { date: "2026-10-31", count: 7 },
        { date: "2026-10-30", count: 3 },
      ],
      startDate: "2026-01-01",
      endDate: "2026-10-31",
      weekStartsOn: 1,
    })

    expect(layout.rows).toHaveLength(7)
    expect(layout.weeks.length).toBeGreaterThanOrEqual(44)
    expect(layout.totalCount).toBe(10)
    expect(layout.maxCount).toBe(7)
    expect(layout.startDate).toBe("2026-01-01")
    expect(layout.endDate).toBe("2026-10-31")
  })

  it("aggregates duplicate dates", () => {
    const layout = buildHeatmapLayout({
      data: [
        { date: "2026-05-01", count: 4 },
        { date: "2026-05-01", count: 6 },
      ],
      startDate: "2026-04-01",
      endDate: "2026-05-31",
    })

    const may1 = layout.weeks
      .flat()
      .find((cell) => cell.date === "2026-05-01" && cell.inRange)

    expect(may1).toBeDefined()
    expect(may1?.count).toBe(10)
    expect(layout.totalCount).toBe(10)
  })

  it("handles empty data gracefully without throwing", () => {
    const layout = buildHeatmapLayout({
      data: [],
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    })

    expect(layout.rows).toHaveLength(7)
    expect(layout.totalCount).toBe(0)
    expect(layout.maxCount).toBe(0)
  })
})

describe("stepHeatmapCoordinate", () => {
  it("navigates within grid bounds", () => {
    const layout = buildHeatmapLayout({
      data: [{ date: "2026-06-15", count: 5 }],
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    })

    // ArrowDown moves row + 1
    const [r1, c1] = stepHeatmapCoordinate([2, 10], "ArrowDown", layout)
    expect(r1).toBe(3)
    expect(c1).toBe(10)

    // ArrowUp moves row - 1
    const [r2, c2] = stepHeatmapCoordinate([2, 10], "ArrowUp", layout)
    expect(r2).toBe(1)
    expect(c2).toBe(10)

    // ArrowRight moves col + 1
    const [r3, c3] = stepHeatmapCoordinate([2, 10], "ArrowRight", layout)
    expect(r3).toBe(2)
    expect(c3).toBe(11)

    // ArrowLeft moves col - 1
    const [r4, c4] = stepHeatmapCoordinate([2, 10], "ArrowLeft", layout)
    expect(r4).toBe(2)
    expect(c4).toBe(9)

    // Home jumps to col 0 (or nearest in-range cell)
    const [, cHome] = stepHeatmapCoordinate([2, 10], "Home", layout)
    expect(cHome).toBeLessThanOrEqual(1)

    // End jumps to last col
    const [, cEnd] = stepHeatmapCoordinate([2, 10], "End", layout)
    expect(cEnd).toBe(layout.weeks.length - 1)
  })
})

describe("calculateTooltipPosition", () => {
  const containerRect = { top: 100, left: 50, width: 600, height: 300 }

  it("places tooltip centered above cell when ample space is available", () => {
    const pos = calculateTooltipPosition({
      cellRect: { top: 200, left: 250, right: 262, width: 12, height: 12 },
      containerRect,
      tooltipWidth: 140,
      tooltipHeight: 44,
      margin: 8,
    })

    expect(pos.visible).toBe(true)
    expect(pos.placement).toBe("top")
    // cell centerX relative to container = (250 - 50) + 6 = 206
    expect(pos.left).toBe(206)
    // top = (200 - 100) - 8 = 92
    expect(pos.top).toBe(92)
  })

  it("flips placement to bottom when cell is near top of container", () => {
    const pos = calculateTooltipPosition({
      cellRect: { top: 110, left: 250, right: 262, width: 12, height: 12 },
      containerRect,
      tooltipWidth: 140,
      tooltipHeight: 44,
      margin: 8,
    })

    expect(pos.visible).toBe(true)
    expect(pos.placement).toBe("bottom")
    // bottom top = (110 + 12 - 100) + 8 = 30
    expect(pos.top).toBe(30)
  })

  it("clamps left boundary when cell is near the left edge", () => {
    const pos = calculateTooltipPosition({
      cellRect: { top: 200, left: 60, right: 72, width: 12, height: 12 },
      containerRect,
      tooltipWidth: 140,
      tooltipHeight: 44,
      margin: 8,
    })

    expect(pos.visible).toBe(true)
    // halfWidth (70) + margin (8) = 78
    expect(pos.left).toBe(78)
  })

  it("clamps right boundary when cell is near the right edge", () => {
    const pos = calculateTooltipPosition({
      cellRect: { top: 200, left: 640, right: 652, width: 12, height: 12 },
      containerRect,
      tooltipWidth: 140,
      tooltipHeight: 44,
      margin: 8,
    })

    expect(pos.visible).toBe(true)
    // containerWidth (600) - halfWidth (70) - margin (8) = 522
    expect(pos.left).toBe(522)
  })

  it("returns visible false when cell is outside scroll viewport", () => {
    const pos = calculateTooltipPosition({
      cellRect: { top: 200, left: 40, right: 52, width: 12, height: 12 },
      containerRect,
      scrollRect: { left: 100, right: 500, width: 400 },
    })

    expect(pos.visible).toBe(false)
  })

  it("infers cellBottom when bottom is omitted and placement flips to bottom", () => {
    const pos = calculateTooltipPosition({
      cellRect: { top: 110, left: 250, width: 12, height: 12 },
      containerRect,
      tooltipWidth: 140,
      tooltipHeight: 44,
      margin: 8,
    })

    expect(pos.visible).toBe(true)
    expect(pos.placement).toBe("bottom")
    // cellBottom is inferred as 110 + 12 = 122; top = 122 - 100 + 8 = 30
    expect(pos.top).toBe(30)
  })

  it("infers cellRight when right is omitted to check scroll boundary visibility", () => {
    // cellRight inferred as 40 + 12 = 52 < scrollRect.left + 2 (102) -> hidden
    const pos = calculateTooltipPosition({
      cellRect: { top: 200, left: 40, width: 12, height: 12 },
      containerRect,
      scrollRect: { left: 100, right: 500, width: 400 },
    })

    expect(pos.visible).toBe(false)
  })

  it("handles narrow container smaller than tooltip width", () => {
    const narrowContainer = { top: 100, left: 50, width: 100, height: 300 }
    const pos = calculateTooltipPosition({
      cellRect: { top: 200, left: 70, width: 12, height: 12 },
      containerRect: narrowContainer,
      tooltipWidth: 140,
    })

    expect(pos.visible).toBe(true)
    // When container is too narrow, left remains rawCenterX
    expect(pos.left).toBe(26)
  })

  it("returns visible false when cell is to the right of scroll viewport", () => {
    const pos = calculateTooltipPosition({
      cellRect: { top: 200, left: 550, width: 12, height: 12 },
      containerRect,
      scrollRect: { left: 100, right: 500, width: 400 },
    })

    expect(pos.visible).toBe(false)
  })

  it("clamps and centers tooltip when container width exactly matches tooltipWidth + 2 * margin", () => {
    const exactContainer = { top: 100, left: 50, width: 156, height: 300 }
    const pos = calculateTooltipPosition({
      cellRect: { top: 200, left: 52, width: 12, height: 12 },
      containerRect: exactContainer,
      tooltipWidth: 140,
      margin: 8,
    })

    expect(pos.visible).toBe(true)
    // halfWidth (70) + margin (8) = 78
    expect(pos.left).toBe(78)
  })

  it("clamps vertical position when tall tooltip is placed below a cell", () => {
    const shortContainer = { top: 100, left: 50, width: 600, height: 150 }
    const pos = calculateTooltipPosition({
      cellRect: { top: 160, left: 250, width: 12, height: 12 },
      containerRect: shortContainer,
      tooltipWidth: 140,
      tooltipHeight: 80,
      margin: 8,
    })

    expect(pos.visible).toBe(true)
    expect(pos.placement).toBe("bottom")
    // containerHeight (150) - tooltipHeight (80) - margin (8) = 62
    expect(pos.top).toBe(62)
  })
})
