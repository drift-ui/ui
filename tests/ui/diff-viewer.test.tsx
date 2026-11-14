import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DiffViewer } from "@/registry/default/ui/diff-viewer"

const UNCHANGED = Array.from({ length: 12 }, (_, index) => `line ${index + 1}`)
const BEFORE = [...UNCHANGED, "timeout: 30", "retries: 3"].join("\n")
const AFTER = [...UNCHANGED, "timeout: 60", "retries: 3", "debug: true"].join(
  "\n"
)

function rowTexts() {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => row.textContent)
}

describe("DiffViewer", () => {
  it("names the table and summarizes the change for screen readers", () => {
    render(
      <DiffViewer aria-label="Config" oldValue={BEFORE} newValue={AFTER} />
    )

    const table = screen.getByRole("table", { name: "Config" })
    expect(table).toHaveTextContent("2 lines added, 1 line removed")
  })

  it("reports no changes for identical input", () => {
    render(<DiffViewer oldValue={BEFORE} newValue={BEFORE} />)

    expect(screen.getByRole("table")).toHaveTextContent("No changes")
  })

  it("shows the old and new text side by side in split mode", () => {
    render(<DiffViewer oldValue="timeout: 30" newValue="timeout: 60" />)

    const [, row] = screen.getAllByRole("row")
    const cells = within(row).getAllByRole("cell")
    expect(cells).toHaveLength(4)
    expect(cells[1]).toHaveTextContent("timeout: 30")
    expect(cells[3]).toHaveTextContent("timeout: 60")
  })

  it("leaves a blank side for a line with no partner", () => {
    render(<DiffViewer oldValue="" newValue="added" />)

    const [, row] = screen.getAllByRole("row")
    const cells = within(row).getAllByRole("cell")
    expect(cells[0]).toBeEmptyDOMElement()
    expect(cells[2]).toHaveTextContent("added")
  })

  it("stacks removed and added lines in unified mode", () => {
    render(
      <DiffViewer
        oldValue="timeout: 30"
        newValue="timeout: 60"
        mode="unified"
      />
    )

    const [, removed, added] = screen.getAllByRole("row")
    expect(within(removed).getAllByRole("cell")).toHaveLength(3)
    expect(removed).toHaveTextContent("Removed: timeout: 30")
    expect(added).toHaveTextContent("Added: timeout: 60")
  })

  it("wraps only the changed words in del and ins", () => {
    const { container } = render(
      <DiffViewer oldValue="timeout: 30" newValue="timeout: 60" />
    )

    expect(container.querySelector("del")).toHaveTextContent(/^30$/)
    expect(container.querySelector("ins")).toHaveTextContent(/^60$/)
  })

  it("collapses unchanged lines beyond contextLines", () => {
    render(<DiffViewer oldValue={BEFORE} newValue={AFTER} contextLines={2} />)

    expect(
      screen.getByRole("button", { name: "Show 10 unchanged lines" })
    ).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByText("line 1")).not.toBeInTheDocument()
    expect(screen.getAllByText("line 11")).toHaveLength(2)
  })

  it("expands and collapses a region from the keyboard and keeps focus", async () => {
    const user = userEvent.setup()
    render(<DiffViewer oldValue={BEFORE} newValue={AFTER} mode="unified" />)

    await user.tab()
    const toggle = screen.getByRole("button", {
      name: "Show 9 unchanged lines",
    })
    expect(toggle).toHaveFocus()

    await user.keyboard("{Enter}")
    expect(screen.getByText("line 1")).toBeInTheDocument()
    expect(toggle).toHaveFocus()
    expect(toggle).toHaveAccessibleName("Hide 9 unchanged lines")
    expect(toggle).toHaveAttribute("aria-expanded", "true")

    await user.keyboard(" ")
    expect(screen.queryByText("line 1")).not.toBeInTheDocument()
  })

  it("collapses again when the values change", async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <DiffViewer oldValue={BEFORE} newValue={AFTER} mode="unified" />
    )
    await user.click(screen.getByRole("button", { name: /^Show/ }))

    rerender(
      <DiffViewer
        oldValue={BEFORE}
        newValue={`${AFTER}\nmore`}
        mode="unified"
      />
    )

    expect(screen.getByRole("button", { name: /^Show/ })).toBeInTheDocument()
    expect(screen.queryByText("line 1")).not.toBeInTheDocument()
  })

  it("keeps every line reachable once expanded", async () => {
    const user = userEvent.setup()
    render(<DiffViewer oldValue={BEFORE} newValue={AFTER} mode="unified" />)

    await user.click(screen.getByRole("button", { name: /^Show/ }))

    expect(rowTexts()).toHaveLength(1 + 12 + 4)
  })

  it("forwards className and remaining props to the root", () => {
    render(
      <DiffViewer
        data-testid="diff"
        className="h-96"
        oldValue="a"
        newValue="b"
      />
    )

    expect(screen.getByTestId("diff")).toHaveClass("h-96", "border")
  })

  it("ignores whitespace-only changes when asked", () => {
    render(
      <DiffViewer
        oldValue={"if (a) {\n  run()\n}"}
        newValue={"if (a) {\n    run()\n}"}
        ignoreWhitespace
      />
    )

    expect(screen.getByRole("table", { name: "Diff" })).toHaveTextContent(
      "No changes"
    )
  })

  it("renders each line through renderLine and keeps the change labels", () => {
    render(
      <DiffViewer
        oldValue="a"
        newValue="b"
        mode="unified"
        renderLine={(line) => <code>{line.text.toUpperCase()}</code>}
      />
    )

    expect(rowTexts()).toEqual(["1-Removed: A", "1+Added: B"])
  })

  it("fills a gutter cell per side for line actions", async () => {
    const user = userEvent.setup()
    const comment = vi.fn()
    render(
      <DiffViewer
        oldValue="a"
        newValue="b"
        renderGutter={(line) => (
          <button
            type="button"
            aria-label={`Comment on line ${line.oldNumber ?? line.newNumber}`}
            onClick={() => comment(line.type)}
          />
        )}
      />
    )

    expect(screen.getAllByRole("columnheader")).toHaveLength(6)
    // Slot output is clipped to the fixed row height.
    expect(
      screen.getAllByRole("button", { name: "Comment on line 1" })[0]
        .parentElement
    ).toHaveClass("h-5", "overflow-hidden")
    await user.tab()
    await user.tab()
    await user.keyboard("{Enter}")
    expect(comment).toHaveBeenCalledWith("add")
  })
})

describe("DiffViewer with a large diff", () => {
  const OLD = Array.from({ length: 5000 }, (_, index) => `line ${index}`)
  const NEW = OLD.map((line, index) => (index % 10 === 0 ? `${line} x` : line))

  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(400)
  })
  afterEach(() => vi.restoreAllMocks())

  it("renders only the rows near the viewport and states the total", () => {
    render(
      <DiffViewer
        oldValue={OLD.join("\n")}
        newValue={NEW.join("\n")}
        mode="unified"
        contextLines={20}
      />
    )

    const table = screen.getByRole("table")
    const total = Number(table.getAttribute("aria-rowcount"))
    expect(total).toBe(1 + 5000 + 500)
    expect(rowTexts().length).toBeLessThan(100)
    const firstRow = () =>
      Math.min(
        ...screen
          .getAllByRole("row")
          .slice(1)
          .map((row) => Number(row.getAttribute("aria-rowindex")))
      )
    expect(firstRow()).toBe(2)

    const container = table.parentElement!
    container.scrollTop = 20 * 3000
    fireEvent.scroll(container)

    expect(firstRow()).toBeGreaterThan(2900)
  })

  it("keeps a focused row mounted after it scrolls out of view", () => {
    render(
      <DiffViewer
        oldValue={OLD.join("\n")}
        newValue={NEW.join("\n")}
        mode="unified"
        contextLines={20}
        renderGutter={(line) => (
          <button
            type="button"
            aria-label={`Comment on line ${line.newNumber ?? line.oldNumber}`}
          />
        )}
      />
    )

    const button = screen.getAllByRole("button", {
      name: "Comment on line 3",
    })[0]
    button.focus()
    const container = screen.getByRole("table").parentElement!
    container.scrollTop = 20 * 3000
    fireEvent.scroll(container)

    expect(button).toBeInTheDocument()
    expect(button).toHaveFocus()
  })

  it("sizes the table for wide characters", () => {
    render(
      <DiffViewer
        oldValue="漢字漢字漢字漢字漢字"
        newValue="漢字漢字漢字漢字漢"
        mode="unified"
      />
    )

    expect(screen.getByRole("table").style.width).toContain("22ch")
  })

  it("keeps every collapsed region in the tab order", async () => {
    const user = userEvent.setup()
    render(<DiffViewer oldValue={OLD.join("\n")} newValue={NEW.join("\n")} />)

    const toggles = screen.getAllByRole("button", { name: /^Show/ })
    expect(toggles).toHaveLength(500)

    toggles[400].focus()
    await user.keyboard("{Enter}")
    expect(toggles[400]).toHaveFocus()
    expect(toggles[400]).toHaveAttribute("aria-expanded", "true")
  })
})
