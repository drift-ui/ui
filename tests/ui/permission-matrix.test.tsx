import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  PermissionMatrix,
  type PermissionGroup,
  type PermissionRole,
} from "@/registry/default/ui/permission-matrix"

const SAMPLE_ROLES: PermissionRole[] = [
  { id: "viewer", name: "Viewer", description: "View only" },
  { id: "editor", name: "Editor", inheritsFrom: "viewer" },
  { id: "admin", name: "Admin", inheritsFrom: "editor" },
]

const SAMPLE_GROUPS: PermissionGroup[] = [
  {
    id: "docs",
    name: "Documents",
    permissions: [
      { id: "docs.read", name: "Read Documents", description: "View docs" },
      { id: "docs.write", name: "Write Documents", description: "Edit docs" },
    ],
  },
  {
    id: "billing",
    name: "Billing",
    permissions: [{ id: "billing.view", name: "View Invoices" }],
  },
]

describe("PermissionMatrix", () => {
  it("renders grid structure with roles and permission groups", () => {
    render(
      <PermissionMatrix
        roles={SAMPLE_ROLES}
        permissions={SAMPLE_GROUPS}
        defaultValue={{ viewer: ["docs.read"] }}
      />
    )

    const grid = screen.getByRole("grid", { name: "Permissions Matrix" })
    expect(grid).toBeInTheDocument()

    // Role column headers
    expect(
      screen.getByRole("columnheader", { name: /^Viewer/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", { name: /^Editor/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", { name: /^Admin/i })
    ).toBeInTheDocument()

    // Group headers
    expect(
      screen.getByRole("rowheader", { name: /^Documents/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("rowheader", { name: /^Billing/i })
    ).toBeInTheDocument()

    // Action rows
    expect(
      screen.getByRole("rowheader", { name: /Read Documents/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("rowheader", { name: /Write Documents/i })
    ).toBeInTheDocument()
  })

  it("toggles an individual direct permission grant", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(
      <PermissionMatrix
        roles={SAMPLE_ROLES}
        permissions={SAMPLE_GROUPS}
        defaultValue={{ viewer: ["docs.read"] }}
        onValueChange={onValueChange}
      />
    )

    // Viewer -> Write Documents is initially unchecked
    const writeViewerCheckbox = screen.getByRole("checkbox", {
      name: "Write Documents for Viewer: Not granted",
    })
    expect(writeViewerCheckbox).toHaveAttribute("aria-checked", "false")

    await user.click(writeViewerCheckbox)

    expect(onValueChange).toHaveBeenCalledWith({
      viewer: ["docs.read", "docs.write"],
    })
  })

  it("toggles a group tri-state checkbox to grant all permissions in the group", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(
      <PermissionMatrix
        roles={SAMPLE_ROLES}
        permissions={SAMPLE_GROUPS}
        defaultValue={{ viewer: ["docs.read"] }}
        onValueChange={onValueChange}
      />
    )

    // Viewer has 1 of 2 docs permissions -> group checkbox is indeterminate/mixed
    const groupCheckbox = screen.getByRole("checkbox", {
      name: "Documents group permissions for Viewer",
    })
    expect(groupCheckbox).toHaveAttribute("aria-checked", "mixed")

    // Clicking indeterminate grants all in group
    await user.click(groupCheckbox)

    expect(onValueChange).toHaveBeenCalledWith({
      viewer: ["docs.read", "docs.write"],
    })
  })

  it("toggles a checked group checkbox to ungrant all permissions in the group", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(
      <PermissionMatrix
        roles={SAMPLE_ROLES}
        permissions={SAMPLE_GROUPS}
        defaultValue={{ viewer: ["docs.read", "docs.write"] }}
        onValueChange={onValueChange}
      />
    )

    const groupCheckbox = screen.getByRole("checkbox", {
      name: "Documents group permissions for Viewer",
    })
    expect(groupCheckbox).toHaveAttribute("aria-checked", "true")

    await user.click(groupCheckbox)

    expect(onValueChange).toHaveBeenCalledWith({
      viewer: [],
    })
  })

  it("displays inherited permissions and labels them with the source role", () => {
    render(
      <PermissionMatrix
        roles={SAMPLE_ROLES}
        permissions={SAMPLE_GROUPS}
        defaultValue={{ viewer: ["docs.read"] }}
      />
    )

    // Editor inherits docs.read from Viewer
    const inheritedCheckbox = screen.getByRole("checkbox", {
      name: "Read Documents for Editor: Inherited from Viewer",
    })
    expect(inheritedCheckbox).toBeInTheDocument()
    expect(inheritedCheckbox).toHaveAttribute("aria-checked", "true")
    expect(inheritedCheckbox).toHaveAttribute("title", "Inherited from Viewer")
  })

  it("disables editing inherited permissions when allowOverrideInherited is false", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(
      <PermissionMatrix
        roles={SAMPLE_ROLES}
        permissions={SAMPLE_GROUPS}
        defaultValue={{ viewer: ["docs.read"] }}
        allowOverrideInherited={false}
        onValueChange={onValueChange}
      />
    )

    const inheritedCheckbox = screen.getByRole("checkbox", {
      name: "Read Documents for Editor: Inherited from Viewer",
    })
    expect(inheritedCheckbox).toBeDisabled()

    await user.click(inheritedCheckbox)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("collapses and expands permission groups", async () => {
    const user = userEvent.setup()

    render(
      <PermissionMatrix roles={SAMPLE_ROLES} permissions={SAMPLE_GROUPS} />
    )

    // Initially expanded
    expect(
      screen.getByRole("rowheader", { name: /Read Documents/i })
    ).toBeInTheDocument()

    // Click Documents group row header to collapse
    const docsHeader = screen.getByRole("rowheader", { name: /^Documents/i })
    await user.click(docsHeader)

    expect(
      screen.queryByRole("rowheader", { name: /Read Documents/i })
    ).not.toBeInTheDocument()

    // Click again to expand
    await user.click(docsHeader)
    expect(
      screen.getByRole("rowheader", { name: /Read Documents/i })
    ).toBeInTheDocument()
  })

  it("filters permissions by search query", async () => {
    const user = userEvent.setup()

    render(
      <PermissionMatrix roles={SAMPLE_ROLES} permissions={SAMPLE_GROUPS} />
    )

    const searchInput = screen.getByRole("searchbox", {
      name: "Filter permissions...",
    })
    await user.type(searchInput, "Invoices")

    // Billing should be visible, Documents should be filtered out
    expect(
      screen.getByRole("rowheader", { name: /View Invoices/i })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("rowheader", { name: /^Documents/i })
    ).not.toBeInTheDocument()

    // Clear search
    const clearBtn = screen.getByRole("button", { name: "Clear search" })
    await user.click(clearBtn)

    expect(
      screen.getByRole("rowheader", { name: /^Documents/i })
    ).toBeInTheDocument()
  })

  it("counts the empty-state row in aria-rowcount", async () => {
    const user = userEvent.setup()

    render(
      <PermissionMatrix roles={SAMPLE_ROLES} permissions={SAMPLE_GROUPS} />
    )

    await user.type(
      screen.getByRole("searchbox", { name: "Filter permissions..." }),
      "zzz-no-match"
    )

    const grid = screen.getByRole("grid")
    expect(grid).toHaveAttribute("aria-rowcount", "2")
    expect(screen.getAllByRole("row")).toHaveLength(2)
  })

  it("supports read-only mode disabling all interactive checkboxes", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(
      <PermissionMatrix
        roles={SAMPLE_ROLES}
        permissions={SAMPLE_GROUPS}
        defaultValue={{ viewer: ["docs.read"] }}
        readOnly
        onValueChange={onValueChange}
      />
    )

    const checkboxes = screen.getAllByRole("checkbox")
    for (const checkbox of checkboxes) {
      expect(checkbox).toBeDisabled()
    }

    await user.click(checkboxes[0])
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("disables only the specific disabled role column", () => {
    const rolesWithDisabled: PermissionRole[] = [
      { id: "viewer", name: "Viewer", disabled: true },
      { id: "editor", name: "Editor" },
    ]

    render(
      <PermissionMatrix roles={rolesWithDisabled} permissions={SAMPLE_GROUPS} />
    )

    const viewerWrite = screen.getByRole("checkbox", {
      name: "Write Documents for Viewer: Not granted",
    })
    const editorWrite = screen.getByRole("checkbox", {
      name: "Write Documents for Editor: Not granted",
    })

    expect(viewerWrite).toBeDisabled()
    expect(editorWrite).not.toBeDisabled()
  })

  it("supports 2D keyboard navigation and space toggling across grid cells", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(
      <PermissionMatrix
        roles={SAMPLE_ROLES}
        permissions={SAMPLE_GROUPS}
        defaultValue={{}}
        onValueChange={onValueChange}
      />
    )

    // Top-left header cell (0, 0) starts with tabIndex=0
    const cornerHeader = screen.getByRole("columnheader", {
      name: "Permissions",
    })
    expect(cornerHeader).toHaveAttribute("tabindex", "0")
    cornerHeader.focus()
    expect(cornerHeader).toHaveFocus()

    // ArrowRight -> Role 1 header (Viewer)
    await user.keyboard("{ArrowRight}")
    const viewerHeader = screen.getByRole("columnheader", { name: /^Viewer/i })
    expect(viewerHeader).toHaveFocus()

    // ArrowDown -> Group row cell for Viewer (Row 1, Col 1)
    await user.keyboard("{ArrowDown}")
    const groupCellViewer = screen.getByRole("gridcell", {
      name: /Documents group permissions for Viewer/i,
    })
    expect(groupCellViewer).toHaveFocus()

    // Press Space on group cell -> grants all in group
    await user.keyboard(" ")
    expect(onValueChange).toHaveBeenCalledWith({
      viewer: ["docs.read", "docs.write"],
    })

    // ArrowDown -> Action row cell for Viewer (Row 2, Col 1: Read Documents)
    await user.keyboard("{ArrowDown}")
    const actionCell = screen.getByRole("gridcell", {
      name: /Read Documents for Viewer/i,
    })
    expect(actionCell).toHaveFocus()

    // ArrowLeft -> Action rowheader (Row 2, Col 0: Read Documents name)
    await user.keyboard("{ArrowLeft}")
    const actionHeader = screen.getByRole("rowheader", {
      name: /Read Documents/i,
    })
    expect(actionHeader).toHaveFocus()

    // Home -> moves to col 0
    await user.keyboard("{Home}")
    expect(actionHeader).toHaveFocus()

    // End -> moves to last column
    await user.keyboard("{End}")
    const lastColCell = screen.getByRole("gridcell", {
      name: /Read Documents for Admin/i,
    })
    expect(lastColCell).toHaveFocus()
  })
})
