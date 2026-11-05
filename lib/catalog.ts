import registry from "@/registry.json"

export type CategoryId = "inputs" | "structure" | "workflow" | "primitives"

export type RegistryFile = { path: string; type: string }

export type CatalogEntry = {
  slug: string
  name: string
  description: string
  category: CategoryId
  dependencies: string[]
  registryDependencies: string[]
  files: RegistryFile[]
  stageClassName?: string
}

type RegistryItem = (typeof registry.items)[number] & {
  dependencies?: string[]
  registryDependencies?: string[]
  files?: RegistryFile[]
}

export const CATEGORIES: {
  id: CategoryId
  label: string
  description: string
}[] = [
  {
    id: "inputs",
    label: "Inputs",
    description: "Fields for the values a plain text input cannot hold.",
  },
  {
    id: "structure",
    label: "Structure",
    description: "Hierarchies, sequences and history.",
  },
  {
    id: "workflow",
    label: "Workflow",
    description:
      "Filters, selections and guided tours that sit on top of a screen.",
  },
  {
    id: "primitives",
    label: "Primitives",
    description: "Same API as shadcn/ui. Skip any you already have.",
  },
]

const ENTRY_LAYOUT: {
  slug: string
  category: CategoryId
  stageClassName?: string
}[] = [
  { slug: "color-picker", category: "inputs" },
  { slug: "date-time-range", category: "inputs" },
  { slug: "duration-input", category: "inputs" },
  { slug: "emoji-picker", category: "inputs" },
  { slug: "file-dropzone", category: "inputs" },
  { slug: "image-cropper", category: "inputs" },
  { slug: "inline-edit", category: "inputs" },
  { slug: "masked-input", category: "inputs" },
  { slug: "mention-textarea", category: "inputs" },
  { slug: "multi-select", category: "inputs" },
  { slug: "number-input", category: "inputs" },
  { slug: "password-input", category: "inputs" },
  { slug: "phone-input", category: "inputs" },
  { slug: "rating", category: "inputs" },
  { slug: "recurrence-editor", category: "inputs" },
  { slug: "secret-field", category: "inputs" },
  { slug: "shortcut-recorder", category: "inputs", stageClassName: "gap-8" },
  { slug: "signature-pad", category: "inputs" },
  { slug: "tags-input", category: "inputs" },
  { slug: "time-field", category: "inputs", stageClassName: "gap-8" },
  { slug: "timezone-picker", category: "inputs" },
  { slug: "avatar-group", category: "structure" },
  { slug: "description-list", category: "structure" },
  { slug: "diff-viewer", category: "structure" },
  { slug: "json-viewer", category: "structure" },
  { slug: "sortable-list", category: "structure" },
  { slug: "stepper", category: "structure" },
  { slug: "timeline", category: "structure" },
  { slug: "tree-view", category: "structure" },
  { slug: "uptime-bar", category: "structure" },
  { slug: "virtual-list", category: "structure" },
  {
    slug: "bulk-action-bar",
    category: "workflow",
    stageClassName:
      "relative min-h-72 flex-col flex-nowrap items-stretch justify-start pb-20",
  },
  { slug: "comment-thread", category: "workflow" },
  {
    slug: "filter-builder",
    category: "workflow",
    stageClassName: "flex-col flex-nowrap items-stretch justify-start",
  },
  { slug: "notification-inbox", category: "workflow" },
  {
    slug: "permission-matrix",
    category: "workflow",
    stageClassName: "flex-col flex-nowrap items-stretch",
  },
  { slug: "saved-views", category: "workflow" },
  { slug: "shortcut-cheatsheet", category: "workflow" },
  {
    slug: "tour",
    category: "workflow",
    stageClassName: "flex-col flex-nowrap items-stretch",
  },
  {
    slug: "transfer-list",
    category: "workflow",
    stageClassName: "flex-col flex-nowrap items-stretch",
  },
  { slug: "avatar", category: "primitives" },
  { slug: "badge", category: "primitives" },
  { slug: "button", category: "primitives" },
  { slug: "card", category: "primitives" },
  { slug: "dialog", category: "primitives" },
  { slug: "input", category: "primitives" },
  { slug: "label", category: "primitives" },
  { slug: "popover", category: "primitives" },
]

const REGISTRY_ITEMS = new Map(
  (registry.items as RegistryItem[]).map((item) => [item.name, item])
)

function toEntry(layout: (typeof ENTRY_LAYOUT)[number]): CatalogEntry {
  const item = REGISTRY_ITEMS.get(layout.slug)
  if (!item) throw new Error(`registry.json has no item named ${layout.slug}`)

  return {
    ...layout,
    name: item.title,
    description: item.description,
    dependencies: item.dependencies ?? [],
    registryDependencies: item.registryDependencies ?? [],
    files: item.files ?? [],
  }
}

export const CATALOG: CatalogEntry[] = ENTRY_LAYOUT.map(toEntry)

export function findEntry(slug: string) {
  return CATALOG.find((entry) => entry.slug === slug)
}

export function findNeighbors(slug: string) {
  const index = CATALOG.findIndex((entry) => entry.slug === slug)

  return {
    previous: index > 0 ? CATALOG[index - 1] : undefined,
    next: CATALOG[index + 1],
  }
}

export function findCategory(id: CategoryId) {
  return CATEGORIES.find((category) => category.id === id)
}

export function findRegistryTitle(name: string) {
  return REGISTRY_ITEMS.get(name)?.title
}
