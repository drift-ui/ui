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
    const entries: JsonEntry[] = []
    for (let i = start; i <= end; i++) {
      if (i in value) {
        entries.push(toEntry(path, i, value[i]))
      }
    }
    return entries
  }

  const chunks: JsonEntry[] = []
  const numChunks = Math.ceil(value.length / CHUNK_SIZE)
  for (let chunk = 0; chunk < numChunks; chunk++) {
    const chunkStart = chunk * CHUNK_SIZE
    const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, value.length) - 1
    let hasElements = false
    for (let i = chunkStart; i <= chunkEnd; i++) {
      if (i in value) {
        hasElements = true
        break
      }
    }
    if (hasElements) {
      chunks.push({
        id: `${path}#${chunkStart}`,
        path,
        key: null,
        value,
        isBranch: true,
        range: [chunkStart, chunkEnd],
      })
    }
  }
  return chunks
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
  const trimmed = path.trim().replace(/^\$(?=\.|\[|$)\.?/, "")
  if (!trimmed) return []

  const tokens: string[] = []
  let i = 0

  while (i < trimmed.length) {
    const char = trimmed[i]

    if (char === ".") {
      i++
      continue
    }

    if (char === "[") {
      i++
      if (trimmed[i] === '"' || trimmed[i] === "'") {
        const quote = trimmed[i]
        let bracketContent = quote
        let escaped = false
        i++
        while (i < trimmed.length) {
          const c = trimmed[i]
          bracketContent += c
          i++
          if (!escaped && c === "\\") {
            escaped = true
          } else if (escaped) {
            escaped = false
          } else if (c === quote) {
            break
          }
        }
        while (i < trimmed.length && trimmed[i] !== "]") {
          i++
        }
        if (i < trimmed.length && trimmed[i] === "]") {
          i++
        }
        try {
          const jsonStr =
            quote === "'"
              ? `"${bracketContent
                  .slice(1, -1)
                  .replace(/\\(.)|"/g, (match, escaped?: string) =>
                    escaped === undefined
                      ? '\\"'
                      : escaped === "'"
                        ? "'"
                        : match
                  )}"`
              : bracketContent
          tokens.push(JSON.parse(jsonStr))
        } catch {
          tokens.push(bracketContent.slice(1, -1))
        }
      } else {
        let bracketContent = ""
        while (i < trimmed.length && trimmed[i] !== "]") {
          bracketContent += trimmed[i]
          i++
        }
        if (i < trimmed.length && trimmed[i] === "]") {
          i++
        }
        const token = bracketContent.trim()
        if (token) {
          tokens.push(token)
        }
      }
    } else {
      let ident = ""
      while (i < trimmed.length && trimmed[i] !== "." && trimmed[i] !== "[") {
        ident += trimmed[i]
        i++
      }
      if (ident) {
        tokens.push(ident)
      }
    }
  }

  return tokens
}

export function matchPath(
  path: string,
  pattern: string,
  options?: { exact?: boolean }
): boolean {
  const patternTokens = parsePath(pattern)
  if (patternTokens.length === 0) return false
  const pathTokens = parsePath(path)
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
        const result: unknown[] = []
        let hasElements = false
        for (let i = 0; i < current.length; i++) {
          if (i in current) {
            const item = extract(current[i], index + 1)
            if (item !== undefined) {
              result[i] = item
              hasElements = true
            }
          }
        }
        return hasElements ? result : undefined
      }
      const num = Number(token)
      if (Number.isInteger(num) && num >= 0 && num < current.length) {
        const item = extract(current[num], index + 1)
        if (item !== undefined) {
          const res: unknown[] = []
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
          Object.defineProperty(result, k, {
            value: val,
            enumerable: true,
            writable: true,
            configurable: true,
          })
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
        const result: Record<string, unknown> = {}
        Object.defineProperty(result, token, {
          value: val,
          enumerable: true,
          writable: true,
          configurable: true,
        })
        return result
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

  const parsedPattern = parsePath(needle)
  const isPathQuery =
    parsedPattern.length > 0 &&
    (needle.includes(".") || needle.includes("[") || needle.includes("*"))

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
