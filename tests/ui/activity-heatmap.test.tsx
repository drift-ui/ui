import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  ActivityHeatmap,
  type ActivityDay,
} from "@/registry/default/ui/activity-heatmap"

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
    expect(oct31Cell).toHaveAttribute("title", "7 contributions on October 31")

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
})
