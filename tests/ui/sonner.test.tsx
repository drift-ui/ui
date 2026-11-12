import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { Toaster, onToastPersist, toast } from "@/registry/default/ui/sonner"

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

describe.skipIf(process.env.UI_PRIMITIVES === "base")("Toast on Radix", () => {
  afterEach(() => {
    act(() => {
      toast.dismiss()
    })
  })

  it("commits an undo toast when it times out", async () => {
    const onCommit = vi.fn()
    const onUndo = vi.fn()
    render(<Toaster />)

    act(() => {
      toast.undo("Deleted 3 files", { duration: 50, onCommit, onUndo })
    })

    expect(await screen.findByText("Deleted 3 files")).toBeInTheDocument()
    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1))
    expect(onUndo).not.toHaveBeenCalled()
  })

  it("undoes from the keyboard and never commits", async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()
    const onUndo = vi.fn()
    render(<Toaster />)

    act(() => {
      toast.undo("Archived", {
        duration: 100,
        shortcut: "Mod+Z",
        onCommit,
        onUndo,
      })
    })

    const undo = await screen.findByRole("button", { name: /Undo/ })
    expect(undo).toHaveTextContent("Ctrl+Z")
    expect(undo).toHaveAttribute("aria-keyshortcuts", "Control+Z")
    undo.focus()
    await user.keyboard("{Enter}")

    expect(onUndo).toHaveBeenCalledTimes(1)
    await wait(200)
    expect(onCommit).not.toHaveBeenCalled()
  })

  it("commits when the toast is dismissed early", async () => {
    const onCommit = vi.fn()
    render(<Toaster />)

    let id: string | number = ""
    act(() => {
      id = toast.undo("Deleted", { duration: 10_000, onCommit })
    })
    await screen.findByText("Deleted")

    act(() => {
      toast.dismiss(id)
    })

    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1))
  })

  it("commits when the page unloads", async () => {
    const onCommit = vi.fn()
    render(<Toaster />)

    act(() => {
      toast.undo("Deleted", { duration: 10_000, onCommit })
    })
    await screen.findByText("Deleted")
    window.dispatchEvent(new Event("pagehide"))

    expect(onCommit).toHaveBeenCalledTimes(1)
  })

  it("merges toasts that share an id and shows the count", async () => {
    render(<Toaster />)

    act(() => {
      toast("Link copied", { id: "copied" })
      toast("Link copied", { id: "copied" })
      toast("Link copied", { id: "copied" })
    })

    await screen.findByText("×3")
    expect(screen.getAllByText("Link copied")).toHaveLength(1)
    expect(screen.getByText(", shown 3 times")).toBeInTheDocument()
  })

  it("announces errors assertively and others politely", async () => {
    render(<Toaster />)

    act(() => {
      toast.success("Saved")
      toast.error("Could not sync")
    })

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not sync")
    expect(screen.getByText("Saved").closest('[role="alert"]')).toBeNull()
  })

  it("undoes the newest undo toast with its shortcut", async () => {
    const user = userEvent.setup()
    const first = vi.fn()
    const second = vi.fn()
    render(<Toaster />)

    act(() => {
      toast.undo("Archived", {
        shortcut: "Mod+Z",
        onCommit: () => {},
        onUndo: first,
      })
      toast.undo("Deleted", {
        shortcut: "Mod+Z",
        onCommit: () => {},
        onUndo: second,
      })
    })
    await screen.findByText("Deleted")

    await user.keyboard("{Control>}z{/Control}")
    expect(second).toHaveBeenCalledTimes(1)
    expect(first).not.toHaveBeenCalled()

    await user.keyboard("{Control>}z{/Control}")
    expect(first).toHaveBeenCalledTimes(1)
  })

  it("leaves the shortcut to text fields", async () => {
    const user = userEvent.setup()
    const onUndo = vi.fn()
    render(
      <>
        <input aria-label="Note" />
        <Toaster />
      </>
    )

    act(() => {
      toast.undo("Archived", { shortcut: "Mod+Z", onCommit: () => {}, onUndo })
    })
    await screen.findByText("Archived")
    await user.click(screen.getByRole("textbox", { name: "Note" }))
    await user.keyboard("{Control>}z{/Control}")

    expect(onUndo).not.toHaveBeenCalled()
  })

  it("shows progress and updates it in place", async () => {
    render(<Toaster />)

    act(() => {
      toast.progress("Uploading", { id: "upload", value: 20 })
    })
    const bar = await screen.findByRole("progressbar", { name: "Uploading" })
    expect(bar).toHaveAttribute("aria-valuenow", "20")

    act(() => {
      toast.progress("Uploading", { id: "upload", value: 140 })
    })
    await waitFor(() =>
      expect(
        screen.getByRole("progressbar", { name: "Uploading" })
      ).toHaveAttribute("aria-valuenow", "100")
    )
    expect(screen.getAllByRole("progressbar")).toHaveLength(1)
  })

  it("hands persisted toasts to the inbox when they close", async () => {
    const received = vi.fn()
    const stop = onToastPersist(received)
    render(<Toaster />)

    act(() => {
      toast("Build passed", {
        id: "build",
        description: "412 tests",
        persist: true,
      })
      toast("Not kept", { id: "skip" })
    })
    await screen.findByText("Build passed")
    act(() => {
      toast.dismiss()
    })

    await waitFor(() => expect(received).toHaveBeenCalledTimes(1))
    expect(received.mock.calls[0][0]).toMatchObject({
      id: "build",
      title: "Build passed",
      body: "412 tests",
    })
    stop()
  })
})
