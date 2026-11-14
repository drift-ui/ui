import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderToString } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ThemeScopeControl } from "@/components/docs/theme-scope-control"
import { ShowcaseCanvas } from "@/components/showcase/showcase-canvas"
import {
  SHOWCASE_CARDS,
  UNSHOWCASED_ENTRIES,
} from "@/components/showcase/showcase-cards"
import { ShowcaseWorkbench } from "@/components/showcase/showcase-workbench"
import { ThemeToolbar } from "@/components/showcase/theme-toolbar"
import { ThemeScopeStyle } from "@/components/theme-scope-style"
import { updateShowcaseTheme } from "@/hooks/use-showcase-theme"
import { CATALOG } from "@/lib/catalog"
import {
  THEME_PRESETS,
  applyPreset,
  findActivePreset,
  readRadius,
} from "@/lib/showcase-presets"
import { encodeShare } from "@/lib/showcase-share"
import { DEFAULT_STYLE, findStyle } from "@/lib/style-tokens"
import { EMPTY_THEME } from "@/lib/theme-css"

const CATALOG_SLUGS = new Set(CATALOG.map((entry) => entry.slug))

describe("Showcase", () => {
  it("only lists catalog slugs as the components a card uses", () => {
    const unknownSlugs = SHOWCASE_CARDS.flatMap((card) => card.uses).filter(
      (slug) => !CATALOG_SLUGS.has(slug)
    )

    expect(unknownSlugs).toEqual([])
  })

  it("puts every catalog component on the canvas", () => {
    render(<ShowcaseCanvas />)

    for (const entry of UNSHOWCASED_ENTRIES) {
      expect(screen.getByRole("link", { name: entry.name })).toBeVisible()
    }
    expect(UNSHOWCASED_ENTRIES.length + SHOWCASE_CARDS.length).toBeGreaterThan(
      0
    )
  })
})

function resetShowcase() {
  updateShowcaseTheme({ theme: EMPTY_THEME, style: DEFAULT_STYLE })
  window.localStorage.clear()
  window.history.replaceState(null, "", "/themes")
}

function renderToolbar(
  props: Partial<React.ComponentProps<typeof ThemeToolbar>> = {}
) {
  const handlers = {
    onThemeChange: vi.fn(),
    onStyleChange: vi.fn(),
    onReset: vi.fn(),
  }
  render(
    <ThemeToolbar
      theme={EMPTY_THEME}
      style={DEFAULT_STYLE}
      isDefault
      {...handlers}
      {...props}
    />
  )
  return handlers
}

const EMBER = THEME_PRESETS.find((preset) => preset.id === "ember")!
const MAIA_EMBER_CODE = encodeShare({
  theme: applyPreset(EMPTY_THEME, EMBER),
  style: findStyle("maia"),
})!

describe("ThemeToolbar", () => {
  beforeEach(resetShowcase)

  it("picks a style, a preset and a radius from their popovers", async () => {
    const user = userEvent.setup()
    const { onStyleChange, onThemeChange } = renderToolbar()

    await user.click(screen.getByRole("button", { name: /Style/ }))
    await user.click(screen.getByRole("button", { name: /^Nova/ }))
    expect(onStyleChange).toHaveBeenCalledWith(findStyle("nova"))

    await user.click(screen.getByRole("button", { name: /Preset/ }))
    await user.click(screen.getByRole("button", { name: "Ember" }))
    expect(findActivePreset(onThemeChange.mock.lastCall![0])).toBe(EMBER)

    await user.click(screen.getByRole("button", { name: /Radius/ }))
    await user.click(
      within(screen.getByRole("group", { name: "Radius" })).getByRole(
        "button",
        { name: /^1\s*rem radius$/ }
      )
    )
    expect(readRadius(onThemeChange.mock.lastCall![0])).toBe("1rem")
  })

  it("opens on hover and closes after the pointer leaves", async () => {
    const user = userEvent.setup()
    renderToolbar()
    const trigger = screen.getByRole("button", { name: /Style/ })

    await user.hover(trigger)
    expect(screen.getByRole("group", { name: "Style" })).toBeVisible()

    await user.unhover(trigger)
    await waitFor(() =>
      expect(screen.queryByRole("group", { name: "Style" })).toBeNull()
    )
  })

  it("toggles from the keyboard after the mouse opened it", async () => {
    const user = userEvent.setup()
    renderToolbar()
    const trigger = screen.getByRole("button", { name: /Style/ })

    await user.click(trigger)
    expect(screen.getByRole("group", { name: "Style" })).toBeVisible()

    trigger.focus()
    await user.keyboard("{Enter}")
    expect(screen.queryByRole("group", { name: "Style" })).toBeNull()
  })

  it("only enables reset and copy when there is something to undo", () => {
    renderToolbar()
    expect(screen.getByRole("button", { name: "Reset" })).toBeDisabled()
    expect(screen.queryByRole("button", { name: "Copy CSS" })).toBeNull()
    cleanup()

    renderToolbar({ theme: EMBER.theme, isDefault: false })
    expect(screen.getByRole("button", { name: "Reset" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Copy CSS" })).toBeVisible()
    expect(screen.getByRole("button", { name: /Edit CSS/ })).toBeVisible()
  })
})

describe("ShowcaseWorkbench", () => {
  beforeEach(resetShowcase)

  it("writes a share code to the URL and drops it on reset", async () => {
    const user = userEvent.setup()
    render(<ShowcaseWorkbench sharedCode={undefined}>canvas</ShowcaseWorkbench>)
    expect(window.location.search).toBe("")

    act(() => updateShowcaseTheme({ style: findStyle("lyra") }))
    expect(window.location.search).toMatch(/^\?preset=[0-9a-z]{7}$/)

    await user.click(screen.getAllByRole("button", { name: "Reset" })[0])
    expect(window.location.search).toBe("")
  })

  it("applies the share code from the route", () => {
    render(
      <ShowcaseWorkbench sharedCode={MAIA_EMBER_CODE}>canvas</ShowcaseWorkbench>
    )

    expect(screen.getByRole("button", { name: /Style\s*Maia/ })).toBeVisible()
    expect(screen.getByRole("button", { name: /Preset\s*Ember/ })).toBeVisible()
  })

  it("shows a shared code without replacing the saved theme", () => {
    const saved = ":root {\n  --primary: oklch(0.6 0.2 300);\n}"
    window.localStorage.setItem("drift-ui:showcase-theme", saved)

    render(
      <ShowcaseWorkbench sharedCode={MAIA_EMBER_CODE}>canvas</ShowcaseWorkbench>
    )

    expect(screen.getByRole("button", { name: /Style\s*Maia/ })).toBeVisible()
    expect(window.localStorage.getItem("drift-ui:showcase-theme")).toBe(saved)
    expect(window.localStorage.getItem("drift-ui:showcase-style")).toBeNull()
  })

  it("renders the shared style on the server", () => {
    const html = renderToString(
      <ShowcaseWorkbench sharedCode={MAIA_EMBER_CODE}>canvas</ShowcaseWorkbench>
    )

    expect(html).toContain("--drift-radius-control: var(--radius-4xl)")
    expect(html).toContain("Maia")
  })
})

describe("ThemeScopeStyle", () => {
  beforeEach(resetShowcase)

  it("scopes the radius scale, the style tokens and any theme colors", () => {
    const { container } = render(<ThemeScopeStyle />)
    const css = () => container.querySelector("style")?.textContent ?? ""

    expect(css()).toContain("--radius-md: calc(var(--radius) - 2px)")
    expect(css()).toContain("--drift-spacing-control: calc(var(--spacing) * 9)")
    expect(css()).not.toContain("--primary")

    act(() =>
      updateShowcaseTheme({ theme: EMBER.theme, style: findStyle("nova") })
    )
    expect(css()).toContain("--primary")
    expect(css()).toContain("--drift-spacing-control: calc(var(--spacing) * 8)")
    expect(css().indexOf("--radius-md")).toBeLessThan(
      css().indexOf("--primary")
    )
  })
})

describe("ThemeScopeControl", () => {
  beforeEach(resetShowcase)

  it("picks a style from the docs theme popover", async () => {
    const user = userEvent.setup()
    render(<ThemeScopeControl />)

    await user.click(screen.getByRole("button", { name: "Try your theme" }))
    await user.click(screen.getByRole("button", { name: /^Lyra/ }))

    expect(screen.getByRole("button", { name: /^Lyra/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(
      screen.getByRole("button", { name: "Neutral", expanded: true })
    ).toBeVisible()
  })
})
