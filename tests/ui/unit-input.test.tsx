import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { BINARY_BYTE_UNITS } from "@/registry/default/lib/unit-input-utils"
import { UnitInput } from "@/registry/default/ui/unit-input"

function field() {
  return screen.getByRole("spinbutton")
}

function unitSelect() {
  return screen.getByRole("combobox", { name: "Unit" })
}

describe("UnitInput", () => {
  it("shows the value in the default unit", () => {
    render(
      <UnitInput
        aria-label="Memory"
        defaultValue={512_000_000}
        defaultUnit="MB"
      />
    )
    expect(field()).toHaveValue("512")
    expect(unitSelect()).toHaveValue("MB")
    expect(field()).toHaveAttribute("aria-valuetext", "512 MB")
  })

  it("converts the number on screen when the unit changes, keeping the value", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const onUnitChange = vi.fn()
    render(
      <UnitInput
        aria-label="Memory"
        defaultValue={512_000_000}
        defaultUnit="MB"
        onValueChange={onValueChange}
        onUnitChange={onUnitChange}
      />
    )

    await user.selectOptions(unitSelect(), "GB")
    expect(field()).toHaveValue("0.512")
    expect(onUnitChange).toHaveBeenLastCalledWith("GB")
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("sets the unit and value from typed text on Enter", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <UnitInput
        aria-label="Memory"
        units={BINARY_BYTE_UNITS}
        defaultValue={1024}
        onValueChange={onValueChange}
      />
    )

    await user.clear(field())
    await user.type(field(), "512 MiB{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith(512 * 1024 ** 2)
    expect(unitSelect()).toHaveValue("MiB")
    expect(field()).toHaveValue("512")
  })

  it("parses typed text on blur and reverts unknown units", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <UnitInput
        aria-label="Upload cap"
        defaultValue={5_000_000}
        onValueChange={onValueChange}
      />
    )

    await user.clear(field())
    await user.type(field(), "2gb")
    await user.tab()
    expect(onValueChange).toHaveBeenLastCalledWith(2_000_000_000)
    expect(unitSelect()).toHaveValue("GB")

    await user.clear(field())
    await user.type(field(), "3 XB{Enter}")
    expect(field()).toHaveValue("2")
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })

  it("steps in the current unit with arrows, Shift and PageUp", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <UnitInput
        aria-label="Memory"
        defaultValue={512_000_000}
        defaultUnit="MB"
        onValueChange={onValueChange}
      />
    )

    await user.click(field())
    await user.keyboard("{ArrowUp}")
    expect(field()).toHaveValue("513")
    expect(onValueChange).toHaveBeenLastCalledWith(513_000_000)
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}")
    expect(field()).toHaveValue("503")
    await user.keyboard("{PageUp}")
    expect(field()).toHaveValue("513")
    await user.keyboard("{PageDown}")
    expect(field()).toHaveValue("503")
  })

  it("clamps to min and max in base units and jumps with Home and End", async () => {
    const user = userEvent.setup()
    render(
      <UnitInput
        aria-label="Memory"
        defaultValue={1_000_000_000}
        defaultUnit="GB"
        min={128_000_000}
        max={4_000_000_000}
      />
    )

    expect(field()).toHaveAttribute("aria-valuemin", "0.128")
    expect(field()).toHaveAttribute("aria-valuemax", "4")

    await user.click(field())
    await user.keyboard("{Shift>}{ArrowUp}{/Shift}")
    expect(field()).toHaveValue("4")
    await user.keyboard("{Home}")
    expect(field()).toHaveValue("0.128")
    await user.keyboard("{End}")
    expect(field()).toHaveValue("4")
  })

  it("works controlled and clears to null", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = render(
      <UnitInput
        aria-label="Memory"
        value={2_000_000_000}
        onValueChange={onValueChange}
      />
    )
    expect(field()).toHaveValue("2")
    expect(unitSelect()).toHaveValue("GB")

    rerender(
      <UnitInput
        aria-label="Memory"
        value={3_000_000_000}
        onValueChange={onValueChange}
      />
    )
    expect(field()).toHaveValue("3")

    await user.clear(field())
    await user.keyboard("{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith(null)
  })

  it("submits the base value and passes className and props through", () => {
    const { container } = render(
      <form>
        <UnitInput
          aria-label="Quota"
          name="quota"
          defaultValue={2_500_000}
          className="custom-class"
          placeholder="Quota"
        />
      </form>
    )
    expect(container.querySelector('input[name="quota"]')).toHaveValue(
      "2500000"
    )
    expect(container.querySelector('[data-slot="unit-input"]')).toHaveClass(
      "custom-class"
    )
    expect(field()).toHaveAttribute("placeholder", "Quota")
  })

  it("disables the field, the select and the submitted value", () => {
    const { container } = render(
      <form>
        <UnitInput
          aria-label="Memory"
          name="memory"
          defaultValue={1}
          disabled
        />
      </form>
    )
    expect(field()).toBeDisabled()
    expect(unitSelect()).toBeDisabled()
    const form = container.querySelector("form") as HTMLFormElement
    expect(new FormData(form).has("memory")).toBe(false)
  })

  it("ignores step and jump keys when readOnly", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <UnitInput
        aria-label="Memory"
        defaultValue={5}
        defaultUnit="B"
        min={0}
        max={10}
        readOnly
        onValueChange={onValueChange}
      />
    )
    await user.click(field())
    await user.keyboard("{ArrowUp}{PageDown}{Home}{End}")
    expect(field()).toHaveValue("5")
    expect(onValueChange).not.toHaveBeenCalled()
  })
})
