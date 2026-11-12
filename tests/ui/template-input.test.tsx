import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { TemplateInput } from "@/registry/default/ui/template-input"

const VARIABLES = [
  { value: "first_name", label: "First name" },
  { value: "last_name", label: "Last name" },
  { value: "order_id", label: "Order number", description: "Like #1042" },
]

function textarea() {
  return screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Subject" })
}

function optionLabels() {
  return screen
    .getAllByRole("option")
    .map((option) => option.firstElementChild?.firstChild?.textContent)
}

describe("TemplateInput", () => {
  it("suggests variables after {{ and filters them as you type", async () => {
    const user = userEvent.setup()
    render(<TemplateInput aria-label="Subject" variables={VARIABLES} />)

    await user.type(textarea(), "Hi {{{{")
    expect(optionLabels()).toEqual(["First name", "Last name", "Order number"])

    await user.type(textarea(), "name")
    expect(optionLabels()).toEqual(["First name", "Last name"])
    expect(textarea()).toHaveAttribute(
      "aria-activedescendant",
      screen.getAllByRole("option")[0].id
    )
  })

  it("inserts the highlighted variable with Enter after moving with the arrows", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <TemplateInput
        aria-label="Subject"
        variables={VARIABLES}
        onValueChange={onValueChange}
      />
    )

    await user.type(textarea(), "id-{{{{")
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowUp}{Enter}")

    expect(textarea()).toHaveValue("id-{{last_name}}")
    expect(onValueChange).toHaveBeenLastCalledWith("id-{{last_name}}")
    expect(textarea()).not.toHaveAttribute("aria-controls")
  })

  it("wraps around the list and inserts with Tab", async () => {
    const user = userEvent.setup()
    render(<TemplateInput aria-label="Subject" variables={VARIABLES} />)

    await user.type(textarea(), "{{{{")
    await user.keyboard("{ArrowUp}{Tab}")

    expect(textarea()).toHaveValue("{{order_id}}")
  })

  it("inserts on click", async () => {
    const user = userEvent.setup()
    render(<TemplateInput aria-label="Subject" variables={VARIABLES} />)

    await user.type(textarea(), "Order {{{{ord")
    await user.click(screen.getByRole("option", { name: /Order number/ }))

    expect(textarea()).toHaveValue("Order {{order_id}}")
  })

  it("closes with Escape and keeps the text", async () => {
    const user = userEvent.setup()
    render(<TemplateInput aria-label="Subject" variables={VARIABLES} />)

    await user.type(textarea(), "{{{{fi")
    await user.keyboard("{Escape}")

    expect(screen.queryByRole("option")).not.toBeInTheDocument()
    expect(textarea()).toHaveValue("{{fi")
  })

  it("leaves Enter alone when the list is closed", async () => {
    const user = userEvent.setup()
    render(<TemplateInput aria-label="Subject" variables={VARIABLES} />)

    await user.type(textarea(), "one{Enter}two")

    expect(textarea()).toHaveValue("one\ntwo")
  })

  it("leaves Enter to the IME while it is composing", async () => {
    const user = userEvent.setup()
    render(<TemplateInput aria-label="Subject" variables={VARIABLES} />)

    await user.type(textarea(), "{{{{")
    expect(
      fireEvent.keyDown(textarea(), { key: "Enter", isComposing: true })
    ).toBe(true)
    expect(textarea()).toHaveValue("{{")
  })

  it("highlights known variables and flags unknown ones", () => {
    const { container } = render(
      <TemplateInput
        aria-label="Subject"
        variables={VARIABLES}
        defaultValue="Hi {{first_name}}, {{plan}} and {{ plan }}"
      />
    )

    const highlights = container.querySelectorAll(
      "[data-slot=template-input-variable]"
    )
    expect(
      Array.from(highlights, (span) => [
        span.textContent,
        span.hasAttribute("data-unknown"),
      ])
    ).toEqual([
      ["{{first_name}}", false],
      ["{{plan}}", true],
      ["{{ plan }}", true],
    ])
    expect(textarea()).toHaveAccessibleDescription("Unknown variable: plan")
  })

  it("keeps a caller's aria-describedby and ref", () => {
    const ref = { current: null as HTMLTextAreaElement | null }
    render(
      <>
        <p id="hint">Shown in the inbox</p>
        <TemplateInput
          ref={ref}
          aria-label="Subject"
          aria-describedby="hint"
          variables={VARIABLES}
          defaultValue="{{x}}"
        />
      </>
    )

    expect(ref.current).toBe(textarea())
    expect(textarea()).toHaveAccessibleDescription(
      "Shown in the inbox Unknown variable: x"
    )
  })

  it("scrolls the highlights with the textarea", () => {
    const onScroll = vi.fn()
    const { container } = render(
      <TemplateInput
        aria-label="Subject"
        variables={VARIABLES}
        onScroll={onScroll}
      />
    )
    const highlights = container.querySelector<HTMLElement>(
      "[data-slot=template-input-highlights]"
    )!
    highlights.scrollTo = vi.fn()

    textarea().scrollTop = 40
    fireEvent.scroll(textarea())

    expect(highlights.scrollTo).toHaveBeenCalledWith(0, 40)
    expect(onScroll).toHaveBeenCalledOnce()
  })

  it("follows a controlled value", () => {
    const { rerender } = render(
      <TemplateInput aria-label="Subject" variables={VARIABLES} value="a" />
    )
    rerender(
      <TemplateInput
        aria-label="Subject"
        variables={VARIABLES}
        value="{{first_name}}"
      />
    )

    expect(textarea()).toHaveValue("{{first_name}}")
  })
})
