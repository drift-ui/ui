/**
 * Represents a saved view configuration.
 * Note: `data` must be structured-cloneable (serializable) if using duplicateSavedView.
 */
export interface SavedView<T = unknown> {
  id: string
  name: string
  isDefault?: boolean
  isLocked?: boolean
  icon?: string
  data?: T
}

export function generateViewId(): string {
  return "view-" + Math.random().toString(36).slice(2, 9)
}

export function findUniqueViewName(
  baseName: string,
  existingViews: { name: string }[]
): string {
  const trimmed = baseName.trim()
  if (!trimmed) return "Untitled View"

  const existingNames = new Set(
    existingViews.map((v) => v.name.trim().toLowerCase())
  )

  if (!existingNames.has(trimmed.toLowerCase())) {
    return trimmed
  }

  // If already ends with (Copy) or (Copy N)
  const copyMatch = trimmed.match(/^(.*?) \(Copy(?: (\d+))?\)$/)
  const prefix = copyMatch ? copyMatch[1] : trimmed
  let count = copyMatch && copyMatch[2] ? parseInt(copyMatch[2], 10) + 1 : 1

  while (true) {
    const candidate =
      count === 1 ? `${prefix} (Copy)` : `${prefix} (Copy ${count})`
    if (!existingNames.has(candidate.toLowerCase())) {
      return candidate
    }
    count++
  }
}

export function createSavedView<T>(
  name: string,
  options?: {
    id?: string
    data?: T
    isDefault?: boolean
    isLocked?: boolean
    icon?: string
  }
): SavedView<T> {
  return {
    id: options?.id || generateViewId(),
    name: name.trim() || "Untitled View",
    ...(options?.isDefault ? { isDefault: true } : {}),
    ...(options?.isLocked ? { isLocked: true } : {}),
    ...(options?.icon ? { icon: options.icon } : {}),
    ...(options?.data !== undefined ? { data: options.data } : {}),
  }
}

export function duplicateSavedView<T>(
  sourceView: SavedView<T>,
  existingViews: SavedView<T>[]
): SavedView<T> {
  const baseDuplicateName = / \(Copy(?: \d+)?\)$/.test(sourceView.name)
    ? sourceView.name
    : `${sourceView.name} (Copy)`
  const newName = findUniqueViewName(baseDuplicateName, existingViews)
  return {
    id: generateViewId(),
    name: newName,
    isDefault: false,
    ...(sourceView.icon ? { icon: sourceView.icon } : {}),
    ...(sourceView.data !== undefined
      ? {
          data:
            typeof sourceView.data === "object" && sourceView.data !== null
              ? structuredClone(sourceView.data)
              : sourceView.data,
        }
      : {}),
  }
}

export function renameSavedView<T>(
  views: SavedView<T>[],
  id: string,
  nextName: string
): SavedView<T>[] {
  const trimmed = nextName.trim()
  if (!trimmed) return views
  return views.map((view) =>
    view.id === id ? { ...view, name: trimmed } : view
  )
}

export function deleteSavedView<T>(
  views: SavedView<T>[],
  id: string,
  currentActiveId?: string
): { views: SavedView<T>[]; nextActiveId: string | null } {
  const remaining = views.filter((view) => view.id !== id)
  if (remaining.length === views.length) {
    return { views, nextActiveId: currentActiveId ?? null }
  }

  let nextActiveId = currentActiveId ?? null
  if (currentActiveId === id) {
    const defaultView = remaining.find((v) => v.isDefault)
    nextActiveId = defaultView ? defaultView.id : (remaining[0]?.id ?? null)
  }

  return { views: remaining, nextActiveId }
}

export function setDefaultSavedView<T>(
  views: SavedView<T>[],
  id: string
): SavedView<T>[] {
  return views.map((view) => ({
    ...view,
    isDefault: view.id === id,
  }))
}

export function getActiveSavedView<T>(
  views: SavedView<T>[],
  activeId?: string | null
): SavedView<T> | undefined {
  if (activeId) {
    const found = views.find((v) => v.id === activeId)
    if (found) return found
  }
  return views.find((v) => v.isDefault) ?? views[0]
}

export function restoreSavedView<T>(
  views: SavedView<T>[],
  view: SavedView<T>,
  index: number
): SavedView<T>[] {
  if (views.some((v) => v.id === view.id)) return views
  const at = Math.min(Math.max(index, 0), views.length)
  return [...views.slice(0, at), view, ...views.slice(at)]
}

function definedKeys(value: object): string[] {
  return Object.keys(value).filter(
    (key) => (value as Record<string, unknown>)[key] !== undefined
  )
}

export function isViewDataEqual(a: unknown, b: unknown): boolean {
  if (a === b || Object.is(a, b)) return true
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime()
  }
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false
  if (Array.isArray(a) || Array.isArray(b)) {
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((item, i) => isViewDataEqual(item, b[i]))
    )
  }
  const keysA = definedKeys(a)
  const keysB = definedKeys(b)
  return (
    keysA.length === keysB.length &&
    keysA.every((key) =>
      isViewDataEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    )
  )
}

export function isViewDirty<T>(
  view: SavedView<T> | undefined,
  currentData: T | undefined,
  isEqual: (saved: T | undefined, current: T) => boolean = isViewDataEqual
): boolean {
  if (!view || currentData === undefined) return false
  return !isEqual(view.data, currentData)
}

export function readViewParam<T>(
  search: string | URLSearchParams,
  views: SavedView<T>[],
  key = "view"
): string | undefined {
  const id = new URLSearchParams(search).get(key)
  return getActiveSavedView(views, id)?.id
}

export function writeViewParam<T>(
  search: string | URLSearchParams,
  activeId: string,
  views: SavedView<T>[],
  key = "view"
): string {
  const params = new URLSearchParams(search)
  if (activeId === getActiveSavedView(views)?.id) params.delete(key)
  else params.set(key, activeId)
  return params.toString()
}
