import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AgentsSection } from "@/components/landing/agents-section"
import { CatalogBand } from "@/components/landing/catalog-band"
import { ClosingCta } from "@/components/landing/closing-cta"
import { CommunitySection } from "@/components/landing/community-section"
import { CopyCommand } from "@/components/landing/copy-command"
import { Hero } from "@/components/landing/hero"
import { InstallSection } from "@/components/landing/install-section"
import { NEED_FINDER_INPUT_ID } from "@/components/landing/need-finder"
import { buildAgentPrompt } from "@/lib/agent-docs/build-docs"
import { CATALOG, CATEGORIES } from "@/lib/catalog"

const lenis = vi.hoisted(() => ({
  current: undefined as { scrollTo: ReturnType<typeof vi.fn> } | undefined,
}))

const contributors = vi.hoisted(() => ({
  issues: [] as { number: number; title: string; url: string }[],
  community: [] as { login: string; contributions: number }[],
}))

vi.mock("lenis/react", () => ({
  useLenis: () => lenis.current,
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("@/lib/contributors", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/contributors")>()),
  fetchFirstIssues: async () => contributors.issues,
  fetchCommunity: async () => contributors.community,
}))

afterEach(() => {
  lenis.current = undefined
  contributors.issues = []
  contributors.community = []
  window.localStorage.clear()
})

describe("Hero", () => {
  it("leads with the headline, the catalog count and the finder", () => {
    render(<Hero />)

    expect(
      screen.getByRole("heading", { level: 1, name: /The components/ })
    ).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`^${CATALOG.length} components you install`))
    ).toBeInTheDocument()
    expect(
      screen.getByRole("searchbox", { name: "Search components" })
    ).toHaveAttribute("id", NEED_FINDER_INPUT_ID)
  })
})

describe("CatalogBand", () => {
  it("links every category to the filtered components page", () => {
    render(<CatalogBand />)

    for (const category of CATEGORIES) {
      const total = CATALOG.filter(
        (entry) => entry.category === category.id
      ).length
      const link = screen.getByRole("link", {
        name: new RegExp(`^${total}\\s*${category.label}`),
      })

      expect(link).toHaveAttribute(
        "href",
        `/components?category=${category.id}`
      )
    }
  })

  it("names flagships first and counts the rest", () => {
    render(<CatalogBand />)

    const inputs = CATALOG.filter((entry) => entry.category === "inputs")
    const flagship = inputs.find((entry) => entry.isFlagship)
    const link = screen.getByRole("link", { name: /Inputs/ })

    expect(link).toHaveTextContent(
      new RegExp(`${flagship?.name}.*and ${inputs.length - 5} more`)
    )
  })
})

describe("InstallSection", () => {
  it("rewrites every command for the chosen package manager", async () => {
    const user = userEvent.setup()
    render(<InstallSection />)

    expect(
      screen.getByRole("button", { name: /Copy npx shadcn@latest init/ })
    ).toBeInTheDocument()

    await user.click(screen.getByRole("radio", { name: "pnpm" }))

    expect(
      screen.getByRole("button", { name: /Copy pnpm dlx shadcn@latest init/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: /Copy pnpm dlx shadcn@latest add @drift-ui\/tags-input/,
      })
    ).toBeInTheDocument()
  })
})

describe("AgentsSection", () => {
  it("copies the agent prompt and links the machine-readable docs", async () => {
    const user = userEvent.setup()
    render(<AgentsSection />)

    await user.click(screen.getByRole("button", { name: "Copy prompt" }))

    expect(await navigator.clipboard.readText()).toBe(buildAgentPrompt())
    expect(
      screen.getByRole("link", { name: /llms-full\.txt/ })
    ).toHaveAttribute("href", "/llms-full.txt")
    expect(
      screen.getByRole("button", {
        name: "Copy npx shadcn@latest mcp init --client claude",
      })
    ).toBeInTheDocument()
  })
})

describe("CopyCommand", () => {
  it("copies the full command from the icon-only button", async () => {
    const user = userEvent.setup()
    render(<CopyCommand iconOnly command="npx shadcn add @drift-ui/rating" />)

    const button = screen.getByRole("button", {
      name: "Copy npx shadcn add @drift-ui/rating",
    })
    expect(button).not.toHaveTextContent("npx")

    await user.click(button)

    expect(await navigator.clipboard.readText()).toBe(
      "npx shadcn add @drift-ui/rating"
    )
    expect(screen.getByRole("status")).toHaveTextContent("Copied to clipboard")
  })
})

describe("ClosingCta", () => {
  function renderWithSearch() {
    render(
      <>
        <input id={NEED_FINDER_INPUT_ID} aria-label="Search components" />
        <ClosingCta />
      </>
    )
    return screen.getByRole("textbox", { name: "Search components" })
  }

  it("focuses the hero search and scrolls it clear of the nav", async () => {
    const user = userEvent.setup()
    lenis.current = { scrollTo: vi.fn() }
    const search = renderWithSearch()

    await user.click(screen.getByRole("button", { name: /Search components/ }))

    expect(search).toHaveFocus()
    expect(lenis.current.scrollTo).toHaveBeenCalledWith(search, {
      offset: -120,
    })
  })

  it("falls back to native scrolling without smooth scroll", async () => {
    const user = userEvent.setup()
    const search = renderWithSearch()
    const scrollIntoView = vi.spyOn(search, "scrollIntoView")

    await user.click(screen.getByRole("button", { name: /Search components/ }))

    expect(search).toHaveFocus()
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "center" })
  })

  it("opens the component request template", () => {
    renderWithSearch()

    expect(screen.getByRole("link", { name: /Request one/ })).toHaveAttribute(
      "href",
      "https://github.com/drift-ui/ui/issues/new?template=component_request.yml"
    )
  })
})

describe("CommunitySection", () => {
  it("lists good first issues beside both maintainers", async () => {
    contributors.issues = [
      { number: 126, title: "Add confirm-destructive", url: "https://x/126" },
    ]
    contributors.community = [{ login: "someone", contributions: 3 }]
    render(await CommunitySection())

    expect(screen.getByRole("link", { name: /#126/ })).toHaveAttribute(
      "href",
      "https://x/126"
    )
    expect(screen.getByRole("link", { name: /Gautam Anand/ })).toHaveAttribute(
      "href",
      "https://github.com/localhostd3veloper"
    )
    expect(
      screen.getByRole("link", { name: /Syed Fahad Junaid/ })
    ).toHaveAttribute("href", "https://github.com/syedfahadjunaid")
    expect(
      screen.getByRole("link", { name: /3 people have shipped code/ })
    ).toHaveAttribute("href", "/contributors")
  })

  it("points at all open issues when no first issue is free", async () => {
    render(await CommunitySection())

    const empty = screen.getByText(/No good first issues to show/)
    expect(within(empty).getByRole("link")).toHaveAttribute(
      "href",
      "https://github.com/drift-ui/ui/issues"
    )
  })
})
