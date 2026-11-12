import type { MentionOption } from "@/registry/default/lib/mention"

export type ActiveVariable = {
  query: string
  start: number
}

export type TemplateVariable = {
  name: string
  start: number
  end: number
}

const OPEN = "{{"
const CLOSE = "}}"
const PARTIAL_NAME = /^\s*([^{}\s]*)$/
const TOKEN_REST = /^[^{}\s]*(\s*\}\})?/
const VARIABLE = /\{\{\s*([^{}\s]+)\s*\}\}/g

export function findActiveVariable(
  text: string,
  caret: number
): ActiveVariable | null {
  const before = text.slice(0, caret)
  const start = before.lastIndexOf(OPEN)
  if (start === -1) return null
  const match = PARTIAL_NAME.exec(before.slice(start + OPEN.length))
  if (!match) return null
  return { query: match[1], start }
}

export function insertVariable(
  text: string,
  active: ActiveVariable,
  caret: number,
  option: MentionOption
) {
  const inserted = `${OPEN}${option.value}${CLOSE}`
  const after = text.slice(caret)
  return {
    text:
      text.slice(0, active.start) + inserted + after.replace(TOKEN_REST, ""),
    caret: active.start + inserted.length,
  }
}

export function findTemplateVariables(text: string): TemplateVariable[] {
  return Array.from(text.matchAll(VARIABLE), (match) => ({
    name: match[1],
    start: match.index,
    end: match.index + match[0].length,
  }))
}

export function findUnknownVariables(text: string, variables: MentionOption[]) {
  const known = new Set(variables.map((variable) => variable.value))
  return [
    ...new Set(
      findTemplateVariables(text)
        .map((variable) => variable.name)
        .filter((name) => !known.has(name))
    ),
  ]
}
