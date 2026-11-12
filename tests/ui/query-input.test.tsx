import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { FilterField } from "@/registry/default/lib/filter"
import { QueryInput } from "@/registry/default/ui/query-input"

const FIELDS: FilterField[] = [
  { id: "author", label: "Author", type: "text" },
  {
    id: "label",
    label: "Label",
    type: "select",
    options: [
      { value: "bug", label: "Bug" },
      { value: "needs review", label: "Needs review" },
    ],
  },
  { id: "age", label: "Age in days", type: "number" },
]

function input() {
  return screen.getByRole<HTMLInputElement>("combobox", { name: "Search" })
}

function optionNames() {
  return screen.getAllByRole("option").map((option) => option.textContent)
}

describe("QueryInput", () => {
  it("parses filters and free text as you type", async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()
    render(
      <QueryInput
        aria-label="Search"
        fields={FIELDS}
        onFiltersChange={onFiltersChange}
      />
    )

    await user.type(input(), "author:me -label:bug login age:>7")

    expect(onFiltersChange).toHaveBeenLastCalledWith(
      [
        { id: "query-0", fieldId: "author", operator: "is", value: "me" },
        { id: "query-1", fieldId: "label", operator: "is-not", value: "bug" },
        { id: "query-2", fieldId: "age", operator: "gt", value: "7" },
      ],
      "login"
    )
  })

  it("suggests keys, then values, and inserts them with Enter", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <QueryInput
        aria-label="Search"
        fields={FIELDS}
        onValueChange={onValueChange}
      />
    )

    await user.type(input(), "la")
    expect(input()).toHaveAttribute("aria-expanded", "true")
    expect(optionNames()).toEqual(["Labellabel:"])
    await user.keyboard("{Enter}")
    expect(input()).toHaveValue("label:")

    expect(optionNames()).toEqual(["Bugbug", "Needs reviewneeds review"])
    await user.keyboard("{ArrowDown}{Enter}")
    expect(input()).toHaveValue('label:"needs review" ')
    expect(onValueChange).toHaveBeenLastCalledWith('label:"needs review" ')
    expect(input()).toHaveAttribute("aria-expanded", "false")
  })

  it("moves the active option with the arrows and inserts with Tab", async () => {
    const user = userEvent.setup()
    render(<QueryInput aria-label="Search" fields={FIELDS} />)

    await user.type(input(), "a")
    expect(input()).toHaveAttribute(
      "aria-activedescendant",
      screen.getAllByRole("option")[0].id
    )
    await user.keyboard("{ArrowUp}{Tab}")

    expect(input()).toHaveValue("age:")
  })

  it("lists every key on ArrowDown in an empty spot", async () => {
    const user = userEvent.setup()
    render(<QueryInput aria-label="Search" fields={FIELDS} />)

    await user.type(input(), "login ")
    expect(input()).toHaveAttribute("aria-expanded", "false")

    await user.keyboard("{ArrowDown}")
    expect(optionNames()).toEqual([
      "Authorauthor:",
      "Labellabel:",
      "Age in daysage:",
    ])
  })

  it("inserts on click", async () => {
    const user = userEvent.setup()
    render(<QueryInput aria-label="Search" fields={FIELDS} />)

    await user.type(input(), "-label:b")
    await user.click(screen.getByRole("option", { name: /Bug/ }))

    expect(input()).toHaveValue("-label:bug ")
  })

  it("closes with Escape and leaves Enter alone when closed", async () => {
    const user = userEvent.setup()
    const onKeyDown = vi.fn()
    render(
      <QueryInput aria-label="Search" fields={FIELDS} onKeyDown={onKeyDown} />
    )

    await user.type(input(), "au")
    await user.keyboard("{Escape}")
    expect(input()).toHaveAttribute("aria-expanded", "false")

    await user.keyboard("{Enter}")
    expect(input()).toHaveValue("au")
    expect(onKeyDown).toHaveBeenLastCalledWith(
      expect.objectContaining({ key: "Enter", defaultPrevented: false })
    )
  })

  it("leaves Enter to the IME while it is composing", async () => {
    const user = userEvent.setup()
    render(<QueryInput aria-label="Search" fields={FIELDS} />)

    await user.type(input(), "au")
    expect(
      fireEvent.keyDown(input(), { key: "Enter", isComposing: true })
    ).toBe(true)
    expect(input()).toHaveValue("au")
  })

  it("highlights the terms that became filters", () => {
    const { container } = render(
      <QueryInput
        aria-label="Search"
        fields={FIELDS}
        defaultValue="author:me is:open label:bug,docs words"
      />
    )

    expect(
      Array.from(
        container.querySelectorAll("[data-slot=query-input-filter]"),
        (span) => span.textContent
      )
    ).toEqual(["author:me", "label:bug,docs"])
  })

  it("forwards a ref and follows a controlled value", () => {
    const ref = { current: null as HTMLInputElement | null }
    const { rerender } = render(
      <QueryInput ref={ref} aria-label="Search" fields={FIELDS} value="a" />
    )
    rerender(
      <QueryInput ref={ref} aria-label="Search" fields={FIELDS} value="age:3" />
    )

    expect(ref.current).toBe(input())
    expect(input()).toHaveValue("age:3")
  })
})
