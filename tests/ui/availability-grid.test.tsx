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
    expect(onValueChange).toHaveBeenCalledTimes(1)
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
    expect(onValueChange).toHaveBeenCalledTimes(1)
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

  it("handles Select all and Clear actions, clearing out-of-window availability too", () => {
    const onValueChange = vi.fn()
    const value: AvailabilityRange[] = [
      { day: "MO", start: "06:00", end: "08:00" }, // out of window
    ]
    render(
      <AvailabilityGrid
        value={value}
        onValueChange={onValueChange}
        startHour={9}
        endHour={10}
        slotMinutes={60}
        weekdays={["MO", "TU"]}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Select all" }))
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith([
      { day: "MO", start: "06:00", end: "08:00" },
      { day: "MO", start: "09:00", end: "10:00" },
      { day: "TU", start: "09:00", end: "10:00" },
    ])

    fireEvent.click(screen.getByRole("button", { name: "Clear" }))
    expect(onValueChange).toHaveBeenCalledTimes(2)
    expect(onValueChange).toHaveBeenLastCalledWith([])
  })

  it("selects all displayed slots on Select all button click", () => {
    const onValueChange = vi.fn()
    render(
      <AvailabilityGrid
        onValueChange={onValueChange}
        startHour={9}
        endHour={11}
        slotMinutes={60}
        weekdays={["MO", "TU"]}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Select all" }))
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith([
      { day: "MO", start: "09:00", end: "11:00" },
      { day: "TU", start: "09:00", end: "11:00" },
    ])
  })

  it("clears mouse dragging state when pointerup fires on window outside grid", () => {
    const onValueChange = vi.fn()
    render(
      <AvailabilityGrid
        onValueChange={onValueChange}
        startHour={9}
        endHour={11}
        slotMinutes={60}
      />
    )

    const cell1 = screen.getByRole("gridcell", {
      name: "Monday, 09:00 – 10:00",
    })
    const cell2 = screen.getByRole("gridcell", {
      name: "Monday, 10:00 – 11:00",
    })

    fireEvent.pointerDown(cell1, { button: 0, pointerType: "mouse" })
    expect(onValueChange).toHaveBeenCalledTimes(1)

    // Release pointer outside grid on window
    fireEvent.pointerUp(window)

    // Subsequent pointerEnter should NOT select since drag state is cleared
    fireEvent.pointerEnter(cell2)
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })

  it("converts timezone even if parent recreates array reference with same ranges", () => {
    const onValueChange = vi.fn()
    function Host() {
      const [tz, setTz] = React.useState("UTC")
      const current = [{ day: "MO" as const, start: "09:00", end: "17:00" }]
      return (
        <div>
          <button type="button" onClick={() => setTz("Europe/Berlin")}>
            Switch
          </button>
          <AvailabilityGrid
            value={current}
            onValueChange={onValueChange}
            timeZone={tz}
            startHour={8}
            endHour={20}
          />
        </div>
      )
    }

    render(<Host />)
    fireEvent.click(screen.getByRole("button", { name: "Switch" }))
    expect(onValueChange).toHaveBeenCalledWith([
      { day: "MO", start: "10:00", end: "18:00" },
    ])
  })

  it("navigates grid using arrow keys, Home, End, PageUp, and PageDown", () => {
    render(
      <AvailabilityGrid
        startHour={8}
        endHour={14}
        slotMinutes={60}
        weekdays={["MO", "TU", "WE"]}
      />
    )

    const cell00 = screen.getByRole("gridcell", {
      name: "Monday, 08:00 – 09:00",
    })
    cell00.focus()

    // ArrowDown
    fireEvent.keyDown(cell00, { key: "ArrowDown" })
    const cell10 = screen.getByRole("gridcell", {
      name: "Monday, 09:00 – 10:00",
    })
    expect(cell10).toHaveFocus()

    // ArrowRight
    fireEvent.keyDown(cell10, { key: "ArrowRight" })
    const cell11 = screen.getByRole("gridcell", {
      name: "Tuesday, 09:00 – 10:00",
    })
    expect(cell11).toHaveFocus()

    // ArrowUp
    fireEvent.keyDown(cell11, { key: "ArrowUp" })
    const cell01 = screen.getByRole("gridcell", {
      name: "Tuesday, 08:00 – 09:00",
    })
    expect(cell01).toHaveFocus()

    // ArrowLeft
    fireEvent.keyDown(cell01, { key: "ArrowLeft" })
    expect(cell00).toHaveFocus()

    // End (last column)
    fireEvent.keyDown(cell00, { key: "End" })
    const cell02 = screen.getByRole("gridcell", {
      name: "Wednesday, 08:00 – 09:00",
    })
    expect(cell02).toHaveFocus()

    // Home (first column)
    fireEvent.keyDown(cell02, { key: "Home" })
    expect(cell00).toHaveFocus()

    // PageDown (jump 4 slots)
    fireEvent.keyDown(cell00, { key: "PageDown" })
    const cell40 = screen.getByRole("gridcell", {
      name: "Monday, 12:00 – 13:00",
    })
    expect(cell40).toHaveFocus()

    // PageUp (jump 4 slots back)
    fireEvent.keyDown(cell40, { key: "PageUp" })
    expect(cell00).toHaveFocus()

    // Unhandled key
    fireEvent.keyDown(cell00, { key: "a" })
    expect(cell00).toHaveFocus()
  })

  it("prevents modifications in readOnly mode", () => {
    const onValueChange = vi.fn()
    render(
      <AvailabilityGrid
        readOnly
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

    fireEvent.keyDown(cell, { key: " " })
    expect(onValueChange).not.toHaveBeenCalled()

    expect(screen.queryByRole("button", { name: "Select all" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull()
  })

  it("supports touch dragging across cells via touch move", () => {
    const onValueChange = vi.fn()
    render(
      <AvailabilityGrid
        onValueChange={onValueChange}
        startHour={9}
        endHour={11}
        slotMinutes={60}
      />
    )

    const cell1 = screen.getByRole("gridcell", {
      name: "Monday, 09:00 – 10:00",
    })
    const cell2 = screen.getByRole("gridcell", {
      name: "Monday, 10:00 – 11:00",
    })

    cell1.setPointerCapture = vi.fn()
    cell1.hasPointerCapture = vi.fn().mockReturnValue(true)
    cell1.releasePointerCapture = vi.fn()

    fireEvent.pointerDown(cell1, {
      button: 0,
      pointerType: "touch",
      pointerId: 1,
    })
    expect(onValueChange).toHaveBeenCalledTimes(1)

    const originalElementFromPoint = document.elementFromPoint
    document.elementFromPoint = vi.fn().mockReturnValue(cell2)

    const table = screen.getByRole("grid")
    // Non-touch pointer move is ignored by handleTouchMove
    fireEvent.pointerMove(table, {
      pointerType: "mouse",
      clientX: 10,
      clientY: 10,
    })
    expect(onValueChange).toHaveBeenCalledTimes(1)

    fireEvent.pointerMove(table, {
      pointerType: "touch",
      clientX: 10,
      clientY: 10,
    })
    expect(onValueChange).toHaveBeenCalledTimes(2)

    fireEvent.pointerUp(cell1, { pointerType: "touch", pointerId: 1 })
    document.elementFromPoint = originalElementFromPoint
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

  it("composes caller-provided onPointerUp and ends dragging", () => {
    const onPointerUp = vi.fn()
    const onValueChange = vi.fn()
    const { container } = render(
      <AvailabilityGrid
        onPointerUp={onPointerUp}
        onValueChange={onValueChange}
        startHour={9}
        endHour={11}
        slotMinutes={60}
      />
    )

    const cell1 = screen.getByRole("gridcell", {
      name: "Monday, 09:00 – 10:00",
    })
    const cell2 = screen.getByRole("gridcell", {
      name: "Tuesday, 09:00 – 10:00",
    })

    fireEvent.pointerDown(cell1, { button: 0 })
    expect(onValueChange).toHaveBeenCalledTimes(1)

    const root = container.firstElementChild as HTMLElement
    fireEvent.pointerUp(root)
    expect(onPointerUp).toHaveBeenCalledTimes(1)

    // Pointer enter should not trigger another selection because dragging has ended
    fireEvent.pointerEnter(cell2)
    expect(onValueChange).toHaveBeenCalledTimes(1)
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
