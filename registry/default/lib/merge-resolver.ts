import { diffWords, type DiffSegment } from "@/registry/default/lib/diff.ts"

export type MergeFieldChoice = "ours" | "theirs" | "custom"

export type MergeField = {
  name: string
  label?: string
  ours: string
  theirs: string
  base?: string
}

export type MergeFieldResolution = {
  choice: MergeFieldChoice
  customValue?: string
}

export type MergeResolutions = Record<string, MergeFieldResolution>

export type MergedRecord = Record<string, string>

export type FieldDiff = {
  identical: boolean
  oursSegments: DiffSegment[]
  theirsSegments: DiffSegment[]
}

export function isFieldConflict(field: MergeField): boolean {
  return field.ours !== field.theirs
}

export function getFieldDiff(ours: string, theirs: string): FieldDiff {
  if (ours === theirs) {
    return {
      identical: true,
      oursSegments: ours.length > 0 ? [{ text: ours, changed: false }] : [],
      theirsSegments:
        theirs.length > 0 ? [{ text: theirs, changed: false }] : [],
    }
  }

  const diff = diffWords(ours, theirs)
  if (diff) {
    return {
      identical: false,
      oursSegments: diff.old,
      theirsSegments: diff.new,
    }
  }

  return {
    identical: false,
    oursSegments: ours.length > 0 ? [{ text: ours, changed: true }] : [],
    theirsSegments: theirs.length > 0 ? [{ text: theirs, changed: true }] : [],
  }
}

export function isFieldResolved(resolution?: MergeFieldResolution): boolean {
  if (!resolution) return false
  if (resolution.choice === "ours" || resolution.choice === "theirs")
    return true
  if (resolution.choice === "custom")
    return typeof resolution.customValue === "string"
  return false
}

function setProperty<T extends object>(target: T, key: string, value: unknown) {
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  })
}

function getResolution(
  resolutions: MergeResolutions,
  name: string
): MergeFieldResolution | undefined {
  if (Object.hasOwn(resolutions, name)) {
    return Object.getOwnPropertyDescriptor(resolutions, name)?.value
  }
  return undefined
}

export function getUnresolvedCount(
  fields: MergeField[],
  resolutions: MergeResolutions
): number {
  return fields.filter(
    (field) =>
      isFieldConflict(field) &&
      !isFieldResolved(getResolution(resolutions, field.name))
  ).length
}

export function isAllResolved(
  fields: MergeField[],
  resolutions: MergeResolutions
): boolean {
  return getUnresolvedCount(fields, resolutions) === 0
}

export function getMergedRecord(
  fields: MergeField[],
  resolutions: MergeResolutions
): MergedRecord {
  const record: MergedRecord = {}
  for (const field of fields) {
    if (!isFieldConflict(field)) {
      setProperty(record, field.name, field.ours)
      continue
    }
    const res = getResolution(resolutions, field.name)
    if (res?.choice === "theirs") {
      setProperty(record, field.name, field.theirs)
    } else if (res?.choice === "custom") {
      setProperty(record, field.name, res.customValue ?? "")
    } else {
      setProperty(record, field.name, field.ours)
    }
  }
  return record
}

export function resolveAll(
  fields: MergeField[],
  choice: "ours" | "theirs",
  existing: MergeResolutions = {}
): MergeResolutions {
  const result: MergeResolutions = {}
  for (const [key, value] of Object.entries(existing)) {
    setProperty(result, key, value)
  }
  for (const field of fields) {
    if (isFieldConflict(field)) {
      setProperty(result, field.name, { choice })
    }
  }
  return result
}

export function getConflictAnnouncement(unresolvedCount: number): string {
  if (unresolvedCount === 0) return "All conflicts resolved"
  if (unresolvedCount === 1) return "1 unresolved conflict remaining"
  return `${unresolvedCount} unresolved conflicts remaining`
}
