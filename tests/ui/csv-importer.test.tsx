import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import * as React from "react"
import { describe, expect, it, vi } from "vitest"

import { CsvImporter, type CsvField } from "@/registry/default/ui/csv-importer"

function makeCsvFile(name: string, content: string, type = "text/csv"): File {
  return new File([content], name, { type })
}

const FIELDS: CsvField[] = [
  { id: "name", label: "Full Name", required: true },
  {
    id: "email",
    label: "Work Email",
    required: true,
    validate: (val) =>
      String(val).includes("@") ? true : "Must be a valid email",
  },
  { id: "role", label: "Role" },
]

const VALID_CSV = `Full Name,Work Email,Role
Alice Smith,alice@example.com,Admin
Bob Jones,bob@example.com,Member`

const CSV_WITH_INVALID = `Full Name,Work Email,Role
Alice Smith,alice@example.com,Admin
Bob Jones,invalid-email,Member`

describe("CsvImporter", () => {
  it("renders upload step initially and handles file upload", async () => {
    const onComplete = vi.fn()
    render(<CsvImporter fields={FIELDS} onComplete={onComplete} />)

    expect(screen.getByText("Upload CSV File")).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /upload/i })).toBeInTheDocument()
    expect(
      screen.getByRole("tab", { name: /map columns/i })
    ).toBeInTheDocument()

    const dropzone = document.querySelector(
      "[data-slot=file-dropzone]"
    ) as HTMLElement
    expect(dropzone).toBeInTheDocument()

    const file = makeCsvFile("users.csv", VALID_CSV)
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    })

    await waitFor(() => {
      expect(
        within(screen.getByRole("tabpanel")).getByText("Map Columns")
      ).toBeInTheDocument()
    })

    expect(screen.getByText(/users.csv/)).toBeInTheDocument()
    expect(screen.getByText(/2 rows detected/)).toBeInTheDocument()
  })

  it("auto-suggests column mappings matching headers against fields", async () => {
    const file = makeCsvFile("team.csv", VALID_CSV)
    render(
      <CsvImporter fields={FIELDS} defaultFile={file} onComplete={vi.fn()} />
    )

    await waitFor(() => {
      expect(
        within(screen.getByRole("tabpanel")).getByText("Map Columns")
      ).toBeInTheDocument()
    })

    const nameSelect = screen.getByLabelText(
      "Map Full Name"
    ) as HTMLSelectElement
    const emailSelect = screen.getByLabelText(
      "Map Work Email"
    ) as HTMLSelectElement
    const roleSelect = screen.getByLabelText("Map Role") as HTMLSelectElement

    expect(nameSelect.value).toBe("col-0")
    expect(emailSelect.value).toBe("col-1")
    expect(roleSelect.value).toBe("col-2")
  })

  it("prevents proceeding to review when required fields are unmapped", async () => {
    const file = makeCsvFile("team.csv", "Unknown1,Unknown2\nVal1,Val2")
    render(
      <CsvImporter
        fields={FIELDS}
        defaultFile={file}
        autoMap={false}
        onComplete={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(
        within(screen.getByRole("tabpanel")).getByText("Map Columns")
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText(/Please map all required fields/i)
    ).toBeInTheDocument()

    const continueBtn = screen.getByRole("button", {
      name: /continue to review/i,
    })
    expect(continueBtn).toBeDisabled()
  })

  it("allows reviewing rows, shows validation errors, and fixes errors inline", async () => {
    const file = makeCsvFile("bad.csv", CSV_WITH_INVALID)
    render(
      <CsvImporter fields={FIELDS} defaultFile={file} onComplete={vi.fn()} />
    )

    await waitFor(() => {
      expect(
        within(screen.getByRole("tabpanel")).getByText("Map Columns")
      ).toBeInTheDocument()
    })

    const continueToReview = screen.getByRole("button", {
      name: /continue to review/i,
    })
    fireEvent.click(continueToReview)

    await waitFor(() => {
      expect(screen.getByText("Review & Fix Data")).toBeInTheDocument()
    })

    // Shows 1 invalid row notice
    expect(
      screen.getByText(/1 row contains validation errors/i)
    ).toBeInTheDocument()
    expect(screen.getByText("Must be a valid email")).toBeInTheDocument()

    // Find the cell input with invalid email
    const emailInput = screen.getByLabelText(
      "Work Email row 2"
    ) as HTMLInputElement
    expect(emailInput.value).toBe("invalid-email")
    expect(emailInput).toHaveAttribute("aria-invalid", "true")

    // Fix the error inline
    fireEvent.change(emailInput, { target: { value: "bob@example.com" } })

    // Now error is gone and all rows are valid
    await waitFor(() => {
      expect(
        screen.queryByText("Must be a valid email")
      ).not.toBeInTheDocument()
      expect(emailInput).toHaveAttribute("aria-invalid", "false")
    })
  })

  it("supports deleting a row during review", async () => {
    const file = makeCsvFile("data.csv", VALID_CSV)
    render(
      <CsvImporter fields={FIELDS} defaultFile={file} onComplete={vi.fn()} />
    )

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /continue to review/i })
      ).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole("button", { name: /continue to review/i }))

    await waitFor(() => {
      expect(screen.getByText("Review & Fix Data")).toBeInTheDocument()
    })

    expect(screen.getByText("All (2)")).toBeInTheDocument()

    const deleteBtn = screen.getByRole("button", { name: "Delete row 1" })
    fireEvent.click(deleteBtn)

    await waitFor(() => {
      expect(screen.getByText("All (1)")).toBeInTheDocument()
    })
  })

  it("progresses to import step and calls onComplete with clean data", async () => {
    const onComplete = vi.fn()
    const file = makeCsvFile("team.csv", VALID_CSV)
    render(
      <CsvImporter fields={FIELDS} defaultFile={file} onComplete={onComplete} />
    )

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /continue to review/i })
      ).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole("button", { name: /continue to review/i }))

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /continue to import/i })
      ).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole("button", { name: /continue to import/i }))

    await waitFor(() => {
      expect(screen.getByText("Confirm Import")).toBeInTheDocument()
      expect(screen.getByText(/2 records ready/i)).toBeInTheDocument()
    })

    const completeBtn = screen.getByRole("button", { name: /complete import/i })
    fireEvent.click(completeBtn)

    expect(onComplete).toHaveBeenCalledWith([
      { name: "Alice Smith", email: "alice@example.com", role: "Admin" },
      { name: "Bob Jones", email: "bob@example.com", role: "Member" },
    ])
  })

  it("resets when Escape is pressed on the importer container", async () => {
    const onCancel = vi.fn()
    const file = makeCsvFile("team.csv", VALID_CSV)
    render(
      <CsvImporter
        fields={FIELDS}
        defaultFile={file}
        onComplete={vi.fn()}
        onCancel={onCancel}
      />
    )

    await waitFor(() => {
      expect(
        within(screen.getByRole("tabpanel")).getByText("Map Columns")
      ).toBeInTheDocument()
    })

    const importer = document.querySelector(
      "[data-slot=csv-importer]"
    ) as HTMLElement
    expect(importer).toBeInTheDocument()

    fireEvent.keyDown(importer, { key: "Escape" })

    await waitFor(() => {
      expect(screen.getByText("Upload CSV File")).toBeInTheDocument()
    })
    expect(onCancel).toHaveBeenCalled()
  })

  it("preserves edited rows when returning to mapping and continuing without mapping changes", async () => {
    const file = makeCsvFile("bad.csv", CSV_WITH_INVALID)
    render(
      <CsvImporter fields={FIELDS} defaultFile={file} onComplete={vi.fn()} />
    )

    await waitFor(() => {
      expect(
        within(screen.getByRole("tabpanel")).getByText("Map Columns")
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /continue to review/i }))

    await waitFor(() => {
      expect(screen.getByText("Review & Fix Data")).toBeInTheDocument()
    })

    const emailInput = screen.getByLabelText("Work Email row 2")
    fireEvent.change(emailInput, { target: { value: "fixed@example.com" } })

    // Return to Mapping step
    fireEvent.click(screen.getByRole("button", { name: "Back" }))

    await waitFor(() => {
      expect(
        within(screen.getByRole("tabpanel")).getByText("Map Columns")
      ).toBeInTheDocument()
    })

    // Continue to Review step without changing any mapping
    fireEvent.click(screen.getByRole("button", { name: /continue to review/i }))

    await waitFor(() => {
      expect(screen.getByText("Review & Fix Data")).toBeInTheDocument()
    })

    const preservedEmailInput = screen.getByLabelText(
      "Work Email row 2"
    ) as HTMLInputElement
    expect(preservedEmailInput.value).toBe("fixed@example.com")
  })

  it("rejects defaultFile that exceeds maxFileSize", async () => {
    const largeFile = new File(["a".repeat(200)], "large.csv", {
      type: "text/csv",
    })
    render(
      <CsvImporter
        fields={FIELDS}
        defaultFile={largeFile}
        maxFileSize={100}
        onComplete={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(
        screen.getByText(/File exceeds maximum allowed size/i)
      ).toBeInTheDocument()
    })
  })

  it("composes caller-provided onKeyDown with Escape reset", async () => {
    const callerKeyDown = vi.fn()
    const file = makeCsvFile("team.csv", VALID_CSV)
    render(
      <CsvImporter
        fields={FIELDS}
        defaultFile={file}
        onComplete={vi.fn()}
        onKeyDown={callerKeyDown}
      />
    )

    await waitFor(() => {
      expect(
        within(screen.getByRole("tabpanel")).getByText("Map Columns")
      ).toBeInTheDocument()
    })

    const importer = document.querySelector(
      "[data-slot=csv-importer]"
    ) as HTMLElement
    fireEvent.keyDown(importer, { key: "Escape" })

    expect(callerKeyDown).toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.getByText("Upload CSV File")).toBeInTheDocument()
    })
  })
})
