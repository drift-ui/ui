import { describe, expect, it } from "vitest"

import {
  addRange,
  copyDayToAvailableDays,
  fromMinutes,
  getNextRange,
  getRangeError,
  removeRange,
  setDayAvailable,
  toMinutes,
  updateRange,
  type WeeklyHoursRange,
} from "@/registry/default/lib/weekly-hours-utils"

const NINE_TO_FIVE = { start: "09:00", end: "17:00" }

describe("weekly hours utils", () => {
  it("converts between HH:mm and minutes", () => {
    expect(toMinutes("09:30")).toBe(570)
    expect(toMinutes("")).toBeNull()
    expect(toMinutes("24:00")).toBeNull()
    expect(fromMinutes(570)).toBe("09:30")
    expect(fromMinutes(5000)).toBe("23:59")
    expect(fromMinutes(-5)).toBe("00:00")
  })

  it("keeps the value sorted by weekday when a day is turned on", () => {
    const value: WeeklyHoursRange[] = [
      { day: "MO", start: "09:00", end: "17:00" },
      { day: "FR", start: "09:00", end: "17:00" },
    ]
    expect(
      setDayAvailable(value, "WE", true, NINE_TO_FIVE).map((r) => r.day)
    ).toEqual(["MO", "WE", "FR"])
    expect(setDayAvailable(value, "MO", false, NINE_TO_FIVE)).toEqual([
      { day: "FR", start: "09:00", end: "17:00" },
    ])
  })

  it("adds the next range an hour after the latest one", () => {
    expect(getNextRange([], NINE_TO_FIVE)).toEqual(NINE_TO_FIVE)
    expect(getNextRange([NINE_TO_FIVE], NINE_TO_FIVE)).toEqual({
      start: "18:00",
      end: "19:00",
    })
    expect(
      getNextRange([{ start: "20:00", end: "23:00" }], NINE_TO_FIVE)
    ).toBeNull()
    expect(getNextRange([{ start: "20:00", end: "" }], NINE_TO_FIVE)).toEqual({
      start: "01:00",
      end: "02:00",
    })

    const full: WeeklyHoursRange[] = [
      { day: "MO", start: "20:00", end: "23:00" },
    ]
    expect(addRange(full, "MO", NINE_TO_FIVE)).toBe(full)
    expect(addRange([], "TU", NINE_TO_FIVE)).toEqual([
      { day: "TU", ...NINE_TO_FIVE },
    ])
  })

  it("updates and removes a single range within a day", () => {
    const value: WeeklyHoursRange[] = [
      { day: "MO", start: "09:00", end: "12:00" },
      { day: "MO", start: "13:00", end: "17:00" },
      { day: "TU", start: "09:00", end: "17:00" },
    ]
    expect(updateRange(value, "MO", 1, { end: "18:00" })[1]).toEqual({
      day: "MO",
      start: "13:00",
      end: "18:00",
    })
    expect(removeRange(value, "MO", 0)).toEqual([
      { day: "MO", start: "13:00", end: "17:00" },
      { day: "TU", start: "09:00", end: "17:00" },
    ])
  })

  it("copies a day's hours only to days that are already available", () => {
    const value: WeeklyHoursRange[] = [
      { day: "MO", start: "08:00", end: "12:00" },
      { day: "MO", start: "13:00", end: "16:00" },
      { day: "WE", start: "09:00", end: "17:00" },
    ]
    expect(
      copyDayToAvailableDays(value, "MO", ["MO", "TU", "WE", "TH", "FR"])
    ).toEqual([
      { day: "MO", start: "08:00", end: "12:00" },
      { day: "MO", start: "13:00", end: "16:00" },
      { day: "WE", start: "08:00", end: "12:00" },
      { day: "WE", start: "13:00", end: "16:00" },
    ])
  })

  it("explains what is wrong with a range", () => {
    expect(getRangeError([{ start: "09:00", end: "" }], 0)).toBe(
      "Enter a start and end time"
    )
    expect(getRangeError([{ start: "17:00", end: "09:00" }], 0)).toBe(
      "End time must be after the start time"
    )
    const ranges = [
      { start: "09:00", end: "12:00" },
      { start: "11:00", end: "14:00" },
      { start: "", end: "" },
    ]
    expect(getRangeError(ranges, 0)).toBe("Overlaps another time range")
    expect(
      getRangeError([ranges[0], { start: "12:00", end: "13:00" }], 1)
    ).toBe(null)
  })
})
