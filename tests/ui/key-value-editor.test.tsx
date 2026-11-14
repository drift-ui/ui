import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as React from "react"
import { describe, expect, it, vi } from "vitest"

import {
  KeyValueEditor,
  type KeyValueRow,
} from "@/registry/default/ui/key-value-editor"

const ROWS: KeyValueRow[] = [
  { id: "a", key: "API_URL", value: "https://example.com" },
  { id: "b", key: "TOKEN", value: "secret" },
]

function keys() {
  return screen
    .queryAllByRole("textbox", { name: /^Key/ })
    .map((input) => (input as HTMLInputElement).value)
}

describe("KeyValueEditor", () => {
  it("labels every input and remove button with its row", () => {
    render(<KeyValueEditor defaultValue={ROWS} />)

    expect(screen.getByRole("textbox", { name: "Key 2" })).toHaveValue("TOKEN")
    expect(screen.getByRole("textbox", { name: "Value 1" })).toHaveValue(
      "https://example.com"
    )
    expect(
      screen.getByRole("button", { name: "Remove row 2" })
    ).toBeInTheDocument()
  })

  it("adds a row with Enter in the last row and focuses its key", async () => {
    const user = userEvent.setup()
    render(<KeyValueEditor defaultValue={ROWS} />)

    await user.click(screen.getByRole("textbox", { name: "Value 2" }))
    await user.keyboard("{Enter}")

    expect(keys()).toEqual(["API_URL", "TOKEN", ""])
    expect(screen.getByRole("textbox", { name: "Key 3" })).toHaveFocus()

    await user.keyboard("DEBUG")
    expect(keys()).toEqual(["API_URL", "TOKEN", "DEBUG"])
  })

  it("moves to the next row with Enter before the last row", async () => {
    const user = userEvent.setup()
    render(<KeyValueEditor defaultValue={ROWS} />)

    await user.click(screen.getByRole("textbox", { name: "Key 1" }))
    await user.keyboard("{Enter}")

    expect(keys()).toHaveLength(2)
    expect(screen.getByRole("textbox", { name: "Key 2" })).toHaveFocus()
  })

  it("starts from the add button when there are no rows", async () => {
    const user = userEvent.setup()
    render(<KeyValueEditor />)

    await user.click(screen.getByRole("button", { name: "Add row" }))

    expect(screen.getByRole("textbox", { name: "Key 1" })).toHaveFocus()
  })

  it("removes a row and moves focus to its neighbour, then to the add button", async () => {
    const user = userEvent.setup()
    render(<KeyValueEditor defaultValue={ROWS} />)

    await user.click(screen.getByRole("button", { name: "Remove row 1" }))
    expect(keys()).toEqual(["TOKEN"])
    expect(screen.getByRole("textbox", { name: "Key 1" })).toHaveFocus()

    await user.click(screen.getByRole("button", { name: "Remove row 1" }))
    expect(keys()).toEqual([])
    expect(screen.getByRole("button", { name: "Add row" })).toHaveFocus()
  })

  it("splits a pasted .env file into rows", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<KeyValueEditor onValueChange={onValueChange} />)

    await user.click(screen.getByRole("button", { name: "Add row" }))
    await user.paste("# config\nexport HOST=localhost\nPORT='5432'")

    expect(keys()).toEqual(["HOST", "PORT"])
    expect(screen.getByRole("textbox", { name: "Value 2" })).toHaveValue("5432")
    expect(screen.getByRole("textbox", { name: "Key 2" })).toHaveFocus()
    expect(onValueChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ key: "HOST", value: "localhost" }),
      expect.objectContaining({ key: "PORT", value: "5432" }),
    ])
  })

  it("pastes plain text into the key as usual", async () => {
    const user = userEvent.setup()
    render(<KeyValueEditor />)

    await user.click(screen.getByRole("button", { name: "Add row" }))
    await user.paste("API_URL")

    expect(keys()).toEqual(["API_URL"])
  })

  it("flags duplicate keys on every row that uses them", () => {
    render(
      <KeyValueEditor
        defaultValue={[...ROWS, { id: "c", key: "TOKEN ", value: "" }]}
      />
    )

    expect(screen.getByRole("textbox", { name: "Key 1" })).not.toBeInvalid()
    for (const name of ["Key 2", "Key 3"]) {
      const input = screen.getByRole("textbox", { name })
      expect(input).toBeInvalid()
      expect(input).toHaveAccessibleDescription("Duplicate key")
    }
  })

  it("masks values with secretValues and reveals one at a time", async () => {
    const user = userEvent.setup()
    render(<KeyValueEditor defaultValue={ROWS} secretValues />)

    const value = screen.getByLabelText("Value 2")
    expect(value).toHaveAttribute("type", "password")

    const [, revealSecond] = screen.getAllByRole("button", {
      name: "Show password",
    })
    await user.click(revealSecond)
    expect(value).toHaveAttribute("type", "text")
    expect(screen.getByLabelText("Value 1")).toHaveAttribute("type", "password")
  })

  it("works controlled", async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [rows, setRows] = React.useState(ROWS)
      return (
        <>
          <KeyValueEditor value={rows} onValueChange={setRows} />
          <output>{rows.map((row) => row.key).join(",")}</output>
        </>
      )
    }
    render(<Controlled />)

    await user.type(screen.getByRole("textbox", { name: "Key 1" }), "_V2")

    expect(screen.getByRole("status")).toHaveTextContent("API_URL_V2,TOKEN")
  })

  it("restores focus for any row id, including quotes and add", async () => {
    const user = userEvent.setup()
    render(
      <KeyValueEditor
        defaultValue={[
          { id: 'a"b', key: "A", value: "" },
          { id: "add", key: "B", value: "" },
        ]}
      />
    )

    await user.click(screen.getByRole("textbox", { name: "Key 1" }))
    await user.keyboard("{Enter}")
    expect(screen.getByRole("textbox", { name: "Key 2" })).toHaveFocus()

    await user.click(screen.getByRole("button", { name: "Remove row 2" }))
    expect(screen.getByRole("textbox", { name: "Key 1" })).toHaveFocus()
  })

  it("forwards className and remaining props to the root", () => {
    render(
      <KeyValueEditor
        data-testid="editor"
        aria-label="Environment variables"
        className="max-w-md"
      />
    )

    expect(screen.getByTestId("editor")).toHaveClass("max-w-md", "grid")
    expect(screen.getByRole("group", { name: "Environment variables" })).toBe(
      screen.getByTestId("editor")
    )
  })
})
