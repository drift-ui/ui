import { describe, expect, it } from "vitest"

import {
  buildRowRecords,
  cleanImportRows,
  normalizeKey,
  parseCsv,
  stripBom,
  suggestColumnMapping,
  updateRowValue,
  validateRow,
  type CsvField,
  type CsvRowRecord,
} from "@/registry/default/lib/csv-importer-utils"

describe("stripBom", () => {
  it("removes UTF-8 BOM character from start of string", () => {
    const withBom = "\uFEFFid,name,email\n1,Alice,alice@example.com"
    expect(stripBom(withBom)).toBe("id,name,email\n1,Alice,alice@example.com")
  })

  it("leaves strings without BOM untouched", () => {
    const text = "id,name,email\n1,Alice,alice@example.com"
    expect(stripBom(text)).toBe(text)
  })
})

describe("normalizeKey", () => {
  it("lowercases and removes non-alphanumeric characters", () => {
    expect(normalizeKey("First Name")).toBe("firstname")
    expect(normalizeKey("user_email-address")).toBe("useremailaddress")
    expect(normalizeKey("ID #")).toBe("id")
  })
})

describe("parseCsv", () => {
  it("parses standard CSV with headers and rows", () => {
    const csv =
      "name,email,role\nAlice,alice@example.com,Admin\nBob,bob@example.com,Member"
    const result = parseCsv(csv)

    expect(result.headers).toEqual(["name", "email", "role"])
    expect(result.rows).toEqual([
      ["Alice", "alice@example.com", "Admin"],
      ["Bob", "bob@example.com", "Member"],
    ])
    expect(result.totalRows).toBe(2)
    expect(result.truncated).toBe(false)
  })

  it("handles CRLF line endings", () => {
    const csv =
      "name,email\r\nAlice,alice@example.com\r\nBob,bob@example.com\r\n"
    const result = parseCsv(csv)

    expect(result.headers).toEqual(["name", "email"])
    expect(result.rows).toEqual([
      ["Alice", "alice@example.com"],
      ["Bob", "bob@example.com"],
    ])
    expect(result.totalRows).toBe(2)
  })

  it("handles commas inside quoted fields", () => {
    const csv = 'name,notes\n"Smith, John",Engineer\n"Doe, Jane",Designer'
    const result = parseCsv(csv)

    expect(result.headers).toEqual(["name", "notes"])
    expect(result.rows).toEqual([
      ["Smith, John", "Engineer"],
      ["Doe, Jane", "Designer"],
    ])
  })

  it("handles newlines inside quoted fields", () => {
    const csv = 'id,description\n1,"Line 1\nLine 2"\n2,"Row 2"'
    const result = parseCsv(csv)

    expect(result.headers).toEqual(["id", "description"])
    expect(result.rows).toEqual([
      ["1", "Line 1\nLine 2"],
      ["2", "Row 2"],
    ])
  })

  it("handles escaped quotes inside quoted fields", () => {
    const csv =
      'quote,author\n"He said ""Hello"" to everyone",John\n"Simple quote",Jane'
    const result = parseCsv(csv)

    expect(result.headers).toEqual(["quote", "author"])
    expect(result.rows).toEqual([
      ['He said "Hello" to everyone', "John"],
      ["Simple quote", "Jane"],
    ])
  })

  it("handles UTF-8 BOM transparently", () => {
    const csv = "\uFEFFfirst_name,last_name\nAda,Lovelace"
    const result = parseCsv(csv)

    expect(result.headers).toEqual(["first_name", "last_name"])
    expect(result.rows).toEqual([["Ada", "Lovelace"]])
  })

  it("handles empty input or whitespace", () => {
    expect(parseCsv("")).toEqual({
      headers: [],
      rows: [],
      totalRows: 0,
      truncated: false,
    })
    expect(parseCsv("   \n\t  \r\n")).toEqual({
      headers: [],
      rows: [],
      totalRows: 0,
      truncated: false,
    })
  })

  it("throws on unterminated quoted field at EOF", () => {
    expect(() => parseCsv('name,age\n"Alice,25')).toThrow(
      "Unterminated quoted field in CSV"
    )
  })

  it("pads short rows and truncates long rows to header length", () => {
    const csv = "col1,col2,col3\nval1\nval1,val2,val3,extra"
    const result = parseCsv(csv)

    expect(result.headers).toEqual(["col1", "col2", "col3"])
    expect(result.rows).toEqual([
      ["val1", "", ""],
      ["val1", "val2", "val3"],
    ])
  })

  it("respects maxRows and sets truncated flag", () => {
    const csv = "id,name\n1,A\n2,B\n3,C\n4,D\n5,E"
    const result = parseCsv(csv, { maxRows: 3 })

    expect(result.headers).toEqual(["id", "name"])
    expect(result.rows).toHaveLength(3)
    expect(result.rows).toEqual([
      ["1", "A"],
      ["2", "B"],
      ["3", "C"],
    ])
    expect(result.truncated).toBe(true)
  })

  it("does not mark truncated when rows exactly equal maxRows with trailing newline", () => {
    const csv = "id,name\n1,A\n2,B\n3,C\n"
    const result = parseCsv(csv, { maxRows: 3 })

    expect(result.headers).toEqual(["id", "name"])
    expect(result.rows).toHaveLength(3)
    expect(result.truncated).toBe(false)
  })
})

describe("suggestColumnMapping", () => {
  const fields: CsvField[] = [
    { id: "email", label: "Email Address", required: true },
    { id: "fullName", label: "Full Name" },
    { id: "role", label: "User Role" },
  ]

  it("matches headers case-insensitively to field id or label", () => {
    const headers = ["EMAIL", "full name", "user role"]
    const mapping = suggestColumnMapping(headers, fields)

    expect(mapping).toEqual({
      email: "EMAIL",
      fullName: "full name",
      role: "user role",
    })
  })

  it("matches normalized variations with underscores and hyphens", () => {
    const headers = ["email_address", "full-name", "Role"]
    const mapping = suggestColumnMapping(headers, fields)

    expect(mapping).toEqual({
      email: "email_address",
      fullName: "full-name",
      role: "Role",
    })
  })

  it("leaves unmatched fields unassigned", () => {
    const headers = ["email", "unknown_column", "notes"]
    const mapping = suggestColumnMapping(headers, fields)

    expect(mapping).toEqual({
      email: "email",
    })
  })
})

describe("validateRow and buildRowRecords", () => {
  const fields: CsvField[] = [
    { id: "name", label: "Name", required: true },
    {
      id: "email",
      label: "Email",
      required: true,
      validate: (val) =>
        typeof val === "string" && val.includes("@")
          ? true
          : "Must be a valid email",
    },
    {
      id: "age",
      label: "Age",
      validate: (val) => (!val || Number(val) > 0 ? true : false),
    },
  ]

  it("detects required field violations and custom validation failures", () => {
    const res1 = validateRow(fields, {
      name: "",
      email: "test@example.com",
      age: "25",
    })
    expect(res1.isValid).toBe(false)
    expect(res1.errors.name).toBe("Name is required")

    const res2 = validateRow(fields, {
      name: "Alice",
      email: "invalid-email",
      age: "25",
    })
    expect(res2.isValid).toBe(false)
    expect(res2.errors.email).toBe("Must be a valid email")

    const res3 = validateRow(fields, {
      name: "Bob",
      email: "bob@example.com",
      age: "-5",
    })
    expect(res3.isValid).toBe(false)
    expect(res3.errors.age).toBe("Age is invalid")

    const res4 = validateRow(fields, {
      name: "Charlie",
      email: "charlie@example.com",
      age: "30",
    })
    expect(res4.isValid).toBe(true)
    expect(res4.errors).toEqual({})
  })

  it("builds row records and counts valid and invalid rows", () => {
    const headers = ["Full Name", "Contact Email", "Years"]
    const mapping = {
      name: "Full Name",
      email: "Contact Email",
      age: "Years",
    }
    const rawRows = [
      ["Alice", "alice@example.com", "28"],
      ["", "bob@example.com", "32"], // missing name
      ["Charlie", "bademail", "22"], // invalid email
    ]

    const summary = buildRowRecords(rawRows, headers, mapping, fields)

    expect(summary.totalCount).toBe(3)
    expect(summary.validCount).toBe(1)
    expect(summary.invalidCount).toBe(2)
    expect(summary.rows[0].isValid).toBe(true)
    expect(summary.rows[1].isValid).toBe(false)
    expect(summary.rows[1].errors.name).toBe("Name is required")
    expect(summary.rows[2].isValid).toBe(false)
    expect(summary.rows[2].errors.email).toBe("Must be a valid email")
  })

  it("handles duplicate headers when mapped by column index", () => {
    const headers = ["Value", "Value"]
    const mapping = {
      name: "col-0",
      email: "col-1",
    }
    const rawRows = [["Alice", "alice@example.com"]]

    const summary = buildRowRecords(rawRows, headers, mapping, fields)
    expect(summary.rows[0].values.name).toBe("Alice")
    expect(summary.rows[0].values.email).toBe("alice@example.com")
  })
})

describe("updateRowValue", () => {
  const fields: CsvField[] = [
    {
      id: "email",
      label: "Email",
      required: true,
      validate: (v) => typeof v === "string" && v.includes("@"),
    },
  ]

  it("updates cell value and recalculates validity", () => {
    const initialRow = {
      id: "row-0",
      rowIndex: 0,
      values: { email: "bad-email" },
      errors: { email: "Email is invalid" },
      isValid: false,
    }

    const updated = updateRowValue(
      initialRow,
      "email",
      "good@example.com",
      fields
    )
    expect(updated.values.email).toBe("good@example.com")
    expect(updated.isValid).toBe(true)
    expect(updated.errors).toEqual({})
  })
})

describe("cleanImportRows", () => {
  const fields: CsvField[] = [
    { id: "name", label: "Name" },
    { id: "count", label: "Count", transform: (v) => parseInt(v, 10) || 0 },
  ]

  it("transforms and returns only valid rows", () => {
    const rows: CsvRowRecord[] = [
      {
        id: "r1",
        rowIndex: 0,
        values: { name: "Alice", count: "42" },
        errors: {},
        isValid: true,
      },
      {
        id: "r2",
        rowIndex: 1,
        values: { name: "", count: "invalid" },
        errors: { name: "Name is required" },
        isValid: false,
      },
      {
        id: "r3",
        rowIndex: 2,
        values: { name: "Charlie", count: "10" },
        errors: {},
        isValid: true,
      },
    ]

    const clean = cleanImportRows(rows, fields)
    expect(clean).toEqual([
      { name: "Alice", count: 42 },
      { name: "Charlie", count: 10 },
    ])
  })
})
