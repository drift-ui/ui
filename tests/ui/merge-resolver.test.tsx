import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as React from "react"
import { describe, expect, it, vi } from "vitest"

import type {
  MergeField,
  MergeResolutions,
} from "@/registry/default/lib/merge-resolver.ts"
import { MergeResolver } from "@/registry/default/ui/merge-resolver"

const FIELDS: MergeField[] = [
  {
    name: "title",
    label: "Title",
    ours: "Draft Document",
    theirs: "Final Document",
  },
  {
    name: "status",
    label: "Status",
    ours: "published",
    theirs: "published",
  },
  {
    name: "summary",
    label: "Summary",
    ours: "Initial client draft",
    theirs: "Updated server version",
  },
]

describe("MergeResolver UI", () => {
  it("renders non-conflicting and conflicting fields properly", () => {
    render(<MergeResolver fields={FIELDS} />)

    expect(screen.getByText("No conflict")).toBeInTheDocument()
    expect(screen.getAllByText("Conflict")).toHaveLength(2)
    expect(
      screen.getByText("2 unresolved conflicts remaining")
    ).toBeInTheDocument()
  })

  it("announces live status update as conflicts are resolved", async () => {
    const user = userEvent.setup()
    render(<MergeResolver fields={FIELDS} />)

    const titleOursRadio = screen.getByRole("radio", {
      name: "Ours (Local) for Title",
    })
    await user.click(titleOursRadio)

    const statusElement = screen.getByText("1 unresolved conflict remaining")
    expect(statusElement).toBeInTheDocument()
    expect(statusElement).toHaveAttribute("aria-live", "polite")
    expect(statusElement).toHaveAttribute("aria-atomic", "true")

    const summaryTheirsRadio = screen.getByRole("radio", {
      name: "Theirs (Remote) for Summary",
    })
    await user.click(summaryTheirsRadio)

    expect(screen.getByText("All conflicts resolved")).toBeInTheDocument()
  })

  it("selects options and saves using keyboard navigation", async () => {
    const user = userEvent.setup()
    const onResolve = vi.fn()
    render(<MergeResolver fields={FIELDS} onResolve={onResolve} />)

    const titleOursRadio = screen.getByRole("radio", {
      name: "Ours (Local) for Title",
    })
    titleOursRadio.focus()
    expect(titleOursRadio).toHaveFocus()
    await user.keyboard(" ")
    expect(titleOursRadio).toBeChecked()

    const summaryTheirsRadio = screen.getByRole("radio", {
      name: "Theirs (Remote) for Summary",
    })
    summaryTheirsRadio.focus()
    expect(summaryTheirsRadio).toHaveFocus()
    await user.keyboard(" ")
    expect(summaryTheirsRadio).toBeChecked()

    const saveButton = screen.getByRole("button", { name: "Save resolutions" })
    expect(saveButton).not.toBeDisabled()
    saveButton.focus()
    expect(saveButton).toHaveFocus()
    await user.keyboard("{Enter}")

    expect(onResolve).toHaveBeenCalledWith({
      title: "Draft Document",
      status: "published",
      summary: "Updated server version",
    })
  })

  it("disables save button until all conflicting fields are resolved", async () => {
    const user = userEvent.setup()
    const onResolve = vi.fn()
    render(<MergeResolver fields={FIELDS} onResolve={onResolve} />)

    const saveButton = screen.getByRole("button", { name: "Save resolutions" })
    expect(saveButton).toBeDisabled()

    await user.click(
      screen.getByRole("radio", { name: "Ours (Local) for Title" })
    )
    expect(saveButton).toBeDisabled()

    await user.click(
      screen.getByRole("radio", { name: "Theirs (Remote) for Summary" })
    )
    expect(saveButton).not.toBeDisabled()

    await user.click(saveButton)
    expect(onResolve).toHaveBeenCalledWith({
      title: "Draft Document",
      status: "published",
      summary: "Updated server version",
    })
  })

  it("handles custom input editing and saves custom value", async () => {
    const user = userEvent.setup()
    const onResolve = vi.fn()
    render(<MergeResolver fields={FIELDS} onResolve={onResolve} />)

    await user.click(
      screen.getByRole("radio", { name: "Ours (Local) for Title" })
    )

    const summaryCustomRadio = screen.getByRole("radio", {
      name: "Custom for Summary",
    })
    await user.click(summaryCustomRadio)

    const customInput = screen.getByRole("textbox", {
      name: "Custom value for Summary",
    })
    expect(customInput).toHaveValue("Initial client draft")

    await user.clear(customInput)
    await user.type(customInput, "Hand-merged hybrid version")

    const saveButton = screen.getByRole("button", { name: "Save resolutions" })
    expect(saveButton).not.toBeDisabled()
    await user.click(saveButton)

    expect(onResolve).toHaveBeenCalledWith({
      title: "Draft Document",
      status: "published",
      summary: "Hand-merged hybrid version",
    })
  })

  it("accepts all ours with batch action button", async () => {
    const user = userEvent.setup()
    const onResolve = vi.fn()
    render(<MergeResolver fields={FIELDS} onResolve={onResolve} />)

    const acceptAllOurs = screen.getByRole("button", {
      name: "Accept all ours",
    })
    await user.click(acceptAllOurs)

    expect(screen.getByText("All conflicts resolved")).toBeInTheDocument()
    const saveButton = screen.getByRole("button", { name: "Save resolutions" })
    expect(saveButton).not.toBeDisabled()

    await user.click(saveButton)
    expect(onResolve).toHaveBeenCalledWith({
      title: "Draft Document",
      status: "published",
      summary: "Initial client draft",
    })
  })

  it("accepts all theirs with batch action button", async () => {
    const user = userEvent.setup()
    const onResolve = vi.fn()
    render(<MergeResolver fields={FIELDS} onResolve={onResolve} />)

    const acceptAllTheirs = screen.getByRole("button", {
      name: "Accept all theirs",
    })
    await user.click(acceptAllTheirs)

    expect(screen.getByText("All conflicts resolved")).toBeInTheDocument()
    const saveButton = screen.getByRole("button", { name: "Save resolutions" })
    expect(saveButton).not.toBeDisabled()

    await user.click(saveButton)
    expect(onResolve).toHaveBeenCalledWith({
      title: "Final Document",
      status: "published",
      summary: "Updated server version",
    })
  })

  it("supports controlled state via value and onValueChange", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const resolutions: MergeResolutions = {
      title: { choice: "ours" },
    }

    const { rerender } = render(
      <MergeResolver
        fields={FIELDS}
        value={resolutions}
        onValueChange={onValueChange}
      />
    )

    expect(
      screen.getByText("1 unresolved conflict remaining")
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole("radio", { name: "Theirs (Remote) for Summary" })
    )
    expect(onValueChange).toHaveBeenCalledWith({
      title: { choice: "ours" },
      summary: { choice: "theirs", customValue: undefined },
    })

    rerender(
      <MergeResolver
        fields={FIELDS}
        value={{
          title: { choice: "ours" },
          summary: { choice: "theirs" },
        }}
        onValueChange={onValueChange}
      />
    )

    expect(screen.getByText("All conflicts resolved")).toBeInTheDocument()
  })

  it("disables all actions when disabled prop is true", () => {
    render(<MergeResolver fields={FIELDS} disabled />)

    expect(
      screen.getByRole("button", { name: "Accept all ours" })
    ).toBeDisabled()
    expect(
      screen.getByRole("button", { name: "Accept all theirs" })
    ).toBeDisabled()
    expect(
      screen.getByRole("button", { name: "Save resolutions" })
    ).toBeDisabled()

    const radios = screen.getAllByRole("radio")
    radios.forEach((radio) => {
      expect(radio).toBeDisabled()
    })
  })

  it("marks empty values and falls back to the field name as label", () => {
    render(
      <MergeResolver
        fields={[
          { name: "notes", ours: "", theirs: "" },
          { name: "nickname", ours: "", theirs: "Mo" },
          { name: "bio", ours: "Designer", theirs: "" },
        ]}
      />
    )

    expect(screen.getByText("notes")).toBeInTheDocument()
    expect(screen.getAllByText("<empty>")).toHaveLength(3)
    expect(
      screen.getByRole("radio", { name: "Ours (Local) for nickname" })
    ).toBeInTheDocument()
  })

  it("shows an empty custom input when a custom choice has no value", () => {
    render(
      <MergeResolver fields={FIELDS} value={{ title: { choice: "custom" } }} />
    )

    expect(
      screen.getByRole("textbox", { name: "Custom value for Title" })
    ).toHaveValue("")
  })
})
