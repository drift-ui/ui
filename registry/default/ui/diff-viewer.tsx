"use client"

import * as React from "react"
import { ChevronRightIcon } from "lucide-react"

import {
  collapseUnchanged,
  diffLines,
  pairLines,
  type DiffBlock,
  type DiffLine,
  type DiffPair,
} from "@/registry/default/lib/diff"
import { cn } from "@/registry/default/lib/utils"
import {
  rowOffsets,
  visibleRange,
} from "@/registry/default/lib/virtual-list-utils"

type DiffMode = "split" | "unified"

type RenderLine = (line: DiffLine) => React.ReactNode

type Row =
  | { kind: "split"; pair: DiffPair }
  | { kind: "unified"; line: DiffLine }
  | { kind: "toggle"; block: Extract<DiffBlock, { kind: "unchanged" }> }

// Rows never wrap, so every row has a fixed height and scroll math is exact.
const LINE_HEIGHT = 20
const TOGGLE_HEIGHT = 28
const VIRTUALIZE_AFTER = 300
const OVERSCAN = 20
const TAB_SIZE = 4

const NUMBER_CLASS =
  "px-2 text-right align-top text-muted-foreground tabular-nums select-none"

const LINE_CLASSES: Record<DiffLine["type"], string> = {
  equal: "",
  add: "bg-[color-mix(in_oklab,var(--chart-2)_15%,transparent)]",
  remove: "bg-destructive/10",
}

const SIGNS: Record<DiffLine["type"], string> = {
  equal: " ",
  add: "+",
  remove: "-",
}

const SCREEN_READER_LABELS: Record<DiffLine["type"], string> = {
  equal: "",
  add: "Added: ",
  remove: "Removed: ",
}

function lineCount(count: number) {
  return `${count} ${count === 1 ? "line" : "lines"}`
}

function LineText({ line }: { line: DiffLine }): React.ReactNode {
  if (!line.segments) return line.text

  const Changed = line.type === "add" ? "ins" : "del"
  return line.segments.map((segment, index) =>
    segment.changed ? (
      <Changed
        key={index}
        className={cn(
          "rounded-sm no-underline",
          line.type === "add"
            ? "bg-[color-mix(in_oklab,var(--chart-2)_35%,transparent)]"
            : "bg-destructive/25"
        )}
      >
        {segment.text}
      </Changed>
    ) : (
      segment.text
    )
  )
}

type Slots = { renderLine?: RenderLine; renderGutter?: RenderLine }

function LineCell({
  line,
  renderLine,
  className,
}: {
  line: DiffLine
  renderLine?: RenderLine
  className?: string
}) {
  return (
    <td
      className={cn("overflow-hidden px-2 align-top whitespace-pre", className)}
    >
      {/* Clipped to the row height, so a taller renderLine can't break scrolling. */}
      <div className="h-5 overflow-hidden">
        <span aria-hidden className="mr-2 text-muted-foreground select-none">
          {SIGNS[line.type]}
        </span>
        <span className="sr-only">{SCREEN_READER_LABELS[line.type]}</span>
        {renderLine ? renderLine(line) : <LineText line={line} />}
      </div>
    </td>
  )
}

function GutterCell({
  line,
  renderGutter,
  className,
}: {
  line: DiffLine
  renderGutter?: RenderLine
  className?: string
}) {
  if (!renderGutter) return null
  return (
    <td data-slot="diff-viewer-gutter" className={cn("align-top", className)}>
      <div className="flex h-5 items-center overflow-hidden has-focus-visible:ring-2 has-focus-visible:ring-ring/50 has-focus-visible:ring-inset">
        {renderGutter(line)}
      </div>
    </td>
  )
}

function SplitSide({
  line,
  renderLine,
  renderGutter,
}: Slots & { line: DiffLine | null }) {
  if (!line) {
    return <td colSpan={renderGutter ? 3 : 2} className="bg-muted/50" />
  }
  return (
    <>
      <GutterCell
        line={line}
        renderGutter={renderGutter}
        className={LINE_CLASSES[line.type]}
      />
      <td className={cn(NUMBER_CLASS, LINE_CLASSES[line.type])}>
        {line.oldNumber ?? line.newNumber}
      </td>
      <LineCell
        line={line}
        renderLine={renderLine}
        className={LINE_CLASSES[line.type]}
      />
    </>
  )
}

function rowKey(row: Row) {
  if (row.kind === "toggle") return `unchanged-${row.block.id}`
  if (row.kind === "unified")
    return `${row.line.oldNumber}:${row.line.newNumber}`
  return `${row.pair.old?.oldNumber}:${row.pair.new?.newNumber}`
}

function buildRows(blocks: DiffBlock[], mode: DiffMode, expandedIds: number[]) {
  const rows: Row[] = []
  const pushLines = (lines: DiffLine[]) => {
    if (mode === "split") {
      for (const pair of pairLines(lines)) rows.push({ kind: "split", pair })
    } else {
      for (const line of lines) rows.push({ kind: "unified", line })
    }
  }
  for (const block of blocks) {
    if (block.kind === "lines") {
      pushLines(block.lines)
      continue
    }
    rows.push({ kind: "toggle", block })
    if (expandedIds.includes(block.id)) pushLines(block.lines)
  }
  return rows
}

// East Asian wide characters and most emoji take two columns.
const WIDE_CHARACTER =
  /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6\u{1f300}-\u{1faff}\u{20000}-\u{3fffd}]/u

function columnWidth(text: string) {
  let width = 0
  for (const character of text) {
    if (character === "\t") width += TAB_SIZE
    else width += WIDE_CHARACTER.test(character) ? 2 : 1
  }
  return width
}

// Monospace, so the widest line in ch sizes the table before any row renders.
function widestLine(lines: DiffLine[]) {
  let widest = 0
  for (const line of lines) {
    widest = Math.max(
      widest,
      columnWidth(line.text),
      columnWidth(line.oldText ?? "")
    )
  }
  return widest
}

function DiffViewer({
  oldValue,
  newValue,
  mode = "split",
  contextLines = 3,
  ignoreWhitespace = false,
  renderLine,
  renderGutter,
  className,
  onScroll,
  "aria-label": ariaLabel = "Diff",
  ...props
}: React.ComponentProps<"div"> & {
  oldValue: string
  newValue: string
  mode?: DiffMode
  contextLines?: number
  ignoreWhitespace?: boolean
  renderLine?: RenderLine
  renderGutter?: RenderLine
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const lines = React.useMemo(
    () => diffLines(oldValue, newValue, { ignoreWhitespace }),
    [oldValue, newValue, ignoreWhitespace]
  )
  const blocks = React.useMemo(
    () => collapseUnchanged(lines, contextLines),
    [lines, contextLines]
  )
  const [expandedIds, setExpandedIds] = React.useState<number[]>([])
  const [expandedFor, setExpandedFor] = React.useState(lines)
  if (expandedFor !== lines) {
    setExpandedFor(lines)
    setExpandedIds([])
  }

  const addedCount = lines.filter((line) => line.type === "add").length
  const removedCount = lines.filter((line) => line.type === "remove").length
  const gutterColumns = renderGutter ? 1 : 0
  const columnCount =
    (mode === "split" ? 4 : 3) + gutterColumns * (mode === "split" ? 2 : 1)
  const widest = React.useMemo(() => widestLine(lines), [lines])

  const rows = React.useMemo(
    () => buildRows(blocks, mode, expandedIds),
    [blocks, mode, expandedIds]
  )
  const offsets = React.useMemo(
    () =>
      rowOffsets(rows.length, (index) =>
        rows[index].kind === "toggle" ? TOGGLE_HEIGHT : LINE_HEIGHT
      ),
    [rows]
  )
  const isVirtual = rows.length > VIRTUALIZE_AFTER
  const [viewport, setViewport] = React.useState({ top: 0, height: 0 })

  React.useLayoutEffect(() => {
    const container = containerRef.current
    if (!container || !isVirtual) return
    const sync = () =>
      setViewport({ top: container.scrollTop, height: container.clientHeight })
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(container)
    return () => observer.disconnect()
  }, [isVirtual])

  // Toggle rows always render so Tab reaches every collapsed region.
  // The row holding focus stays mounted too, so scrolling never drops focus.
  const [focusedKey, setFocusedKey] = React.useState<string | null>(null)
  const rendered: number[] = []
  if (isVirtual) {
    const range = visibleRange(offsets, viewport.top, viewport.height)
    const first = Math.max(0, range.first - OVERSCAN)
    const last = Math.min(rows.length - 1, range.last + OVERSCAN)
    rows.forEach((row, index) => {
      if (
        (index >= first && index <= last) ||
        row.kind === "toggle" ||
        rowKey(row) === focusedKey
      ) {
        rendered.push(index)
      }
    })
  } else {
    for (let index = 0; index < rows.length; index++) rendered.push(index)
  }

  function toggle(id: number) {
    setExpandedIds((current) =>
      current.includes(id)
        ? current.filter((expandedId) => expandedId !== id)
        : [...current, id]
    )
  }

  function renderRow(row: Row, index: number) {
    const rowIndex = isVirtual ? index + 2 : undefined
    if (row.kind === "toggle") {
      const isExpanded = expandedIds.includes(row.block.id)
      return (
        <tr
          key={rowKey(row)}
          data-row-key={rowKey(row)}
          aria-rowindex={rowIndex}
          style={{ height: TOGGLE_HEIGHT }}
        >
          <td colSpan={columnCount} className="bg-muted/50">
            <button
              type="button"
              aria-expanded={isExpanded}
              onClick={() => toggle(row.block.id)}
              className="sticky left-0 flex items-center gap-1.5 px-2 py-1 text-left font-sans text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
            >
              <ChevronRightIcon
                className={cn(
                  "size-3.5 transition-transform duration-200",
                  isExpanded && "rotate-90"
                )}
              />
              {isExpanded ? "Hide" : "Show"} {row.block.lines.length} unchanged
              lines
            </button>
          </td>
        </tr>
      )
    }
    if (row.kind === "split") {
      return (
        <tr
          key={rowKey(row)}
          data-row-key={rowKey(row)}
          aria-rowindex={rowIndex}
          style={{ height: LINE_HEIGHT }}
        >
          <SplitSide
            line={row.pair.old}
            renderLine={renderLine}
            renderGutter={renderGutter}
          />
          <SplitSide
            line={row.pair.new}
            renderLine={renderLine}
            renderGutter={renderGutter}
          />
        </tr>
      )
    }
    const { line } = row
    return (
      <tr
        key={rowKey(row)}
        data-row-key={rowKey(row)}
        aria-rowindex={rowIndex}
        style={{ height: LINE_HEIGHT }}
        className={LINE_CLASSES[line.type]}
      >
        <GutterCell line={line} renderGutter={renderGutter} />
        <td className={NUMBER_CLASS}>{line.oldNumber}</td>
        <td className={NUMBER_CLASS}>{line.newNumber}</td>
        <LineCell line={line} renderLine={renderLine} />
      </tr>
    )
  }

  // Rendered rows with spacers standing in for the rows skipped between them.
  const body: React.ReactNode[] = []
  let next = 0
  for (const index of rendered) {
    if (offsets[index] > offsets[next]) {
      body.push(
        <tr
          key={`gap-${next}`}
          aria-hidden
          style={{ height: offsets[index] - offsets[next] }}
        />
      )
    }
    body.push(renderRow(rows[index], index))
    next = index + 1
  }
  if (offsets[rows.length] > offsets[next]) {
    body.push(
      <tr
        key={`gap-${next}`}
        aria-hidden
        style={{ height: offsets[rows.length] - offsets[next] }}
      />
    )
  }

  const gutterCol = renderGutter ? <col className="w-8" /> : null
  // Number column, sign and padding around the widest line.
  const contentWidth = `calc(${widest + 2}ch + 1rem)`
  const tableWidth =
    mode === "split"
      ? `max(100%, calc(2 * (${renderGutter ? "5rem" : "3rem"} + ${contentWidth})))`
      : `max(100%, calc(${renderGutter ? "8rem" : "6rem"} + ${contentWidth}))`

  return (
    <div
      ref={containerRef}
      data-slot="diff-viewer"
      data-mode={mode}
      className={cn(
        "overflow-auto rounded-lg border font-mono text-xs leading-5 [tab-size:4]",
        isVirtual && "max-h-[32rem]",
        className
      )}
      onScroll={(event) => {
        onScroll?.(event)
        if (isVirtual) {
          setViewport({
            top: event.currentTarget.scrollTop,
            height: event.currentTarget.clientHeight,
          })
        }
      }}
      {...props}
    >
      <table
        aria-label={ariaLabel}
        aria-rowcount={isVirtual ? rows.length + 1 : undefined}
        className="table-fixed"
        style={{ width: tableWidth }}
      >
        <caption className="sr-only">
          {addedCount === 0 && removedCount === 0
            ? "No changes"
            : `${lineCount(addedCount)} added, ${lineCount(removedCount)} removed`}
        </caption>
        <colgroup>
          {mode === "split" ? (
            <>
              {gutterCol}
              <col className="w-12" />
              <col />
              {gutterCol}
              <col className="w-12" />
              <col />
            </>
          ) : (
            <>
              {gutterCol}
              <col className="w-12" />
              <col className="w-12" />
              <col />
            </>
          )}
        </colgroup>
        <thead className="sr-only">
          <tr aria-rowindex={isVirtual ? 1 : undefined}>
            {mode === "split" ? (
              <>
                {renderGutter && <th scope="col">Old line actions</th>}
                <th scope="col">Old line number</th>
                <th scope="col">Old content</th>
                {renderGutter && <th scope="col">New line actions</th>}
                <th scope="col">New line number</th>
                <th scope="col">New content</th>
              </>
            ) : (
              <>
                {renderGutter && <th scope="col">Line actions</th>}
                <th scope="col">Old line number</th>
                <th scope="col">New line number</th>
                <th scope="col">Content</th>
              </>
            )}
          </tr>
        </thead>
        <tbody
          onFocus={(event) => {
            const row = (event.target as HTMLElement).closest<HTMLElement>(
              "tr[data-row-key]"
            )
            setFocusedKey(row?.dataset.rowKey ?? null)
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setFocusedKey(null)
            }
          }}
        >
          {body}
        </tbody>
      </table>
    </div>
  )
}

export { DiffViewer, type DiffMode, type RenderLine }
