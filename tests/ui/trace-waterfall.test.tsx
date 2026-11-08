import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  TraceWaterfall,
  type Span,
} from "@/registry/default/ui/trace-waterfall"

const SAMPLE_SPANS: Span[] = [
  { id: "1", name: "GET /orders", start: 0, duration: 240, service: "gateway" },
  {
    id: "2",
    parentId: "1",
    name: "auth.verify",
    start: 5,
    duration: 15,
    service: "auth",
  },
  {
    id: "3",
    parentId: "1",
    name: "SELECT orders",
    start: 25,
    duration: 90,
    service: "postgres",
    status: "error",
  },
  {
    id: "4",
    parentId: "3",
    name: "checkpoint.saved",
    start: 30,
    duration: 0,
    service: "postgres",
  },
  {
    id: "5",
    parentId: "non-existent-parent",
    name: "orphan.task",
    start: 130,
    duration: 40,
    service: "worker",
  },
]

describe("TraceWaterfall", () => {
  it("renders a tree with correct levels, set sizes, and accessible bar labels", () => {
    render(
      <TraceWaterfall
        spans={SAMPLE_SPANS}
        defaultExpandedSpanIds={["1", "3"]}
      />
    )

    const tree = screen.getByRole("tree", { name: "Trace spans" })
    expect(tree).toBeInTheDocument()

    const items = screen.getAllByRole("treeitem")
    expect(items).toHaveLength(5)

    // Check levels
    expect(items.map((item) => item.getAttribute("aria-level"))).toEqual([
      "1",
      "2",
      "2",
      "3",
      "1",
    ])

    // Check sibling positions for children of "1" (items[1] and items[2])
    expect(items[1]).toHaveAttribute("aria-posinset", "1")
    expect(items[1]).toHaveAttribute("aria-setsize", "2")
    expect(items[2]).toHaveAttribute("aria-posinset", "2")
    expect(items[2]).toHaveAttribute("aria-setsize", "2")

    // Check accessible label on database error span
    expect(items[2]).toHaveAttribute(
      "aria-label",
      expect.stringContaining("SELECT orders, 90 ms, starts at 25 ms")
    )
    expect(items[2]).toHaveAttribute(
      "aria-label",
      expect.stringContaining("status error")
    )

    // Exactly one row has tabIndex 0 for roving tabindex
    expect(items.filter((item) => item.tabIndex === 0)).toHaveLength(1)
  })

  it("promotes orphan spans with missing parents to root level", () => {
    render(<TraceWaterfall spans={SAMPLE_SPANS} defaultExpandedSpanIds={[]} />)

    const items = screen.getAllByRole("treeitem")
    // Roots are "1" and "5"
    expect(items).toHaveLength(2)
    expect(items[1]).toHaveAttribute("aria-level", "1")
    expect(items[1]).toHaveAttribute(
      "aria-label",
      expect.stringContaining("orphan.task")
    )
  })

  it("handles keyboard navigation: ArrowDown, ArrowUp, Home, End", async () => {
    const user = userEvent.setup()
    render(
      <TraceWaterfall
        spans={SAMPLE_SPANS}
        defaultExpandedSpanIds={["1", "3"]}
      />
    )

    const items = screen.getAllByRole("treeitem")

    await user.tab()
    expect(document.activeElement).toBe(items[0])

    await user.keyboard("{ArrowDown}")
    expect(document.activeElement).toBe(items[1])

    await user.keyboard("{ArrowDown}")
    expect(document.activeElement).toBe(items[2])

    await user.keyboard("{ArrowUp}")
    expect(document.activeElement).toBe(items[1])

    await user.keyboard("{End}")
    expect(document.activeElement).toBe(items[4])

    await user.keyboard("{Home}")
    expect(document.activeElement).toBe(items[0])
  })

  it("expands and collapses branches using ArrowRight and ArrowLeft", async () => {
    const user = userEvent.setup()
    const onExpandedChange = vi.fn()
    render(
      <TraceWaterfall
        spans={SAMPLE_SPANS}
        defaultExpandedSpanIds={[]}
        onExpandedChange={onExpandedChange}
      />
    )

    await user.tab()
    const root = screen.getByRole("treeitem", {
      name: /GET \/orders, 240 ms, starts at 0 ms/,
    })
    expect(document.activeElement).toBe(root)
    expect(root).toHaveAttribute("aria-expanded", "false")

    // ArrowRight on closed branch expands it
    await user.keyboard("{ArrowRight}")
    expect(root).toHaveAttribute("aria-expanded", "true")
    expect(onExpandedChange).toHaveBeenCalledWith(["1"])

    // ArrowRight on open branch moves into first child
    await user.keyboard("{ArrowRight}")
    const firstChild = screen.getByRole("treeitem", {
      name: /auth\.verify/,
    })
    expect(document.activeElement).toBe(firstChild)

    // ArrowLeft on leaf node moves back to parent
    await user.keyboard("{ArrowLeft}")
    expect(document.activeElement).toBe(root)

    // ArrowLeft on open branch collapses it
    await user.keyboard("{ArrowLeft}")
    expect(root).toHaveAttribute("aria-expanded", "false")
  })

  it("selects spans with Enter, Space, and mouse click", async () => {
    const user = userEvent.setup()
    const onSpanSelect = vi.fn()
    render(
      <TraceWaterfall
        spans={SAMPLE_SPANS}
        defaultExpandedSpanIds={["1"]}
        onSpanSelect={onSpanSelect}
      />
    )

    const items = screen.getAllByRole("treeitem")

    // Click to select
    await user.click(items[1])
    expect(items[1]).toHaveAttribute("aria-selected", "true")
    expect(onSpanSelect).toHaveBeenLastCalledWith(SAMPLE_SPANS[1])

    // Keyboard selection with Enter
    await user.keyboard("{ArrowDown}")
    await user.keyboard("{Enter}")
    expect(items[2]).toHaveAttribute("aria-selected", "true")
    expect(onSpanSelect).toHaveBeenLastCalledWith(SAMPLE_SPANS[2])

    // Deselect with Space
    await user.keyboard(" ")
    expect(items[2]).toHaveAttribute("aria-selected", "false")
    expect(onSpanSelect).toHaveBeenLastCalledWith(null)
  })

  it("renders a visible bar for zero-duration spans", () => {
    const { container } = render(
      <TraceWaterfall
        spans={SAMPLE_SPANS}
        defaultExpandedSpanIds={["1", "3"]}
        minBarWidth={6}
      />
    )

    // Find the timing bar element for checkpoint.saved
    const zeroBar = container.querySelector(
      '[title*="checkpoint.saved, 0 ms, starts at 30 ms"]'
    )
    expect(zeroBar).toBeInTheDocument()
    expect(zeroBar?.getAttribute("style")).toContain("max(0%, 6px)")
  })
})
