export interface RegexFlagInfo {
  flag: string
  label: string
  description: string
}

export const REGEX_FLAGS: Record<string, RegexFlagInfo> = {
  i: {
    flag: "i",
    label: "Case insensitive",
    description: "Case-insensitive matching",
  },
  m: {
    flag: "m",
    label: "Multiline",
    description: "^ and $ match start and end of each line",
  },
  s: {
    flag: "s",
    label: "Dot all",
    description: ". matches newlines as well",
  },
  u: {
    flag: "u",
    label: "Unicode",
    description: "Treat pattern as a sequence of Unicode code points",
  },
  g: {
    flag: "g",
    label: "Global",
    description: "Find all matches rather than stopping after first",
  },
}

export const DEFAULT_AVAILABLE_FLAGS = ["i", "m", "s"] as const

export interface RegexCaptureGroup {
  number: number
  name?: string
  value: string
  start: number
  end: number
}

export interface RegexMatch {
  match: string
  index: number
  length: number
  groups: RegexCaptureGroup[]
}

export interface RegexValidationResult {
  isValid: boolean
  error: string | null
  regex: RegExp | null
}

export interface RegexMatchOptions {
  maxMatches?: number
  maxSampleLength?: number
  maxIterations?: number
  timeoutMs?: number
}

export interface RegexMatchResult {
  matches: RegexMatch[]
  matchCount: number
  truncated: boolean
  executionTimeMs: number
  error: string | null
}

export interface RegexSegment {
  text: string
  isMatch: boolean
  matchIndex?: number
}

/**
 * Normalizes flags by removing duplicate or invalid characters and sorting alphabetically.
 */
export function normalizeFlags(flags: string): string {
  if (!flags) return ""
  const valid = new Set(["d", "g", "i", "m", "s", "u", "v", "y"])
  const unique = new Set<string>()
  for (const char of flags) {
    if (valid.has(char)) {
      unique.add(char)
    }
  }
  return Array.from(unique).sort().join("")
}

/**
 * Toggles a flag in the current flags string.
 * Rejects invalid flag characters.
 */
export function toggleFlag(currentFlags: string, flag: string): string {
  if (!/^[dgimsuyv]$/.test(flag)) {
    return normalizeFlags(currentFlags)
  }
  const norm = normalizeFlags(currentFlags)
  const set = new Set(norm)
  if (set.has(flag)) {
    set.delete(flag)
  } else {
    set.add(flag)
  }
  return Array.from(set).sort().join("")
}

/**
 * Validates a regular expression pattern and flags.
 */
export function validateRegex(
  pattern: string,
  flags: string = ""
): RegexValidationResult {
  if (!pattern) {
    return { isValid: true, error: null, regex: null }
  }

  try {
    const cleanFlags = normalizeFlags(flags)
    const regex = new RegExp(pattern, cleanFlags)
    return { isValid: true, error: null, regex }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Invalid regular expression syntax"
    return { isValid: false, error: message, regex: null }
  }
}

type RegExpExecWithIndices = RegExpExecArray & {
  indices?: Array<[number, number] | undefined> & {
    groups?: Record<string, [number, number] | undefined>
  }
}

/**
 * Finds all matches and capture groups safely within sample text.
 * Enforces execution limits (sample length cap, match cap, iteration cap, zero-length loop guard).
 */
export function findRegexMatches(
  pattern: string,
  flags: string,
  sample: string,
  options?: RegexMatchOptions
): RegexMatchResult {
  const maxMatches = options?.maxMatches ?? 100
  const maxSampleLength = options?.maxSampleLength ?? 20000
  const maxIterations = options?.maxIterations ?? 5000
  const timeoutMs = options?.timeoutMs ?? 150

  if (!pattern || !sample || maxMatches <= 0) {
    return {
      matches: [],
      matchCount: 0,
      truncated: false,
      executionTimeMs: 0,
      error: null,
    }
  }

  const effectiveSample =
    sample.length > maxSampleLength ? sample.slice(0, maxSampleLength) : sample
  const truncatedByLength = sample.length > maxSampleLength

  // Compile regex with global flag to iterate matches and 'd' flag for accurate capture indices
  const baseFlags = normalizeFlags(flags)
  const flagSet = new Set(baseFlags.split(""))
  flagSet.add("g")
  flagSet.add("d")
  const searchFlagsWithIndices = Array.from(flagSet).join("")

  let regex: RegExp
  try {
    regex = new RegExp(pattern, searchFlagsWithIndices)
  } catch {
    // Fallback if 'd' flag is not supported
    try {
      regex = new RegExp(
        pattern,
        baseFlags.includes("g") ? baseFlags : baseFlags + "g"
      )
    } catch (err) {
      return {
        matches: [],
        matchCount: 0,
        truncated: false,
        executionTimeMs: 0,
        error:
          err instanceof Error ? err.message : "Invalid regular expression",
      }
    }
  }

  const startTime =
    typeof performance !== "undefined" ? performance.now() : Date.now()
  const matches: RegexMatch[] = []
  let iterations = 0
  let truncated = truncatedByLength

  let execResult: RegExpExecArray | null

  while ((execResult = regex.exec(effectiveSample)) !== null) {
    iterations++

    const matchText = execResult[0]
    const matchIndex = execResult.index

    // Extract capture groups using indices when available
    const groups: RegexCaptureGroup[] = []
    const execWithIndices = execResult as RegExpExecWithIndices
    const indices = execWithIndices.indices
    const namedIndices = indices?.groups
    const namedGroups = execResult.groups ?? {}

    // In RegExpExecArray, index 0 is full match, 1..n are capture groups
    for (let i = 1; i < execResult.length; i++) {
      const val = execResult[i]
      if (val !== undefined) {
        const range = indices?.[i]
        let start = range ? range[0] : -1
        let end = range ? range[1] : -1

        let groupName: string | undefined
        if (namedIndices) {
          for (const [name, gRange] of Object.entries(namedIndices)) {
            if (
              gRange &&
              gRange[0] === start &&
              gRange[1] === end &&
              !groups.some((g) => g.name === name)
            ) {
              groupName = name
              break
            }
          }
        } else {
          for (const [name, gVal] of Object.entries(namedGroups)) {
            if (gVal === val && !groups.some((g) => g.name === name)) {
              groupName = name
              break
            }
          }
        }

        if (start === -1) {
          const groupStart = matchText.indexOf(val)
          start = groupStart >= 0 ? matchIndex + groupStart : matchIndex
          end = start + val.length
        }

        groups.push({
          number: i,
          name: groupName,
          value: val,
          start,
          end,
        })
      }
    }

    matches.push({
      match: matchText,
      index: matchIndex,
      length: matchText.length,
      groups,
    })

    if (matches.length >= maxMatches) {
      if (matches.length < effectiveSample.length) {
        truncated = true
      }
      break
    }

    // Guard against zero-length matches (e.g. ^, a*, (?=...)) creating infinite loops
    // Advance with Unicode code-point semantics when u or v flag is present
    if (matchText.length === 0) {
      const isUnicode = baseFlags.includes("u") || baseFlags.includes("v")
      const codePoint = effectiveSample.codePointAt(matchIndex) ?? 0
      const step = isUnicode && codePoint > 0xffff ? 2 : 1
      regex.lastIndex = matchIndex + step
      if (regex.lastIndex > effectiveSample.length) {
        break
      }
    }

    const elapsed =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) -
      startTime
    if (iterations >= maxIterations || elapsed >= timeoutMs) {
      truncated = true
      break
    }
  }

  const executionTimeMs =
    (typeof performance !== "undefined" ? performance.now() : Date.now()) -
    startTime

  return {
    matches,
    matchCount: matches.length,
    truncated,
    executionTimeMs: Math.round(executionTimeMs * 10) / 10,
    error: null,
  }
}

/**
 * Splits sample text into match and non-match segments for highlighting.
 */
export function highlightSampleText(
  sample: string,
  matches: RegexMatch[]
): RegexSegment[] {
  if (!sample) return []
  if (!matches || matches.length === 0) {
    return [{ text: sample, isMatch: false }]
  }

  const segments: RegexSegment[] = []
  let currentIndex = 0

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    if (m.index > currentIndex) {
      segments.push({
        text: sample.slice(currentIndex, m.index),
        isMatch: false,
      })
    }

    if (m.length > 0) {
      segments.push({
        text: sample.slice(m.index, m.index + m.length),
        isMatch: true,
        matchIndex: i + 1,
      })
    }

    currentIndex = Math.max(currentIndex, m.index + m.length)
  }

  if (currentIndex < sample.length) {
    segments.push({
      text: sample.slice(currentIndex),
      isMatch: false,
    })
  }

  return segments
}
