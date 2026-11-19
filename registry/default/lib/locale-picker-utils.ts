import { countryFlag } from "@/registry/default/lib/countries"

export interface LocaleOption {
  value: string
  nativeName: string
  currentName: string
  label: string
  region?: string
  flag?: string | null
}

export const DEFAULT_LOCALES: string[] = [
  "ar-SA",
  "cs-CZ",
  "da-DK",
  "de-DE",
  "el-GR",
  "en-GB",
  "en-US",
  "es-ES",
  "es-MX",
  "fi-FI",
  "fr-CA",
  "fr-FR",
  "he-IL",
  "hi-IN",
  "hu-HU",
  "id-ID",
  "it-IT",
  "ja-JP",
  "ko-KR",
  "nb-NO",
  "nl-NL",
  "pl-PL",
  "pt-BR",
  "pt-PT",
  "ro-RO",
  "ru-RU",
  "sk-SK",
  "sv-SE",
  "th-TH",
  "tr-TR",
  "uk-UA",
  "vi-VN",
  "zh-CN",
  "zh-TW",
]

const validityCache = new Map<string, boolean>()

export function isValidLocale(tag: string): boolean {
  if (!tag || typeof tag !== "string") return false
  let valid = validityCache.get(tag)
  if (valid === undefined) {
    try {
      new Intl.Locale(tag)
      valid = true
    } catch {
      valid = false
    }
    validityCache.set(tag, valid)
  }
  return valid
}

export function normalizeLocale(tag: string): string {
  try {
    const cleaned = tag.trim().replaceAll("_", "-")
    return new Intl.Locale(cleaned).baseName
  } catch {
    return tag.trim()
  }
}

export function getLocaleFlag(tag: string): string | null {
  try {
    const locale = new Intl.Locale(tag)
    if (
      locale.region &&
      locale.region.length === 2 &&
      /^[A-Za-z]{2}$/.test(locale.region)
    ) {
      return countryFlag(locale.region)
    }
  } catch {
    // Ignore invalid tags
  }
  return null
}

const displayNamesCache = new Map<string, Intl.DisplayNames>()

function getDisplayNames(locale: string): Intl.DisplayNames {
  let dn = displayNamesCache.get(locale)
  if (!dn) {
    try {
      dn = new Intl.DisplayNames([locale], { type: "language" })
    } catch {
      dn = new Intl.DisplayNames(["en"], { type: "language" })
    }
    displayNamesCache.set(locale, dn)
  }
  return dn
}

function capitalize(text: string): string {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatLocaleNames(
  tag: string,
  displayLocale = "en"
): { nativeName: string; currentName: string; label: string } {
  const normalized = normalizeLocale(tag)
  let nativeName = normalized
  let currentName = normalized

  try {
    const nativeDn = getDisplayNames(normalized)
    const rawNative = nativeDn.of(normalized)
    if (rawNative) nativeName = capitalize(rawNative)
  } catch {
    // Fallback to tag
  }

  try {
    const currentDn = getDisplayNames(displayLocale)
    const rawCurrent = currentDn.of(normalized)
    if (rawCurrent) currentName = capitalize(rawCurrent)
  } catch {
    // Fallback to tag
  }

  const label =
    nativeName.toLowerCase() === currentName.toLowerCase()
      ? nativeName
      : `${nativeName} · ${currentName}`

  return { nativeName, currentName, label }
}

export function listLocales(
  tags: string[] = DEFAULT_LOCALES,
  displayLocale = "en"
): LocaleOption[] {
  const seen = new Set<string>()
  const result: LocaleOption[] = []

  for (const rawTag of tags) {
    const normalized = normalizeLocale(rawTag)
    if (!isValidLocale(normalized) || seen.has(normalized)) continue
    seen.add(normalized)

    const flag = getLocaleFlag(normalized)
    const { nativeName, currentName, label } = formatLocaleNames(
      normalized,
      displayLocale
    )
    let region: string | undefined
    try {
      const loc = new Intl.Locale(normalized)
      region = loc.region
    } catch {
      // Ignore
    }

    result.push({
      value: normalized,
      nativeName,
      currentName,
      label,
      region,
      flag,
    })
  }

  return result
}

function normalize(text: string) {
  return text.toLowerCase().trim()
}

export function filterLocales(
  options: LocaleOption[],
  query: string
): LocaleOption[] {
  const needle = normalize(query)
  if (!needle) return options

  return options.filter(
    (option) =>
      normalize(option.value).includes(needle) ||
      normalize(option.nativeName).includes(needle) ||
      normalize(option.currentName).includes(needle) ||
      normalize(option.label).includes(needle) ||
      (option.region ? normalize(option.region).includes(needle) : false)
  )
}
