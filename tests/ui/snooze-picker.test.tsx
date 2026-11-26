import * as React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { SnoozePickerNotificationPreview } from "@/components/preview/examples/snooze-picker/notification"
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

  it("opens popover on click and shows menu items with relative labels and aria-checked", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<SnoozePicker now={MONDAY_MORNING} />)

    await user.click(trigger())
    const menu = await screen.findByRole("menu", { name: "Snooze options" })
    expect(menu).toBeInTheDocument()

    const radios = screen.getAllByRole("menuitemradio")
    expect(radios.length).toBe(4) // later-today, tomorrow, this-weekend, next-week
    expect(radios[0]).toHaveTextContent("Later today")
    expect(radios[0]).toHaveAttribute("aria-checked", "false")
    expect(radios[1]).toHaveTextContent("Tomorrow")
    expect(radios[2]).toHaveTextContent("This weekend")
    expect(radios[3]).toHaveTextContent("Next week")

    const custom = screen.getByRole("menuitem", { name: /Pick date and time/i })
    expect(custom).toBeInTheDocument()
  })

  it("indicates selected preset with aria-checked when value matches", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    // Tomorrow morning: 2026-05-12 09:00:00
    const tomorrow = new Date(2026, 4, 12, 9, 0, 0)
    render(<SnoozePicker value={tomorrow} now={MONDAY_MORNING} />)

    await user.click(screen.getByRole("button", { name: /Tomorrow/i }))
    await screen.findByRole("menu", { name: "Snooze options" })

    const tomorrowRadio = screen.getByRole("menuitemradio", {
      name: /Tomorrow/i,
    })
    expect(tomorrowRadio).toHaveAttribute("aria-checked", "true")
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
    const tomorrowBtn = await screen.findByRole("menuitemradio", {
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
    const menu = await screen.findByRole("menu")
    const items = Array.from(
      menu.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"], [role="menuitemradio"]'
      )
    )

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

  it("opens custom view when pressing ArrowRight on the last preset item", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<SnoozePicker now={MONDAY_MORNING} />)

    await user.click(trigger())
    const menu = await screen.findByRole("menu")
    const items = Array.from(
      menu.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"], [role="menuitemradio"]'
      )
    )

    // Focus last item
    await user.keyboard("{End}")
    expect(items[items.length - 1]).toHaveFocus()

    // ArrowRight on last item opens custom view
    await user.keyboard("{ArrowRight}")
    expect(await screen.findByText("Pick date and time")).toBeInTheDocument()
  })

  it("switches to custom date-time picker and allows returning via Back or Cancel", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<SnoozePicker now={MONDAY_MORNING} />)

    await user.click(trigger())
    const customItem = await screen.findByRole("menuitem", {
      name: /Pick date and time/i,
    })
    await user.click(customItem)

    // Header in custom view and auto-focused Back button
    expect(screen.getByText("Pick date and time")).toBeInTheDocument()
    const backBtn = screen.getByRole("button", { name: "Back to presets" })
    expect(backBtn).toBeInTheDocument()
    await waitFor(() => expect(backBtn).toHaveFocus())

    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()

    // Clicking Back button returns to presets
    await user.click(backBtn)
    expect(await screen.findByRole("menu")).toBeInTheDocument()
    expect(
      screen.getByRole("menuitemradio", { name: /Tomorrow/i })
    ).toBeInTheDocument()

    // Go back to custom view and click Cancel
    await user.click(
      screen.getByRole("menuitem", { name: /Pick date and time/i })
    )
    expect(screen.getByText("Pick date and time")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(await screen.findByRole("menu")).toBeInTheDocument()
  })

  it("selects custom date and edits time before saving", async () => {
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

    // Edit time in TimeField: change hour and minute
    const hoursSpin = screen.getByRole("spinbutton", { name: "Hours" })
    await user.click(hoursSpin)
    await user.keyboard("1430")

    // Click Save
    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(onSelect).toHaveBeenCalledTimes(1)
    const [savedDate, preset] = onSelect.mock.calls[0]
    expect(preset).toBe("custom")
    expect(savedDate.getDate()).toBe(20)
    expect(savedDate.getMonth()).toBe(4)
    expect(savedDate.getHours()).toBe(14)
    expect(savedDate.getMinutes()).toBe(30)

    await waitFor(() => {
      expect(screen.queryByText("Pick date and time")).not.toBeInTheDocument()
    })
  })

  it("disables Save button when customTime is cleared", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<SnoozePicker now={MONDAY_MORNING} />)

    await user.click(trigger())
    await user.click(
      await screen.findByRole("menuitem", { name: /Pick date and time/i })
    )

    const saveBtn = screen.getByRole("button", { name: "Save" })
    expect(saveBtn).not.toBeDisabled()

    // Clear time in TimeField with Backspace
    const hoursSpin = screen.getByRole("spinbutton", { name: "Hours" })
    await user.click(hoursSpin)
    await user.keyboard("{Backspace}")

    expect(saveBtn).toBeDisabled()
  })

  it("respects min and max date constraints in calendar", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const minDate = new Date(2026, 4, 15)
    const maxDate = new Date(2026, 4, 25)

    render(<SnoozePicker now={MONDAY_MORNING} min={minDate} max={maxDate} />)

    await user.click(trigger())
    await user.click(
      await screen.findByRole("menuitem", { name: /Pick date and time/i })
    )

    // Day 10 is before min -> should be disabled
    const day10 = screen.getByRole("button", { name: /May 10th, 2026/i })
    expect(day10).toHaveAttribute("disabled")

    // Day 20 is within range -> enabled
    const day20 = screen.getByRole("button", { name: /May 20th, 2026/i })
    expect(day20).not.toHaveAttribute("disabled")

    // Day 28 is after max -> disabled
    const day28 = screen.getByRole("button", { name: /May 28th, 2026/i })
    expect(day28).toHaveAttribute("disabled")
  })

  it("opens popover initially when defaultOpen is true", () => {
    render(<SnoozePicker defaultOpen now={MONDAY_MORNING} />)
    expect(
      screen.getByRole("menu", { name: "Snooze options" })
    ).toBeInTheDocument()
  })

  it("renders a disabled hidden input and disabled trigger when disabled is true", () => {
    const date = new Date(2026, 4, 15, 9, 0, 0)
    const { container } = render(
      <SnoozePicker disabled name="snooze_until" value={date} />
    )
    const triggerBtn = screen.getByRole("button", { name: /Fri/i })
    expect(triggerBtn).toBeDisabled()

    const hidden = container.querySelector(
      'input[type="hidden"][name="snooze_until"]'
    )
    expect(hidden).toBeInTheDocument()
    expect(hidden).toBeDisabled()
    expect((hidden as HTMLInputElement).value).toBe(date.toISOString())
  })

  it("works seamlessly inside SnoozePickerNotificationPreview example", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<SnoozePickerNotificationPreview />)

    expect(
      screen.getByText("Production database replica CPU high")
    ).toBeInTheDocument()

    const snoozeBtn = screen.getByRole("button", { name: "Snooze alert" })
    await user.click(snoozeBtn)

    const tomorrowBtn = await screen.findByRole("menuitemradio", {
      name: /Tomorrow/i,
    })
    await user.click(tomorrowBtn)

    expect(screen.getByText(/Snoozed until/i)).toBeInTheDocument()
  })
})
