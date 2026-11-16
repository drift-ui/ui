import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { IconPicker } from "@/registry/default/ui/icon-picker"

const TEST_ICONS = [
  { name: "folder", tags: ["directory", "project"] },
  { name: "folder-open", tags: ["directory", "active"] },
  { name: "file-text", tags: ["document", "notes"] },
  { name: "star", tags: ["favorite", "bookmark"] },
  { name: "trash-2", tags: ["delete", "remove"] },
  { name: "search", tags: ["find", "zoom"] },
]

function renderPicker(props: React.ComponentProps<typeof IconPicker> = {}) {
  return render(<IconPicker icons={TEST_ICONS} {...props} />)
}

function iconButton(name: string) {
  return screen.getByRole("button", { name })
}

function iconCell(name: string) {
  return iconButton(name).closest("[role='gridcell']")!
}

function searchbox() {
  return screen.getByRole("searchbox", { name: "Search icons" })
}

describe("IconPicker", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("renders search input, icon grid, and footer", () => {
    renderPicker()

    expect(searchbox()).toBeInTheDocument()
    const grid = screen.getByRole("grid", { name: "Icons" })
    expect(grid).toBeInTheDocument()
    expect(
      within(grid).getByRole("rowgroup", { name: "All icons" })
    ).toBeInTheDocument()
    expect(iconButton("folder")).toBeInTheDocument()
    expect(screen.getByText("Selected")).toBeInTheDocument()
  })

  it("calls onValueChange and onSelect when an icon is clicked", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const onSelect = vi.fn()
    renderPicker({ onValueChange, onSelect })

    await user.click(iconButton("star"))

    expect(onValueChange).toHaveBeenCalledWith("star")
    expect(onSelect).toHaveBeenCalledWith("star")
    expect(iconButton("star")).toHaveAttribute("aria-pressed", "true")
    expect(iconCell("star")).toHaveAttribute("aria-selected", "true")
    expect(screen.getByText("star")).toBeInTheDocument()
  })

  it("filters icons by search query and announces count", async () => {
    const user = userEvent.setup()
    renderPicker()

    await user.type(searchbox(), "star")

    expect(iconButton("star")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "folder" })
    ).not.toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("1 result")
  })

  it("filters by tags", async () => {
    const user = userEvent.setup()
    renderPicker()

    await user.type(searchbox(), "favorite")

    expect(iconButton("star")).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("1 result")
  })

  it("shows empty state when no icons match", async () => {
    const user = userEvent.setup()
    renderPicker()

    await user.type(searchbox(), "nonexistentquery")

    expect(screen.getByText("No icons found")).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("0 results")
  })

  it("picks the first result with Enter from the search field", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderPicker({ onValueChange })

    await user.type(searchbox(), "star{Enter}")

    expect(onValueChange).toHaveBeenCalledWith("star")
  })

  it("navigates between search and grid with arrow keys", async () => {
    const user = userEvent.setup()
    renderPicker({ columns: 3 })

    await user.click(searchbox())
    await user.keyboard("{ArrowDown}")
    expect(iconButton("folder")).toHaveFocus()

    await user.keyboard("{ArrowRight}")
    expect(iconButton("folder-open")).toHaveFocus()

    await user.keyboard("{ArrowLeft}")
    expect(iconButton("folder")).toHaveFocus()

    await user.keyboard("{ArrowUp}")
    expect(searchbox()).toHaveFocus()
  })

  it("keeps one tab stop in the grid which follows focus", async () => {
    const user = userEvent.setup()
    renderPicker({ columns: 3 })

    await user.click(searchbox())
    await user.tab()
    expect(iconButton("folder")).toHaveFocus()

    await user.keyboard("{ArrowRight}")
    expect(iconButton("folder")).toHaveAttribute("tabindex", "-1")
    expect(iconButton("folder-open")).toHaveAttribute("tabindex", "0")
    expect(iconButton("folder-open")).toHaveFocus()

    const focusableButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.tabIndex === 0)
    expect(focusableButtons).toHaveLength(1)
  })

  it("selects with Enter and Space on a focused icon in grid", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderPicker({ onValueChange, columns: 3 })

    await user.click(searchbox())
    await user.keyboard("{ArrowDown}{Enter}")
    expect(onValueChange).toHaveBeenCalledWith("folder")

    await user.keyboard("{ArrowRight} ")
    expect(onValueChange).toHaveBeenCalledWith("folder-open")
  })

  it("persists recent icons in localStorage and displays on next mount", async () => {
    const user = userEvent.setup()
    const { unmount } = renderPicker()

    expect(screen.queryByText("Recently used")).not.toBeInTheDocument()

    await user.click(iconButton("star"))
    unmount()

    renderPicker()
    const recent = screen.getByRole("rowgroup", { name: "Recently used" })
    expect(
      within(recent).getByRole("button", { name: "star" })
    ).toBeInTheDocument()
  })

  it("does not reorder the grid while open", async () => {
    const user = userEvent.setup()
    renderPicker()

    await user.click(iconButton("star"))
    expect(screen.queryByText("Recently used")).not.toBeInTheDocument()
  })

  it("pages between sections with PageDown and PageUp", async () => {
    const user = userEvent.setup()
    // Pre-seed recent icon in storage
    localStorage.setItem(
      "drift-ui:icon-picker",
      JSON.stringify({ recent: ["star"] })
    )

    renderPicker({ columns: 3 })
    const allIconsGroup = screen.getByRole("rowgroup", { name: "All icons" })

    await user.click(searchbox())
    await user.keyboard("{ArrowDown}{PageDown}")

    expect(within(allIconsGroup).getAllByRole("button")[0]).toHaveFocus()
  })

  it("supports controlled value", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = render(
      <IconPicker
        icons={TEST_ICONS}
        value="folder"
        onValueChange={onValueChange}
      />
    )

    expect(iconButton("folder")).toHaveAttribute("aria-pressed", "true")
    expect(iconButton("star")).toHaveAttribute("aria-pressed", "false")
    expect(iconCell("folder")).toHaveAttribute("aria-selected", "true")
    expect(iconCell("star")).toHaveAttribute("aria-selected", "false")

    await user.click(iconButton("star"))
    expect(onValueChange).toHaveBeenCalledWith("star")

    rerender(
      <IconPicker
        icons={TEST_ICONS}
        value="star"
        onValueChange={onValueChange}
      />
    )
    expect(iconButton("star")).toHaveAttribute("aria-pressed", "true")
    expect(iconCell("star")).toHaveAttribute("aria-selected", "true")
  })

  it("renders fallback for invalid icon name", () => {
    renderPicker({ icons: ["not-a-valid-icon"] })
    expect(iconButton("not-a-valid-icon")).toBeInTheDocument()
  })

  it("moves to previous row with ArrowUp when row > 0", async () => {
    const user = userEvent.setup()
    renderPicker({ columns: 3 })

    await user.click(searchbox())
    await user.keyboard("{ArrowDown}")
    await user.keyboard("{ArrowDown}")
    expect(iconButton("star")).toHaveFocus()

    await user.keyboard("{ArrowUp}")
    expect(iconButton("folder")).toHaveFocus()
  })

  it("safely ignores clicks or focus on non-cell elements inside grid", async () => {
    const user = userEvent.setup()
    renderPicker()
    const grid = screen.getByRole("grid", { name: "Icons" })
    await user.click(grid)
    grid.focus()
    expect(grid).toBeInTheDocument()
  })

  it("forwards className and remaining props to root element", () => {
    renderPicker({
      className: "custom-class",
      "aria-label": "Select project icon",
    })

    const root = screen.getByRole("group", { name: "Select project icon" })
    expect(root).toHaveClass("custom-class")
  })

  it("passes axe accessibility checks", async () => {
    const { container } = renderPicker()

    const { violations } = await axe.run(container, {
      rules: { region: { enabled: false } },
    })

    expect(
      violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map((node) => node.target.join(" ")),
      }))
    ).toEqual([])
  })
})
