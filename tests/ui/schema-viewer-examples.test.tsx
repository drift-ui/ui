import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { SchemaViewerConstraintsPreview } from "@/components/preview/examples/schema-viewer/constraints"
import { SchemaViewerRelationsPreview } from "@/components/preview/examples/schema-viewer/relations"
import { SchemaViewerPreview } from "@/components/preview/schema-viewer-preview"

describe("SchemaViewer previews", () => {
  it("tracks selected reference in SchemaViewerPreview", async () => {
    const user = userEvent.setup()
    render(<SchemaViewerPreview />)

    await user.click(screen.getByRole("link", { name: "References users.id" }))
    expect(screen.getByText("Selected reference:")).toBeInTheDocument()
    expect(
      screen.getByText("Selected reference:").closest("p")
    ).toHaveTextContent("Selected reference: users.id")
  })

  it("navigates between related tables in SchemaViewerRelationsPreview", async () => {
    const user = userEvent.setup()
    render(<SchemaViewerRelationsPreview />)

    expect(
      screen.getByRole("table", { name: "orders schema" })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "orders" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByRole("button", { name: "users" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )

    await user.click(screen.getByRole("link", { name: "References users.id" }))
    expect(
      screen.getByRole("table", { name: "users schema" })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "users" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )

    await user.click(screen.getByRole("button", { name: "orgs" }))
    expect(
      screen.getByRole("table", { name: "orgs schema" })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "orgs" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })

  it("renders SchemaViewerConstraintsPreview without a filter bar", () => {
    render(<SchemaViewerConstraintsPreview />)
    expect(
      screen.getByRole("table", { name: "billing.invoices schema" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("searchbox", { name: "Filter columns" })
    ).not.toBeInTheDocument()
  })
})
