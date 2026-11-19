import { describe, expect, it } from "vitest"

import {
  DEFAULT_LOCALES,
  filterLocales,
  formatLocaleNames,
  getLocaleFlag,
  isValidLocale,
  listLocales,
  normalizeLocale,
} from "@/registry/default/lib/locale-picker-utils"

describe("locale-picker-utils", () => {
  describe("isValidLocale", () => {
    it("recognizes valid BCP 47 tags", () => {
      expect(isValidLocale("en-US")).toBe(true)
      expect(isValidLocale("de-DE")).toBe(true)
      expect(isValidLocale("ja-JP")).toBe(true)
      expect(isValidLocale("pt-BR")).toBe(true)
      expect(isValidLocale("fr")).toBe(true)
      expect(isValidLocale("zh-Hans-CN")).toBe(true)
    })

    it("rejects invalid or empty language tags", () => {
      expect(isValidLocale("")).toBe(false)
      expect(isValidLocale("   ")).toBe(false)
      expect(isValidLocale("invalid--tag")).toBe(false)
      expect(isValidLocale("123456789")).toBe(false)
      expect(isValidLocale(null as unknown as string)).toBe(false)
    })
  })

  describe("normalizeLocale", () => {
    it("replaces underscores with hyphens", () => {
      expect(normalizeLocale("en_US")).toBe("en-US")
      expect(normalizeLocale("pt_br")).toBe("pt-BR")
    })

    it("canonicalizes casing and trims whitespace", () => {
      expect(normalizeLocale("  de-de  ")).toBe("de-DE")
      expect(normalizeLocale("ja_jp")).toBe("ja-JP")
    })

    it("returns trimmed tag if invalid", () => {
      expect(normalizeLocale("  bad--tag  ")).toBe("bad--tag")
    })
  })

  describe("getLocaleFlag", () => {
    it("returns regional emoji flag for 2-letter ISO country regions", () => {
      expect(getLocaleFlag("en-US")).toBe("🇺🇸")
      expect(getLocaleFlag("de-DE")).toBe("🇩🇪")
      expect(getLocaleFlag("pt-BR")).toBe("🇧🇷")
      expect(getLocaleFlag("ja-JP")).toBe("🇯🇵")
    })

    it("returns null for language-only tags without a region", () => {
      expect(getLocaleFlag("en")).toBeNull()
      expect(getLocaleFlag("de")).toBeNull()
      expect(getLocaleFlag("fr")).toBeNull()
    })

    it("returns null for numeric M.49 regions and invalid tags", () => {
      expect(getLocaleFlag("es-419")).toBeNull()
      expect(getLocaleFlag("invalid-tag")).toBeNull()
    })
  })

  describe("formatLocaleNames", () => {
    it("formats native and display names when they differ", () => {
      const res = formatLocaleNames("de", "en")
      expect(res.nativeName).toBe("Deutsch")
      expect(res.currentName).toBe("German")
      expect(res.label).toBe("Deutsch · German")
    })

    it("formats regional locale names with countries", () => {
      const res = formatLocaleNames("pt-BR", "en")
      expect(res.nativeName).toBe("Português (Brasil)")
      expect(res.currentName).toBe("Brazilian Portuguese")
      expect(res.label).toBe("Português (Brasil) · Brazilian Portuguese")
    })

    it("does not repeat names when native and display names match", () => {
      const res = formatLocaleNames("en", "en")
      expect(res.nativeName).toBe("English")
      expect(res.currentName).toBe("English")
      expect(res.label).toBe("English")
    })

    it("falls back to en when given an invalid displayLocale", () => {
      const res = formatLocaleNames("fr-FR", "invalid!!!locale")
      expect(res.nativeName).toBe("Français (France)")
      expect(res.currentName).toBe("French (France)")
    })
  })

  describe("listLocales", () => {
    it("uses DEFAULT_LOCALES when no tags are provided", () => {
      const options = listLocales()
      expect(options.length).toBe(DEFAULT_LOCALES.length)
      expect(options.some((o) => o.value === "en-US")).toBe(true)
      expect(options.some((o) => o.value === "ja-JP")).toBe(true)
    })

    it("deduplicates tags and filters invalid ones", () => {
      const options = listLocales(["en_US", "en-US", "foo--bar", "de-DE"])
      expect(options).toHaveLength(2)
      expect(options.map((o) => o.value)).toEqual(["en-US", "de-DE"])
    })

    it("includes flags and regions for regional locales", () => {
      const options = listLocales(["en-US", "de"])
      expect(options[0]).toEqual({
        value: "en-US",
        nativeName: "American English",
        currentName: "American English",
        label: "American English",
        region: "US",
        flag: "🇺🇸",
      })
      expect(options[1].flag).toBeNull()
      expect(options[1].region).toBeUndefined()
    })
  })

  describe("filterLocales", () => {
    const options = listLocales(["en-US", "de-DE", "ja-JP", "pt-BR"])

    it("returns all options when query is empty", () => {
      expect(filterLocales(options, "")).toEqual(options)
      expect(filterLocales(options, "   ")).toEqual(options)
    })

    it("matches by BCP 47 tag", () => {
      const res = filterLocales(options, "pt-br")
      expect(res.map((o) => o.value)).toEqual(["pt-BR"])
    })

    it("matches by native name", () => {
      const res = filterLocales(options, "deutsch")
      expect(res.map((o) => o.value)).toEqual(["de-DE"])
    })

    it("matches by display name", () => {
      const res = filterLocales(options, "japanese")
      expect(res.map((o) => o.value)).toEqual(["ja-JP"])
    })

    it("matches by country region code", () => {
      const res = filterLocales(options, "us")
      expect(res.map((o) => o.value)).toEqual(["en-US"])
    })

    it("returns empty array when nothing matches", () => {
      expect(filterLocales(options, "klingon")).toHaveLength(0)
    })
  })
})
