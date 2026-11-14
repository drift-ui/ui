import type { ComponentType } from "react"
import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ToastPreview as BaseUiToastPreview } from "@/components/preview/base/toast-preview"
import { examples } from "@/components/preview/examples/toast"
import { ToastPreview } from "@/components/preview/toast-preview"
import {
  Toaster as BaseUiToaster,
  toast as baseUiToast,
} from "@/registry/base/ui/toast"
import { Toaster, toast } from "@/registry/default/ui/sonner"

type Library = {
  name: string
  Toaster: ComponentType
  Main: ComponentType
  closeAll: () => void
  example: (id: string) => ComponentType
}

function findExample(id: string) {
  return examples.find((example) => example.id === id)!
}

const LIBRARIES: Library[] = [
  {
    name: "Radix",
    Toaster,
    Main: ToastPreview,
    closeAll: () => toast.dismiss(),
    example: (id) => findExample(id).Preview,
  },
  {
    name: "Base UI",
    Toaster: BaseUiToaster,
    Main: BaseUiToastPreview,
    closeAll: () => baseUiToast.close(),
    example: (id) => findExample(id).BasePreview!,
  },
]

function renderExample(library: Library, id: string) {
  const Example = library.example(id)
  return render(
    <>
      <Example />
      <library.Toaster />
    </>
  )
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

function setup() {
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
}

describe.each(LIBRARIES)("Toast examples on $name", (library) => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    act(() => library.closeAll())
    advance(1000)
    vi.useRealTimers()
  })

  it("runs the file panel: undo, upload, share and sync", async () => {
    const user = setup()
    render(<library.Main />)

    await user.click(
      screen.getByRole("button", { name: "Delete invoice-0412.pdf" })
    )
    expect(
      screen.queryByRole("button", { name: "Delete invoice-0412.pdf" })
    ).toBeNull()
    await user.click(await screen.findByRole("button", { name: /Undo/ }))
    expect(
      screen.getByRole("button", { name: "Delete invoice-0412.pdf" })
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Upload" }))
    advance(600)
    expect(
      await screen.findByRole("progressbar", {
        name: "Uploading launch-teaser.mp4",
      })
    ).toBeInTheDocument()
    advance(3000)
    expect(
      await screen.findByText("Uploaded launch-teaser.mp4")
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Share" }))
    expect(await screen.findByText("Link copied")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Sync now" }))
    advance(1600)
    expect(await screen.findAllByText("Could not sync")).not.toHaveLength(0)
    expect(screen.getByText(/Sync failed/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Sync now" }))
    advance(1600)
    expect(
      await screen.findByText("All files are up to date")
    ).toBeInTheDocument()
  })

  it("restores sample files after deleting them all", async () => {
    const user = setup()
    render(<library.Main />)

    for (const name of [
      "q3-roadmap.png",
      "brand-guidelines.pdf",
      "invoice-0412.pdf",
    ]) {
      await user.click(screen.getByRole("button", { name: `Delete ${name}` }))
    }
    await user.click(screen.getByRole("button", { name: "Restore samples" }))

    expect(
      screen.getByRole("button", { name: "Delete q3-roadmap.png" })
    ).toBeInTheDocument()
  })

  it("undoes an archive with the shortcut and commits a delete", async () => {
    const user = setup()
    renderExample(library, "undo")

    await user.click(
      screen.getByRole("button", { name: "Archive Invoice 0412 is ready" })
    )
    await screen.findByText("Archived conversation")
    await user.keyboard("{Control>}z{/Control}")
    expect(
      screen.getByRole("button", { name: "Archive Invoice 0412 is ready" })
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Delete Invoice 0412 is ready" })
    )
    await screen.findByText("Deleted conversation")
    advance(20_000)
    expect(
      await screen.findByText("Deleted Stripe for good")
    ).toBeInTheDocument()
  })

  it("ignores pending undo toasts after a reset", async () => {
    const user = setup()
    renderExample(library, "undo")

    for (const subject of [
      "Invoice 0412 is ready",
      "3 issues assigned to you",
      "Your trial ends Friday",
      "Noor left 4 comments",
    ]) {
      await user.click(
        screen.getByRole("button", { name: `Archive ${subject}` })
      )
    }
    await user.click(screen.getByRole("button", { name: "Reset" }))
    advance(20_000)

    expect(screen.getByText("Nothing committed yet")).toBeInTheDocument()
  })

  it("shows every type and runs each action", async () => {
    const user = setup()
    renderExample(library, "types")

    await user.click(screen.getByRole("button", { name: "Success" }))
    expect(await screen.findByText("Payment received")).toBeInTheDocument()

    for (const [trigger, action, result] of [
      ["Info", "Reload", "Updated to 2.4.0"],
      ["Warning", "Upgrade", "Opening billing"],
      ["Error", "Retry", "Card declined"],
    ]) {
      await user.click(screen.getByRole("button", { name: trigger }))
      const [button] = await screen.findAllByRole("button", {
        name: action,
        hidden: true,
      })
      await user.click(button)
      expect(await screen.findAllByText(result)).not.toHaveLength(0)
    }
  })

  it("follows a deploy promise to success and to failure", async () => {
    const user = setup()
    renderExample(library, "promise")

    await user.click(screen.getByRole("button", { name: "Deploy to staging" }))
    advance(1900)
    expect(
      await screen.findByText("Deployed a1f9c2e to staging")
    ).toBeInTheDocument()
    expect(screen.getByText("Live on staging")).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Deploy to production" })
    )
    advance(1900)
    expect(await screen.findAllByText(/Deploy failed/)).not.toHaveLength(0)
    expect(screen.getByText("Failed")).toBeInTheDocument()
  })

  it("uploads with progress and can cancel", async () => {
    const user = setup()
    const { unmount } = renderExample(library, "progress")

    await user.click(screen.getByRole("button", { name: "Upload" }))
    advance(500)
    expect(
      await screen.findByRole("progressbar", { name: "Uploading 3 files" })
    ).toBeInTheDocument()
    advance(4000)
    expect(await screen.findByText("Uploaded 3 files")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Upload" }))
    advance(500)
    const [cancel] = await screen.findAllByRole("button", {
      name: "Cancel",
      hidden: true,
    })
    await user.click(cancel)
    expect(await screen.findByText("Upload cancelled")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Upload" })).toBeEnabled()

    await user.click(screen.getByRole("button", { name: "Upload" }))
    advance(500)
    unmount()
  })

  it("merges repeated copies into one counted toast", async () => {
    const user = setup()
    renderExample(library, "merge")

    await user.click(screen.getByRole("button", { name: "Copy" }))
    await user.click(screen.getByRole("button", { name: "Copy" }))
    expect(await screen.findByText("×2")).toBeInTheDocument()
    expect(screen.getAllByText("Invite link copied")).toHaveLength(1)

    await user.click(screen.getByRole("button", { name: "Check for updates" }))
    expect(await screen.findByText("You're up to date")).toBeInTheDocument()
  })

  it("lists how long each message stays and shows it", async () => {
    const user = setup()
    renderExample(library, "reading-time")

    const rows = screen.getAllByRole("listitem")
    expect(within(rows[1]).getByText(/Stays \d+\.\ds/)).toBeInTheDocument()

    for (const row of rows) {
      await user.click(within(row).getByRole("button", { name: "Show" }))
    }
    expect(await screen.findAllByText("Saved")).not.toHaveLength(0)
    expect(
      await screen.findAllByText("Could not publish the post")
    ).not.toHaveLength(0)
  })

  it("adds persisted toasts to the inbox when they close", async () => {
    const user = setup()
    renderExample(library, "inbox")

    await user.click(screen.getByRole("button", { name: "Event 1" }))
    await screen.findAllByText("Ana Silva commented on Q3 roadmap")
    act(() => library.closeAll())
    advance(1000)

    expect(
      await screen.findByRole("button", { name: "Notifications, 1 unread" })
    ).toBeInTheDocument()
  })
})
