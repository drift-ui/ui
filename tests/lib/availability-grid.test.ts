import { describe, expect, it } from "vitest"

import {
  convertAvailabilityTimeZone,
  DEFAULT_REFERENCE_DATE,
  formatSlotLabel,
  formatTimeLabel,
  generateTimeSlots,
  getAvailabilityAnnouncement,
  getAvailabilitySummary,
  isSlotSelected,
  mergeRanges,
  minutesToTime,
  rangesToSlots,
  setSlotsSelected,
  slotsToRanges,
  timeToMinutes,
  toggleSlot,
  type AvailabilityRange,
} from "@/registry/default/lib/availability-grid-utils"

describe("time and string helpers", () => {
  it("converts time string to minutes and back", () => {
    expect(timeToMinutes("00:00")).toBe(0)
    expect(timeToMinutes("09:30")).toBe(570)
    expect(timeToMinutes("17:00")).toBe(1020)
    expect(timeToMinutes("24:00")).toBe(1440)

    expect(minutesToTime(0)).toBe("00:00")
    expect(minutesToTime(570)).toBe("09:30")
    expect(minutesToTime(1020)).toBe("17:00")
    expect(minutesToTime(1440)).toBe("24:00")
  })

  it("formats time label in 12h and 24h format", () => {
    expect(formatTimeLabel("00:00", 24)).toBe("00:00")
    expect(formatTimeLabel("00:00", 12)).toBe("12:00 AM")
    expect(formatTimeLabel("09:30", 12)).toBe("9:30 AM")
    expect(formatTimeLabel("12:00", 12)).toBe("12:00 PM")
    expect(formatTimeLabel("15:45", 12)).toBe("3:45 PM")
    expect(formatTimeLabel("23:30", 12)).toBe("11:30 PM")
  })

  it("formats accessible slot label", () => {
    expect(formatSlotLabel("MO", "09:00", 30, 24)).toBe("Monday, 09:00 – 09:30")
    expect(formatSlotLabel("FR", "14:00", 60, 12)).toBe(
      "Friday, 2:00 PM – 3:00 PM"
    )
  })

  it("generates time slot options within bounds", () => {
    const slots = generateTimeSlots(9, 12, 60)
    expect(slots).toEqual(["09:00", "10:00", "11:00"])

    const halfHourSlots = generateTimeSlots(8, 10, 30)
    expect(halfHourSlots).toEqual(["08:00", "08:30", "09:00", "09:30"])
  })
})

describe("mergeRanges", () => {
  it("handles empty and single range lists", () => {
    expect(mergeRanges([])).toEqual([])
    expect(mergeRanges([{ day: "MO", start: "09:00", end: "17:00" }])).toEqual([
      { day: "MO", start: "09:00", end: "17:00" },
    ])
  })

  it("merges touching and overlapping ranges on the same day", () => {
    const touching: AvailabilityRange[] = [
      { day: "MO", start: "09:00", end: "12:00" },
      { day: "MO", start: "12:00", end: "17:00" },
    ]
    expect(mergeRanges(touching)).toEqual([
      { day: "MO", start: "09:00", end: "17:00" },
    ])

    const overlapping: AvailabilityRange[] = [
      { day: "TU", start: "09:00", end: "14:00" },
      { day: "TU", start: "11:00", end: "17:00" },
    ]
    expect(mergeRanges(overlapping)).toEqual([
      { day: "TU", start: "09:00", end: "17:00" },
    ])
  })

  it("keeps separated ranges apart", () => {
    const separated: AvailabilityRange[] = [
      { day: "WE", start: "14:00", end: "17:00" },
      { day: "WE", start: "09:00", end: "12:00" },
    ]
    expect(mergeRanges(separated)).toEqual([
      { day: "WE", start: "09:00", end: "12:00" },
      { day: "WE", start: "14:00", end: "17:00" },
    ])
  })

  it("sorts days according to canonical WEEKDAYS order", () => {
    const multiDay: AvailabilityRange[] = [
      { day: "FR", start: "09:00", end: "17:00" },
      { day: "MO", start: "09:00", end: "17:00" },
      { day: "WE", start: "09:00", end: "17:00" },
    ]
    expect(mergeRanges(multiDay).map((r) => r.day)).toEqual(["MO", "WE", "FR"])
  })

  it("ignores zero or negative duration ranges", () => {
    const invalid: AvailabilityRange[] = [
      { day: "TH", start: "10:00", end: "10:00" },
      { day: "TH", start: "12:00", end: "10:00" },
      { day: "TH", start: "09:00", end: "17:00" },
    ]
    expect(mergeRanges(invalid)).toEqual([
      { day: "TH", start: "09:00", end: "17:00" },
    ])
  })
})

describe("slot conversions and selections", () => {
  it("converts ranges to slots and back without data loss", () => {
    const ranges: AvailabilityRange[] = [
      { day: "MO", start: "09:00", end: "11:00" },
      { day: "TU", start: "14:00", end: "16:00" },
    ]
    const slots = rangesToSlots(ranges, 30)
    expect(slots.size).toBe(8)
    expect(slots.has("MO|09:00")).toBe(true)
    expect(slots.has("MO|10:30")).toBe(true)
    expect(slots.has("MO|11:00")).toBe(false)

    const reconstructed = slotsToRanges(slots, 30)
    expect(reconstructed).toEqual(ranges)
  })

  it("identifies whether a slot is selected", () => {
    const ranges: AvailabilityRange[] = [
      { day: "MO", start: "09:00", end: "12:00" },
    ]
    expect(isSlotSelected(ranges, "MO", "09:00", 30)).toBe(true)
    expect(isSlotSelected(ranges, "MO", "11:30", 30)).toBe(true)
    expect(isSlotSelected(ranges, "MO", "12:00", 30)).toBe(false)
    expect(isSlotSelected(ranges, "TU", "09:00", 30)).toBe(false)
  })

  it("toggles slot selection state", () => {
    const initial: AvailabilityRange[] = [
      { day: "MO", start: "09:00", end: "10:00" },
    ]
    const added = toggleSlot(initial, "MO", "10:00", 30)
    expect(added).toEqual([{ day: "MO", start: "09:00", end: "10:30" }])

    const removed = toggleSlot(added, "MO", "09:30", 30)
    expect(removed).toEqual([
      { day: "MO", start: "09:00", end: "09:30" },
      { day: "MO", start: "10:00", end: "10:30" },
    ])
  })

  it("sets multiple slots selected or deselected", () => {
    const initial: AvailabilityRange[] = [
      { day: "MO", start: "09:00", end: "10:00" },
    ]
    const updated = setSlotsSelected(
      initial,
      [
        { day: "MO", time: "10:00" },
        { day: "MO", time: "10:30" },
      ],
      true,
      30
    )
    expect(updated).toEqual([{ day: "MO", start: "09:00", end: "11:00" }])

    const cleared = setSlotsSelected(
      updated,
      [{ day: "MO", time: "09:00" }],
      false,
      30
    )
    expect(cleared).toEqual([{ day: "MO", start: "09:30", end: "11:00" }])
  })
})

describe("convertAvailabilityTimeZone", () => {
  const refDate = DEFAULT_REFERENCE_DATE

  it("returns unchanged merged ranges when timezones are identical", () => {
    const ranges: AvailabilityRange[] = [
      { day: "MO", start: "09:00", end: "17:00" },
    ]
    expect(convertAvailabilityTimeZone(ranges, "UTC", "UTC", refDate)).toEqual(
      ranges
    )
  })

  it("shifts by positive integer hours (UTC to Europe/Berlin, +1h)", () => {
    const ranges: AvailabilityRange[] = [
      { day: "MO", start: "09:00", end: "17:00" },
    ]
    const converted = convertAvailabilityTimeZone(
      ranges,
      "UTC",
      "Europe/Berlin",
      refDate
    )
    expect(converted).toEqual([{ day: "MO", start: "10:00", end: "18:00" }])
  })

  it("shifts by half-hour offsets (UTC to Asia/Kolkata, +5h30m)", () => {
    const ranges: AvailabilityRange[] = [
      { day: "MO", start: "09:00", end: "12:00" },
    ]
    const converted = convertAvailabilityTimeZone(
      ranges,
      "UTC",
      "Asia/Kolkata",
      refDate
    )
    expect(converted).toEqual([{ day: "MO", start: "14:30", end: "17:30" }])
  })

  it("shifts entirely into the next day without splitting", () => {
    const ranges: AvailabilityRange[] = [
      { day: "MO", start: "20:00", end: "23:00" },
    ]
    // 20:00 + 5:30 = 01:30 TU, 23:00 + 5:30 = 04:30 TU
    const converted = convertAvailabilityTimeZone(
      ranges,
      "UTC",
      "Asia/Kolkata",
      refDate
    )
    expect(converted).toEqual([{ day: "TU", start: "01:30", end: "04:30" }])
  })

  it("splits a range across midnight into the next day", () => {
    const ranges: AvailabilityRange[] = [
      { day: "MO", start: "16:00", end: "22:00" },
    ]
    // 16:00 + 5:30 = 21:30 MO, 22:00 + 5:30 = 03:30 TU
    const converted = convertAvailabilityTimeZone(
      ranges,
      "UTC",
      "Asia/Kolkata",
      refDate
    )
    expect(converted).toEqual([
      { day: "MO", start: "21:30", end: "24:00" },
      { day: "TU", start: "00:00", end: "03:30" },
    ])
  })

  it("shifts backward into previous day with negative offset", () => {
    const ranges: AvailabilityRange[] = [
      { day: "TU", start: "01:00", end: "04:00" },
    ]
    // Berlin (UTC+1) to New York (UTC-5): diff is -6 hours (-360 min)
    // 01:00 TU - 6h = 19:00 MO, 04:00 TU - 6h = 22:00 MO
    const converted = convertAvailabilityTimeZone(
      ranges,
      "Europe/Berlin",
      "America/New_York",
      refDate
    )
    expect(converted).toEqual([{ day: "MO", start: "19:00", end: "22:00" }])
  })

  it("splits across midnight when shifted backward into previous day", () => {
    const ranges: AvailabilityRange[] = [
      { day: "TU", start: "02:00", end: "08:00" },
    ]
    // Berlin to New York: -6 hours
    // 02:00 TU - 6h = 20:00 MO, 08:00 TU - 6h = 02:00 TU
    const converted = convertAvailabilityTimeZone(
      ranges,
      "Europe/Berlin",
      "America/New_York",
      refDate
    )
    expect(converted).toEqual([
      { day: "MO", start: "20:00", end: "24:00" },
      { day: "TU", start: "00:00", end: "02:00" },
    ])
  })

  it("wraps Sunday ranges forward across weekly boundary into Monday", () => {
    const ranges: AvailabilityRange[] = [
      { day: "SU", start: "22:00", end: "24:00" },
    ]
    // UTC to Berlin (+1h): 22:00 SU -> 23:00 SU; 24:00 SU -> 01:00 MO
    const converted = convertAvailabilityTimeZone(
      ranges,
      "UTC",
      "Europe/Berlin",
      refDate
    )
    expect(converted).toEqual([
      { day: "MO", start: "00:00", end: "01:00" },
      { day: "SU", start: "23:00", end: "24:00" },
    ])
  })

  it("wraps Monday ranges backward across weekly boundary into Sunday", () => {
    const ranges: AvailabilityRange[] = [
      { day: "MO", start: "01:00", end: "03:00" },
    ]
    // Berlin to New York (-6h): 01:00 MO -> 19:00 SU, 03:00 MO -> 21:00 SU
    const converted = convertAvailabilityTimeZone(
      ranges,
      "Europe/Berlin",
      "America/New_York",
      refDate
    )
    expect(converted).toEqual([{ day: "SU", start: "19:00", end: "21:00" }])
  })
})

describe("summaries and announcements", () => {
  it("computes total minutes, hours, and active days", () => {
    const ranges: AvailabilityRange[] = [
      { day: "MO", start: "09:00", end: "12:30" }, // 3.5h
      { day: "TU", start: "14:00", end: "17:00" }, // 3h
    ]
    const summary = getAvailabilitySummary(ranges)
    expect(summary.totalMinutes).toBe(390)
    expect(summary.totalHours).toBe(6.5)
    expect(summary.daysCount).toBe(2)
  })

  it("generates polite live region announcements", () => {
    expect(getAvailabilityAnnouncement([])).toBe("No availability selected")

    const ranges: AvailabilityRange[] = [
      { day: "MO", start: "09:00", end: "12:30" },
    ]
    expect(getAvailabilityAnnouncement(ranges)).toBe(
      "3 hrs 30 mins available across 1 day"
    )
  })
})
