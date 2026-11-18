import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { RegexInput } from "@/registry/default/ui/regex-input"

describe("RegexInput", () => {
  it("renders pattern input with delimiters and placeholder", () => {
    render(<RegexInput placeholder="Find text..." />)
    const input = screen.getByPlaceholderText("Find text...")
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute("type", "text")
    expect(input).not.toHaveAttribute("aria-invalid", "true")
  })

  it("supports controlled value and onValueChange", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = render(
      <RegexInput value="foo" onValueChange={onValueChange} />
    )

    const input = screen.getByRole("textbox")
    expect(input).toHaveValue("foo")

    await user.type(input, "bar")
    expect(onValueChange).toHaveBeenCalled()

    rerender(<RegexInput value="foobar" onValueChange={onValueChange} />)
    expect(input).toHaveValue("foobar")
  })

  it("supports uncontrolled defaultValue", async () => {
    const user = userEvent.setup()
    render(<RegexInput defaultValue="init" />)

    const input = screen.getByRole("textbox")
    expect(input).toHaveValue("init")

    await user.clear(input)
    await user.type(input, "next")
    expect(input).toHaveValue("next")
  })

  it("renders flag toggle buttons and handles clicking to toggle", async () => {
    const user = userEvent.setup()
    const onFlagsChange = vi.fn()
    render(<RegexInput defaultFlags="i" onFlagsChange={onFlagsChange} />)

    const iBtn = screen.getByRole("button", { name: /Case insensitive/i })
    const mBtn = screen.getByRole("button", { name: /Multiline/i })
    const sBtn = screen.getByRole("button", { name: /Dot all/i })

    expect(iBtn).toHaveAttribute("aria-pressed", "true")
    expect(mBtn).toHaveAttribute("aria-pressed", "false")
    expect(sBtn).toHaveAttribute("aria-pressed", "false")

    // Click m to activate multiline
    await user.click(mBtn)
    expect(onFlagsChange).toHaveBeenCalledWith("im")
    expect(mBtn).toHaveAttribute("aria-pressed", "true")

    // Click i to deactivate case insensitive
    await user.click(iBtn)
    expect(onFlagsChange).toHaveBeenCalledWith("m")
    expect(iBtn).toHaveAttribute("aria-pressed", "false")
  })

  it("supports controlled flags prop", () => {
    const { rerender } = render(<RegexInput flags="is" />)
    const iBtn = screen.getByRole("button", { name: /Case insensitive/i })
    const mBtn = screen.getByRole("button", { name: /Multiline/i })
    const sBtn = screen.getByRole("button", { name: /Dot all/i })

    expect(iBtn).toHaveAttribute("aria-pressed", "true")
    expect(mBtn).toHaveAttribute("aria-pressed", "false")
    expect(sBtn).toHaveAttribute("aria-pressed", "true")

    rerender(<RegexInput flags="m" />)
    expect(iBtn).toHaveAttribute("aria-pressed", "false")
    expect(mBtn).toHaveAttribute("aria-pressed", "true")
    expect(sBtn).toHaveAttribute("aria-pressed", "false")
  })

  it("toggles flag buttons with keyboard (Space/Enter)", async () => {
    const user = userEvent.setup()
    render(<RegexInput />)

    const iBtn = screen.getByRole("button", { name: /Case insensitive/i })
    expect(iBtn).toHaveAttribute("aria-pressed", "false")

    iBtn.focus()
    expect(iBtn).toHaveFocus()

    await user.keyboard(" ")
    expect(iBtn).toHaveAttribute("aria-pressed", "true")

    await user.keyboard("{Enter}")
    expect(iBtn).toHaveAttribute("aria-pressed", "false")
  })

  it("displays aria-invalid and error alert when pattern is invalid", async () => {
    const user = userEvent.setup()
    render(<RegexInput />)

    const input = screen.getByRole("textbox")
    await user.type(input, "(unclosed")

    expect(input).toHaveAttribute("aria-invalid", "true")
    const alert = screen.getByRole("alert")
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent(/Invalid regular expression/i)

    // Fix the syntax error
    await user.type(input, ")")
    expect(input).toHaveAttribute("aria-invalid", "false")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("renders sample text preview and highlights matches in <mark>", () => {
    const sample = "Alpha 123 Beta 456 Gamma"
    const { container } = render(<RegexInput value="[0-9]+" sample={sample} />)

    expect(screen.getByText("Test Sample")).toBeInTheDocument()
    expect(screen.getAllByText(/2 matches/)).toHaveLength(2)

    const marks = container.querySelectorAll("mark")
    expect(marks).toHaveLength(2)
    expect(marks[0]).toHaveTextContent("123")
    expect(marks[1]).toHaveTextContent("456")
  })

  it("displays capture groups when pattern contains groups", () => {
    const sample = "order-101 and order-202"
    render(<RegexInput value="order-(?<id>[0-9]+)" sample={sample} />)

    expect(screen.getByText("Capture Groups")).toBeInTheDocument()
    expect(screen.getByText("Match 1:")).toBeInTheDocument()
    expect(screen.getByText('"order-101"')).toBeInTheDocument()
    expect(screen.getAllByText("$id")).toHaveLength(2)
    expect(screen.getByText('"101"')).toBeInTheDocument()

    expect(screen.getByText("Match 2:")).toBeInTheDocument()
    expect(screen.getByText('"order-202"')).toBeInTheDocument()
    expect(screen.getByText('"202"')).toBeInTheDocument()
  })

  it("shows delimiters by default and hides them when showDelimiters is false", () => {
    const { container: defaultContainer } = render(<RegexInput />)
    const defaultSlashes = Array.from(
      defaultContainer.querySelectorAll('[aria-hidden="true"]')
    ).filter((el) => el.textContent === "/")
    expect(defaultSlashes).toHaveLength(2)

    const { container: hiddenContainer } = render(
      <RegexInput showDelimiters={false} />
    )
    const hiddenSlashes = Array.from(
      hiddenContainer.querySelectorAll('[aria-hidden="true"]')
    ).filter((el) => el.textContent === "/")
    expect(hiddenSlashes).toHaveLength(0)
  })

  it("hides flags when showFlags is false", () => {
    render(<RegexInput showFlags={false} />)
    expect(
      screen.queryByRole("group", { name: "Regex flags" })
    ).not.toBeInTheDocument()
  })

  it("hides sample preview when showSamplePreview is false", () => {
    render(
      <RegexInput value="foo" sample="foo bar" showSamplePreview={false} />
    )
    expect(screen.queryByText("Test Sample")).not.toBeInTheDocument()
  })

  it("disables pattern input, flag buttons, and form hidden input when disabled is true", () => {
    const { container } = render(
      <RegexInput disabled name="pattern_field" value="test" />
    )

    expect(screen.getByRole("textbox")).toBeDisabled()
    const flagBtns = screen.getAllByRole("button")
    for (const btn of flagBtns) {
      expect(btn).toBeDisabled()
    }
    const hiddenInput = container.querySelector<HTMLInputElement>(
      'input[type="hidden"][name="pattern_field"]'
    )
    expect(hiddenInput).toBeDisabled()
  })

  it("merges inputProps safely without overriding component-owned attributes", () => {
    const inputRef = React.createRef<HTMLInputElement>()
    const handleFocus = vi.fn()

    render(
      <RegexInput
        value="abc"
        inputProps={{
          ref: inputRef,
          onFocus: handleFocus,
          id: "custom-input-id",
          autoComplete: "off",
        }}
      />
    )

    const input = document.getElementById("custom-input-id") as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(inputRef.current).toBe(input)
    expect(input.value).toBe("abc")
    expect(input).toHaveAttribute("autocomplete", "off")

    fireEvent.focus(input)
    expect(handleFocus).toHaveBeenCalledTimes(1)
  })

  it("does not repeatedly re-invoke consumer ref on re-render", () => {
    const refCallback = vi.fn()
    const { rerender } = render(
      <RegexInput value="a" inputProps={{ ref: refCallback }} />
    )
    const initialCalls = refCallback.mock.calls.length
    rerender(<RegexInput value="ab" inputProps={{ ref: refCallback }} />)
    expect(refCallback.mock.calls.length).toBe(initialCalls)
  })

  it("renders readOnly input when readOnly is true", () => {
    render(<RegexInput readOnly value="readonly-val" />)
    expect(screen.getByRole("textbox")).toHaveAttribute("readonly")
  })

  it("renders hidden input with name attribute for form submission", () => {
    const { container } = render(
      <RegexInput name="regex_query" value="[a-z]+" />
    )
    const hidden = container.querySelector(
      'input[type="hidden"][name="regex_query"]'
    )
    expect(hidden).toBeInTheDocument()
    expect((hidden as HTMLInputElement).value).toBe("[a-z]+")
  })

  it("forwards inputRef to the underlying input element", () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<RegexInput inputRef={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})
