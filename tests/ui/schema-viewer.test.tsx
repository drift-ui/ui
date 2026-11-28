import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"
import { describe, expect, it, vi } from "vitest"

import {
  SchemaViewer,
  type SchemaTable,
} from "@/registry/default/ui/schema-viewer"

const ORDERS_TABLE: SchemaTable = {
  name: "orders",
  schema: "public",
  description: "Customer purchase orders.",
  columns: [
    { name: "id", type: "uuid", primaryKey: true },
    {
      name: "user_id",
      type: "uuid",
      nullable: false,
      references: "users.id",
      indexed: true,
    },
    {
      name: "code",
      type: "text",
      nullable: false,
      unique: true,
      description: "Human-readable order code",
    },
    {
      name: "total",
      type: "numeric(10,2)",
      nullable: false,
      default: "0",
    },
    {
      name: "notes",
      type: "text",
    },
  ],
}

describe("SchemaViewer", () => {
  it("renders a real table with semantic column and row headers", () => {
    render(<SchemaViewer table={ORDERS_TABLE} />)

    expect(screen.getByText("public.orders")).toBeInTheDocument()
    expect(screen.getByText("Customer purchase orders.")).toBeInTheDocument()
    expect(screen.getByText("5 columns")).toBeInTheDocument()

    const table = screen.getByRole("table", { name: "public.orders schema" })
    expect(table).toBeInTheDocument()

    const headers = within(table).getAllByRole("columnheader")
    expect(headers.map((h) => h.textContent)).toEqual([
      "Column",
      "Type",
      "Nullable",
      "Default",
      "Constraints",
    ])

    const rowHeaders = within(table).getAllByRole("rowheader")
    expect(rowHeaders.map((r) => r.textContent)).toContain("id")
    expect(rowHeaders.map((r) => r.textContent)).toContain("user_id")
  })

  it("displays nullability, defaults, descriptions, and constraint badges", () => {
    render(<SchemaViewer table={ORDERS_TABLE} />)

    const table = screen.getByRole("table")
    const rows = within(table).getAllByRole("row").slice(1)

    // id row: NOT NULL, PK badge, no default
    expect(within(rows[0]).getByText("NOT NULL")).toBeInTheDocument()
    expect(within(rows[0]).getByLabelText("Primary key")).toHaveTextContent(
      "PK"
    )
    expect(within(rows[0]).getByLabelText("No default")).toBeInTheDocument()

    // user_id row: FK and IDX badges + link
    expect(within(rows[1]).getByLabelText("Foreign key")).toHaveTextContent(
      "FK"
    )
    expect(within(rows[1]).getByLabelText("Indexed")).toHaveTextContent("IDX")

    // code row: UQ badge + description
    expect(within(rows[2]).getByLabelText("Unique")).toHaveTextContent("UQ")
    expect(
      within(rows[2]).getByText("Human-readable order code")
    ).toBeInTheDocument()

    // total row: default "0", no constraints
    expect(within(rows[3]).getByText("0")).toBeInTheDocument()
    expect(within(rows[3]).getByLabelText("No constraints")).toBeInTheDocument()

    // notes row: NULL
    expect(within(rows[4]).getByText("NULL")).toBeInTheDocument()
  })

  it("renders foreign key references as links and calls onReferenceClick via click and keyboard", async () => {
    const user = userEvent.setup()
    const onReferenceClick = vi.fn()
    render(
      <SchemaViewer table={ORDERS_TABLE} onReferenceClick={onReferenceClick} />
    )

    const link = screen.getByRole("link", { name: "References users.id" })
    expect(link).toHaveAttribute("href", "#users.id")

    await user.click(link)
    expect(onReferenceClick).toHaveBeenCalledTimes(1)
    expect(onReferenceClick).toHaveBeenCalledWith(
      "users.id",
      expect.objectContaining({ name: "user_id", references: "users.id" })
    )

    link.focus()
    expect(link).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(onReferenceClick).toHaveBeenCalledTimes(2)
  })

  it("allows native link behavior when onReferenceClick is omitted", async () => {
    const user = userEvent.setup()
    render(<SchemaViewer table={ORDERS_TABLE} />)

    const link = screen.getByRole("link", { name: "References users.id" })
    await user.click(link)
    expect(link).toHaveAttribute("href", "#users.id")
  })

  it("filters columns by name and clears from inline button or empty state", async () => {
    const user = userEvent.setup()
    render(<SchemaViewer table={ORDERS_TABLE} />)

    const filterInput = screen.getByRole("searchbox", {
      name: "Filter columns",
    })
    await user.type(filterInput, "user")

    expect(screen.getByText("1 of 5 columns")).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent(
      "1 of 5 columns matching user"
    )
    expect(
      screen.getByRole("rowheader", { name: "user_id" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("rowheader", { name: "total" })
    ).not.toBeInTheDocument()

    // Inline clear button
    await user.click(screen.getByRole("button", { name: "Clear filter" }))
    expect(filterInput).toHaveValue("")
    expect(filterInput).toHaveFocus()
    expect(screen.getByText("5 columns")).toBeInTheDocument()

    // Empty search state clear button
    await user.type(filterInput, "nonexistent")
    expect(screen.getByText("No columns found")).toBeInTheDocument()
    const clearButtons = screen.getAllByRole("button", { name: "Clear filter" })
    expect(clearButtons).toHaveLength(2)
    await user.click(clearButtons[1])
    expect(filterInput).toHaveValue("")
    expect(filterInput).toHaveFocus()
  })

  it("supports controlled filter, defaultFilter, and searchable=false", async () => {
    const user = userEvent.setup()
    const onFilterChange = vi.fn()
    const { rerender } = render(
      <SchemaViewer
        table={ORDERS_TABLE}
        filter="total"
        onFilterChange={onFilterChange}
      />
    )

    expect(screen.getByRole("rowheader", { name: "total" })).toBeInTheDocument()
    expect(
      screen.queryByRole("rowheader", { name: "id" })
    ).not.toBeInTheDocument()

    await user.type(
      screen.getByRole("searchbox", { name: "Filter columns" }),
      "s"
    )
    expect(onFilterChange).toHaveBeenCalled()

    rerender(<SchemaViewer table={ORDERS_TABLE} searchable={false} />)
    expect(
      screen.queryByRole("searchbox", { name: "Filter columns" })
    ).not.toBeInTheDocument()
  })

  it("renders empty table message and singular column label when 1 column exists", () => {
    const { unmount } = render(
      <SchemaViewer table={{ name: "empty_table", columns: [] }} />
    )
    expect(screen.getByText("0 columns")).toBeInTheDocument()
    expect(screen.getByText("No columns defined")).toBeInTheDocument()
    unmount()

    const { unmount: unmountSingle } = render(
      <SchemaViewer
        table={{
          name: "single_col",
          columns: [{ name: "id", type: "uuid", primaryKey: true }],
        }}
      />
    )
    expect(screen.getByText("1 column")).toBeInTheDocument()
    unmountSingle()

    render(
      <SchemaViewer
        table={{
          name: "single_col",
          columns: [{ name: "id", type: "uuid", primaryKey: true }],
        }}
        defaultFilter="missing"
      />
    )
    expect(screen.getByText("0 of 1 column")).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent(
      "0 of 1 column matching missing"
    )
  })

  it("forwards className, aria-label, and remaining props to root element", () => {
    render(
      <SchemaViewer
        table={ORDERS_TABLE}
        className="custom-schema-class"
        aria-label="Custom table label"
        data-testid="schema-root"
      />
    )

    expect(screen.getByTestId("schema-root")).toHaveClass("custom-schema-class")
    expect(
      screen.getByRole("table", { name: "Custom table label" })
    ).toBeInTheDocument()
  })

  it("passes axe accessibility checks", async () => {
    const { container } = render(<SchemaViewer table={ORDERS_TABLE} />)
    const { violations } = await axe.run(container, {
      rules: { region: { enabled: false } },
    })
    expect(violations).toEqual([])
  })
})
