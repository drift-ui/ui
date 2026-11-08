import {
  COUNTRY_CODES,
  countryFlag,
  countryName,
} from "@/registry/default/lib/countries"

export type Address = {
  country: string
  line1: string
  line2: string
  city: string
  region: string
  postalCode: string
}

export type AddressField = Exclude<keyof Address, "country">

export type AddressLayout = {
  rows: AddressField[][]
  required: AddressField[]
  labels?: Partial<Record<AddressField, string>>
  postalCode?: { pattern: RegExp; format: string }
}

export type AddressLayouts = Partial<Record<string, AddressLayout>>

export type AddressType = "shipping" | "billing"

export type AddressCountryOption = { code: string; name: string; flag: string }

const DEFAULT_LABELS: Record<AddressField, string> = {
  line1: "Address line 1",
  line2: "Address line 2",
  city: "City",
  region: "Region",
  postalCode: "Postal code",
}

const AUTOCOMPLETE: Record<AddressField | "country", string> = {
  country: "country",
  line1: "address-line1",
  line2: "address-line2",
  city: "address-level2",
  region: "address-level1",
  postalCode: "postal-code",
}

const STREET: AddressField[][] = [["line1"], ["line2"]]

export const GENERIC_ADDRESS_LAYOUT: AddressLayout = {
  rows: [...STREET, ["city"], ["region", "postalCode"]],
  required: ["line1", "city"],
}

export const ADDRESS_LAYOUTS: AddressLayouts = {
  AU: {
    rows: [...STREET, ["city", "region", "postalCode"]],
    required: ["line1", "city", "region", "postalCode"],
    labels: { city: "Suburb", region: "State", postalCode: "Postcode" },
    postalCode: { pattern: /^\d{4}$/, format: "4 digits, like 2000" },
  },
  CA: {
    rows: [...STREET, ["city", "region", "postalCode"]],
    required: ["line1", "city", "region", "postalCode"],
    labels: { region: "Province" },
    postalCode: {
      pattern:
        /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i,
      format: "in the form A1A 1A1, like K1A 0B1",
    },
  },
  DE: {
    rows: [...STREET, ["postalCode", "city"]],
    required: ["line1", "postalCode", "city"],
    postalCode: { pattern: /^\d{5}$/, format: "5 digits, like 10115" },
  },
  FR: {
    rows: [...STREET, ["postalCode", "city"]],
    required: ["line1", "postalCode", "city"],
    postalCode: { pattern: /^\d{2} ?\d{3}$/, format: "5 digits, like 75008" },
  },
  GB: {
    rows: [...STREET, ["city"], ["postalCode"]],
    required: ["line1", "city", "postalCode"],
    labels: { city: "Town or city", postalCode: "Postcode" },
    postalCode: {
      pattern: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
      format: "a UK postcode, like SW1A 1AA",
    },
  },
  IN: {
    rows: [...STREET, ["city"], ["region", "postalCode"]],
    required: ["line1", "city", "region", "postalCode"],
    labels: { region: "State", postalCode: "PIN code" },
    postalCode: {
      pattern: /^[1-9]\d{5}$/,
      format: "6 digits, like 110001",
    },
  },
  JP: {
    rows: [["postalCode"], ["region"], ["city"], ...STREET],
    required: ["postalCode", "region", "city", "line1"],
    labels: { region: "Prefecture" },
    postalCode: {
      pattern: /^\d{3}-?\d{4}$/,
      format: "7 digits, like 100-0001",
    },
  },
  US: {
    rows: [...STREET, ["city", "region", "postalCode"]],
    required: ["line1", "city", "region", "postalCode"],
    labels: { region: "State", postalCode: "ZIP code" },
    postalCode: {
      pattern: /^\d{5}(?:-\d{4})?$/,
      format: "5 digits, like 94105",
    },
  },
}

export function layoutFor(country: string, layouts: AddressLayouts = {}) {
  return layouts[country] ?? ADDRESS_LAYOUTS[country] ?? GENERIC_ADDRESS_LAYOUT
}

export function fieldsOf(layout: AddressLayout) {
  return layout.rows.flat()
}

export function labelFor(field: AddressField, layout: AddressLayout) {
  return layout.labels?.[field] ?? DEFAULT_LABELS[field]
}

export function isRequired(field: AddressField, layout: AddressLayout) {
  return layout.required.includes(field)
}

export function autoCompleteFor(
  field: AddressField | "country",
  addressType?: AddressType
) {
  return addressType
    ? `${addressType} ${AUTOCOMPLETE[field]}`
    : AUTOCOMPLETE[field]
}

export function emptyAddress(country: string): Address {
  return { country, line1: "", line2: "", city: "", region: "", postalCode: "" }
}

export function changeAddressCountry(
  address: Address,
  country: string,
  layouts?: AddressLayouts
): Address {
  const kept = fieldsOf(layoutFor(country, layouts))
  const next = emptyAddress(country)
  for (const field of kept) next[field] = address[field]
  return next
}

export function postalCodeError(address: Address, layouts?: AddressLayouts) {
  const layout = layoutFor(address.country, layouts)
  const postalCode = address.postalCode.trim()
  if (!postalCode || !layout.postalCode) return null
  if (layout.postalCode.pattern.test(postalCode)) return null
  return `${labelFor("postalCode", layout)} must be ${layout.postalCode.format}.`
}

export function resolveCountryOptions(
  selected: string,
  countries?: string[],
  locale?: string
): AddressCountryOption[] {
  const codes = countries?.map((code) => code.toUpperCase())
  const toOption = (code: string) => ({
    code,
    name: countryName(code, locale),
    flag: countryFlag(code),
  })
  if (!codes) {
    return COUNTRY_CODES.map(toOption).sort((a, b) =>
      a.name.localeCompare(b.name, locale)
    )
  }
  const listed = codes.includes(selected) ? codes : [selected, ...codes]
  return listed.map(toOption)
}
