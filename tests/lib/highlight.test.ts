import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import {
  codeTokenCss,
  highlight,
  highlightInline,
  highlightType,
} from "@/lib/highlight"

function tokenColors(html: string) {
  return [...html.matchAll(/\bsd\d+\b/g)].map(([className]) => className)
}

function textOf(html: string) {
  const element = document.createElement("div")
  element.innerHTML = html
  return element.textContent ?? ""
}

describe("inline highlighting", () => {
  it("returns spans without a block wrapper", async () => {
    const html = await highlightInline('"split"')

    expect(html).toContain("<span")
    expect(html).not.toContain("<pre")
  })

  it("escapes markup", async () => {
    const html = await highlightInline("<StarIcon />")

    expect(html).not.toContain("<StarIcon")
  })

  it("reads a bare primitive as a type", async () => {
    const [asType] = tokenColors(await highlightType("string"))
    const [asValue] = tokenColors(await highlightInline("string"))

    expect(asType).toBeDefined()
    expect(asType).not.toBe(asValue)
  })

  it("colors the parts of a union differently", async () => {
    const colors = tokenColors(await highlightType('"split" | "unified"'))

    expect(new Set(colors).size).toBeGreaterThan(1)
  })
})

describe("block highlighting", () => {
  const code = readFileSync("registry/default/ui/saved-views.tsx", "utf8")

  it("keeps the exact source as text so copy matches it", async () => {
    expect(textOf(await highlight(code))).toBe(code)
  })

  it("colors tokens with classes instead of inline styles", async () => {
    const html = await highlight(code)
    const tokenStyles = html.match(/<span style=/g) ?? []

    expect(tokenStyles).toHaveLength(0)
    expect(tokenColors(html).length).toBeGreaterThan(0)
  })

  it("defines every class it emits", async () => {
    const css = await codeTokenCss()
    const used = new Set(
      [...(await highlight(code)).matchAll(/\bs[ld]\d+\b/g)].map(([c]) => c)
    )

    for (const className of used) expect(css).toContain(`.${className}{`)
  })
})
