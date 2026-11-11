import { describe, expect, it } from "vitest"

import {
  filterLogs,
  formatTimestamp,
  getLogLevels,
  parseAnsi,
  stripAnsi,
  type LogLine,
} from "@/registry/default/lib/log-viewer-utils"

describe("parseAnsi", () => {
  it("handles plain text without ANSI codes", () => {
    expect(parseAnsi("Simple log line")).toEqual([
      { text: "Simple log line", style: {} },
    ])
  })

  it("returns empty array for empty string", () => {
    expect(parseAnsi("")).toEqual([])
  })

  it("parses standard foreground colors", () => {
    const input = "\x1b[31mError\x1b[0m: \x1b[32mSuccess\x1b[0m"
    expect(parseAnsi(input)).toEqual([
      { text: "Error", style: { color: "red" } },
      { text: ": ", style: {} },
      { text: "Success", style: { color: "green" } },
    ])
  })

  it("parses bright foreground and background colors", () => {
    const input = "\x1b[94m\x1b[101mHighlighted\x1b[0m"
    expect(parseAnsi(input)).toEqual([
      {
        text: "Highlighted",
        style: { color: "bright-blue", backgroundColor: "bright-red" },
      },
    ])
  })

  it("parses text modifiers and compound sequences", () => {
    const input = "\x1b[1;4;33mImportant Warning\x1b[0m"
    expect(parseAnsi(input)).toEqual([
      {
        text: "Important Warning",
        style: { bold: true, underline: true, color: "yellow" },
      },
    ])
  })

  it("handles partial resets and specific modifier clears", () => {
    const input = "\x1b[1;31mBold Red\x1b[22m Just Red\x1b[39m Just Text"
    expect(parseAnsi(input)).toEqual([
      { text: "Bold Red", style: { bold: true, color: "red" } },
      { text: " Just Red", style: { color: "red" } },
      { text: " Just Text", style: {} },
    ])
  })

  it("parses 256-color standard, bright, and extended palette sequences", () => {
    const input =
      "\x1b[38;5;2mGreen\x1b[0m \x1b[48;5;9mRedBg\x1b[0m \x1b[38;5;196mColor196\x1b[0m"
    const parsed = parseAnsi(input)
    expect(parsed[0]).toEqual({ text: "Green", style: { color: "green" } })
    expect(parsed[2]).toEqual({
      text: "RedBg",
      style: { backgroundColor: "bright-red" },
    })
    expect(parsed[4].text).toBe("Color196")
    expect(parsed[4].style.color).toBe("bright-red")
  })

  it("atomically consumes 24-bit RGB codes without corrupting styles", () => {
    const input = "\x1b[38;2;255;0;0mRedRGB\x1b[0m"
    const parsed = parseAnsi(input)
    expect(parsed).toEqual([{ text: "RedRGB", style: { color: "bright-red" } }])

    const colonEmptyCs = "\x1b[38:2::255:0:0mColonRed\x1b[0m"
    expect(parseAnsi(colonEmptyCs)).toEqual([
      { text: "ColonRed", style: { color: "bright-red" } },
    ])

    const colonWithCs = "\x1b[38:2:1:255:0:0mCsRed\x1b[0m"
    expect(parseAnsi(colonWithCs)).toEqual([
      { text: "CsRed", style: { color: "bright-red" } },
    ])
  })

  it("strips non-SGR sequences like OSC titles, cursor controls, and private CSI modes", () => {
    const input =
      "\x1b]0;Build Title\x07\x1b[2K\x1b[?25l\x1b[32m✔ Built in 200ms\x1b[0m"
    expect(parseAnsi(input)).toEqual([
      { text: "✔ Built in 200ms", style: { color: "green" } },
    ])
  })
})

describe("stripAnsi", () => {
  it("removes all ANSI escape codes leaving plain text", () => {
    const input =
      "\x1b[1;31mError:\x1b[0m Connection to \x1b[4;34mserver\x1b[0m failed"
    expect(stripAnsi(input)).toBe("Error: Connection to server failed")
  })
})

describe("filterLogs", () => {
  const sampleLines: LogLine[] = [
    { id: 1, level: "info", message: "Server started on port 3000" },
    { id: 2, level: "warn", message: "High memory usage detected" },
    {
      id: 3,
      level: "error",
      message: "\x1b[31mDatabase connection\x1b[0m failed",
    },
    { id: 4, level: "info", message: "Health check passed" },
  ]

  it("returns all lines when no filter options provided", () => {
    expect(filterLogs(sampleLines)).toEqual(sampleLines)
    expect(filterLogs(sampleLines, { level: "all" })).toEqual(sampleLines)
  })

  it("filters by log level case-insensitively", () => {
    const filtered = filterLogs(sampleLines, { level: "ERROR" })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe(3)
  })

  it("filters by search query case-insensitively across stripped ANSI text", () => {
    const filtered = filterLogs(sampleLines, { search: "DATABASE CONNECTION" })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe(3)
  })

  it("combines level and search query", () => {
    const filtered = filterLogs(sampleLines, { level: "info", search: "port" })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe(1)

    const noMatches = filterLogs(sampleLines, {
      level: "error",
      search: "port",
    })
    expect(noMatches).toHaveLength(0)
  })
})

describe("getLogLevels", () => {
  it("extracts unique lowercase levels in sorted order", () => {
    const lines: LogLine[] = [
      { id: 1, level: "Info", message: "a" },
      { id: 2, level: "WARN", message: "b" },
      { id: 3, level: "info", message: "c" },
      { id: 4, message: "no level" },
      { id: 5, level: "error", message: "e" },
    ]
    expect(getLogLevels(lines)).toEqual(["error", "info", "warn"])
  })
})

describe("formatTimestamp", () => {
  it("formats Date object to HH:mm:ss", () => {
    const date = new Date(2026, 10, 7, 14, 5, 9)
    expect(formatTimestamp(date)).toBe("14:05:09")
  })

  it("returns empty string when timestamp is null or undefined", () => {
    expect(formatTimestamp(undefined)).toBe("")
  })

  it("formats parseable ISO string or returns raw string if invalid", () => {
    const validIso = "2026-11-07T14:05:09.000Z"
    const expected = formatTimestamp(new Date(validIso))
    expect(formatTimestamp(validIso)).toBe(expected)
    expect(formatTimestamp("invalid date")).toBe("invalid date")
  })
})
