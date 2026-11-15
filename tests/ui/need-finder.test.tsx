import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  NeedFinder,
  searchEntries,
  type FinderEntry,
} from "@/components/landing/need-finder"

const push = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}))

const ENTRIES: FinderEntry[] = [
  {
    slug: "tags-input",
    name: "Tags Input",
    description: "Type, paste or remove tags with full keyboard support.",
  },
  {
    slug: "date-time-range",
    name: "Date-Time Range",
    description: "A date range picker with start and end times.",
  },
  {
    slug: "cron-input",
    name: "Cron Input",
    description: "Standard five-field cron expression input.",
  },
  {
    slug: "diff-viewer",
    name: "Diff Viewer",
    description: "Side-by-side or unified text diff.",
  },
  {
    slug: "filter-builder",
    name: "Filter Builder",
    description: "Field, operator and value filter chips.",
  },
  {
    slug: "file-dropzone",
    name: "File Dropzone",
    description: "Drag and drop file upload with previews.",
  },
  {
    slug: "tree-view",
    name: "Tree View",
    description: "An ARIA tree with arrow keys and typeahead.",
  },
]

const slugs = (entries: FinderEntry[] | null) =>
  entries?.map((entry) => entry.slug)

function searchBox() {
  return screen.getByRole("searchbox", { name: "Search components" })
}

function stubDesktop(matches: boolean) {
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches,
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as MediaQueryList)
}

afterEach(() => {
  push.mockClear()
  vi.restoreAllMocks()
})

describe("searchEntries", () => {
  it("returns null for an empty query", () => {
    expect(searchEntries(ENTRIES, "   ")).toBeNull()
  })

  it("matches name, slug and description, ignoring case", () => {
    expect(slugs(searchEntries(ENTRIES, "TREE"))).toEqual(["tree-view"])
    expect(slugs(searchEntries(ENTRIES, "cron-input"))).toEqual(["cron-input"])
  })

  it("finds a component from the need line shown for it", () => {
    expect(slugs(searchEntries(ENTRIES, "Schedule a recurring job"))?.[0]).toBe(
      "cron-input"
    )
    expect(slugs(searchEntries(ENTRIES, "Add tags as you type"))?.[0]).toBe(
      "tags-input"
    )
  })

  it("ignores filler words and ranks by how many words match", () => {
    expect(slugs(searchEntries(ENTRIES, "I need a file upload"))).toEqual([
      "file-dropzone",
      "diff-viewer",
    ])
    expect(slugs(searchEntries(ENTRIES, "tree tags keyboard"))).toEqual([
      "tags-input",
      "tree-view",
    ])
    expect(searchEntries(ENTRIES, "I need a")).toBeNull()
  })
})

describe("NeedFinder", () => {
  it("lists the needs with an install name and open link", () => {
    render(<NeedFinder entries={ENTRIES} />)

    const list = screen.getByRole("list", { name: "Things you can build" })
    expect(within(list).getAllByRole("listitem")).toHaveLength(5)
    expect(
      screen.getByRole("link", { name: "Add tags as you type" })
    ).toHaveAttribute("href", "/components/tags-input")
    expect(
      screen.getByRole("button", {
        name: "Copy npx shadcn add @drift-ui/tags-input",
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Open Diff Viewer" })
    ).toHaveAttribute("href", "/components/diff-viewer")
    expect(screen.queryByText("Tree View")).not.toBeInTheDocument()
    expect(screen.getByText(/5 of 7 components shown/)).toBeInTheDocument()
  })

  it("turns the rows into matches as the visitor types", async () => {
    const user = userEvent.setup()
    render(<NeedFinder entries={ENTRIES} />)

    await user.type(searchBox(), "arrow")

    const list = screen.getByRole("list", { name: "Matching components" })
    expect(within(list).getAllByRole("listitem")).toHaveLength(1)
    expect(screen.getByRole("link", { name: "Tree View" })).toHaveAttribute(
      "href",
      "/components/tree-view"
    )
    expect(screen.getByText("1 of 7 components match")).toBeInTheDocument()
  })

  it("offers a component request when nothing matches", async () => {
    const user = userEvent.setup()
    render(<NeedFinder entries={ENTRIES} />)

    await user.type(searchBox(), "spreadsheet")

    expect(screen.queryByRole("list")).not.toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Request it as a new component/ })
    ).toBeInTheDocument()
  })

  it("opens the first match on Enter and clears on Escape", async () => {
    const user = userEvent.setup()
    render(<NeedFinder entries={ENTRIES} />)

    await user.type(searchBox(), "date{Enter}")
    expect(push).toHaveBeenCalledWith("/components/date-time-range")

    await user.keyboard("{Escape}")
    expect(searchBox()).toHaveValue("")
    expect(
      screen.getByRole("list", { name: "Things you can build" })
    ).toBeInTheDocument()
  })

  it("does not navigate on Enter before the visitor searches", async () => {
    const user = userEvent.setup()
    render(<NeedFinder entries={ENTRIES} />)

    await user.click(searchBox())
    await user.keyboard("{Enter}")

    expect(push).not.toHaveBeenCalled()
  })

  it("focuses the search on slash unless the visitor is typing elsewhere", async () => {
    const user = userEvent.setup()
    render(
      <>
        <input aria-label="Notes" />
        <NeedFinder entries={ENTRIES} />
      </>
    )

    await user.click(screen.getByLabelText("Notes"))
    await user.keyboard("/")
    expect(searchBox()).not.toHaveFocus()

    await user.click(document.body)
    await user.keyboard("/")
    expect(searchBox()).toHaveFocus()
    expect(searchBox()).toHaveValue("")
  })

  it("loads the live samples only at the desktop breakpoint", async () => {
    stubDesktop(false)
    const { unmount } = render(<NeedFinder entries={ENTRIES} />)
    await vi.dynamicImportSettled()
    expect(screen.queryByLabelText("Regions")).not.toBeInTheDocument()
    unmount()

    stubDesktop(true)
    render(<NeedFinder entries={ENTRIES} />)
    await vi.dynamicImportSettled()
    expect(await screen.findByLabelText("Regions")).toBeInTheDocument()
  })

  it("links past the shown results to the full search on /components", async () => {
    const user = userEvent.setup()
    const many = Array.from({ length: 10 }, (_, index) => ({
      slug: `input-${index}`,
      name: `Input ${index}`,
      description: "A field.",
    }))
    render(<NeedFinder entries={many} />)

    await user.type(searchBox(), "field")

    expect(
      within(
        screen.getByRole("list", { name: "Matching components" })
      ).getAllByRole("listitem")
    ).toHaveLength(8)
    expect(
      screen.getByRole("link", { name: "See all 10 matches" })
    ).toHaveAttribute("href", "/components?q=field")
  })

  it("prefills the component request with the search", async () => {
    const user = userEvent.setup()
    render(<NeedFinder entries={ENTRIES} />)

    await user.type(searchBox(), "spreadsheet")

    expect(
      screen.getByRole("link", { name: /Request it as a new component/ })
    ).toHaveAttribute(
      "href",
      "https://github.com/drift-ui/ui/issues/new?template=component_request.yml&component=spreadsheet"
    )
  })

  it("shows no empty state before the visitor searches", () => {
    render(<NeedFinder entries={[]} />)

    expect(screen.queryByText(/Nothing matches/)).not.toBeInTheDocument()
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
  })

  it("ignores Enter while an input method is composing", () => {
    render(<NeedFinder entries={ENTRIES} />)

    fireEvent.change(searchBox(), { target: { value: "date" } })
    fireEvent.keyDown(searchBox(), { key: "Enter", isComposing: true })
    expect(push).not.toHaveBeenCalled()

    fireEvent.keyDown(searchBox(), { key: "Enter" })
    expect(push).toHaveBeenCalledWith("/components/date-time-range")
  })
})
