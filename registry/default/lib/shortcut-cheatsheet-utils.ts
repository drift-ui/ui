import { matchesShortcut } from "@/registry/default/lib/shortcut"

export type CheatsheetShortcut = {
  keys: string
  label: string
}

export type CheatsheetSection = {
  title: string
  shortcuts: CheatsheetShortcut[]
}

const NON_TEXT_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
])

export function filterSections(sections: CheatsheetSection[], query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return sections

  return sections.flatMap((section) => {
    if (section.title.toLowerCase().includes(needle)) return [section]
    const shortcuts = section.shortcuts.filter(({ label }) =>
      label.toLowerCase().includes(needle)
    )
    return shortcuts.length > 0 ? [{ ...section, shortcuts }] : []
  })
}

function isTextEntry(target: EventTarget | null) {
  if (target instanceof HTMLInputElement)
    return !NON_TEXT_INPUT_TYPES.has(target.type)
  if (!(target instanceof Element)) return false
  if (target.closest("select,textarea")) return true
  const editable = target.closest("[contenteditable]")
  return (
    editable !== null && editable.getAttribute("contenteditable") !== "false"
  )
}

function isCharacterTrigger(trigger: string) {
  return trigger.length === 1 && trigger === trigger.toLowerCase()
}

function producesCharacter(event: KeyboardEvent, isMac: boolean) {
  if (event.metaKey) return false
  if (event.getModifierState("AltGraph")) return true
  return !event.ctrlKey && (!event.altKey || isMac)
}

export function matchesTrigger(
  event: KeyboardEvent,
  trigger: string,
  isMac: boolean
) {
  const [target = event.target] = event.composedPath()
  if (!trigger || isTextEntry(target)) return false
  if (matchesShortcut(event, trigger, isMac)) return true
  return (
    isCharacterTrigger(trigger) &&
    event.key === trigger &&
    producesCharacter(event, isMac)
  )
}
