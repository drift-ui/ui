import { describe, expect, it } from "vitest"

import {
  filterLogs,
  formatTimestamp,
  getLogLevels,
  parseAnsi,
  type LogLine,
} from "@/registry/default/lib/log-viewer"

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

  it("parses 256-color standard and bright palette sequences", () => {
    const input = "\x1b[38;5;2mGreen\x1b[0m \x1b[48;5;9mRedBg\x1b[0m"
    expect(parseAnsi(input)).toEqual([
      { text: "Green", style: { color: "green" } },
      { text: " ", style: {} },
      { text: "RedBg", style: { backgroundColor: "bright-red" } },
    ])
  })

  it("strips non-SGR sequences like OSC titles and cursor controls", () => {
    const input = "\x1b]0;Build Title\x07\x1b[2K\x1b[32m✔ Built in 200ms\x1b[0m"
    expect(parseAnsi(input)).toEqual([
      { text: "✔ Built in 200ms", style: { color: "green" } },
    ])
  })
})

describe("filterLogs", () => {
  const sampleLines: LogLine[] = [
    { id: 1, level: "info", message: "Server started on port 3000" },
    { id: 2, level: "warn", message: "High memory usage detected" },
    { id: 3, level: "error", message: "Database connection failed" },
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

  it("filters by search query case-insensitively", () => {
    const filtered = filterLogs(sampleLines, { search: "CONNECTION" })
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
    expect(formatTimestamp("invalid date")).toBe("invalid date")
  })
})
