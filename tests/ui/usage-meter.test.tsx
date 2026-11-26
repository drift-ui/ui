import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  UsageMeter,
  type UsageMeterSegment,
} from "@/registry/default/ui/usage-meter"

describe("UsageMeter", () => {
  it("renders with role='meter' and correct WAI-ARIA attributes", () => {
    render(
      <UsageMeter
        value={7.2}
        max={10}
        unit="GB"
        label="Storage Used"
        description="Across all projects"
      />
    )

    const meter = screen.getByRole("meter")
    expect(meter).toBeInTheDocument()
    expect(meter).toHaveAttribute("aria-valuenow", "7.2")
    expect(meter).toHaveAttribute("aria-valuemin", "0")
    expect(meter).toHaveAttribute("aria-valuemax", "10")
    expect(meter).toHaveAttribute("aria-valuetext", "7.2 GB of 10 GB, 72%")
    expect(meter).toHaveAttribute("tabindex", "0")

    expect(screen.getByText("Storage Used")).toBeInTheDocument()
    expect(screen.getByText("Across all projects")).toBeInTheDocument()
    expect(screen.getByText("7.2 GB")).toBeInTheDocument()
  })

  it("applies normal status color when below warning threshold", () => {
    const { container } = render(
      <UsageMeter value={5} max={10} unit="GB" warningAt={0.8} />
    )

    const track = container.querySelector('[data-slot="usage-meter-track"]')!
    expect(track).toHaveAttribute("data-status", "normal")

    const bar = container.querySelector('[data-slot="usage-meter-bar"]')!
    expect(bar).toHaveClass("bg-primary")
    expect(bar).toHaveStyle({ width: "50%" })
  })

  it("applies warning status and badge when at or above warning threshold", () => {
    const { container } = render(
      <UsageMeter value={8} max={10} unit="GB" warningAt={0.8} />
    )

    const track = container.querySelector('[data-slot="usage-meter-track"]')!
    expect(track).toHaveAttribute("data-status", "warning")

    const bar = container.querySelector('[data-slot="usage-meter-bar"]')!
    expect(bar).toHaveClass("bg-chart-5")
    expect(bar).toHaveStyle({ width: "80%" })

    expect(screen.getByText("80% used")).toBeInTheDocument()
  })

  it("applies danger status and renders overage badge when exceeding limit", () => {
    const { container } = render(<UsageMeter value={12} max={10} unit="GB" />)

    const track = container.querySelector('[data-slot="usage-meter-track"]')!
    expect(track).toHaveAttribute("data-status", "danger")

    const bar = container.querySelector('[data-slot="usage-meter-bar"]')!
    expect(bar).toHaveClass("bg-destructive")
    expect(bar).toHaveStyle({ width: "100%" })

    expect(screen.getByText("2 GB over limit")).toBeInTheDocument()
    expect(track).toHaveAttribute(
      "aria-valuetext",
      "12 GB of 10 GB, 120% (2 GB over limit)"
    )
  })

  it("renders segmented breakdown with legend", () => {
    const segments: UsageMeterSegment[] = [
      { label: "Images", value: 4.1 },
      { label: "Video", value: 3.1 },
      { label: "Documents", value: 1.2 },
    ]

    const { container } = render(
      <UsageMeter
        max={10}
        unit="GB"
        segments={segments}
        label="Media Storage"
      />
    )

    const meter = screen.getByRole("meter")
    expect(meter).toHaveAttribute("aria-valuenow", "8.4")

    const renderedSegments = container.querySelectorAll(
      '[data-slot="usage-meter-segment"]'
    )
    expect(renderedSegments).toHaveLength(3)
    expect(renderedSegments[0]).toHaveClass("bg-chart-1")
    expect(renderedSegments[1]).toHaveClass("bg-chart-2")
    expect(renderedSegments[2]).toHaveClass("bg-chart-3")

    // Legend entries
    expect(screen.getByText("Images")).toBeInTheDocument()
    expect(screen.getByText("Video")).toBeInTheDocument()
    expect(screen.getByText("Documents")).toBeInTheDocument()
    expect(screen.getByText("4.1 GB")).toBeInTheDocument()
    expect(screen.getByText("3.1 GB")).toBeInTheDocument()
    expect(screen.getByText("1.2 GB")).toBeInTheDocument()
  })

  it("renders limit marker when segmented meter exceeds max capacity", () => {
    const segments: UsageMeterSegment[] = [
      { label: "Images", value: 6 },
      { label: "Video", value: 6 },
    ]

    const { container } = render(
      <UsageMeter max={10} unit="GB" segments={segments} />
    )

    const meter = screen.getByRole("meter")
    expect(meter).toHaveAttribute("aria-valuenow", "10")
    expect(meter).toHaveAttribute("data-status", "danger")

    const marker = container.querySelector(
      '[data-slot="usage-meter-limit-marker"]'
    )
    expect(marker).toBeInTheDocument()
    expect(marker).toHaveStyle({ left: "83.33%" })
    expect(screen.getByText("2 GB over limit")).toBeInTheDocument()
  })

  it("supports size variants", () => {
    const { container, rerender } = render(
      <UsageMeter value={5} max={10} size="sm" />
    )
    expect(
      container.querySelector('[data-slot="usage-meter-track"]')
    ).toHaveClass("h-1.5")

    rerender(<UsageMeter value={5} max={10} size="lg" />)
    expect(
      container.querySelector('[data-slot="usage-meter-track"]')
    ).toHaveClass("h-4")
  })

  it("supports custom renderValue", () => {
    render(
      <UsageMeter
        value={7}
        max={10}
        renderValue={(val, max, pct) => (
          <span>{`${val} of ${max} (${pct} pct)`}</span>
        )}
      />
    )
    expect(screen.getByText("7 of 10 (70 pct)")).toBeInTheDocument()
  })

  it("can hide value, legend, and status badge", () => {
    const segments: UsageMeterSegment[] = [{ label: "Data", value: 9 }]
    const { container } = render(
      <UsageMeter
        max={10}
        segments={segments}
        showValue={false}
        showLegend={false}
        showStatusBadge={false}
      />
    )

    expect(
      container.querySelector('[data-slot="usage-meter-legend"]')
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/9/)).not.toBeInTheDocument()
  })

  it("supports custom min range and calculates bar width relative to range", () => {
    const { container } = render(
      <UsageMeter min={50} max={100} value={75} unit="GB" />
    )
    const meter = screen.getByRole("meter")
    expect(meter).toHaveAttribute("aria-valuemin", "50")
    expect(meter).toHaveAttribute("aria-valuemax", "100")
    expect(meter).toHaveAttribute("aria-valuenow", "75")

    const bar = container.querySelector('[data-slot="usage-meter-bar"]')!
    expect(bar).toHaveStyle({ width: "50%" })
  })

  it("links description to aria-describedby", () => {
    render(
      <UsageMeter
        value={5}
        max={10}
        label="Disk Space"
        description="Encrypted volume"
      />
    )
    const meter = screen.getByRole("meter")
    const desc = screen.getByText("Encrypted volume")
    expect(desc).toHaveAttribute("id")
    expect(meter).toHaveAttribute("aria-describedby", desc.getAttribute("id")!)
  })

  it("keeps external aria-labelledby distinct from internal label id", () => {
    render(
      <div>
        <span id="external-heading">External Heading</span>
        <UsageMeter
          aria-labelledby="external-heading"
          label="Internal Label"
          value={3}
          max={10}
        />
      </div>
    )
    const meter = screen.getByRole("meter")
    expect(meter).toHaveAttribute("aria-labelledby", "external-heading")
    const internal = screen.getByText("Internal Label")
    expect(internal.id).not.toBe("external-heading")
  })

  it("handles zero quota with overage badge and 100% bar width", () => {
    const { container } = render(<UsageMeter value={5} max={0} unit="calls" />)
    const meter = screen.getByRole("meter")
    expect(meter).toHaveAttribute("aria-valuenow", "0")
    expect(meter).toHaveAttribute("data-status", "danger")

    const bar = container.querySelector('[data-slot="usage-meter-bar"]')!
    expect(bar).toHaveStyle({ width: "100%" })
    expect(screen.getByText("5 calls over limit")).toBeInTheDocument()
  })

  it("renders header when only description is provided", () => {
    render(
      <UsageMeter
        value={5}
        max={10}
        description="Helper without main label"
        showValue={false}
      />
    )
    expect(screen.getByText("Helper without main label")).toBeInTheDocument()
  })

  it("handles negative values by clamping to 0", () => {
    const { container } = render(<UsageMeter value={-5} max={10} />)
    const meter = screen.getByRole("meter")
    expect(meter).toHaveAttribute("aria-valuenow", "0")
    const bar = container.querySelector('[data-slot="usage-meter-bar"]')!
    expect(bar).toHaveStyle({ width: "0%" })
  })

  it("defaults to 0 when value is undefined", () => {
    render(<UsageMeter max={10} />)
    const meter = screen.getByRole("meter")
    expect(meter).toHaveAttribute("aria-valuenow", "0")
  })

  it("normalizes inverted or negative min/max bounds", () => {
    const { rerender } = render(<UsageMeter min={50} max={20} value={30} />)
    const meter = screen.getByRole("meter")
    expect(meter).toHaveAttribute("aria-valuemin", "50")
    expect(meter).toHaveAttribute("aria-valuemax", "50")

    rerender(<UsageMeter max={-5} value={0} />)
    expect(meter).toHaveAttribute("aria-valuemin", "0")
    expect(meter).toHaveAttribute("aria-valuemax", "0")
    expect(screen.queryByText(/over limit/)).not.toBeInTheDocument()
  })
})
