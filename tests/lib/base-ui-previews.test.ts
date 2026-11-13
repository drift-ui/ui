import { readdirSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const BASE_UI_PREVIEW_DIR = "components/preview/base"
const DIFFERENT_BY_API = new Set([
  "dialog-preview.tsx",
  "popover-preview.tsx",
  "toast-preview.tsx",
  "examples/badge/as-link.tsx",
  "examples/button/as-link.tsx",
  "examples/dialog/confirm.tsx",
  "examples/dialog/controlled.tsx",
  "examples/popover/help.tsx",
  "examples/popover/placement.tsx",
  "examples/toast/inbox.tsx",
  "examples/toast/merge.tsx",
  "examples/toast/progress.tsx",
  "examples/toast/promise.tsx",
  "examples/toast/reading-time.tsx",
  "examples/toast/types.tsx",
  "examples/toast/undo.tsx",
])

function readPreview(path: string) {
  return readFileSync(path, "utf8")
    .replaceAll("@/registry/base/ui/", "@/registry/default/ui/")
    .replace(
      /import \{([^}]*)\}/g,
      (_, names: string) =>
        `import { ${names
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean)
          .join(", ")} }`
    )
}

describe("Base UI previews", () => {
  it.each(
    readdirSync(BASE_UI_PREVIEW_DIR, {
      recursive: true,
      encoding: "utf8",
    }).filter((file) => file.endsWith(".tsx") && !DIFFERENT_BY_API.has(file))
  )("%s matches its Radix preview apart from imports", (file) => {
    expect(readPreview(`${BASE_UI_PREVIEW_DIR}/${file}`)).toBe(
      readPreview(`components/preview/${file}`)
    )
  })
})
