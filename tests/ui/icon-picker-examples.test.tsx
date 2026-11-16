import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"
import { beforeEach, describe, expect, it } from "vitest"

import { IconPickerCustomIconsPreview } from "@/components/preview/examples/icon-picker/custom-icons"
import { IconPickerPopoverPreview } from "@/components/preview/examples/icon-picker/popover"
import { IconPickerPreview } from "@/components/preview/icon-picker-preview"

describe("IconPicker examples", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("renders IconPickerPreview and selects an icon", async () => {
    const user = userEvent.setup()
    render(<IconPickerPreview />)

    expect(screen.getByRole("grid", { name: "Icons" })).toBeInTheDocument()
    expect(screen.getAllByText("folder-open").length).toBeGreaterThan(0)

    const searchInput = screen.getByRole("searchbox", { name: "Search icons" })
    await user.type(searchInput, "star")

    const starBtn = screen.getByRole("button", { name: "star" })
    await user.click(starBtn)

    expect(screen.getAllByText("star").length).toBeGreaterThan(0)
  })

  it("renders IconPickerPopoverPreview and picks an icon to close popover", async () => {
    const user = userEvent.setup()
    render(<IconPickerPopoverPreview />)

    const trigger = screen.getByRole("button", { name: "Choose icon" })
    expect(trigger).toHaveTextContent("folder-open")

    await user.click(trigger)
    expect(screen.getByRole("grid", { name: "Icons" })).toBeInTheDocument()

    const searchInput = screen.getByRole("searchbox", { name: "Search icons" })
    await user.type(searchInput, "star")

    const starBtn = screen.getByRole("button", { name: "star" })
    await user.click(starBtn)

    expect(
      screen.queryByRole("grid", { name: "Icons" })
    ).not.toBeInTheDocument()
    expect(trigger).toHaveTextContent("star")
  })

  it("renders IconPickerCustomIconsPreview with curated icons", async () => {
    const user = userEvent.setup()
    render(<IconPickerCustomIconsPreview />)

    expect(screen.getByRole("button", { name: "folder" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "sparkles" })).toBeInTheDocument()

    const searchInput = screen.getByRole("searchbox", { name: "Search icons" })
    await user.type(searchInput, "magic")

    expect(screen.getByRole("button", { name: "sparkles" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "sparkles" }))

    expect(screen.getAllByText("sparkles").length).toBeGreaterThan(0)
  })

  it("passes axe accessibility checks on IconPickerPreview", async () => {
    const { container } = render(<IconPickerPreview />)
    const { violations } = await axe.run(container, {
      rules: { region: { enabled: false } },
    })
    expect(violations).toEqual([])
  }, 15000)
})
