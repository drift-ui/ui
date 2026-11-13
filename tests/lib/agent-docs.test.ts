import { describe, expect, it } from "vitest"

import { buildLlmsFull } from "@/lib/agent-docs/build-docs"
import { findEntry } from "@/lib/catalog"
import { resolveBuildsOn } from "@/lib/component-docs"

describe("library-specific docs", () => {
  it("lists what the Base UI build installs on top", () => {
    const toast = findEntry("toast")!
    const labels = (library: "radix" | "base") =>
      resolveBuildsOn(toast, library).map((item) => item.label)

    expect(labels("base")).toContain("shadcn/ui button")
    expect(labels("radix")).not.toContain("shadcn/ui button")
  })

  it("gives agents the Base UI snippet next to the Radix one", () => {
    const docs = buildLlmsFull("https://drift-ui.dev")

    expect(docs).toContain('import { toast } from "@/components/ui/sonner"')
    expect(docs).toContain('import { toast } from "@/components/ui/toast"')
  })
})
