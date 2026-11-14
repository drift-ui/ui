export type MentionOption = {
  value: string
  label: string
  description?: string
}

export type ActiveMention = {
  trigger: string
  query: string
  start: number
}

const TRAILING_TOKEN = /(^|\s)(\S)(\S*)$/
const MAX_VISIBLE_OPTIONS = 8

export function findActiveMention(
  text: string,
  caret: number,
  triggers: string[]
): ActiveMention | null {
  const match = TRAILING_TOKEN.exec(text.slice(0, caret))
  if (!match) return null
  const [, , trigger, query] = match
  if (!triggers.includes(trigger)) return null
  return { trigger, query, start: caret - query.length - 1 }
}

export function filterMentionOptions(options: MentionOption[], query: string) {
  const needle = query.toLowerCase()
  return options
    .filter(
      (option) =>
        option.value.toLowerCase().includes(needle) ||
        option.label.toLowerCase().includes(needle)
    )
    .slice(0, MAX_VISIBLE_OPTIONS)
}

export function insertMention(
  text: string,
  mention: ActiveMention,
  caret: number,
  option: MentionOption
) {
  const inserted = `${mention.trigger}${option.value} `
  return {
    text: text.slice(0, mention.start) + inserted + text.slice(caret),
    caret: mention.start + inserted.length,
  }
}

export type MentionSearch = (
  query: string,
  options: { signal: AbortSignal }
) => Promise<MentionOption[]>

export type MentionSource = MentionOption[] | MentionSearch

export type MentionRange = { start: number; end: number }

// Same boundary findActiveMention uses, so anything that opens the list can
// also become a mention.
const BEFORE_MENTION = /\s/
const CLOSING_PUNCTUATION = /[.,!?;:)\]}"']/
const WORD_CHARACTER = /[\p{L}\p{N}_]/u

// A mention ends at whitespace, the end, or closing punctuation. Only "." can
// continue a handle, so "@ana," and "@ana." end there but "@ana.leex" does not.
function closesMention(text: string, index: number) {
  if (index === text.length || /\s/.test(text[index])) return true
  if (!CLOSING_PUNCTUATION.test(text[index])) return false
  if (text[index] !== ".") return true
  const next = text.codePointAt(index + 1)
  return next === undefined || !WORD_CHARACTER.test(String.fromCodePoint(next))
}

export function limitMentionOptions(options: MentionOption[]) {
  return options.slice(0, MAX_VISIBLE_OPTIONS)
}

// Every known "@value" in the text, matched whole. Longer tokens win, so
// "@ana.lee" is not read as "@ana" followed by ".lee".
export function findMentionRanges(
  text: string,
  tokens: ReadonlySet<string>
): MentionRange[] {
  if (tokens.size === 0) return []
  const triggers = new Set<string>()
  let longest = 0
  for (const token of tokens) {
    triggers.add(token[0])
    longest = Math.max(longest, token.length)
  }

  const ranges: MentionRange[] = []
  let index = 0
  while (index < text.length) {
    const atBoundary = index === 0 || BEFORE_MENTION.test(text[index - 1])
    if (!atBoundary || !triggers.has(text[index])) {
      index++
      continue
    }
    let end = -1
    const limit = Math.min(text.length, index + longest)
    for (let candidate = limit; candidate > index + 1; candidate--) {
      if (
        closesMention(text, candidate) &&
        tokens.has(text.slice(index, candidate))
      ) {
        end = candidate
        break
      }
    }
    if (end === -1) {
      index++
      continue
    }
    ranges.push({ start: index, end })
    index = end
  }
  return ranges
}

function rangeAround(ranges: MentionRange[], position: number) {
  return ranges.find((range) => range.start < position && position < range.end)
}

// Keeps the caret out of mentions. An arrow-key step jumps over the mention in
// the direction of travel; a click or anything else goes to the nearest edge.
export function snapCaret(
  ranges: MentionRange[],
  position: number,
  previous: number,
  stepped = false
) {
  const range = rangeAround(ranges, position)
  if (!range) return position
  if (stepped) {
    return previous <= range.start ? range.end : range.start
  }
  return position - range.start <= range.end - position
    ? range.start
    : range.end
}

// Grows a selection so it never cuts a mention in half.
export function expandSelection(
  ranges: MentionRange[],
  start: number,
  end: number
) {
  return {
    start: rangeAround(ranges, start)?.start ?? start,
    end: rangeAround(ranges, end)?.end ?? end,
  }
}

// Backspace right after a mention, or Delete right before one, removes all of it.
export function deleteMention(
  text: string,
  ranges: MentionRange[],
  caret: number,
  direction: "backward" | "forward"
) {
  const range = ranges.find((candidate) =>
    direction === "backward"
      ? candidate.end === caret
      : candidate.start === caret
  )
  if (!range) return null
  return {
    text: text.slice(0, range.start) + text.slice(range.end),
    caret: range.start,
  }
}
