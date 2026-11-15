import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { FitSection } from "@/components/landing/fit-section"

function scopedCss(container: HTMLElement) {
  return container.querySelector("style")?.textContent ?? ""
}

describe("FitSection", () => {
  it("starts on Vega and reshapes only the demo card for the picked style", async () => {
    const user = userEvent.setup()
    const { container } = render(<FitSection />)

    expect(screen.getByRole("button", { name: /Vega/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(scopedCss(container)).toContain("[data-fit-demo]")
    expect(scopedCss(container)).toContain(
      "--drift-radius-control: var(--radius-md);"
    )

    await user.click(screen.getByRole("button", { name: /Lyra/ }))

    expect(screen.getByRole("button", { name: /Lyra/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(scopedCss(container)).toContain("--drift-radius-control: 0px;")
    expect(scopedCss(container)).not.toContain("[data-theme-scope]")
    expect(container.querySelector("[data-fit-demo]")).toHaveTextContent(
      "Invite teammates"
    )
  })
})
