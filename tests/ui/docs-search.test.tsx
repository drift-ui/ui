import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { DocsSearch, type SearchGroup } from "@/components/docs/docs-search"

const push = vi.fn()
const params = vi.fn((): Record<string, string> => ({}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useParams: () => params(),
}))

const GROUPS: SearchGroup[] = [
  {
    id: "inputs",
    label: "Inputs",
    entries: [
      {
        slug: "file-dropzone",
        name: "File Dropzone",
        description: "Drag and drop upload",
      },
      { slug: "rating", name: "Rating", description: "Pick a score" },
    ],
  },
  {
    id: "structure",
    label: "Structure",
    entries: [
      { slug: "pick-list", name: "Pick List", description: "Choose rows" },
    ],
  },
]

function pressShortcut() {
  fireEvent.keyDown(window, { key: "k", code: "KeyK", ctrlKey: true })
}

async function search(text: string) {
  const user = userEvent.setup()
  render(<DocsSearch groups={GROUPS} />)
  await user.type(screen.getByRole("combobox"), text)
}

afterEach(() => {
  push.mockClear()
  params.mockReset()
  params.mockReturnValue({})
})

describe("DocsSearch", () => {
  it("toggles focus with the keyboard shortcut", () => {
    render(<DocsSearch groups={GROUPS} />)
    const input = screen.getByRole("combobox")
    expect(input).not.toHaveFocus()

    pressShortcut()
    expect(input).toHaveFocus()

    pressShortcut()
    expect(input).not.toHaveFocus()
  })

  it("ignores a shortcut another control already handled", () => {
    render(<DocsSearch groups={GROUPS} />)

    const event = new KeyboardEvent("keydown", {
      key: "k",
      code: "KeyK",
      ctrlKey: true,
      cancelable: true,
    })
    event.preventDefault()
    window.dispatchEvent(event)

    expect(screen.getByRole("combobox")).not.toHaveFocus()
  })

  it("matches descriptions and opens the component with Enter", async () => {
    await search("upload{Enter}")

    expect(push).toHaveBeenCalledWith("/components/file-dropzone")
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveValue(""))
    expect(screen.getByRole("combobox")).not.toHaveFocus()
  })

  it("clears and leaves the input on Escape", async () => {
    await search("rat{Escape}")

    expect(screen.getByRole("combobox")).toHaveValue("")
    expect(screen.getByRole("combobox")).not.toHaveFocus()
  })

  it("hides entries that do not match", async () => {
    await search("upload")

    await waitFor(() =>
      expect(screen.queryByText("Rating")).not.toBeInTheDocument()
    )
    expect(screen.getByText("File Dropzone")).toBeInTheDocument()
  })

  it("ranks a name match above a description in an earlier group", async () => {
    await search("pick{Enter}")

    expect(push).toHaveBeenCalledWith("/components/pick-list")
  })

  it("stays on the current library", async () => {
    params.mockReturnValue({ library: "radix", slug: "rating" })
    await search("file{Enter}")

    expect(push).toHaveBeenCalledWith("/components/radix/file-dropzone")
  })

  it("says so when nothing matches", async () => {
    await search("zzzz")

    expect(await screen.findByText("No results found.")).toBeInTheDocument()
  })
})
