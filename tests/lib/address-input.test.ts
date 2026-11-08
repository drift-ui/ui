import { describe, expect, it } from "vitest"

import {
  ADDRESS_LAYOUTS,
  autoCompleteFor,
  changeAddressCountry,
  emptyAddress,
  fieldsOf,
  isRequired,
  labelFor,
  layoutFor,
  postalCodeError,
  resolveCountryOptions,
  type AddressLayout,
} from "@/registry/default/lib/address-input"
import {
  COUNTRY_CODES,
  countryFlag,
  countryName,
} from "@/registry/default/lib/countries"

const ADDRESS = {
  country: "US",
  line1: "1 Market St",
  line2: "Suite 300",
  city: "San Francisco",
  region: "CA",
  postalCode: "94105",
}

describe("countries", () => {
  it("lists every ISO 3166-1 country plus Kosovo, sorted and unique", () => {
    expect(COUNTRY_CODES).toHaveLength(250)
    expect(new Set(COUNTRY_CODES).size).toBe(COUNTRY_CODES.length)
    expect(COUNTRY_CODES).toEqual([...COUNTRY_CODES].sort())
    expect(COUNTRY_CODES).toContain("XK")
  })

  it("builds an emoji flag and a localized name", () => {
    expect(countryFlag("GB")).toBe("🇬🇧")
    expect(countryFlag("jp")).toBe("🇯🇵")
    expect(countryName("DE")).toBe("Germany")
    expect(countryName("DE", "de")).toBe("Deutschland")
  })
})

describe("layoutFor", () => {
  it("orders fields by country", () => {
    expect(fieldsOf(layoutFor("US"))).toEqual([
      "line1",
      "line2",
      "city",
      "region",
      "postalCode",
    ])
    expect(fieldsOf(layoutFor("JP"))[0]).toBe("postalCode")
    expect(fieldsOf(layoutFor("DE"))).toEqual([
      "line1",
      "line2",
      "postalCode",
      "city",
    ])
  })

  it("leaves out fields a country doesn't use", () => {
    expect(fieldsOf(layoutFor("GB"))).not.toContain("region")
    expect(fieldsOf(layoutFor("FR"))).not.toContain("region")
  })

  it("names the region and postal code the local way", () => {
    expect(labelFor("region", layoutFor("US"))).toBe("State")
    expect(labelFor("region", layoutFor("CA"))).toBe("Province")
    expect(labelFor("region", layoutFor("JP"))).toBe("Prefecture")
    expect(labelFor("postalCode", layoutFor("US"))).toBe("ZIP code")
    expect(labelFor("postalCode", layoutFor("GB"))).toBe("Postcode")
    expect(labelFor("postalCode", layoutFor("IN"))).toBe("PIN code")
    expect(labelFor("city", layoutFor("AU"))).toBe("Suburb")
    expect(labelFor("line1", layoutFor("US"))).toBe("Address line 1")
  })

  it("marks the fields each country requires", () => {
    expect(isRequired("region", layoutFor("US"))).toBe(true)
    expect(isRequired("line2", layoutFor("US"))).toBe(false)
    expect(isRequired("postalCode", layoutFor("GB"))).toBe(true)
  })

  it("falls back to a generic layout for countries without one", () => {
    const layout = layoutFor("BR")
    expect(fieldsOf(layout)).toEqual([
      "line1",
      "line2",
      "city",
      "region",
      "postalCode",
    ])
    expect(isRequired("postalCode", layout)).toBe(false)
    expect(layout.postalCode).toBeUndefined()
  })

  it("prefers layouts passed in over the built-in ones", () => {
    const brazil: AddressLayout = {
      rows: [["postalCode"], ["line1"], ["city", "region"]],
      required: ["postalCode", "line1", "city", "region"],
      labels: { postalCode: "CEP" },
      postalCode: {
        pattern: /^\d{5}-?\d{3}$/,
        format: "8 digits, like 01310-100",
      },
    }
    expect(layoutFor("BR", { BR: brazil })).toBe(brazil)
    expect(layoutFor("US", { BR: brazil })).toBe(ADDRESS_LAYOUTS.US)
  })
})

describe("postalCodeError", () => {
  it("accepts codes that match the country's pattern", () => {
    for (const [country, postalCode] of [
      ["US", "94105"],
      ["US", "94105-1234"],
      ["CA", "K1A 0B1"],
      ["CA", "k1a0b1"],
      ["GB", "SW1A 1AA"],
      ["GB", "m1 1ae"],
      ["DE", "10115"],
      ["FR", "75008"],
      ["JP", "100-0001"],
      ["JP", "1000001"],
      ["AU", "2000"],
      ["IN", "110001"],
    ]) {
      expect(
        postalCodeError({ ...ADDRESS, country, postalCode }),
        `${country} ${postalCode}`
      ).toBeNull()
    }
  })

  it("names the expected format when a code doesn't match", () => {
    expect(postalCodeError({ ...ADDRESS, postalCode: "9410" })).toBe(
      "ZIP code must be 5 digits, like 94105."
    )
    expect(
      postalCodeError({ ...ADDRESS, country: "GB", postalCode: "12345" })
    ).toBe("Postcode must be a UK postcode, like SW1A 1AA.")
    expect(
      postalCodeError({ ...ADDRESS, country: "IN", postalCode: "012345" })
    ).toMatch(/^PIN code must be 6 digits/)
  })

  it("ignores surrounding spaces, an empty code and countries without a pattern", () => {
    expect(postalCodeError({ ...ADDRESS, postalCode: " 94105 " })).toBeNull()
    expect(postalCodeError({ ...ADDRESS, postalCode: "" })).toBeNull()
    expect(
      postalCodeError({ ...ADDRESS, country: "BR", postalCode: "anything" })
    ).toBeNull()
  })
})

describe("changeAddressCountry", () => {
  it("keeps fields both layouts have and clears the rest", () => {
    expect(changeAddressCountry(ADDRESS, "GB")).toEqual({
      ...ADDRESS,
      country: "GB",
      region: "",
    })
    expect(changeAddressCountry(ADDRESS, "CA")).toEqual({
      ...ADDRESS,
      country: "CA",
    })
  })

  it("uses layouts passed in", () => {
    const cityOnly: AddressLayout = { rows: [["city"]], required: ["city"] }
    expect(changeAddressCountry(ADDRESS, "SG", { SG: cityOnly })).toEqual({
      country: "SG",
      line1: "",
      line2: "",
      city: "San Francisco",
      region: "",
      postalCode: "",
    })
  })
})

describe("emptyAddress", () => {
  it("starts with every field empty", () => {
    expect(emptyAddress("DE")).toEqual({
      country: "DE",
      line1: "",
      line2: "",
      city: "",
      region: "",
      postalCode: "",
    })
  })
})

describe("autoCompleteFor", () => {
  it("returns the autofill token, with an optional shipping or billing prefix", () => {
    expect(autoCompleteFor("country")).toBe("country")
    expect(autoCompleteFor("line1")).toBe("address-line1")
    expect(autoCompleteFor("line2")).toBe("address-line2")
    expect(autoCompleteFor("city")).toBe("address-level2")
    expect(autoCompleteFor("region")).toBe("address-level1")
    expect(autoCompleteFor("postalCode", "shipping")).toBe(
      "shipping postal-code"
    )
  })
})

describe("resolveCountryOptions", () => {
  it("lists every country by localized name with its flag", () => {
    const options = resolveCountryOptions("US")
    expect(options).toHaveLength(COUNTRY_CODES.length)
    expect(options.find(({ code }) => code === "DE")).toEqual({
      code: "DE",
      name: "Germany",
      flag: "🇩🇪",
    })
    const names = options.map(({ name }) => name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
  })

  it("keeps a given list in its order and adds the selected country", () => {
    expect(
      resolveCountryOptions("US", ["GB", "DE"]).map(({ code }) => code)
    ).toEqual(["US", "GB", "DE"])
    expect(
      resolveCountryOptions("DE", ["GB", "de"], "de").map(({ name }) => name)
    ).toEqual(["Vereinigtes Königreich", "Deutschland"])
  })
})
