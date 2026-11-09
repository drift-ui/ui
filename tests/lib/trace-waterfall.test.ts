import { describe, expect, it } from "vitest"

import {
  buildSpanTree,
  calculateTimeTicks,
  calculateTraceBounds,
  findParentRowIndex,
  flattenSpanTree,
  formatDuration,
  getServiceColors,
  getSpanColorClass,
  stepSpanRow,
  type Span,
} from "@/registry/default/lib/trace-waterfall"

const SAMPLE_SPANS: Span[] = [
  { id: "1", name: "GET /orders", start: 0, duration: 240, service: "gateway" },
  {
    id: "2",
    parentId: "1",
    name: "auth.validate",
    start: 5,
    duration: 15,
    service: "auth",
  },
  {
    id: "3",
    parentId: "1",
    name: "SELECT orders",
    start: 25,
    duration: 90,
    service: "postgres",
    status: "ok",
  },
  {
    id: "4",
    parentId: "3",
    name: "cache.lookup",
    start: 26,
    duration: 0,
    service: "redis",
  },
  {
    id: "5",
    parentId: "missing-parent",
    name: "async.analytics",
    start: 120,
    duration: 50,
    service: "analytics",
    status: "error",
  },
]

describe("buildSpanTree", () => {
  it("nests children under their respective parents", () => {
    const tree = buildSpanTree(SAMPLE_SPANS)
    expect(tree).toHaveLength(2) // span "1" and orphan span "5"

    const rootSpan = tree[0]
    expect(rootSpan.span.id).toBe("1")
    expect(rootSpan.children).toHaveLength(2) // "2" and "3"

    const dbSpan = rootSpan.children[1]
    expect(dbSpan.span.id).toBe("3")
    expect(dbSpan.children).toHaveLength(1) // "4"
  })

  it("promotes orphan spans with missing parents to root level", () => {
    const tree = buildSpanTree(SAMPLE_SPANS)
    const orphanNode = tree.find((node) => node.span.id === "5")
    expect(orphanNode).toBeDefined()
    expect(orphanNode?.span.name).toBe("async.analytics")
  })

  it("handles self-referencing parentId without infinite loop", () => {
    const selfParenting: Span[] = [
      {
        id: "self",
        parentId: "self",
        name: "Self loop",
        start: 0,
        duration: 10,
      },
    ]
    const tree = buildSpanTree(selfParenting)
    expect(tree).toHaveLength(1)
    expect(tree[0].children).toHaveLength(0)
  })

  it("breaks multi-span parent cycles and promotes members to root level", () => {
    const cycleSpans: Span[] = [
      { id: "A", parentId: "B", name: "Span A", start: 0, duration: 10 },
      { id: "B", parentId: "A", name: "Span B", start: 10, duration: 10 },
    ]
    const tree = buildSpanTree(cycleSpans)
    expect(tree.length).toBeGreaterThanOrEqual(1)
    const ids = tree.map((t) => t.span.id)
    expect(ids).toContain("A")
    expect(ids).toContain("B")
  })
})

describe("calculateTraceBounds", () => {
  it("computes bounds accurately across all spans", () => {
    const bounds = calculateTraceBounds(SAMPLE_SPANS)
    expect(bounds.minStart).toBe(0)
    expect(bounds.maxEnd).toBe(240)
    expect(bounds.totalDuration).toBe(240)
  })

  it("safeguards empty span lists and zero durations", () => {
    const empty = calculateTraceBounds([])
    expect(empty.totalDuration).toBe(1)

    const zeroDuration = calculateTraceBounds([
      { id: "zero", name: "instant", start: 10, duration: 0 },
    ])
    expect(zeroDuration.minStart).toBe(10)
    expect(zeroDuration.maxEnd).toBe(10)
    expect(zeroDuration.totalDuration).toBe(1)
  })
})

describe("formatDuration", () => {
  it("formats microseconds, milliseconds and seconds", () => {
    expect(formatDuration(0)).toBe("0 ms")
    expect(formatDuration(-10)).toBe("0 ms")
    expect(formatDuration(0.5)).toBe("500 µs")
    expect(formatDuration(45)).toBe("45 ms")
    expect(formatDuration(240.5)).toBe("240.5 ms")
    expect(formatDuration(1500)).toBe("1.5 s")
    expect(formatDuration(12000)).toBe("12 s")
    expect(formatDuration(12500)).toBe("12.5 s")
  })
})

describe("calculateTimeTicks", () => {
  it("produces evenly distributed ticks", () => {
    const ticks = calculateTimeTicks(200, 5)
    expect(ticks).toHaveLength(5)
    expect(ticks[0]).toEqual({ time: 0, percent: 0, label: "0 ms" })
    expect(ticks[2]).toEqual({ time: 100, percent: 50, label: "100 ms" })
    expect(ticks[4]).toEqual({ time: 200, percent: 100, label: "200 ms" })
  })
})

describe("calculateTimeTicks with uneven durations", () => {
  it("rounds ticks to readable steps", () => {
    expect(calculateTimeTicks(410).map((t) => t.time)).toEqual([
      0, 100, 200, 300, 400,
    ])
    expect(calculateTimeTicks(12500).map((t) => t.label)).toEqual([
      "0 ms",
      "2.5 s",
      "5 s",
      "7.5 s",
      "10 s",
      "12.5 s",
    ])
  })
})

describe("getServiceColors", () => {
  it("gives each service a distinct color in first-seen order", () => {
    const colors = getServiceColors([
      { id: "a", name: "a", start: 0, duration: 1, service: "gateway" },
      { id: "b", name: "b", start: 0, duration: 1, service: "auth" },
      { id: "c", name: "c", start: 0, duration: 1, service: "gateway" },
      { id: "d", name: "d", start: 0, duration: 1 },
    ])
    expect([...colors.keys()]).toEqual(["gateway", "auth"])
    expect(colors.get("gateway")).not.toBe(colors.get("auth"))
  })
})

describe("flattenSpanTree", () => {
  it("flattens only expanded nodes and computes percentage coordinates", () => {
    const tree = buildSpanTree(SAMPLE_SPANS)
    const bounds = calculateTraceBounds(SAMPLE_SPANS)
    const expanded = new Set(["1"]) // only root "1" expanded, "3" collapsed

    const rows = flattenSpanTree(tree, expanded, bounds)
    expect(rows.map((r) => r.span.id)).toEqual(["1", "2", "3", "5"])

    // Check row metrics
    const rootRow = rows[0]
    expect(rootRow.depth).toBe(0)
    expect(rootRow.hasChildren).toBe(true)
    expect(rootRow.isExpanded).toBe(true)
    expect(rootRow.leftPercent).toBe(0)
    expect(rootRow.widthPercent).toBe(100)
    expect(rootRow.accessibleLabel).toContain(
      "GET /orders, 240 ms, starts at 0 ms"
    )

    // Check child row metrics
    const authRow = rows[1]
    expect(authRow.depth).toBe(1)
    expect(authRow.parentId).toBe("1")
    expect(authRow.leftPercent).toBeCloseTo((5 / 240) * 100, 1)
    expect(authRow.widthPercent).toBeCloseTo((15 / 240) * 100, 1)

    // Expand "3" to reveal "4"
    const allExpanded = new Set(["1", "3"])
    const rowsWithChild = flattenSpanTree(tree, allExpanded, bounds)
    expect(rowsWithChild.map((r) => r.span.id)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
    ])
    const leafRow = rowsWithChild[3]
    expect(leafRow.span.id).toBe("4")
    expect(leafRow.depth).toBe(2)
    expect(leafRow.parentId).toBe("3")
    expect(leafRow.widthPercent).toBe(0) // 0 duration
  })

  it("normalizes accessible label start time relative to minStart", () => {
    const delayedSpans: Span[] = [
      { id: "1", name: "delayed.root", start: 100, duration: 50 },
      {
        id: "2",
        parentId: "1",
        name: "delayed.child",
        start: 120,
        duration: 20,
      },
    ]
    const tree = buildSpanTree(delayedSpans)
    const bounds = calculateTraceBounds(delayedSpans)
    const rows = flattenSpanTree(tree, new Set(["1"]), bounds)

    // bounds.minStart is 100, so delayed.root starts at 0 ms relative to timeline
    expect(rows[0].accessibleLabel).toContain(
      "delayed.root, 50 ms, starts at 0 ms"
    )
    // delayed.child starts at 20 ms relative to timeline
    expect(rows[1].accessibleLabel).toContain(
      "delayed.child, 20 ms, starts at 20 ms"
    )
  })

  it("safeguards against NaN start or duration values", () => {
    const nanSpans: Span[] = [
      { id: "nan", name: "corrupted", start: NaN, duration: NaN },
    ]
    const tree = buildSpanTree(nanSpans)
    const bounds = calculateTraceBounds(nanSpans)
    const rows = flattenSpanTree(tree, new Set(), bounds)

    expect(Number.isNaN(rows[0].leftPercent)).toBe(false)
    expect(Number.isNaN(rows[0].widthPercent)).toBe(false)
    expect(rows[0].accessibleLabel).toContain("corrupted, 0 ms, starts at 0 ms")
  })
})

describe("getSpanColorClass", () => {
  it("applies destructive styling to error status", () => {
    expect(
      getSpanColorClass({
        id: "err",
        name: "fail",
        start: 0,
        duration: 10,
        status: "error",
      })
    ).toBe("bg-destructive text-destructive-foreground")
  })

  it("prefers explicit custom color", () => {
    expect(
      getSpanColorClass({
        id: "custom",
        name: "custom",
        start: 0,
        duration: 10,
        color: "bg-emerald-500",
      })
    ).toBe("bg-emerald-500")
  })

  it("consistently maps service names to chart color tokens", () => {
    const span1: Span = {
      id: "a",
      name: "op1",
      start: 0,
      duration: 10,
      service: "payment",
    }
    const span2: Span = {
      id: "b",
      name: "op2",
      start: 0,
      duration: 10,
      service: "payment",
    }
    expect(getSpanColorClass(span1)).toBe(getSpanColorClass(span2))
  })
})

describe("stepSpanRow and findParentRowIndex", () => {
  it("steps within bounds and locates parent rows", () => {
    const tree = buildSpanTree(SAMPLE_SPANS)
    const bounds = calculateTraceBounds(SAMPLE_SPANS)
    const rows = flattenSpanTree(tree, new Set(["1", "3"]), bounds)

    expect(stepSpanRow(rows, 0, 1)).toBe(1)
    expect(stepSpanRow(rows, 0, -1)).toBe(0)
    expect(stepSpanRow(rows, rows.length - 1, 1)).toBe(rows.length - 1)

    // Row 3 is "cache.lookup" whose parent is "3" (row 2)
    expect(findParentRowIndex(rows, 3)).toBe(2)
    // Row 0 has no parent
    expect(findParentRowIndex(rows, 0)).toBe(-1)
  })
})
