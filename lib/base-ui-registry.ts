import { existsSync, readFileSync } from "node:fs"

import type { RegistryFile } from "@/lib/catalog"

type RegistryItemFiles = { files?: RegistryFile[]; dependencies?: string[] }

const RENAMED_FOR_BASE_UI: Record<string, string> = {
  "registry/default/ui/sonner.tsx": "registry/base/ui/toast.tsx",
}

const RADIX_ONLY_DEPENDENCIES = new Set(["radix-ui", "sonner", "next-themes"])

export function baseUiSourcePath(radixPath: string) {
  const basePath =
    RENAMED_FOR_BASE_UI[radixPath] ??
    radixPath.replace(/^registry\/default\//, "registry/base/")
  return existsSync(basePath) ? basePath : radixPath
}

export function toBaseUiItem<Item extends RegistryItemFiles>(item: Item): Item {
  if (!item.files) return item

  const files = item.files.map((file) => ({
    ...file,
    path: baseUiSourcePath(file.path),
  }))
  const importsBaseUi = files.some((file) =>
    readFileSync(file.path, "utf8").includes('from "@base-ui/react/')
  )
  const dependencies = (item.dependencies ?? []).filter(
    (dependency) => !RADIX_ONLY_DEPENDENCIES.has(dependency)
  )

  return {
    ...item,
    files,
    dependencies: importsBaseUi
      ? ["@base-ui/react", ...dependencies]
      : dependencies,
  }
}
