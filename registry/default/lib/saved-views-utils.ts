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
  const restored =
    view.isDefault && views.some((v) => v.isDefault)
      ? { ...view, isDefault: false }
      : view
  const at = Math.min(Math.max(index, 0), views.length)
  return [...views.slice(0, at), restored, ...views.slice(at)]
}

function definedKeys(value: object): string[] {
  return Object.keys(value).filter(
    (key) => (value as Record<string, unknown>)[key] !== undefined
  )
}

export function isViewDataEqual(a: unknown, b: unknown): boolean {
  return equal(a, b, new WeakMap())
}

function equal(
  a: unknown,
  b: unknown,
  seen: WeakMap<object, WeakSet<object>>
): boolean {
  if (a === b || Object.is(a, b)) return true
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false
  if (seen.get(a)?.has(b)) return true
  const pairs = seen.get(a) ?? new WeakSet<object>()
  seen.set(a, pairs.add(b))
  const result = equalObjects(a, b, seen)
  pairs.delete(b)
  return result
}

function equalObjects(
  a: object,
  b: object,
  seen: WeakMap<object, WeakSet<object>>
): boolean {
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime()
  }
  if (a instanceof RegExp && b instanceof RegExp) {
    return String(a) === String(b)
  }
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false
    const unmatched = [...b]
    return [...a].every((item) => {
      const index = unmatched.findIndex((other) => equal(item, other, seen))
      if (index === -1) return false
      unmatched.splice(index, 1)
      return true
    })
  }
  if (a instanceof Map && b instanceof Map) {
    return (
      a.size === b.size &&
      [...a].every(
        ([key, value]) => b.has(key) && equal(value, b.get(key), seen)
      )
    )
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length && a.every((item, i) => equal(item, b[i], seen))
    )
  }
  const keysA = definedKeys(a)
  const keysB = definedKeys(b)
  return (
    keysA.length === keysB.length &&
    keysA.every((key) =>
      equal(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
        seen
      )
    )
  )
}

export function isViewDirty<T>(
  view: SavedView<T> | undefined,
  currentData: T | undefined,
  isEqual: (saved: T, current: T) => boolean = isViewDataEqual
): boolean {
  if (view?.data === undefined || currentData === undefined) return false
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

export function writeViewParam(
  search: string | URLSearchParams,
  activeId: string,
  key = "view"
): string {
  const params = new URLSearchParams(search)
  params.set(key, activeId)
  return params.toString()
}
