export type SchemaBadgeKind = "pk" | "fk" | "unique" | "index"

export type SchemaForeignKeyRef = {
  table: string
  column: string
  raw: string
}

export type SchemaColumn = {
  name: string
  type: string
  primaryKey?: boolean
  references?: string
  unique?: boolean
  indexed?: boolean
  nullable?: boolean
  default?: string
  description?: string
}

export type SchemaTable = {
  name: string
  schema?: string
  description?: string
  columns: SchemaColumn[]
}

export const SCHEMA_BADGE_META: Record<
  SchemaBadgeKind,
  { shortLabel: string; label: string }
> = {
  pk: { shortLabel: "PK", label: "Primary key" },
  fk: { shortLabel: "FK", label: "Foreign key" },
  unique: { shortLabel: "UQ", label: "Unique" },
  index: { shortLabel: "IDX", label: "Indexed" },
}

export function parseReference(ref: string): SchemaForeignKeyRef | null {
  const trimmed = ref.trim()
  if (!trimmed) return null
  const lastDot = trimmed.lastIndexOf(".")
  if (lastDot <= 0 || lastDot === trimmed.length - 1) {
    return { table: trimmed, column: "", raw: trimmed }
  }
  return {
    table: trimmed.slice(0, lastDot),
    column: trimmed.slice(lastDot + 1),
    raw: trimmed,
  }
}

export function getColumnBadges(column: SchemaColumn): SchemaBadgeKind[] {
  const badges: SchemaBadgeKind[] = []
  if (column.primaryKey) badges.push("pk")
  if (column.references?.trim()) badges.push("fk")
  if (column.unique) badges.push("unique")
  if (column.indexed) badges.push("index")
  return badges
}

export function isColumnNullable(column: SchemaColumn): boolean {
  if (column.nullable !== undefined) return column.nullable
  return !column.primaryKey
}

export function filterColumns(
  columns: SchemaColumn[],
  query: string
): SchemaColumn[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return columns
  return columns.filter((column) => column.name.toLowerCase().includes(needle))
}

export function formatTableName(
  table: Pick<SchemaTable, "name" | "schema">
): string {
  return table.schema ? `${table.schema}.${table.name}` : table.name
}

export function summarizeColumns(columns: SchemaColumn[]) {
  let primaryKeys = 0
  let foreignKeys = 0
  let unique = 0
  let indexed = 0

  for (const column of columns) {
    if (column.primaryKey) primaryKeys++
    if (column.references?.trim()) foreignKeys++
    if (column.unique) unique++
    if (column.indexed) indexed++
  }

  return {
    total: columns.length,
    primaryKeys,
    foreignKeys,
    unique,
    indexed,
  }
}
