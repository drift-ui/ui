import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { Toaster, onToastPersist, toast } from "@/registry/base/ui/toast"

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

describe.skipIf(process.env.UI_PRIMITIVES !== "base")(
  "Toast on Base UI",
  () => {
    afterEach(() => {
      act(() => {
        toast.close()
      })
    })

    it("commits an undo toast when it times out", async () => {
      const onCommit = vi.fn()
      const onUndo = vi.fn()
      render(<Toaster />)

      act(() => {
        toast.undo({ title: "Deleted 3 files", timeout: 50, onCommit, onUndo })
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
        toast.undo({
          title: "Archived",
          timeout: 100,
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

    it("commits when the toast is closed early", async () => {
      const user = userEvent.setup()
      const onCommit = vi.fn()
      render(<Toaster />)

      act(() => {
        toast.undo({ title: "Deleted", timeout: 10_000, onCommit })
      })
      await screen.findByText("Deleted")
      await user.click(
        document.querySelector<HTMLElement>('[data-slot="toast-close"]')!
      )

      expect(onCommit).toHaveBeenCalledTimes(1)
    })

    it("commits when the page unloads", async () => {
      const onCommit = vi.fn()
      render(<Toaster />)

      act(() => {
        toast.undo({ title: "Deleted", timeout: 10_000, onCommit })
      })
      await screen.findByText("Deleted")
      window.dispatchEvent(new Event("pagehide"))

      expect(onCommit).toHaveBeenCalledTimes(1)
    })

    it("merges toasts that share a key and shows the count", async () => {
      render(<Toaster />)

      act(() => {
        toast.add({ key: "copied", title: "Link copied" })
        toast.add({ key: "copied", title: "Link copied" })
        toast.add({ key: "copied", title: "Link copied" })
      })

      await screen.findByText("×3")
      expect(screen.getAllByText("Link copied")).toHaveLength(1)
      expect(screen.getByText(", shown 3 times")).toBeInTheDocument()
    })

    it("gives error toasts high priority", async () => {
      render(<Toaster />)

      act(() => {
        toast.add({ title: "Saved", type: "success" })
        toast.add({ title: "Could not sync", type: "error" })
      })

      await screen.findAllByText("Could not sync")
      const roles = Object.fromEntries(
        [...document.querySelectorAll('[data-slot="toast"]')].map((node) => [
          node.querySelector('[data-slot="toast-title"]')?.textContent,
          node.getAttribute("role"),
        ])
      )
      expect(roles).toEqual({
        "Could not sync": "alertdialog",
        Saved: "dialog",
      })
    })

    it("undoes the newest undo toast with its shortcut", async () => {
      const user = userEvent.setup()
      const first = vi.fn()
      const second = vi.fn()
      render(<Toaster />)

      act(() => {
        toast.undo({
          title: "Archived",
          shortcut: "Mod+Z",
          onCommit: () => {},
          onUndo: first,
        })
        toast.undo({
          title: "Deleted",
          shortcut: "Mod+Z",
          onCommit: () => {},
          onUndo: second,
        })
      })
      await screen.findByText("Deleted")

      await user.keyboard("{Control>}z{/Control}")
      expect(second).toHaveBeenCalledTimes(1)
      expect(first).not.toHaveBeenCalled()
    })

    it("shows progress and updates it in place", async () => {
      render(<Toaster />)

      act(() => {
        toast.progress({ id: "upload", title: "Uploading", value: 20 })
      })
      const bar = await screen.findByRole("progressbar", { name: "Uploading" })
      expect(bar).toHaveAttribute("aria-valuenow", "20")

      act(() => {
        toast.progress({ id: "upload", title: "Uploading", value: 140 })
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
        toast.add({
          key: "build",
          title: "Build passed",
          description: "412 tests",
          persist: true,
        })
        toast.add({ key: "skip", title: "Not kept" })
      })
      await screen.findByText("Build passed")
      act(() => {
        toast.close()
      })

      await waitFor(() => expect(received).toHaveBeenCalledTimes(1))
      expect(received.mock.calls[0][0]).toMatchObject({
        id: "build",
        title: "Build passed",
        body: "412 tests",
      })
      stop()
    })
  }
)
