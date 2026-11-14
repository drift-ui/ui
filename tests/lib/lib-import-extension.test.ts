import { readdirSync, readFileSync } from "node:fs"
import { basename, join } from "node:path"
import { describe, expect, it } from "vitest"

// shadcn add matches imports by basename, so ui/<name>.tsx importing lib/<name> resolves to itself (#135).
const UI_FILES = ["default", "base"].flatMap((flavor) => {
  const dir = join("registry", flavor, "ui")
  return readdirSync(dir)
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => join(dir, file))
})

describe("same-named lib imports", () => {
  it.each(UI_FILES)("%s imports its same-named lib file with .ts", (file) => {
    const name = basename(file, ".tsx")
    const source = readFileSync(file, "utf8")
    expect(source).not.toMatch(new RegExp(`/lib/${name}"`))
  })
})
