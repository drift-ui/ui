import { readdirSync } from "node:fs"
import { describe, expect, it } from "vitest"

// shadcn add matches imports by basename, so a lib file named like its UI file installs as a self-import (#135).
const names = (dir: string) =>
  readdirSync(dir).map((file) => file.replace(/\.tsx?$/, ""))

describe("lib file names", () => {
  it("never match a UI file name", () => {
    const ui = new Set(names("registry/default/ui"))
    expect(names("registry/default/lib").filter((n) => ui.has(n))).toEqual([])
  })
})
