import { describe, expect, it } from "vitest"

import {
  applyOrder,
  getCancelAnnouncement,
  getDefaultItemKey,
  getDefaultItemLabel,
  getDropAnnouncement,
  getMoveAnnouncement,
  getPickupAnnouncement,
  getTargetIndex,
  reorderItem,
} from "@/registry/default/lib/sortable-list-utils"

describe("sortable-list lib", () => {
  describe("getDefaultItemKey", () => {
    it("uses strings and numbers as their own key", () => {
      expect(getDefaultItemKey("a", 3)).toBe("a")
      expect(getDefaultItemKey(7, 3)).toBe(7)
    })

    it("keeps the type of an id", () => {
      expect(getDefaultItemKey({ id: 7 }, 3)).toBe(7)
      expect(getDefaultItemKey({ id: "x" }, 3)).toBe("x")
    })

    it("falls back to the index", () => {
      expect(getDefaultItemKey({ title: "a" }, 3)).toBe(3)
    })
  })

  describe("getDefaultItemLabel", () => {
    it("reads a string, label, title or name", () => {
      expect(getDefaultItemLabel("a", 0)).toBe("a")
      expect(getDefaultItemLabel({ label: "b" }, 0)).toBe("b")
      expect(getDefaultItemLabel({ title: "c" }, 0)).toBe("c")
      expect(getDefaultItemLabel({ name: "d" }, 0)).toBe("d")
    })

    it("falls back to the position", () => {
      expect(getDefaultItemLabel({}, 1)).toBe("Item 2")
    })
  })

  describe("applyOrder", () => {
    const getKey = (item: string) => item

    it("sorts items by the given keys", () => {
      expect(applyOrder(["a", "b", "c"], ["c", "a", "b"], getKey)).toEqual([
        "c",
        "a",
        "b",
      ])
    })

    it("keeps items that are missing from the order at the end", () => {
      expect(applyOrder(["a", "b", "new"], ["b", "a"], getKey)).toEqual([
        "b",
        "a",
        "new",
      ])
    })

    it("skips keys whose items are gone", () => {
      expect(applyOrder(["a", "c"], ["c", "b", "a"], getKey)).toEqual([
        "c",
        "a",
      ])
    })
  })

  describe("reorderItem", () => {
    const list = ["a", "b", "c", "d"]

    it("moves an item forward in the array", () => {
      expect(reorderItem(list, 0, 2)).toEqual(["b", "c", "a", "d"])
    })

    it("moves an item backward in the array", () => {
      expect(reorderItem(list, 3, 1)).toEqual(["a", "d", "b", "c"])
    })

    it("returns unchanged array when fromIndex equals toIndex", () => {
      expect(reorderItem(list, 1, 1)).toEqual(list)
    })

    it("ignores out-of-bounds indices", () => {
      expect(reorderItem(list, -1, 2)).toEqual(list)
      expect(reorderItem(list, 0, 10)).toEqual(list)
      expect(reorderItem(list, 5, 1)).toEqual(list)
    })
  })

  describe("announcements", () => {
    it("generates correct pickup announcement", () => {
      expect(getPickupAnnouncement("Task 1", 0, 4)).toBe(
        "Picked up Task 1, position 1 of 4. Use arrow keys to move, Space to drop, Escape to cancel."
      )
    })

    it("generates correct move announcement", () => {
      expect(getMoveAnnouncement("Task 1", 2, 4)).toBe(
        "Moved Task 1 to position 3 of 4."
      )
    })

    it("generates correct drop announcement", () => {
      expect(getDropAnnouncement("Task 1", 2, 4)).toBe(
        "Dropped Task 1, final position 3 of 4."
      )
    })

    it("generates correct cancel announcement", () => {
      expect(getCancelAnnouncement("Task 1", 0, 4)).toBe(
        "Reorder cancelled. Task 1 returned to position 1 of 4."
      )
    })
  })

  describe("getTargetIndex", () => {
    it("handles vertical navigation keys", () => {
      expect(getTargetIndex("ArrowUp", 2, 4, "vertical")).toBe(1)
      expect(getTargetIndex("ArrowDown", 2, 4, "vertical")).toBe(3)
      expect(getTargetIndex("ArrowUp", 0, 4, "vertical")).toBe(0)
      expect(getTargetIndex("ArrowDown", 3, 4, "vertical")).toBe(3)
    })

    it("handles horizontal navigation keys", () => {
      expect(getTargetIndex("ArrowLeft", 2, 4, "horizontal")).toBe(1)
      expect(getTargetIndex("ArrowRight", 2, 4, "horizontal")).toBe(3)
    })

    it("handles Home and End keys", () => {
      expect(getTargetIndex("Home", 2, 4)).toBe(0)
      expect(getTargetIndex("End", 1, 4)).toBe(3)
    })

    it("returns null for unrelated keys", () => {
      expect(getTargetIndex("Enter", 1, 4)).toBeNull()
      expect(getTargetIndex("Tab", 1, 4)).toBeNull()
    })
  })
})
