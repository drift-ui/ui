import { render, screen } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { CronInputPreview } from "@/components/preview/cron-input-preview"
import { CronInputPresetsPreview } from "@/components/preview/examples/cron-input/presets"
import { CronInput } from "@/registry/default/ui/cron-input"

describe("CronInput", () => {
  it("renders input field with default value and description", () => {
    render(<CronInput defaultValue="0 9 * * 1-5" />)

    const input = screen.getByRole("textbox")
    expect(input).toHaveValue("0 9 * * 1-5")
    expect(input).not.toHaveAttribute("aria-invalid")

    expect(
      screen.getByText("At 09:00, Monday through Friday")
    ).toBeInTheDocument()
  })

  it("sets aria-invalid and displays error message naming the invalid field", () => {
    render(<CronInput defaultValue="65 * * * *" />)

    const input = screen.getByRole("textbox")
    expect(input).toHaveAttribute("aria-invalid", "true")

    const error = document.querySelector(
      "[data-slot=cron-input-error]"
    ) as HTMLElement
    expect(error.closest("[aria-live=polite]")).not.toBeNull()
    expect(screen.queryByRole("alert")).toBeNull()
    expect(error).toHaveTextContent(/minute/i)
    expect(error).toHaveTextContent("65")
    expect(input).toHaveAttribute("aria-describedby", error.id)
  })

  it("renders upcoming runs when enabled", () => {
    const refDate = new Date(2026, 10, 13, 8, 30, 0)
    render(
      <CronInput
        defaultValue="0 9 * * 1-5"
        nextRunsFrom={refDate}
        nextRunsCount={3}
      />
    )

    expect(screen.getByText("Upcoming 3 runs")).toBeInTheDocument()
    const list = document.querySelector("[data-slot=cron-input-runs-list]")
    expect(list).toBeInTheDocument()
    const items = document.querySelectorAll("[data-slot=cron-input-run-item]")
    expect(items).toHaveLength(3)
  })

  it("supports custom date formatting for upcoming runs", () => {
    const refDate = new Date(2026, 10, 13, 8, 30, 0)
    render(
      <CronInput
        defaultValue="0 9 * * 1-5"
        nextRunsFrom={refDate}
        nextRunsCount={1}
        formatNextRun={(d) => `Run at ${d.toISOString()}`}
      />
    )

    expect(screen.getByText(/^Run at \d{4}-\d{2}-\d{2}T/)).toBeInTheDocument()
  })

  it("can hide description and next runs", () => {
    render(
      <CronInput
        defaultValue="0 9 * * 1-5"
        showDescription={false}
        showNextRuns={false}
      />
    )

    expect(
      document.querySelector("[data-slot=cron-input-description]")
    ).toBeNull()
    expect(
      document.querySelector("[data-slot=cron-input-next-runs]")
    ).toBeNull()
  })

  it("handles controlled value and fires onValueChange on user input", async () => {
    const user = userEvent.setup()
    const handleValueChange = vi.fn()

    render(<CronInput value="0 0 * * *" onValueChange={handleValueChange} />)

    const input = screen.getByRole("textbox")
    expect(input).toHaveValue("0 0 * * *")

    await user.clear(input)
    await user.type(input, "*/5 * * * *")

    expect(handleValueChange).toHaveBeenCalled()
  })

  it("disables input and applies disabled styling when disabled", () => {
    render(<CronInput defaultValue="0 9 * * 1-5" disabled />)

    const input = screen.getByRole("textbox")
    expect(input).toBeDisabled()
    const nextRuns = document.querySelector("[data-slot=cron-input-next-runs]")
    expect(nextRuns).toHaveClass("opacity-50")
  })

  it("renders CronInputPreview and updates schedule when preset is clicked", async () => {
    const user = userEvent.setup()
    render(<CronInputPreview />)

    const input = screen.getByRole("textbox", { name: "Job schedule" })
    expect(input).toHaveValue("0 9 * * 1-5")

    const hourlyBtn = screen.getByRole("button", { name: "Hourly" })
    await user.click(hourlyBtn)

    expect(input).toHaveValue("0 * * * *")
  })

  it("renders CronInputPresetsPreview and selects preset", async () => {
    const user = userEvent.setup()
    render(<CronInputPresetsPreview />)

    const input = screen.getByRole("textbox", { name: "Database backup" })
    expect(input).toHaveValue("0 0 * * *")

    const every5mBtn = screen.getByRole("button", { name: "Every 5m" })
    await user.click(every5mBtn)

    expect(input).toHaveValue("*/5 * * * *")
  })

  it("leaves upcoming runs out of the server render unless nextRunsFrom is set", () => {
    expect(
      renderToString(<CronInput defaultValue="0 9 * * 1-5" />)
    ).not.toContain("cron-input-run-item")
    expect(
      renderToString(
        <CronInput
          defaultValue="0 9 * * 1-5"
          nextRunsFrom={new Date(2026, 10, 13, 8, 30)}
        />
      )
    ).toContain("cron-input-run-item")
  })

  it("says so when a valid schedule can never run", () => {
    render(
      <CronInput
        defaultValue="0 0 30 2 *"
        nextRunsFrom={new Date(2026, 10, 13, 8, 30)}
      />
    )

    expect(
      screen.getByText(
        "This schedule never runs: no date matches its day and month."
      )
    ).toBeInTheDocument()
  })

  it("uses the singular for a single upcoming run", () => {
    render(
      <CronInput
        defaultValue="0 9 * * 1-5"
        nextRunsFrom={new Date(2026, 10, 13, 8, 30)}
        nextRunsCount={1}
      />
    )

    expect(screen.getByText("Upcoming run")).toBeInTheDocument()
  })

  it("keeps an aria-describedby passed through inputProps", () => {
    render(
      <CronInput
        defaultValue="0 9 * * 1-5"
        inputProps={{ "aria-describedby": "schedule-help" }}
      />
    )

    const describedBy = screen
      .getByRole("textbox")
      .getAttribute("aria-describedby")
    expect(describedBy?.split(" ")).toContain("schedule-help")
    expect(describedBy?.split(" ")).toHaveLength(2)
  })

  it("turns off autocorrect and spellcheck so mobile keyboards leave the expression alone", () => {
    render(<CronInput defaultValue="0 9 * * 1-5" />)

    const input = screen.getByRole("textbox")
    expect(input).toHaveAttribute("autocomplete", "off")
    expect(input).toHaveAttribute("autocorrect", "off")
    expect(input).toHaveAttribute("autocapitalize", "off")
    expect(input).toHaveAttribute("spellcheck", "false")
  })
})
