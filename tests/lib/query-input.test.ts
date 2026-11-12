import { describe, expect, it } from "vitest"

import type { FilterField } from "@/registry/default/lib/filter"
import {
  applyQuerySuggestion,
  formatQuery,
  parseQuery,
  suggestQuery,
  tokenizeQuery,
} from "@/registry/default/lib/query-input-utils"

const FIELDS: FilterField[] = [
  { id: "author", label: "Author", type: "text" },
  {
    id: "label",
    label: "Label",
    type: "select",
    options: [
      { value: "bug", label: "Bug" },
      { value: "docs", label: "Documentation" },
      { value: "needs review", label: "Needs review" },
    ],
  },
  { id: "age", label: "Age in days", type: "number" },
  { id: "created", label: "Created", type: "date" },
]

function filtersOf(query: string) {
  return parseQuery(query, FIELDS).filters.map(
    ({ fieldId, operator, value }) => ({ fieldId, operator, value })
  )
}

describe("query-input", () => {
  it("tokenizes on whitespace outside quotes", () => {
    expect(
      tokenizeQuery(' label:"needs review"  login "a \\" b"').map(
        (token) => token.text
      )
    ).toEqual(['label:"needs review"', "login", '"a \\" b"'])
    expect(tokenizeQuery('a:"open')).toEqual([
      { start: 0, end: 7, text: 'a:"open' },
    ])
  })

  it("maps the issue's example onto filter operators and leftover text", () => {
    expect(
      parseQuery("author:me -label:bug login page age:>7", FIELDS)
    ).toEqual({
      filters: [
        { id: "query-0", fieldId: "author", operator: "is", value: "me" },
        { id: "query-1", fieldId: "label", operator: "is-not", value: "bug" },
        { id: "query-2", fieldId: "age", operator: "gt", value: "7" },
      ],
      text: "login page",
    })
  })

  it("reads lists, quotes, wildcards, numbers and dates", () => {
    expect(filtersOf('label:bug,"needs review" -label:docs,bug')).toEqual([
      {
        fieldId: "label",
        operator: "is-any-of",
        value: ["bug", "needs review"],
      },
      { fieldId: "label", operator: "is-none-of", value: ["docs", "bug"] },
    ])
    expect(filtersOf('author:*ana* -author:*bot* AUTHOR:"a \\"b\\""')).toEqual([
      { fieldId: "author", operator: "contains", value: "ana" },
      { fieldId: "author", operator: "not-contains", value: "bot" },
      { fieldId: "author", operator: "is", value: 'a "b"' },
    ])
    expect(filtersOf("age:<3 age:5 age:=6")).toEqual([
      { fieldId: "age", operator: "lt", value: "3" },
      { fieldId: "age", operator: "eq", value: "5" },
      { fieldId: "age", operator: "eq", value: "6" },
    ])
    expect(
      filtersOf(
        "created:>2024-01-01 created:<2024-02-01 created:2024-03-01..2024-03-31 created:2024-04-01"
      )
    ).toEqual([
      { fieldId: "created", operator: "after", value: "2024-01-01" },
      { fieldId: "created", operator: "before", value: "2024-02-01" },
      {
        fieldId: "created",
        operator: "between",
        value: ["2024-03-01", "2024-03-31"],
      },
      {
        fieldId: "created",
        operator: "between",
        value: ["2024-04-01", "2024-04-01"],
      },
    ])
  })

  it("keeps unknown keys and unsupported negations as free text", () => {
    expect(parseQuery("is:open -age:>7 http://x", FIELDS)).toEqual({
      filters: [],
      text: "is:open -age:>7 http://x",
    })
  })

  it("turns a trailing colon into an empty filter while typing", () => {
    expect(filtersOf("author: -label: created:")).toEqual([
      { fieldId: "author", operator: "is", value: "" },
      { fieldId: "label", operator: "is-not", value: "" },
      { fieldId: "created", operator: "before", value: "" },
    ])
  })

  it("formats filters back into a query that parses to the same filters", () => {
    const query = formatQuery(
      [
        { id: "1", fieldId: "author", operator: "contains", value: "ana lee" },
        {
          id: "2",
          fieldId: "label",
          operator: "is-none-of",
          value: ["bug", "needs review"],
        },
        { id: "3", fieldId: "age", operator: "gt", value: "7" },
        {
          id: "4",
          fieldId: "created",
          operator: "between",
          value: ["2024-01-01", "2024-01-31"],
        },
        { id: "5", fieldId: "author", operator: "is", value: "" },
      ],
      " login page "
    )

    expect(query).toBe(
      'author:*"ana lee"* -label:bug,"needs review" age:>7 created:2024-01-01..2024-01-31 author: login page'
    )
    expect(parseQuery(query, FIELDS)).toEqual({
      filters: [
        {
          id: "query-0",
          fieldId: "author",
          operator: "contains",
          value: "ana lee",
        },
        {
          id: "query-1",
          fieldId: "label",
          operator: "is-none-of",
          value: ["bug", "needs review"],
        },
        { id: "query-2", fieldId: "age", operator: "gt", value: "7" },
        {
          id: "query-3",
          fieldId: "created",
          operator: "between",
          value: ["2024-01-01", "2024-01-31"],
        },
        { id: "query-4", fieldId: "author", operator: "is", value: "" },
      ],
      text: "login page",
    })
  })

  it("keeps operators that have no single-term spelling through a round trip", () => {
    const filters = [
      {
        id: "1",
        fieldId: "label",
        operator: "is-any-of" as const,
        value: ["bug"],
      },
      { id: "2", fieldId: "label", operator: "is-none-of" as const, value: [] },
      { id: "3", fieldId: "author", operator: "is" as const, value: "*bot*" },
      { id: "4", fieldId: "author", operator: "contains" as const, value: "" },
    ]
    const query = formatQuery(filters)

    expect(query).toBe('label:bug, -label:, author:"*bot*" author:**')
    expect(filtersOf(query)).toEqual(
      filters.map(({ fieldId, operator, value }) => ({
        fieldId,
        operator,
        value,
      }))
    )
  })

  it("leaves >= and <= as free text instead of guessing", () => {
    expect(parseQuery("age:>=5 created:<=2024-01-01", FIELDS)).toEqual({
      filters: [],
      text: "age:>=5 created:<=2024-01-01",
    })
  })

  it("suggests keys, then values, for the token at the caret", () => {
    expect(suggestQuery("fix -la", 7, FIELDS)).toEqual([
      {
        kind: "key",
        value: "label",
        label: "Label",
        start: 4,
        end: 7,
        insert: "-label:",
      },
    ])
    expect(suggestQuery("", 0, FIELDS).map((item) => item.value)).toEqual([
      "author",
      "label",
      "age",
      "created",
    ])
    expect(
      suggestQuery("label:bug,", 10, FIELDS).map((item) => item.insert)
    ).toEqual(["label:bug,docs ", 'label:bug,"needs review" '])
    expect(suggestQuery("label:REV", 9, FIELDS)[0].insert).toBe(
      'label:"needs review" '
    )
  })

  it("matches keys from the start so free text rarely opens the list", () => {
    expect(suggestQuery("login", 5, FIELDS)).toEqual([])
    expect(suggestQuery("ge", 2, FIELDS)).toEqual([])
    expect(suggestQuery("ag", 2, FIELDS).map((item) => item.value)).toEqual([
      "age",
    ])
  })

  it("has no suggestions mid-token, for unknown keys or for fields without options", () => {
    expect(suggestQuery("-a", 2, FIELDS).map((item) => item.insert)).toEqual([
      "-author:",
    ])
    expect(suggestQuery("author", 3, FIELDS)).toEqual([])
    expect(suggestQuery("is:op", 5, FIELDS)).toEqual([])
    expect(suggestQuery("author:m", 8, FIELDS)).toEqual([])
    expect(suggestQuery("created:", 8, FIELDS)).toEqual([])
  })

  it("applies a suggestion and places the caret after it", () => {
    const [key] = suggestQuery("x la y", 4, FIELDS)
    expect(applyQuerySuggestion("x la y", key)).toEqual({
      query: "x label: y",
      caret: 8,
    })
    const [value] = suggestQuery("label:b y", 7, FIELDS)
    expect(applyQuerySuggestion("label:b y", value)).toEqual({
      query: "label:bug y",
      caret: 10,
    })
    const [last] = suggestQuery("label:d", 7, FIELDS)
    expect(applyQuerySuggestion("label:d", last)).toEqual({
      query: "label:docs ",
      caret: 11,
    })
  })
})
