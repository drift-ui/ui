import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  KanbanBoard,
  type KanbanColumn,
} from "@/registry/default/ui/kanban-board"

interface Task {
  id: string
  title: string
}

const COLUMNS: KanbanColumn[] = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "done", title: "Done" },
]

const INITIAL_BOARD: Record<string, Task[]> = {
  todo: [
    { id: "t1", title: "Task 1" },
    { id: "t2", title: "Task 2" },
  ],
  in_progress: [{ id: "t3", title: "Task 3" }],
  done: [],
}

describe("KanbanBoard", () => {
  it("renders columns, headers, badges, and cards with accessibility roles", () => {
    render(<KanbanBoard columns={COLUMNS} defaultValue={INITIAL_BOARD} />)

    expect(screen.getByRole("list", { name: "To Do" })).toBeInTheDocument()
    expect(
      screen.getByRole("list", { name: "In Progress" })
    ).toBeInTheDocument()
    expect(screen.getByRole("list", { name: "Done" })).toBeInTheDocument()

    const cards = screen.getAllByRole("button", {
      description: /Press Space to pick up/i,
    })
    expect(cards).toHaveLength(3)
    expect(cards[0]).toHaveAttribute("aria-roledescription", "kanban card")
    expect(cards[0]).toHaveAttribute("aria-grabbed", "false")
    expect(cards[0]).toHaveTextContent("Task 1")

    // Empty column indicator
    expect(screen.getByText("No cards")).toBeInTheDocument()
  })

  it("picks up and drops card within same column using keyboard", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const onMove = vi.fn()

    render(
      <KanbanBoard
        columns={COLUMNS}
        defaultValue={INITIAL_BOARD}
        onValueChange={onValueChange}
        onMove={onMove}
      />
    )

    const cards = screen.getAllByRole("button")
    cards[0].focus()

    // Space picks up Task 1
    await user.keyboard(" ")
    expect(cards[0]).toHaveAttribute("aria-grabbed", "true")

    // Assertive live region announcement
    const status = screen.getByRole("status")
    expect(status).toHaveTextContent(
      "Picked up Task 1, position 1 of 2 in To Do. Use arrow keys to move, Space to drop, Escape to cancel."
    )

    // ArrowDown moves Task 1 below Task 2
    await user.keyboard("{ArrowDown}")
    expect(status).toHaveTextContent(
      "Moved Task 1 to position 2 of 2 in To Do."
    )

    // Space drops Task 1
    await user.keyboard(" ")
    expect(cards[0]).toHaveAttribute("aria-grabbed", "false")
    expect(status).toHaveTextContent(
      "Dropped Task 1, final position 2 of 2 in To Do."
    )

    expect(onValueChange).toHaveBeenCalledOnce()
    expect(onMove).toHaveBeenCalledWith(
      { id: "t1", title: "Task 1" },
      "todo",
      "todo",
      1
    )
  })

  it("moves card across columns using ArrowRight and drops with Enter", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const onMove = vi.fn()

    render(
      <KanbanBoard
        columns={COLUMNS}
        defaultValue={INITIAL_BOARD}
        onValueChange={onValueChange}
        onMove={onMove}
      />
    )

    const cards = screen.getAllByRole("button")
    cards[0].focus() // Task 1

    // Space picks up
    await user.keyboard(" ")
    // Move across to In Progress column
    await user.keyboard("{ArrowRight}")

    const status = screen.getByRole("status")
    expect(status).toHaveTextContent(
      "Moved Task 1 to position 1 of 2 in In Progress."
    )

    // Enter drops the card
    await user.keyboard("{Enter}")
    expect(status).toHaveTextContent(
      "Dropped Task 1, final position 1 of 2 in In Progress."
    )

    expect(onValueChange).toHaveBeenCalledOnce()
    expect(onMove).toHaveBeenCalledWith(
      { id: "t1", title: "Task 1" },
      "todo",
      "in_progress",
      0
    )
  })

  it("cancels reorder when Escape is pressed and restores original state", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const onMove = vi.fn()

    render(
      <KanbanBoard
        columns={COLUMNS}
        defaultValue={INITIAL_BOARD}
        onValueChange={onValueChange}
        onMove={onMove}
      />
    )

    const getTask1 = () =>
      screen.getByText("Task 1").closest<HTMLElement>('[role="button"]')!
    getTask1().focus()

    // Pick up and move
    await user.keyboard(" ")
    await user.keyboard("{ArrowRight}")
    expect(getTask1()).toHaveAttribute("aria-grabbed", "true")

    // Escape cancels
    await user.keyboard("{Escape}")
    expect(getTask1()).toHaveAttribute("aria-grabbed", "false")

    const status = screen.getByRole("status")
    expect(status).toHaveTextContent(
      "Move cancelled. Task 1 returned to position 1 of 2 in To Do."
    )

    expect(onMove).not.toHaveBeenCalled()
    // Restores original tasks in To Do column
    const todoList = screen.getByRole("list", { name: "To Do" })
    expect(todoList).toHaveTextContent("Task 1")
    expect(todoList).toHaveTextContent("Task 2")
  })

  it("does not call onMove when an item is picked up and dropped in place", async () => {
    const user = userEvent.setup()
    const onMove = vi.fn()

    render(
      <KanbanBoard
        columns={COLUMNS}
        defaultValue={INITIAL_BOARD}
        onMove={onMove}
      />
    )

    const cards = screen.getAllByRole("button")
    cards[0].focus()

    // Pick up then immediately drop
    await user.keyboard(" ")
    await user.keyboard(" ")

    expect(onMove).not.toHaveBeenCalled()
  })

  it("supports roving focus when cards are not grabbed", async () => {
    const user = userEvent.setup()

    render(<KanbanBoard columns={COLUMNS} defaultValue={INITIAL_BOARD} />)

    const cards = screen.getAllByRole("button")
    cards[0].focus()
    expect(cards[0]).toHaveFocus()

    // ArrowDown navigates to Task 2
    await user.keyboard("{ArrowDown}")
    expect(cards[1]).toHaveFocus()

    // ArrowUp navigates back to Task 1
    await user.keyboard("{ArrowUp}")
    expect(cards[0]).toHaveFocus()

    // ArrowRight navigates to In Progress column (Task 3)
    await user.keyboard("{ArrowRight}")
    expect(cards[2]).toHaveFocus()

    // ArrowLeft navigates back to To Do column
    await user.keyboard("{ArrowLeft}")
    expect(cards[0]).toHaveFocus()
  })

  it("supports HTML5 pointer drag and drop between columns", () => {
    const onMove = vi.fn()
    const onValueChange = vi.fn()

    render(
      <KanbanBoard
        columns={COLUMNS}
        defaultValue={INITIAL_BOARD}
        onMove={onMove}
        onValueChange={onValueChange}
      />
    )

    const cards = screen.getAllByRole("button")
    const task1 = cards[0]
    const doneSection = screen
      .getByRole("list", { name: "Done" })
      .closest("section")!

    const dataTransfer = {
      data: {} as Record<string, string>,
      setData: vi.fn((format: string, val: string) => {
        dataTransfer.data[format] = val
      }),
      getData: vi.fn((format: string) => dataTransfer.data[format] ?? ""),
      effectAllowed: "move",
      dropEffect: "none",
    }

    // Drag start on Task 1
    fireEvent.dragStart(task1, { dataTransfer })
    expect(dataTransfer.setData).toHaveBeenCalledWith("text/plain", "t1")

    // Drag over Done section
    fireEvent.dragOver(doneSection, { dataTransfer })

    // Drop onto Done section
    fireEvent.drop(doneSection, { dataTransfer })

    expect(onMove).toHaveBeenCalledWith(
      { id: "t1", title: "Task 1" },
      "todo",
      "done",
      0
    )
    expect(onValueChange).toHaveBeenCalledOnce()
  })

  it("respects disabled prop", async () => {
    const user = userEvent.setup()
    const onMove = vi.fn()

    render(
      <KanbanBoard
        columns={COLUMNS}
        defaultValue={INITIAL_BOARD}
        onMove={onMove}
        disabled
      />
    )

    const cards = screen.getAllByRole("button")
    expect(cards[0]).toHaveAttribute("tabindex", "-1")
    expect(cards[0]).not.toHaveAttribute("draggable", "true")

    // Keydown should be ignored
    cards[0].focus()
    await user.keyboard(" ")
    expect(cards[0]).toHaveAttribute("aria-grabbed", "false")
    expect(onMove).not.toHaveBeenCalled()
  })

  it("supports custom renderCard, renderColumnHeader, and renderEmptyColumn", () => {
    render(
      <KanbanBoard
        columns={COLUMNS}
        defaultValue={INITIAL_BOARD}
        renderColumnHeader={(col, cards) => (
          <div data-testid={`custom-header-${col.id}`}>
            {col.title.toUpperCase()} ({cards.length})
          </div>
        )}
        renderCard={(card, { isGrabbed }) => (
          <div data-testid={`custom-card-${card.id}`}>
            {card.title} {isGrabbed ? "[HELD]" : ""}
          </div>
        )}
        renderEmptyColumn={(col) => (
          <div data-testid={`custom-empty-${col.id}`}>
            Empty lane for {col.title}
          </div>
        )}
      />
    )

    expect(screen.getByTestId("custom-header-todo")).toHaveTextContent(
      "TO DO (2)"
    )
    expect(screen.getByTestId("custom-card-t1")).toHaveTextContent("Task 1")
    expect(screen.getByTestId("custom-empty-done")).toHaveTextContent(
      "Empty lane for Done"
    )
  })

  it("operates in controlled mode with value and onValueChange", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(
      <KanbanBoard
        columns={COLUMNS}
        value={INITIAL_BOARD}
        onValueChange={onValueChange}
      />
    )

    const cards = screen.getAllByRole("button")
    cards[0].focus()

    await user.keyboard(" ")
    await user.keyboard("{ArrowDown}")
    await user.keyboard(" ")

    expect(onValueChange).toHaveBeenCalledOnce()
    expect(onValueChange).toHaveBeenCalledWith({
      todo: [
        { id: "t2", title: "Task 2" },
        { id: "t1", title: "Task 1" },
      ],
      in_progress: [{ id: "t3", title: "Task 3" }],
      done: [],
    })
  })
})
