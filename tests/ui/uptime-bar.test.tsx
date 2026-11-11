import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { UptimeBar, UptimeBarLegend } from "@/registry/default/ui/uptime-bar"
import type { UptimeDay } from "@/registry/default/lib/uptime-bar-utils"

const SAMPLE_DAYS: UptimeDay[] = [
  {
    date: "2026-10-28",
    status: "operational",
    uptime: 100,
  },
  {
    date: "2026-10-29",
    status: "degraded",
    uptime: 98.5,
    note: "Elevated latency",
  },
  {
    date: "2026-10-30",
    status: "down",
    uptime: 85.0,
    note: "Network outage",
  },
  {
    date: "2026-10-31",
    status: "no-data",
    note: "Maintenance window",
  },
]

describe("UptimeBar", () => {
  it("renders segments with accessible labels and status styling", () => {
    render(<UptimeBar title="API Service" days={SAMPLE_DAYS} />)

    expect(screen.getByText("API Service")).toBeInTheDocument()
    expect(screen.getByText(/uptime/i)).toBeInTheDocument()

    const segments = screen.getAllByRole("button")
    expect(segments).toHaveLength(4)

    expect(segments[0]).toHaveAttribute("data-status", "operational")
    expect(segments[0]).toHaveClass("bg-chart-2")
    expect(segments[0]).toHaveAttribute(
      "aria-label",
      "October 28, 2026, operational"
    )

    expect(segments[1]).toHaveAttribute("data-status", "degraded")
    expect(segments[1]).toHaveClass("bg-chart-5")
    expect(segments[1]).toHaveAttribute(
      "aria-label",
      "October 29, 2026, degraded performance: Elevated latency"
    )

    expect(segments[2]).toHaveAttribute("data-status", "down")
    expect(segments[2]).toHaveClass("bg-destructive")
    expect(segments[2]).toHaveAttribute(
      "aria-label",
      "October 30, 2026, major outage: Network outage"
    )

    expect(segments[3]).toHaveAttribute("data-status", "no-data")
    expect(segments[3]).toHaveClass("bg-muted")
    expect(segments[3]).toHaveAttribute(
      "aria-label",
      "October 31, 2026, no data: Maintenance window"
    )
  })

  it("enforces exactly one tab stop with roving tabindex", () => {
    render(<UptimeBar days={SAMPLE_DAYS} />)

    const segments = screen.getAllByRole("button")
    const tabbable = segments.filter((s) => s.tabIndex === 0)
    const nonTabbable = segments.filter((s) => s.tabIndex === -1)

    expect(tabbable).toHaveLength(1)
    expect(nonTabbable).toHaveLength(3)
    // Default active segment is the last one (index 3)
    expect(segments[3].tabIndex).toBe(0)
  })

  it("navigates segments with Arrow keys, Home, and End", async () => {
    const user = userEvent.setup()
    render(<UptimeBar days={SAMPLE_DAYS} />)

    const segments = screen.getAllByRole("button")

    // Tab into the component focuses the last segment (index 3)
    await user.tab()
    expect(document.activeElement).toBe(segments[3])

    // ArrowLeft moves to index 2
    await user.keyboard("{ArrowLeft}")
    expect(document.activeElement).toBe(segments[2])
    expect(segments[2].tabIndex).toBe(0)
    expect(segments[3].tabIndex).toBe(-1)

    // ArrowLeft again moves to index 1
    await user.keyboard("{ArrowLeft}")
    expect(document.activeElement).toBe(segments[1])

    // Home jumps to index 0
    await user.keyboard("{Home}")
    expect(document.activeElement).toBe(segments[0])
    expect(segments[0].tabIndex).toBe(0)

    // End jumps to index 3
    await user.keyboard("{End}")
    expect(document.activeElement).toBe(segments[3])
    expect(segments[3].tabIndex).toBe(0)

    // ArrowRight at end stays at end
    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toBe(segments[3])
  })

  it("opens popover with details on click", async () => {
    const user = userEvent.setup()
    render(<UptimeBar days={SAMPLE_DAYS} />)

    const segments = screen.getAllByRole("button")

    // Click degraded day (index 1)
    await user.click(segments[1])

    expect(screen.getByText("Elevated latency")).toBeInTheDocument()
    expect(screen.getByText("Degraded performance")).toBeInTheDocument()
    expect(screen.getByText("98.5%")).toBeInTheDocument()
  })

  it("opens popover on Enter and closes on Escape", async () => {
    const user = userEvent.setup()
    render(<UptimeBar days={SAMPLE_DAYS} />)

    await user.tab()
    await user.keyboard("{Home}") // move to index 0
    await user.keyboard("{Enter}") // open popover

    expect(
      screen.getByText("No downtime recorded on this day.")
    ).toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(
      screen.queryByText("No downtime recorded on this day.")
    ).not.toBeInTheDocument()
  })

  it("supports controlled value and onValueChange", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    function Controlled() {
      const [value, setValue] = React.useState<number | null>(null)
      return (
        <UptimeBar
          days={SAMPLE_DAYS}
          value={value}
          onValueChange={(next) => {
            setValue(next)
            onValueChange(next)
          }}
        />
      )
    }

    render(<Controlled />)

    const segments = screen.getAllByRole("button")
    await user.click(segments[1])

    expect(onValueChange).toHaveBeenCalledWith(1)
    expect(screen.getByText("Elevated latency")).toBeInTheDocument()

    // Clicking segment 1 again closes the popover
    await user.click(segments[1])
    expect(onValueChange).toHaveBeenCalledWith(null)
  })

  it("renders range labels correctly and respects showRangeLabels=false", () => {
    const { rerender } = render(
      <UptimeBar days={SAMPLE_DAYS} startLabel="4 days ago" endLabel="Today" />
    )

    expect(screen.getByText("4 days ago")).toBeInTheDocument()
    expect(screen.getByText("Today")).toBeInTheDocument()

    rerender(<UptimeBar days={SAMPLE_DAYS} showRangeLabels={false} />)
    expect(screen.queryByText("4 days ago")).not.toBeInTheDocument()
    expect(screen.queryByText("Today")).not.toBeInTheDocument()
  })
})

describe("UptimeBarLegend", () => {
  it("renders status indicators and labels", () => {
    render(<UptimeBarLegend />)

    expect(screen.getByText("Operational")).toBeInTheDocument()
    expect(screen.getByText("Degraded performance")).toBeInTheDocument()
    expect(screen.getByText("Major outage")).toBeInTheDocument()
    expect(screen.getByText("No data")).toBeInTheDocument()
  })
})
