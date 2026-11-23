import { describe, expect, it } from "vitest"

import {
  buildCurlCommand,
  DEFAULT_SENSITIVE_HEADERS,
  formatDuration,
  getStatusBadgeClass,
  getStatusText,
  isSensitiveHeader,
  normalizeHeaders,
  parseBody,
  parseQueryParams,
  quoteShell,
} from "@/registry/default/lib/request-inspector-utils"

describe("quoteShell", () => {
  it("wraps strings in single quotes", () => {
    expect(quoteShell("https://api.example.com")).toBe(
      "'https://api.example.com'"
    )
  })

  it("escapes embedded single quotes with '\\''", () => {
    expect(quoteShell("user's name")).toBe("'user'\\''s name'")
    expect(quoteShell("O'Connor")).toBe("'O'\\''Connor'")
    expect(quoteShell("'''")).toBe("''\\'''\\'''\\'''")
  })

  it("handles empty strings", () => {
    expect(quoteShell("")).toBe("''")
  })

  it("preserves spaces, double quotes, and newlines safely", () => {
    expect(quoteShell('hello "world" \n $foo')).toBe(
      "'hello \"world\" \n $foo'"
    )
  })
})

describe("buildCurlCommand", () => {
  it("builds a simple GET request", () => {
    const cmd = buildCurlCommand({
      method: "GET",
      url: "https://api.example.com/items",
    })
    expect(cmd).toBe("curl 'https://api.example.com/items'")
  })

  it("includes -X when method is not GET", () => {
    const cmd = buildCurlCommand({
      method: "DELETE",
      url: "https://api.example.com/items/1",
    })
    expect(cmd).toContain("-X DELETE")
    expect(cmd).toContain("curl 'https://api.example.com/items/1'")
  })

  it("includes headers with proper escaping", () => {
    const cmd = buildCurlCommand({
      method: "GET",
      url: "https://api.example.com/profile",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer token'123",
      },
    })
    expect(cmd).toContain("-H 'Accept: application/json'")
    expect(cmd).toContain("-H 'Authorization: Bearer token'\\''123'")
  })

  it("includes JSON body and formats multi-line command with backslashes", () => {
    const cmd = buildCurlCommand({
      method: "POST",
      url: "https://api.example.com/users",
      headers: {
        "Content-Type": "application/json",
      },
      body: { name: "Alice", active: true },
    })

    expect(cmd.startsWith("curl 'https://api.example.com/users' \\\n")).toBe(
      true
    )
    expect(cmd).toContain("-X POST")
    expect(cmd).toContain("-H 'Content-Type: application/json'")
    expect(cmd).toContain(
      `--data-raw '{\n  "name": "Alice",\n  "active": true\n}'`
    )
  })

  it("includes raw text body with shell quotes", () => {
    const cmd = buildCurlCommand({
      method: "POST",
      url: "https://api.example.com/raw",
      body: "raw string with 'single quotes' and $variables",
    })
    expect(cmd).toContain(
      "--data-raw 'raw string with '\\''single quotes'\\'' and $variables'"
    )
  })

  it("includes -X GET if GET request has a body", () => {
    const cmd = buildCurlCommand({
      method: "GET",
      url: "https://api.example.com/search",
      body: { query: "test" },
    })
    expect(cmd).toContain("-X GET")
    expect(cmd).toContain("--data-raw")
  })
})

describe("isSensitiveHeader", () => {
  it("identifies default sensitive headers case-insensitively", () => {
    for (const h of DEFAULT_SENSITIVE_HEADERS) {
      expect(isSensitiveHeader(h)).toBe(true)
      expect(isSensitiveHeader(h.toUpperCase())).toBe(true)
      expect(isSensitiveHeader(` ${h} `)).toBe(false)
    }
    expect(isSensitiveHeader("Authorization")).toBe(true)
    expect(isSensitiveHeader("Cookie")).toBe(true)
    expect(isSensitiveHeader("Set-Cookie")).toBe(true)
    expect(isSensitiveHeader("X-Api-Key")).toBe(true)
  })

  it("returns false for non-sensitive headers", () => {
    expect(isSensitiveHeader("Content-Type")).toBe(false)
    expect(isSensitiveHeader("Accept")).toBe(false)
    expect(isSensitiveHeader("User-Agent")).toBe(false)
  })

  it("respects custom sensitive headers", () => {
    expect(isSensitiveHeader("X-Custom-Secret", ["x-custom-secret"])).toBe(true)
    expect(isSensitiveHeader("Authorization", ["x-custom-secret"])).toBe(false)
  })
})

describe("normalizeHeaders", () => {
  it("handles undefined or empty headers", () => {
    expect(normalizeHeaders()).toEqual([])
    expect(normalizeHeaders({})).toEqual([])
  })

  it("preserves array of tuples", () => {
    const input: [string, string][] = [
      ["Content-Type", "application/json"],
      ["Accept", "text/plain"],
    ]
    expect(normalizeHeaders(input)).toEqual(input)
  })

  it("transforms record and ignores undefined values", () => {
    const res = normalizeHeaders({
      Host: "example.com",
      "X-Skip": undefined,
      "X-Num": "123",
    })
    expect(res).toEqual([
      ["Host", "example.com"],
      ["X-Num", "123"],
    ])
  })

  it("flattens array header values", () => {
    const res = normalizeHeaders({
      Accept: ["application/json", "text/plain"],
    })
    expect(res).toEqual([
      ["Accept", "application/json"],
      ["Accept", "text/plain"],
    ])
  })
})

describe("parseQueryParams", () => {
  it("extracts query parameters from full URL", () => {
    const params = parseQueryParams(
      "https://api.example.com/v1/search?q=drift&page=2&sort=desc"
    )
    expect(params).toEqual([
      ["q", "drift"],
      ["page", "2"],
      ["sort", "desc"],
    ])
  })

  it("extracts query parameters from relative path", () => {
    const params = parseQueryParams("/v1/search?filter=active")
    expect(params).toEqual([["filter", "active"]])
  })

  it("returns empty array when no query string is present", () => {
    expect(parseQueryParams("https://api.example.com/v1/items")).toEqual([])
    expect(parseQueryParams("")).toEqual([])
  })
})

describe("parseBody", () => {
  it("handles undefined and null", () => {
    expect(parseBody(undefined)).toEqual({ isJson: false, text: "" })
    expect(parseBody(null)).toEqual({ isJson: false, text: "" })
  })

  it("handles object and array inputs as JSON", () => {
    const obj = { id: 1, name: "item" }
    const res = parseBody(obj)
    expect(res.isJson).toBe(true)
    expect(res.jsonValue).toEqual(obj)
    expect(res.text).toBe(JSON.stringify(obj, null, 2))
  })

  it("detects valid JSON strings", () => {
    const raw = '{"success": true, "code": 200}'
    const res = parseBody(raw)
    expect(res.isJson).toBe(true)
    expect(res.jsonValue).toEqual({ success: true, code: 200 })
    expect(res.text).toBe(raw)
  })

  it("treats non-JSON or invalid JSON strings as text", () => {
    const text = "Hello world"
    expect(parseBody(text)).toEqual({ isJson: false, text: "Hello world" })

    const badJson = '{"broken": json'
    expect(parseBody(badJson)).toEqual({
      isJson: false,
      text: '{"broken": json',
    })
  })

  it("stringifies primitives", () => {
    expect(parseBody(42)).toEqual({ isJson: false, text: "42" })
    expect(parseBody(true)).toEqual({ isJson: false, text: "true" })
  })
})

describe("formatDuration", () => {
  it("returns — for undefined, null, or negative values", () => {
    expect(formatDuration(undefined)).toBe("—")
    expect(formatDuration(null as unknown as number)).toBe("—")
    expect(formatDuration(-10)).toBe("—")
  })

  it("formats sub-millisecond durations", () => {
    expect(formatDuration(0.5)).toBe("< 1 ms")
    expect(formatDuration(0)).toBe("0 ms")
  })

  it("formats millisecond durations", () => {
    expect(formatDuration(182)).toBe("182 ms")
    expect(formatDuration(45.6)).toBe("45.6 ms")
  })

  it("formats second durations", () => {
    expect(formatDuration(1200)).toBe("1.2 s")
    expect(formatDuration(3500)).toBe("3.5 s")
  })
})

describe("getStatusBadgeClass & getStatusText", () => {
  it("maps 1xx, 2xx, 3xx, 4xx, 5xx to proper classes and labels", () => {
    const info = getStatusBadgeClass(101)
    expect(info.label).toBe("Informational")
    expect(info.className).toContain("bg-muted")

    const success = getStatusBadgeClass(200)
    expect(success.label).toBe("Success")
    expect(success.className).toContain("bg-chart-2/15")
    expect(success.className).toContain("text-chart-2")

    const redirect = getStatusBadgeClass(301)
    expect(redirect.label).toBe("Redirection")
    expect(redirect.className).toContain("bg-chart-4/15")
    expect(redirect.className).toContain("text-chart-4")

    const clientErr = getStatusBadgeClass(404)
    expect(clientErr.label).toBe("Client error")
    expect(clientErr.className).toContain("bg-chart-5/15")
    expect(clientErr.className).toContain("text-chart-5")

    const serverErr = getStatusBadgeClass(500)
    expect(serverErr.label).toBe("Server error")
    expect(serverErr.className).toContain("bg-destructive/15")
    expect(serverErr.className).toContain("text-destructive")

    const unknown = getStatusBadgeClass(999)
    expect(unknown.label).toBe("Unknown")
  })

  it("returns standard status texts", () => {
    expect(getStatusText(200)).toBe("OK")
    expect(getStatusText(201)).toBe("Created")
    expect(getStatusText(204)).toBe("No Content")
    expect(getStatusText(400)).toBe("Bad Request")
    expect(getStatusText(401)).toBe("Unauthorized")
    expect(getStatusText(404)).toBe("Not Found")
    expect(getStatusText(422)).toBe("Unprocessable Entity")
    expect(getStatusText(500)).toBe("Internal Server Error")
    expect(getStatusText(999)).toBe("Unknown")
  })
})
