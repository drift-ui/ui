import { describe, expect, it } from "vitest"

import {
  filterTransferItems,
  getNavigationTarget,
  getTransferAnnouncement,
  moveItems,
  partitionItems,
  selectRange,
  type TransferItem,
} from "@/registry/default/lib/transfer-list-utils"

const SAMPLE_ITEMS: TransferItem[] = [
  { id: "1", label: "Admin", description: "Full access" },
  { id: "2", label: "Editor", description: "Edit content" },
  { id: "3", label: "Viewer", description: "Read only access" },
  { id: "4", label: "Billing", description: "Manage invoices", disabled: true },
]

describe("transfer-list lib", () => {
  describe("partitionItems", () => {
    it("partitions items into source and target arrays based on selectedIds", () => {
      const { sourceItems, targetItems } = partitionItems(SAMPLE_ITEMS, [
        "2",
        "3",
      ])
      expect(sourceItems.map((i) => i.id)).toEqual(["1", "4"])
      expect(targetItems.map((i) => i.id)).toEqual(["2", "3"])
    })

    it("puts all items in source if selectedIds is empty", () => {
      const { sourceItems, targetItems } = partitionItems(SAMPLE_ITEMS, [])
      expect(sourceItems).toHaveLength(4)
      expect(targetItems).toHaveLength(0)
    })
  })

  describe("filterTransferItems", () => {
    it("filters items by label case-insensitively", () => {
      const filtered = filterTransferItems(SAMPLE_ITEMS, "edit")
      expect(filtered.map((i) => i.id)).toEqual(["2"])
    })

    it("filters items by description case-insensitively", () => {
      const filtered = filterTransferItems(SAMPLE_ITEMS, "access")
      expect(filtered.map((i) => i.id)).toEqual(["1", "3"])
    })

    it("returns all items when query is empty or whitespace", () => {
      expect(filterTransferItems(SAMPLE_ITEMS, "   ")).toHaveLength(4)
    })
  })

  describe("moveItems", () => {
    it("moves items to target (adds to selectedIds)", () => {
      const result = moveItems(["1"], ["2", "3"], "toTarget")
      expect(result).toEqual(["1", "2", "3"])
    })

    it("does not duplicate IDs when moving to target", () => {
      const result = moveItems(["1", "2"], ["2", "3"], "toTarget")
      expect(result).toEqual(["1", "2", "3"])
    })

    it("moves items to source (removes from selectedIds)", () => {
      const result = moveItems(["1", "2", "3"], ["2"], "toSource")
      expect(result).toEqual(["1", "3"])
    })

    it("keeps selected ids that are not in the moved set", () => {
      const result = moveItems(["1", "not-loaded"], ["1"], "toSource")
      expect(result).toEqual(["not-loaded"])
    })
  })

  describe("selectRange", () => {
    const ids = ["1", "2", "3", "4", "5"]

    it("selects all items between fromId and toId inclusive", () => {
      const result = selectRange(ids, "2", "4", ["1"])
      expect(result.sort()).toEqual(["1", "2", "3", "4"].sort())
    })

    it("works in reverse direction", () => {
      const result = selectRange(ids, "4", "2", [])
      expect(result.sort()).toEqual(["2", "3", "4"].sort())
    })

    it("selects only the target when the anchor is no longer listed", () => {
      expect(selectRange(ids, "gone", "3", ["1"])).toEqual(["1", "3"])
    })
  })

  describe("getNavigationTarget", () => {
    const ids = ["1", "2", "3"]

    it("steps with arrow keys and stops at both ends", () => {
      expect(getNavigationTarget(ids, "2", "ArrowDown")).toBe("3")
      expect(getNavigationTarget(ids, "3", "ArrowDown")).toBe("3")
      expect(getNavigationTarget(ids, "2", "ArrowUp")).toBe("1")
      expect(getNavigationTarget(ids, "1", "ArrowUp")).toBe("1")
    })

    it("jumps with Home and End", () => {
      expect(getNavigationTarget(ids, "2", "Home")).toBe("1")
      expect(getNavigationTarget(ids, "2", "End")).toBe("3")
    })

    it("ignores other keys", () => {
      expect(getNavigationTarget(ids, "2", "a")).toBeUndefined()
    })
  })

  describe("getTransferAnnouncement", () => {
    it("names a single item and counts several", () => {
      expect(getTransferAnnouncement(["Admin"], "Assigned")).toBe(
        "Moved Admin to Assigned."
      )
      expect(getTransferAnnouncement(["Admin", "Editor"], "Available")).toBe(
        "Moved 2 items to Available."
      )
    })
  })
})
