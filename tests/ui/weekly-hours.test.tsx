import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"
import * as React from "react"
import { describe, expect, it, vi } from "vitest"

import { examples } from "@/components/preview/examples/weekly-hours"
import { WeeklyHoursShopHoursPreview } from "@/components/preview/examples/weekly-hours/shop-hours"
import { WeeklyHoursWorkweekPreview } from "@/components/preview/examples/weekly-hours/workweek"
import { WeeklyHoursPreview } from "@/components/preview/weekly-hours-preview"
import {
  WeeklyHours,
  type WeeklyHoursRange,
} from "@/registry/default/ui/weekly-hours"

const MONDAY: WeeklyHoursRange[] = [{ day: "MO", start: "09:00", end: "17:00" }]

function Controlled({
  initial,
  onChange,
}: {
  initial: WeeklyHoursRange[]
  onChange?: (value: WeeklyHoursRange[]) => void
}) {
  const [value, setValue] = React.useState(initial)
  return (
    <WeeklyHours
      value={value}
      onValueChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
    />
  )
}

describe("WeeklyHours", () => {
  it("shows a row per day with times for available days", () => {
    render(<WeeklyHours defaultValue={MONDAY} />)

    expect(screen.getByRole("checkbox", { name: "Monday" })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "Sunday" })).not.toBeChecked()
    expect(
      screen.getByRole("group", { name: "Monday start" })
    ).toBeInTheDocument()
    expect(screen.getAllByText("Unavailable")).toHaveLength(6)
  })

  it("turns a day on with the default range and off again", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Controlled initial={MONDAY} onChange={onChange} />)

    await user.click(screen.getByRole("checkbox", { name: "Wednesday" }))
    expect(onChange).toHaveBeenLastCalledWith([
      { day: "MO", start: "09:00", end: "17:00" },
      { day: "WE", start: "09:00", end: "17:00" },
    ])

    await user.click(screen.getByRole("checkbox", { name: "Monday" }))
    expect(onChange).toHaveBeenLastCalledWith([
      { day: "WE", start: "09:00", end: "17:00" },
    ])
  })

  it("adds a split shift, labels each range, and removes it", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Controlled initial={MONDAY} onChange={onChange} />)

    await user.click(
      screen.getByRole("button", { name: "Add hours on Monday" })
    )
    expect(
      screen.getByRole("group", { name: "Monday, range 2 start" })
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Remove Monday, range 1" })
    )
    expect(onChange).toHaveBeenLastCalledWith([
      { day: "MO", start: "18:00", end: "19:00" },
    ])
    expect(screen.getAllByRole("group", { name: /^Monday/ })).toHaveLength(2)
  })

  it("changes a time from the keyboard", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Controlled initial={MONDAY} onChange={onChange} />)

    const end = screen.getByRole("group", { name: "Monday end" })
    await user.click(end.querySelector<HTMLElement>("[role=spinbutton]")!)
    await user.keyboard("{ArrowUp}")
    expect(onChange).toHaveBeenLastCalledWith([
      { day: "MO", start: "09:00", end: "18:00" },
    ])

    const start = screen.getByRole("group", { name: "Monday start" })
    await user.click(start.querySelector<HTMLElement>("[role=spinbutton]")!)
    await user.keyboard("{ArrowDown}")
    expect(onChange).toHaveBeenLastCalledWith([
      { day: "MO", start: "08:00", end: "18:00" },
    ])
  })

  it("flags a range that overlaps another", () => {
    render(
      <WeeklyHours
        defaultValue={[
          { day: "MO", start: "09:00", end: "12:00" },
          { day: "MO", start: "11:00", end: "14:00" },
        ]}
      />
    )
    expect(screen.getAllByText("Overlaps another time range")).toHaveLength(2)
    expect(
      screen.getByRole("group", { name: "Monday, range 1 start" })
    ).toHaveAttribute("aria-invalid", "true")
  })

  it("copies a day's hours to every other available day", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Controlled
        initial={[
          { day: "MO", start: "08:00", end: "14:00" },
          { day: "TU", start: "09:00", end: "17:00" },
        ]}
        onChange={onChange}
      />
    )

    await user.click(
      screen.getByRole("button", {
        name: "Copy Monday hours to every available day",
      })
    )
    expect(onChange).toHaveBeenLastCalledWith([
      { day: "MO", start: "08:00", end: "14:00" },
      { day: "TU", start: "08:00", end: "14:00" },
    ])
    expect(
      screen.getByRole("button", {
        name: "Copy Sunday hours to every available day",
      })
    ).toBeDisabled()
  })

  it("disables copy when no other day has hours", () => {
    render(<WeeklyHours defaultValue={MONDAY} aria-label="Hours" />)
    expect(screen.getByRole("group", { name: "Hours" })).toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: "Copy Monday hours to every available day",
      })
    ).toBeDisabled()
  })

  it("blocks adding a range while a day has a missing time", () => {
    render(
      <WeeklyHours defaultValue={[{ day: "MO", start: "09:00", end: "" }]} />
    )
    expect(
      screen.getByRole("button", { name: "Add hours on Monday" })
    ).toBeDisabled()
  })

  it("respects weekdays, unavailableLabel and disabled", () => {
    render(
      <WeeklyHours
        weekdays={["SA", "SU"]}
        unavailableLabel="Closed"
        disabled
        data-testid="root"
        className="custom"
      />
    )
    expect(screen.getAllByRole("checkbox")).toHaveLength(2)
    expect(screen.getAllByText("Closed")).toHaveLength(2)
    expect(screen.getByRole("checkbox", { name: "Saturday" })).toBeDisabled()
    expect(screen.getByTestId("root")).toHaveClass("custom")
  })

  it("renders the preview and examples", async () => {
    const user = userEvent.setup()
    render(<WeeklyHoursPreview />)
    expect(
      screen.getByRole("group", { name: "Tuesday, range 2 end" })
    ).toBeInTheDocument()

    render(<WeeklyHoursShopHoursPreview />)
    expect(screen.getAllByText("Closed").length).toBeGreaterThan(0)

    const { getByRole, getByText } = render(<WeeklyHoursWorkweekPreview />)
    expect(getByText("MO 10:00–16:00, WE 10:00–16:00")).toBeInTheDocument()
    const rota = within(getByRole("group", { name: "Support rota" }))
    await user.click(rota.getByRole("checkbox", { name: "Monday" }))
    await user.click(rota.getByRole("checkbox", { name: "Wednesday" }))
    expect(getByText("No hours set")).toBeInTheDocument()

    expect(examples.map((example) => example.id)).toEqual([
      "shop-hours",
      "workweek",
    ])
  })

  it("has no axe violations", async () => {
    const { container } = render(
      <WeeklyHours
        defaultValue={[...MONDAY, { day: "TU", start: "17:00", end: "09:00" }]}
      />
    )
    const { violations } = await axe.run(container, {
      rules: { region: { enabled: false } },
    })
    expect(violations).toEqual([])
  })
})
