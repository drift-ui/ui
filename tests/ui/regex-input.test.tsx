import * as React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
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

  it("renders sample text preview and highlights matches in <mark>", async () => {
    const sample = "Alpha 123 Beta 456 Gamma"
    const { container } = render(<RegexInput value="[0-9]+" sample={sample} />)

    expect(screen.getByText("Test Sample")).toBeInTheDocument()
    expect(await screen.findAllByText(/2 matches/)).toHaveLength(2)

    const marks = container.querySelectorAll("mark")
    expect(marks).toHaveLength(2)
    expect(marks[0]).toHaveTextContent("123")
    expect(marks[1]).toHaveTextContent("456")
  })

  it("displays capture groups when pattern contains groups", async () => {
    const sample = "order-101 and order-202"
    render(<RegexInput value="order-(?<id>[0-9]+)" sample={sample} />)

    expect(await screen.findByText("Capture Groups")).toBeInTheDocument()
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
    const input = screen.getByRole("textbox")
    expect(refCallback).toHaveBeenCalledWith(input)
    const initialCalls = refCallback.mock.calls.length
    expect(initialCalls).toBeGreaterThan(0)
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

  it("supports aria-labelledby, showError=false, and custom/unknown flags", async () => {
    const user = userEvent.setup()
    render(
      <div>
        <span id="custom-regex-label">Pattern label</span>
        <RegexInput
          aria-labelledby="custom-regex-label"
          value="[unclosed"
          showError={false}
          availableFlags={["i", "z"]}
        />
      </div>
    )

    const input = screen.getByLabelText("Pattern label")
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()

    const customBtn = screen.getByRole("button", { name: "Flag z" })
    expect(customBtn).toHaveAttribute("title", "Flag z")
    await user.click(customBtn)
    expect(customBtn).toHaveAttribute("aria-pressed", "false")
  })

  it("renders singular match, truncated badge/summary, empty/invalid sample states, numbered groups, and >10 matches notice", async () => {
    const { rerender } = render(<RegexInput value="" sample="hello" />)
    expect(screen.getByText("Enter a pattern to test")).toBeInTheDocument()

    rerender(<RegexInput value="[unclosed" sample="hello" />)
    expect(screen.getByText("Invalid pattern")).toBeInTheDocument()
    expect(screen.getByText("Invalid regex pattern")).toBeInTheDocument()

    rerender(<RegexInput value="hello" sample="hello world" />)
    expect(await screen.findAllByText(/1 match/)).toHaveLength(2)

    rerender(<RegexInput value="a" sample="aaaa" maxMatches={2} />)
    expect(await screen.findByText("2 matches+")).toBeInTheDocument()
    expect(screen.getByText(/\(limit reached\)/)).toBeInTheDocument()

    rerender(<RegexInput value="([a-z])" sample="a b c d e f g h i j k l" />)
    expect(await screen.findAllByText("Group 1")).toHaveLength(10)
    expect(screen.getByText("+ 2 more matches")).toBeInTheDocument()
  })

  it("evaluates matches in a Worker when available and aborts on unmount", async () => {
    const createObjectURL = vi.fn(() => "blob:ui-worker")
    const revokeObjectURL = vi.fn()
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    })

    const workers: Array<{
      onmessage: ((e: MessageEvent) => void) | null
      terminate: ReturnType<typeof vi.fn>
    }> = []

    vi.stubGlobal(
      "Worker",
      class {
        onmessage: ((e: MessageEvent) => void) | null = null
        onerror: ((e: Event) => void) | null = null
        postMessage = vi.fn()
        terminate = vi.fn()
        constructor() {
          workers.push(this)
        }
      }
    )

    try {
      const { rerender, unmount } = render(
        <RegexInput value="foo" sample="foo bar" />
      )
      expect(workers).toHaveLength(1)
      workers[0].onmessage?.({
        data: {
          matches: [{ match: "foo", index: 0, length: 3, groups: [] }],
          matchCount: 1,
          truncated: false,
          executionTimeMs: 1,
          error: null,
        },
      } as MessageEvent)

      await waitFor(() => {
        expect(screen.getAllByText(/1 match/)).toHaveLength(2)
      })

      rerender(<RegexInput value="bar" sample="foo bar" />)
      expect(workers).toHaveLength(2)
      unmount()
      expect(workers[1].terminate).toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
