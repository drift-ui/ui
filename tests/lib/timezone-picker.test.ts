import { describe, expect, it } from "vitest"

import {
  filterTimezones,
  formatTimezoneLabel,
  getTimezoneIds,
  getTimezoneOffset,
  isValidTimeZone,
  listTimezones,
  parseOffsetMinutes,
  toCurrentTimezoneName,
} from "@/registry/default/lib/timezone-picker-utils"

// Fixed dates on both sides of northern daylight saving, so the suite passes all year.
const WINTER = new Date("2026-01-15T12:00:00Z")
const SUMMER = new Date("2026-07-15T12:00:00Z")

describe("timezone-picker logic", () => {
  it("lists IANA names and always includes UTC", () => {
    const ids = getTimezoneIds()
    expect(ids).toContain("UTC")
    expect(ids).toContain("Asia/Tokyo")
  })

  it("uses current names for zones V8 lists under old ones", () => {
    const ids = getTimezoneIds()
    expect(ids).toContain("Asia/Kolkata")
    expect(ids).toContain("Europe/Kyiv")
    expect(ids).not.toContain("Asia/Calcutta")
    expect(ids).not.toContain("Europe/Kiev")
    expect(new Set(ids).size).toBe(ids.length)
    expect(toCurrentTimezoneName("Asia/Calcutta")).toBe("Asia/Kolkata")
    expect(toCurrentTimezoneName("Asia/Tokyo")).toBe("Asia/Tokyo")
  })

  it("reads offsets at the given date", () => {
    expect(getTimezoneOffset("America/New_York", WINTER)).toBe("GMT-5")
    expect(getTimezoneOffset("America/New_York", SUMMER)).toBe("GMT-4")
    expect(getTimezoneOffset("Asia/Kolkata", WINTER)).toBe("GMT+5:30")
    expect(getTimezoneOffset("UTC", WINTER)).toBe("GMT+0")
  })

  it("parses offsets into minutes", () => {
    expect(parseOffsetMinutes("GMT+5:30")).toBe(330)
    expect(parseOffsetMinutes("GMT-3:30")).toBe(-210)
    expect(parseOffsetMinutes("GMT+0")).toBe(0)
    expect(parseOffsetMinutes("GMT+14")).toBe(840)
  })

  it("formats names for reading", () => {
    expect(formatTimezoneLabel("America/Argentina/Buenos_Aires")).toBe(
      "America / Argentina / Buenos Aires"
    )
  })

  it("sorts by offset, then name", () => {
    const options = listTimezones(WINTER, [
      "Asia/Tokyo",
      "UTC",
      "America/New_York",
      "Asia/Kolkata",
      "Europe/London",
    ])
    expect(options.map((option) => option.value)).toEqual([
      "America/New_York",
      "Europe/London",
      "UTC",
      "Asia/Kolkata",
      "Asia/Tokyo",
    ])
  })

  it("drops names Intl does not know", () => {
    expect(isValidTimeZone("Asia/Tokyo")).toBe(true)
    expect(isValidTimeZone("Foo/Bar")).toBe(false)
    expect(isValidTimeZone("Asia/Kolkata ")).toBe(false)
    expect(
      listTimezones(WINTER, ["Foo/Bar", "Asia/Tokyo"]).map((o) => o.value)
    ).toEqual(["Asia/Tokyo"])
  })

  it("renames and dedupes a restricted list", () => {
    const options = listTimezones(WINTER, [
      "Asia/Calcutta",
      "Asia/Kolkata",
      "Asia/Tokyo",
    ])
    expect(options.map((option) => option.value)).toEqual([
      "Asia/Kolkata",
      "Asia/Tokyo",
    ])
  })

  it("finds zones by city, spaced name or offset", () => {
    const options = listTimezones(WINTER)
    const values = (query: string) =>
      filterTimezones(options, query).map((option) => option.value)

    expect(values("tokyo")).toEqual(["Asia/Tokyo"])
    expect(values("new york")).toContain("America/New_York")
    expect(values("NEW_YORK")).toContain("America/New_York")
    expect(values("America / New York")).toContain("America/New_York")
    expect(values("kolkata")).toEqual(["Asia/Kolkata"])
    expect(values("+5:30")).toContain("Asia/Kolkata")
    expect(values("  ")).toHaveLength(options.length)
    expect(values("atlantis")).toEqual([])
  })
})
