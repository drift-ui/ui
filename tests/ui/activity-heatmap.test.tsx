import * as React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  ActivityHeatmap,
  type ActivityDay,
} from "@/registry/default/ui/activity-heatmap"
import { ActivityHeatmapTooltipPreview } from "@/components/preview/examples/activity-heatmap/tooltip"

const SAMPLE_DATA = [
  { date: "2026-10-25", count: 2 },
  { date: "2026-10-26", count: 0 },
  { date: "2026-10-27", count: 5 },
  { date: "2026-10-28", count: 12 },
  { date: "2026-10-29", count: 8 },
  { date: "2026-10-30", count: 1 },
  { date: "2026-10-31", count: 7 },
]

describe("ActivityHeatmap", () => {
  it("renders a WAI-ARIA grid with accessible labels and intensity levels", () => {
    render(
      <ActivityHeatmap
        data={SAMPLE_DATA}
        startDate="2026-10-25"
        endDate="2026-10-31"
        weekStartsOn={0}
      />
    )

    const grid = screen.getByRole("grid", { name: "Activity heatmap" })
    expect(grid).toBeInTheDocument()

    // October 31 cell
    const oct31Cell = screen.getByRole("gridcell", {
      name: "7 contributions on October 31",
    })
    expect(oct31Cell).toBeInTheDocument()
    expect(oct31Cell).toHaveAttribute(
      "aria-label",
      "7 contributions on October 31"
    )
    expect(oct31Cell).not.toHaveAttribute("title")

    // October 26 cell (zero count)
    const oct26Cell = screen.getByRole("gridcell", {
      name: "No contributions on October 26",
    })
    expect(oct26Cell).toBeInTheDocument()
    expect(oct26Cell).toHaveClass("bg-muted/40")
  })

  it("enforces roving tabindex with exactly one tab stop", () => {
    render(
      <ActivityHeatmap
        data={SAMPLE_DATA}
        startDate="2026-10-25"
        endDate="2026-10-31"
      />
    )

    const gridcells = screen.getAllByRole("gridcell")
    const tabbable = gridcells.filter((el) => el.tabIndex === 0)
    const nonTabbable = gridcells.filter((el) => el.tabIndex === -1)

    expect(tabbable).toHaveLength(1)
    expect(nonTabbable.length).toBeGreaterThan(0)
  })

  it("navigates cells with arrow keys, Home, and End", async () => {
    const user = userEvent.setup()
    render(
      <ActivityHeatmap
        data={SAMPLE_DATA}
        startDate="2026-10-25"
        endDate="2026-10-31"
        defaultSelectedDate="2026-10-28"
      />
    )

    const oct28 = screen.getByRole("gridcell", {
      name: "12 contributions on October 28",
    })
    expect(oct28.tabIndex).toBe(0)

    // Focus the initial cell
    oct28.focus()
    expect(document.activeElement).toBe(oct28)

    // ArrowUp moves to previous day
    await user.keyboard("{ArrowUp}")
    const activeUp = document.activeElement as HTMLElement
    expect(activeUp).not.toBe(oct28)
    expect(activeUp.tabIndex).toBe(0)
    expect(oct28.tabIndex).toBe(-1)

    // ArrowDown moves back
    await user.keyboard("{ArrowDown}")
    expect(document.activeElement).toBe(oct28)
    expect(oct28.tabIndex).toBe(0)
  })

  it("selects a day on click and triggers onDaySelect callback", async () => {
    const user = userEvent.setup()
    const handleDaySelect = vi.fn()

    render(
      <ActivityHeatmap
        data={SAMPLE_DATA}
        startDate="2026-10-25"
        endDate="2026-10-31"
        onDaySelect={handleDaySelect}
      />
    )

    const oct31 = screen.getByRole("gridcell", {
      name: "7 contributions on October 31",
    })
    expect(oct31).toHaveAttribute("aria-selected", "false")

    await user.click(oct31)

    expect(oct31).toHaveAttribute("aria-selected", "true")
    expect(handleDaySelect).toHaveBeenCalledTimes(1)
    expect(handleDaySelect).toHaveBeenCalledWith(
      expect.objectContaining({
        date: "2026-10-31",
        count: 7,
      })
    )
  })

  it("selects focused day with Enter and Space keys", async () => {
    const user = userEvent.setup()
    const handleDaySelect = vi.fn()

    render(
      <ActivityHeatmap
        data={SAMPLE_DATA}
        startDate="2026-10-25"
        endDate="2026-10-31"
        defaultSelectedDate="2026-10-27"
        onDaySelect={handleDaySelect}
      />
    )

    const oct27 = screen.getByRole("gridcell", {
      name: "5 contributions on October 27",
    })
    oct27.focus()

    await user.keyboard("{Enter}")
    expect(handleDaySelect).toHaveBeenCalledWith(
      expect.objectContaining({
        date: "2026-10-27",
        count: 5,
      })
    )

    await user.keyboard(" ")
    expect(handleDaySelect).toHaveBeenCalledTimes(2)
  })

  it("supports controlled selectedDate prop", async () => {
    const user = userEvent.setup()

    function ControlledDemo() {
      const [selected, setSelected] = React.useState<string | null>(
        "2026-10-25"
      )
      return (
        <div>
          <button
            type="button"
            onClick={() => setSelected("2026-10-31")}
            data-testid="set-oct31"
          >
            Select Oct 31
          </button>
          <ActivityHeatmap
            data={SAMPLE_DATA}
            startDate="2026-10-25"
            endDate="2026-10-31"
            selectedDate={selected}
            onDaySelect={(day: ActivityDay) => setSelected(day.date)}
          />
        </div>
      )
    }

    render(<ControlledDemo />)

    const oct25 = screen.getByRole("gridcell", {
      name: "2 contributions on October 25",
    })
    const oct31 = screen.getByRole("gridcell", {
      name: "7 contributions on October 31",
    })

    expect(oct25).toHaveAttribute("aria-selected", "true")
    expect(oct31).toHaveAttribute("aria-selected", "false")

    // Trigger external state update
    await user.click(screen.getByTestId("set-oct31"))

    expect(oct25).toHaveAttribute("aria-selected", "false")
    expect(oct31).toHaveAttribute("aria-selected", "true")
    expect(oct31.tabIndex).toBe(0)
  })

  it("renders custom text summary and legend", () => {
    render(
      <ActivityHeatmap
        data={SAMPLE_DATA}
        startDate="2026-10-25"
        endDate="2026-10-31"
        summary={(total) => `Total: ${total} tracked actions`}
        showLegend={true}
      />
    )

    expect(screen.getByText("Total: 35 tracked actions")).toBeInTheDocument()
    expect(screen.getByText("Less")).toBeInTheDocument()
    expect(screen.getByText("More")).toBeInTheDocument()
  })

  it("renders a floating tooltip on cell hover and removes it on unhover", async () => {
    const user = userEvent.setup()
    render(
      <ActivityHeatmap
        data={SAMPLE_DATA}
        startDate="2026-10-25"
        endDate="2026-10-31"
      />
    )

    const oct31 = screen.getByRole("gridcell", {
      name: "7 contributions on October 31",
    })

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()

    await user.hover(oct31)

    const tooltip = screen.getByRole("tooltip")
    expect(tooltip).toBeInTheDocument()
    expect(tooltip).toHaveTextContent("7 contributions")
    expect(tooltip).toHaveTextContent("October 31, 2026")
    expect(oct31).toHaveAttribute("aria-describedby", tooltip.id)

    await user.unhover(oct31)
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
    expect(oct31).not.toHaveAttribute("aria-describedby")
  })

  it("renders tooltip on cell focus and dismisses on Escape", async () => {
    const user = userEvent.setup()
    render(
      <ActivityHeatmap
        data={SAMPLE_DATA}
        startDate="2026-10-25"
        endDate="2026-10-31"
        defaultSelectedDate="2026-10-27"
      />
    )

    // Tab into the grid to focus the default-selected cell
    await user.tab()

    const tooltip = screen.getByRole("tooltip")
    expect(tooltip).toBeInTheDocument()
    expect(tooltip).toHaveTextContent("5 contributions")

    await user.keyboard("{Escape}")
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()

    // Navigating to adjacent cell re-displays the tooltip for the newly focused cell
    await user.keyboard("{ArrowDown}")
    const oct28 = screen.getByRole("gridcell", {
      name: "12 contributions on October 28",
    })
    expect(document.activeElement).toBe(oct28)
    const nextTooltip = screen.getByRole("tooltip")
    expect(nextTooltip).toBeInTheDocument()
    expect(nextTooltip).toHaveTextContent("12 contributions")
  })

  it("supports custom tooltip content via renderTooltip prop", async () => {
    const user = userEvent.setup()
    render(
      <ActivityHeatmap
        data={SAMPLE_DATA}
        startDate="2026-10-25"
        endDate="2026-10-31"
        renderTooltip={(day) => (
          <div data-testid="custom-tooltip">
            <strong>{day.count} PRs merged</strong>
            <span>on {day.date}</span>
          </div>
        )}
      />
    )

    const oct28 = screen.getByRole("gridcell", {
      name: "12 contributions on October 28",
    })

    await user.hover(oct28)

    const custom = screen.getByTestId("custom-tooltip")
    expect(custom).toBeInTheDocument()
    expect(custom).toHaveTextContent("12 PRs merged")
    expect(custom).toHaveTextContent("on 2026-10-28")
  })

  it("disables floating tooltip when showTooltip is false", async () => {
    const user = userEvent.setup()
    render(
      <ActivityHeatmap
        data={SAMPLE_DATA}
        startDate="2026-10-25"
        endDate="2026-10-31"
        showTooltip={false}
      />
    )

    const oct31 = screen.getByRole("gridcell", {
      name: "7 contributions on October 31",
    })

    await user.hover(oct31)
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
  })

  it("forwards ref and merges container ref correctly", () => {
    let refNode: HTMLDivElement | null = null
    const refCallback = (node: HTMLDivElement | null) => {
      refNode = node
    }

    const { container } = render(
      <ActivityHeatmap
        data={SAMPLE_DATA}
        startDate="2026-10-25"
        endDate="2026-10-31"
        ref={refCallback}
      />
    )

    expect(refNode).toBe(container.firstChild)
  })

  it("composes external onKeyDown on container and dismisses tooltip on Escape", async () => {
    const user = userEvent.setup()
    const handleKeyDown = vi.fn()

    render(
      <ActivityHeatmap
        data={SAMPLE_DATA}
        startDate="2026-10-25"
        endDate="2026-10-31"
        onKeyDown={handleKeyDown}
      />
    )

    await user.tab()
    expect(screen.getByRole("tooltip")).toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(handleKeyDown).toHaveBeenCalled()
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
  })

  it("updates tooltip content in real-time when data changes while cell is hovered", async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <ActivityHeatmap
        data={SAMPLE_DATA}
        startDate="2026-10-25"
        endDate="2026-10-31"
      />
    )

    const oct31 = screen.getByRole("gridcell", {
      name: "7 contributions on October 31",
    })

    await user.hover(oct31)
    const tooltip = screen.getByRole("tooltip")
    expect(tooltip).toHaveTextContent("7 contributions")

    // Update data while cell is still hovered
    const updatedData = SAMPLE_DATA.map((d) =>
      d.date === "2026-10-31" ? { ...d, count: 25 } : d
    )
    rerender(
      <ActivityHeatmap
        data={updatedData}
        startDate="2026-10-25"
        endDate="2026-10-31"
      />
    )

    expect(screen.getByRole("tooltip")).toHaveTextContent("25 contributions")
  })

  it("renders ActivityHeatmapTooltipPreview and displays custom badge and breakdown on hover", async () => {
    const user = userEvent.setup()
    render(<ActivityHeatmapTooltipPreview />)

    const oct31 = screen.getByRole("gridcell", {
      name: /October 31/i,
    })

    await user.hover(oct31)
    const tooltip = screen.getByRole("tooltip")
    expect(tooltip).toBeInTheDocument()
    expect(tooltip).toHaveTextContent(/Level/i)
  })
  it("pluralizes the default tooltip text by count and unit", async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <ActivityHeatmap
        data={SAMPLE_DATA}
        startDate="2026-10-25"
        endDate="2026-10-31"
      />
    )

    await user.hover(
      screen.getByRole("gridcell", { name: "No contributions on October 26" })
    )
    expect(screen.getByRole("tooltip")).toHaveTextContent("No contributions")

    await user.hover(
      screen.getByRole("gridcell", { name: "1 contribution on October 30" })
    )
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      /^1 contribution(?!s)/
    )

    rerender(
      <ActivityHeatmap
        data={SAMPLE_DATA}
        startDate="2026-10-25"
        endDate="2026-10-31"
        unit="activity"
      />
    )
    expect(screen.getByRole("tooltip")).toHaveTextContent(/^1 activity/)
  })

  it("follows the pointer between cells and keeps focus tooltips on blur of another cell", () => {
    render(
      <ActivityHeatmap
        data={SAMPLE_DATA}
        startDate="2026-10-25"
        endDate="2026-10-31"
      />
    )

    const oct28 = screen.getByRole("gridcell", {
      name: "12 contributions on October 28",
    })
    const oct31 = screen.getByRole("gridcell", {
      name: "7 contributions on October 31",
    })

    fireEvent.mouseEnter(oct28)
    expect(screen.getByRole("tooltip")).toHaveTextContent("12 contributions")
    fireEvent.mouseEnter(oct31)
    expect(screen.getByRole("tooltip")).toHaveTextContent("7 contributions")

    fireEvent.mouseLeave(screen.getByRole("grid"))
    fireEvent.focus(oct28)
    fireEvent.blur(oct31)
    expect(screen.getByRole("tooltip")).toHaveTextContent("12 contributions")
  })

  it("removes the tooltip when the hovered day leaves the date range", async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <ActivityHeatmap
        data={SAMPLE_DATA}
        startDate="2026-10-25"
        endDate="2026-10-31"
      />
    )

    await user.hover(
      screen.getByRole("gridcell", { name: "7 contributions on October 31" })
    )
    expect(screen.getByRole("tooltip")).toBeInTheDocument()

    rerender(
      <ActivityHeatmap
        data={SAMPLE_DATA}
        startDate="2026-10-25"
        endDate="2026-10-30"
      />
    )
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
  })

  it("dismisses the tooltip on Escape from the container, unless onKeyDown prevents it", () => {
    const { container, rerender } = render(
      <ActivityHeatmap
        data={SAMPLE_DATA}
        startDate="2026-10-25"
        endDate="2026-10-31"
        onKeyDown={(e) => e.preventDefault()}
      />
    )
    const root = container.firstChild as HTMLElement
    const oct31 = screen.getByRole("gridcell", {
      name: "7 contributions on October 31",
    })

    fireEvent.keyDown(oct31, { key: "Escape" })
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()

    fireEvent.mouseEnter(oct31)
    fireEvent.keyDown(root, { key: "Escape" })
    expect(screen.getByRole("tooltip")).toBeInTheDocument()

    rerender(
      <ActivityHeatmap
        data={SAMPLE_DATA}
        startDate="2026-10-25"
        endDate="2026-10-31"
      />
    )
    fireEvent.keyDown(root, { key: "a" })
    expect(screen.getByRole("tooltip")).toBeInTheDocument()
    fireEvent.keyDown(root, { key: "Escape" })
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()

    fireEvent.mouseLeave(oct31)
    fireEvent.keyDown(root, { key: "Escape" })
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
  })

  it("hides the tooltip when its cell scrolls out of the grid viewport", async () => {
    const { container } = render(
      <ActivityHeatmap
        data={SAMPLE_DATA}
        startDate="2026-10-25"
        endDate="2026-10-31"
      />
    )
    const scroller = container.querySelector(".overflow-x-auto") as HTMLElement
    const oct31 = screen.getByRole("gridcell", {
      name: "7 contributions on October 31",
    })

    fireEvent.scroll(scroller)

    const rect = (left: number, top = 0, width = 12, height = 12) =>
      ({
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
      }) as DOMRect
    let cellLeft = 100
    vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue(
      rect(0, 0, 400, 120)
    )
    vi.spyOn(oct31, "getBoundingClientRect").mockImplementation(() =>
      rect(cellLeft, 80)
    )

    fireEvent.mouseEnter(oct31)
    const tooltip = screen.getByRole("tooltip")
    await waitFor(() => expect(tooltip.style.opacity).toBe("1"))

    cellLeft = 600
    fireEvent.scroll(scroller)
    expect(tooltip.style.opacity).toBe("0")
  })

  it("shows the singular label and hides the breakdown on quiet days in the tooltip example", () => {
    render(<ActivityHeatmapTooltipPreview />)
    const cells = screen.getAllByRole("gridcell")
    const quiet = cells.find((c) =>
      c.getAttribute("aria-label")?.startsWith("No contributions")
    )
    const single = cells.find((c) =>
      c.getAttribute("aria-label")?.startsWith("1 contribution ")
    )

    fireEvent.mouseEnter(quiet!)
    expect(screen.getByRole("tooltip")).toHaveTextContent("0 activities")
    expect(screen.getByRole("tooltip")).not.toHaveTextContent("commits")

    fireEvent.mouseLeave(quiet!)
    fireEvent.mouseEnter(single!)
    expect(screen.getByRole("tooltip")).toHaveTextContent("1 activity")
  })
})
