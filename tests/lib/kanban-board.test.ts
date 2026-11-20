import { describe, expect, it } from "vitest"

import {
  findCardLocation,
  getCancelAnnouncement,
  getDefaultCardId,
  getDefaultCardLabel,
  getDropAnnouncement,
  getKeyboardMoveTarget,
  getMoveAnnouncement,
  getPickupAnnouncement,
  moveCard,
  reorderCardInColumn,
  type KanbanColumn,
} from "@/registry/default/lib/kanban-board-utils"

describe("kanban-board-utils", () => {
  describe("getDefaultCardId", () => {
    it("uses strings and numbers as their own id", () => {
      expect(getDefaultCardId("task-1", 0)).toBe("task-1")
      expect(getDefaultCardId(42, 1)).toBe("42")
    })

    it("reads an id property from an object", () => {
      expect(getDefaultCardId({ id: "custom-id" }, 0)).toBe("custom-id")
      expect(getDefaultCardId({ id: 99 }, 0)).toBe("99")
    })

    it("falls back to the stringified index when id is missing or non-primitive", () => {
      expect(getDefaultCardId({ title: "No ID" }, 3)).toBe("3")
      expect(getDefaultCardId({ id: {} }, 5)).toBe("5")
      expect(getDefaultCardId(null, 2)).toBe("2")
      expect(getDefaultCardId(undefined, 4)).toBe("4")
    })
  })

  describe("getDefaultCardLabel", () => {
    it("returns string cards directly", () => {
      expect(getDefaultCardLabel("Design review", 0)).toBe("Design review")
    })

    it("reads title, label, name, or id from an object", () => {
      expect(getDefaultCardLabel({ title: "Fix bug" }, 0)).toBe("Fix bug")
      expect(getDefaultCardLabel({ label: "Write docs" }, 0)).toBe("Write docs")
      expect(getDefaultCardLabel({ name: "Deploy v1" }, 0)).toBe("Deploy v1")
      expect(getDefaultCardLabel({ id: "T-101" }, 0)).toBe("T-101")
      expect(getDefaultCardLabel({ id: 102 }, 0)).toBe("102")
    })

    it("falls back to Card {index + 1}", () => {
      expect(getDefaultCardLabel({}, 0)).toBe("Card 1")
      expect(getDefaultCardLabel({ other: 123 }, 2)).toBe("Card 3")
      expect(getDefaultCardLabel(null, 1)).toBe("Card 2")
      expect(getDefaultCardLabel(undefined, 3)).toBe("Card 4")
    })
  })

  describe("findCardLocation", () => {
    const board = {
      todo: [
        { id: "c1", title: "Task 1" },
        { id: "c2", title: "Task 2" },
      ],
      done: [{ id: "c3", title: "Task 3" }],
      empty: [],
    }

    it("finds existing card location and card reference", () => {
      const loc = findCardLocation(board, "c2")
      expect(loc).toEqual({
        columnId: "todo",
        index: 1,
        card: { id: "c2", title: "Task 2" },
      })
    })

    it("finds cards in different columns", () => {
      const loc = findCardLocation(board, "c3")
      expect(loc).toEqual({
        columnId: "done",
        index: 0,
        card: { id: "c3", title: "Task 3" },
      })
    })

    it("returns null if card is not found", () => {
      expect(findCardLocation(board, "non-existent")).toBeNull()
    })

    it("handles non-array board columns gracefully", () => {
      const malformedBoard = {
        todo: undefined,
        doing: null as unknown as string[],
      }
      expect(findCardLocation(malformedBoard, "c1")).toBeNull()
    })

    it("supports custom getCardId", () => {
      const customBoard = {
        col1: [{ key: "k1" }, { key: "k2" }],
      }
      const loc = findCardLocation(
        customBoard,
        "k2",
        (c: { key: string }) => c.key
      )
      expect(loc).toEqual({
        columnId: "col1",
        index: 1,
        card: { key: "k2" },
      })
    })
  })

  describe("reorderCardInColumn", () => {
    const list = ["a", "b", "c", "d"]

    it("moves an item down in the list", () => {
      expect(reorderCardInColumn(list, 0, 2)).toEqual(["b", "c", "a", "d"])
    })

    it("moves an item up in the list", () => {
      expect(reorderCardInColumn(list, 3, 1)).toEqual(["a", "d", "b", "c"])
    })

    it("returns unchanged copy when fromIndex equals toIndex", () => {
      const res = reorderCardInColumn(list, 2, 2)
      expect(res).toEqual(list)
      expect(res).not.toBe(list)
    })

    it("returns unchanged copy when indices are out of bounds", () => {
      expect(reorderCardInColumn(list, -1, 1)).toEqual(list)
      expect(reorderCardInColumn(list, 0, 10)).toEqual(list)
      expect(reorderCardInColumn(list, 4, 1)).toEqual(list)
      expect(reorderCardInColumn(list, 1, -1)).toEqual(list)
    })
  })

  describe("moveCard", () => {
    const board = {
      todo: [{ id: "c1" }, { id: "c2" }, { id: "c3" }],
      in_progress: [{ id: "c4" }],
      done: [],
    }

    it("reorders within the same column", () => {
      const res = moveCard(board, "c1", "todo", 2)
      expect(res.movedCard).toEqual({ id: "c1" })
      expect(res.fromColumnId).toBe("todo")
      expect(res.fromIndex).toBe(0)
      expect(res.toColumnId).toBe("todo")
      expect(res.toIndex).toBe(2)
      expect(res.nextBoard.todo).toEqual([
        { id: "c2" },
        { id: "c3" },
        { id: "c1" },
      ])
      expect(res.nextBoard.in_progress).toEqual([{ id: "c4" }])
    })

    it("clamps same-column toIndex when exceeding bounds", () => {
      const res = moveCard(board, "c1", "todo", 99)
      expect(res.toIndex).toBe(2)
      expect(res.nextBoard.todo).toEqual([
        { id: "c2" },
        { id: "c3" },
        { id: "c1" },
      ])
    })

    it("moves card across columns to an existing column with items", () => {
      const res = moveCard(board, "c2", "in_progress", 0)
      expect(res.movedCard).toEqual({ id: "c2" })
      expect(res.fromColumnId).toBe("todo")
      expect(res.fromIndex).toBe(1)
      expect(res.toColumnId).toBe("in_progress")
      expect(res.toIndex).toBe(0)
      expect(res.nextBoard.todo).toEqual([{ id: "c1" }, { id: "c3" }])
      expect(res.nextBoard.in_progress).toEqual([{ id: "c2" }, { id: "c4" }])
    })

    it("moves card across columns to an empty column", () => {
      const res = moveCard(board, "c1", "done", 0)
      expect(res.movedCard).toEqual({ id: "c1" })
      expect(res.fromColumnId).toBe("todo")
      expect(res.toColumnId).toBe("done")
      expect(res.toIndex).toBe(0)
      expect(res.nextBoard.todo).toEqual([{ id: "c2" }, { id: "c3" }])
      expect(res.nextBoard.done).toEqual([{ id: "c1" }])
    })

    it("clamps cross-column target index when out of range", () => {
      const res = moveCard(board, "c1", "in_progress", 10)
      expect(res.toIndex).toBe(1) // in_progress has 1 card, so append at index 1
      expect(res.nextBoard.in_progress).toEqual([{ id: "c4" }, { id: "c1" }])
    })

    it("creates column array if destination column was not in board", () => {
      const res = moveCard(board, "c1", "backlog", 0)
      expect(res.toColumnId).toBe("backlog")
      expect(res.toIndex).toBe(0)
      expect(res.nextBoard.backlog).toEqual([{ id: "c1" }])
    })

    it("returns safe copy without changes if card is not found", () => {
      const res = moveCard(board, "unknown", "todo", 0)
      expect(res.movedCard).toBeNull()
      expect(res.fromColumnId).toBeNull()
      expect(res.fromIndex).toBeNull()
      expect(res.toColumnId).toBe("todo")
      expect(res.toIndex).toBe(0)
      expect(res.nextBoard.todo).toEqual([
        { id: "c1" },
        { id: "c2" },
        { id: "c3" },
      ])
    })
  })

  describe("ARIA announcements", () => {
    it("formats pickup announcement correctly", () => {
      expect(getPickupAnnouncement("Task A", "To Do", 0, 3)).toBe(
        "Picked up Task A, position 1 of 3 in To Do. Use arrow keys to move, Space to drop, Escape to cancel."
      )
    })

    it("formats move announcement correctly", () => {
      expect(getMoveAnnouncement("Task A", "In Progress", 1, 4)).toBe(
        "Moved Task A to position 2 of 4 in In Progress."
      )
    })

    it("formats drop announcement correctly", () => {
      expect(getDropAnnouncement("Task A", "Done", 2, 3)).toBe(
        "Dropped Task A, final position 3 of 3 in Done."
      )
    })

    it("formats cancel announcement correctly", () => {
      expect(getCancelAnnouncement("Task A", "To Do", 1, 5)).toBe(
        "Move cancelled. Task A returned to position 2 of 5 in To Do."
      )
    })
  })

  describe("getKeyboardMoveTarget", () => {
    const columns: KanbanColumn[] = [
      { id: "col-1", title: "Column 1" },
      { id: "col-2", title: "Column 2" },
      { id: "col-3", title: "Column 3" },
    ]

    const board = {
      "col-1": ["c1", "c2", "c3"],
      "col-2": ["c4"],
      "col-3": [],
    }

    it("moves up within column", () => {
      expect(
        getKeyboardMoveTarget("ArrowUp", "col-1", 2, columns, board)
      ).toEqual({
        targetColumnId: "col-1",
        targetIndex: 1,
      })
    })

    it("returns null when moving up at top boundary", () => {
      expect(
        getKeyboardMoveTarget("ArrowUp", "col-1", 0, columns, board)
      ).toBeNull()
    })

    it("moves down within column", () => {
      expect(
        getKeyboardMoveTarget("ArrowDown", "col-1", 0, columns, board)
      ).toEqual({
        targetColumnId: "col-1",
        targetIndex: 1,
      })
    })

    it("returns null when moving down at bottom boundary", () => {
      expect(
        getKeyboardMoveTarget("ArrowDown", "col-1", 2, columns, board)
      ).toBeNull()
    })

    it("moves left across columns and clamps index to column length", () => {
      // col-2 to col-1: index 0 -> index 0 (col-1 has 3 items)
      expect(
        getKeyboardMoveTarget("ArrowLeft", "col-2", 0, columns, board)
      ).toEqual({
        targetColumnId: "col-1",
        targetIndex: 0,
      })
    })

    it("returns null when moving left from the first column", () => {
      expect(
        getKeyboardMoveTarget("ArrowLeft", "col-1", 1, columns, board)
      ).toBeNull()
    })

    it("moves right across columns and clamps index if destination has fewer cards", () => {
      // col-1 index 2 to col-2 (which has 1 card): clamped to index 1 (end of col-2)
      expect(
        getKeyboardMoveTarget("ArrowRight", "col-1", 2, columns, board)
      ).toEqual({
        targetColumnId: "col-2",
        targetIndex: 1,
      })
      // col-2 index 0 to col-3 (which is empty): clamped to index 0
      expect(
        getKeyboardMoveTarget("ArrowRight", "col-2", 0, columns, board)
      ).toEqual({
        targetColumnId: "col-3",
        targetIndex: 0,
      })
    })

    it("returns null when moving right from the last column", () => {
      expect(
        getKeyboardMoveTarget("ArrowRight", "col-3", 0, columns, board)
      ).toBeNull()
    })

    it("returns null for unrecognized keys", () => {
      expect(
        getKeyboardMoveTarget("Enter", "col-1", 1, columns, board)
      ).toBeNull()
      expect(
        getKeyboardMoveTarget("Tab", "col-1", 1, columns, board)
      ).toBeNull()
      expect(
        getKeyboardMoveTarget("Escape", "col-1", 1, columns, board)
      ).toBeNull()
    })

    it("returns null if current column is not found in columns array", () => {
      expect(
        getKeyboardMoveTarget("ArrowUp", "non-existent", 0, columns, board)
      ).toBeNull()
    })
  })
})
