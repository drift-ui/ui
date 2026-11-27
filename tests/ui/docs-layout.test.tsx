import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ComponentHeader } from "@/components/docs/component-header"
import type { NavGroup } from "@/components/docs/component-nav-list"
import { DocsMobileNav } from "@/components/docs/docs-mobile-nav"
import { DocsSidebar } from "@/components/docs/docs-sidebar"
import { Pager } from "@/components/docs/pager"
import { PreviewTabs } from "@/components/docs/preview-tabs"
import { SiteNav } from "@/components/landing/site-nav"
import { findEntry } from "@/lib/catalog"

const params = vi.fn((): Record<string, string> => ({}))

vi.mock("next/navigation", () => ({
  useParams: () => params(),
}))

const GROUPS: NavGroup[] = [
  {
    id: "inputs",
    label: "Inputs",
    entries: [
      { slug: "rating", name: "Rating" },
      { slug: "tags-input", name: "Tags Input" },
    ],
  },
]

beforeEach(() => {
  params.mockReturnValue({ library: "radix", slug: "tags-input" })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("DocsSidebar", () => {
  const scrollTo = vi.fn()

  beforeEach(() => {
    scrollTo.mockClear()
    HTMLElement.prototype.scrollTo = scrollTo
  })

  afterEach(() => {
    delete (HTMLElement.prototype as Partial<HTMLElement>).scrollTo
  })

  it("marks the current component and scrolls it into view", () => {
    render(<DocsSidebar groups={GROUPS} />)

    const nav = screen.getByRole("navigation", { name: "Components" })
    expect(
      within(nav).getByRole("link", { name: "Tags Input" })
    ).toHaveAttribute("aria-current", "page")
    expect(within(nav).getByRole("link", { name: "Rating" })).toHaveAttribute(
      "href",
      "/components/radix/rating"
    )
    expect(scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "smooth" })
    )
  })

  it("marks All components on the index", () => {
    params.mockReturnValue({})
    render(<DocsSidebar groups={GROUPS} />)

    expect(
      screen.getByRole("link", { name: "All components" })
    ).toHaveAttribute("aria-current", "page")
  })
})

describe("DocsMobileNav", () => {
  it("names the current component and toggles the list", async () => {
    const user = userEvent.setup()
    render(<DocsMobileNav groups={GROUPS} />)

    const toggle = screen.getByRole("button", { name: /Tags Input/ })
    expect(toggle).toHaveAttribute("aria-expanded", "false")

    await user.click(toggle)
    expect(toggle).toHaveAttribute("aria-expanded", "true")

    await user.keyboard("{Escape}")
    expect(toggle).toHaveAttribute("aria-expanded", "false")
  })

  it("closes after following a link", async () => {
    const user = userEvent.setup()
    render(<DocsMobileNav groups={GROUPS} />)

    const toggle = screen.getByRole("button", { name: /Tags Input/ })
    await user.click(toggle)
    await user.click(screen.getByRole("link", { name: "Rating" }))
    expect(toggle).toHaveAttribute("aria-expanded", "false")
  })
})

describe("Pager", () => {
  it("links the neighbours on the current library", () => {
    render(
      <Pager
        previous={findEntry("rating")}
        next={findEntry("tags-input")}
        library="base"
      />
    )

    expect(screen.getByRole("link", { name: /Previous/ })).toHaveAttribute(
      "href",
      "/components/base/rating"
    )
    expect(screen.getByRole("link", { name: /Next/ })).toHaveAttribute(
      "rel",
      "next"
    )
  })

  it("leaves out a missing neighbour", () => {
    render(<Pager next={findEntry("rating")} library="radix" />)

    expect(
      screen.queryByRole("link", { name: /Previous/ })
    ).not.toBeInTheDocument()
  })
})

describe("ComponentHeader", () => {
  it("links the registry item and opens it in v0", () => {
    render(<ComponentHeader entry={findEntry("tags-input")!} library="radix" />)

    expect(
      screen.getByRole("heading", { level: 1, name: "Tags Input" })
    ).toBeInTheDocument()
    const registry = screen.getByRole("link", { name: /Registry JSON/ })
    const v0 = new URL(
      screen.getByRole("link", { name: /Open in v0/ }).getAttribute("href")!
    )
    expect(v0.searchParams.get("url")).toMatch(
      new RegExp(`${registry.getAttribute("href")}$`)
    )
  })
})

describe("PreviewTabs", () => {
  it("switches to the code tab and resets the preview", async () => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
      }
    )
    const user = userEvent.setup()
    render(
      <PreviewTabs
        preview={<span>live demo</span>}
        code={{ src: "/code.json", title: "demo.tsx" }}
        compact
      />
    )

    const demo = screen.getByText("live demo")
    await user.click(screen.getByRole("button", { name: "Reset" }))
    expect(screen.getByText("live demo")).not.toBe(demo)

    await user.click(screen.getByRole("tab", { name: "Code" }))
    expect(screen.getByRole("tab", { name: "Code" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    expect(
      screen.queryByRole("button", { name: "Reset" })
    ).not.toBeInTheDocument()
  })
})

describe("SiteNav", () => {
  it("renders the search slot next to the main links", () => {
    render(<SiteNav search={<button type="button">Search docs</button>} />)

    expect(
      screen.getByRole("button", { name: "Search docs" })
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole("link", { name: "Components" })[0]
    ).toHaveAttribute("href", "/components")
  })
})
