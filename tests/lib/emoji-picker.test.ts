import { beforeEach, describe, expect, it } from "vitest"

import {
  addRecent,
  buildSections,
  layoutSections,
  loadEmojis,
  moveCell,
  readPreferences,
  searchEmojis,
  withSkinTone,
  writePreferences,
  type Emoji,
} from "@/registry/default/lib/emoji-picker-utils"

function emoji(hexcode: string, overrides: Partial<Emoji> = {}): Emoji {
  return {
    hexcode,
    emoji: hexcode,
    label: hexcode,
    tags: [],
    group: 0,
    order: 0,
    version: 1,
    ...overrides,
  }
}

const WAVE = emoji("wave", {
  label: "Waving hand",
  tags: ["hello", "bye"],
  group: 1,
  skins: [
    { emoji: "wave-1", tone: 1 },
    { emoji: "wave-3", tone: 3 },
    { emoji: "wave-1-3", tone: [1, 3] },
  ],
})
const CAT = emoji("cat", { label: "cat face", tags: ["pet"], group: 3 })

const ROW_LENGTHS = [8, 3, 8, 8, 2]
const SECTION_STARTS = [0, 2, 4]

describe("loadEmojis", () => {
  it("keeps only pickable groups, in display order", async () => {
    const emojis = await loadEmojis()

    expect(emojis.length).toBeGreaterThan(1500)
    expect(emojis[0].label).toBe("grinning face")
    expect(emojis.some((item) => item.group === 2)).toBe(false)
    expect(emojis.some((item) => item.group === undefined)).toBe(false)
  })

  it("leaves out emoji newer than the widely supported version", async () => {
    const emojis = await loadEmojis()

    expect(emojis.every((item) => item.version <= 15)).toBe(true)
  })

  it("reuses one request", () => {
    expect(loadEmojis()).toBe(loadEmojis())
  })
})

describe("searchEmojis", () => {
  it("matches inside labels and at the start of tags", () => {
    expect(searchEmojis([WAVE, CAT], "hand")).toEqual([WAVE])
    expect(searchEmojis([WAVE, CAT], "HEL")).toEqual([WAVE])
    expect(searchEmojis([WAVE, CAT], "ello")).toEqual([])
  })

  it("returns everything for a blank query", () => {
    expect(searchEmojis([WAVE, CAT], "  ")).toEqual([WAVE, CAT])
  })
})

describe("withSkinTone", () => {
  it("uses the single-tone variant", () => {
    expect(withSkinTone(WAVE, 3)).toBe("wave-3")
  })

  it("falls back to the base emoji", () => {
    expect(withSkinTone(WAVE, 0)).toBe("wave")
    expect(withSkinTone(WAVE, 5)).toBe("wave")
    expect(withSkinTone(CAT, 2)).toBe("cat")
  })
})

describe("buildSections", () => {
  it("puts recent emoji first, in recent order", () => {
    const [recent] = buildSections([WAVE, CAT], ["cat", "wave"])

    expect(recent.label).toBe("Recently used")
    expect(recent.emojis).toEqual([CAT, WAVE])
  })

  it("skips the recent section when no stored code still exists", () => {
    const [first] = buildSections([WAVE, CAT], ["gone"])

    expect(first.label).toBe("Smileys & emotion")
  })
})

describe("layoutSections", () => {
  it("chunks rows and records where each section starts", () => {
    const layout = layoutSections(
      [
        { id: "a", label: "A", emojis: [WAVE, CAT, WAVE] },
        { id: "empty", label: "Empty", emojis: [] },
        { id: "b", label: "B", emojis: [CAT] },
      ],
      2
    )

    expect(layout.rows.map((row) => row.length)).toEqual([2, 1, 1])
    expect(
      layout.sections.map((section) => [
        section.id,
        section.firstRow,
        section.rowCount,
      ])
    ).toEqual([
      ["a", 0, 2],
      ["b", 2, 1],
    ])
  })
})

describe("moveCell", () => {
  function move(row: number, column: number, key: string, toGridEdge = false) {
    return moveCell(
      ROW_LENGTHS,
      SECTION_STARTS,
      { row, column },
      key,
      toGridEdge
    )
  }

  it("wraps left and right across rows", () => {
    expect(move(0, 7, "ArrowRight")).toEqual({ row: 1, column: 0 })
    expect(move(1, 0, "ArrowLeft")).toEqual({ row: 0, column: 7 })
  })

  it("stops at the grid edges", () => {
    expect(move(4, 1, "ArrowRight")).toEqual({ row: 4, column: 1 })
    expect(move(0, 0, "ArrowLeft")).toEqual({ row: 0, column: 0 })
    expect(move(4, 1, "ArrowDown")).toEqual({ row: 4, column: 1 })
  })

  it("clamps the column on a shorter row", () => {
    expect(move(0, 6, "ArrowDown")).toEqual({ row: 1, column: 2 })
    expect(move(2, 6, "ArrowUp")).toEqual({ row: 1, column: 2 })
  })

  it("moves to the row ends and, with a modifier, the grid ends", () => {
    expect(move(2, 3, "Home")).toEqual({ row: 2, column: 0 })
    expect(move(2, 3, "End")).toEqual({ row: 2, column: 7 })
    expect(move(2, 3, "Home", true)).toEqual({ row: 0, column: 0 })
    expect(move(2, 3, "End", true)).toEqual({ row: 4, column: 1 })
  })

  it("pages between sections", () => {
    expect(move(1, 2, "PageDown")).toEqual({ row: 2, column: 0 })
    expect(move(4, 1, "PageDown")).toEqual({ row: 4, column: 1 })
    expect(move(3, 4, "PageUp")).toEqual({ row: 2, column: 0 })
    expect(move(2, 0, "PageUp")).toEqual({ row: 0, column: 0 })
  })

  it("ignores other keys", () => {
    expect(move(0, 0, "a")).toBeNull()
  })
})

describe("addRecent", () => {
  it("moves a repeat to the front", () => {
    expect(addRecent(["a", "b"], "b")).toEqual(["b", "a"])
  })

  it("keeps two rows of emoji at most", () => {
    const recent = Array.from({ length: 16 }, (_, index) => `item-${index}`)

    const next = addRecent(recent, "new")

    expect(next).toHaveLength(16)
    expect(next[0]).toBe("new")
    expect(next).not.toContain("item-15")
  })
})

describe("preferences", () => {
  beforeEach(() => localStorage.clear())

  it("round-trips through storage", () => {
    writePreferences({ recent: ["cat"], skinTone: 2 })

    expect(readPreferences()).toEqual({ recent: ["cat"], skinTone: 2 })
  })

  it("defaults when storage is empty or corrupt", () => {
    expect(readPreferences().recent).toEqual([])

    localStorage.setItem("drift-ui:emoji-picker", "{not json")
    expect(readPreferences()).toEqual({ recent: [] })

    localStorage.setItem(
      "drift-ui:emoji-picker",
      JSON.stringify({ recent: "cat", skinTone: 9 })
    )
    expect(readPreferences()).toEqual({ recent: [], skinTone: undefined })
  })
})
