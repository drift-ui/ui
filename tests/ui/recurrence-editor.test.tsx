import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { RecurrenceEditor } from "@/registry/default/ui/recurrence-editor"

const TUESDAY = new Date(2026, 10, 3, 10, 0)

function summary() {
  return document.querySelector("[data-slot=recurrence-editor-summary]")
}

describe("RecurrenceEditor", () => {
  it("shows the summary and the next occurrences for a rule", () => {
    render(
      <RecurrenceEditor
        aria-label="Repeat"
        defaultValue="FREQ=WEEKLY;INTERVAL=2;BYDAY=TU"
        start={TUESDAY}
        showPreview={3}
      />
    )

    expect(summary()).toHaveTextContent("Every 2 weeks on Tuesday")
    expect(screen.getByLabelText("Repeat every")).toHaveValue("2")
    expect(screen.getByRole("button", { name: "Tuesday" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(
      within(screen.getByRole("list", { name: "Next occurrences" }))
        .getAllByRole("listitem")
        .map((item) => item.textContent)
    ).toEqual(
      [
        new Date(2026, 10, 3),
        new Date(2026, 10, 17),
        new Date(2026, 11, 1),
      ].map((date) =>
        date.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      )
    )
  })

  it("changes the interval from the keyboard", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <RecurrenceEditor
        aria-label="Repeat"
        start={TUESDAY}
        onValueChange={onValueChange}
      />
    )

    await user.click(screen.getByLabelText("Repeat every"))
    await user.keyboard("{ArrowUp}{ArrowUp}")

    expect(onValueChange).toHaveBeenLastCalledWith("FREQ=WEEKLY;INTERVAL=3")
    expect(summary()).toHaveTextContent("Every 3 weeks on Tuesday")
  })

  it("toggles weekdays with the keyboard and keeps at least one", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <RecurrenceEditor
        aria-label="Repeat"
        start={TUESDAY}
        onValueChange={onValueChange}
      />
    )

    screen.getByRole("button", { name: "Thursday" }).focus()
    await user.keyboard("{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith("FREQ=WEEKLY;BYDAY=TU,TH")

    await user.click(screen.getByRole("button", { name: "Tuesday" }))
    await user.click(screen.getByRole("button", { name: "Thursday" }))
    expect(onValueChange).toHaveBeenLastCalledWith("FREQ=WEEKLY;BYDAY=TH")
    expect(screen.getByRole("button", { name: "Thursday" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })

  it("switches frequency and offers monthly choices from the start date", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <RecurrenceEditor
        aria-label="Repeat"
        start={new Date(2026, 10, 27)}
        onValueChange={onValueChange}
      />
    )

    await user.selectOptions(screen.getByLabelText("Frequency"), "MONTHLY")
    expect(onValueChange).toHaveBeenLastCalledWith("FREQ=MONTHLY;BYMONTHDAY=27")
    expect(
      within(screen.getByLabelText("Day of the month"))
        .getAllByRole("option")
        .map((option) => option.textContent)
    ).toEqual(["On day 27", "On the fourth Friday", "On the last Friday"])

    await user.selectOptions(
      screen.getByLabelText("Day of the month"),
      "On the last Friday"
    )
    expect(onValueChange).toHaveBeenLastCalledWith("FREQ=MONTHLY;BYDAY=-1FR")
    expect(summary()).toHaveTextContent("Monthly on the last Friday")
  })

  it("ends after a count or on a date", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <RecurrenceEditor
        aria-label="Repeat"
        defaultValue="FREQ=DAILY"
        start={TUESDAY}
        onValueChange={onValueChange}
      />
    )
    const endDate = screen.getByLabelText("End date")
    expect(endDate).toBeDisabled()

    await user.click(screen.getByRole("radio", { name: "After" }))
    expect(onValueChange).toHaveBeenLastCalledWith("FREQ=DAILY;COUNT=10")
    expect(summary()).toHaveTextContent("Daily, 10 times")

    await user.click(screen.getByRole("radio", { name: "On" }))
    expect(endDate).toBeEnabled()
    fireEvent.change(endDate, { target: { value: "2026-12-31" } })
    expect(summary()).toHaveTextContent("Daily until Dec 31, 2026")
    expect(onValueChange.mock.lastCall?.[0]).toMatch(
      /^FREQ=DAILY;UNTIL=2026\d{4}T\d{6}Z$/
    )

    await user.click(screen.getByRole("radio", { name: "Never" }))
    expect(onValueChange).toHaveBeenLastCalledWith("FREQ=DAILY")
  })

  it("works controlled and disables every control", () => {
    render(
      <RecurrenceEditor
        aria-label="Repeat"
        value="FREQ=YEARLY"
        start={TUESDAY}
        disabled
      />
    )

    expect(summary()).toHaveTextContent("Yearly on November 3")
    expect(screen.getByLabelText("Frequency")).toBeDisabled()
    expect(screen.getByRole("radio", { name: "Never" })).toBeDisabled()
  })

  it("preserves unknown rules like WKST and BYHOUR during user edits", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <RecurrenceEditor
        aria-label="Repeat"
        defaultValue="FREQ=WEEKLY;INTERVAL=2;BYDAY=TU;WKST=SU;BYHOUR=9"
        start={TUESDAY}
        onValueChange={onValueChange}
      />
    )

    expect(
      document.querySelector("[data-slot=recurrence-editor-custom-parts]")
    ).toHaveTextContent("Preserving custom rules: WKST, BYHOUR")

    await user.click(screen.getByLabelText("Repeat every"))
    await user.keyboard("{ArrowUp}")

    expect(onValueChange).toHaveBeenLastCalledWith(
      "FREQ=WEEKLY;INTERVAL=3;BYDAY=TU;WKST=SU;BYHOUR=9"
    )
  })

  it("supports monthly choice with BYSETPOS and selects it", () => {
    const onValueChange = vi.fn()
    render(
      <RecurrenceEditor
        aria-label="Repeat"
        defaultValue="FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1"
        start={TUESDAY}
        onValueChange={onValueChange}
      />
    )

    expect(summary()).toHaveTextContent("Monthly on the last weekday")
    const select = screen.getByLabelText("Day of the month")
    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => option.textContent)
    ).toContain("On the last weekday")
    expect(select).toHaveDisplayValue("On the last weekday")
  })

  it("filters excluded dates passed via exdates in the occurrences preview", () => {
    render(
      <RecurrenceEditor
        aria-label="Repeat"
        defaultValue="FREQ=WEEKLY;BYDAY=TU"
        start={TUESDAY}
        showPreview={3}
        exdates={[new Date(2026, 10, 10)]}
      />
    )

    expect(
      within(screen.getByRole("list", { name: "Next occurrences" }))
        .getAllByRole("listitem")
        .map((item) => item.textContent)
    ).toEqual(
      [
        new Date(2026, 10, 3),
        new Date(2026, 10, 17),
        new Date(2026, 10, 24),
      ].map((date) =>
        date.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      )
    )
  })
})
