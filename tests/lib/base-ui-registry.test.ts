import { readdirSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { toBaseUiItem } from "@/lib/base-ui-registry"

const BASE_UI_REGISTRY_DIR = "public/r/base"

describe("toBaseUiItem", () => {
  it("swaps in the Base UI file and dependency", () => {
    const item = toBaseUiItem({
      files: [{ path: "registry/default/ui/stepper.tsx", type: "registry:ui" }],
      dependencies: ["radix-ui", "lucide-react"],
    })

    expect(item.files).toEqual([
      { path: "registry/base/ui/stepper.tsx", type: "registry:ui" },
    ])
    expect(item.dependencies).toEqual(["@base-ui/react", "lucide-react"])
  })

  it("drops radix-ui when the Base UI file needs no primitive", () => {
    const item = toBaseUiItem({
      files: [{ path: "registry/default/ui/label.tsx", type: "registry:ui" }],
      dependencies: ["radix-ui"],
    })

    expect(item.files[0].path).toBe("registry/base/ui/label.tsx")
    expect(item.dependencies).toEqual([])
  })

  it("installs toast.tsx in place of sonner.tsx without the sonner packages", () => {
    const item = toBaseUiItem({
      files: [{ path: "registry/default/ui/sonner.tsx", type: "registry:ui" }],
      dependencies: ["sonner", "next-themes", "lucide-react"],
      registryDependencies: ["@drift-ui/shape"],
    })

    expect(item.files[0].path).toBe("registry/base/ui/toast.tsx")
    expect(item.dependencies).toEqual(["@base-ui/react", "lucide-react"])
    expect(item.registryDependencies).toEqual([
      "utils",
      "button",
      "@drift-ui/shape",
    ])
  })

  it("keeps shared files as they are", () => {
    const tagsInput = {
      files: [
        { path: "registry/default/ui/tags-input.tsx", type: "registry:ui" },
      ],
      dependencies: ["lucide-react"],
    }

    expect(toBaseUiItem(tagsInput)).toEqual(tagsInput)
  })
})

describe("Base UI registry build", () => {
  it.each(readdirSync(BASE_UI_REGISTRY_DIR))(
    "%s never references radix-ui",
    (file) => {
      expect(
        readFileSync(`${BASE_UI_REGISTRY_DIR}/${file}`, "utf8")
      ).not.toContain("radix-ui")
    }
  )
})
