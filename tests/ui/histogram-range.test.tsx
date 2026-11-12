import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { HistogramRange } from "@/registry/default/ui/histogram-range"

describe("HistogramRange", () => {
  it("renders two slider thumbs and decorative histogram chart", () => {
    const data = [10, 20, 30, 40, 50]
    render(
      <HistogramRange
        data={data}
        min={0}
        max={100}
        defaultValue={[20, 60]}
        minThumbLabel="Min value"
        maxThumbLabel="Max value"
      />
    )

    const sliders = screen.getAllByRole("slider")
    expect(sliders).toHaveLength(2)

    expect(
      screen.getByRole("slider", { name: "Min value" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("slider", { name: "Max value" })
    ).toBeInTheDocument()

    const chart = document.querySelector("[data-slot=histogram-chart]")
    expect(chart).toHaveAttribute("aria-hidden", "true")
  })

  it("exposes aria-valuetext when formatValue is provided", () => {
    const data = [10, 20, 30, 40, 50]
    render(
      <HistogramRange
        data={data}
        min={0}
        max={100}
        defaultValue={[20, 50]}
        formatValue={(val) => `$${val}`}
        minThumbLabel="Minimum price"
        maxThumbLabel="Maximum price"
      />
    )

    const minThumb = screen.getByRole("slider", { name: "Minimum price" })
    const maxThumb = screen.getByRole("slider", { name: "Maximum price" })

    expect(minThumb).toHaveAttribute("aria-valuetext", "$20")
    expect(maxThumb).toHaveAttribute("aria-valuetext", "$50")
  })

  it("announces selected result count in polite live region", () => {
    // values: 10, 20, 30, 40, 50
    // range [20, 40] contains 20, 30, 40 (3 values)
    const data = [10, 20, 30, 40, 50]
    render(
      <HistogramRange data={data} min={0} max={100} defaultValue={[20, 40]} />
    )

    const liveRegion = screen.getByRole("status")
    expect(liveRegion).toHaveTextContent("3 of 5 results in selected range")
  })

  it("renders header values and custom count summary when enabled", () => {
    const data = [10, 20, 30]
    render(
      <HistogramRange
        data={data}
        min={0}
        max={50}
        defaultValue={[10, 30]}
        showValues
        showCount
        formatValue={(v) => `${v} USD`}
        renderCount={(sel, tot) => `${sel} of ${tot} items selected`}
      />
    )

    expect(screen.getByText("10 USD – 30 USD")).toBeInTheDocument()
    expect(
      document.querySelector("[data-slot=histogram-range-count]")
    ).toHaveTextContent("3 of 3 items selected")
    expect(screen.getByRole("status")).toHaveTextContent(
      "3 of 3 items selected"
    )
  })

  it("renders count without values header when showCount is true and showValues is false", () => {
    const data = [10, 20, 30]
    render(
      <HistogramRange
        data={data}
        min={0}
        max={50}
        defaultValue={[10, 30]}
        showCount
      />
    )

    expect(
      document.querySelector("[data-slot=histogram-range-values]")
    ).toBeNull()
    expect(
      document.querySelector("[data-slot=histogram-range-count]")
    ).toHaveTextContent("3 of 3 results")
  })

  it("applies custom barColor and mutedBarColor classes", () => {
    const data = [10, 30]
    render(
      <HistogramRange
        data={data}
        min={0}
        max={40}
        bins={2}
        defaultValue={[0, 20]}
        barColor="bg-chart-1"
        mutedBarColor="bg-chart-2"
      />
    )

    const bars = document.querySelectorAll("[data-slot=histogram-bar]")
    expect(bars).toHaveLength(2)
    // bin 0 [0, 20) is in range
    expect(bars[0]).toHaveClass("bg-chart-1")
    // bin 1 [20, 40] is out of range
    expect(bars[1]).toHaveClass("bg-chart-2")
  })

  it("updates bars inRange attribute based on selected range", () => {
    // 4 bins across [0, 40]: [0-10), [10-20), [20-30), [30-40]
    const data = [5, 15, 25, 35]
    render(
      <HistogramRange
        data={data}
        min={0}
        max={40}
        bins={4}
        defaultValue={[10, 30]}
      />
    )

    const bars = document.querySelectorAll("[data-slot=histogram-bar]")
    expect(bars).toHaveLength(4)

    // bin 0 [0, 10): outside [10, 30]
    expect(bars[0]).toHaveAttribute("data-in-range", "false")
    // bin 1 [10, 20): inside [10, 30]
    expect(bars[1]).toHaveAttribute("data-in-range", "true")
    // bin 2 [20, 30): inside [10, 30]
    expect(bars[2]).toHaveAttribute("data-in-range", "true")
    // bin 3 [30, 40]: outside [10, 30]
    expect(bars[3]).toHaveAttribute("data-in-range", "false")
  })

  it("handles non-finite datasets gracefully by falling back to default 0-100 bounds", () => {
    const nonFiniteData = [NaN, Infinity, -Infinity]
    render(<HistogramRange data={nonFiniteData} showValues showCount />)

    expect(screen.getByText("0 – 100")).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent(
      "0 of 0 results in selected range"
    )
  })

  it("derives bounds from finite numbers when mixed with non-finite values", () => {
    const mixedData = [NaN, 25, Infinity, 75, -Infinity]
    render(<HistogramRange data={mixedData} showValues />)

    expect(screen.getByText("25 – 75")).toBeInTheDocument()
  })

  it("handles disabled state", () => {
    render(<HistogramRange data={[10, 20]} defaultValue={[0, 50]} disabled />)

    const root = document.querySelector("[data-slot=histogram-range-slider]")
    expect(root).toHaveClass("pointer-events-none")
    expect(root).toHaveClass("opacity-50")
  })

  it("supports controlled value and calls onValueChange", async () => {
    const user = userEvent.setup()
    const handleValueChange = vi.fn()
    const data = [10, 20, 30, 40, 50]

    render(
      <HistogramRange
        data={data}
        min={0}
        max={100}
        step={5}
        value={[20, 80]}
        onValueChange={handleValueChange}
        minThumbLabel="Min"
        maxThumbLabel="Max"
      />
    )

    const minThumb = screen.getByRole("slider", { name: "Min" })
    minThumb.focus()
    await user.keyboard("{ArrowRight}")

    expect(handleValueChange).toHaveBeenCalled()
  })

  it("calls onValueCommit when slider thumb interaction finishes", async () => {
    const user = userEvent.setup()
    const handleValueCommit = vi.fn()
    const data = [10, 20, 30, 40, 50]

    render(
      <HistogramRange
        data={data}
        min={0}
        max={100}
        step={5}
        defaultValue={[20, 80]}
        onValueCommit={handleValueCommit}
        minThumbLabel="Min"
      />
    )

    const minThumb = screen.getByRole("slider", { name: "Min" })
    minThumb.focus()
    await user.keyboard("{ArrowRight}")

    expect(handleValueCommit).toHaveBeenCalled()
  })
})
