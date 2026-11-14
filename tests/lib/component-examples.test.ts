import { readdirSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { COMPONENT_USAGE } from "@/lib/agent-docs/component-usage"
import { CATALOG, findEntry } from "@/lib/catalog"
import { loadCode, loadExamples } from "@/lib/component-docs"

const FOLDERS = readdirSync("components/preview/examples")
const BASE_UI_COMPONENTS = readdirSync("components/preview/base")
  .filter((file) => file.endsWith("-preview.tsx"))
  .map((file) => file.replace("-preview.tsx", ""))

function textOf(html: string) {
  const element = document.createElement("div")
  element.innerHTML = html
  return element.textContent ?? ""
}

describe("component examples", () => {
  it.each(FOLDERS)("%s is named after a catalog component", (folder) => {
    expect(CATALOG.map((entry) => entry.slug)).toContain(folder)
  })

  it.each(FOLDERS)("%s loads every listed example", async (slug) => {
    const examples = await loadExamples(slug, "radix")
    const bundle = await loadCode(findEntry(slug)!, "radix")

    expect(examples.length).toBeGreaterThan(0)
    expect(new Set(examples.map(({ id }) => id)).size).toBe(examples.length)
    for (const { id, code } of examples) {
      expect(id.startsWith(`${slug}-`)).toBe(true)
      expect(textOf(bundle[code].html)).toContain("Demo")
    }
  })

  it.each(CATALOG.map((entry) => entry.slug))(
    "%s has at least one example",
    (slug) => {
      expect(FOLDERS).toContain(slug)
    }
  )

  it.each(CATALOG.map((entry) => entry.slug))(
    "%s has a usage snippet",
    (slug) => {
      expect(COMPONENT_USAGE[slug]?.example).toBeTruthy()
    }
  )

  it.each(BASE_UI_COMPONENTS)(
    "%s gives every example a Base UI version",
    async (slug) => {
      const { examples } = await import(
        `@/components/preview/examples/${slug}/index`
      )

      for (const example of examples) {
        expect(example.BasePreview, example.id).toBeDefined()
      }
    }
  )

  it("shows Base UI code on Base UI pages", async () => {
    const [example] = await loadExamples("dialog", "radix")
    const radix = await loadCode(findEntry("dialog")!, "radix")
    const base = await loadCode(findEntry("dialog")!, "base")

    expect(textOf(radix[example.code].html)).toContain("asChild")
    expect(textOf(base[example.code].html)).toContain("render={")
  })

  it("returns nothing for an unknown component", async () => {
    await expect(loadExamples("not-a-component", "base")).resolves.toEqual([])
  })
})
