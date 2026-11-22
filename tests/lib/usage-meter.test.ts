import { describe, expect, it } from "vitest"

import {
  calculateMeterStatus,
  calculatePercentage,
  calculateSegments,
  formatUsageValue,
  getUsageAriaValueText,
  resolveThreshold,
  type UsageMeterSegment,
} from "@/registry/default/lib/usage-meter-utils"

describe("usage-meter-utils", () => {
  describe("resolveThreshold", () => {
    it("returns default ratio of max when threshold is undefined", () => {
      expect(resolveThreshold(undefined, 100, 0.8)).toBe(80)
      expect(resolveThreshold(undefined, 10, 0.5)).toBe(5)
    })

    it("treats thresholds between 0 and 1 as ratios", () => {
      expect(resolveThreshold(0.75, 100, 0.8)).toBe(75)
      expect(resolveThreshold(0.9, 10, 0.8)).toBe(9)
      expect(resolveThreshold(1.0, 50, 0.8)).toBe(50)
      expect(resolveThreshold(0, 100, 0.8)).toBe(0)
    })

    it("treats thresholds greater than 1 as absolute values", () => {
      expect(resolveThreshold(85, 100, 0.8)).toBe(85)
      expect(resolveThreshold(15, 20, 0.8)).toBe(15)
    })
  })

  describe("calculateMeterStatus", () => {
    it("returns 'normal' when below warning threshold", () => {
      expect(calculateMeterStatus({ value: 5, max: 10, warningAt: 0.8 })).toBe(
        "normal"
      )
      expect(
        calculateMeterStatus({ value: 7.9, max: 10, warningAt: 0.8 })
      ).toBe("normal")
    })

    it("returns 'warning' when at or above warning threshold but within max", () => {
      expect(calculateMeterStatus({ value: 8, max: 10, warningAt: 0.8 })).toBe(
        "warning"
      )
      expect(
        calculateMeterStatus({ value: 9.5, max: 10, warningAt: 0.8 })
      ).toBe("warning")
      expect(calculateMeterStatus({ value: 10, max: 10, warningAt: 0.8 })).toBe(
        "warning"
      )
    })

    it("returns 'danger' when above danger threshold or max", () => {
      expect(calculateMeterStatus({ value: 10.1, max: 10 })).toBe("danger")
      expect(calculateMeterStatus({ value: 12, max: 10 })).toBe("danger")
    })

    it("supports custom absolute thresholds", () => {
      expect(
        calculateMeterStatus({
          value: 85,
          max: 100,
          warningAt: 80,
          dangerAt: 95,
        })
      ).toBe("warning")
      expect(
        calculateMeterStatus({
          value: 96,
          max: 100,
          warningAt: 80,
          dangerAt: 95,
        })
      ).toBe("danger")
    })

    it("handles zero and negative max safely", () => {
      expect(calculateMeterStatus({ value: 0, max: 0 })).toBe("normal")
      expect(calculateMeterStatus({ value: 5, max: 0 })).toBe("danger")
      expect(calculateMeterStatus({ value: -1, max: -5 })).toBe("normal")
    })
  })

  describe("calculatePercentage", () => {
    it("computes accurate percentages with specified decimals", () => {
      expect(calculatePercentage(7.2, 10, 1)).toBe(72)
      expect(calculatePercentage(1, 3, 2)).toBe(33.33)
      expect(calculatePercentage(1, 3, 0)).toBe(33)
    })

    it("supports values over 100%", () => {
      expect(calculatePercentage(12, 10, 1)).toBe(120)
      expect(calculatePercentage(25, 20, 0)).toBe(125)
    })

    it("returns 0 when max is 0 or negative", () => {
      expect(calculatePercentage(5, 0)).toBe(0)
      expect(calculatePercentage(5, -10)).toBe(0)
    })
  })

  describe("calculateSegments", () => {
    const sampleSegments: UsageMeterSegment[] = [
      { label: "Images", value: 4.1 },
      { label: "Video", value: 3.1 },
      { label: "Audio", value: 1.2 },
    ]

    it("computes percentage relative to max and share relative to total", () => {
      const result = calculateSegments(sampleSegments, 10)
      expect(result).toHaveLength(3)

      expect(result[0].label).toBe("Images")
      expect(result[0].percentage).toBe(41)
      expect(result[0].share).toBe(48.81) // 4.1 / 8.4
      expect(result[0].color).toBe("bg-chart-1")

      expect(result[1].label).toBe("Video")
      expect(result[1].percentage).toBe(31)
      expect(result[1].share).toBe(36.9) // 3.1 / 8.4
      expect(result[1].color).toBe("bg-chart-2")

      expect(result[2].label).toBe("Audio")
      expect(result[2].percentage).toBe(12)
      expect(result[2].share).toBe(14.29) // 1.2 / 8.4
      expect(result[2].color).toBe("bg-chart-3")
    })

    it("respects custom segment colors", () => {
      const custom: UsageMeterSegment[] = [
        { label: "Doc", value: 2, color: "bg-emerald-500" },
      ]
      const result = calculateSegments(custom, 10)
      expect(result[0].color).toBe("bg-emerald-500")
    })

    it("cycles through default colors if segments exceed palette size", () => {
      const many: UsageMeterSegment[] = [
        { label: "1", value: 1 },
        { label: "2", value: 1 },
        { label: "3", value: 1 },
        { label: "4", value: 1 },
        { label: "5", value: 1 },
        { label: "6", value: 1 },
      ]
      const result = calculateSegments(many, 10)
      expect(result[0].color).toBe("bg-chart-1")
      expect(result[4].color).toBe("bg-chart-5")
      expect(result[5].color).toBe("bg-chart-1")
    })

    it("clamps negative values to 0", () => {
      const negative: UsageMeterSegment[] = [
        { label: "Corrupted", value: -5 },
        { label: "Valid", value: 10 },
      ]
      const result = calculateSegments(negative, 10)
      expect(result[0].value).toBe(0)
      expect(result[0].percentage).toBe(0)
      expect(result[1].share).toBe(100)
    })

    it("handles empty segments gracefully", () => {
      expect(calculateSegments([], 10)).toEqual([])
    })
  })

  describe("formatUsageValue", () => {
    it("formats standard numbers with units", () => {
      expect(formatUsageValue(7.2, { unit: "GB" })).toBe("7.2 GB")
      expect(formatUsageValue(1500, { unit: "seats" })).toBe("1,500 seats")
    })

    it("formats percent units without space", () => {
      expect(formatUsageValue(85, { unit: "%" })).toBe("85%")
    })

    it("formats values without units", () => {
      expect(formatUsageValue(42)).toBe("42")
    })

    it("respects decimals option", () => {
      expect(formatUsageValue(7, { unit: "GB", decimals: 2 })).toBe("7.00 GB")
      expect(formatUsageValue(7.234, { unit: "GB", decimals: 1 })).toBe(
        "7.2 GB"
      )
    })

    it("respects locale", () => {
      expect(formatUsageValue(1500.5, { unit: "MB", locale: "de-DE" })).toBe(
        "1.500,5 MB"
      )
    })
  })

  describe("getUsageAriaValueText", () => {
    it("generates descriptive text for values within limit", () => {
      expect(
        getUsageAriaValueText({
          value: 7.2,
          max: 10,
          unit: "GB",
          decimals: 1,
        })
      ).toBe("7.2 GB of 10.0 GB, 72%")
    })

    it("generates overage text when exceeding limit", () => {
      expect(
        getUsageAriaValueText({
          value: 12,
          max: 10,
          unit: "GB",
          decimals: 0,
        })
      ).toBe("12 GB of 10 GB, 120% (2 GB over limit)")
    })

    it("handles meter without unit", () => {
      expect(
        getUsageAriaValueText({
          value: 18,
          max: 20,
        })
      ).toBe("18 of 20, 90%")
    })
  })
})
