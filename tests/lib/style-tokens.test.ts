import { existsSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { baseUiSourcePath } from "@/lib/base-ui-registry"
import {
  DEFAULT_STYLE,
  SHOWCASE_STYLES,
  STYLE_TOKENS,
  findStyle,
  scopeStyleCss,
} from "@/lib/style-tokens"
import registry from "@/registry.json"

const TOKEN_CLASS =
  /(?<![\w-])(?:h|min-h|size|rounded|shadow|gap|px|py|pt|pb)-(?:control(?:-sm)?|card|box|dialog)(?![\w-])/

describe("style tokens", () => {
  it("falls back to Vega for an unknown or missing style", () => {
    expect(findStyle("nova").label).toBe("Nova")
    expect(findStyle("aurora")).toBe(DEFAULT_STYLE)
    expect(findStyle(null)).toBe(DEFAULT_STYLE)
    expect(DEFAULT_STYLE.id).toBe("vega")
  })

  it("scopes every token of a style under the given selectors", () => {
    const maia = findStyle("maia")
    const css = scopeStyleCss(maia, ["[data-a]", "[data-b]"])

    expect(css.startsWith("[data-a],\n[data-b] {")).toBe(true)
    for (const token of STYLE_TOKENS) {
      expect(css).toContain(`--drift-${token}: ${maia.tokens[token]};`)
    }
  })

  it("offers the eight shadcn create styles in picker order", () => {
    expect(SHOWCASE_STYLES.map((style) => style.label)).toEqual([
      "Vega",
      "Nova",
      "Maia",
      "Lyra",
      "Mira",
      "Luma",
      "Sera",
      "Rhea",
    ])
  })

  it("gives every style a distinct look", () => {
    const looks = SHOWCASE_STYLES.map((style) => JSON.stringify(style.tokens))

    expect(new Set(looks).size).toBe(SHOWCASE_STYLES.length)
  })

  it("keeps the site defaults and the shape item in step with Vega", () => {
    const globals = readFileSync("app/globals.css", "utf8")
    const shape = registry.items.find((item) => item.name === "shape")

    for (const token of STYLE_TOKENS) {
      expect(globals).toContain(
        `--drift-${token}: ${DEFAULT_STYLE.tokens[token]};`
      )
      expect(globals).toContain(`--${token}: var(--drift-${token});`)
    }
    expect(shape?.cssVars?.theme).toEqual(DEFAULT_STYLE.tokens)
  })

  it("installs the shape tokens with every item that uses them", () => {
    const missing = registry.items
      .filter((item) =>
        (item.files ?? [])
          .flatMap((file) => [file.path, baseUiSourcePath(file.path)])
          .some(
            (path) =>
              existsSync(path) && TOKEN_CLASS.test(readFileSync(path, "utf8"))
          )
      )
      .filter((item) => !item.registryDependencies?.includes("@drift-ui/shape"))
      .map((item) => item.name)

    expect(missing).toEqual([])
  })

  it("builds a shape item for every non-default style", () => {
    for (const style of SHOWCASE_STYLES) {
      if (style === DEFAULT_STYLE) continue
      const item = JSON.parse(
        readFileSync(`public/r/styles/${style.id}/shape.json`, "utf8")
      )

      expect(item.name).toBe("shape")
      expect(item.cssVars.theme).toEqual(style.tokens)
    }
  })
})
