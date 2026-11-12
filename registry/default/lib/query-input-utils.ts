import type {
  Filter,
  FilterField,
  FilterOperator,
} from "@/registry/default/lib/filter"

export type QueryToken = { start: number; end: number; text: string }

export type QuerySuggestion = {
  kind: "key" | "value"
  value: string
  label: string
  start: number
  end: number
  insert: string
}

const TERM = /^(-?)([\w.-]+):(.*)$/
const NEEDS_QUOTES = /[\s",\\]/
const MAX_SUGGESTIONS = 8

const EMPTY_OPERATOR: Record<FilterField["type"], FilterOperator> = {
  text: "is",
  select: "is",
  number: "eq",
  date: "before",
}

const NEGATED = new Set<FilterOperator>([
  "is-not",
  "not-contains",
  "is-none-of",
])

const COMPARATOR: Partial<Record<FilterOperator, string>> = {
  gt: ">",
  lt: "<",
  after: ">",
  before: "<",
}

export function tokenizeQuery(query: string): QueryToken[] {
  const tokens: QueryToken[] = []
  let index = 0
  while (index < query.length) {
    if (/\s/.test(query[index])) {
      index++
      continue
    }
    const start = index
    let quoted = false
    while (index < query.length && (quoted || !/\s/.test(query[index]))) {
      if (quoted && query[index] === "\\") index++
      else if (query[index] === '"') quoted = !quoted
      index++
    }
    const end = Math.min(index, query.length)
    tokens.push({ start, end, text: query.slice(start, end) })
  }
  return tokens
}

function readValues(raw: string, splitOnComma: boolean) {
  const values: string[] = []
  let current = ""
  let quoted = false
  for (let index = 0; index < raw.length; index++) {
    const char = raw[index]
    if (quoted && char === "\\" && index + 1 < raw.length) {
      current += raw[++index]
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === "," && !quoted && splitOnComma) {
      values.push(current)
      current = ""
    } else {
      current += char
    }
  }
  values.push(current)
  return values
}

function findField(fields: FilterField[], key: string) {
  const id = key.toLowerCase()
  return fields.find((field) => field.id.toLowerCase() === id)
}

export function parseQueryTerm(
  term: string,
  fields: FilterField[]
): Omit<Filter, "id"> | null {
  const match = TERM.exec(term)
  if (!match) return null
  const [, minus, key, raw] = match
  const field = findField(fields, key)
  if (!field) return null
  const negated = minus === "-"
  const ordered = field.type === "number" || field.type === "date"
  if (negated && ordered) return null
  const fieldId = field.id

  if (raw === "") {
    return {
      fieldId,
      operator: negated ? "is-not" : EMPTY_OPERATOR[field.type],
      value: "",
    }
  }

  if (ordered) {
    const comparator = /^[<>=]/.test(raw) ? raw[0] : ""
    const [value] = readValues(raw.slice(comparator.length), false)
    if (field.type === "number") {
      const operator =
        comparator === ">" ? "gt" : comparator === "<" ? "lt" : "eq"
      return { fieldId, operator, value }
    }
    if (comparator === ">") return { fieldId, operator: "after", value }
    if (comparator === "<") return { fieldId, operator: "before", value }
    const [from, to = from] = value.split("..")
    return { fieldId, operator: "between", value: [from, to] }
  }

  const values = readValues(raw, true).filter(Boolean)
  if (values.length > 1) {
    return {
      fieldId,
      operator: negated ? "is-none-of" : "is-any-of",
      value: values,
    }
  }
  const [value = ""] = values
  if (field.type === "text" && /^\*.+\*$/.test(value)) {
    return {
      fieldId,
      operator: negated ? "not-contains" : "contains",
      value: value.slice(1, -1),
    }
  }
  return { fieldId, operator: negated ? "is-not" : "is", value }
}

export function parseQuery(query: string, fields: FilterField[]) {
  const filters: Filter[] = []
  const words: string[] = []
  for (const token of tokenizeQuery(query)) {
    const filter = parseQueryTerm(token.text, fields)
    if (filter) filters.push({ id: `query-${filters.length}`, ...filter })
    else words.push(token.text)
  }
  return { filters, text: words.join(" ") }
}

function quote(value: string) {
  return NEEDS_QUOTES.test(value)
    ? `"${value.replace(/["\\]/g, "\\$&")}"`
    : value
}

function formatFilter({ fieldId, operator, value }: Filter) {
  const values = Array.isArray(value) ? value : [value]
  const prefix = NEGATED.has(operator) ? "-" : ""
  let formatted: string
  if (operator === "between") {
    formatted = values.join("..")
  } else if (operator === "contains" || operator === "not-contains") {
    formatted = quote(`*${values[0] ?? ""}*`)
  } else {
    formatted = (COMPARATOR[operator] ?? "") + values.map(quote).join(",")
  }
  return `${prefix}${fieldId}:${formatted}`
}

export function formatQuery(filters: Filter[], text = "") {
  return [...filters.map(formatFilter), text.trim()].filter(Boolean).join(" ")
}

function matches(
  needle: string,
  haystacks: string[],
  where: "start" | "anywhere"
) {
  const lower = needle.toLowerCase()
  return haystacks.some((haystack) =>
    where === "start"
      ? haystack.toLowerCase().startsWith(lower)
      : haystack.toLowerCase().includes(lower)
  )
}

export function suggestQuery(
  query: string,
  caret: number,
  fields: FilterField[]
): QuerySuggestion[] {
  const token = tokenizeQuery(query).find(
    (candidate) => candidate.start < caret && caret <= candidate.end
  ) ?? { start: caret, end: caret, text: "" }
  if (caret !== token.end) return []
  const { start, end, text } = token
  const match = TERM.exec(text)

  if (!match) {
    if (text.includes(":")) return []
    const minus = text.startsWith("-") ? "-" : ""
    const typed = text.slice(minus.length)
    return fields
      .filter((field) => matches(typed, [field.id, field.label], "start"))
      .slice(0, MAX_SUGGESTIONS)
      .map((field) => ({
        kind: "key",
        value: field.id,
        label: field.label,
        start,
        end,
        insert: `${minus}${field.id}:`,
      }))
  }

  const [, minus, key, raw] = match
  const field = findField(fields, key)
  if (!field?.options || field.type === "date" || field.type === "number") {
    return []
  }
  const listStart = raw.lastIndexOf(",") + 1
  const chosen = new Set(readValues(raw.slice(0, listStart), true))
  const typed = readValues(raw.slice(listStart), false)[0]
  const before = `${minus}${field.id}:${raw.slice(0, listStart)}`
  const spacer = /\s/.test(query[end] ?? "") ? "" : " "
  return field.options
    .filter(
      (option) =>
        !chosen.has(option.value) &&
        matches(typed, [option.value, option.label], "anywhere")
    )
    .slice(0, MAX_SUGGESTIONS)
    .map((option) => ({
      kind: "value",
      value: option.value,
      label: option.label,
      start,
      end,
      insert: `${before}${quote(option.value)}${spacer}`,
    }))
}

export function applyQuerySuggestion(
  query: string,
  suggestion: QuerySuggestion
) {
  const after = query.slice(suggestion.end)
  const skip = suggestion.kind === "value" && /^\s/.test(after) ? 1 : 0
  return {
    query: query.slice(0, suggestion.start) + suggestion.insert + after,
    caret: suggestion.start + suggestion.insert.length + skip,
  }
}
