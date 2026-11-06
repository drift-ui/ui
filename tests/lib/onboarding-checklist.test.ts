import { describe, expect, it } from "vitest"

import {
  calculateProgress,
  getCompletedCount,
  isItemCompleted,
  toggleItem,
} from "@/registry/default/lib/onboarding-checklist"

describe("calculateProgress", () => {
  it("computes percentage and ratio text accurately", () => {
    expect(calculateProgress(5, 2)).toEqual({
      total: 5,
      completedCount: 2,
      percentage: 40,
      isComplete: false,
      ratioText: "2 of 5 done",
    })
  })

  it("handles empty items list", () => {
    expect(calculateProgress(0, 0)).toEqual({
      total: 0,
      completedCount: 0,
      percentage: 0,
      isComplete: false,
      ratioText: "0 of 0 done",
    })
  })

  it("identifies 100% completion", () => {
    expect(calculateProgress(4, 4)).toEqual({
      total: 4,
      completedCount: 4,
      percentage: 100,
      isComplete: true,
      ratioText: "4 of 4 done",
    })
  })

  it("clamps negative values and completed exceeding total", () => {
    expect(calculateProgress(-5, -2)).toEqual({
      total: 0,
      completedCount: 0,
      percentage: 0,
      isComplete: false,
      ratioText: "0 of 0 done",
    })
    expect(calculateProgress(5, -2)).toEqual({
      total: 5,
      completedCount: 0,
      percentage: 0,
      isComplete: false,
      ratioText: "0 of 5 done",
    })
    expect(calculateProgress(5, 10)).toEqual({
      total: 5,
      completedCount: 5,
      percentage: 100,
      isComplete: true,
      ratioText: "5 of 5 done",
    })
  })
})

describe("toggleItem", () => {
  it("adds an item if not present", () => {
    const initial = ["task-1"]
    const next = toggleItem(initial, "task-2")
    expect(next).toEqual(["task-1", "task-2"])
    expect(initial).toEqual(["task-1"]) // immutability check
  })

  it("removes an item if already present", () => {
    const initial = ["task-1", "task-2"]
    const next = toggleItem(initial, "task-1")
    expect(next).toEqual(["task-2"])
    expect(initial).toEqual(["task-1", "task-2"]) // immutability check
  })
})

describe("isItemCompleted", () => {
  it("returns true when item is in the completed array", () => {
    expect(isItemCompleted(["task-1", "task-2"], "task-1")).toBe(true)
    expect(isItemCompleted(["task-1", "task-2"], "task-3")).toBe(false)
  })
})

describe("getCompletedCount", () => {
  it("counts valid completed items that exist in the checklist items list", () => {
    const items = [{ id: "task-1" }, { id: "task-2" }, { id: "task-3" }]
    expect(getCompletedCount(items, ["task-1", "task-3", "unknown-task"])).toBe(
      2
    )
  })

  it("deduplicates completed ids", () => {
    const items = [{ id: "task-1" }, { id: "task-2" }]
    expect(getCompletedCount(items, ["task-1", "task-1"])).toBe(1)
  })

  it("returns 0 if none are completed", () => {
    const items = [{ id: "task-1" }, { id: "task-2" }]
    expect(getCompletedCount(items, [])).toBe(0)
  })
})
