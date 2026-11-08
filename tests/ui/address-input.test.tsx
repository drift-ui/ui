import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as React from "react"
import { describe, expect, it, vi } from "vitest"

import type { Address } from "@/registry/default/lib/address-input"
import { AddressInput } from "@/registry/default/ui/address-input"

const ADDRESS: Address = {
  country: "US",
  line1: "1 Market St",
  line2: "",
  city: "San Francisco",
  region: "CA",
  postalCode: "94105",
}

function country() {
  return screen.getByRole<HTMLSelectElement>("combobox", {
    name: "Country or region",
  })
}

function field(name: string | RegExp) {
  return screen.getByRole<HTMLInputElement>("textbox", { name })
}

function fieldLabels() {
  return within(screen.getByRole("group", { name: "Shipping address" }))
    .getAllByRole("textbox")
    .map((input) => input.getAttribute("autocomplete"))
}

describe("AddressInput", () => {
  it("lays out the default country's fields with labels and autofill tokens", () => {
    render(<AddressInput aria-label="Shipping address" />)

    expect(country()).toHaveValue("US")
    expect(country()).toHaveAttribute("autocomplete", "country")
    expect(fieldLabels()).toEqual([
      "address-line1",
      "address-line2",
      "address-level2",
      "address-level1",
      "postal-code",
    ])
    expect(field("State")).toBeRequired()
    expect(field("ZIP code")).toBeRequired()
    expect(field(/Address line 2/)).not.toBeRequired()
    expect(field(/Address line 2/)).toHaveAccessibleName(
      "Address line 2 (optional)"
    )
  })

  it("is filled in from the keyboard in layout order", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <AddressInput
        aria-label="Shipping address"
        onValueChange={onValueChange}
      />
    )

    await user.tab()
    expect(country()).toHaveFocus()
    await user.tab()
    await user.keyboard("1 Market St")
    await user.tab()
    await user.tab()
    await user.keyboard("San Francisco")
    await user.tab()
    await user.keyboard("CA")
    await user.tab()
    expect(field("ZIP code")).toHaveFocus()
    await user.keyboard("94105")

    expect(onValueChange).toHaveBeenLastCalledWith(ADDRESS)
  })

  it("switches country, keeping shared fields and dropping the rest", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <AddressInput
        aria-label="Shipping address"
        defaultValue={ADDRESS}
        onValueChange={onValueChange}
      />
    )

    await user.selectOptions(country(), "GB")

    expect(onValueChange).toHaveBeenLastCalledWith({
      ...ADDRESS,
      country: "GB",
      region: "",
    })
    expect(screen.queryByRole("textbox", { name: "State" })).toBeNull()
    expect(field("Town or city")).toHaveValue("San Francisco")
    expect(field("Postcode")).toHaveValue("94105")
  })

  it("puts the postal code first for Japan and names the prefecture", () => {
    render(<AddressInput aria-label="Shipping address" defaultCountry="JP" />)

    expect(fieldLabels()).toEqual([
      "postal-code",
      "address-level1",
      "address-level2",
      "address-line1",
      "address-line2",
    ])
    expect(field("Prefecture")).toBeRequired()
  })

  it("shows a postal code error after leaving the field and links it to the field", async () => {
    const user = userEvent.setup()
    render(<AddressInput aria-label="Shipping address" />)

    await user.type(field("ZIP code"), "9410")
    expect(field("ZIP code")).not.toHaveAttribute("aria-invalid")

    await user.tab()
    expect(field("ZIP code")).toHaveAttribute("aria-invalid", "true")
    expect(field("ZIP code")).toHaveAccessibleDescription(
      "ZIP code must be 5 digits, like 94105."
    )
    expect(field("ZIP code").validity.valid).toBe(false)

    await user.type(field("ZIP code"), "5")
    expect(field("ZIP code")).not.toHaveAttribute("aria-invalid")
    expect(field("ZIP code").validity.valid).toBe(true)
  })

  it("submits each field under name and blocks a form with a bad postal code", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      return Object.fromEntries(new FormData(event.currentTarget))
    })
    render(
      <form onSubmit={onSubmit}>
        <AddressInput
          aria-label="Shipping address"
          name="shipping"
          addressType="shipping"
          defaultValue={{ ...ADDRESS, postalCode: "941" }}
        />
        <button type="submit">Save</button>
      </form>
    )

    expect(field("ZIP code")).toHaveAttribute(
      "autocomplete",
      "shipping postal-code"
    )

    await user.click(screen.getByRole("button", { name: "Save" }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(field("ZIP code")).toHaveAccessibleDescription(/5 digits/)

    await user.clear(field("ZIP code"))
    await user.type(field("ZIP code"), "94105")
    await user.click(screen.getByRole("button", { name: "Save" }))
    expect(onSubmit.mock.results[0]?.value).toEqual({
      "shipping.country": "US",
      "shipping.line1": "1 Market St",
      "shipping.line2": "",
      "shipping.city": "San Francisco",
      "shipping.region": "CA",
      "shipping.postalCode": "94105",
    })
  })

  it("follows a controlled value", () => {
    const { rerender } = render(
      <AddressInput aria-label="Shipping address" value={ADDRESS} />
    )
    expect(field("Address line 1")).toHaveValue("1 Market St")

    rerender(
      <AddressInput
        aria-label="Shipping address"
        value={{ ...ADDRESS, country: "DE", region: "" }}
      />
    )
    expect(country()).toHaveValue("DE")
    expect(screen.queryByRole("textbox", { name: "State" })).toBeNull()
  })

  it("uses layouts passed in, limits countries and names them in locale", () => {
    render(
      <AddressInput
        aria-label="Shipping address"
        defaultCountry="BR"
        countries={["BR", "PT"]}
        locale="pt"
        layouts={{
          BR: {
            rows: [["postalCode"], ["line1"], ["city", "region"]],
            required: ["postalCode", "line1", "city", "region"],
            labels: { postalCode: "CEP", region: "Estado" },
            postalCode: { pattern: /^\d{5}-?\d{3}$/, format: "8 dígitos" },
          },
        }}
      />
    )

    expect(
      within(country())
        .getAllByRole("option")
        .map((option) => option.textContent)
    ).toEqual(["Brasil", "Portugal"])
    expect(field("CEP")).toBeRequired()
    expect(field("Estado")).toBeInTheDocument()
    expect(screen.queryByRole("textbox", { name: /Address line 2/ })).toBeNull()
  })

  it("disables every field and passes extra props to the group", () => {
    render(
      <AddressInput
        aria-label="Shipping address"
        id="shipping"
        className="max-w-md"
        disabled
      />
    )

    const group = screen.getByRole("group", { name: "Shipping address" })
    expect(group).toHaveAttribute("id", "shipping")
    expect(group).toHaveClass("max-w-md")
    expect(country()).toBeDisabled()
    for (const input of within(group).getAllByRole("textbox")) {
      expect(input).toBeDisabled()
    }
  })
})
