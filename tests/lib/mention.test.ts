import { describe, expect, it } from "vitest"

import {
  deleteMention,
  expandSelection,
  filterMentionOptions,
  findActiveMention,
  findMentionRanges,
  insertMention,
  snapCaret,
} from "@/registry/default/lib/mention"

const PEOPLE = [
  { value: "noor", label: "Noor Haddad" },
  { value: "tomasz", label: "Tomasz Wierzba" },
]

describe("mention", () => {
  it("finds the mention being typed before the caret", () => {
    expect(findActiveMention("Thanks @no", 10, ["@"])).toEqual({
      trigger: "@",
      query: "no",
      start: 7,
    })
    expect(findActiveMention("@", 1, ["@"])).toEqual({
      trigger: "@",
      query: "",
      start: 0,
    })
  })

  it("ignores triggers inside words and unknown triggers", () => {
    expect(findActiveMention("mail me at ilse@example", 23, ["@"])).toBeNull()
    expect(findActiveMention("ping #ops", 9, ["@"])).toBeNull()
    expect(findActiveMention("@noor done", 10, ["@"])).toBeNull()
  })

  it("filters options by value or label", () => {
    expect(
      filterMentionOptions(PEOPLE, "wier").map((option) => option.value)
    ).toEqual(["tomasz"])
    expect(filterMentionOptions(PEOPLE, "")).toHaveLength(2)
  })

  it("replaces the query with the selected option and moves the caret", () => {
    const text = "cc @no and more"
    const mention = findActiveMention(text, 6, ["@"])!
    expect(insertMention(text, mention, 6, PEOPLE[0])).toEqual({
      text: "cc @noor  and more",
      caret: 9,
    })
  })
})

describe("mention ranges", () => {
  const tokens = new Set(["@ana", "@ana.lee", "#ops"])

  it("finds whole known mentions and prefers the longest", () => {
    expect(findMentionRanges("cc @ana, @ana.lee and #ops.", tokens)).toEqual([
      { start: 3, end: 7 },
      { start: 9, end: 17 },
      { start: 22, end: 26 },
    ])
    expect(findMentionRanges("@ana..", new Set(["@ana", "@ana."]))).toEqual([
      { start: 0, end: 5 },
    ])
  })

  it("ends a mention at a comma, and reads whole code points after a dot", () => {
    expect(findMentionRanges("@ana,thanks", tokens)).toEqual([
      { start: 0, end: 4 },
    ])
    expect(findMentionRanges("@ana.\u{20000}", tokens)).toEqual([])
  })

  it("skips unknown or partial tokens and mid-word triggers", () => {
    expect(findMentionRanges("@anabel mail@ana @bob", tokens)).toEqual([])
    expect(findMentionRanges("@ana.leex (#ops)", tokens)).toEqual([])
  })

  it("is empty when nothing is known", () => {
    expect(findMentionRanges("@ana", new Set())).toEqual([])
  })
})

describe("caret and selection", () => {
  const ranges = [{ start: 3, end: 7 }]

  it("jumps over a mention in the direction of a one-step move", () => {
    expect(snapCaret(ranges, 4, 3, true)).toBe(7)
    expect(snapCaret(ranges, 6, 7, true)).toBe(3)
  })

  it("goes to the nearest edge for a click", () => {
    expect(snapCaret(ranges, 4, 0)).toBe(3)
    expect(snapCaret(ranges, 6, 0)).toBe(7)
    expect(snapCaret(ranges, 4, 3)).toBe(3)
  })

  it("leaves positions outside or on an edge alone", () => {
    expect(snapCaret(ranges, 3, 0)).toBe(3)
    expect(snapCaret(ranges, 7, 0)).toBe(7)
    expect(snapCaret(ranges, 9, 0)).toBe(9)
  })

  it("grows a selection to cover cut mentions", () => {
    expect(expandSelection(ranges, 5, 9)).toEqual({ start: 3, end: 9 })
    expect(expandSelection(ranges, 0, 5)).toEqual({ start: 0, end: 7 })
    expect(expandSelection(ranges, 0, 2)).toEqual({ start: 0, end: 2 })
  })
})

describe("deleteMention", () => {
  const text = "cc @ana ok"
  const ranges = [{ start: 3, end: 7 }]

  it("removes the whole mention with Backspace at its end", () => {
    expect(deleteMention(text, ranges, 7, "backward")).toEqual({
      text: "cc  ok",
      caret: 3,
    })
  })

  it("removes the whole mention with Delete at its start", () => {
    expect(deleteMention(text, ranges, 3, "forward")).toEqual({
      text: "cc  ok",
      caret: 3,
    })
  })

  it("does nothing away from a mention", () => {
    expect(deleteMention(text, ranges, 8, "backward")).toBeNull()
    expect(deleteMention(text, ranges, 7, "forward")).toBeNull()
  })
})
