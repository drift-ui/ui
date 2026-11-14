import { useEffect } from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { CatalogCard } from "@/components/docs/components-browser"
import { ComponentsBrowser } from "@/components/docs/components-browser"
import { CATEGORIES } from "@/lib/catalog"

const mounts = vi.fn()

function Thumbnail() {
  useEffect(mounts, [])

  return <span>thumbnail</span>
}

const CARDS: CatalogCard[] = [
  {
    slug: "rating",
    name: "Rating",
    description: "Stars",
    category: "inputs",
    thumbnail: <Thumbnail />,
  },
  {
    slug: "stepper",
    name: "Stepper",
    description: "Steps",
    category: "structure",
    thumbnail: <Thumbnail />,
  },
]

function renderBrowser() {
  return render(<ComponentsBrowser categories={CATEGORIES} cards={CARDS} />)
}

const rating = () => screen.queryByRole("link", { name: "Rating" })
const stepper = () => screen.queryByRole("link", { name: "Stepper" })

afterEach(() => {
  vi.useRealTimers()
  mounts.mockClear()
  window.history.replaceState(null, "", "/")
})

describe("ComponentsBrowser", () => {
  it("mounts only the previewed component and keeps it while filtering", async () => {
    const user = userEvent.setup()
    renderBrowser()
    expect(mounts).toHaveBeenCalledTimes(1)

    const search = screen.getByRole("searchbox")
    await user.type(search, "rating")
    expect(rating()).toBeInTheDocument()
    expect(stepper()).not.toBeInTheDocument()

    await user.clear(search)
    expect(stepper()).toBeInTheDocument()
    expect(mounts).toHaveBeenCalledTimes(1)
  })

  it("previews the focused row on the stage", () => {
    renderBrowser()
    const preview = () => screen.getByRole("complementary", { name: "Preview" })
    expect(preview()).toHaveTextContent("Rating")

    act(() => stepper()!.focus())
    expect(preview()).toHaveTextContent("Stepper")
    expect(screen.getByRole("link", { name: "Open Stepper" })).toHaveAttribute(
      "href",
      "/components/stepper"
    )
  })

  it("moves the stage to the first match when the previewed row is filtered out", async () => {
    const user = userEvent.setup()
    renderBrowser()

    await user.type(screen.getByRole("searchbox"), "step")
    expect(
      screen.getByRole("complementary", { name: "Preview" })
    ).toHaveTextContent("Stepper")
  })

  it("announces how many components match", async () => {
    const user = userEvent.setup()
    renderBrowser()
    expect(screen.getByRole("status")).toHaveTextContent("2 components")

    await user.type(screen.getByRole("searchbox"), "rating")
    expect(screen.getByRole("status")).toHaveTextContent("1 component")
  })

  it("offers a reset when nothing matches", async () => {
    const user = userEvent.setup()
    renderBrowser()

    await user.type(screen.getByRole("searchbox"), "zzz")
    await user.click(screen.getByRole("button", { name: /show all/i }))
    expect(rating()).toBeInTheDocument()
    expect(stepper()).toBeInTheDocument()
  })

  it("restores filters from the URL", () => {
    window.history.replaceState(null, "", "/?q=st&category=structure")
    renderBrowser()

    expect(screen.getByRole("searchbox")).toHaveValue("st")
    expect(stepper()).toBeInTheDocument()
    expect(rating()).not.toBeInTheDocument()
  })

  it("ignores an unknown category in the URL", () => {
    window.history.replaceState(null, "", "/?category=nope")
    renderBrowser()

    expect(rating()).toBeInTheDocument()
    expect(stepper()).toBeInTheDocument()
  })

  it("writes filters to the URL after typing pauses", () => {
    vi.useFakeTimers()
    renderBrowser()

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "rating" },
    })
    expect(window.location.search).toBe("")

    act(() => {
      vi.advanceTimersByTime(250)
    })
    expect(window.location.search).toBe("?q=rating")
  })

  it("offers a prefilled component request when nothing matches", async () => {
    const user = userEvent.setup()
    renderBrowser()

    await user.type(screen.getByRole("searchbox"), "comment thread")

    const links = screen.getAllByRole("link", { name: /Request a component/ })
    expect(links).toHaveLength(1)
    const url = new URL(links[0].getAttribute("href")!)
    expect(url.pathname).toBe("/drift-ui/ui/issues/new")
    expect(url.searchParams.get("template")).toBe("component_request.yml")
    expect(url.searchParams.get("component")).toBe("comment thread")
    expect(links[0]).toHaveAttribute("target", "_blank")
  })

  it("ends the list with a request link when there are results", () => {
    renderBrowser()

    const link = screen.getByRole("link", { name: /Request a component/ })
    expect(
      new URL(link.getAttribute("href")!).searchParams.has("component")
    ).toBe(false)
    expect(screen.getByText("Don't see the component you need?")).toBeVisible()
    expect(
      stepper()!.compareDocumentPosition(link) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })
})
