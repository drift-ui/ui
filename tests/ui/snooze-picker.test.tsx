import * as React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { SnoozePicker } from "@/registry/default/ui/snooze-picker"

// Pinned Monday morning: 2026-05-11 10:00:00
const MONDAY_MORNING = new Date(2026, 4, 11, 10, 0, 0)
// Pinned Monday evening: 2026-05-11 18:00:00
const MONDAY_EVENING = new Date(2026, 4, 11, 18, 0, 0)

function trigger() {
  return screen.getByRole("button", { name: /Snooze/i })
}

describe("SnoozePicker", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(MONDAY_MORNING)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders trigger with placeholder when empty", () => {
    render(<SnoozePicker placeholder="Snooze for later" />)
    const btn = screen.getByRole("button", { name: "Snooze for later" })
    expect(btn).toHaveAttribute("data-empty")
    expect(btn).toHaveAttribute("aria-haspopup", "menu")
    expect(btn).toHaveAttribute("aria-expanded", "false")
  })

  it("renders custom children if passed", () => {
    render(
      <SnoozePicker>
        <span>Custom Snooze Button</span>
      </SnoozePicker>
    )
    expect(
      screen.getByRole("button", { name: "Custom Snooze Button" })
    ).toBeInTheDocument()
  })

  it("renders icon size with sr-only label", () => {
    render(<SnoozePicker size="icon" placeholder="Snooze" />)
    const btn = screen.getByRole("button", { name: "Snooze" })
    expect(btn).toBeInTheDocument()
  })

  it("renders formatted date on trigger when value is set", () => {
    const target = new Date(2026, 4, 12, 9, 0, 0)
    render(<SnoozePicker value={target} now={MONDAY_MORNING} hourCycle={24} />)
    expect(
      screen.getByRole("button", { name: /Tomorrow · Tue/ })
    ).toBeInTheDocument()
  })

  it("opens popover on click and shows menu items with relative labels", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<SnoozePicker now={MONDAY_MORNING} />)

    await user.click(trigger())
    const menu = await screen.findByRole("menu", { name: "Snooze options" })
    expect(menu).toBeInTheDocument()

    const items = screen.getAllByRole("menuitem")
    expect(items.length).toBe(5) // later-today, tomorrow, this-weekend, next-week, custom

    expect(items[0]).toHaveTextContent("Later today")
    expect(items[1]).toHaveTextContent("Tomorrow")
    expect(items[2]).toHaveTextContent("This weekend")
    expect(items[3]).toHaveTextContent("Next week")
    expect(items[4]).toHaveTextContent("Pick date and time...")
  })

  it("hides later-today preset when evening has passed", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<SnoozePicker now={MONDAY_EVENING} />)

    await user.click(trigger())
    await screen.findByRole("menu", { name: "Snooze options" })

    expect(screen.queryByText("Later today")).not.toBeInTheDocument()
    expect(screen.getByText("Tomorrow")).toBeInTheDocument()
  })

  it("selects a preset on click and fires callbacks", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onValueChange = vi.fn()
    const onSelect = vi.fn()

    render(
      <SnoozePicker
        now={MONDAY_MORNING}
        onValueChange={onValueChange}
        onSelect={onSelect}
      />
    )

    await user.click(trigger())
    const tomorrowBtn = await screen.findByRole("menuitem", {
      name: /Tomorrow/i,
    })

    await user.click(tomorrowBtn)

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledTimes(1)
    const [selectedDate, presetId] = onSelect.mock.calls[0]
    expect(presetId).toBe("tomorrow")
    expect(selectedDate.getDate()).toBe(12)
    expect(selectedDate.getHours()).toBe(9)

    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    })
  })

  it("navigates presets with keyboard (ArrowDown, ArrowUp, Home, End, Escape)", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<SnoozePicker now={MONDAY_MORNING} />)

    await user.click(trigger())
    await screen.findByRole("menu")
    const items = screen.getAllByRole("menuitem")

    // Initially first item receives focus after timeout
    await waitFor(() => expect(items[0]).toHaveFocus())

    // ArrowDown moves to next item
    await user.keyboard("{ArrowDown}")
    expect(items[1]).toHaveFocus()

    // End moves to last item (custom)
    await user.keyboard("{End}")
    expect(items[items.length - 1]).toHaveFocus()

    // Home moves to first item
    await user.keyboard("{Home}")
    expect(items[0]).toHaveFocus()

    // ArrowUp wraps to last item
    await user.keyboard("{ArrowUp}")
    expect(items[items.length - 1]).toHaveFocus()

    // Escape closes popover
    await user.keyboard("{Escape}")
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    })
  })

  it("switches to custom date-time picker and allows returning via Back or Cancel", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<SnoozePicker now={MONDAY_MORNING} />)

    await user.click(trigger())
    const customItem = await screen.findByRole("menuitem", {
      name: /Pick date and time/i,
    })
    await user.click(customItem)

    // Header in custom view
    expect(screen.getByText("Pick date and time")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Back to presets" })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()

    // Clicking Back button returns to presets
    await user.click(screen.getByRole("button", { name: "Back to presets" }))
    expect(await screen.findByRole("menu")).toBeInTheDocument()
    expect(
      screen.getByRole("menuitem", { name: /Tomorrow/i })
    ).toBeInTheDocument()

    // Go back to custom view and click Cancel
    await user.click(
      screen.getByRole("menuitem", { name: /Pick date and time/i })
    )
    expect(screen.getByText("Pick date and time")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(await screen.findByRole("menu")).toBeInTheDocument()
  })

  it("selects custom date and time and saves", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onSelect = vi.fn()
    const onValueChange = vi.fn()

    render(
      <SnoozePicker
        now={MONDAY_MORNING}
        onSelect={onSelect}
        onValueChange={onValueChange}
      />
    )

    await user.click(trigger())
    await user.click(
      await screen.findByRole("menuitem", { name: /Pick date and time/i })
    )

    // Click day 20 in the calendar
    const dayBtn = screen.getByRole("button", {
      name: /May 20th, 2026/i,
    })
    await user.click(dayBtn)

    // Click Save
    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(onSelect).toHaveBeenCalledTimes(1)
    const [savedDate, preset] = onSelect.mock.calls[0]
    expect(preset).toBe("custom")
    expect(savedDate.getDate()).toBe(20)
    expect(savedDate.getMonth()).toBe(4)

    await waitFor(() => {
      expect(screen.queryByText("Pick date and time")).not.toBeInTheDocument()
    })
  })

  it("renders a hidden input when name is provided", () => {
    const date = new Date(2026, 4, 15, 9, 0, 0)
    const { container } = render(
      <SnoozePicker name="snooze_until" value={date} />
    )
    const hidden = container.querySelector(
      'input[type="hidden"][name="snooze_until"]'
    )
    expect(hidden).toBeInTheDocument()
    expect((hidden as HTMLInputElement).value).toBe(date.toISOString())
  })
})
