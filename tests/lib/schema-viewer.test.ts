import { describe, expect, it } from "vitest"

import {
  filterColumns,
  formatTableName,
  getColumnBadges,
  isColumnNullable,
  parseReference,
  summarizeColumns,
  type SchemaColumn,
} from "@/registry/default/lib/schema-viewer-utils"

const COLUMNS: SchemaColumn[] = [
  { name: "id", type: "uuid", primaryKey: true },
  {
    name: "user_id",
    type: "uuid",
    nullable: false,
    references: "users.id",
    indexed: true,
  },
  {
    name: "email",
    type: "text",
    nullable: false,
    unique: true,
  },
  {
    name: "total",
    type: "numeric(10,2)",
    nullable: false,
    default: "0",
  },
  {
    name: "notes",
    type: "text",
  },
]

describe("parseReference", () => {
  it("parses table.column and schema.table.column references", () => {
    expect(parseReference("users.id")).toEqual({
      table: "users",
      column: "id",
      raw: "users.id",
    })
    expect(parseReference("public.users.id")).toEqual({
      table: "public.users",
      column: "id",
      raw: "public.users.id",
    })
  })

  it("handles bare table names and whitespace/empty strings", () => {
    expect(parseReference("users")).toEqual({
      table: "users",
      column: "",
      raw: "users",
    })
    expect(parseReference("  ")).toBeNull()
    expect(parseReference(".id")).toEqual({
      table: ".id",
      column: "",
      raw: ".id",
    })
  })
})

describe("getColumnBadges", () => {
  it("returns constraint badges in canonical order", () => {
    expect(
      getColumnBadges({ name: "id", type: "uuid", primaryKey: true })
    ).toEqual(["pk"])
    expect(
      getColumnBadges({
        name: "user_id",
        type: "uuid",
        references: "users.id",
        unique: true,
        indexed: true,
      })
    ).toEqual(["fk", "unique", "index"])
    expect(getColumnBadges({ name: "notes", type: "text" })).toEqual([])
    expect(
      getColumnBadges({ name: "blank_ref", type: "text", references: "   " })
    ).toEqual([])
  })
})

describe("isColumnNullable", () => {
  it("treats primary keys as NOT NULL by default and respects explicit nullable", () => {
    expect(
      isColumnNullable({ name: "id", type: "uuid", primaryKey: true })
    ).toBe(false)
    expect(
      isColumnNullable({
        name: "id",
        type: "uuid",
        primaryKey: true,
        nullable: true,
      })
    ).toBe(true)
    expect(isColumnNullable({ name: "notes", type: "text" })).toBe(true)
    expect(
      isColumnNullable({ name: "total", type: "numeric", nullable: false })
    ).toBe(false)
  })
})

describe("filterColumns", () => {
  it("filters columns case-insensitively by column name", () => {
    expect(filterColumns(COLUMNS, "")).toEqual(COLUMNS)
    expect(filterColumns(COLUMNS, "   ")).toEqual(COLUMNS)
    expect(filterColumns(COLUMNS, "USER").map((c) => c.name)).toEqual([
      "user_id",
    ])
    expect(filterColumns(COLUMNS, "id").map((c) => c.name)).toEqual([
      "id",
      "user_id",
    ])
    expect(filterColumns(COLUMNS, "missing")).toEqual([])
  })
})

describe("formatTableName", () => {
  it("includes schema prefix when provided", () => {
    expect(formatTableName({ name: "orders" })).toBe("orders")
    expect(formatTableName({ name: "orders", schema: "public" })).toBe(
      "public.orders"
    )
  })
})

describe("summarizeColumns", () => {
  it("counts total, primary keys, foreign keys, unique, and indexed columns", () => {
    expect(summarizeColumns(COLUMNS)).toEqual({
      total: 5,
      primaryKeys: 1,
      foreignKeys: 1,
      unique: 1,
      indexed: 1,
    })
  })
})
