import { describe, expect, it } from "vitest"

import {
  nextRowIndex,
  rowAt,
  rowOffsets,
  scrollTopToReveal,
  visibleRange,
} from "@/registry/default/lib/virtual-list-utils"

const OFFSETS = rowOffsets(4, (index) => [10, 30, 20, 40][index])

describe("rowOffsets", () => {
  it("accumulates variable sizes and keeps the total last", () => {
    expect(OFFSETS).toEqual([0, 10, 40, 60, 100])
  })

  it("returns a single zero for an empty list", () => {
    expect(rowOffsets(0, () => 10)).toEqual([0])
  })
})

describe("rowAt", () => {
  it.each([
    [0, 0],
    [9, 0],
    [10, 1],
    [59, 2],
    [60, 3],
  ])("finds the row at position %i", (position, index) => {
    expect(rowAt(OFFSETS, position)).toBe(index)
  })

  it("clamps positions past either end", () => {
    expect(rowAt(OFFSETS, -5)).toBe(0)
    expect(rowAt(OFFSETS, 500)).toBe(3)
  })

  it("stays at zero for an empty list", () => {
    expect(rowAt([0], 100)).toBe(0)
  })
})

describe("visibleRange", () => {
  it("spans the rows crossing the viewport", () => {
    expect(visibleRange(OFFSETS, 15, 30)).toEqual({ first: 1, last: 2 })
  })
})

describe("scrollTopToReveal", () => {
  it("scrolls up to a row above the viewport", () => {
    expect(scrollTopToReveal(OFFSETS, 1, 30, 20)).toBe(10)
  })

  it("scrolls down just far enough for a row below the viewport", () => {
    expect(scrollTopToReveal(OFFSETS, 3, 0, 50)).toBe(50)
  })

  it("keeps the position when the row is already visible", () => {
    expect(scrollTopToReveal(OFFSETS, 1, 5, 50)).toBe(5)
  })
})

describe("nextRowIndex", () => {
  it("moves one row and stops at the ends", () => {
    expect(nextRowIndex(OFFSETS, 1, "ArrowDown", 50)).toBe(2)
    expect(nextRowIndex(OFFSETS, 3, "ArrowDown", 50)).toBe(3)
    expect(nextRowIndex(OFFSETS, 1, "ArrowUp", 50)).toBe(0)
    expect(nextRowIndex(OFFSETS, 0, "ArrowUp", 50)).toBe(0)
  })

  it("pages by the viewport height", () => {
    expect(nextRowIndex(OFFSETS, 0, "PageDown", 50)).toBe(2)
    expect(nextRowIndex(OFFSETS, 3, "PageUp", 50)).toBe(1)
  })

  it("always advances a page when a row is taller than the viewport", () => {
    expect(nextRowIndex(OFFSETS, 0, "PageDown", 5)).toBe(1)
    expect(nextRowIndex(OFFSETS, 3, "PageUp", 5)).toBe(2)
  })

  it("jumps to either end", () => {
    expect(nextRowIndex(OFFSETS, 2, "Home", 50)).toBe(0)
    expect(nextRowIndex(OFFSETS, 1, "End", 50)).toBe(3)
  })

  it("ignores other keys", () => {
    expect(nextRowIndex(OFFSETS, 1, "a", 50)).toBeNull()
  })
})
