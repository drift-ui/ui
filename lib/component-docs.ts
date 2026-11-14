import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import path from "node:path"
import type { ComponentType } from "react"

import {
  findEntry,
  findRegistryTitle,
  type CatalogEntry,
  type RegistryFile,
} from "@/lib/catalog"
import { toBaseUiItem } from "@/lib/base-ui-registry"
import { highlightFile, type HighlightedFile } from "@/lib/highlight"
import { componentPath, type PrimitiveLibrary } from "@/lib/primitive-library"

export type { HighlightedFile }

export type BuildsOn = { label: string; href?: string }

export type ComponentExample = {
  id: string
  title: string
  description: string
  Preview: ComponentType
  BasePreview?: ComponentType
}

export type LoadedExample = Pick<
  ComponentExample,
  "id" | "title" | "description" | "Preview"
> & { code: string }

export type CodeBundle = Record<string, HighlightedFile>

const IMPORT_REWRITES: [RegExp, string][] = [
  [/@\/registry\/[^/]+\/lib\/utils/g, "@/lib/utils"],
  [/@\/registry\/[^/]+\/ui\//g, "@/components/ui/"],
  [/@\/registry\/[^/]+\/lib\//g, "@/lib/"],
  [/@\/registry\/[^/]+\/hooks\//g, "@/hooks/"],
]

const NAMESPACE = "@drift-ui/"

const PREVIEW_DIR = "components/preview/"
const REGISTRY_DIR = "registry/"

function absoluteProjectPath(relativePath: string) {
  if (relativePath.startsWith(PREVIEW_DIR)) {
    return path.join(
      process.cwd(),
      "components/preview",
      relativePath.slice(PREVIEW_DIR.length)
    )
  }
  return path.join(
    process.cwd(),
    "registry",
    relativePath.slice(REGISTRY_DIR.length)
  )
}

async function readProjectFile(relativePath: string) {
  const code = await readFile(absoluteProjectPath(relativePath), "utf8")

  return IMPORT_REWRITES.reduce(
    (rewritten, [pattern, replacement]) =>
      rewritten.replace(pattern, replacement),
    code
  ).trimEnd()
}

function installPath(file: RegistryFile) {
  const name = path.basename(file.path)

  switch (file.type) {
    case "registry:lib":
      return `lib/${name}`
    case "registry:hook":
      return `hooks/${name}`
    default:
      return `components/ui/${name}`
  }
}

function previewPath(slug: string, library: PrimitiveLibrary) {
  const basePreviewPath = `components/preview/base/${slug}-preview.tsx`
  if (library === "base" && existsSync(basePreviewPath)) return basePreviewPath
  return `components/preview/${slug}-preview.tsx`
}

async function readDemo(filePath: string) {
  const source = await readProjectFile(filePath)

  return source.replace(/(\w+)Preview\b/g, "$1Demo")
}

export function demoTitle(slug: string) {
  return `${slug}-demo.tsx`
}

function exampleTitle(slug: string, id: string) {
  return `${slug}-${id}.tsx`
}

function examplePath(slug: string, id: string, library: PrimitiveLibrary) {
  const basePath = `components/preview/base/examples/${slug}/${id}.tsx`
  if (library === "base" && existsSync(basePath)) return basePath
  return `components/preview/examples/${slug}/${id}.tsx`
}

async function importExamples(slug: string): Promise<ComponentExample[]> {
  if (!existsSync(`components/preview/examples/${slug}/index.ts`)) return []

  const { examples }: { examples: ComponentExample[] } = await import(
    `@/components/preview/examples/${slug}/index`
  )
  return examples
}

export async function loadExamples(
  slug: string,
  library: PrimitiveLibrary
): Promise<LoadedExample[]> {
  const examples = await importExamples(slug)

  return examples.map(({ id, title, description, Preview, BasePreview }) => ({
    id: `${slug}-${id}`,
    title,
    description,
    Preview: (library === "base" && BasePreview) || Preview,
    code: exampleTitle(slug, id),
  }))
}

export async function loadCode(
  entry: CatalogEntry,
  library: PrimitiveLibrary
): Promise<CodeBundle> {
  const source = library === "base" ? toBaseUiItem(entry) : entry
  const examples = await importExamples(entry.slug)
  const files = [
    {
      title: demoTitle(entry.slug),
      code: readDemo(previewPath(entry.slug, library)),
    },
    ...examples.map(({ id }) => ({
      title: exampleTitle(entry.slug, id),
      code: readDemo(examplePath(entry.slug, id, library)),
    })),
    ...source.files.map((file) => ({
      title: installPath(file),
      code: readProjectFile(file.path),
    })),
  ]
  const highlighted = await Promise.all(
    files.map(async ({ title, code }) => highlightFile(title, await code))
  )

  return Object.fromEntries(highlighted.map((file) => [file.title, file]))
}

export function loadUsageSnippet(entry: CatalogEntry, code: string) {
  return highlightFile(`${entry.slug}-usage.tsx`, code)
}

export function listInstallPaths(entry: CatalogEntry) {
  return entry.files.map(installPath)
}

function toBuildsOn(dependency: string, library: PrimitiveLibrary): BuildsOn {
  if (!dependency.startsWith(NAMESPACE)) {
    return { label: `shadcn/ui ${dependency}` }
  }

  const name = dependency.slice(NAMESPACE.length)
  const entry = findEntry(name)
  if (entry)
    return { label: entry.name, href: componentPath(entry.slug, library) }

  return { label: findRegistryTitle(name) ?? name }
}

export function resolveBuildsOn(
  entry: CatalogEntry,
  library: PrimitiveLibrary
) {
  const { registryDependencies = [] } =
    library === "base" ? toBaseUiItem(entry) : entry

  return registryDependencies
    .filter((dependency) => dependency !== "utils")
    .map((dependency) => toBuildsOn(dependency, library))
}
