export type CsvField = {
  id: string
  label: string
  required?: boolean
  description?: string
  validate?: (value: unknown, row: Record<string, unknown>) => boolean | string
  transform?: (value: string) => unknown
}

export type CsvParseResult = {
  headers: string[]
  rows: string[][]
  totalRows: number
  truncated: boolean
}

export type CsvRowRecord = {
  id: string
  rowIndex: number
  values: Record<string, string>
  errors: Record<string, string>
  isValid: boolean
}

export type ValidationSummary = {
  rows: CsvRowRecord[]
  validCount: number
  invalidCount: number
  totalCount: number
}

/**
 * Strips leading UTF-8 Byte Order Mark (\uFEFF) if present.
 */
export function stripBom(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) {
    return text.slice(1)
  }
  return text
}

/**
 * Normalizes text to lowercase alphanumeric for fuzzy matching.
 */
export function normalizeKey(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "")
}

/**
 * Pure RFC 4180 compliant CSV parser.
 * Handles quoted fields, commas/newlines inside quotes, "" escapes, CRLF, and UTF-8 BOM.
 * Supports maxRows protection for main-thread parsing.
 */
export function parseCsv(
  csv: string,
  options?: { maxRows?: number }
): CsvParseResult {
  const text = stripBom(csv)
  const maxRows = options?.maxRows ?? Infinity
  const records: string[][] = []
  let currentRecord: string[] = []
  let currentField = ""
  let inQuotes = false
  let i = 0
  const len = text.length

  while (i < len) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < len && text[i + 1] === '"') {
          // Escaped quote: ""
          currentField += '"'
          i += 2
          continue
        } else {
          // Closing quote
          inQuotes = false
          i++
          continue
        }
      } else {
        currentField += char
        i++
        continue
      }
    } else {
      if (char === '"') {
        inQuotes = true
        i++
        continue
      } else if (char === ",") {
        currentRecord.push(currentField)
        currentField = ""
        i++
        continue
      } else if (char === "\r") {
        if (i + 1 < len && text[i + 1] === "\n") {
          i++
        }
        currentRecord.push(currentField)
        currentField = ""
        if (currentRecord.length > 1 || currentRecord[0] !== "") {
          records.push(currentRecord)
          if (records.length - 1 >= maxRows) {
            const rawHeaders = records[0]
            const headers = rawHeaders.map((h) => h.trim())
            const rows = records.slice(1, maxRows + 1).map((row) => {
              if (row.length < headers.length) {
                return [...row, ...Array(headers.length - row.length).fill("")]
              }
              return row.slice(0, headers.length)
            })
            return {
              headers,
              rows,
              totalRows: maxRows,
              truncated: true,
            }
          }
        }
        currentRecord = []
        i++
        continue
      } else if (char === "\n") {
        currentRecord.push(currentField)
        currentField = ""
        if (currentRecord.length > 1 || currentRecord[0] !== "") {
          records.push(currentRecord)
          if (records.length - 1 >= maxRows) {
            const rawHeaders = records[0]
            const headers = rawHeaders.map((h) => h.trim())
            const rows = records.slice(1, maxRows + 1).map((row) => {
              if (row.length < headers.length) {
                return [...row, ...Array(headers.length - row.length).fill("")]
              }
              return row.slice(0, headers.length)
            })
            return {
              headers,
              rows,
              totalRows: maxRows,
              truncated: true,
            }
          }
        }
        currentRecord = []
        i++
        continue
      } else {
        currentField += char
        i++
        continue
      }
    }
  }

  // Handle final field and record
  currentRecord.push(currentField)
  if (currentRecord.length > 1 || currentRecord[0] !== "") {
    records.push(currentRecord)
  }

  if (records.length === 0) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      truncated: false,
    }
  }

  const rawHeaders = records[0]
  const headers = rawHeaders.map((h) => h.trim())
  const rawRows = records.slice(1)
  const isTruncated = rawRows.length > maxRows
  const rows = isTruncated ? rawRows.slice(0, maxRows) : rawRows

  const normalizedRows = rows.map((row) => {
    if (row.length < headers.length) {
      return [...row, ...Array(headers.length - row.length).fill("")]
    }
    return row.slice(0, headers.length)
  })

  return {
    headers,
    rows: normalizedRows,
    totalRows: rawRows.length,
    truncated: isTruncated,
  }
}

/**
 * Suggests column mappings by matching CSV headers against field ids and labels,
 * ignoring case and standard separators (spaces, underscores, hyphens).
 */
export function suggestColumnMapping(
  headers: string[],
  fields: CsvField[]
): Record<string, string> {
  const mapping: Record<string, string> = {}
  const usedHeaders = new Set<string>()

  // 1. Exact case-insensitive match on id or label
  for (const field of fields) {
    const idLower = field.id.toLowerCase()
    const labelLower = field.label.toLowerCase()

    const match = headers.find(
      (h) =>
        !usedHeaders.has(h) &&
        (h.toLowerCase() === idLower || h.toLowerCase() === labelLower)
    )

    if (match) {
      mapping[field.id] = match
      usedHeaders.add(match)
    }
  }

  // 2. Normalized alphanumeric match
  for (const field of fields) {
    if (mapping[field.id]) continue

    const idNorm = normalizeKey(field.id)
    const labelNorm = normalizeKey(field.label)

    const match = headers.find(
      (h) =>
        !usedHeaders.has(h) &&
        (normalizeKey(h) === idNorm || normalizeKey(h) === labelNorm)
    )

    if (match) {
      mapping[field.id] = match
      usedHeaders.add(match)
    }
  }

  return mapping
}

/**
 * Validates an individual row against field requirements and custom validators.
 */
export function validateRow(
  fields: CsvField[],
  values: Record<string, string>
): { errors: Record<string, string>; isValid: boolean } {
  const errors: Record<string, string> = {}

  for (const field of fields) {
    const val = values[field.id] ?? ""
    const trimmed = typeof val === "string" ? val.trim() : ""

    if (field.required && trimmed === "") {
      errors[field.id] = `${field.label} is required`
      continue
    }

    if (trimmed !== "" && field.validate) {
      const result = field.validate(val, values)
      if (typeof result === "string" && result.length > 0) {
        errors[field.id] = result
      } else if (result === false) {
        errors[field.id] = `${field.label} is invalid`
      }
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  }
}

/**
 * Builds validated row records from raw CSV rows and column mapping.
 */
export function buildRowRecords(
  rows: string[][],
  headers: string[],
  mapping: Record<string, string>,
  fields: CsvField[]
): ValidationSummary {
  const fieldHeaderIndices: Record<string, number> = {}
  for (const field of fields) {
    const headerName = mapping[field.id]
    if (headerName) {
      const idx = headers.indexOf(headerName)
      if (idx !== -1) fieldHeaderIndices[field.id] = idx
    }
  }

  let validCount = 0
  let invalidCount = 0

  const rowRecords: CsvRowRecord[] = rows.map((row, rowIndex) => {
    const values: Record<string, string> = {}
    for (const field of fields) {
      const colIdx = fieldHeaderIndices[field.id]
      values[field.id] = colIdx !== undefined ? (row[colIdx] ?? "") : ""
    }

    const { errors, isValid } = validateRow(fields, values)
    if (isValid) validCount++
    else invalidCount++

    return {
      id: `row-${rowIndex}`,
      rowIndex,
      values,
      errors,
      isValid,
    }
  })

  return {
    rows: rowRecords,
    validCount,
    invalidCount,
    totalCount: rowRecords.length,
  }
}

/**
 * Re-validates a single row record after a cell value is modified.
 */
export function updateRowValue(
  rowRecord: CsvRowRecord,
  fieldId: string,
  newValue: string,
  fields: CsvField[]
): CsvRowRecord {
  const nextValues = { ...rowRecord.values, [fieldId]: newValue }
  const { errors, isValid } = validateRow(fields, nextValues)
  return {
    ...rowRecord,
    values: nextValues,
    errors,
    isValid,
  }
}

/**
 * Converts valid row records into clean application data objects, applying transforms.
 */
export function cleanImportRows(
  rows: CsvRowRecord[],
  fields: CsvField[]
): Record<string, unknown>[] {
  return rows
    .filter((r) => r.isValid)
    .map((r) => {
      const cleanData: Record<string, unknown> = {}
      for (const field of fields) {
        const raw = r.values[field.id] ?? ""
        if (field.transform) {
          cleanData[field.id] = field.transform(raw)
        } else {
          cleanData[field.id] = raw
        }
      }
      return cleanData
    })
}
