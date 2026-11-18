import { describe, expect, it } from "vitest"

import {
  findRegexMatches,
  highlightSampleText,
  normalizeFlags,
  toggleFlag,
  validateRegex,
} from "@/registry/default/lib/regex-input-utils"

describe("regex-input-utils", () => {
  describe("normalizeFlags", () => {
    it("deduplicates and sorts valid flags", () => {
      expect(normalizeFlags("msi")).toBe("ims")
      expect(normalizeFlags("iimssi")).toBe("ims")
      expect(normalizeFlags("gims")).toBe("gims")
    })

    it("filters out invalid flag characters", () => {
      expect(normalizeFlags("ixz123")).toBe("i")
      expect(normalizeFlags("ixyz123")).toBe("iy")
      expect(normalizeFlags("!@#$%^")).toBe("")
    })

    it("handles empty or falsy flags", () => {
      expect(normalizeFlags("")).toBe("")
    })
  })

  describe("toggleFlag", () => {
    it("adds flag when not present", () => {
      expect(toggleFlag("m", "i")).toBe("im")
      expect(toggleFlag("", "s")).toBe("s")
    })

    it("removes flag when present", () => {
      expect(toggleFlag("ims", "m")).toBe("is")
      expect(toggleFlag("i", "i")).toBe("")
    })

    it("rejects invalid flag characters", () => {
      expect(toggleFlag("i", "x")).toBe("i")
      expect(toggleFlag("im", "1")).toBe("im")
    })
  })

  describe("validateRegex", () => {
    it("returns valid for empty pattern", () => {
      const res = validateRegex("")
      expect(res.isValid).toBe(true)
      expect(res.error).toBeNull()
      expect(res.regex).toBeNull()
    })

    it("returns valid for syntactically correct patterns", () => {
      const res1 = validateRegex("[a-zA-Z0-9]+", "i")
      expect(res1.isValid).toBe(true)
      expect(res1.error).toBeNull()
      expect(res1.regex).toBeInstanceOf(RegExp)

      const res2 = validateRegex("(?<id>\\d+)")
      expect(res2.isValid).toBe(true)
    })

    it("returns invalid and error message for syntax errors", () => {
      const unclosedBracket = validateRegex("[a-z")
      expect(unclosedBracket.isValid).toBe(false)
      expect(unclosedBracket.error).toBeTruthy()
      expect(unclosedBracket.regex).toBeNull()

      const unclosedGroup = validateRegex("(abc")
      expect(unclosedGroup.isValid).toBe(false)

      const leadingQuantifier = validateRegex("*abc")
      expect(leadingQuantifier.isValid).toBe(false)
    })
  })

  describe("findRegexMatches", () => {
    it("returns empty matches when pattern or sample is empty", () => {
      expect(findRegexMatches("", "i", "sample text").matches).toHaveLength(0)
      expect(findRegexMatches("abc", "i", "").matches).toHaveLength(0)
    })

    it("finds multiple occurrences with case insensitivity", () => {
      const sample = "The Quick brown fox jumps over the lazy dog"
      const res = findRegexMatches("the", "i", sample)
      expect(res.matches).toHaveLength(2)
      expect(res.matches[0].match).toBe("The")
      expect(res.matches[0].index).toBe(0)
      expect(res.matches[1].match).toBe("the")
      expect(res.matches[1].index).toBe(31)
      expect(res.truncated).toBe(false)
    })

    it("extracts numbered capture groups", () => {
      const sample = "2026-05-18 and 2027-11-20"
      const res = findRegexMatches("(\\d{4})-(\\d{2})-(\\d{2})", "", sample)
      expect(res.matches).toHaveLength(2)

      const m1 = res.matches[0]
      expect(m1.match).toBe("2026-05-18")
      expect(m1.groups).toHaveLength(3)
      expect(m1.groups[0].number).toBe(1)
      expect(m1.groups[0].value).toBe("2026")
      expect(m1.groups[1].number).toBe(2)
      expect(m1.groups[1].value).toBe("05")
      expect(m1.groups[2].number).toBe(3)
      expect(m1.groups[2].value).toBe("18")
    })

    it("extracts named capture groups", () => {
      const sample = "User: alice (admin)"
      const res = findRegexMatches(
        "User: (?<user>\\w+) \\((?<role>\\w+)\\)",
        "",
        sample
      )
      expect(res.matches).toHaveLength(1)
      const m = res.matches[0]
      expect(m.groups).toHaveLength(2)
      expect(m.groups[0].name).toBe("user")
      expect(m.groups[0].value).toBe("alice")
      expect(m.groups[1].name).toBe("role")
      expect(m.groups[1].value).toBe("admin")
    })

    it("handles zero-length matches safely without infinite loop", () => {
      const sample = "abc"
      // Match boundaries
      const res = findRegexMatches("\\b", "", sample)
      expect(res.matches.length).toBeGreaterThan(0)
      expect(res.truncated).toBe(false)
    })

    it("caps max matches when limit is reached", () => {
      const sample = "1 2 3 4 5 6 7 8 9 10"
      const res = findRegexMatches("\\d", "", sample, { maxMatches: 3 })
      expect(res.matches).toHaveLength(3)
      expect(res.truncated).toBe(true)
    })

    it("caps iterations when maxIterations is reached", () => {
      const sample = "1 2 3 4 5 6 7 8 9 10"
      const res = findRegexMatches("[0-9]", "", sample, { maxIterations: 2 })
      expect(res.truncated).toBe(true)
    })

    it("caps sample length when exceeding limit", () => {
      const sample = "a".repeat(100)
      const res = findRegexMatches("a", "", sample, { maxSampleLength: 20 })
      expect(res.matches.length).toBe(20)
      expect(res.truncated).toBe(true)
    })

    it("sets truncated to true when iteration or timeout limits are reached", () => {
      const sample = "a".repeat(500)
      const res = findRegexMatches("a", "", sample, {
        maxIterations: 10,
        timeoutMs: 50,
      })
      expect(res.error).toBeNull()
      expect(res.truncated).toBe(true)
      expect(res.matches.length).toBeLessThanOrEqual(10)
    })

    it("handles non-positive maxMatches by returning empty matches", () => {
      const res = findRegexMatches("a", "", "aaa", { maxMatches: 0 })
      expect(res.matches).toHaveLength(0)
      expect(res.matchCount).toBe(0)
      expect(res.truncated).toBe(false)
    })

    it("advances astral code points with unicode semantics on zero-length matches", () => {
      const sample = "𠮷abc"
      const res = findRegexMatches("b*", "u", sample)
      expect(res.matches.length).toBeGreaterThan(0)
      expect(res.matches[0].index).toBe(0)
      expect(res.matches[1].index).toBe(2)
    })

    it("accurately attributes capture group ranges and names even with duplicate values", () => {
      const res = findRegexMatches(
        "(?<left>\\w+)-(?<right>\\w+)",
        "",
        "same-same"
      )
      expect(res.matches).toHaveLength(1)
      const groups = res.matches[0].groups
      expect(groups).toHaveLength(2)
      expect(groups[0].name).toBe("left")
      expect(groups[0].value).toBe("same")
      expect(groups[0].start).toBe(0)
      expect(groups[0].end).toBe(4)

      expect(groups[1].name).toBe("right")
      expect(groups[1].value).toBe("same")
      expect(groups[1].start).toBe(5)
      expect(groups[1].end).toBe(9)
    })

    it("returns error for invalid pattern", () => {
      const res = findRegexMatches("[a-z", "", "test")
      expect(res.error).toBeTruthy()
      expect(res.matches).toHaveLength(0)
    })

    it("handles environments without regex indices fallback gracefully", () => {
      const OrigRegExp = globalThis.RegExp
      class MockRegExp extends OrigRegExp {
        constructor(pattern: string | RegExp, flags?: string) {
          if (flags && typeof flags === "string" && flags.includes("d")) {
            throw new SyntaxError("Invalid flags: d not supported")
          }
          super(pattern, flags)
        }
      }
      globalThis.RegExp = MockRegExp as unknown as RegExpConstructor

      try {
        const res = findRegexMatches("(?<user>\\w+)", "", "alice")
        expect(res.error).toBeNull()
        expect(res.matches).toHaveLength(1)
        expect(res.matches[0].match).toBe("alice")
        expect(res.matches[0].groups).toHaveLength(1)
        expect(res.matches[0].groups[0]).toEqual({
          number: 1,
          name: "user",
          value: "alice",
          start: 0,
          end: 5,
        })
      } finally {
        globalThis.RegExp = OrigRegExp
      }
    })

    it("marks result truncated when maxMatches cap is reached", () => {
      const res = findRegexMatches("[a-z]", "", "abcdef", { maxMatches: 3 })
      expect(res.matches).toHaveLength(3)
      expect(res.truncated).toBe(true)
    })

    it("marks result truncated when zero-length matches reach maxMatches", () => {
      const res = findRegexMatches("b*", "", "bbb", { maxMatches: 2 })
      expect(res.matches).toHaveLength(2)
      expect(res.truncated).toBe(true)
    })
  })

  describe("highlightSampleText", () => {
    it("returns single segment when no matches", () => {
      const sample = "Hello World"
      const segments = highlightSampleText(sample, [])
      expect(segments).toEqual([{ text: "Hello World", isMatch: false }])
    })

    it("segments text accurately around matches", () => {
      const sample = "foo bar baz bar qux"
      const matches = [
        { match: "bar", index: 4, length: 3, groups: [] },
        { match: "bar", index: 12, length: 3, groups: [] },
      ]
      const segments = highlightSampleText(sample, matches)
      expect(segments).toEqual([
        { text: "foo ", isMatch: false },
        { text: "bar", isMatch: true, matchIndex: 1 },
        { text: " baz ", isMatch: false },
        { text: "bar", isMatch: true, matchIndex: 2 },
        { text: " qux", isMatch: false },
      ])
    })

    it("handles match at start and end of text", () => {
      const sample = "abc def ghi"
      const matches = [
        { match: "abc", index: 0, length: 3, groups: [] },
        { match: "ghi", index: 8, length: 3, groups: [] },
      ]
      const segments = highlightSampleText(sample, matches)
      expect(segments).toEqual([
        { text: "abc", isMatch: true, matchIndex: 1 },
        { text: " def ", isMatch: false },
        { text: "ghi", isMatch: true, matchIndex: 2 },
      ])
    })

    it("returns empty array for empty sample", () => {
      expect(highlightSampleText("", [])).toEqual([])
    })
  })
})
