export type SpanStatus = "ok" | "error" | "warning" | "unset"

export type Span = {
  id: string
  parentId?: string
  name: string
  start: number
  duration: number
  status?: SpanStatus | string
  service?: string
  color?: string
  attributes?: Record<string, string | number | boolean>
}

export type SpanNode = {
  span: Span
  children: SpanNode[]
}

export type TraceBounds = {
  minStart: number
  maxEnd: number
  totalDuration: number
}

export type TimeTick = {
  time: number
  percent: number
  label: string
}

export type FlattenedSpanRow = {
  span: Span
  depth: number
  parentId: string | null
  hasChildren: boolean
  isExpanded: boolean
  position: number
  siblingCount: number
  leftPercent: number
  widthPercent: number
  accessibleLabel: string
  colorClass: string
}

const CHART_COLOR_CLASSES = [
  "bg-chart-1 text-chart-1-foreground",
  "bg-chart-2 text-chart-2-foreground",
  "bg-chart-3 text-chart-3-foreground",
  "bg-chart-4 text-chart-4-foreground",
  "bg-chart-5 text-chart-5-foreground",
]

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0 ms"
  if (ms < 1) return `${Math.round(ms * 1000)} µs`
  if (ms < 1000) {
    const rounded = Number.isInteger(ms) ? ms : Number(ms.toFixed(1))
    return `${rounded} ms`
  }
  const sec = ms / 1000
  const formatted = Number(sec.toFixed(sec >= 10 ? 1 : 2))
  return `${formatted} s`
}

export function getServiceColors(spans: Span[]): Map<string, string> {
  const colors = new Map<string, string>()
  for (const span of spans) {
    if (span.service && !colors.has(span.service)) {
      colors.set(
        span.service,
        CHART_COLOR_CLASSES[colors.size % CHART_COLOR_CLASSES.length]
      )
    }
  }
  return colors
}

export function getSpanColorClass(
  span: Span,
  index = 0,
  serviceColors?: ReadonlyMap<string, string>
): string {
  if (span.status === "error") {
    return "bg-destructive text-destructive-foreground"
  }
  if (span.color) {
    return span.color
  }
  const assigned = span.service && serviceColors?.get(span.service)
  if (assigned) return assigned
  if (span.service) {
    let hash = 0
    for (let i = 0; i < span.service.length; i++) {
      hash = (hash << 5) - hash + span.service.charCodeAt(i)
      hash |= 0
    }
    const idx = Math.abs(hash) % CHART_COLOR_CLASSES.length
    return CHART_COLOR_CLASSES[idx]
  }
  return CHART_COLOR_CLASSES[index % CHART_COLOR_CLASSES.length]
}

export function buildSpanTree(spans: Span[]): SpanNode[] {
  const nodeMap = new Map<string, SpanNode>()
  const parentMap = new Map<string, string>()
  for (const span of spans) {
    nodeMap.set(span.id, { span, children: [] })
    if (span.parentId && span.parentId !== span.id) {
      parentMap.set(span.id, span.parentId)
    }
  }

  // Detect and break cycles so cycle members safely promote to roots
  const validParents = new Map<string, string>()
  for (const [id, parentId] of parentMap.entries()) {
    let curr: string | undefined = parentId
    let hasCycle = false
    const visited = new Set<string>([id])
    while (curr && nodeMap.has(curr)) {
      if (visited.has(curr)) {
        hasCycle = true
        break
      }
      visited.add(curr)
      curr = parentMap.get(curr)
    }
    if (!hasCycle && nodeMap.has(parentId)) {
      validParents.set(id, parentId)
    }
  }

  const roots: SpanNode[] = []
  for (const span of spans) {
    const node = nodeMap.get(span.id)!
    const parentId = validParents.get(span.id)
    if (parentId && nodeMap.has(parentId)) {
      nodeMap.get(parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

export function calculateTraceBounds(spans: Span[]): TraceBounds {
  if (spans.length === 0) {
    return { minStart: 0, maxEnd: 0, totalDuration: 1 }
  }
  let minStart = Infinity
  let maxEnd = -Infinity
  for (const s of spans) {
    const start = Number.isFinite(s.start) ? s.start : 0
    const duration = Number.isFinite(s.duration) ? Math.max(0, s.duration) : 0
    if (start < minStart) minStart = start
    if (start + duration > maxEnd) maxEnd = start + duration
  }
  if (!Number.isFinite(minStart)) minStart = 0
  if (!Number.isFinite(maxEnd) || maxEnd < minStart) maxEnd = minStart
  const totalDuration = Math.max(maxEnd - minStart, 1)
  return { minStart, maxEnd, totalDuration }
}

export function niceTickStep(totalDuration: number, maxIntervals = 5) {
  const raw = Math.max(totalDuration, 1) / Math.max(maxIntervals, 1)
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const multiplier = [1, 2, 2.5, 5, 10].find((m) => m * magnitude >= raw)!
  return multiplier * magnitude
}

export function calculateTimeTicks(
  totalDuration: number,
  maxIntervals = 5
): TimeTick[] {
  const safeDuration = Math.max(totalDuration, 1)
  const step = niceTickStep(safeDuration, maxIntervals)
  const ticks: TimeTick[] = []
  for (let i = 0; i * step <= safeDuration * (1 + 1e-9); i++) {
    const time = Number((i * step).toPrecision(12))
    ticks.push({
      time,
      percent: (time / safeDuration) * 100,
      label: formatDuration(time),
    })
  }
  return ticks
}

export function flattenSpanTree(
  rootNodes: SpanNode[],
  expandedIds: ReadonlySet<string>,
  bounds: TraceBounds,
  serviceColors?: ReadonlyMap<string, string>
): FlattenedSpanRow[] {
  const rows: FlattenedSpanRow[] = []

  function traverse(nodes: SpanNode[], depth: number, parentId: string | null) {
    nodes.forEach((node, index) => {
      const { span, children } = node
      const hasChildren = children.length > 0
      const isExpanded = hasChildren && expandedIds.has(span.id)
      const start = Number.isFinite(span.start) ? span.start : 0
      const duration = Number.isFinite(span.duration)
        ? Math.max(0, span.duration)
        : 0
      const leftPercent = Math.max(
        0,
        Math.min(100, ((start - bounds.minStart) / bounds.totalDuration) * 100)
      )
      const widthPercent = Math.max(
        0,
        Math.min(100 - leftPercent, (duration / bounds.totalDuration) * 100)
      )

      const normalizedStart = Math.max(0, start - bounds.minStart)
      const accessibleLabel = `${span.name}, ${formatDuration(duration)}, starts at ${formatDuration(normalizedStart)}${span.service ? ` (${span.service})` : ""}${span.status ? `, status ${span.status}` : ""}`

      const colorClass = getSpanColorClass(span, rows.length, serviceColors)

      rows.push({
        span,
        depth,
        parentId,
        hasChildren,
        isExpanded,
        position: index + 1,
        siblingCount: nodes.length,
        leftPercent,
        widthPercent,
        accessibleLabel,
        colorClass,
      })

      if (isExpanded) {
        traverse(children, depth + 1, span.id)
      }
    })
  }

  traverse(rootNodes, 0, null)
  return rows
}

export function stepSpanRow(
  rows: FlattenedSpanRow[],
  currentIndex: number,
  step: 1 | -1
): number {
  const next = currentIndex + step
  if (next < 0 || next >= rows.length) return currentIndex
  return next
}

export function findParentRowIndex(
  rows: FlattenedSpanRow[],
  currentIndex: number
): number {
  const current = rows[currentIndex]
  if (!current || !current.parentId) return -1
  return rows.findIndex((r) => r.span.id === current.parentId)
}
