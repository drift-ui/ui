import { describe, expect, it } from "vitest"

import {
  caretAfterDigits,
  changeCountry,
  countryFlag,
  countryForValue,
  deleteDigitPastFormatting,
  filterCountries,
  formatInsertedPhone,
  formatPhoneInput,
  formatPhoneValue,
  isAllowedNumber,
  PHONE_COUNTRIES,
  resolveCountries,
} from "@/registry/default/lib/phone-input-utils"

function codesFor(query: string) {
  return filterCountries(PHONE_COUNTRIES, query).map((country) => country.code)
}

describe("PHONE_COUNTRIES", () => {
  it("lists countries by name with a flag and dial code", () => {
    const unitedStates = PHONE_COUNTRIES.find(({ code }) => code === "US")
    expect(unitedStates).toEqual({
      code: "US",
      name: "United States",
      dialCode: "+1",
      flag: "🇺🇸",
    })
    const names = PHONE_COUNTRIES.map(({ name }) => name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
  })

  it("builds flags from regional indicators", () => {
    expect(countryFlag("GB")).toBe("🇬🇧")
  })
})

describe("resolveCountries", () => {
  it("returns every country by default", () => {
    expect(resolveCountries()).toEqual(PHONE_COUNTRIES)
  })

  it("keeps the given codes in the given order", () => {
    expect(
      resolveCountries(["US", "IN", "CA"]).map(({ code }) => code)
    ).toEqual(["US", "IN", "CA"])
  })

  it("applies custom names and flags over the defaults", () => {
    expect(
      resolveCountries([{ code: "DE", name: "Deutschland", flag: "DE" }])
    ).toEqual([
      { code: "DE", name: "Deutschland", dialCode: "+49", flag: "DE" },
    ])
  })

  it("keeps defaults for fields a custom entry leaves out", () => {
    expect(
      resolveCountries([{ code: "DE", name: "Deutschland" }])[0].flag
    ).toBe("🇩🇪")
  })

  it("removes excluded countries from either list", () => {
    const codes = resolveCountries(undefined, ["US"]).map(({ code }) => code)
    expect(codes).not.toContain("US")
    expect(codes).toContain("CA")
    expect(
      resolveCountries(["US", "CA"], ["US"]).map(({ code }) => code)
    ).toEqual(["CA"])
  })

  it("drops codes the metadata does not know", () => {
    expect(
      resolveCountries(["ZZ" as "US", "US"]).map(({ code }) => code)
    ).toEqual(["US"])
  })
})

describe("isAllowedNumber", () => {
  const usAndIndia = resolveCountries(["US", "IN"])

  it("accepts an empty value and an unfinished calling code", () => {
    expect(isAllowedNumber("", usAndIndia)).toBe(true)
    expect(isAllowedNumber("+4", usAndIndia)).toBe(true)
  })

  it("rejects a calling code outside the list", () => {
    expect(isAllowedNumber("+44", usAndIndia)).toBe(false)
    expect(isAllowedNumber("+91", usAndIndia)).toBe(true)
  })

  it("rejects a complete number from a country sharing a calling code", () => {
    expect(isAllowedNumber("+14165550123", usAndIndia)).toBe(false)
    expect(isAllowedNumber("+14155550123", usAndIndia)).toBe(true)
  })

  it("accepts US toll-free numbers", () => {
    expect(isAllowedNumber("+18005550199", usAndIndia)).toBe(true)
  })
})

describe("filterCountries", () => {
  it("returns everything for a blank query", () => {
    expect(filterCountries(PHONE_COUNTRIES, "  ")).toBe(PHONE_COUNTRIES)
  })

  it("matches names regardless of case and accents", () => {
    expect(codesFor("GERMANY")).toEqual(["DE"])
    expect(codesFor("reunion")).toEqual(["RE"])
  })

  it("matches an exact country code", () => {
    expect(codesFor("gb")).toContain("GB")
  })

  it("matches dial code prefixes with or without the plus", () => {
    expect(codesFor("+44")).toContain("GB")
    expect(codesFor("49")).toEqual(["DE"])
  })
})

describe("formatPhoneInput", () => {
  it("formats national digits and returns E.164", () => {
    expect(formatPhoneInput("4155550123", "US")).toEqual({
      display: "(415) 555-0123",
      value: "+14155550123",
    })
  })

  it("groups digits typed without the trunk prefix", () => {
    expect(formatPhoneInput("2079460958", "GB")).toEqual({
      display: "20 7946 0958",
      value: "+442079460958",
    })
  })

  it("keeps a leading digit that only looks like a trunk prefix", () => {
    const toolFree = "+78001234567"
    const display = formatPhoneValue(toolFree, "RU")

    expect(display).toBe("800 123 45 67")
    expect(formatPhoneInput(display, "RU").value).toBe(toolFree)
    expect(formatPhoneInput("88001234567", "RU").value).toBe(toolFree)
  })

  it("drops the trunk prefix from the value", () => {
    expect(formatPhoneInput("02079460958", "GB")).toEqual({
      display: "020 7946 0958",
      value: "+442079460958",
    })
  })

  it("keeps the leading zero where the number requires it", () => {
    expect(formatPhoneInput("0612345678", "IT").value).toBe("+390612345678")
  })

  it("reads international numbers regardless of the selected country", () => {
    expect(formatPhoneInput("+44 20 7946 0958", "US")).toEqual({
      display: "+44 20 7946 0958",
      value: "+442079460958",
    })
  })

  it("ignores characters that are not digits", () => {
    expect(formatPhoneInput("abc", "US")).toEqual({ display: "", value: "" })
  })

  it("keeps a lone plus without producing a value", () => {
    expect(formatPhoneInput("+", "US")).toEqual({ display: "+", value: "" })
  })

  it("gives the same result when run on its own output", () => {
    const { display, value } = formatPhoneInput("4155550123", "US")
    expect(formatPhoneInput(display, "US")).toEqual({ display, value })
  })
})

describe("formatPhoneValue", () => {
  it.each([
    ["+917424855888", "IN", "74248 55888"],
    ["+4915123456789", "DE", "1512 3456789"],
    ["+33612345678", "FR", "6 12 34 56 78"],
    ["+819012345678", "JP", "90 1234 5678"],
    ["+390612345678", "IT", "06 1234 5678"],
  ] as const)("shows %s without a trunk prefix", (value, country, display) => {
    expect(formatPhoneValue(value, country)).toBe(display)
  })

  it("shows complete numbers in national format", () => {
    expect(formatPhoneValue("+14155550123", "US")).toBe("(415) 555-0123")
    expect(formatPhoneValue("+442079460958", "GB")).toBe("20 7946 0958")
  })

  it("shows partial numbers as typed so far", () => {
    expect(formatPhoneValue("+1415", "US")).toBe("(415)")
  })

  it("keeps a bare calling code visible", () => {
    expect(formatPhoneValue("+44", "GB")).toBe("+44")
  })

  it("falls back to international format for an unrecognized code", () => {
    expect(formatPhoneValue("+999", "US")).toBe("+999")
  })
})

describe("formatInsertedPhone", () => {
  it("drops the dial code and takes the country from the number", () => {
    expect(formatInsertedPhone("+91 74248 55888", "US")).toEqual({
      display: "74248 55888",
      value: "+917424855888",
      country: "IN",
    })
  })

  it("leaves national text in the selected country", () => {
    expect(formatInsertedPhone("4155550123", "US")).toEqual({
      display: "(415) 555-0123",
      value: "+14155550123",
      country: "US",
    })
  })

  it("keeps a bare calling code visible", () => {
    expect(formatInsertedPhone("+91", "US")).toEqual({
      display: "+91",
      value: "+91",
      country: "IN",
    })
  })
})

describe("countryForValue", () => {
  it("keeps the selection for an empty value", () => {
    expect(countryForValue("", "FR")).toBe("FR")
  })

  it("detects the country of a complete number", () => {
    expect(countryForValue("+442079460958", "US")).toBe("GB")
    expect(countryForValue("+14165550123", "US")).toBe("CA")
  })

  it("keeps the selection while a shared calling code is ambiguous", () => {
    expect(countryForValue("+1416", "CA")).toBe("CA")
  })

  it("uses the main country of a partial calling code", () => {
    expect(countryForValue("+1", "FR")).toBe("US")
    expect(countryForValue("+44207", "US")).toBe("GB")
  })

  it("falls back to the first allowed country", () => {
    expect(countryForValue("", "US", resolveCountries(["IN", "GB"]))).toBe("IN")
  })

  it("picks an allowed country for a shared calling code", () => {
    const countries = resolveCountries(["IN", "CA"])
    expect(countryForValue("+1", "IN", countries)).toBe("CA")
  })

  it("ignores a detected country outside the list", () => {
    const countries = resolveCountries(["IN"])
    expect(countryForValue("+442079460958", "IN", countries)).toBe("IN")
  })

  it("keeps the selection for an unknown calling code", () => {
    expect(countryForValue("+999", "FR")).toBe("FR")
  })
})

describe("changeCountry", () => {
  it("keeps the national digits under the new dial code", () => {
    expect(changeCountry("+14155550123", "US", "GB").value).toBe(
      "+444155550123"
    )
  })

  it("starts empty when the value has no national digits", () => {
    expect(changeCountry("", "US", "GB")).toEqual({ display: "", value: "" })
    expect(changeCountry("+4", "US", "GB")).toEqual({ display: "", value: "" })
  })
})

describe("deleteDigitPastFormatting", () => {
  it("removes the digit before a deleted separator on Backspace", () => {
    expect(deleteDigitPastFormatting("(415)", "(415", 4, false)).toEqual({
      text: "(41",
      caret: 3,
    })
  })

  it("removes the digit after a deleted separator on Delete", () => {
    expect(deleteDigitPastFormatting("(415) 555", "(415 555", 4, true)).toEqual(
      { text: "(415 55", caret: 4 }
    )
  })

  it("leaves real digit edits alone", () => {
    expect(deleteDigitPastFormatting("(415)", "(41)", 3, false)).toEqual({
      text: "(41)",
      caret: 3,
    })
  })

  it("leaves insertions alone", () => {
    expect(deleteDigitPastFormatting("(415)", "(415)5", 6, false)).toEqual({
      text: "(415)5",
      caret: 6,
    })
  })

  it("leaves the text alone when no digit is left to remove", () => {
    expect(deleteDigitPastFormatting("(415", "415", 0, false)).toEqual({
      text: "415",
      caret: 0,
    })
  })
})

describe("caretAfterDigits", () => {
  it("lands right after the counted digit", () => {
    expect(caretAfterDigits("(415) 555-0123", 2)).toBe(3)
    expect(caretAfterDigits("(415) 555-0123", 4)).toBe(7)
  })

  it("moves past trailing formatting once every digit is counted", () => {
    expect(caretAfterDigits("(415)", 3)).toBe(5)
  })

  it("stays at the start for no digits", () => {
    expect(caretAfterDigits("(415)", 0)).toBe(0)
  })
})
