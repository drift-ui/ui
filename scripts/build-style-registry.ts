import { mkdirSync, writeFileSync } from "node:fs"

import registry from "@/registry.json"
import { DEFAULT_STYLE, SHOWCASE_STYLES } from "@/lib/style-tokens"

const shape = registry.items.find((item) => item.name === "shape")
if (!shape) throw new Error("registry.json has no shape item")

for (const style of SHOWCASE_STYLES) {
  if (style === DEFAULT_STYLE) continue
  const dir = `public/r/styles/${style.id}`
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    `${dir}/shape.json`,
    `${JSON.stringify(
      {
        $schema: "https://ui.shadcn.com/schema/registry-item.json",
        ...shape,
        cssVars: { theme: style.tokens },
      },
      null,
      2
    )}\n`
  )
}
