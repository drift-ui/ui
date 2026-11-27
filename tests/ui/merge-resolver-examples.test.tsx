import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { MergeResolverBasicPreview } from "@/components/preview/examples/merge-resolver/basic"
import { MergeResolverCustomPreview } from "@/components/preview/examples/merge-resolver/custom"
import { MergeResolverPreview } from "@/components/preview/merge-resolver-preview"

describe("MergeResolver previews", () => {
  it("shows the resolved record and clears it on the next change", async () => {
    const user = userEvent.setup()
    render(<MergeResolverPreview />)

    await user.click(screen.getByRole("button", { name: "Accept all theirs" }))
    await user.click(screen.getByRole("button", { name: "Save resolutions" }))
    expect(screen.getByText("Resolved Record:")).toBeInTheDocument()

    await user.click(
      screen.getByRole("radio", { name: "Ours (Local) for Document Title" })
    )
    expect(screen.queryByText("Resolved Record:")).not.toBeInTheDocument()
  })

  it("shows the saved profile in the basic example", async () => {
    const user = userEvent.setup()
    render(<MergeResolverBasicPreview />)

    await user.click(screen.getByRole("button", { name: "Accept all ours" }))
    await user.click(screen.getByRole("button", { name: "Save resolutions" }))

    expect(
      screen.getByText("Resolved: Morgan Chen (Lead Designer)")
    ).toBeInTheDocument()
  })

  it("resets and resolves the custom example", async () => {
    const user = userEvent.setup()
    render(<MergeResolverCustomPreview />)

    await user.click(
      screen.getByRole("radio", {
        name: "Theirs (Remote) for Timeout (seconds)",
      })
    )
    await user.click(screen.getByRole("button", { name: "Save resolutions" }))
    expect(
      screen.getByText(
        "Endpoint: https://api-gateway.internal/v2, Timeout: 60s"
      )
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Reset selections" }))
    expect(screen.queryByText(/^Endpoint:/)).not.toBeInTheDocument()
    expect(
      screen.getByText("2 unresolved conflicts remaining")
    ).toBeInTheDocument()
  })
})
