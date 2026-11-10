import { readdirSync } from "node:fs"
import { render } from "@testing-library/react"
import axe from "axe-core"
import { describe, expect, it } from "vitest"

import { BASE_UI_PREVIEWS, PREVIEWS } from "@/components/docs/preview-registry"
import { PasswordInputSpecimen } from "@/components/landing/specimens/password-input-specimen"
import { AccountSecurityCard } from "@/components/showcase/cards/account-security-card"
import { CATALOG } from "@/lib/catalog"
import type { ComponentExample } from "@/lib/component-docs"

const FOLDERS = readdirSync("components/preview/examples")
const LIBRARY_PREVIEWS =
  process.env.UI_PRIMITIVES === "base"
    ? { ...PREVIEWS, ...BASE_UI_PREVIEWS }
    : PREVIEWS

const EXAMPLES = (
  await Promise.all(
    FOLDERS.map(async (slug) => {
      const { examples }: { examples: ComponentExample[] } = await import(
        `@/components/preview/examples/${slug}/index.ts`
      )

      return examples.map((example): [string, ComponentExample] => [
        `${slug}/${example.id}`,
        example,
      ])
    })
  )
).flat()

function expectNoPrefilledPasswords(container: HTMLElement) {
  const passwords = container.querySelectorAll<HTMLInputElement>(
    'input[type="password"]'
  )

  expect([...passwords].map((input) => input.value).join("")).toBe("")
}

describe("component examples", () => {
  it("covers every catalog component", () => {
    expect([...FOLDERS].sort()).toEqual(
      CATALOG.map((entry) => entry.slug).sort()
    )
  })

  it.each(Object.entries(LIBRARY_PREVIEWS))(
    "%s preview gives browsers no password to save",
    (_, Preview) => {
      expectNoPrefilledPasswords(render(<Preview />).container)
    }
  )

  it("gives browsers no password to save in the landing and showcase demos", () => {
    expectNoPrefilledPasswords(render(<PasswordInputSpecimen />).container)
    expectNoPrefilledPasswords(render(<AccountSecurityCard />).container)
  })

  it.each(EXAMPLES)("%s renders", async (_, { Preview, BasePreview }) => {
    const Example =
      (process.env.UI_PRIMITIVES === "base" && BasePreview) || Preview
    const { container } = render(<Example />)

    expect(container).not.toBeEmptyDOMElement()
    expectNoPrefilledPasswords(container)

    const { violations } = await axe.run(container)
    expect(
      violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map((node) => node.target.join(" ")),
      }))
    ).toEqual([])
  })
})
