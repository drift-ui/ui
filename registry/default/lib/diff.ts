export type DiffSegment = { text: string; changed: boolean }

export type DiffLine = {
  type: "equal" | "add" | "remove"
  text: string
  oldNumber: number | null
  newNumber: number | null
  segments?: DiffSegment[]
  // Set on an equal line whose old text differs only in whitespace.
  oldText?: string
}

export type DiffOptions = { ignoreWhitespace?: boolean }

// Same rule as git diff -w: whitespace never makes two lines differ.
const withoutWhitespace = (text: string) => text.replace(/\s+/g, "")

export type DiffPair = { old: DiffLine | null; new: DiffLine | null }

export type DiffBlock =
  | { kind: "lines"; lines: DiffLine[] }
  | { kind: "unchanged"; id: number; lines: DiffLine[] }

type Edit = DiffLine["type"]

function pushEdits(edits: Edit[], edit: Edit, count: number) {
  for (let index = 0; index < count; index++) edits.push(edit)
}

// Myers' middle snake: the point halfway along a shortest edit path between
// a[aStart..aEnd] and b[bStart..bEnd], found from both ends in linear space.
function middleSnake(
  a: Int32Array,
  aStart: number,
  aEnd: number,
  b: Int32Array,
  bStart: number,
  bEnd: number
) {
  const oldLength = aEnd - aStart
  const newLength = bEnd - bStart
  const maxDistance = Math.ceil((oldLength + newLength) / 2)
  const offset = maxDistance + 1
  const forward = new Int32Array(2 * offset + 1).fill(-1)
  const backward = new Int32Array(2 * offset + 1).fill(-1)
  forward[offset + 1] = 0
  backward[offset + 1] = 0
  const delta = oldLength - newLength
  const checksForward = delta % 2 !== 0

  for (let distance = 0; distance <= maxDistance; distance++) {
    for (let k = -distance; k <= distance; k += 2) {
      let x =
        k === -distance ||
        (k !== distance && forward[offset + k - 1] < forward[offset + k + 1])
          ? forward[offset + k + 1]
          : forward[offset + k - 1] + 1
      let y = x - k
      if (x > oldLength || y > newLength || y < 0) continue
      while (
        x < oldLength &&
        y < newLength &&
        a[aStart + x] === b[bStart + y]
      ) {
        x++
        y++
      }
      forward[offset + k] = x
      const reverse = offset + delta - k
      if (
        checksForward &&
        reverse >= 0 &&
        reverse < backward.length &&
        backward[reverse] !== -1 &&
        x >= oldLength - backward[reverse]
      ) {
        return { x: aStart + x, y: bStart + y }
      }
    }

    for (let k = -distance; k <= distance; k += 2) {
      let x =
        k === -distance ||
        (k !== distance && backward[offset + k - 1] < backward[offset + k + 1])
          ? backward[offset + k + 1]
          : backward[offset + k - 1] + 1
      let y = x - k
      if (x > oldLength || y > newLength || y < 0) continue
      while (
        x < oldLength &&
        y < newLength &&
        a[aEnd - x - 1] === b[bEnd - y - 1]
      ) {
        x++
        y++
      }
      backward[offset + k] = x
      const ahead = offset + delta - k
      if (
        !checksForward &&
        ahead >= 0 &&
        ahead < forward.length &&
        forward[ahead] !== -1 &&
        forward[ahead] >= oldLength - x
      ) {
        const splitX = forward[ahead]
        return { x: aStart + splitX, y: bStart + splitX - (delta - k) }
      }
    }
  }
  return null
}

function diffRange(
  a: Int32Array,
  aStart: number,
  aEnd: number,
  b: Int32Array,
  bStart: number,
  bEnd: number,
  edits: Edit[]
) {
  while (aStart < aEnd && bStart < bEnd && a[aStart] === b[bStart]) {
    edits.push("equal")
    aStart++
    bStart++
  }
  let suffix = 0
  while (
    aEnd - suffix > aStart &&
    bEnd - suffix > bStart &&
    a[aEnd - suffix - 1] === b[bEnd - suffix - 1]
  ) {
    suffix++
  }
  aEnd -= suffix
  bEnd -= suffix

  const split =
    aStart < aEnd && bStart < bEnd
      ? middleSnake(a, aStart, aEnd, b, bStart, bEnd)
      : null
  // A split at either corner would recurse forever, so treat it as no split.
  if (
    split &&
    !(split.x === aStart && split.y === bStart) &&
    !(split.x === aEnd && split.y === bEnd)
  ) {
    diffRange(a, aStart, split.x, b, bStart, split.y, edits)
    diffRange(a, split.x, aEnd, b, split.y, bEnd, edits)
  } else {
    pushEdits(edits, "remove", aEnd - aStart)
    pushEdits(edits, "add", bEnd - bStart)
  }
  pushEdits(edits, "equal", suffix)
}

// A shortest edit script in O((N + M) D) time and linear space, so there is
// no size limit. Items found on one side only can never match, so they are
// set aside before the search and put back after, which keeps rewrites fast.
export function diffSequences(oldItems: string[], newItems: string[]): Edit[] {
  const ids = new Map<string, number>()
  const idOf = (item: string) => {
    let id = ids.get(item)
    if (id === undefined) ids.set(item, (id = ids.size))
    return id
  }
  const a = Int32Array.from(oldItems, idOf)
  const b = Int32Array.from(newItems, idOf)
  const inOld = new Uint8Array(ids.size)
  const inNew = new Uint8Array(ids.size)
  for (const id of a) inOld[id] = 1
  for (const id of b) inNew[id] = 1
  const keptOld = a.filter((id) => inNew[id])
  const keptNew = b.filter((id) => inOld[id])

  const searched: Edit[] = []
  diffRange(keptOld, 0, keptOld.length, keptNew, 0, keptNew.length, searched)

  const edits: Edit[] = []
  let oldIndex = 0
  let newIndex = 0
  const skipOld = () => {
    while (oldIndex < a.length && !inNew[a[oldIndex]]) {
      edits.push("remove")
      oldIndex++
    }
  }
  const skipNew = () => {
    while (newIndex < b.length && !inOld[b[newIndex]]) {
      edits.push("add")
      newIndex++
    }
  }
  for (const edit of searched) {
    skipOld()
    skipNew()
    edits.push(edit)
    if (edit !== "add") oldIndex++
    if (edit !== "remove") newIndex++
  }
  skipOld()
  skipNew()
  return edits
}

function tokenize(text: string) {
  return text.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu) ?? []
}

function appendSegment(
  segments: DiffSegment[],
  text: string,
  changed: boolean
) {
  const last = segments.at(-1)
  if (last?.changed === changed) last.text += text
  else segments.push({ text, changed })
}

export function diffWords(
  oldText: string,
  newText: string,
  { ignoreWhitespace = false }: DiffOptions = {}
) {
  const oldTokens = tokenize(oldText)
  const newTokens = tokenize(newText)
  const oldSegments: DiffSegment[] = []
  const newSegments: DiffSegment[] = []
  let oldIndex = 0
  let newIndex = 0
  let hasSharedWord = false

  const changed = (token: string) => !ignoreWhitespace || token.trim() !== ""
  const keyOf = (token: string) =>
    ignoreWhitespace && token.trim() === "" ? " " : token

  for (const edit of diffSequences(
    oldTokens.map(keyOf),
    newTokens.map(keyOf)
  )) {
    if (edit === "equal") {
      hasSharedWord ||= oldTokens[oldIndex].trim() !== ""
      appendSegment(oldSegments, oldTokens[oldIndex++], false)
      appendSegment(newSegments, newTokens[newIndex++], false)
    } else if (edit === "remove") {
      const token = oldTokens[oldIndex++]
      appendSegment(oldSegments, token, changed(token))
    } else {
      const token = newTokens[newIndex++]
      appendSegment(newSegments, token, changed(token))
    }
  }

  return hasSharedWord ? { old: oldSegments, new: newSegments } : null
}

function splitLines(text: string) {
  return text === "" ? [] : text.split(/\r?\n/)
}

export function diffLines(
  oldText: string,
  newText: string,
  options: DiffOptions = {}
) {
  const oldLines = splitLines(oldText)
  const newLines = splitLines(newText)
  const keys = (lines: string[]) =>
    options.ignoreWhitespace ? lines.map(withoutWhitespace) : lines
  const lines: DiffLine[] = []
  let removed: DiffLine[] = []
  let added: DiffLine[] = []
  let oldIndex = 0
  let newIndex = 0

  function flushChanges() {
    removed.forEach((line, index) => {
      const partner = added[index]
      const words = partner && diffWords(line.text, partner.text, options)
      if (!words) return
      line.segments = words.old
      partner.segments = words.new
    })
    lines.push(...removed, ...added)
    removed = []
    added = []
  }

  for (const edit of diffSequences(keys(oldLines), keys(newLines))) {
    if (edit === "remove") {
      removed.push({
        type: "remove",
        text: oldLines[oldIndex++],
        oldNumber: oldIndex,
        newNumber: null,
      })
    } else if (edit === "add") {
      added.push({
        type: "add",
        text: newLines[newIndex++],
        oldNumber: null,
        newNumber: newIndex,
      })
    } else {
      flushChanges()
      const old = oldLines[oldIndex++]
      const line: DiffLine = {
        type: "equal",
        text: newLines[newIndex++],
        oldNumber: oldIndex,
        newNumber: newIndex,
      }
      if (old !== line.text) line.oldText = old
      lines.push(line)
    }
  }
  flushChanges()

  return lines
}

export function pairLines(lines: DiffLine[]) {
  const pairs: DiffPair[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    if (line.type === "equal") {
      pairs.push({
        old:
          line.oldText === undefined ? line : { ...line, text: line.oldText },
        new: line,
      })
      index++
      continue
    }
    const removed: DiffLine[] = []
    const added: DiffLine[] = []
    for (; lines[index]?.type === "remove"; index++) removed.push(lines[index])
    for (; lines[index]?.type === "add"; index++) added.push(lines[index])
    for (let row = 0; row < Math.max(removed.length, added.length); row++) {
      pairs.push({ old: removed[row] ?? null, new: added[row] ?? null })
    }
  }

  return pairs
}

export function collapseUnchanged(lines: DiffLine[], contextLines: number) {
  const blocks: DiffBlock[] = []
  let visible: DiffLine[] = []

  function flushVisible() {
    if (visible.length > 0) blocks.push({ kind: "lines", lines: visible })
    visible = []
  }

  let start = 0
  while (start < lines.length) {
    let end = start
    const isEqual = lines[start].type === "equal"
    while (end < lines.length && (lines[end].type === "equal") === isEqual)
      end++

    const run = lines.slice(start, end)
    const leading = start === 0 ? 0 : contextLines
    const trailing = end === lines.length ? 0 : contextLines
    const hiddenCount = run.length - leading - trailing

    if (isEqual && hiddenCount > 1) {
      visible.push(...run.slice(0, leading))
      flushVisible()
      blocks.push({
        kind: "unchanged",
        id: start,
        lines: run.slice(leading, leading + hiddenCount),
      })
      visible.push(...run.slice(leading + hiddenCount))
    } else {
      visible.push(...run)
    }
    start = end
  }
  flushVisible()

  return blocks
}
