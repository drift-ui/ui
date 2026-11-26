import { describe, expect, it } from "vitest"
import {
  DEFAULT_SNOOZE_PRESETS,
  DEFAULT_SNOOZE_TIMES,
  combineDateAndTime,
  formatPresetTime,
  getCalendarDateForTimeZone,
  getZonedDateTimeParts,
  isValidTimeZone,
  makeZonedDate,
  resolvePreset,
  resolvePresets,
  type SnoozePresetConfig,
} from "@/registry/default/lib/snooze-picker-utils"

describe("snooze-picker-utils", () => {
  describe("defaults", () => {
    it("exports default snooze presets and times", () => {
      expect(DEFAULT_SNOOZE_PRESETS).toContain("later-today")
      expect(DEFAULT_SNOOZE_TIMES.morning).toBe("09:00")
      expect(DEFAULT_SNOOZE_TIMES.evening).toBe("18:00")
    })
  })

  describe("timeZone utilities", () => {
    it("validates timezones properly", () => {
      expect(isValidTimeZone("UTC")).toBe(true)
      expect(isValidTimeZone("America/New_York")).toBe(true)
      expect(isValidTimeZone("Asia/Tokyo")).toBe(true)
      expect(isValidTimeZone("Invalid/Timezone")).toBe(false)
      expect(isValidTimeZone("")).toBe(false)
      expect(isValidTimeZone(undefined)).toBe(false)
    })

    it("gets zoned date parts in specified timeZone", () => {
      // 2026-05-15 15:00:00 UTC
      const date = new Date("2026-05-15T15:00:00.000Z")
      const nyParts = getZonedDateTimeParts(date, "America/New_York") // EDT = UTC - 4
      expect(nyParts.hour).toBe(11)
      expect(nyParts.day).toBe(15)

      const tokyoParts = getZonedDateTimeParts(date, "Asia/Tokyo") // JST = UTC + 9
      expect(tokyoParts.hour).toBe(0)
      expect(tokyoParts.day).toBe(16)
    })

    it("makes zoned date properly", () => {
      // Create 2026-06-01 09:00:00 in America/New_York (EDT, UTC-4)
      const date = makeZonedDate(2026, 5, 1, 9, 0, 0, "America/New_York")
      expect(date.toISOString()).toBe("2026-06-01T13:00:00.000Z")
    })

    it("falls back to local date parts when invalid timeZone is provided", () => {
      const date = new Date(2026, 4, 15, 12, 30, 0)
      const parts = getZonedDateTimeParts(date, "Invalid/TimeZone")
      expect(parts.year).toBe(2026)
      expect(parts.month).toBe(4)
      expect(parts.day).toBe(15)
      expect(parts.hour).toBe(12)
      expect(parts.minute).toBe(30)
    })

    it("falls back to local Date in makeZonedDate when invalid timeZone is provided", () => {
      const date = makeZonedDate(2026, 4, 15, 12, 30, 0, "Invalid/TimeZone")
      expect(date.getFullYear()).toBe(2026)
      expect(date.getMonth()).toBe(4)
      expect(date.getDate()).toBe(15)
      expect(date.getHours()).toBe(12)
      expect(date.getMinutes()).toBe(30)
    })
  })

  describe("combineDateAndTime", () => {
    it("combines a date and a time string", () => {
      const base = new Date(2026, 4, 15, 0, 0, 0)
      const combined = combineDateAndTime(base, "14:30")
      expect(combined.getHours()).toBe(14)
      expect(combined.getMinutes()).toBe(30)
      expect(combined.getFullYear()).toBe(2026)
      expect(combined.getMonth()).toBe(4)
      expect(combined.getDate()).toBe(15)
    })

    it("combines a date and a time string with timezone", () => {
      const base = new Date("2026-06-01T12:00:00.000Z")
      const combined = combineDateAndTime(base, "10:15", "America/New_York")
      const parts = getZonedDateTimeParts(combined, "America/New_York")
      expect(parts.hour).toBe(10)
      expect(parts.minute).toBe(15)
    })
  })

  describe("formatPresetTime", () => {
    it("formats today", () => {
      const now = new Date(2026, 4, 15, 10, 0, 0)
      const target = new Date(2026, 4, 15, 18, 0, 0)
      const formatted = formatPresetTime(target, now, { hourCycle: 24 })
      expect(formatted).toContain("Today")
      expect(formatted).toContain("18:00")
    })

    it("formats tomorrow", () => {
      const now = new Date(2026, 4, 15, 10, 0, 0) // Friday
      const target = new Date(2026, 4, 16, 9, 0, 0) // Saturday
      const formatted = formatPresetTime(target, now, { hourCycle: 24 })
      expect(formatted).toContain("Tomorrow")
      expect(formatted).toContain("Sat")
      expect(formatted).toContain("09:00")
    })

    it("formats upcoming weekday within 7 days", () => {
      const now = new Date(2026, 4, 11, 10, 0, 0) // Monday
      const target = new Date(2026, 4, 16, 9, 0, 0) // Saturday (+5 days)
      const formatted = formatPresetTime(target, now, { hourCycle: 24 })
      expect(formatted).toContain("Sat")
      expect(formatted).toContain("09:00")
    })

    it("formats future date beyond 7 days", () => {
      const now = new Date(2026, 4, 1, 10, 0, 0)
      const target = new Date(2026, 4, 20, 9, 0, 0)
      const formatted = formatPresetTime(target, now, { hourCycle: 24 })
      expect(formatted).toContain("May")
      expect(formatted).toContain("20")
    })
  })

  describe("resolvePreset", () => {
    // 2026-05-11 is a Monday
    const mondayMorning = new Date(2026, 4, 11, 10, 0, 0)
    // 2026-05-11 17:30
    const mondayLate = new Date(2026, 4, 11, 17, 30, 0)
    // 2026-05-15 is a Friday
    const fridayMorning = new Date(2026, 4, 15, 10, 0, 0)
    // 2026-05-16 is a Saturday
    const saturdayMorning = new Date(2026, 4, 16, 10, 0, 0)
    // 2026-05-17 is a Sunday
    const sundayMorning = new Date(2026, 4, 17, 10, 0, 0)

    it("resolves later-today when before cutoff", () => {
      const resolved = resolvePreset("later-today", mondayMorning)
      expect(resolved).not.toBeNull()
      expect(resolved?.id).toBe("later-today")
      expect(resolved?.label).toBe("Later today")
      expect(resolved?.date.getHours()).toBe(18)
      expect(resolved?.date.getMinutes()).toBe(0)
      expect(resolved?.date.getDate()).toBe(11)
    })

    it("hides later-today when at or past cutoff (>= 17:00)", () => {
      expect(
        resolvePreset("later-today", new Date(2026, 4, 11, 17, 0, 0))
      ).toBeNull()
      expect(resolvePreset("later-today", mondayLate)).toBeNull()
    })

    it("resolves this-evening when before 18:00", () => {
      const resolved = resolvePreset("this-evening", mondayMorning)
      expect(resolved).not.toBeNull()
      expect(resolved?.date.getHours()).toBe(18)
    })

    it("hides this-evening when at or after 18:00", () => {
      const mondayEvening = new Date(2026, 4, 11, 18, 0, 0)
      expect(resolvePreset("this-evening", mondayEvening)).toBeNull()
    })

    it("resolves tomorrow", () => {
      const resolved = resolvePreset("tomorrow", mondayMorning)
      expect(resolved).not.toBeNull()
      expect(resolved?.id).toBe("tomorrow")
      expect(resolved?.date.getDate()).toBe(12)
      expect(resolved?.date.getHours()).toBe(9)
    })

    it("resolves this-weekend on weekdays", () => {
      const resolvedMon = resolvePreset("this-weekend", mondayMorning)
      expect(resolvedMon).not.toBeNull()
      expect(resolvedMon?.date.getDay()).toBe(6) // Saturday
      expect(resolvedMon?.date.getDate()).toBe(16)

      const resolvedFri = resolvePreset("this-weekend", fridayMorning)
      expect(resolvedFri).not.toBeNull()
      expect(resolvedFri?.date.getDay()).toBe(6) // Saturday
      expect(resolvedFri?.date.getDate()).toBe(16)
    })

    it("hides this-weekend on Saturday and Sunday", () => {
      expect(resolvePreset("this-weekend", saturdayMorning)).toBeNull()
      expect(resolvePreset("this-weekend", sundayMorning)).toBeNull()
    })

    it("resolves next-week on various days", () => {
      // On Monday, next-week is next Monday (+7 days)
      const resolvedMon = resolvePreset("next-week", mondayMorning)
      expect(resolvedMon).not.toBeNull()
      expect(resolvedMon?.date.getDay()).toBe(1) // Monday
      expect(resolvedMon?.date.getDate()).toBe(18)

      // On Friday, next-week is next Monday (+3 days)
      const resolvedFri = resolvePreset("next-week", fridayMorning)
      expect(resolvedFri).not.toBeNull()
      expect(resolvedFri?.date.getDay()).toBe(1)
      expect(resolvedFri?.date.getDate()).toBe(18)

      // On Sunday, next-week is next Monday (+1 day)
      const resolvedSun = resolvePreset("next-week", sundayMorning)
      expect(resolvedSun).not.toBeNull()
      expect(resolvedSun?.date.getDay()).toBe(1)
      expect(resolvedSun?.date.getDate()).toBe(18)
    })

    it("resolves this-weekend with Sunday target (weekendDay: 0)", () => {
      const resolvedMon = resolvePreset("this-weekend", mondayMorning, {
        times: { weekendDay: 0 },
      })
      expect(resolvedMon).not.toBeNull()
      expect(resolvedMon?.date.getDay()).toBe(0) // Sunday
      expect(resolvedMon?.date.getDate()).toBe(17)

      // On Sunday, this-weekend with weekendDay: 0 returns null
      expect(
        resolvePreset("this-weekend", sundayMorning, {
          times: { weekendDay: 0 },
        })
      ).toBeNull()
    })

    it("resolves next-weekend on Saturday and Sunday", () => {
      // On Saturday, next weekend is next Saturday
      const resolvedSat = resolvePreset("next-weekend", saturdayMorning)
      expect(resolvedSat).not.toBeNull()
      expect(resolvedSat?.date.getDay()).toBe(6)
      expect(resolvedSat?.date.getDate()).toBe(23)

      // On Sunday, current weekend ended, so next weekend is the upcoming Saturday
      const resolvedSun = resolvePreset("next-weekend", sundayMorning)
      expect(resolvedSun).not.toBeNull()
      expect(resolvedSun?.date.getDay()).toBe(6)
      expect(resolvedSun?.date.getDate()).toBe(23)

      // With weekendDay: 0 (Sunday) on Monday, next weekend is Sunday next week
      const resolvedMonSunTarget = resolvePreset(
        "next-weekend",
        mondayMorning,
        {
          times: { weekendDay: 0 },
        }
      )
      expect(resolvedMonSunTarget?.date.getDay()).toBe(0)
      expect(resolvedMonSunTarget?.date.getDate()).toBe(24)

      // With weekendDay: 0 on Sunday, next weekend is next Sunday
      const resolvedSunSunTarget = resolvePreset(
        "next-weekend",
        sundayMorning,
        {
          times: { weekendDay: 0 },
        }
      )
      expect(resolvedSunSunTarget?.date.getDay()).toBe(0)
      expect(resolvedSunSunTarget?.date.getDate()).toBe(24)

      // On Wednesday (weekday 3 < weekendDay 6), next weekend is Saturday after next
      const wednesdayMorning = new Date(2026, 4, 13, 10, 0, 0)
      const resolvedWed = resolvePreset("next-weekend", wednesdayMorning)
      expect(resolvedWed?.date.getDay()).toBe(6)
      expect(resolvedWed?.date.getDate()).toBe(23)

      // On Friday (weekday 5 > weekendDay 4), next weekend is next Thursday
      const fridayMorning = new Date(2026, 4, 15, 10, 0, 0)
      const resolvedFriCustom = resolvePreset("next-weekend", fridayMorning, {
        times: { weekendDay: 4 },
      })
      expect(resolvedFriCustom?.date.getDay()).toBe(4)
      expect(resolvedFriCustom?.date.getDate()).toBe(21)
    })

    it("normalizes forward for spring-forward nonexistent times in makeZonedDate", () => {
      // 2026-03-08 in America/New_York jumps from 02:00 to 03:00 EST -> EDT
      const date = makeZonedDate(2026, 2, 8, 2, 30, 0, "America/New_York")
      const parts = getZonedDateTimeParts(date, "America/New_York")
      expect(parts.hour).toBe(3)
      expect(parts.minute).toBe(30)
    })

    it("gets calendar date for timezone", () => {
      // 2026-05-15 01:00 UTC is May 14 in America/New_York (EDT)
      const instant = new Date("2026-05-15T01:00:00.000Z")
      const calDate = getCalendarDateForTimeZone(instant, "America/New_York")
      expect(calDate.getFullYear()).toBe(2026)
      expect(calDate.getMonth()).toBe(4) // May
      expect(calDate.getDate()).toBe(14)
    })

    it("returns null for unknown preset or invalid config", () => {
      // @ts-expect-error test unknown string
      expect(resolvePreset("unknown-preset", mondayMorning)).toBeNull()
      expect(
        resolvePreset({ id: "custom", label: "Custom" }, mondayMorning)
      ).toBeNull()
      expect(
        resolvePreset(
          { id: "custom", label: "Custom", resolve: () => null },
          mondayMorning
        )
      ).toBeNull()
    })

    it("handles custom preset with static date", () => {
      const customDate = new Date(2026, 6, 1, 14, 0, 0)
      const customPreset: SnoozePresetConfig = {
        id: "custom-static",
        label: "In July",
        date: customDate,
      }
      const resolved = resolvePreset(customPreset, mondayMorning)
      expect(resolved?.id).toBe("custom-static")
      expect(resolved?.label).toBe("In July")
      expect(resolved?.date).toEqual(customDate)
    })

    it("handles custom preset with resolver function", () => {
      const customPreset: SnoozePresetConfig = {
        id: "in-two-hours",
        label: "In 2 hours",
        resolve: (now) => new Date(now.getTime() + 2 * 60 * 60 * 1000),
      }
      const resolved = resolvePreset(customPreset, mondayMorning)
      expect(resolved?.id).toBe("in-two-hours")
      expect(resolved?.date.getTime()).toBe(
        mondayMorning.getTime() + 2 * 60 * 60 * 1000
      )
    })

    it("supports custom times config", () => {
      const resolved = resolvePreset("tomorrow", mondayMorning, {
        times: { morning: "08:30" },
      })
      expect(resolved?.date.getHours()).toBe(8)
      expect(resolved?.date.getMinutes()).toBe(30)
    })
  })

  describe("resolvePresets", () => {
    it("resolves default presets filtering out expired ones", () => {
      // 2026-05-11 10:00 (Monday morning) -> all 4 default presets valid
      const morning = new Date(2026, 4, 11, 10, 0, 0)
      const morningList = resolvePresets(DEFAULT_SNOOZE_PRESETS, morning)
      expect(morningList.map((p) => p.id)).toEqual([
        "later-today",
        "tomorrow",
        "this-weekend",
        "next-week",
      ])

      // 2026-05-11 18:00 (Monday evening) -> later-today filtered out
      const evening = new Date(2026, 4, 11, 18, 0, 0)
      const eveningList = resolvePresets(DEFAULT_SNOOZE_PRESETS, evening)
      expect(eveningList.map((p) => p.id)).toEqual([
        "tomorrow",
        "this-weekend",
        "next-week",
      ])

      // 2026-05-16 10:00 (Saturday morning) -> later-today and this-weekend filtered out
      const saturday = new Date(2026, 4, 16, 18, 0, 0)
      const satList = resolvePresets(DEFAULT_SNOOZE_PRESETS, saturday)
      expect(satList.map((p) => p.id)).toEqual(["tomorrow", "next-week"])

      const friday = new Date(2026, 10, 27, 10, 0, 0)
      const fridayList = resolvePresets(DEFAULT_SNOOZE_PRESETS, friday)
      expect(fridayList.map((p) => p.id)).toEqual([
        "later-today",
        "tomorrow",
        "next-week",
      ])
    })
  })
})
