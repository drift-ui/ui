export type LogLevel = "info" | "warn" | "error" | "debug" | "trace" | string

export type LogLine = {
  id: string | number
  timestamp?: string | Date | number
  level?: LogLevel
  message: string
}

export type AnsiColor =
  | "black"
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "magenta"
  | "cyan"
  | "white"
  | "bright-black"
  | "bright-red"
  | "bright-green"
  | "bright-yellow"
  | "bright-blue"
  | "bright-magenta"
  | "bright-cyan"
  | "bright-white"

export type AnsiStyle = {
  color?: AnsiColor
  backgroundColor?: AnsiColor
  bold?: boolean
  dim?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  inverse?: boolean
}

export type AnsiSegment = {
  text: string
  style: AnsiStyle
}

const ANSI_FG_MAP: Record<number, AnsiColor> = {
  30: "black",
  31: "red",
  32: "green",
  33: "yellow",
  34: "blue",
  35: "magenta",
  36: "cyan",
  37: "white",
}

const ANSI_BRIGHT_FG_MAP: Record<number, AnsiColor> = {
  90: "bright-black",
  91: "bright-red",
  92: "bright-green",
  93: "bright-yellow",
  94: "bright-blue",
  95: "bright-magenta",
  96: "bright-cyan",
  97: "bright-white",
}

const ANSI_BG_MAP: Record<number, AnsiColor> = {
  40: "black",
  41: "red",
  42: "green",
  43: "yellow",
  44: "blue",
  45: "magenta",
  46: "cyan",
  47: "white",
}

const ANSI_BRIGHT_BG_MAP: Record<number, AnsiColor> = {
  100: "bright-black",
  101: "bright-red",
  102: "bright-green",
  103: "bright-yellow",
  104: "bright-blue",
  105: "bright-magenta",
  106: "bright-cyan",
  107: "bright-white",
}

export function parseAnsi(rawText: string): AnsiSegment[] {
  if (!rawText) return []

  // 1. Strip OSC sequences, non-SGR CSI sequences, and standard 2-char escapes
  const text = rawText
    .replace(/\x1b\].*?(?:\x07|\x1b\\)/g, "")
    .replace(/\x1b\[[0-9;:]*[^0-9;:m]/gi, "")
    .replace(/\x1b[@-Z\\-_]/g, "")

  if (!text.includes("\x1b[")) {
    return [{ text: text.replace(/\x1b/g, ""), style: {} }]
  }

  const segments: AnsiSegment[] = []
  const sgrRegex = /\x1b\[([0-9;:]*)m/g
  let lastIndex = 0
  let currentStyle: AnsiStyle = {}
  let match: RegExpExecArray | null

  while ((match = sgrRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const chunk = text.slice(lastIndex, match.index)
      if (chunk.length > 0) {
        segments.push({ text: chunk, style: { ...currentStyle } })
      }
    }

    const paramStr = match[1]
    const params = paramStr
      ? paramStr.split(/[;:]/).map((n) => Number.parseInt(n, 10))
      : [0]

    for (let i = 0; i < params.length; i++) {
      const code = params[i]
      if (Number.isNaN(code) || code === 0) {
        currentStyle = {}
      } else if (code === 1) {
        currentStyle.bold = true
      } else if (code === 2) {
        currentStyle.dim = true
      } else if (code === 3) {
        currentStyle.italic = true
      } else if (code === 4) {
        currentStyle.underline = true
      } else if (code === 7) {
        currentStyle.inverse = true
      } else if (code === 9) {
        currentStyle.strikethrough = true
      } else if (code === 21 || code === 22) {
        delete currentStyle.bold
        delete currentStyle.dim
      } else if (code === 23) {
        delete currentStyle.italic
      } else if (code === 24) {
        delete currentStyle.underline
      } else if (code === 27) {
        delete currentStyle.inverse
      } else if (code === 29) {
        delete currentStyle.strikethrough
      } else if (code >= 30 && code <= 37) {
        currentStyle.color = ANSI_FG_MAP[code]
      } else if (code === 39) {
        delete currentStyle.color
      } else if (code >= 40 && code <= 47) {
        currentStyle.backgroundColor = ANSI_BG_MAP[code]
      } else if (code === 49) {
        delete currentStyle.backgroundColor
      } else if (code >= 90 && code <= 97) {
        currentStyle.color = ANSI_BRIGHT_FG_MAP[code]
      } else if (code >= 100 && code <= 107) {
        currentStyle.backgroundColor = ANSI_BRIGHT_BG_MAP[code]
      } else if (
        code === 38 &&
        params[i + 1] === 5 &&
        params[i + 2] !== undefined
      ) {
        const c = params[i + 2]
        if (c >= 0 && c <= 7) currentStyle.color = ANSI_FG_MAP[30 + c]
        else if (c >= 8 && c <= 15)
          currentStyle.color = ANSI_BRIGHT_FG_MAP[90 + (c - 8)]
        i += 2
      } else if (
        code === 48 &&
        params[i + 1] === 5 &&
        params[i + 2] !== undefined
      ) {
        const c = params[i + 2]
        if (c >= 0 && c <= 7) currentStyle.backgroundColor = ANSI_BG_MAP[40 + c]
        else if (c >= 8 && c <= 15)
          currentStyle.backgroundColor = ANSI_BRIGHT_BG_MAP[100 + (c - 8)]
        i += 2
      }
    }

    lastIndex = sgrRegex.lastIndex
  }

  if (lastIndex < text.length) {
    const chunk = text.slice(lastIndex)
    if (chunk.length > 0) {
      segments.push({ text: chunk, style: { ...currentStyle } })
    }
  }

  return segments
}

export function filterLogs(
  lines: readonly LogLine[],
  options: { search?: string; level?: string } = {}
): LogLine[] {
  const { search, level } = options
  const hasSearch = Boolean(search && search.trim())
  const searchLower = hasSearch ? search!.trim().toLowerCase() : ""
  const hasLevel = Boolean(level && level !== "all")
  const levelLower = hasLevel ? level!.toLowerCase() : ""

  if (!hasSearch && !hasLevel) {
    return lines.slice()
  }

  return lines.filter((line) => {
    if (hasLevel) {
      const lineLevel = (line.level ?? "").toLowerCase()
      if (lineLevel !== levelLower) {
        return false
      }
    }

    if (hasSearch) {
      const messageLower = line.message.toLowerCase()
      if (!messageLower.includes(searchLower)) {
        return false
      }
    }

    return true
  })
}

export function getLogLevels(lines: readonly LogLine[]): string[] {
  const levels = new Set<string>()
  for (const line of lines) {
    if (line.level) {
      levels.add(line.level.toLowerCase())
    }
  }
  return Array.from(levels).sort()
}

export function formatTimestamp(timestamp?: string | Date | number): string {
  if (timestamp === undefined || timestamp === null) return ""
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
  if (Number.isNaN(date.getTime())) return String(timestamp)

  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  return `${hours}:${minutes}:${seconds}`
}
