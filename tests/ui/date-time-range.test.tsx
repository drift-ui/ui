import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderToString } from "react-dom/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  formatRange,
  timeZoneLabel,
} from "@/registry/default/lib/date-time-range"
import { DateTimeRangePicker } from "@/registry/default/ui/date-time-range"

const TODAY = new Date(2026, 2, 9, 10, 0)
const MARCH_10 = new Date(2026, 2, 10, 8, 30)

function dayButton(day: number) {
  return screen.getByRole("button", {
    name: new RegExp(`March ${day}(st|nd|rd|th), 2026`),
  })
}

function typedField() {
  return screen.getByRole("textbox", { name: "Type a range" })
}

function timeField(label: "Start time" | "End time") {
  return screen.getByRole("group", { name: label })
}

function segment(
  label: "Start time" | "End time",
  name: "Hours" | "Minutes" | "AM/PM"
) {
  return within(timeField(label)).getByRole("spinbutton", { name })
}

describe("DateTimeRangePicker", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(TODAY)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows the placeholder until a range is picked", () => {
    render(<DateTimeRangePicker placeholder="Pick a window" />)
    expect(
      screen.getByRole("button", { name: /Pick a window/ })
    ).toHaveAttribute("data-empty")
  })

  it("opens, picks a range, edits both times and closes from the keyboard", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <DateTimeRangePicker
        locale="en-GB"
        numberOfMonths={1}
        onValueChange={onValueChange}
      />
    )

    await user.tab()
    await user.keyboard("{Enter}")
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(dayButton(9)).toHaveFocus()

    await user.keyboard("{Enter}{ArrowRight}{ArrowRight}{ArrowRight}{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith({
      from: new Date(2026, 2, 9, 9, 0),
      to: new Date(2026, 2, 12, 17, 0),
    })

    await user.tab()
    expect(segment("Start time", "Hours")).toHaveFocus()
    await user.keyboard("0745")
    await user.tab()
    expect(segment("End time", "Hours")).toHaveFocus()
    await user.keyboard("{ArrowUp}")
    expect(onValueChange).toHaveBeenLastCalledWith({
      from: new Date(2026, 2, 9, 7, 45),
      to: new Date(2026, 2, 12, 18, 0),
    })

    await user.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(screen.getByRole("button", { name: /9 Mar/ })).toHaveFocus()
  })

  it("leaves a set label out of the server render so it is formatted in the browser's time zone", () => {
    const html = renderToString(
      <DateTimeRangePicker locale="en-US" defaultValue={{ from: MARCH_10 }} />
    )
    expect(html).not.toContain("Mar 10")
    expect(html).not.toContain("Pick a date range")
  })

  it("completes a range and keeps the start time while defaulting the end to 17:00", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <DateTimeRangePicker
        locale="en-US"
        numberOfMonths={1}
        defaultValue={{ from: MARCH_10 }}
        onValueChange={onValueChange}
      />
    )

    await user.click(screen.getByRole("button", { name: /Mar 10, 2026/ }))
    await user.click(dayButton(13))

    const range = onValueChange.mock.lastCall?.[0]
    expect(range.from).toEqual(new Date(2026, 2, 10, 8, 30))
    expect(range.to).toEqual(new Date(2026, 2, 13, 17, 0))
  })

  it("marks a time field disabled until its date is chosen and clears the range", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <DateTimeRangePicker
        locale="en-US"
        numberOfMonths={1}
        defaultValue={{ from: MARCH_10 }}
        onValueChange={onValueChange}
      />
    )

    await user.click(screen.getByRole("button", { name: /Mar 10, 2026/ }))
    expect(timeField("Start time")).not.toHaveAttribute("aria-disabled")
    expect(timeField("End time")).toHaveAttribute("aria-disabled", "true")
    expect(segment("End time", "Hours")).toHaveAttribute("tabindex", "-1")

    await user.click(screen.getByRole("button", { name: "Clear" }))
    expect(onValueChange).toHaveBeenLastCalledWith({})
  })

  it("takes the hour cycle from locale", async () => {
    const user = userEvent.setup()
    const { unmount } = render(<DateTimeRangePicker locale="en-US" />)
    await user.click(screen.getByRole("button", { name: /Pick a date range/ }))
    expect(segment("Start time", "AM/PM")).toBeInTheDocument()
    unmount()

    render(<DateTimeRangePicker locale="de-DE" />)
    await user.click(screen.getByRole("button", { name: /Pick a date range/ }))
    expect(
      within(timeField("Start time")).queryByRole("spinbutton", {
        name: "AM/PM",
      })
    ).toBeNull()
  })

  it("shows the time zone next to each time and describes the field with it", async () => {
    const user = userEvent.setup()
    render(
      <DateTimeRangePicker
        locale="en-US"
        defaultValue={{ from: MARCH_10, to: new Date(2026, 6, 10, 17, 0) }}
      />
    )

    await user.click(screen.getByRole("button", { name: /Mar 10/ }))
    expect(timeField("Start time")).toHaveAccessibleDescription(
      timeZoneLabel(MARCH_10, "en-US")
    )
    expect(timeField("End time")).toHaveAccessibleDescription(
      timeZoneLabel(new Date(2026, 6, 10, 17, 0), "en-US")
    )
  })

  it("applies a preset, marks it pressed and disables presets outside min and max", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const lastWeek = {
      from: new Date(2026, 2, 2, 0, 0),
      to: new Date(2026, 2, 9, 0, 0),
    }
    const lastYear = {
      from: new Date(2025, 2, 9, 0, 0),
      to: new Date(2026, 2, 9, 0, 0),
    }
    render(
      <DateTimeRangePicker
        numberOfMonths={1}
        min={new Date(2026, 0, 1)}
        presets={[
          { label: "Last 7 days", value: lastWeek },
          { label: "Last 12 months", value: lastYear },
          {
            label: "Backwards",
            value: { from: lastWeek.to, to: lastWeek.from },
          },
        ]}
        onValueChange={onValueChange}
      />
    )

    await user.click(screen.getByRole("button", { name: /Pick a date range/ }))
    const presets = within(screen.getByRole("group", { name: "Presets" }))
    expect(
      presets.getByRole("button", { name: "Last 12 months" })
    ).toBeDisabled()
    expect(presets.getByRole("button", { name: "Backwards" })).toBeDisabled()

    await user.click(presets.getByRole("button", { name: "Last 7 days" }))
    expect(onValueChange).toHaveBeenLastCalledWith(lastWeek)
    expect(
      presets.getByRole("button", { name: "Last 7 days" })
    ).toHaveAttribute("aria-pressed", "true")
  })

  it("moves the calendar to the month of a chosen preset", async () => {
    const user = userEvent.setup()
    render(
      <DateTimeRangePicker
        locale="en-US"
        numberOfMonths={1}
        presets={[
          {
            label: "Launch week",
            value: {
              from: new Date(2026, 5, 1, 9, 0),
              to: new Date(2026, 5, 5, 17, 0),
            },
          },
        ]}
      />
    )

    await user.click(screen.getByRole("button", { name: /Pick a date range/ }))
    await user.click(screen.getByRole("button", { name: "Launch week" }))
    expect(screen.getByText("June 2026")).toBeInTheDocument()
  })

  it("disables days outside min and max and clamps times on the edge days", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <DateTimeRangePicker
        locale="en-GB"
        numberOfMonths={1}
        min={new Date(2026, 2, 5, 8, 0)}
        max={new Date(2026, 2, 20, 18, 0)}
        defaultValue={{
          from: new Date(2026, 2, 5, 9, 0),
          to: new Date(2026, 2, 20, 17, 0),
        }}
        onValueChange={onValueChange}
      />
    )

    await user.click(screen.getByRole("button", { name: /5 Mar/ }))
    expect(dayButton(4)).toBeDisabled()
    expect(dayButton(21)).toBeDisabled()
    expect(dayButton(5)).toBeEnabled()

    await user.click(segment("Start time", "Hours"))
    await user.keyboard("06")
    expect(onValueChange.mock.lastCall?.[0].from).toEqual(
      new Date(2026, 2, 5, 8, 0)
    )

    await user.click(segment("End time", "Hours"))
    await user.keyboard("{End}")
    expect(onValueChange.mock.lastCall?.[0].to).toEqual(
      new Date(2026, 2, 20, 18, 0)
    )
  })

  it("keeps the end at or after the start on a one day range", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <DateTimeRangePicker
        locale="en-GB"
        numberOfMonths={1}
        defaultValue={{
          from: new Date(2026, 2, 10, 9, 0),
          to: new Date(2026, 2, 10, 10, 0),
        }}
        onValueChange={onValueChange}
      />
    )

    await user.click(screen.getByRole("button", { name: /10 Mar/ }))
    await user.click(segment("End time", "Hours"))
    await user.keyboard("{Home}")

    expect(onValueChange.mock.lastCall?.[0].to).toEqual(
      new Date(2026, 2, 10, 9, 0)
    )
  })

  it("passes extra props to the trigger", () => {
    render(<DateTimeRangePicker id="window" aria-invalid />)
    const trigger = screen.getByRole("button", { name: /Pick a date range/ })
    expect(trigger).toHaveAttribute("id", "window")
    expect(trigger).toHaveAttribute("aria-invalid", "true")
  })

  it("reaches the typed field from the keyboard, previews the range and applies it on Enter", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <DateTimeRangePicker
        locale="en-US"
        numberOfMonths={1}
        onValueChange={onValueChange}
      />
    )

    await user.tab()
    await user.keyboard("{Enter}")
    expect(dayButton(9)).toHaveFocus()
    for (
      let step = 0;
      step < 5 && document.activeElement !== typedField();
      step++
    ) {
      await user.tab({ shift: true })
    }
    expect(typedField()).toHaveFocus()

    await user.keyboard("last 7 days")
    const lastWeek = {
      from: new Date(2026, 2, 2, 10, 0),
      to: new Date(2026, 2, 9, 10, 0),
    }
    expect(typedField()).toHaveAccessibleDescription(
      formatRange(lastWeek, "en-US") ?? ""
    )
    expect(onValueChange).not.toHaveBeenCalled()

    await user.keyboard("{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith(lastWeek)
    expect(typedField()).toHaveValue("")
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("keeps the range and explains text it can't read once Enter is pressed", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <DateTimeRangePicker
        numberOfMonths={1}
        defaultValue={{ from: MARCH_10 }}
        onValueChange={onValueChange}
      />
    )

    await user.click(screen.getByRole("button", { name: /Mar 10/ }))
    await user.type(typedField(), "next blursday")
    expect(typedField()).not.toHaveAttribute("aria-invalid")
    expect(typedField()).toHaveAccessibleDescription("")

    await user.keyboard("{Enter}")
    expect(onValueChange).not.toHaveBeenCalled()
    expect(typedField()).toHaveAttribute("aria-invalid", "true")
    expect(typedField()).toHaveAccessibleDescription(/Couldn't read/)
    expect(typedField()).toHaveValue("next blursday")

    await user.keyboard("{Backspace}")
    expect(typedField()).not.toHaveAttribute("aria-invalid")
  })

  it("clamps a typed range to min and max and shows its month", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const max = new Date(2026, 3, 2, 18, 0)
    render(
      <DateTimeRangePicker
        locale="en-US"
        numberOfMonths={1}
        max={max}
        onValueChange={onValueChange}
      />
    )

    await user.click(screen.getByRole("button", { name: /Pick a date range/ }))
    await user.type(typedField(), "next 6 weeks{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith({ from: TODAY, to: max })

    await user.type(typedField(), "in 2 months{Enter}")
    expect(typedField()).toHaveAccessibleDescription(/outside the allowed/)
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })

  it("uses a custom parse function with the current time", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const range = {
      from: new Date(2026, 5, 1, 9, 0),
      to: new Date(2026, 5, 5, 17, 0),
    }
    const parse = vi.fn((text: string) => (text === "juni" ? range : null))
    render(
      <DateTimeRangePicker
        locale="en-US"
        numberOfMonths={1}
        parse={parse}
        onValueChange={onValueChange}
      />
    )

    await user.click(screen.getByRole("button", { name: /Pick a date range/ }))
    await user.type(typedField(), "juni{Enter}")
    expect(parse).toHaveBeenLastCalledWith("juni", TODAY)
    expect(onValueChange).toHaveBeenLastCalledWith(range)
    expect(screen.getByText("June 2026")).toBeInTheDocument()
  })

  it("clears typed text when the popover closes", async () => {
    const user = userEvent.setup()
    render(<DateTimeRangePicker numberOfMonths={1} />)

    await user.click(screen.getByRole("button", { name: /Pick a date range/ }))
    await user.type(typedField(), "yesterday")
    await user.keyboard("{Escape}")
    await user.click(screen.getByRole("button", { name: /Pick a date range/ }))
    expect(typedField()).toHaveValue("")
  })

  it("closes the popover with Done", async () => {
    const user = userEvent.setup()
    render(<DateTimeRangePicker numberOfMonths={1} />)

    await user.click(screen.getByRole("button", { name: /Pick a date range/ }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Done" }))
    expect(screen.queryByRole("dialog")).toBeNull()
  })
})
