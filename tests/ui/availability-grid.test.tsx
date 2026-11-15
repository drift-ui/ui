import { fireEvent, render, screen } from "@testing-library/react"
import axe from "axe-core"
import * as React from "react"
import { describe, expect, it, vi } from "vitest"

import type { AvailabilityRange } from "@/registry/default/lib/availability-grid-utils"
import { AvailabilityGrid } from "@/registry/default/ui/availability-grid"

describe("AvailabilityGrid", () => {
  it("renders a WAI-ARIA grid with column headers and cells", () => {
    render(<AvailabilityGrid startHour={9} endHour={11} slotMinutes={60} />)

    const grid = screen.getByRole("grid", { name: /availability schedule/i })
    expect(grid).toBeInTheDocument()
    expect(grid).toHaveAttribute("aria-multiselectable", "true")

    const colHeaders = screen.getAllByRole("columnheader")
    expect(colHeaders.length).toBe(8) // Time + 7 days

    const rowHeaders = screen.getAllByRole("rowheader")
    expect(rowHeaders.length).toBe(2) // 09:00, 10:00

    const cells = screen.getAllByRole("gridcell")
    expect(cells.length).toBe(14) // 2 rows * 7 days
  })

  it("marks preselected cells with aria-selected='true'", () => {
    const value: AvailabilityRange[] = [
      { day: "MO", start: "09:00", end: "10:00" },
    ]
    render(
      <AvailabilityGrid
        value={value}
        startHour={9}
        endHour={11}
        slotMinutes={60}
      />
    )

    const selectedCell = screen.getByRole("gridcell", {
      name: "Monday, 09:00 – 10:00",
    })
    expect(selectedCell).toHaveAttribute("aria-selected", "true")

    const unselectedCell = screen.getByRole("gridcell", {
      name: "Monday, 10:00 – 11:00",
    })
    expect(unselectedCell).toHaveAttribute("aria-selected", "false")
  })

  it("toggles cell selection on pointerdown and calls onValueChange", () => {
    const onValueChange = vi.fn()
    render(
      <AvailabilityGrid
        onValueChange={onValueChange}
        startHour={9}
        endHour={11}
        slotMinutes={60}
      />
    )

    const cell = screen.getByRole("gridcell", {
      name: "Monday, 09:00 – 10:00",
    })

    fireEvent.pointerDown(cell, { button: 0 })
    expect(onValueChange).toHaveBeenCalledWith([
      { day: "MO", start: "09:00", end: "10:00" },
    ])
  })

  it("deselects on pointerdown when cell is already selected", () => {
    const onValueChange = vi.fn()
    const value: AvailabilityRange[] = [
      { day: "MO", start: "09:00", end: "10:00" },
    ]
    render(
      <AvailabilityGrid
        value={value}
        onValueChange={onValueChange}
        startHour={9}
        endHour={11}
        slotMinutes={60}
      />
    )

    const cell = screen.getByRole("gridcell", {
      name: "Monday, 09:00 – 10:00",
    })

    fireEvent.pointerDown(cell, { button: 0 })
    expect(onValueChange).toHaveBeenCalledWith([])
  })

  it("supports dragging across cells to expand selection", () => {
    const onValueChange = vi.fn()
    render(
      <AvailabilityGrid
        onValueChange={onValueChange}
        startHour={9}
        endHour={12}
        slotMinutes={60}
      />
    )

    const cell1 = screen.getByRole("gridcell", {
      name: "Monday, 09:00 – 10:00",
    })
    const cell2 = screen.getByRole("gridcell", {
      name: "Monday, 10:00 – 11:00",
    })

    fireEvent.pointerDown(cell1, { button: 0 })
    fireEvent.pointerEnter(cell2)
    fireEvent.pointerUp(window)

    expect(onValueChange).toHaveBeenLastCalledWith([
      { day: "MO", start: "09:00", end: "11:00" },
    ])
  })

  it("navigates cells via Arrow keys", () => {
    render(<AvailabilityGrid startHour={9} endHour={11} slotMinutes={60} />)

    const cell1 = screen.getByRole("gridcell", {
      name: "Monday, 09:00 – 10:00",
    })
    const cellRight = screen.getByRole("gridcell", {
      name: "Tuesday, 09:00 – 10:00",
    })
    const cellDown = screen.getByRole("gridcell", {
      name: "Tuesday, 10:00 – 11:00",
    })

    cell1.focus()
    expect(cell1).toHaveAttribute("tabindex", "0")

    fireEvent.keyDown(cell1, { key: "ArrowRight" })
    expect(cellRight).toHaveFocus()

    fireEvent.keyDown(cellRight, { key: "ArrowDown" })
    expect(cellDown).toHaveFocus()
  })

  it("toggles focused cell with Space key", () => {
    const onValueChange = vi.fn()
    render(
      <AvailabilityGrid
        onValueChange={onValueChange}
        startHour={9}
        endHour={11}
        slotMinutes={60}
      />
    )

    const cell = screen.getByRole("gridcell", {
      name: "Monday, 09:00 – 10:00",
    })
    cell.focus()

    fireEvent.keyDown(cell, { key: " " })
    expect(onValueChange).toHaveBeenCalledWith([
      { day: "MO", start: "09:00", end: "10:00" },
    ])
  })

  it("extends selection with Shift + Arrow keys", () => {
    const onValueChange = vi.fn()
    render(
      <AvailabilityGrid
        onValueChange={onValueChange}
        startHour={9}
        endHour={11}
        slotMinutes={60}
      />
    )

    const cell = screen.getByRole("gridcell", {
      name: "Monday, 09:00 – 10:00",
    })
    cell.focus()

    fireEvent.keyDown(cell, { key: "ArrowRight", shiftKey: true })
    expect(onValueChange).toHaveBeenCalledWith([
      { day: "MO", start: "09:00", end: "10:00" },
      { day: "TU", start: "09:00", end: "10:00" },
    ])
  })

  it("converts timezone and calls onValueChange when timeZone prop changes", () => {
    const onValueChange = vi.fn()
    const initial: AvailabilityRange[] = [
      { day: "MO", start: "09:00", end: "17:00" },
    ]

    function TestHost() {
      const [tz, setTz] = React.useState("UTC")
      return (
        <div>
          <button type="button" onClick={() => setTz("Europe/Berlin")}>
            Change TZ
          </button>
          <AvailabilityGrid
            value={initial}
            timeZone={tz}
            onValueChange={onValueChange}
            startHour={8}
            endHour={20}
          />
        </div>
      )
    }

    render(<TestHost />)

    const btn = screen.getByRole("button", { name: "Change TZ" })
    fireEvent.click(btn)

    // Berlin is UTC+1 in winter
    expect(onValueChange).toHaveBeenCalledWith([
      { day: "MO", start: "10:00", end: "18:00" },
    ])
  })

  it("handles Select all and Clear actions", () => {
    const onValueChange = vi.fn()
    render(
      <AvailabilityGrid
        onValueChange={onValueChange}
        startHour={9}
        endHour={10}
        slotMinutes={60}
        weekdays={["MO", "TU"]}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Select all" }))
    expect(onValueChange).toHaveBeenCalledWith([
      { day: "MO", start: "09:00", end: "10:00" },
      { day: "TU", start: "09:00", end: "10:00" },
    ])

    fireEvent.click(screen.getByRole("button", { name: "Clear" }))
    expect(onValueChange).toHaveBeenLastCalledWith([])
  })

  it("disables interactions when disabled is true", () => {
    const onValueChange = vi.fn()
    render(
      <AvailabilityGrid
        disabled
        onValueChange={onValueChange}
        startHour={9}
        endHour={11}
        slotMinutes={60}
      />
    )

    const cell = screen.getByRole("gridcell", {
      name: "Monday, 09:00 – 10:00",
    })
    fireEvent.pointerDown(cell, { button: 0 })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("passes axe-core accessibility checks with 0 violations", async () => {
    const { container } = render(
      <AvailabilityGrid
        defaultValue={[{ day: "MO", start: "09:00", end: "17:00" }]}
        startHour={8}
        endHour={18}
        slotMinutes={60}
      />
    )

    const { violations } = await axe.run(container, {
      rules: { region: { enabled: false } },
    })
    expect(violations).toEqual([])
  })
})
