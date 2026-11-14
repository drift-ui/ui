import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  type CountryCode,
} from "libphonenumber-js"
import metadata from "libphonenumber-js/min/metadata"
import type { ReactNode } from "react"

export type PhoneCountry = {
  code: CountryCode
  name: string
  dialCode: string
  flag: ReactNode
}

export type PhoneCountryOption =
  | CountryCode
  | (Pick<PhoneCountry, "code"> & Partial<Pick<PhoneCountry, "name" | "flag">>)

const REGIONAL_INDICATOR_OFFSET = 0x1f1a5

const regionNames = new Intl.DisplayNames(["en"], { type: "region" })

function dialCodeOf(country: CountryCode) {
  return `+${getCountryCallingCode(country)}`
}

function digitsOf(text: string) {
  return text.replace(/\D/g, "")
}

function foldText(text: string) {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
}

export function countryFlag(country: CountryCode) {
  return String.fromCodePoint(
    ...Array.from(
      country,
      (letter) => REGIONAL_INDICATOR_OFFSET + letter.charCodeAt(0)
    )
  )
}

export const PHONE_COUNTRIES: PhoneCountry[] = getCountries()
  .map((code) => ({
    code,
    name: regionNames.of(code) ?? code,
    dialCode: dialCodeOf(code),
    flag: countryFlag(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

export function resolveCountries(
  countries?: PhoneCountryOption[],
  excludedCountries: CountryCode[] = []
) {
  const chosen =
    countries?.flatMap((option) => {
      const { code, ...overrides } =
        typeof option === "string" ? { code: option } : option
      const country = PHONE_COUNTRIES.find((entry) => entry.code === code)
      return country ? [{ ...country, ...overrides }] : []
    }) ?? PHONE_COUNTRIES
  return chosen.filter(({ code }) => !excludedCountries.includes(code))
}

export function filterCountries(countries: PhoneCountry[], query: string) {
  const needle = foldText(query.trim())
  if (!needle) return countries
  const dialPrefix = needle.startsWith("+") ? needle : `+${needle}`
  return countries.filter(
    (country) =>
      foldText(country.name).includes(needle) ||
      country.code.toLowerCase() === needle ||
      country.dialCode.startsWith(dialPrefix)
  )
}

function isInternationalText(text: string) {
  return text.trimStart().startsWith("+")
}

function groupWithoutTrunkPrefix(
  digits: string,
  value: string,
  country: CountryCode
) {
  const grouped = new AsYouType()
    .input(value)
    .slice(dialCodeOf(country).length)
    .trim()
  return digitsOf(grouped) === digits ? grouped : digits
}

export function formatPhoneInput(text: string, country: CountryCode) {
  const digits = digitsOf(text)
  if (isInternationalText(text)) {
    const typer = new AsYouType()
    const display = typer.input(`+${digits}`)
    return { display, value: typer.getNumberValue() ?? "" }
  }
  const typer = new AsYouType(country)
  const display = typer.input(digits)
  const value = typer.getNumberValue() ?? ""
  const withLeadingDigits = `${dialCodeOf(country)}${digits}`
  if (!isValidPhoneNumber(value) && isValidPhoneNumber(withLeadingDigits)) {
    return {
      display: groupWithoutTrunkPrefix(digits, withLeadingDigits, country),
      value: withLeadingDigits,
    }
  }
  return {
    display:
      display === digits && value
        ? groupWithoutTrunkPrefix(digits, value, country)
        : display,
    value,
  }
}

export function formatPhoneValue(value: string, country: CountryCode) {
  const dialCode = dialCodeOf(country)
  const national = value.slice(dialCode.length)
  if (!value.startsWith(dialCode) || !national) {
    return new AsYouType().input(value)
  }
  return formatPhoneInput(national, country).display
}

function includesCountry(countries: PhoneCountry[], country: string) {
  return countries.some(({ code }) => code === country)
}

export function countryForValue(
  value: string,
  selected: CountryCode,
  countries = PHONE_COUNTRIES
) {
  const fallback = includesCountry(countries, selected)
    ? selected
    : (countries[0]?.code ?? selected)
  if (!value) return fallback
  const typer = new AsYouType()
  typer.input(value)
  const detected = typer.getCountry()
  if (detected && includesCountry(countries, detected)) return detected
  const callingCode = typer.getCallingCode()
  if (!callingCode || callingCode === getCountryCallingCode(fallback)) {
    return fallback
  }
  const candidates = metadata.country_calling_codes[callingCode] ?? []
  return (
    candidates.find((candidate) => includesCountry(countries, candidate)) ??
    fallback
  )
}

export function isAllowedNumber(value: string, countries: PhoneCountry[]) {
  const typer = new AsYouType()
  typer.input(value)
  const detected = typer.getCountry()
  if (detected) return includesCountry(countries, detected)
  const callingCode = typer.getCallingCode()
  return (
    !callingCode ||
    countries.some(({ dialCode }) => dialCode === `+${callingCode}`)
  )
}

export function formatInsertedPhone(
  text: string,
  country: CountryCode,
  countries = PHONE_COUNTRIES
) {
  const { display, value } = formatPhoneInput(text, country)
  const insertedCountry = countryForValue(value, country, countries)
  return {
    value,
    country: insertedCountry,
    display: isInternationalText(text)
      ? formatPhoneValue(value, insertedCountry)
      : display,
  }
}

export function changeCountry(
  value: string,
  from: CountryCode,
  to: CountryCode
) {
  const dialCode = dialCodeOf(from)
  const national = value.startsWith(dialCode)
    ? value.slice(dialCode.length)
    : ""
  return formatPhoneInput(national, to)
}

export function deleteDigitPastFormatting(
  previous: string,
  text: string,
  caret: number,
  isForward: boolean
) {
  const removedFormatting =
    previous.length - text.length === 1 && digitsOf(previous) === digitsOf(text)
  if (!removedFormatting) return { text, caret }

  const digitIndex = isForward
    ? text.slice(caret).search(/\d/)
    : text.slice(0, caret).search(/\d\D*$/)
  if (digitIndex === -1) return { text, caret }

  const index = isForward ? caret + digitIndex : digitIndex
  return {
    text: text.slice(0, index) + text.slice(index + 1),
    caret: isForward ? caret : index,
  }
}

export function countDigits(text: string) {
  return digitsOf(text).length
}

export function caretAfterDigits(text: string, digitCount: number) {
  if (digitCount >= countDigits(text)) return text.length
  let seen = 0
  let index = 0
  while (seen < digitCount) {
    if (/\d/.test(text[index])) seen += 1
    index += 1
  }
  return index
}
