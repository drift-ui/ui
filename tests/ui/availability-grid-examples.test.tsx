import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AvailabilityGridBasicPreview } from "@/components/preview/examples/availability-grid/basic"
import { AvailabilityGridTimezonePreview } from "@/components/preview/examples/availability-grid/timezone"
import { AvailabilityGridPreview } from "@/components/preview/availability-grid-preview"

describe("AvailabilityGrid previews and examples", () => {
  it("renders main preview and handles reset", () => {
    render(<AvailabilityGridPreview />)

    expect(screen.getByText(/Schedule \(39 hrs/i)).toBeInTheDocument()

    const select = screen.getByLabelText("Time zone:")
    fireEvent.change(select, { target: { value: "Asia/Kolkata" } })

    expect(screen.getByText(/in Asia\/Kolkata/i)).toBeInTheDocument()

    const resetBtn = screen.getByRole("button", { name: "Reset schedule" })
    fireEvent.click(resetBtn)

    expect(screen.getByText(/in Europe\/Berlin/i)).toBeInTheDocument()
    expect(screen.getByText(/Schedule \(39 hrs/i)).toBeInTheDocument()
    const mondayCell = screen.getByRole("gridcell", {
      name: "Monday, 09:00 – 09:30",
    })
    expect(mondayCell).toHaveAttribute("aria-selected", "true")
  })

  it("renders basic example", () => {
    const { container } = render(<AvailabilityGridBasicPreview />)
    expect(container).not.toBeEmptyDOMElement()
    expect(screen.getAllByText(/40 hrs/i).length).toBeGreaterThan(0)
  })

  it("renders timezone example and changes timezone", () => {
    render(<AvailabilityGridTimezonePreview />)
    expect(screen.getAllByText(/18 hrs/i).length).toBeGreaterThan(0)

    const select = screen.getByRole("combobox")
    fireEvent.change(select, { target: { value: "Europe/Berlin" } })
    expect(screen.getByText(/\(Europe\/Berlin\)/i)).toBeInTheDocument()
  })
})
