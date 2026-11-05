import * as React from "react"
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { SavedViews, type SavedView } from "@/registry/default/ui/saved-views"

const SAMPLE_VIEWS: SavedView[] = [
  { id: "all", name: "All Issues", isDefault: true },
  { id: "active", name: "Active Sprint" },
  { id: "high", name: "High Priority" },
]

describe("SavedViews", () => {
  it("renders views as tabs with the default view active", () => {
    render(<SavedViews defaultViews={SAMPLE_VIEWS} />)

    const tabs = screen.getAllByRole("tab")
    expect(tabs).toHaveLength(3)
    expect(tabs[0]).toHaveAttribute("aria-selected", "true")
    expect(tabs[1]).toHaveAttribute("aria-selected", "false")
    expect(tabs[2]).toHaveAttribute("aria-selected", "false")
  })

  it("switches active view on click and calls onActiveChange", async () => {
    const user = userEvent.setup()
    const onActiveChange = vi.fn()

    render(
      <SavedViews defaultViews={SAMPLE_VIEWS} onActiveChange={onActiveChange} />
    )

    const activeSprintTab = screen.getByRole("tab", { name: "Active Sprint" })
    await user.click(activeSprintTab)

    expect(activeSprintTab).toHaveAttribute("aria-selected", "true")
    expect(onActiveChange).toHaveBeenCalledWith("active")
  })

  it("supports keyboard navigation across tabs with Arrow keys", async () => {
    const user = userEvent.setup()
    const onActiveChange = vi.fn()

    render(
      <SavedViews defaultViews={SAMPLE_VIEWS} onActiveChange={onActiveChange} />
    )

    const firstTab = screen.getByRole("tab", { name: "All Issues" })
    firstTab.focus()

    // ArrowRight -> Active Sprint
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: "Active Sprint" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    expect(onActiveChange).toHaveBeenCalledWith("active")

    // ArrowRight -> High Priority
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: "High Priority" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    expect(onActiveChange).toHaveBeenCalledWith("high")

    // ArrowLeft -> Active Sprint
    await user.keyboard("{ArrowLeft}")
    expect(screen.getByRole("tab", { name: "Active Sprint" })).toHaveAttribute(
      "aria-selected",
      "true"
    )

    // Home -> All Issues
    await user.keyboard("{Home}")
    expect(screen.getByRole("tab", { name: "All Issues" })).toHaveAttribute(
      "aria-selected",
      "true"
    )

    // End -> High Priority
    await user.keyboard("{End}")
    expect(screen.getByRole("tab", { name: "High Priority" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
  })

  it("displays unsaved changes actions and calls onSave and onReset", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onReset = vi.fn()

    const { rerender } = render(
      <SavedViews
        defaultViews={SAMPLE_VIEWS}
        isDirty={false}
        onSave={onSave}
        onReset={onReset}
      />
    )

    expect(screen.queryByText("Unsaved")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Save" })
    ).not.toBeInTheDocument()

    // Turn dirty state on
    rerender(
      <SavedViews
        defaultViews={SAMPLE_VIEWS}
        isDirty={true}
        onSave={onSave}
        onReset={onReset}
      />
    )

    expect(screen.getByText("Unsaved")).toBeInTheDocument()
    const saveButton = screen.getByRole("button", { name: "Save" })
    const discardButton = screen.getByRole("button", { name: "Discard" })

    await user.click(saveButton)
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: "all", name: "All Issues" })
    )

    await user.click(discardButton)
    expect(onReset).toHaveBeenCalledWith(
      expect.objectContaining({ id: "all", name: "All Issues" })
    )
  })

  it("creates a new view via the add button popover", async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    const onViewsChange = vi.fn()

    render(
      <SavedViews
        defaultViews={SAMPLE_VIEWS}
        onCreate={onCreate}
        onViewsChange={onViewsChange}
      />
    )

    const addButton = screen.getByRole("button", { name: "Create new view" })
    await user.click(addButton)

    const input = screen.getByPlaceholderText("New view name...")
    await user.type(input, "My Custom View")

    const submitButton = screen.getByRole("button", { name: "Create view" })
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByRole("tab", { name: "My Custom View" })
      ).toBeInTheDocument()
    })
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "My Custom View" })
    )
    expect(onViewsChange).toHaveBeenCalled()
  })

  it("renames a view via the options menu", async () => {
    const user = userEvent.setup()
    const onRename = vi.fn()

    render(<SavedViews defaultViews={SAMPLE_VIEWS} onRename={onRename} />)

    // Make Active Sprint the active view
    const tab = screen.getByRole("tab", { name: "Active Sprint" })
    await user.click(tab)

    const optionsButton = screen.getByRole("button", {
      name: "Options for Active Sprint",
    })
    await user.click(optionsButton)

    const renameOption = screen.getByRole("menuitem", { name: "Rename" })
    await user.click(renameOption)

    const renameInput = screen.getByRole("textbox", { name: "Rename view" })
    await user.clear(renameInput)
    await user.type(renameInput, "Current Sprint{Enter}")

    await waitFor(() => {
      expect(
        screen.getByRole("tab", { name: "Current Sprint" })
      ).toBeInTheDocument()
    })
    expect(onRename).toHaveBeenCalledWith(
      expect.objectContaining({ id: "active", name: "Current Sprint" }),
      "Current Sprint"
    )
  })

  it("renames a view using the F2 keyboard shortcut", async () => {
    const user = userEvent.setup()

    render(<SavedViews defaultViews={SAMPLE_VIEWS} />)

    const tab = screen.getByRole("tab", { name: "Active Sprint" })
    tab.focus()
    await user.keyboard("{F2}")

    const renameInput = screen.getByRole("textbox", { name: "Rename view" })
    expect(renameInput).toBeInTheDocument()
    await user.clear(renameInput)
    await user.type(renameInput, "Sprint 42{Enter}")

    const renamedTab = screen.getByRole("tab", { name: "Sprint 42" })
    expect(renamedTab).toBeInTheDocument()
    expect(renamedTab).toHaveFocus()
  })

  it("duplicates a view via the options menu", async () => {
    const user = userEvent.setup()
    const onDuplicate = vi.fn()

    render(<SavedViews defaultViews={SAMPLE_VIEWS} onDuplicate={onDuplicate} />)

    const tab = screen.getByRole("tab", { name: "Active Sprint" })
    await user.click(tab)

    const optionsButton = screen.getByRole("button", {
      name: "Options for Active Sprint",
    })
    await user.click(optionsButton)

    const duplicateOption = screen.getByRole("menuitem", { name: "Duplicate" })
    await user.click(duplicateOption)

    await waitFor(() => {
      expect(
        screen.getByRole("tab", { name: "Active Sprint (Copy)" })
      ).toBeInTheDocument()
    })
    expect(onDuplicate).toHaveBeenCalled()
  })

  it("sets a view as default via the options menu", async () => {
    const user = userEvent.setup()
    const onSetDefault = vi.fn()

    render(
      <SavedViews defaultViews={SAMPLE_VIEWS} onSetDefault={onSetDefault} />
    )

    const tab = screen.getByRole("tab", { name: "Active Sprint" })
    await user.click(tab)

    const optionsButton = screen.getByRole("button", {
      name: "Options for Active Sprint",
    })
    await user.click(optionsButton)

    const setDefaultOption = screen.getByRole("menuitem", {
      name: "Set as default",
    })
    await user.click(setDefaultOption)

    expect(onSetDefault).toHaveBeenCalledWith("active")
  })

  it("deletes a view and activates the fallback view", async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()

    render(<SavedViews defaultViews={SAMPLE_VIEWS} onDelete={onDelete} />)

    // Switch to High Priority first
    const highTab = screen.getByRole("tab", { name: "High Priority" })
    await user.click(highTab)
    expect(highTab).toHaveAttribute("aria-selected", "true")

    // Delete High Priority
    const optionsButton = screen.getByRole("button", {
      name: "Options for High Priority",
    })
    await user.click(optionsButton)

    const deleteOption = screen.getByRole("menuitem", { name: "Delete" })
    await user.click(deleteOption)

    expect(onDelete).toHaveBeenCalledWith("high")
    expect(
      screen.queryByRole("tab", { name: "High Priority" })
    ).not.toBeInTheDocument()
    // Fallback activates default view "All Issues"
    expect(screen.getByRole("tab", { name: "All Issues" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
  })

  it("renders the select variant as a compact dropdown", async () => {
    const user = userEvent.setup()
    const onActiveChange = vi.fn()

    render(
      <SavedViews
        variant="select"
        defaultViews={SAMPLE_VIEWS}
        onActiveChange={onActiveChange}
        isDirty={true}
      />
    )

    const trigger = screen.getByRole("button", {
      name: /Saved views: All Issues/i,
    })
    expect(trigger).toBeInTheDocument()
    expect(screen.getByText("Unsaved")).toBeInTheDocument()

    await user.click(trigger)
    const activeOption = screen.getByRole("button", { name: "Active Sprint" })
    await user.click(activeOption)

    expect(onActiveChange).toHaveBeenCalledWith("active")
  })

  it("renames a view in select mode", async () => {
    const user = userEvent.setup()
    const onRename = vi.fn()

    render(
      <SavedViews
        variant="select"
        defaultViews={SAMPLE_VIEWS}
        onRename={onRename}
      />
    )

    const trigger = screen.getByRole("button", {
      name: /Saved views: All Issues/i,
    })
    await user.click(trigger)

    const optionsButton = screen.getByRole("button", {
      name: "Options for Active Sprint",
    })
    await user.click(optionsButton)

    const renameOption = screen.getByRole("menuitem", { name: "Rename" })
    await user.click(renameOption)

    const renameInput = screen.getByRole("textbox", { name: "Rename view" })
    expect(renameInput).toBeInTheDocument()
    await user.clear(renameInput)
    await user.type(renameInput, "Current Sprint{Enter}")

    expect(onRename).toHaveBeenCalledWith(
      expect.objectContaining({ id: "active", name: "Current Sprint" }),
      "Current Sprint"
    )
  })

  it("closes select popover on view selection and creation", async () => {
    const user = userEvent.setup()

    render(<SavedViews variant="select" defaultViews={SAMPLE_VIEWS} />)

    const trigger = screen.getByRole("button", {
      name: /Saved views: All Issues/i,
    })
    await user.click(trigger)

    expect(screen.getByRole("listbox")).toBeInTheDocument()

    // Click a view -> popover closes
    const option = screen.getByRole("button", { name: "Active Sprint" })
    await user.click(option)

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    })

    // Open again and create a view -> popover closes
    await user.click(trigger)
    expect(screen.getByRole("listbox")).toBeInTheDocument()

    const input = screen.getByPlaceholderText("New view name...")
    await user.type(input, "Brand New View")
    const addButton = screen.getByRole("button", { name: "Add" })
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    })
  })

  it("falls back to default view when activeId does not match any view", () => {
    render(<SavedViews defaultViews={SAMPLE_VIEWS} activeId="non-existent" />)

    const defaultTab = screen.getByRole("tab", { name: "All Issues" })
    expect(defaultTab).toHaveAttribute("aria-selected", "true")
    expect(defaultTab).toHaveAttribute("tabindex", "0")
  })

  it("returns focus to the tab after completing or cancelling rename", async () => {
    const user = userEvent.setup()

    render(<SavedViews defaultViews={SAMPLE_VIEWS} />)

    const tab = screen.getByRole("tab", { name: "Active Sprint" })
    tab.focus()
    await user.keyboard("{F2}")

    const input = screen.getByRole("textbox", { name: "Rename view" })
    expect(input).toHaveFocus()

    // Cancel with Escape
    await user.keyboard("{Escape}")
    expect(screen.getByRole("tab", { name: "Active Sprint" })).toHaveFocus()

    // Enter again and commit
    await user.keyboard("{F2}")
    const input2 = screen.getByRole("textbox", { name: "Rename view" })
    await user.type(input2, " 2{Enter}")
    expect(screen.getByRole("tab", { name: "Active Sprint 2" })).toHaveFocus()
  })

  it("does not call onRename or update views when rename name is unchanged", async () => {
    const user = userEvent.setup()
    const onRename = vi.fn()
    const onViewsChange = vi.fn()

    render(
      <SavedViews
        defaultViews={SAMPLE_VIEWS}
        onRename={onRename}
        onViewsChange={onViewsChange}
      />
    )

    const tab = screen.getByRole("tab", { name: "Active Sprint" })
    tab.focus()
    await user.keyboard("{F2}")

    const input = screen.getByRole("textbox", { name: "Rename view" })
    expect(input).toBeInTheDocument()
    await user.keyboard("{Enter}")

    expect(onRename).not.toHaveBeenCalled()
    expect(onViewsChange).not.toHaveBeenCalled()
  })

  it("does not show delete option for locked views", async () => {
    const user = userEvent.setup()
    const viewsWithLocked: SavedView[] = [
      { id: "all", name: "All Issues", isDefault: true, isLocked: true },
      { id: "custom", name: "Custom View" },
    ]

    render(<SavedViews defaultViews={viewsWithLocked} />)

    // All Issues is locked and active
    const optionsButton = screen.getByRole("button", {
      name: "Options for All Issues",
    })
    await user.click(optionsButton)

    expect(
      screen.queryByRole("menuitem", { name: "Delete" })
    ).not.toBeInTheDocument()
  })

  it("does not show delete option when only one view exists", async () => {
    const user = userEvent.setup()
    const singleView: SavedView[] = [{ id: "solo", name: "Solo View" }]

    render(<SavedViews defaultViews={singleView} />)

    const optionsButton = screen.getByRole("button", {
      name: "Options for Solo View",
    })
    await user.click(optionsButton)

    expect(
      screen.queryByRole("menuitem", { name: "Delete" })
    ).not.toBeInTheDocument()
  })

  it("supports arrow key navigation in the options menu", async () => {
    const user = userEvent.setup()

    render(<SavedViews defaultViews={SAMPLE_VIEWS} />)

    const optionsButton = screen.getByRole("button", {
      name: "Options for All Issues",
    })
    await user.click(optionsButton)

    const menu = screen.getByRole("menu")
    expect(menu).toBeInTheDocument()

    const menuItems = screen.getAllByRole("menuitem")
    menuItems[0].focus()
    expect(menuItems[0]).toHaveFocus()

    // ArrowDown -> next item
    await user.keyboard("{ArrowDown}")
    expect(menuItems[1]).toHaveFocus()

    // ArrowUp -> back to first item
    await user.keyboard("{ArrowUp}")
    expect(menuItems[0]).toHaveFocus()
  })
})

function deferred() {
  let resolve!: () => void
  let reject!: (error: unknown) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

async function openOptions(
  user: ReturnType<typeof userEvent.setup>,
  name: string
) {
  await user.click(screen.getByRole("button", { name: `Options for ${name}` }))
}

describe("SavedViews dirty tracking", () => {
  const DATA_VIEWS: SavedView<{ status: string; q?: string }>[] = [
    { id: "all", name: "All", isDefault: true, data: { status: "any" } },
    { id: "open", name: "Open", data: { status: "open" } },
  ]

  it("works out isDirty from currentData", () => {
    const { rerender } = render(
      <SavedViews defaultViews={DATA_VIEWS} currentData={{ status: "any" }} />
    )
    expect(screen.queryByText("Unsaved")).not.toBeInTheDocument()

    rerender(
      <SavedViews defaultViews={DATA_VIEWS} currentData={{ status: "open" }} />
    )
    expect(screen.getByText("Unsaved")).toBeInTheDocument()

    rerender(
      <SavedViews
        defaultViews={DATA_VIEWS}
        currentData={{ q: undefined, status: "any" }}
      />
    )
    expect(screen.queryByText("Unsaved")).not.toBeInTheDocument()
  })

  it("stays clean for views that have no data", () => {
    render(<SavedViews defaultViews={SAMPLE_VIEWS} currentData={[]} />)
    expect(screen.queryByText("Unsaved")).not.toBeInTheDocument()
  })

  it("skips the compare when isDirty is passed", () => {
    const isEqual = vi.fn(() => true)
    render(
      <SavedViews
        defaultViews={DATA_VIEWS}
        currentData={{ status: "open" }}
        isEqual={isEqual}
        isDirty
      />
    )
    expect(isEqual).not.toHaveBeenCalled()
  })

  it("lets an isDirty prop override the computed value", () => {
    render(
      <SavedViews
        defaultViews={DATA_VIEWS}
        currentData={{ status: "open" }}
        isDirty={false}
      />
    )
    expect(screen.queryByText("Unsaved")).not.toBeInTheDocument()
  })

  it("uses a custom isEqual", () => {
    render(
      <SavedViews
        defaultViews={DATA_VIEWS}
        currentData={{ status: "ANY" }}
        isEqual={(saved, current) =>
          saved?.status.toLowerCase() === current.status.toLowerCase()
        }
      />
    )
    expect(screen.queryByText("Unsaved")).not.toBeInTheDocument()
  })

  it("is clean after saving in uncontrolled mode", async () => {
    const user = userEvent.setup()
    render(
      <SavedViews defaultViews={DATA_VIEWS} currentData={{ status: "done" }} />
    )
    await user.click(screen.getByRole("button", { name: "Save" }))
    expect(screen.queryByText("Unsaved")).not.toBeInTheDocument()
  })
})

describe("SavedViews async storage", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("marks a created view pending until the promise resolves", async () => {
    const user = userEvent.setup()
    const request = deferred()
    render(
      <SavedViews
        defaultViews={SAMPLE_VIEWS}
        onCreate={() => request.promise}
      />
    )

    await user.click(screen.getByRole("button", { name: "Create new view" }))
    await user.type(screen.getByPlaceholderText("New view name..."), "Mine")
    await user.click(screen.getByRole("button", { name: "Create view" }))

    const tab = screen.getByRole("tab", { name: "Mine" })
    expect(tab).toHaveAttribute("aria-busy", "true")
    expect(tab).toHaveAttribute("aria-selected", "true")

    await act(async () => request.resolve())
    expect(tab).not.toHaveAttribute("aria-busy")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("rolls back a failed create and reselects the previous view", async () => {
    const user = userEvent.setup()
    const request = deferred()
    const onError = vi.fn()
    render(
      <SavedViews
        defaultViews={SAMPLE_VIEWS}
        defaultActiveId="active"
        onCreate={() => request.promise}
        onError={onError}
      />
    )

    await user.click(screen.getByRole("button", { name: "Create new view" }))
    await user.type(screen.getByPlaceholderText("New view name..."), "Mine")
    await user.click(screen.getByRole("button", { name: "Create view" }))
    expect(screen.getByRole("tab", { name: "Mine" })).toBeInTheDocument()

    const error = new Error("offline")
    await act(async () => request.reject(error))

    expect(screen.queryByRole("tab", { name: "Mine" })).not.toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Active Sprint" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    expect(screen.getByRole("alert")).toHaveTextContent(
      `Couldn't create "Mine". The change was undone.`
    )
    expect(onError).toHaveBeenCalledWith(error, "create")
  })

  it("rolls back a failed rename", async () => {
    const user = userEvent.setup()
    const request = deferred()
    render(
      <SavedViews
        defaultViews={SAMPLE_VIEWS}
        onRename={() => request.promise}
      />
    )

    screen.getByRole("tab", { name: "All Issues" }).focus()
    await user.keyboard("{F2}")
    const input = screen.getByRole("textbox", { name: "Rename view" })
    await user.clear(input)
    await user.type(input, "Everything{Enter}")
    expect(screen.getByRole("tab", { name: "Everything" })).toHaveAttribute(
      "aria-busy",
      "true"
    )

    await act(async () => request.reject(new Error("nope")))
    expect(screen.getByRole("tab", { name: "All Issues" })).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent(
      `Couldn't rename "All Issues".`
    )
  })

  it("restores a deleted view at its position and reselects it", async () => {
    const user = userEvent.setup()
    const request = deferred()
    const onViewsChange = vi.fn()
    render(
      <SavedViews
        defaultViews={SAMPLE_VIEWS}
        defaultActiveId="active"
        onDelete={() => request.promise}
        onViewsChange={onViewsChange}
      />
    )

    await openOptions(user, "Active Sprint")
    await user.click(screen.getByRole("menuitem", { name: "Delete" }))
    expect(
      screen.queryByRole("tab", { name: "Active Sprint" })
    ).not.toBeInTheDocument()

    await act(async () => request.reject(new Error("nope")))

    const tabs = screen.getAllByRole("tab")
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "All Issues",
      "Active Sprint",
      "High Priority",
    ])
    expect(tabs[1]).toHaveAttribute("aria-selected", "true")
    expect(onViewsChange).toHaveBeenLastCalledWith(SAMPLE_VIEWS)
  })

  it("does not steal the selection back if the user moved on", async () => {
    const user = userEvent.setup()
    const request = deferred()
    render(
      <SavedViews
        defaultViews={SAMPLE_VIEWS}
        defaultActiveId="active"
        onDelete={() => request.promise}
      />
    )

    await openOptions(user, "Active Sprint")
    await user.click(screen.getByRole("menuitem", { name: "Delete" }))
    await user.click(screen.getByRole("tab", { name: "High Priority" }))

    await act(async () => request.reject(new Error("nope")))
    expect(screen.getByRole("tab", { name: "High Priority" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
  })

  it("rolls back a failed set default", async () => {
    const user = userEvent.setup()
    const request = deferred()
    const onViewsChange = vi.fn()
    render(
      <SavedViews
        defaultViews={SAMPLE_VIEWS}
        defaultActiveId="high"
        onSetDefault={() => request.promise}
        onViewsChange={onViewsChange}
      />
    )

    await openOptions(user, "High Priority")
    await user.click(screen.getByRole("menuitem", { name: "Set as default" }))
    expect(onViewsChange).toHaveBeenLastCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: "high", isDefault: true }),
      ])
    )

    await act(async () => request.reject(new Error("nope")))
    const last = onViewsChange.mock.lastCall?.[0] as SavedView[]
    expect(last.find((v) => v.isDefault)?.id).toBe("all")
  })

  it("restores the saved data when a save fails", async () => {
    const user = userEvent.setup()
    const request = deferred()
    render(
      <SavedViews
        defaultViews={[{ id: "a", name: "A", data: { q: "old" } }]}
        currentData={{ q: "new" }}
        onSave={() => request.promise}
      />
    )

    await user.click(screen.getByRole("button", { name: "Save" }))
    expect(screen.queryByText("Unsaved")).not.toBeInTheDocument()

    await act(async () => request.reject(new Error("nope")))
    expect(screen.getByText("Unsaved")).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent(`Couldn't save "A".`)
  })

  it("blocks actions on a pending view", async () => {
    const user = userEvent.setup()
    const request = deferred()
    const onSave = vi.fn(() => request.promise)
    render(
      <SavedViews
        defaultViews={[{ id: "a", name: "A", data: { q: "old" } }]}
        currentData={{ q: "new" }}
        isDirty
        onSave={onSave}
      />
    )

    const save = screen.getByRole("button", { name: "Save" })
    await user.click(save)
    expect(save).toHaveAttribute("aria-disabled", "true")
    await user.click(save)
    expect(onSave).toHaveBeenCalledTimes(1)

    const options = screen.getByRole("button", { name: "Options for A" })
    expect(options).toHaveAttribute("aria-disabled", "true")
    await user.click(options)
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()

    screen.getByRole("tab", { name: /^A/ }).focus()
    await user.keyboard("{F2}")
    expect(
      screen.queryByRole("textbox", { name: "Rename view" })
    ).not.toBeInTheDocument()

    await act(async () => request.resolve())
    expect(options).not.toHaveAttribute("aria-disabled")
  })

  it("keeps sync callbacks optimistic with no pending state", async () => {
    const user = userEvent.setup()
    render(<SavedViews defaultViews={SAMPLE_VIEWS} onCreate={() => {}} />)

    await user.click(screen.getByRole("button", { name: "Create new view" }))
    await user.type(screen.getByPlaceholderText("New view name..."), "Mine")
    await user.keyboard("{Enter}")

    expect(screen.getByRole("tab", { name: "Mine" })).not.toHaveAttribute(
      "aria-busy"
    )
  })

  it("dismisses the error with the keyboard", async () => {
    const user = userEvent.setup()
    const request = deferred()
    render(
      <SavedViews
        defaultViews={SAMPLE_VIEWS}
        onDelete={() => request.promise}
      />
    )

    await openOptions(user, "All Issues")
    await user.click(screen.getByRole("menuitem", { name: "Delete" }))
    await act(async () => request.reject(new Error("nope")))

    screen.getByRole("button", { name: "Dismiss" }).focus()
    await user.keyboard("{Enter}")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("rolls back when a callback throws before returning", async () => {
    const user = userEvent.setup()
    const onError = vi.fn()
    const error = new Error("bad input")
    render(
      <SavedViews
        defaultViews={SAMPLE_VIEWS}
        onDelete={() => {
          throw error
        }}
        onError={onError}
      />
    )

    await openOptions(user, "All Issues")
    await user.click(screen.getByRole("menuitem", { name: "Delete" }))

    expect(
      await screen.findByRole("tab", { name: "All Issues" })
    ).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent(
      `Couldn't delete "All Issues". The change was undone.`
    )
    expect(onError).toHaveBeenCalledWith(error, "delete")
  })

  it("does not claim an undo when there was nothing to undo", async () => {
    const user = userEvent.setup()
    const request = deferred()
    render(
      <SavedViews
        defaultViews={SAMPLE_VIEWS}
        isDirty
        onSave={() => request.promise}
      />
    )

    await user.click(screen.getByRole("button", { name: "Save" }))
    await act(async () => request.reject(new Error("nope")))

    expect(screen.getByRole("alert")).toHaveTextContent(
      `Couldn't save "All Issues".`
    )
    expect(screen.getByRole("alert")).not.toHaveTextContent("undone")
  })

  it("allows one set default request at a time", async () => {
    const user = userEvent.setup()
    const request = deferred()
    const onSetDefault = vi.fn(() => request.promise)
    render(
      <SavedViews
        defaultViews={SAMPLE_VIEWS}
        defaultActiveId="active"
        onSetDefault={onSetDefault}
      />
    )

    await openOptions(user, "Active Sprint")
    await user.click(screen.getByRole("menuitem", { name: "Set as default" }))
    await user.click(screen.getByRole("tab", { name: "High Priority" }))
    await openOptions(user, "High Priority")

    expect(
      screen.queryByRole("menuitem", { name: "Set as default" })
    ).not.toBeInTheDocument()
    expect(onSetDefault).toHaveBeenCalledTimes(1)
  })

  it("does not commit a rename on blur after Escape", async () => {
    const user = userEvent.setup()
    const onRename = vi.fn()
    render(<SavedViews defaultViews={SAMPLE_VIEWS} onRename={onRename} />)

    screen.getByRole("tab", { name: "All Issues" }).focus()
    await user.keyboard("{F2}")
    const input = screen.getByRole("textbox", { name: "Rename view" })
    await user.type(input, " edited")
    await user.keyboard("{Escape}")

    expect(onRename).not.toHaveBeenCalled()
    expect(screen.getByRole("tab", { name: "All Issues" })).toHaveFocus()
  })

  it("keeps the last saved view when the other view is still being created", async () => {
    const user = userEvent.setup()
    const request = deferred()
    render(
      <SavedViews
        defaultViews={[{ id: "solo", name: "Solo" }]}
        onCreate={() => request.promise}
      />
    )

    await user.click(screen.getByRole("button", { name: "Create new view" }))
    await user.type(screen.getByPlaceholderText("New view name..."), "Draft")
    await user.click(screen.getByRole("button", { name: "Create view" }))
    await user.click(screen.getByRole("tab", { name: "Solo" }))
    await openOptions(user, "Solo")

    expect(
      screen.queryByRole("menuitem", { name: "Delete" })
    ).not.toBeInTheDocument()

    await act(async () => request.resolve())
    await user.keyboard("{Escape}")
    await openOptions(user, "Solo")
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument()
  })

  it("rolls back a rename even when the parent normalizes the name", async () => {
    const user = userEvent.setup()
    const request = deferred()
    function Normalizing() {
      const [views, setViews] = React.useState(SAMPLE_VIEWS)
      return (
        <SavedViews
          views={views}
          onViewsChange={(next) =>
            setViews(next.map((v) => ({ ...v, name: v.name.toUpperCase() })))
          }
          onRename={() => request.promise}
        />
      )
    }
    render(<Normalizing />)

    screen.getByRole("tab", { name: "All Issues" }).focus()
    await user.keyboard("{F2}")
    const input = screen.getByRole("textbox", { name: "Rename view" })
    await user.clear(input)
    await user.type(input, "everything{Enter}")
    expect(screen.getByRole("tab", { name: "EVERYTHING" })).toBeInTheDocument()

    await act(async () => request.reject(new Error("nope")))
    expect(screen.getByRole("tab", { name: "ALL ISSUES" })).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The change was undone."
    )
  })

  it("logs the error when there is no onError", async () => {
    const user = userEvent.setup()
    const error = new Error("boom")
    const spy = vi.spyOn(console, "error")
    render(
      <SavedViews
        defaultViews={SAMPLE_VIEWS}
        onDelete={() => Promise.reject(error)}
      />
    )

    await openOptions(user, "All Issues")
    await user.click(screen.getByRole("menuitem", { name: "Delete" }))
    await screen.findByRole("alert")

    expect(spy).toHaveBeenCalledWith(error)
  })

  it("rolls back in the select variant too", async () => {
    const user = userEvent.setup()
    const request = deferred()
    render(
      <SavedViews
        variant="select"
        defaultViews={SAMPLE_VIEWS}
        onRename={() => request.promise}
      />
    )

    await user.click(
      screen.getByRole("button", { name: /Saved views: All Issues/i })
    )
    await openOptions(user, "High Priority")
    await user.click(screen.getByRole("menuitem", { name: "Rename" }))
    const input = screen.getByRole("textbox", { name: "Rename view" })
    await user.clear(input)
    await user.type(input, "Urgent{Enter}")
    expect(screen.getByRole("option", { name: /Urgent/ })).toHaveAttribute(
      "aria-busy",
      "true"
    )

    await act(async () => request.reject(new Error("nope")))
    expect(
      screen.getByRole("option", { name: /High Priority/ })
    ).not.toHaveAttribute("aria-busy")
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })
})
