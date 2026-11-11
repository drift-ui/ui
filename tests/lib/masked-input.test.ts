import { describe, expect, it } from "vitest"

import {
  applyMask,
  calculateCurrencyCaretPosition,
  calculateMaskCaretPosition,
  formatCurrency,
  formatCurrencyLive,
  getCurrencyInfo,
  parseCurrency,
  unmaskValue,
} from "@/registry/default/lib/masked-input-utils"

describe("masked-input logic", () => {
  describe("applyMask and unmaskValue", () => {
    it("formats and unmasks credit card numbers", () => {
      const mask = "#### #### #### ####"
      const { formatted, raw } = applyMask("1234567812345678", mask)
      expect(formatted).toBe("1234 5678 1234 5678")
      expect(raw).toBe("1234567812345678")
      expect(unmaskValue(formatted, mask)).toBe("1234567812345678")
    })

    it("appends delimiters when group is complete", () => {
      const mask = "#### #### #### ####"
      expect(applyMask("1234", mask).formatted).toBe("1234 ")
      expect(applyMask("12345", mask).formatted).toBe("1234 5")
    })

    it("formats and unmasks phone numbers with leading literals", () => {
      const mask = "(###) ###-####"
      expect(applyMask("1", mask).formatted).toBe("(1")
      expect(applyMask("123", mask).formatted).toBe("(123) ")
      expect(applyMask("1234567890", mask).formatted).toBe("(123) 456-7890")
      expect(unmaskValue("(123) 456-7890", mask)).toBe("1234567890")
    })

    it("handles alphanumeric tokens", () => {
      const mask = "AA-####-AA"
      expect(applyMask("AB1234CD", mask).formatted).toBe("AB-1234-CD")
      expect(unmaskValue("AB-1234-CD", mask)).toBe("AB1234CD")
    })

    it("handles empty values gracefully", () => {
      expect(applyMask("", "####").formatted).toBe("")
      expect(unmaskValue("", "####")).toBe("")
    })
    it("does not get swallowed by literal digits in mask prefix and allows clearing", () => {
      const mask = "+1 (###) ###-####"
      // User types 1 into empty field
      expect(unmaskValue("1", mask)).toBe("1")
      expect(applyMask("1", mask).formatted).toBe("+1 (1")

      // User types 5 into empty field
      expect(unmaskValue("5", mask)).toBe("5")
      expect(applyMask("5", mask).formatted).toBe("+1 (5")

      // User backspaces the only digit 5, leaving "+1 ("
      expect(unmaskValue("+1 (", mask)).toBe("")
      expect(applyMask("", mask).formatted).toBe("")
    })
  })

  describe("calculateMaskCaretPosition", () => {
    const mask = "#### #### ####"

    it("places caret after inserted character and skips trailing delimiter", () => {
      // User has "123", types "4" -> formatted "1234 "
      const pos = calculateMaskCaretPosition({
        nextFormatted: "1234 ",
        rawInput: "1234",
        rawCursorPos: 4,
        mask,
      })
      expect(pos).toBe(5) // After "1234 "
    })

    it("keeps caret in place when inserting in the middle", () => {
      // User has "124 5678", cursor was at 2 (after "12"), typed "3" -> "123 4567 8"
      const pos = calculateMaskCaretPosition({
        nextFormatted: "1234 5678",
        rawInput: "1234 5678",
        rawCursorPos: 3,
        mask,
      })
      expect(pos).toBe(3)
    })

    it("adjusts caret position when deleting in the middle", () => {
      // User had "1234 5678", deleted "3" -> "1245 678"
      const pos = calculateMaskCaretPosition({
        nextFormatted: "1245 678",
        rawInput: "124 5678",
        rawCursorPos: 2,
        mask,
      })
      expect(pos).toBe(2)
    })

    it("keeps caret in place when a key is rejected instead of jumping to 0", () => {
      const cardMask = "#### ####"
      // User types '1', '2', then 'x' at caret 2 -> rawInput is "12x", caret at 3
      const pos = calculateMaskCaretPosition({
        nextFormatted: "12",
        rawInput: "12x",
        rawCursorPos: 3,
        mask: cardMask,
      })
      expect(pos).toBe(2) // Stays at 2, does NOT jump to 0
    })

    it("clamps caret to end when typing into a full mask", () => {
      const fullMask = "#### ####"
      const pos = calculateMaskCaretPosition({
        nextFormatted: "1234 5678",
        rawInput: "1234 56789",
        rawCursorPos: 10,
        mask: fullMask,
      })
      expect(pos).toBe(9) // End of field, does NOT jump to 0
    })

    it("does not advance caret on a rejected key inside a full field", () => {
      const cardMask = "#### #### #### ####"
      // User at index 7 (after '6') types 'x' in full field "1234 5678 1234 5678"
      const pos = calculateMaskCaretPosition({
        nextFormatted: "1234 5678 1234 5678",
        rawInput: "1234 56x78 1234 5678",
        rawCursorPos: 8,
        mask: cardMask,
      })
      expect(pos).toBe(7) // Stays at 7, does NOT move to 8
    })
  })

  describe("currency logic", () => {
    it("retrieves currency info for different locales", () => {
      const usd = getCurrencyInfo("en-US", "USD")
      expect(usd.fractionDigits).toBe(2)
      expect(usd.decimal).toBe(".")
      expect(usd.group).toBe(",")

      const eur = getCurrencyInfo("de-DE", "EUR")
      expect(eur.fractionDigits).toBe(2)
      expect(eur.decimal).toBe(",")
      expect(eur.group).toBe(".")

      const jpy = getCurrencyInfo("ja-JP", "JPY")
      expect(jpy.fractionDigits).toBe(0)
    })

    it("formats cents into localized currency", () => {
      expect(formatCurrency(1250, "en-US", "USD")).toBe("$12.50")
      // normalize non-breaking spaces in currency format
      const deFormatted = formatCurrency(1250, "de-DE", "EUR").replace(
        /\u00a0/g,
        " "
      )
      expect(deFormatted).toBe("12,50 €")

      expect(formatCurrency(1250, "ja-JP", "JPY")).toBe("￥1,250")
      expect(formatCurrency(null, "en-US", "USD")).toBe("")
    })

    it("parses currency strings into cents", () => {
      expect(parseCurrency("$12.50", "en-US", "USD")).toBe(1250)
      expect(parseCurrency("12,50 €", "de-DE", "EUR")).toBe(1250)
      expect(parseCurrency("1.250,50 €", "de-DE", "EUR")).toBe(125050)
      expect(parseCurrency("¥1,250", "ja-JP", "JPY")).toBe(1250)
      expect(parseCurrency("", "en-US", "USD")).toBeNull()
    })

    it("handles non-Latin numerals in locales like ar-EG", () => {
      // 1234.56 EGP in ar-EG with Arabic-Indic digits
      const formatted = formatCurrency(123456, "ar-EG", "EGP")
      expect(parseCurrency(formatted, "ar-EG", "EGP")).toBe(123456)

      const live = formatCurrencyLive("١٢٣٤٫٥٦", "ar-EG", "EGP")
      expect(live.cents).toBe(123456)
    })

    it("handles negative currency values and preserves minus sign", () => {
      expect(parseCurrency("-$12.50", "en-US", "USD")).toBe(-1250)
      const live = formatCurrencyLive("-12.50", "en-US", "USD")
      expect(live.cents).toBe(-1250)
      expect(live.formatted).toBe("-$12.50")
    })

    it("clamps digits to safe integer limits", () => {
      const live = formatCurrencyLive("12345678901234567890", "en-US", "USD")
      expect(Number.isSafeInteger(live.cents!)).toBe(true)
      expect(String(live.cents)).not.toContain("e+")
    })

    it("calculates caret position during currency formatting shifts", () => {
      // Typing 4 after 1 in "$1,250.00" -> "$14,250.00"
      const pos = calculateCurrencyCaretPosition({
        nextFormatted: "$14,250.00",
        rawInput: "$14,250.00",
        rawCursorPos: 3,
      })
      expect(pos).toBe(3) // Right after '4'

      // Typing '.' after "$12" -> "$12."
      const dotPos = calculateCurrencyCaretPosition({
        nextFormatted: "$12.",
        rawInput: "$12.",
        rawCursorPos: 4,
      })
      expect(dotPos).toBe(4) // Right after '.'

      // Typing '5' after '.' -> "$12.5"
      const fracPos = calculateCurrencyCaretPosition({
        nextFormatted: "$12.5",
        rawInput: "$12.5",
        rawCursorPos: 5,
      })
      expect(fracPos).toBe(5) // Right after '5'
    })
  })
})
