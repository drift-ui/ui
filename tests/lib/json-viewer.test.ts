import { describe, expect, it } from "vitest"

import {
  CHUNK_SIZE,
  childEntries,
  childPath,
  expandedToDepth,
  filterByPath,
  formatValue,
  isPathAncestor,
  matchPath,
  parsePath,
  rootEntries,
  searchJson,
  truncateString,
} from "@/registry/default/lib/json-viewer-utils"

const DATA = {
  id: "evt_1",
  user: { name: "Ana", "first name": "Ana", tags: ["admin", "ops"] },
  empty: {},
  count: 3,
}

describe("childPath", () => {
  it("joins identifiers with dots, indexes with brackets and quotes other keys", () => {
    expect(childPath("", "user")).toBe("user")
    expect(childPath("user", "name")).toBe("user.name")
    expect(childPath("user.tags", 0)).toBe("user.tags[0]")
    expect(childPath("user", "first name")).toBe('user["first name"]')
  })
})

describe("childEntries", () => {
  it("lists object keys and marks only non-empty containers as branches", () => {
    expect(
      rootEntries(DATA).map((entry) => [entry.id, entry.isBranch])
    ).toEqual([
      ["id", false],
      ["user", true],
      ["empty", false],
      ["count", false],
    ])
  })

  it("splits large arrays into groups and expands a group into its items", () => {
    const items = Array.from(
      { length: CHUNK_SIZE * 2 + 5 },
      (_, index) => index
    )
    const groups = childEntries(items, "items")

    expect(groups.map((group) => group.range)).toEqual([
      [0, 99],
      [100, 199],
      [200, 204],
    ])
    const lastGroup = childEntries(items, "items", groups[2].range)
    expect(lastGroup.map((entry) => entry.path)).toEqual([
      "items[200]",
      "items[201]",
      "items[202]",
      "items[203]",
      "items[204]",
    ])
  })

  it("keeps arrays at the chunk size flat", () => {
    const items = Array.from({ length: CHUNK_SIZE }, (_, index) => index)
    expect(childEntries(items, "")).toHaveLength(CHUNK_SIZE)
  })

  it("wraps a primitive root in a single leaf", () => {
    expect(rootEntries(42)).toEqual([
      { id: "$", path: "", key: null, value: 42, isBranch: false },
    ])
  })
})

describe("expandedToDepth", () => {
  it("opens branches down to the given level", () => {
    expect(expandedToDepth(DATA, 0)).toEqual([])
    expect(expandedToDepth(DATA, 1)).toEqual(["user"])
    expect(expandedToDepth(DATA, 2)).toEqual(["user", "user.tags"])
  })
})

describe("searchJson", () => {
  it("matches keys and primitive values and returns their ancestors", () => {
    const { matches, ancestors } = searchJson(DATA, "OPS")
    expect([...matches]).toEqual(["user.tags[1]"])
    expect([...ancestors]).toEqual(["user", "user.tags"])
  })

  it("opens the group holding a match in a large array", () => {
    const data = {
      items: Array.from({ length: 150 }, (_, index) => `item ${index}`),
    }
    const { ancestors } = searchJson(data, "item 120")
    expect([...ancestors]).toEqual(["items", "items#100"])
  })

  it("ignores array indexes and blank queries", () => {
    expect(searchJson(DATA, "0").matches.size).toBe(0)
    expect(searchJson(DATA, "  ").matches.size).toBe(0)
  })
})

describe("formatValue", () => {
  it("copies strings raw and everything else as JSON", () => {
    expect(formatValue("Ana")).toBe("Ana")
    expect(formatValue(null)).toBe("null")
    expect(formatValue(["a"])).toBe('[\n  "a"\n]')
  })
})

describe("parsePath", () => {
  it("parses dot notation, array indexes, bracket notation and wildcards", () => {
    expect(parsePath("users[*].email")).toEqual(["users", "*", "email"])
    expect(parsePath("user.tags[0]")).toEqual(["user", "tags", "0"])
    expect(parsePath('user["first name"]')).toEqual(["user", "first name"])
    expect(parsePath('user["foo\\"bar"]')).toEqual(["user", 'foo"bar'])
    expect(parsePath("user['it\\'s']")).toEqual(["user", "it's"])
    expect(parsePath(`user['say "hi"']`)).toEqual(["user", 'say "hi"'])
    expect(parsePath("user['a\\\\b']")).toEqual(["user", "a\\b"])
    expect(parsePath("$schema")).toEqual(["$schema"])
    expect(parsePath("$.items[200]")).toEqual(["items", "200"])
    expect(parsePath("")).toEqual([])
    expect(parsePath("$")).toEqual([])
    expect(parsePath(".")).toEqual([])
  })
})

describe("matchPath and isPathAncestor", () => {
  it("matches literal paths and wildcard patterns", () => {
    expect(matchPath("users[0].email", "users[*].email")).toBe(true)
    expect(matchPath("users[1].email", "users[*].email")).toBe(true)
    expect(matchPath("users[0].name", "users[*].email")).toBe(false)
    expect(matchPath("user.name", "user.name")).toBe(true)
    expect(matchPath("user.name", "user.age")).toBe(false)
    expect(matchPath("users[0].email", "users[*]")).toBe(true)
    expect(matchPath("user.name", ".")).toBe(false)
    expect(matchPath("user.name", "")).toBe(false)
  })

  it("checks if a parent path is an ancestor of a path pattern", () => {
    expect(isPathAncestor("users", "users[*].email")).toBe(true)
    expect(isPathAncestor("users[0]", "users[*].email")).toBe(true)
    expect(isPathAncestor("users[0].email", "users[*].email")).toBe(false)
    expect(isPathAncestor("meta", "users[*].email")).toBe(false)
  })
})

describe("filterByPath", () => {
  it("filters object and array data to only paths matching the pattern", () => {
    const payload = {
      users: [
        { id: 1, email: "ana@example.com", name: "Ana" },
        { id: 2, email: "bob@example.com", name: "Bob" },
      ],
      meta: { total: 2, version: "v1" },
    }

    expect(filterByPath(payload, "users[*].email")).toEqual({
      users: [{ email: "ana@example.com" }, { email: "bob@example.com" }],
    })

    expect(filterByPath(payload, "users[0].name")).toEqual({
      users: [{ name: "Ana" }],
    })

    expect(filterByPath(payload, "meta.version")).toEqual({
      meta: { version: "v1" },
    })

    expect(filterByPath(payload, "nonexistent")).toEqual({})
    expect(filterByPath(payload, "")).toBe(payload)
  })

  it("preserves original array indices without renumbering rows", () => {
    const arrayData = {
      users: [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob", email: "bob@example.com" },
      ],
    }
    const filtered = filterByPath(arrayData, "users[*].email") as {
      users: unknown[]
    }
    expect(0 in filtered.users).toBe(false)
    expect(1 in filtered.users).toBe(true)
    expect(filtered.users[1]).toEqual({ email: "bob@example.com" })
  })

  it("safely handles own __proto__ property in wildcard filtering", () => {
    const protoData = JSON.parse('{"__proto__": "custom", "valid": 123}')
    const filteredProto = filterByPath(protoData, "*") as Record<
      string,
      unknown
    >
    expect(
      Object.prototype.hasOwnProperty.call(filteredProto, "__proto__")
    ).toBe(true)
    expect(filteredProto.valid).toBe(123)
  })
})

describe("childEntries with sparse arrays", () => {
  it("emits only chunks containing populated indices", () => {
    const sparseArray: unknown[] = []
    sparseArray[500] = { name: "Special" }
    const chunks = childEntries(sparseArray, "items")
    expect(chunks).toHaveLength(1)
    expect(chunks[0].range).toEqual([500, 500])
  })
})

describe("truncateString", () => {
  it("leaves short single-line strings intact", () => {
    expect(truncateString("hello world", 80)).toEqual({
      isLong: false,
      preview: "hello world",
    })
  })

  it("truncates strings over the max length", () => {
    const long = "A".repeat(120)
    expect(truncateString(long, 80)).toEqual({
      isLong: true,
      preview: "A".repeat(80),
    })
  })

  it("truncates multi-line strings to their first line", () => {
    expect(truncateString("First line\nSecond line", 80)).toEqual({
      isLong: true,
      preview: "First line",
    })
  })
})

describe("searchJson path queries", () => {
  it("matches paths using path patterns like users[*].email", () => {
    const payload = {
      users: [
        { id: 1, email: "ana@example.com" },
        { id: 2, email: "bob@example.com" },
      ],
    }
    const { matches, ancestors } = searchJson(payload, "users[*].email")
    expect([...matches]).toEqual(["users[0].email", "users[1].email"])
    expect([...ancestors]).toEqual(["users", "users[0]", "users[1]"])
  })

  it("does not match all paths when query is punctuation like '.'", () => {
    const { matches } = searchJson(DATA, ".")
    expect(matches.size).toBe(0)
  })
})

describe("scale limit benchmark", () => {
  it("operates correctly on a large payload (10,000+ items)", () => {
    const records = Array.from({ length: 10000 }, (_, i) => ({
      id: `rec_${i}`,
      user: { email: `user${i}@example.com` },
    }))
    const largeData = { items: records }

    const roots = rootEntries(largeData)
    expect(roots).toHaveLength(1)

    const res = searchJson(largeData, "user9999@example.com")
    expect(res.matches.size).toBe(1)
    expect(res.ancestors.size).toBeGreaterThan(0)
  })
})
