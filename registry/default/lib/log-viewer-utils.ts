export type LogLevel = "info" | "warn" | "error" | "debug" | "trace" | string

export type LogLine = {
  id: string | number
  timestamp?: string | Date | number
  level?: LogLevel
  message: string
  lineNumber?: number
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

export function map256ToAnsiColor(code: number): AnsiColor {
  if (code >= 0 && code <= 7) {
    return ANSI_FG_MAP[30 + code] ?? "white"
  }
  if (code >= 8 && code <= 15) {
    return ANSI_BRIGHT_FG_MAP[90 + (code - 8)] ?? "bright-white"
  }
  if (code >= 16 && code <= 231) {
    const n = code - 16
    const r = Math.floor(n / 36)
    const g = Math.floor((n % 36) / 6)
    const b = n % 6

    if (r === g && g === b) {
      if (r < 2) return "bright-black"
      if (r < 4) return "white"
      return "bright-white"
    }

    if (r > g && r > b) {
      if (g >= 3) return r >= 4 ? "bright-yellow" : "yellow"
      if (b >= 3) return r >= 4 ? "bright-magenta" : "magenta"
      return r >= 3 ? "bright-red" : "red"
    }
    if (g > r && g > b) {
      if (b >= 3) return g >= 4 ? "bright-cyan" : "cyan"
      if (r >= 3) return g >= 4 ? "bright-yellow" : "yellow"
      return g >= 3 ? "bright-green" : "green"
    }
    if (b > r && b > g) {
      if (r >= 3) return b >= 4 ? "bright-magenta" : "magenta"
      if (g >= 3) return b >= 4 ? "bright-cyan" : "cyan"
      return b >= 3 ? "bright-blue" : "blue"
    }
    if (r === g && r > b) return r >= 3 ? "bright-yellow" : "yellow"
    if (g === b && g > r) return g >= 3 ? "bright-cyan" : "cyan"
    if (r === b && r > g) return r >= 3 ? "bright-magenta" : "magenta"
    return "white"
  }
  if (code >= 232 && code <= 255) {
    if (code < 238) return "bright-black"
    if (code < 248) return "white"
    return "bright-white"
  }
  return "white"
}

export function parseAnsi(rawText: string): AnsiSegment[] {
  if (!rawText) return []

  // 1. Strip OSC sequences, non-SGR CSI sequences (including private modes like ?25l), and standard 2-char escapes
  const text = rawText
    .replace(/\x1b\].*?(?:\x07|\x1b\\)/g, "")
    .replace(/\x1b\[[0-9;?><=]*[ -/]*[@A-Z[\\\]^_`a-ln-z{|}~]/g, "")
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
      if (Number.isNaN(code)) {
        continue
      }
      if (code === 0) {
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
      } else if (code === 38 || code === 48) {
        const isFg = code === 38
        if (params[i + 1] === 5 && params[i + 2] !== undefined) {
          const mapped = map256ToAnsiColor(params[i + 2])
          if (isFg) currentStyle.color = mapped
          else currentStyle.backgroundColor = mapped
          i += 2
        } else if (params[i + 1] === 2) {
          let r: number | undefined
          let g: number | undefined
          let b: number | undefined
          let consumed = 4

          if (Number.isNaN(params[i + 2])) {
            // Colon-form with empty color-space: 38:2::r:g:b
            r = params[i + 3]
            g = params[i + 4]
            b = params[i + 5]
            consumed = 5
          } else if (
            params[i + 5] !== undefined &&
            !Number.isNaN(params[i + 2]) &&
            !Number.isNaN(params[i + 3]) &&
            !Number.isNaN(params[i + 4]) &&
            !Number.isNaN(params[i + 5])
          ) {
            // Colon-form with color-space ID: 38:2:cs:r:g:b
            r = params[i + 3]
            g = params[i + 4]
            b = params[i + 5]
            consumed = 5
          } else {
            // Semicolon-form: 38;2;r;g;b or 38:2:r:g:b
            r = params[i + 2]
            g = params[i + 3]
            b = params[i + 4]
            consumed = 4
          }

          if (
            r !== undefined &&
            g !== undefined &&
            b !== undefined &&
            !Number.isNaN(r) &&
            !Number.isNaN(g) &&
            !Number.isNaN(b)
          ) {
            const rStep = Math.min(5, Math.max(0, Math.floor(r / 51)))
            const gStep = Math.min(5, Math.max(0, Math.floor(g / 51)))
            const bStep = Math.min(5, Math.max(0, Math.floor(b / 51)))
            const mapped = map256ToAnsiColor(
              16 + 36 * rStep + 6 * gStep + bStep
            )
            if (isFg) currentStyle.color = mapped
            else currentStyle.backgroundColor = mapped
          }
          i += consumed
        }
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

export function stripAnsi(text: string): string {
  if (!text) return ""
  return parseAnsi(text)
    .map((segment) => segment.text)
    .join("")
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
      const plainMessage = stripAnsi(line.message).toLowerCase()
      const levelText = (line.level ?? "").toLowerCase()
      const timeText = line.timestamp
        ? formatTimestamp(line.timestamp).toLowerCase()
        : ""
      if (
        !plainMessage.includes(searchLower) &&
        !levelText.includes(searchLower) &&
        !timeText.includes(searchLower)
      ) {
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
