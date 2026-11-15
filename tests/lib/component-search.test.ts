import { describe, expect, it } from "vitest"

import { matchScore, searchWords } from "@/lib/component-search"

describe("searchWords", () => {
  it("drops filler words and punctuation", () => {
    expect(searchWords("I need a tags-input, please!")).toEqual([
      "tags-input",
      "please",
    ])
  })

  it("keeps non-ASCII words instead of dropping the query", () => {
    expect(searchWords("Sélecteur 日付")).toEqual(["sélecteur", "日付"])
  })

  it("returns no words for a query of only filler", () => {
    expect(searchWords("the a to")).toEqual([])
  })
})

describe("matchScore", () => {
  it("counts how many words appear across the fields", () => {
    expect(
      matchScore(["Tags Input", "Type tags"], ["tags", "input", "x"])
    ).toBe(2)
  })

  it("scores zero when a non-ASCII word matches nothing", () => {
    expect(matchScore(["Tags Input"], searchWords("日付"))).toBe(0)
  })
})
