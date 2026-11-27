import * as React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { LocalePicker } from "@/registry/default/ui/locale-picker"

const TEST_LOCALES = ["en-US", "de-DE", "ja-JP", "pt-BR", "fr"]

function trigger() {
  return screen.getByRole("combobox", { name: "Locale" })
}

async function openPicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(trigger())
  const search = await screen.findByRole("combobox", {
    name: "Search locales",
  })
  await waitFor(() => expect(search).toHaveFocus())
  return search
}

describe("LocalePicker", () => {
  it("shows the placeholder, then the chosen locale with its flag and label", () => {
    const { rerender } = render(<LocalePicker aria-label="Locale" />)
    expect(trigger()).toHaveTextContent("Select a locale")

    rerender(<LocalePicker aria-label="Locale" value="de-DE" />)
    expect(trigger()).toHaveTextContent("🇩🇪")
    expect(trigger()).toHaveTextContent("Deutsch (Deutschland)")
    expect(trigger()).toHaveTextContent("de-DE")
  })

  it("opens from the keyboard and picks a locale by search", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <LocalePicker
        aria-label="Locale"
        locales={TEST_LOCALES}
        onValueChange={onValueChange}
      />
    )

    await user.tab()
    await user.keyboard("{Enter}")
    const search = await screen.findByRole("combobox", {
      name: "Search locales",
    })
    expect(search).toHaveFocus()

    await user.keyboard("japanese{Enter}")

    expect(onValueChange).toHaveBeenCalledWith("ja-JP")
    expect(trigger()).toHaveTextContent("ja-JP")
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    )
  })

  it("opens when ArrowDown is pressed on the focused trigger button and closes on Escape", async () => {
    const user = userEvent.setup()
    render(<LocalePicker aria-label="Locale" locales={TEST_LOCALES} />)

    await user.tab()
    expect(trigger()).toHaveFocus()

    await user.keyboard("{ArrowDown}")
    expect(
      await screen.findByRole("combobox", { name: "Search locales" })
    ).toBeInTheDocument()
    expect(trigger()).toHaveAttribute("aria-expanded", "true")

    await user.keyboard("{Escape}")
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    )
  })

  it("calls caller-supplied onKeyDown and preserves trigger keyboard opening", async () => {
    const user = userEvent.setup()
    const handleKeyDown = vi.fn()
    render(
      <LocalePicker
        aria-label="Locale"
        locales={TEST_LOCALES}
        onKeyDown={handleKeyDown}
      />
    )

    await user.tab()
    await user.keyboard("{ArrowDown}")

    expect(handleKeyDown).toHaveBeenCalled()
    expect(
      await screen.findByRole("combobox", { name: "Search locales" })
    ).toBeInTheDocument()
  })

  it("wraps arrow keys through the list and updates aria-activedescendant", async () => {
    const user = userEvent.setup()
    render(<LocalePicker aria-label="Locale" locales={TEST_LOCALES} />)

    const search = await openPicker(user)
    const options = screen.getAllByRole("option")
    expect(options).toHaveLength(5)
    expect(search).toHaveAttribute("aria-activedescendant", options[0].id)

    await user.keyboard("{ArrowUp}")
    expect(search).toHaveAttribute("aria-activedescendant", options[4].id)
    await user.keyboard("{ArrowDown}")
    expect(search).toHaveAttribute("aria-activedescendant", options[0].id)
  })

  it("starts on the selected locale and marks it selected", async () => {
    const user = userEvent.setup()
    render(
      <LocalePicker
        aria-label="Locale"
        locales={TEST_LOCALES}
        defaultValue="pt-BR"
      />
    )

    const search = await openPicker(user)
    const brazil = screen.getByRole("option", { name: /português/i })

    expect(brazil).toHaveAttribute("aria-selected", "true")
    expect(search).toHaveAttribute("aria-activedescendant", brazil.id)
  })

  it("selects a locale by clicking an option", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <LocalePicker
        aria-label="Locale"
        locales={TEST_LOCALES}
        onValueChange={onValueChange}
      />
    )

    await openPicker(user)
    await user.click(screen.getByRole("option", { name: /Deutsch/ }))

    expect(onValueChange).toHaveBeenCalledWith("de-DE")
    expect(trigger()).toHaveTextContent("de-DE")
  })

  it("displays empty message and handles keys gracefully when search query has no matches", async () => {
    const user = userEvent.setup()
    render(<LocalePicker aria-label="Locale" locales={TEST_LOCALES} />)

    await openPicker(user)
    await user.keyboard("klingon")

    expect(screen.queryByRole("option")).not.toBeInTheDocument()
    expect(screen.getByText("No locale found")).toBeInTheDocument()

    // Pressing ArrowDown, ArrowUp, Enter with no matches should be no-ops
    await user.keyboard("{ArrowDown}{ArrowUp}{Enter}")
    expect(trigger()).toHaveAttribute("aria-expanded", "true")
  })

  it("handles invalid or unknown custom value prop gracefully", () => {
    render(<LocalePicker aria-label="Locale" value="invalid-tag-1234" />)
    expect(trigger()).toHaveTextContent("Select a locale")
  })

  it("leaves Enter to the IME while it is composing", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <LocalePicker
        aria-label="Locale"
        locales={TEST_LOCALES}
        onValueChange={onValueChange}
      />
    )

    const search = await openPicker(user)
    fireEvent.keyDown(search, { key: "Enter", isComposing: true })
    fireEvent.keyDown(search, { key: "Enter", keyCode: 229 })

    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("supports controlled use", async () => {
    const user = userEvent.setup()

    function Controlled() {
      const [locale, setLocale] = React.useState("en-US")
      return (
        <>
          <LocalePicker
            aria-label="Locale"
            locales={TEST_LOCALES}
            value={locale}
            onValueChange={setLocale}
          />
          <output data-testid="selected-locale">{locale}</output>
        </>
      )
    }

    render(<Controlled />)
    expect(screen.getByTestId("selected-locale")).toHaveTextContent("en-US")

    await openPicker(user)
    await user.keyboard("german{Enter}")

    expect(screen.getByTestId("selected-locale")).toHaveTextContent("de-DE")
  })

  it("renders hidden form input when name is provided", () => {
    const { container } = render(
      <LocalePicker aria-label="Locale" name="preferred_locale" value="ja-JP" />
    )
    const hidden = container.querySelector<HTMLInputElement>(
      'input[type="hidden"][name="preferred_locale"]'
    )
    expect(hidden).toBeInTheDocument()
    expect(hidden?.value).toBe("ja-JP")
  })

  it("disables trigger button and hidden input when disabled is true", () => {
    const { container } = render(
      <LocalePicker
        aria-label="Locale"
        name="user_locale"
        value="fr"
        disabled
      />
    )
    expect(trigger()).toBeDisabled()
    const hidden = container.querySelector<HTMLInputElement>(
      'input[type="hidden"][name="user_locale"]'
    )
    expect(hidden).toBeDisabled()
  })

  it("hides BCP 47 tag badge when showTag is false", () => {
    render(<LocalePicker aria-label="Locale" value="de-DE" showTag={false} />)
    expect(trigger()).toHaveTextContent("Deutsch (Deutschland)")
    expect(trigger()).not.toHaveTextContent("de-DE")
  })
})
