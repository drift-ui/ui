import { describe, expect, it } from "vitest"

import {
  findDuplicateKeys,
  parseEnv,
  pasteRows,
  type KeyValueRow,
} from "@/registry/default/lib/key-value-editor-utils"

function row(key: string, value = ""): KeyValueRow {
  return { id: key || "empty", key, value }
}

describe("parseEnv", () => {
  it("reads KEY=value lines and skips comments and blank lines", () => {
    expect(
      parseEnv("# database\nDB_HOST=localhost\n\n  DB_PORT = 5432  \n")
    ).toEqual([
      { key: "DB_HOST", value: "localhost" },
      { key: "DB_PORT", value: "5432" },
    ])
  })

  it("drops an export prefix and keeps = inside the value", () => {
    expect(parseEnv("export TOKEN=a=b==")).toEqual([
      { key: "TOKEN", value: "a=b==" },
    ])
  })

  it("unwraps quoted values and keeps # inside them", () => {
    expect(
      parseEnv(`GREETING="hello # world" # note\nNAME='Ada'\nURL=x # note`)
    ).toEqual([
      { key: "GREETING", value: "hello # world" },
      { key: "NAME", value: "Ada" },
      { key: "URL", value: "x" },
    ])
  })

  it("reads escaped quotes inside double quotes and keeps single quotes literal", () => {
    expect(
      parseEnv(
        String.raw`TOKEN="a\"b\\c" # note` + "\n" + String.raw`RAW='a\"b'`
      )
    ).toEqual([
      { key: "TOKEN", value: 'a"b\\c' },
      { key: "RAW", value: 'a\\"b' },
    ])
  })

  it("keeps a backslash that does not escape a quote or backslash", () => {
    expect(parseEnv(String.raw`PATH="C:\tools\bin"`)).toEqual([
      { key: "PATH", value: String.raw`C:\tools\bin` },
    ])
  })

  it("treats an unclosed quote as part of the value", () => {
    expect(parseEnv('NAME="Ada')).toEqual([{ key: "NAME", value: '"Ada' }])
  })

  it("skips lines without a key or an equals sign, and handles CRLF", () => {
    expect(parseEnv("=value\nJUST_TEXT\r\nEMPTY=\r\n")).toEqual([
      { key: "EMPTY", value: "" },
    ])
  })
})

describe("pasteRows", () => {
  it("replaces an empty row with the pasted rows", () => {
    const rows = [row("A", "1"), row("")]

    const next = pasteRows(rows, 1, "B=2\nC=3")

    expect(next?.map(({ key, value }) => [key, value])).toEqual([
      ["A", "1"],
      ["B", "2"],
      ["C", "3"],
    ])
  })

  it("inserts after a row that already has content", () => {
    const next = pasteRows([row("A", "1"), row("Z")], 0, "B=2")

    expect(next?.map((entry) => entry.key)).toEqual(["A", "B", "Z"])
  })

  it("leaves plain text to the input", () => {
    expect(pasteRows([row("")], 0, "API_URL")).toBeNull()
    expect(pasteRows([row("")], 0, "# only = a comment")).toBeNull()
  })
})

describe("findDuplicateKeys", () => {
  it("flags keys used more than once, ignoring surrounding spaces", () => {
    expect(
      findDuplicateKeys([row("A"), row(" A "), row("B"), row(""), row("")])
    ).toEqual(new Set(["A"]))
  })
})
