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
  pressShortcut()
  await user.type(await screen.findByRole("combobox"), text)
}

afterEach(() => {
  push.mockClear()
  params.mockReset()
  params.mockReturnValue({})
})

describe("DocsSearch", () => {
  it("toggles with the keyboard shortcut", () => {
    render(<DocsSearch groups={GROUPS} />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    pressShortcut()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
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

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("opens from the header button", async () => {
    const user = userEvent.setup()
    render(<DocsSearch groups={GROUPS} />)

    await user.click(screen.getByRole("button", { name: "Search docs" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("matches descriptions and opens the component with Enter", async () => {
    await search("upload{Enter}")

    expect(push).toHaveBeenCalledWith("/components/file-dropzone")
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    )
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
