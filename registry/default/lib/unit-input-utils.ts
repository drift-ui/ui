export type Unit = {
  id: string
  label: string
  factor: number
}

export const BYTE_UNITS: Unit[] = [
  { id: "B", label: "B", factor: 1 },
  { id: "KB", label: "KB", factor: 1e3 },
  { id: "MB", label: "MB", factor: 1e6 },
  { id: "GB", label: "GB", factor: 1e9 },
  { id: "TB", label: "TB", factor: 1e12 },
]

export const BINARY_BYTE_UNITS: Unit[] = [
  { id: "B", label: "B", factor: 1 },
  { id: "KiB", label: "KiB", factor: 1024 },
  { id: "MiB", label: "MiB", factor: 1024 ** 2 },
  { id: "GiB", label: "GiB", factor: 1024 ** 3 },
  { id: "TiB", label: "TiB", factor: 1024 ** 4 },
]

// Trims float noise such as 0.1 * 3 = 0.30000000000000004, leaving exact integers alone.
function clean(value: number) {
  return Number.isSafeInteger(value) ? value : Number(value.toPrecision(15))
}

export function toBase(amount: number, unit: Unit) {
  return clean(amount * unit.factor)
}

export function fromBase(value: number, unit: Unit) {
  return clean(value / unit.factor)
}

export function clampValue(value: number, min?: number, max?: number) {
  return Math.min(max ?? Infinity, Math.max(min ?? -Infinity, value))
}

export function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 6,
    maximumSignificantDigits: 6,
    roundingPriority: "morePrecision",
    useGrouping: false,
  }).format(amount)
}

// Exact id or label first, so "Mb" and "MB" can coexist, then case-insensitive.
export function findUnit(units: Unit[], text: string) {
  const exact = units.find((unit) => unit.id === text || unit.label === text)
  if (exact) return exact
  const lower = text.toLowerCase()
  return units.find(
    (unit) =>
      unit.id.toLowerCase() === lower || unit.label.toLowerCase() === lower
  )
}

export function parseUnitText(
  text: string,
  units: Unit[]
): { amount: number; unit?: Unit } | null {
  const match =
    /^\s*(-?(?:\d{1,3}(?:,\d{3})+(?:\.\d*)?|\d+\.?\d*|\.\d+))\s*([^\d\s.,-][^\s]*)?\s*$/.exec(
      text
    )
  if (!match) return null

  const amount = Number(match[1].replace(/,/g, ""))
  if (!Number.isFinite(amount) || Math.abs(amount) > Number.MAX_SAFE_INTEGER)
    return null
  if (!match[2]) return { amount }

  const unit = findUnit(units, match[2])
  return unit ? { amount, unit } : null
}

// Largest unit that keeps the amount at 1 or more, for when no unit is given.
export function bestUnit(value: number | null | undefined, units: Unit[]) {
  const sorted = [...units].sort((a, b) => a.factor - b.factor)
  if (value === null || value === undefined || value === 0) return sorted[0]
  const magnitude = Math.abs(value)
  return sorted.filter((unit) => magnitude >= unit.factor).at(-1) ?? sorted[0]
}
