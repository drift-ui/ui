import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  addRecent,
  buildSections,
  isValidIconName,
  layoutSections,
  normalizeColumns,
  moveCell,
  normalizeIcons,
  readPreferences,
  searchIcons,
  writePreferences,
  type IconItem,
} from "@/registry/default/lib/icon-picker-utils"

function icon(name: string, tags?: string[]): IconItem {
  return { name, tags }
}

const FOLDER = icon("folder", ["directory", "project"])
const FOLDER_OPEN = icon("folder-open", ["directory", "active"])
const STAR = icon("star", ["favorite", "bookmark"])
const TRASH = icon("trash-2", ["delete", "remove"])
const SEARCH = icon("search", ["find", "zoom"])

const ROW_LENGTHS = [6, 6, 2]
const SECTION_STARTS = [0, 2]

describe("isValidIconName", () => {
  it("recognizes valid Lucide icon names", () => {
    expect(isValidIconName("folder")).toBe(true)
    expect(isValidIconName("folder-open")).toBe(true)
    expect(isValidIconName("activity")).toBe(true)
    expect(isValidIconName("not-a-real-icon-name-xyz")).toBe(false)
  })
})

describe("normalizeIcons", () => {
  it("defaults to full lucide icon library when undefined", () => {
    const icons = normalizeIcons()
    expect(icons.length).toBeGreaterThan(2000)
    expect(icons[0].name).toBeDefined()
  })

  it("normalizes string array to IconItem objects", () => {
    const icons = normalizeIcons(["folder", "star"])
    expect(icons).toEqual([{ name: "folder" }, { name: "star" }])
  })

  it("preserves IconItem objects", () => {
    const input: IconItem[] = [{ name: "folder", tags: ["dir"] }]
    expect(normalizeIcons(input)).toEqual(input)
  })
})

describe("searchIcons", () => {
  it("matches built-in tags for dollar-sign", () => {
    expect(
      searchIcons([{ name: "dollar-sign" }, { name: "star" }], "usd")
    ).toEqual([{ name: "dollar-sign" }])
  })

  it("returns all icons on empty or whitespace query", () => {
    const list = [FOLDER, STAR]
    expect(searchIcons(list, "")).toEqual(list)
    expect(searchIcons(list, "   ")).toEqual(list)
  })

  it("matches substring in icon name", () => {
    const list = [FOLDER, FOLDER_OPEN, STAR]
    expect(searchIcons(list, "fold")).toEqual([FOLDER, FOLDER_OPEN])
    expect(searchIcons(list, "star")).toEqual([STAR])
  })

  it("matches hyphenated word segments", () => {
    const list = [FOLDER, FOLDER_OPEN]
    expect(searchIcons(list, "open")).toEqual([FOLDER_OPEN])
  })

  it("matches item-level tags", () => {
    const list = [FOLDER, STAR]
    expect(searchIcons(list, "project")).toEqual([FOLDER])
    expect(searchIcons(list, "favorite")).toEqual([STAR])
  })

  it("matches caller-provided custom tags", () => {
    const list = [FOLDER, STAR]
    const customTags = { folder: ["repository", "git"] }
    expect(searchIcons(list, "repository", customTags)).toEqual([FOLDER])
  })

  it("matches built-in Lucide tags", () => {
    const list = [SEARCH, TRASH, STAR]
    expect(searchIcons(list, "delete")).toEqual([TRASH])
    expect(searchIcons(list, "magnifying")).toEqual([SEARCH])
  })

  it("is case-insensitive and trims whitespace", () => {
    const list = [FOLDER, STAR]
    expect(searchIcons(list, "  FOLDER  ")).toEqual([FOLDER])
    expect(searchIcons(list, "STAR")).toEqual([STAR])
  })
})

describe("buildSections", () => {
  it("puts recent icons first in recent order", () => {
    const [recentSection, allSection] = buildSections(
      [FOLDER, STAR, TRASH],
      ["trash-2", "folder"]
    )

    expect(recentSection.label).toBe("Recently used")
    expect(recentSection.icons).toEqual([TRASH, FOLDER])
    expect(allSection.label).toBe("All icons")
    expect(allSection.icons).toEqual([FOLDER, STAR, TRASH])
  })

  it("skips the recent section when no recent icons match", () => {
    const sections = buildSections([FOLDER, STAR], ["unknown-icon"])
    expect(sections).toHaveLength(1)
    expect(sections[0].label).toBe("All icons")
  })
})

describe("layoutSections", () => {
  it("chunks icons into rows of given column size", () => {
    const sections = [
      { id: "1", label: "One", icons: [FOLDER, FOLDER_OPEN, STAR] },
    ]
    const { rows, sections: laidOut } = layoutSections(sections, 2)

    expect(rows).toEqual([[FOLDER, FOLDER_OPEN], [STAR]])
    expect(laidOut[0].firstRow).toBe(0)
    expect(laidOut[0].rowCount).toBe(2)
  })

  it("omits empty sections", () => {
    const sections = [
      { id: "empty", label: "Empty", icons: [] },
      { id: "full", label: "Full", icons: [FOLDER] },
    ]
    const { laidOutSections } = {
      laidOutSections: layoutSections(sections, 4).sections,
    }
    expect(laidOutSections).toHaveLength(1)
    expect(laidOutSections[0].id).toBe("full")
  })
})

describe("normalizeColumns", () => {
  it("keeps positive integers and floors fractions", () => {
    expect(normalizeColumns(4, 6)).toBe(4)
    expect(normalizeColumns(3.7, 6)).toBe(3)
  })

  it("falls back for zero, negative and non-finite values", () => {
    expect(normalizeColumns(0, 6)).toBe(6)
    expect(normalizeColumns(-2, 6)).toBe(6)
    expect(normalizeColumns(Number.NaN, 6)).toBe(6)
    expect(normalizeColumns(Number.POSITIVE_INFINITY, 6)).toBe(6)
  })

  it("lets layoutSections terminate when columns is zero", () => {
    const { rows } = layoutSections(
      [{ id: "all", label: "All", icons: [{ name: "a" }, { name: "b" }] }],
      0
    )
    expect(rows).toEqual([[{ name: "a" }], [{ name: "b" }]])
  })
})

describe("moveCell", () => {
  it("moves right within the row", () => {
    expect(
      moveCell(
        ROW_LENGTHS,
        SECTION_STARTS,
        { row: 0, column: 2 },
        "ArrowRight",
        false
      )
    ).toEqual({ row: 0, column: 3 })
  })

  it("wraps to next row when moving right from row end", () => {
    expect(
      moveCell(
        ROW_LENGTHS,
        SECTION_STARTS,
        { row: 0, column: 5 },
        "ArrowRight",
        false
      )
    ).toEqual({ row: 1, column: 0 })
  })

  it("stops at grid end when moving right from last cell", () => {
    expect(
      moveCell(
        ROW_LENGTHS,
        SECTION_STARTS,
        { row: 2, column: 1 },
        "ArrowRight",
        false
      )
    ).toEqual({ row: 2, column: 1 })
  })

  it("moves left within the row", () => {
    expect(
      moveCell(
        ROW_LENGTHS,
        SECTION_STARTS,
        { row: 0, column: 3 },
        "ArrowLeft",
        false
      )
    ).toEqual({ row: 0, column: 2 })
  })

  it("wraps to previous row end when moving left from column 0", () => {
    expect(
      moveCell(
        ROW_LENGTHS,
        SECTION_STARTS,
        { row: 1, column: 0 },
        "ArrowLeft",
        false
      )
    ).toEqual({ row: 0, column: 5 })
  })

  it("moves down to same column clamped to row length", () => {
    expect(
      moveCell(
        ROW_LENGTHS,
        SECTION_STARTS,
        { row: 1, column: 4 },
        "ArrowDown",
        false
      )
    ).toEqual({ row: 2, column: 1 })
  })

  it("moves up to same column", () => {
    expect(
      moveCell(
        ROW_LENGTHS,
        SECTION_STARTS,
        { row: 1, column: 3 },
        "ArrowUp",
        false
      )
    ).toEqual({ row: 0, column: 3 })
  })

  it("jumps to row start/end with Home/End", () => {
    expect(
      moveCell(
        ROW_LENGTHS,
        SECTION_STARTS,
        { row: 1, column: 3 },
        "Home",
        false
      )
    ).toEqual({ row: 1, column: 0 })
    expect(
      moveCell(ROW_LENGTHS, SECTION_STARTS, { row: 1, column: 3 }, "End", false)
    ).toEqual({ row: 1, column: 5 })
  })

  it("jumps to grid start/end with Ctrl+Home / Ctrl+End", () => {
    expect(
      moveCell(ROW_LENGTHS, SECTION_STARTS, { row: 1, column: 3 }, "Home", true)
    ).toEqual({ row: 0, column: 0 })
    expect(
      moveCell(ROW_LENGTHS, SECTION_STARTS, { row: 1, column: 3 }, "End", true)
    ).toEqual({ row: 2, column: 1 })
  })

  it("pages between sections with PageDown and PageUp", () => {
    expect(
      moveCell(
        ROW_LENGTHS,
        SECTION_STARTS,
        { row: 0, column: 2 },
        "PageDown",
        false
      )
    ).toEqual({ row: 2, column: 0 })
    expect(
      moveCell(
        ROW_LENGTHS,
        SECTION_STARTS,
        { row: 2, column: 0 },
        "PageDown",
        false
      )
    ).toEqual({ row: 2, column: 1 })
    expect(
      moveCell(
        ROW_LENGTHS,
        SECTION_STARTS,
        { row: 2, column: 1 },
        "PageUp",
        false
      )
    ).toEqual({ row: 0, column: 0 })
    expect(
      moveCell(
        ROW_LENGTHS,
        SECTION_STARTS,
        { row: 0, column: 0 },
        "PageUp",
        false
      )
    ).toEqual({ row: 0, column: 0 })
  })

  it("returns null on unrecognized key", () => {
    expect(
      moveCell(ROW_LENGTHS, SECTION_STARTS, { row: 0, column: 0 }, "a", false)
    ).toBeNull()
  })
})

describe("addRecent", () => {
  it("prepends the icon and deduplicates", () => {
    expect(addRecent(["folder", "star"], "trash-2")).toEqual([
      "trash-2",
      "folder",
      "star",
    ])
    expect(addRecent(["folder", "star"], "folder")).toEqual(["folder", "star"])
  })

  it("respects maxRecent limit", () => {
    const initial = Array.from({ length: 16 }, (_, i) => `icon-${i}`)
    const result = addRecent(initial, "new-icon", 16)
    expect(result).toHaveLength(16)
    expect(result[0]).toBe("new-icon")
    expect(result).not.toContain("icon-15")
  })
})

describe("preferences in localStorage", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("reads default empty preferences when storage is empty or invalid", () => {
    expect(readPreferences("test-key")).toEqual({ recent: [] })
    localStorage.setItem("test-key", "invalid json")
    expect(readPreferences("test-key")).toEqual({ recent: [] })
  })

  it("reads and writes valid preferences", () => {
    writePreferences({ recent: ["folder", "star"] }, "test-key")
    expect(readPreferences("test-key")).toEqual({ recent: ["folder", "star"] })
  })

  it("handles storage write errors gracefully", () => {
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError")
      })
    expect(() =>
      writePreferences({ recent: ["star"] }, "test-key")
    ).not.toThrow()
    spy.mockRestore()
  })
})
