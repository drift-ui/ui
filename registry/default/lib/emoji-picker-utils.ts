export type SkinTone = 0 | 1 | 2 | 3 | 4 | 5

export type Emoji = {
  hexcode: string
  emoji: string
  label: string
  tags: string[]
  group: number
  order: number
  version: number
  skins?: { emoji: string; tone?: number | number[] }[]
}

export type EmojiSection = { id: string; label: string; emojis: Emoji[] }

export type EmojiCell = { row: number; column: number }

export type EmojiPreferences = { recent: string[]; skinTone?: SkinTone }

export const RECENT_SECTION_ID = "recent"

const EMOJI_GROUPS = [
  { id: 0, label: "Smileys & emotion" },
  { id: 1, label: "People & body" },
  { id: 3, label: "Animals & nature" },
  { id: 4, label: "Food & drink" },
  { id: 5, label: "Travel & places" },
  { id: 6, label: "Activities" },
  { id: 7, label: "Objects" },
  { id: 8, label: "Symbols" },
  { id: 9, label: "Flags" },
]

const WIDELY_SUPPORTED_EMOJI_VERSION = 15
const MAX_RECENT = 16
const STORAGE_KEY = "drift-ui:emoji-picker"

let emojiRequest: Promise<Emoji[]> | undefined

function isPickable(emoji: Emoji) {
  return (
    EMOJI_GROUPS.some((group) => group.id === emoji.group) &&
    emoji.version <= WIDELY_SUPPORTED_EMOJI_VERSION
  )
}

export function loadEmojis() {
  emojiRequest ??= import("emojibase-data/en/data.json")
    .then(({ default: data }) =>
      (data as unknown as Emoji[])
        .filter(isPickable)
        .sort((first, second) => first.order - second.order)
    )
    .catch((error) => {
      emojiRequest = undefined
      throw error
    })
  return emojiRequest
}

export function searchEmojis(emojis: Emoji[], query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return emojis
  return emojis.filter(
    (emoji) =>
      emoji.label.toLowerCase().includes(needle) ||
      emoji.tags.some((tag) => tag.startsWith(needle))
  )
}

export function withSkinTone(emoji: Emoji, skinTone: SkinTone) {
  return (
    emoji.skins?.find((skin) => skin.tone === skinTone)?.emoji ?? emoji.emoji
  )
}

export function buildSections(emojis: Emoji[], recent: string[]) {
  const recentEmojis = recent.flatMap(
    (hexcode) => emojis.find((emoji) => emoji.hexcode === hexcode) ?? []
  )
  const sections: EmojiSection[] = EMOJI_GROUPS.map((group) => ({
    id: String(group.id),
    label: group.label,
    emojis: emojis.filter((emoji) => emoji.group === group.id),
  }))

  return recentEmojis.length > 0
    ? [
        {
          id: RECENT_SECTION_ID,
          label: "Recently used",
          emojis: recentEmojis,
        },
        ...sections,
      ]
    : sections
}

export function layoutSections(sections: EmojiSection[], columns: number) {
  const rows: Emoji[][] = []
  const laidOut = sections
    .filter((section) => section.emojis.length > 0)
    .map((section) => {
      const firstRow = rows.length
      for (let index = 0; index < section.emojis.length; index += columns) {
        rows.push(section.emojis.slice(index, index + columns))
      }
      return { ...section, firstRow, rowCount: rows.length - firstRow }
    })

  return { rows, sections: laidOut }
}

export function moveCell(
  rowLengths: number[],
  sectionStarts: number[],
  { row, column }: EmojiCell,
  key: string,
  toGridEdge: boolean
): EmojiCell | null {
  const lastRow = rowLengths.length - 1
  const lastColumn = (target: number) => rowLengths[target] - 1
  const sameColumnIn = (target: number) => ({
    row: target,
    column: Math.min(column, lastColumn(target)),
  })

  switch (key) {
    case "ArrowRight":
      if (column < lastColumn(row)) return { row, column: column + 1 }
      return row < lastRow ? { row: row + 1, column: 0 } : { row, column }
    case "ArrowLeft":
      if (column > 0) return { row, column: column - 1 }
      return row > 0
        ? { row: row - 1, column: lastColumn(row - 1) }
        : { row, column }
    case "ArrowDown":
      return sameColumnIn(Math.min(row + 1, lastRow))
    case "ArrowUp":
      return sameColumnIn(Math.max(row - 1, 0))
    case "Home":
      return toGridEdge ? { row: 0, column: 0 } : { row, column: 0 }
    case "End":
      return toGridEdge
        ? { row: lastRow, column: lastColumn(lastRow) }
        : { row, column: lastColumn(row) }
    case "PageDown": {
      const next = sectionStarts.find((start) => start > row)
      return next === undefined
        ? { row: lastRow, column: lastColumn(lastRow) }
        : { row: next, column: 0 }
    }
    case "PageUp":
      return {
        row: sectionStarts.findLast((start) => start < row) ?? 0,
        column: 0,
      }
    default:
      return null
  }
}

export function addRecent(recent: string[], hexcode: string) {
  return [hexcode, ...recent.filter((item) => item !== hexcode)].slice(
    0,
    MAX_RECENT
  )
}

export function readPreferences(): EmojiPreferences {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
    return {
      recent: Array.isArray(stored.recent) ? stored.recent : [],
      skinTone: [0, 1, 2, 3, 4, 5].includes(stored.skinTone)
        ? stored.skinTone
        : undefined,
    }
  } catch {
    return { recent: [] }
  }
}

export function writePreferences(preferences: EmojiPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    return
  }
}
