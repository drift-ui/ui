export const CHUNK_SIZE = 100
export const DEFAULT_MAX_STRING_LENGTH = 80

export type JsonEntry = {
  id: string
  path: string
  key: string | number | null
  value: unknown
  isBranch: boolean
  range?: [number, number]
}

const IDENTIFIER_PATTERN = /^[A-Za-z_$][\w$]*$/

export function isContainer(value: unknown): value is object {
  return typeof value === "object" && value !== null
}

export function sizeOf(value: object) {
  return Array.isArray(value) ? value.length : Object.keys(value).length
}

export function childPath(parent: string, key: string | number) {
  if (typeof key === "number") return `${parent}[${key}]`
  if (!IDENTIFIER_PATTERN.test(key)) return `${parent}[${JSON.stringify(key)}]`
  return parent ? `${parent}.${key}` : key
}

function toEntry(parent: string, key: string | number, value: unknown) {
  const path = childPath(parent, key)
  return {
    id: path,
    path,
    key,
    value,
    isBranch: isContainer(value) && sizeOf(value) > 0,
  }
}

export function childEntries(
  value: unknown,
  path: string,
  range?: [number, number]
): JsonEntry[] {
  if (!isContainer(value)) return []
  if (!Array.isArray(value)) {
    return Object.entries(value).map(([key, child]) =>
      toEntry(path, key, child)
    )
  }

  const [start, end] = range ?? [0, value.length - 1]
  if (range || value.length <= CHUNK_SIZE) {
    return value
      .slice(start, end + 1)
      .map((child, offset) => toEntry(path, start + offset, child))
  }

  return Array.from(
    { length: Math.ceil(value.length / CHUNK_SIZE) },
    (_, chunk) => {
      const chunkStart = chunk * CHUNK_SIZE
      return {
        id: `${path}#${chunkStart}`,
        path,
        key: null,
        value,
        isBranch: true,
        range: [
          chunkStart,
          Math.min(chunkStart + CHUNK_SIZE, value.length) - 1,
        ] as [number, number],
      }
    }
  )
}

export function rootEntries(data: unknown): JsonEntry[] {
  if (isContainer(data)) return childEntries(data, "")
  return [{ id: "$", path: "", key: null, value: data, isBranch: false }]
}

export function expandedToDepth(data: unknown, depth: number) {
  const ids: string[] = []

  function walk(entries: JsonEntry[], level: number) {
    if (level > depth) return
    for (const entry of entries) {
      if (!entry.isBranch || entry.range) continue
      ids.push(entry.id)
      walk(childEntries(entry.value, entry.path), level + 1)
    }
  }

  walk(rootEntries(data), 1)
  return ids
}

export function parsePath(path: string): string[] {
  const trimmed = path.trim().replace(/^\$\.?/, "")
  if (!trimmed) return []

  const tokens: string[] = []
  let current = ""
  let inBracket = false
  let inQuote = false
  let quoteChar = ""

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i]
    if (inQuote) {
      if (char === quoteChar && trimmed[i - 1] !== "\\") {
        inQuote = false
      } else {
        current += char
      }
    } else if (char === '"' || char === "'") {
      inQuote = true
      quoteChar = char
    } else if (char === "[") {
      if (current) {
        tokens.push(current)
        current = ""
      }
      inBracket = true
    } else if (char === "]") {
      if (current) {
        tokens.push(current)
        current = ""
      }
      inBracket = false
    } else if (char === ".") {
      if (!inBracket) {
        if (current) {
          tokens.push(current)
          current = ""
        }
      } else {
        current += char
      }
    } else {
      current += char
    }
  }
  if (current) {
    tokens.push(current)
  }
  return tokens
}

export function matchPath(
  path: string,
  pattern: string,
  options?: { exact?: boolean }
): boolean {
  const pathTokens = parsePath(path)
  const patternTokens = parsePath(pattern)
  if (patternTokens.length === 0) return true
  if (pathTokens.length === 0) return false

  if (options?.exact) {
    if (pathTokens.length !== patternTokens.length) return false
    return pathTokens.every(
      (token, i) => patternTokens[i] === "*" || patternTokens[i] === token
    )
  }

  if (pathTokens.length === patternTokens.length) {
    return pathTokens.every(
      (token, i) => patternTokens[i] === "*" || patternTokens[i] === token
    )
  }

  if (pathTokens.length > patternTokens.length) {
    return patternTokens.every(
      (token, i) => token === "*" || token === pathTokens[i]
    )
  }

  return false
}

export function isPathAncestor(parentPath: string, pattern: string): boolean {
  const parentTokens = parsePath(parentPath)
  const patternTokens = parsePath(pattern)
  if (parentTokens.length === 0) return true
  if (parentTokens.length >= patternTokens.length) return false
  return parentTokens.every(
    (token, i) => patternTokens[i] === "*" || token === patternTokens[i]
  )
}

export function filterByPath(data: unknown, pattern: string): unknown {
  const tokens = parsePath(pattern)
  if (tokens.length === 0) return data

  function extract(current: unknown, index: number): unknown {
    if (index >= tokens.length) {
      return current
    }
    if (!isContainer(current)) {
      return undefined
    }

    const token = tokens[index]
    if (Array.isArray(current)) {
      if (token === "*") {
        const mapped = current
          .map((item) => extract(item, index + 1))
          .filter((item) => item !== undefined)
        return mapped.length > 0 ? mapped : undefined
      }
      const num = Number(token)
      if (Number.isInteger(num) && num >= 0 && num < current.length) {
        const item = extract(current[num], index + 1)
        if (item !== undefined) {
          const res = []
          res[num] = item
          return res
        }
      }
      return undefined
    }

    if (token === "*") {
      const result: Record<string, unknown> = {}
      let hasKeys = false
      for (const [k, v] of Object.entries(current)) {
        const val = extract(v, index + 1)
        if (val !== undefined) {
          result[k] = val
          hasKeys = true
        }
      }
      return hasKeys ? result : undefined
    }

    if (Object.prototype.hasOwnProperty.call(current, token)) {
      const val = extract(
        (current as Record<string, unknown>)[token],
        index + 1
      )
      if (val !== undefined) {
        return { [token]: val }
      }
    }

    return undefined
  }

  const res = extract(data, 0)
  return res !== undefined ? res : {}
}

export function truncateString(
  text: string,
  maxLength = DEFAULT_MAX_STRING_LENGTH
): { isLong: boolean; preview: string } {
  const hasNewline = text.includes("\n")
  const isTooLong = text.length > maxLength
  if (!hasNewline && !isTooLong) {
    return { isLong: false, preview: text }
  }
  const firstLine = text.split(/\r?\n/)[0]
  const sliceLength = Math.min(maxLength, firstLine.length)
  const preview = firstLine.slice(0, sliceLength)
  return { isLong: true, preview }
}

export function searchJson(data: unknown, query: string) {
  const matches = new Set<string>()
  const ancestors = new Set<string>()
  const needle = query.trim().toLowerCase()
  if (!needle) return { matches, ancestors }

  const isPathQuery =
    needle.includes(".") || needle.includes("[") || needle.includes("*")

  function walk(entries: JsonEntry[], parents: string[]) {
    for (const entry of entries) {
      const keyHit =
        typeof entry.key === "string" &&
        entry.key.toLowerCase().includes(needle)
      const valueHit =
        !isContainer(entry.value) &&
        String(entry.value).toLowerCase().includes(needle)
      const pathHit =
        isPathQuery &&
        matchPath(entry.path.toLowerCase(), needle, { exact: true })

      if (keyHit || valueHit || pathHit) {
        matches.add(entry.id)
        for (const parent of parents) ancestors.add(parent)
      }

      if (isPathQuery && isPathAncestor(entry.path.toLowerCase(), needle)) {
        ancestors.add(entry.id)
      }

      if (entry.isBranch) {
        walk(childEntries(entry.value, entry.path, entry.range), [
          ...parents,
          entry.id,
        ])
      }
    }
  }

  walk(rootEntries(data), [])
  return { matches, ancestors }
}

export function formatValue(value: unknown) {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2)
}
