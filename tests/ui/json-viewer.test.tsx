import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { JsonViewer } from "@/registry/default/ui/json-viewer"

const PAYLOAD = {
  id: "evt_1",
  paid: true,
  customer: { email: "ana@example.com", tax_id: null },
  lines: [{ amount: 4900 }],
}

function row(name: RegExp) {
  return screen.getByRole("treeitem", { name })
}

describe("JsonViewer", () => {
  it("renders a labelled tree opened to defaultExpandDepth", () => {
    render(<JsonViewer aria-label="Payload" data={PAYLOAD} />)

    const tree = screen.getByRole("tree", { name: "Payload" })
    expect(within(tree).getAllByRole("treeitem")).toHaveLength(7)
    expect(row(/^customer/)).toHaveAttribute("aria-expanded", "true")
    expect(row(/^email/)).toHaveTextContent('email:"ana@example.com"')
    expect(row(/^tax_id/)).toHaveTextContent("tax_id:null")
    expect(row(/^lines/)).toHaveTextContent("Array(1)")
  })

  it("expands and collapses from the keyboard", async () => {
    const user = userEvent.setup()
    render(<JsonViewer data={PAYLOAD} defaultExpandDepth={0} />)

    expect(screen.getAllByRole("treeitem")).toHaveLength(4)
    await user.click(screen.getByRole("searchbox"))
    await user.tab()
    await user.tab()
    await user.keyboard("{End}{ArrowRight}")

    expect(row(/^lines/)).toHaveAttribute("aria-expanded", "true")
    expect(row(/^0:/)).toBeInTheDocument()
  })

  it("copies the focused value and path with Ctrl+C and Ctrl+Shift+C", async () => {
    const user = userEvent.setup()
    const onCopy = vi.fn()
    render(<JsonViewer data={PAYLOAD} onCopy={onCopy} />)

    row(/^email/).focus()
    await user.keyboard("{Control>}c{/Control}")
    expect(await navigator.clipboard.readText()).toBe("ana@example.com")
    expect(onCopy).toHaveBeenLastCalledWith(
      "customer.email",
      "ana@example.com",
      "value"
    )

    await user.keyboard("{Control>}{Shift>}c{/Shift}{/Control}")
    expect(await navigator.clipboard.readText()).toBe("customer.email")
    expect(screen.getByText("Copied path")).toBeInTheDocument()
  })

  it("copies from the row buttons without toggling the row", async () => {
    const user = userEvent.setup()
    render(<JsonViewer data={PAYLOAD} />)

    await user.click(
      within(row(/^customer/)).getByRole("button", {
        name: "Copy value",
        hidden: true,
      })
    )

    expect(JSON.parse(await navigator.clipboard.readText())).toEqual(
      PAYLOAD.customer
    )
    expect(row(/^customer/)).toHaveAttribute("aria-expanded", "true")
  })

  it("highlights matches, counts them and opens their parents", async () => {
    const user = userEvent.setup()
    render(<JsonViewer data={PAYLOAD} defaultExpandDepth={0} />)

    await user.type(screen.getByRole("searchbox"), "4900")

    expect(screen.getByText("1 match")).toBeInTheDocument()
    expect(row(/^lines/)).toHaveAttribute("aria-expanded", "true")
    expect(row(/^amount/).querySelector("mark")).toHaveTextContent("4900")
  })

  it("opens only the current query's parents and restores them when cleared", async () => {
    const user = userEvent.setup()
    render(
      <JsonViewer
        data={{ one: { alpha: 1 }, two: { ana: 2 } }}
        defaultExpandDepth={0}
      />
    )
    const search = screen.getByRole("searchbox")

    await user.type(search, "a")
    expect(row(/^one/)).toHaveAttribute("aria-expanded", "true")
    expect(row(/^two/)).toHaveAttribute("aria-expanded", "true")

    await user.type(search, "n")
    expect(row(/^one/)).toHaveAttribute("aria-expanded", "false")
    expect(row(/^two/)).toHaveAttribute("aria-expanded", "true")

    await user.clear(search)
    expect(row(/^one/)).toHaveAttribute("aria-expanded", "false")
    expect(row(/^two/)).toHaveAttribute("aria-expanded", "false")
  })

  it("keeps row names free of the pointer-only copy buttons", () => {
    render(<JsonViewer data={PAYLOAD} />)

    expect(
      within(row(/^id:/)).queryByRole("button", { name: "Copy value" })
    ).not.toBeInTheDocument()
  })

  it("groups large arrays into ranges of 100", async () => {
    const user = userEvent.setup()
    render(
      <JsonViewer
        data={{ items: Array.from({ length: 250 }, (_, index) => index) }}
      />
    )

    expect(row(/^\[100 … 199\]/)).toHaveAttribute("aria-expanded", "false")
    expect(screen.getAllByRole("treeitem")).toHaveLength(4)

    await user.click(row(/^\[200 … 249\]/))
    expect(screen.getAllByRole("treeitem")).toHaveLength(54)
  })

  it("truncates long strings and expands on Show more, preserving full string in clipboard", async () => {
    const user = userEvent.setup()
    const longString = "A".repeat(200)
    render(<JsonViewer data={{ bio: longString }} maxStringLength={80} />)

    const showMore = screen.getByRole("button", { name: "Expand string" })
    expect(showMore).toHaveAttribute("aria-expanded", "false")
    expect(showMore).toHaveTextContent("Show more")
    expect(screen.getByText(new RegExp("A{80}"))).toBeInTheDocument()

    row(/^bio/).focus()
    await user.keyboard("{Control>}c{/Control}")
    expect(await navigator.clipboard.readText()).toBe(longString)

    await user.click(showMore)
    const showLess = screen.getByRole("button", { name: "Collapse string" })
    expect(showLess).toHaveAttribute("aria-expanded", "true")
    expect(showLess).toHaveTextContent("Show less")
    expect(screen.getByText(longString)).toBeInTheDocument()

    await user.click(showLess)
    expect(
      screen.getByRole("button", { name: "Expand string" })
    ).toBeInTheDocument()
  })

  it("copies 1 MB string fully even when truncated", async () => {
    const user = userEvent.setup()
    const oneMbString = "x".repeat(1024 * 1024)
    render(<JsonViewer data={{ payload: oneMbString }} />)

    row(/^payload/).focus()
    await user.keyboard("{Control>}c{/Control}")
    expect(await navigator.clipboard.readText()).toBe(oneMbString)
  })

  it("collapses multi-line strings to single line and expands with line breaks", async () => {
    const user = userEvent.setup()
    const multiLine = "first line\nsecond line\nthird line"
    render(<JsonViewer data={{ description: multiLine }} />)

    expect(
      screen.getByRole("button", { name: "Expand string" })
    ).toBeInTheDocument()
    expect(row(/^description/)).toHaveTextContent(
      'description:"first line…Show more"'
    )

    await user.click(screen.getByRole("button", { name: "Expand string" }))
    expect(
      screen.getByRole("button", { name: "Collapse string" })
    ).toBeInTheDocument()
    expect(row(/^description/)).toHaveTextContent(
      'description:"first line second line third lineShow less"'
    )
  })

  it("toggles path filter input and filters tree by wildcard path pattern", async () => {
    const user = userEvent.setup()
    const data = {
      users: [
        { id: 1, name: "Alice", email: "alice@example.com" },
        { id: 2, name: "Bob", email: "bob@example.com" },
      ],
      meta: { total: 2 },
    }
    render(<JsonViewer data={data} defaultExpandDepth={3} />)

    expect(row(/^meta/)).toBeInTheDocument()
    expect(row(/^name:"Alice"/)).toBeInTheDocument()

    const toggle = screen.getByRole("button", { name: "Filter by path" })
    await user.click(toggle)

    const filterInput = screen.getByRole("textbox", {
      name: "Filter path pattern",
    })
    await user.click(filterInput)
    await user.paste("users[*].email")

    expect(
      screen.queryByRole("treeitem", { name: /^meta/ })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("treeitem", { name: /^name:"Alice"/ })
    ).not.toBeInTheDocument()
    expect(row(/^email:"alice@example.com"/)).toBeInTheDocument()
    expect(row(/^email:"bob@example.com"/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Clear path filter" }))
    expect(row(/^meta/)).toBeInTheDocument()
  })

  it("supports controlled pathFilter and onPathFilterChange", async () => {
    const user = userEvent.setup()
    const onPathFilterChange = vi.fn()
    const data = {
      users: [{ id: 1, email: "alice@example.com" }],
      other: "value",
    }
    const { rerender } = render(
      <JsonViewer
        data={data}
        pathFilter=""
        onPathFilterChange={onPathFilterChange}
        defaultExpandDepth={3}
      />
    )

    expect(row(/^other/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Filter by path" }))
    const filterInput = screen.getByRole("textbox", {
      name: "Filter path pattern",
    })
    await user.click(filterInput)
    await user.paste("users[*].email")
    expect(onPathFilterChange).toHaveBeenCalledWith("users[*].email")

    rerender(
      <JsonViewer
        data={data}
        pathFilter="users[*].email"
        onPathFilterChange={onPathFilterChange}
        defaultExpandDepth={3}
      />
    )

    expect(
      screen.queryByRole("treeitem", { name: /^other/ })
    ).not.toBeInTheDocument()
    expect(row(/^email:"alice@example.com"/)).toBeInTheDocument()
  })

  it("activates Show more and Show less with Enter and Space without toggling tree row", async () => {
    const user = userEvent.setup()
    const longString = "A".repeat(120)
    render(<JsonViewer data={{ bio: longString }} maxStringLength={80} />)

    const showMore = screen.getByRole("button", { name: "Expand string" })
    showMore.focus()
    await user.keyboard("{Enter}")

    const showLess = screen.getByRole("button", { name: "Collapse string" })
    expect(showLess).toBeInTheDocument()
    expect(showLess).toHaveAttribute("aria-expanded", "true")

    showLess.focus()
    await user.keyboard(" ")

    expect(
      screen.getByRole("button", { name: "Expand string" })
    ).toBeInTheDocument()
  })

  it("allows user to collapse string even when value matches query", async () => {
    const user = userEvent.setup()
    const longString = "A".repeat(80) + "TARGET" + "B".repeat(20)
    render(<JsonViewer data={{ bio: longString }} maxStringLength={80} />)

    const search = screen.getByRole("searchbox")
    await user.type(search, "TARGET")

    const showLess = screen.getByRole("button", { name: "Collapse string" })
    expect(showLess).toBeInTheDocument()

    await user.click(showLess)
    expect(
      screen.getByRole("button", { name: "Expand string" })
    ).toBeInTheDocument()
  })

  it("virtualizes large datasets when virtual prop is true", () => {
    const data = Array.from({ length: 500 }, (_, index) => ({
      id: `id_${index}`,
      title: `Item ${index}`,
    }))
    render(<JsonViewer virtual data={data} defaultExpandDepth={0} />)

    expect(screen.getAllByRole("treeitem").length).toBeLessThan(50)
  })
})
