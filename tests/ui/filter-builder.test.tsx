import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { FilterField, FilterGroup } from "@/registry/default/lib/filter"
import { FilterBuilder } from "@/registry/default/ui/filter-builder"

const FIELDS: FilterField[] = [
  {
    id: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "open", label: "Open" },
      { value: "closed", label: "Closed" },
    ],
  },
  { id: "title", label: "Title", type: "text" },
  { id: "due", label: "Due", type: "date" },
]

function chipTexts() {
  return Array.from(document.querySelectorAll("[data-slot=filter-chip]")).map(
    (chip) => {
      const visible = chip.cloneNode(true) as HTMLElement
      visible.querySelectorAll(".sr-only").forEach((label) => label.remove())
      return visible.textContent
    }
  )
}

async function openAddMenu(user: ReturnType<typeof userEvent.setup>) {
  screen.getByRole("button", { name: "Add filter" }).focus()
  await user.keyboard("{Enter}")
  await waitFor(() =>
    expect(screen.getByRole("menu")).toContainElement(
      document.activeElement as HTMLElement
    )
  )
}

describe("FilterBuilder", () => {
  it("adds a select filter and picks its value from the menu", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<FilterBuilder fields={FIELDS} onValueChange={onValueChange} />)

    await openAddMenu(user)
    await user.keyboard("{Enter}")
    expect(screen.getByRole("menuitem", { name: "Open" })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("menu")).toHaveFocus())
    await user.keyboard("{ArrowDown}{Enter}")

    expect(chipTexts()).toEqual(["Status is Open"])
    expect(
      screen.getByRole("button", { name: "Status operator: is" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Status value: Open" })
    ).toBeInTheDocument()
    expect(onValueChange.mock.lastCall?.[0]).toMatchObject([
      { fieldId: "status", operator: "is", value: "open" },
    ])
  })

  it("moves focus into the new text filter's input and commits on Enter", async () => {
    const user = userEvent.setup()
    render(<FilterBuilder fields={FIELDS} />)

    await openAddMenu(user)
    await user.keyboard("{ArrowDown}{Enter}")
    expect(screen.getByRole("textbox", { name: "Title value" })).toHaveFocus()

    await user.keyboard("billing{Enter}")
    expect(chipTexts()).toEqual(["Title contains billing"])
  })

  it("drops a new filter that was dismissed without a value", async () => {
    const user = userEvent.setup()
    render(<FilterBuilder fields={FIELDS} />)

    await openAddMenu(user)
    await user.keyboard("{Enter}")
    await user.keyboard("{Escape}")

    expect(chipTexts()).toEqual([])
  })

  it("closes the add menu instantly so it cannot pull focus from the new editor", async () => {
    const user = userEvent.setup()
    render(<FilterBuilder fields={FIELDS} />)

    await openAddMenu(user)

    expect(
      document.querySelector("[data-slot=filter-menu]")?.className
    ).not.toMatch(/animate-out/)
  })

  it("removes one filter or clears them all", async () => {
    const user = userEvent.setup()
    render(
      <FilterBuilder
        fields={FIELDS}
        defaultValue={[
          { id: "a", fieldId: "status", operator: "is", value: "open" },
          { id: "b", fieldId: "title", operator: "contains", value: "invoice" },
        ]}
      />
    )

    await user.click(
      screen.getByRole("button", { name: "Remove Status filter" })
    )
    expect(chipTexts()).toEqual(["Title contains invoice"])

    await user.click(screen.getByRole("button", { name: "Clear" }))
    expect(chipTexts()).toEqual([])
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull()
  })

  it("changes the operator from the chip", async () => {
    const user = userEvent.setup()
    render(
      <FilterBuilder
        fields={FIELDS}
        defaultValue={[
          { id: "a", fieldId: "title", operator: "contains", value: "invoice" },
        ]}
      />
    )

    screen.getByRole("button", { name: /^Title operator:/ }).focus()
    await user.keyboard("{Enter}")
    await user.click(screen.getByRole("menuitem", { name: "is not" }))

    expect(chipTexts()).toEqual(["Title is not invoice"])
  })

  it("supports multi-select with is-any-of", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <FilterBuilder
        fields={FIELDS}
        onValueChange={onValueChange}
        defaultValue={[
          {
            id: "s1",
            fieldId: "status",
            operator: "is-any-of",
            value: ["open"],
          },
        ]}
      />
    )

    expect(
      screen.getByRole("button", { name: "Status value: Open" })
    ).toBeInTheDocument()

    // Click value button to open multi-select popover
    await user.click(screen.getByRole("button", { name: "Status value: Open" }))
    const closedOption = screen.getByRole("checkbox", { name: "Closed" })
    expect(closedOption).toBeInTheDocument()
    await user.click(closedOption)

    expect(onValueChange).toHaveBeenCalledWith([
      {
        id: "s1",
        fieldId: "status",
        operator: "is-any-of",
        value: ["open", "closed"],
      },
    ])
  })

  it("supports date picker for date fields", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <FilterBuilder
        fields={FIELDS}
        onValueChange={onValueChange}
        defaultValue={[
          {
            id: "d1",
            fieldId: "due",
            operator: "before",
            value: "2025-04-15",
          },
        ]}
      />
    )

    const dateButton = screen.getByRole("button", { name: /Due value:/ })
    expect(dateButton).toBeInTheDocument()
    expect(dateButton.textContent).toContain("Apr 15, 2025")

    await user.click(dateButton)
    const calendar = document.querySelector(
      "[data-slot=calendar]"
    ) as HTMLElement
    expect(calendar).toBeInTheDocument()

    const day20 = within(calendar).getByRole("button", { name: /April 20/i })
    await user.click(day20)

    expect(onValueChange).toHaveBeenLastCalledWith([
      expect.objectContaining({
        id: "d1",
        fieldId: "due",
        operator: "before",
        value: "2025-04-20",
      }),
    ])
    expect(dateButton.textContent).toContain("Apr 20, 2025")
  })

  it("manages nested AND/OR groups and conjunction toggling", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const initialGroup: FilterGroup = {
      id: "root",
      conjunction: "and",
      filters: [
        { id: "1", fieldId: "status", operator: "is", value: "open" },
        {
          id: "nested",
          conjunction: "or",
          filters: [
            {
              id: "2",
              fieldId: "title",
              operator: "contains",
              value: "billing",
            },
          ],
        },
      ],
    }

    render(
      <FilterBuilder
        fields={FIELDS}
        value={initialGroup}
        onValueChange={onValueChange}
      />
    )

    // Check root conjunction button
    const conjunctionBtn = screen.getByRole("button", {
      name: "Conjunction: AND",
    })
    expect(conjunctionBtn).toBeInTheDocument()

    // Toggle conjunction to OR
    await user.click(conjunctionBtn)
    expect(onValueChange).toHaveBeenCalledWith(
      expect.objectContaining({
        conjunction: "or",
      })
    )

    // Check nested filter group container
    expect(
      screen.getByRole("group", { name: "Filter group (OR)" })
    ).toBeInTheDocument()

    // Remove the nested group
    const removeGroupBtn = screen.getByRole("button", {
      name: "Remove filter group",
    })
    await user.click(removeGroupBtn)

    expect(onValueChange).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [
          { id: "1", fieldId: "status", operator: "is", value: "open" },
        ],
      })
    )
  })

  it("adds a group from flat mode using the Add menu", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<FilterBuilder fields={FIELDS} onValueChange={onValueChange} />)

    await openAddMenu(user)
    const addGroupItem = screen.getByRole("menuitem", { name: /Add group/i })
    expect(addGroupItem).toBeInTheDocument()
    await user.click(addGroupItem)

    expect(onValueChange).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "root",
        conjunction: "and",
        filters: [
          expect.objectContaining({
            conjunction: "and",
            filters: [],
          }),
        ],
      })
    )
  })

  it("moves focus to the add button after a keyboard remove or clear", async () => {
    const user = userEvent.setup()
    render(
      <FilterBuilder
        fields={FIELDS}
        defaultValue={[
          { id: "a", fieldId: "status", operator: "is", value: "open" },
          { id: "b", fieldId: "title", operator: "contains", value: "invoice" },
        ]}
      />
    )
    const addButton = screen.getByRole("button", { name: "Add filter" })

    screen.getByRole("button", { name: "Remove Status filter" }).focus()
    await user.keyboard("{Enter}")
    await waitFor(() => expect(addButton).toHaveFocus())

    screen.getByRole("button", { name: "Clear" }).focus()
    await user.keyboard("{Enter}")
    await waitFor(() => expect(addButton).toHaveFocus())
  })

  it("moves focus to the add button after removing a group", async () => {
    const user = userEvent.setup()
    render(
      <FilterBuilder
        fields={FIELDS}
        defaultValue={{
          id: "root",
          conjunction: "and",
          filters: [
            {
              id: "nested",
              conjunction: "or",
              filters: [
                { id: "1", fieldId: "status", operator: "is", value: "open" },
              ],
            },
          ],
        }}
      />
    )

    screen.getByRole("button", { name: "Remove filter group" }).focus()
    await user.keyboard("{Enter}")
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add filter" })).toHaveFocus()
    )
  })

  it("leaves focus alone when the value changes from outside", () => {
    const { rerender } = render(
      <FilterBuilder
        fields={FIELDS}
        value={[{ id: "a", fieldId: "status", operator: "is", value: "open" }]}
      />
    )
    const outside = document.createElement("button")
    document.body.append(outside)
    outside.focus()

    rerender(<FilterBuilder fields={FIELDS} value={[]} />)

    expect(outside).toHaveFocus()
    outside.remove()
  })
})
