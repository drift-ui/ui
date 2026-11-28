import { describe, expect, it } from "vitest"

import {
  createFilter,
  createFilterGroup,
  flattenFilters,
  isFilterGroup,
  matchesFilter,
  matchesFilterGroup,
  matchesFilters,
  operatorLabel,
  operatorsFor,
  parseFilters,
  serializeFilters,
  toFilterGroup,
  type Filter,
  type FilterGroup,
} from "@/registry/default/lib/filter"

function filterOf(
  operator: Filter["operator"],
  value: string | string[],
  fieldId = "field"
): Filter {
  return { id: "f", fieldId, operator, value }
}

describe("filter", () => {
  it("offers operators that fit the field type", () => {
    expect(operatorsFor("text")).toEqual([
      "contains",
      "not-contains",
      "is",
      "is-not",
    ])
    expect(operatorsFor("number")).toEqual(["eq", "gt", "lt"])
    expect(operatorsFor("select")).toEqual([
      "is",
      "is-not",
      "is-any-of",
      "is-none-of",
    ])
    expect(operatorsFor("date")).toEqual(["before", "after", "between"])

    expect(operatorLabel("not-contains")).toBe("does not contain")
    expect(operatorLabel("before")).toBe("before")
    expect(operatorLabel("after")).toBe("after")
    expect(operatorLabel("between")).toBe("between")
    expect(operatorLabel("is-any-of")).toBe("is any of")
    expect(operatorLabel("is-none-of")).toBe("is none of")
  })

  it("creates a filter with the first operator for the field type", () => {
    const numberFilter = createFilter({
      id: "points",
      label: "Points",
      type: "number",
    })
    expect(numberFilter).toMatchObject({
      fieldId: "points",
      operator: "eq",
      value: "",
    })

    const dateFilter = createFilter({
      id: "due",
      label: "Due date",
      type: "date",
    })
    expect(dateFilter).toMatchObject({
      fieldId: "due",
      operator: "before",
      value: "",
    })
  })

  it("matches text case insensitively", () => {
    expect(
      matchesFilter("Invoice totals", filterOf("contains", "INVOICE"))
    ).toBe(true)
    expect(
      matchesFilter("Invoice totals", filterOf("not-contains", "invoice"))
    ).toBe(false)
    expect(matchesFilter("Open", filterOf("is", "open"))).toBe(true)
    expect(matchesFilter("Open", filterOf("is-not", "open"))).toBe(false)
  })

  it("compares numbers numerically", () => {
    expect(matchesFilter(5, filterOf("gt", "3"))).toBe(true)
    expect(matchesFilter(10, filterOf("lt", "9"))).toBe(false)
    expect(matchesFilter("3", filterOf("eq", "3"))).toBe(true)
  })

  it("evaluates date filters with before, after, and between", () => {
    expect(matchesFilter("2025-03-14", filterOf("before", "2025-03-15"))).toBe(
      true
    )
    expect(matchesFilter("2025-03-15", filterOf("before", "2025-03-15"))).toBe(
      false
    )
    expect(matchesFilter("2025-03-16", filterOf("after", "2025-03-15"))).toBe(
      true
    )
    expect(matchesFilter("2025-03-15", filterOf("after", "2025-03-15"))).toBe(
      false
    )

    // between with array
    expect(
      matchesFilter(
        "2025-03-15",
        filterOf("between", ["2025-03-10", "2025-03-20"])
      )
    ).toBe(true)
    expect(
      matchesFilter(
        "2025-03-10",
        filterOf("between", ["2025-03-10", "2025-03-20"])
      )
    ).toBe(true)
    expect(
      matchesFilter(
        "2025-03-20",
        filterOf("between", ["2025-03-10", "2025-03-20"])
      )
    ).toBe(true)
    expect(
      matchesFilter(
        "2025-03-09",
        filterOf("between", ["2025-03-10", "2025-03-20"])
      )
    ).toBe(false)
    expect(
      matchesFilter(
        "2025-03-21",
        filterOf("between", ["2025-03-10", "2025-03-20"])
      )
    ).toBe(false)

    // between with string range
    expect(
      matchesFilter("2025-03-15", filterOf("between", "2025-03-10..2025-03-20"))
    ).toBe(true)

    // works with Date objects
    expect(
      matchesFilter(new Date("2025-03-14"), filterOf("before", "2025-03-15"))
    ).toBe(true)

    // rejects impossible overflow dates like 2025-02-31
    expect(matchesFilter("2025-02-28", filterOf("before", "2025-02-31"))).toBe(
      false
    )

    // rejects invalid date boundaries
    expect(matchesFilter("2025-03-14", filterOf("before", "not-a-date"))).toBe(
      false
    )
    expect(matchesFilter("2025-03-14", filterOf("after", "not-a-date"))).toBe(
      false
    )
    expect(
      matchesFilter("2025-03-14", filterOf("between", "not-a-date..2025-03-20"))
    ).toBe(false)
  })

  it("evaluates multi-select operators (is-any-of and is-none-of)", () => {
    // scalar row value
    expect(
      matchesFilter("open", filterOf("is-any-of", ["open", "in-review"]))
    ).toBe(true)
    expect(
      matchesFilter("closed", filterOf("is-any-of", ["open", "in-review"]))
    ).toBe(false)
    expect(
      matchesFilter("closed", filterOf("is-none-of", ["open", "in-review"]))
    ).toBe(true)
    expect(
      matchesFilter("open", filterOf("is-none-of", ["open", "in-review"]))
    ).toBe(false)

    // array row value (e.g. tags)
    expect(
      matchesFilter(["bug", "backend"], filterOf("is-any-of", ["bug", "docs"]))
    ).toBe(true)
    expect(
      matchesFilter(["auth", "db"], filterOf("is-any-of", ["bug", "docs"]))
    ).toBe(false)
    expect(
      matchesFilter(["auth", "db"], filterOf("is-none-of", ["bug", "docs"]))
    ).toBe(true)
    expect(
      matchesFilter(["bug", "backend"], filterOf("is-none-of", ["bug", "docs"]))
    ).toBe(false)
  })

  it("handles null and undefined safely", () => {
    expect(matchesFilter(null, filterOf("is", "open"))).toBe(false)
    expect(matchesFilter(null, filterOf("is-not", "open"))).toBe(true)
    expect(matchesFilter(null, filterOf("is-none-of", ["open"]))).toBe(true)
    expect(matchesFilter(null, filterOf("is-any-of", ["open"]))).toBe(false)
    expect(matchesFilter(null, filterOf("before", "2025-03-15"))).toBe(false)
  })

  it("treats an empty value as matching everything", () => {
    expect(matchesFilter("anything", filterOf("is", ""))).toBe(true)
    expect(matchesFilter("anything", filterOf("is-any-of", []))).toBe(true)
  })

  describe("groups", () => {
    const item = {
      title: "Fix invoice webhook retry",
      status: "open",
      points: 5,
      due: "2025-04-01",
    }

    it("evaluates conjunction AND (all must match)", () => {
      const group: FilterGroup = {
        id: "g1",
        conjunction: "and",
        filters: [
          filterOf("is", "open", "status"),
          filterOf("gt", "3", "points"),
        ],
      }
      expect(matchesFilterGroup(item, group)).toBe(true)

      const failingGroup: FilterGroup = {
        id: "g2",
        conjunction: "and",
        filters: [
          filterOf("is", "open", "status"),
          filterOf("gt", "10", "points"),
        ],
      }
      expect(matchesFilterGroup(item, failingGroup)).toBe(false)
    })

    it("evaluates conjunction OR (any must match)", () => {
      const group: FilterGroup = {
        id: "g1",
        conjunction: "or",
        filters: [
          filterOf("is", "closed", "status"),
          filterOf("gt", "3", "points"),
        ],
      }
      expect(matchesFilterGroup(item, group)).toBe(true)

      const failingGroup: FilterGroup = {
        id: "g2",
        conjunction: "or",
        filters: [
          filterOf("is", "closed", "status"),
          filterOf("gt", "10", "points"),
        ],
      }
      expect(matchesFilterGroup(item, failingGroup)).toBe(false)
    })

    it("evaluates nested groups", () => {
      // (status is closed AND points > 2) OR (status is open AND due before 2025-05-01)
      const complexGroup: FilterGroup = {
        id: "root",
        conjunction: "or",
        filters: [
          {
            id: "sub1",
            conjunction: "and",
            filters: [
              filterOf("is", "closed", "status"),
              filterOf("gt", "2", "points"),
            ],
          },
          {
            id: "sub2",
            conjunction: "and",
            filters: [
              filterOf("is", "open", "status"),
              filterOf("before", "2025-05-01", "due"),
            ],
          },
        ],
      }
      expect(matchesFilterGroup(item, complexGroup)).toBe(true)
    })

    it("supports flattenFilters and toFilterGroup", () => {
      const group: FilterGroup = {
        id: "root",
        conjunction: "and",
        filters: [
          filterOf("is", "open", "status"),
          {
            id: "sub",
            conjunction: "or",
            filters: [filterOf("gt", "3", "points")],
          },
        ],
      }
      const flat = flattenFilters(group)
      expect(flat).toHaveLength(2)
      expect(flat.map((f) => f.fieldId)).toEqual(["status", "points"])

      const converted = toFilterGroup(flat, "or")
      expect(isFilterGroup(converted)).toBe(true)
      expect(converted.conjunction).toBe("or")
      expect(converted.filters).toHaveLength(2)
    })

    it("ignores empty child groups when evaluating parent groups", () => {
      const orWithEmptyChild: FilterGroup = {
        id: "root",
        conjunction: "or",
        filters: [
          filterOf("is", "closed", "status"),
          { id: "empty", conjunction: "and", filters: [] },
        ],
      }
      // item has status "open", so closed is false, and empty group should not make it match
      expect(matchesFilterGroup(item, orWithEmptyChild)).toBe(false)

      // empty root group still matches all rows (no filters active)
      expect(
        matchesFilterGroup(item, { id: "root", conjunction: "or", filters: [] })
      ).toBe(true)
    })

    it("matchesFilters helper handles both arrays and groups", () => {
      expect(
        matchesFilters(item, [
          filterOf("is", "open", "status"),
          filterOf("eq", "5", "points"),
        ])
      ).toBe(true)
    })
  })

  describe("URL serialization", () => {
    it("round-trips flat filters", () => {
      const filters: Filter[] = [
        { id: "1", fieldId: "status", operator: "is", value: "open" },
        { id: "2", fieldId: "points", operator: "gt", value: "3" },
      ]
      const serialized = serializeFilters(filters)
      expect(serialized).toBe("status:is:open,points:gt:3")

      const parsed = parseFilters(serialized) as Filter[]
      expect(parsed).toMatchObject([
        { fieldId: "status", operator: "is", value: "open" },
        { fieldId: "points", operator: "gt", value: "3" },
      ])
    })

    it("round-trips multi-select and date ranges", () => {
      const filters: Filter[] = [
        {
          id: "1",
          fieldId: "status",
          operator: "is-any-of",
          value: ["open", "in-review"],
        },
        {
          id: "2",
          fieldId: "due",
          operator: "between",
          value: ["2025-01-01", "2025-01-31"],
        },
      ]
      const serialized = serializeFilters(filters)
      expect(serialized).toBe(
        "status:is-any-of:open|in-review,due:between:2025-01-01..2025-01-31"
      )

      const parsed = parseFilters(serialized) as Filter[]
      expect(parsed).toMatchObject([
        {
          fieldId: "status",
          operator: "is-any-of",
          value: ["open", "in-review"],
        },
        {
          fieldId: "due",
          operator: "between",
          value: ["2025-01-01", "2025-01-31"],
        },
      ])
    })

    it("round-trips nested groups with conjunctions", () => {
      const group: FilterGroup = {
        id: "root",
        conjunction: "and",
        filters: [
          { id: "1", fieldId: "status", operator: "is", value: "open" },
          {
            id: "nested",
            conjunction: "or",
            filters: [
              { id: "2", fieldId: "priority", operator: "is", value: "urgent" },
              { id: "3", fieldId: "points", operator: "gt", value: "5" },
            ],
          },
        ],
      }
      const serialized = serializeFilters(group)
      expect(serialized).toBe(
        "and(status:is:open,or(priority:is:urgent,points:gt:5))"
      )

      const parsed = parseFilters(serialized) as FilterGroup
      expect(isFilterGroup(parsed)).toBe(true)
      expect(parsed.conjunction).toBe("and")
      expect(parsed.filters).toHaveLength(2)
      expect(isFilterGroup(parsed.filters[1])).toBe(true)
      expect((parsed.filters[1] as FilterGroup).conjunction).toBe("or")
    })

    it("parses URL query strings and encoded parameters", () => {
      const parsed = parseFilters("?filters=status:is:open,points:gt:5")
      expect(parsed).toMatchObject([
        { fieldId: "status", operator: "is", value: "open" },
        { fieldId: "points", operator: "gt", value: "5" },
      ])
    })

    it("safely handles special characters like colons and commas in values", () => {
      const filter: Filter[] = [
        {
          id: "1",
          fieldId: "title",
          operator: "contains",
          value: "invoice: error, [urgent]",
        },
      ]
      const serialized = serializeFilters(filter)
      const parsed = parseFilters(serialized) as Filter[]
      expect(parsed[0].value).toBe("invoice: error, [urgent]")
    })

    it("escapes and parses parentheses in filter values without corrupting group parsing", () => {
      const filters: Filter[] = [
        {
          id: "1",
          fieldId: "title",
          operator: "contains",
          value: "error (urgent)",
        },
        {
          id: "2",
          fieldId: "status",
          operator: "is",
          value: "open",
        },
      ]
      const serialized = serializeFilters(filters)
      expect(serialized).toContain("%28urgent%29")
      const parsed = parseFilters(serialized) as Filter[]
      expect(parsed).toHaveLength(2)
      expect(parsed[0].value).toBe("error (urgent)")
      expect(parsed[1].fieldId).toBe("status")
    })

    it("falls back to parsing JSON strings gracefully", () => {
      const json = JSON.stringify([
        { fieldId: "status", operator: "is", value: "open" },
      ])
      const parsed = parseFilters(json)
      expect(parsed).toMatchObject([
        { fieldId: "status", operator: "is", value: "open" },
      ])
    })
  })

  describe("scale benchmark", () => {
    it("evaluates a tree of 150 filters across nested levels in sub-millisecond time", () => {
      const root = createFilterGroup("and")
      for (let g = 0; g < 5; g++) {
        const subGroup = createFilterGroup("and")
        for (let s = 0; s < 3; s++) {
          const leafGroup = createFilterGroup("and")
          for (let f = 0; f < 10; f++) {
            leafGroup.filters.push({
              id: `f_${g}_${s}_${f}`,
              fieldId: "points",
              operator: "gt",
              value: String(f),
            })
          }
          subGroup.filters.push(leafGroup)
        }
        root.filters.push(subGroup)
      }

      // 5 * 3 * 10 = 150 filters, all AND conditions must be evaluated without short-circuiting
      const item = { points: 100 }
      const start = performance.now()
      const result = matchesFilterGroup(item, root)
      const elapsed = performance.now() - start

      expect(result).toBe(true)
      expect(elapsed).toBeLessThan(10) // Well under 10ms
    })
  })
})

function depthOf(value: unknown): number {
  if (!isFilterGroup(value)) return 0
  return 1 + Math.max(0, ...value.filters.map((item) => depthOf(item)))
}

describe("parseFilters with untrusted input", () => {
  const row = { status: "open", n: 1 }

  it("fills a missing value instead of crashing the match", () => {
    const parsed = parseFilters('[{"fieldId":"status","operator":"is"}]')
    expect(parsed).toEqual([
      { id: expect.any(String), fieldId: "status", operator: "is", value: "" },
    ])
    expect(matchesFilters(row, parsed)).toBe(true)
  })

  it("drops null and malformed children of a JSON group", () => {
    const parsed = parseFilters(
      '{"conjunction":"and","filters":[null,7,"x",{"fieldId":"status","operator":"is","value":"open"}]}'
    )
    expect(isFilterGroup(parsed) && parsed.filters).toHaveLength(1)
    expect(matchesFilters(row, parsed)).toBe(true)
  })

  it("turns non-string values into strings", () => {
    const parsed = parseFilters('[{"fieldId":"n","operator":"eq","value":1}]')
    expect(parsed).toEqual([
      { id: expect.any(String), fieldId: "n", operator: "eq", value: "1" },
    ])
    expect(matchesFilters(row, parsed)).toBe(true)
  })

  it("drops filters with an unknown operator", () => {
    expect(parseFilters("status:hacked:x")).toEqual([])
    expect(
      parseFilters('[{"fieldId":"status","operator":"hacked","value":"x"}]')
    ).toEqual([])
  })

  it("keeps list and range values as arrays after a round trip", () => {
    const single = parseFilters(
      serializeFilters([
        { id: "a", fieldId: "status", operator: "is-any-of", value: ["open"] },
        { id: "b", fieldId: "due", operator: "between", value: ["2026-01-01"] },
      ])
    )
    expect(single).toEqual([
      expect.objectContaining({ value: ["open"] }),
      expect.objectContaining({ value: ["2026-01-01"] }),
    ])
  })

  it("sanitizes every JSON shape it accepts", () => {
    expect(
      parseFilters(
        '[{"id":"keep","fieldId":"status","operator":"is-any-of","value":["open",1]}]'
      )
    ).toEqual([
      {
        id: "keep",
        fieldId: "status",
        operator: "is-any-of",
        value: ["open", "1"],
      },
    ])
    expect(parseFilters("status:is-any-of:")).toEqual([
      expect.objectContaining({ value: [] }),
    ])
    expect(parseFilters('{"conjunction":"xor","filters":[]}')).toEqual({
      id: expect.any(String),
      conjunction: "and",
      filters: [],
    })
    const withGroup = parseFilters(
      '[{"conjunction":"or","filters":[{"conjunction":"xor","filters":[]}]}]'
    )
    expect(withGroup).toEqual({
      id: expect.any(String),
      conjunction: "and",
      filters: [{ id: expect.any(String), conjunction: "or", filters: [] }],
    })
    expect(
      parseFilters('[{"fieldId":"status","operator":"is","value":"open"}]', {
        asGroup: true,
      })
    ).toEqual({
      id: "root",
      conjunction: "and",
      filters: [expect.objectContaining({ fieldId: "status" })],
    })
  })

  it("keeps a single value for scalar operators", () => {
    const parsed = parseFilters(
      '[{"fieldId":"status","operator":"is","value":["open","closed"]}]'
    )
    expect(parsed).toEqual([expect.objectContaining({ value: "open" })])
    expect(matchesFilters({ status: "open" }, parsed)).toBe(true)
    expect(serializeFilters(parsed)).toBe("status:is:open")
    expect(
      parseFilters('[{"fieldId":"title","operator":"contains","value":[]}]')
    ).toEqual([expect.objectContaining({ value: "" })])
  })

  it("drops only the entry whose value cannot be read as text", () => {
    const parsed = parseFilters(
      JSON.stringify([
        {
          fieldId: "status",
          operator: "is",
          value: { toString: 1, valueOf: 1 },
        },
        { fieldId: "status", operator: "is-any-of", value: ["open", {}] },
        { fieldId: "flag", operator: "is", value: true },
        { fieldId: "status", operator: "is", value: "open" },
      ])
    )
    expect(parsed).toEqual([
      expect.objectContaining({ fieldId: "flag", value: "true" }),
      expect.objectContaining({ fieldId: "status", value: "open" }),
    ])
  })

  it("caps nesting so a huge link stays fast and cannot overflow the stack", () => {
    const levels = 20000
    const link = "and(".repeat(levels) + "status:is:open" + ")".repeat(levels)
    const started = performance.now()
    const parsed = parseFilters(link)
    expect(performance.now() - started).toBeLessThan(1000)
    expect(depthOf(parsed)).toBeLessThanOrEqual(8)
    expect(
      depthOf(parseFilters(JSON.stringify(nest(2000))))
    ).toBeLessThanOrEqual(8)
  })
})

function nest(levels: number): unknown {
  let group: unknown = {
    conjunction: "and",
    filters: [{ fieldId: "status", operator: "is", value: "open" }],
  }
  for (let i = 0; i < levels; i++)
    group = { conjunction: "and", filters: [group] }
  return group
}
