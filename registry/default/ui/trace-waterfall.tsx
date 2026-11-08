"use client"

import * as React from "react"
import { ChevronRightIcon, TriangleAlertIcon } from "lucide-react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  buildSpanTree,
  calculateTimeTicks,
  calculateTraceBounds,
  findParentRowIndex,
  flattenSpanTree,
  formatDuration,
  stepSpanRow,
  type Span,
} from "@/registry/default/lib/trace-waterfall"
import { cn } from "@/registry/default/lib/utils"

export type { Span, SpanStatus } from "@/registry/default/lib/trace-waterfall"

export type TraceWaterfallProps = Omit<
  React.ComponentProps<"div">,
  "children" | "defaultValue"
> & {
  spans: Span[]
  selectedSpanId?: string | null
  defaultSelectedSpanId?: string | null
  onSpanSelect?: (span: Span | null) => void
  expandedSpanIds?: string[]
  defaultExpandedSpanIds?: string[]
  onExpandedChange?: (expandedIds: string[]) => void
  formatTime?: (ms: number) => string
  minBarWidth?: number
  showTimeAxis?: boolean
  showGridLines?: boolean
}

export function TraceWaterfall({
  spans,
  selectedSpanId,
  defaultSelectedSpanId = null,
  onSpanSelect,
  expandedSpanIds,
  defaultExpandedSpanIds,
  onExpandedChange,
  formatTime = formatDuration,
  minBarWidth = 4,
  showTimeAxis = true,
  showGridLines = true,
  className,
  ...props
}: TraceWaterfallProps) {
  // Compute initial parents for default expansion if not specified
  const initialExpanded = React.useMemo(() => {
    if (defaultExpandedSpanIds !== undefined) return defaultExpandedSpanIds
    const parentIds = new Set<string>()
    for (const span of spans) {
      if (span.parentId) {
        parentIds.add(span.parentId)
      }
    }
    return Array.from(parentIds)
  }, [defaultExpandedSpanIds, spans])

  const expandedState = useControllableState<string[]>({
    value: expandedSpanIds,
    defaultValue: initialExpanded,
    onChange: onExpandedChange,
  })

  const selectionState = useControllableState<string | null>({
    value: selectedSpanId,
    defaultValue: defaultSelectedSpanId,
    onChange: (id) => {
      if (!onSpanSelect) return
      const found = spans.find((s) => s.id === id) ?? null
      onSpanSelect(found)
    },
  })

  const expandedSet = React.useMemo(
    () => new Set(expandedState.value),
    [expandedState.value]
  )

  const tree = React.useMemo(() => buildSpanTree(spans), [spans])
  const bounds = React.useMemo(() => calculateTraceBounds(spans), [spans])
  const ticks = React.useMemo(
    () => calculateTimeTicks(bounds.totalDuration, 5),
    [bounds.totalDuration]
  )

  const rows = React.useMemo(
    () => flattenSpanTree(tree, expandedSet, bounds),
    [tree, expandedSet, bounds]
  )

  const [focusedId, setFocusedId] = React.useState<string | null>(null)
  const rowRefs = React.useRef(new Map<string, HTMLDivElement>())

  // Ensure one item is always focusable
  const activeFocusId =
    focusedId && rows.some((r) => r.span.id === focusedId)
      ? focusedId
      : (rows[0]?.span.id ?? null)

  function toggleExpand(id: string, open?: boolean) {
    const isCurrentlyExpanded = expandedSet.has(id)
    const shouldExpand = open !== undefined ? open : !isCurrentlyExpanded
    if (shouldExpand === isCurrentlyExpanded) return

    const next = shouldExpand
      ? [...expandedState.value, id]
      : expandedState.value.filter((i) => i !== id)
    expandedState.setValue(next)
  }

  function focusRow(index: number) {
    const target = rows[index]
    if (!target) return
    setFocusedId(target.span.id)
    rowRefs.current.get(target.span.id)?.focus()
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>,
    index: number
  ) {
    const row = rows[index]
    if (!row) return

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        focusRow(stepSpanRow(rows, index, 1))
        break
      case "ArrowUp":
        event.preventDefault()
        focusRow(stepSpanRow(rows, index, -1))
        break
      case "ArrowRight":
        event.preventDefault()
        if (row.hasChildren) {
          if (!row.isExpanded) {
            toggleExpand(row.span.id, true)
          } else if (index + 1 < rows.length) {
            focusRow(index + 1)
          }
        }
        break
      case "ArrowLeft":
        event.preventDefault()
        if (row.hasChildren && row.isExpanded) {
          toggleExpand(row.span.id, false)
        } else {
          const parentIndex = findParentRowIndex(rows, index)
          if (parentIndex !== -1) {
            focusRow(parentIndex)
          }
        }
        break
      case "Home":
        event.preventDefault()
        focusRow(0)
        break
      case "End":
        event.preventDefault()
        focusRow(rows.length - 1)
        break
      case "Enter":
      case " ":
        event.preventDefault()
        selectionState.setValue(
          selectionState.value === row.span.id ? null : row.span.id
        )
        break
    }
  }

  return (
    <div
      role="region"
      aria-label="Trace waterfall"
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-md border border-border bg-card text-sm text-card-foreground",
        className
      )}
      {...props}
    >
      {/* Header with Timeline Ruler */}
      {showTimeAxis && (
        <div className="flex border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground select-none">
          <div className="w-5/12 min-w-[220px] shrink-0 border-r border-border px-3 py-2">
            <span>Span / Operation</span>
          </div>
          <div className="relative flex-1 px-3 py-2">
            <div className="relative h-4 w-full">
              {ticks.map((tick, i) => (
                <div
                  key={tick.time}
                  style={{ left: `${tick.percent}%` }}
                  className={cn(
                    "absolute top-0 flex -translate-x-1/2 flex-col items-center",
                    i === 0 && "translate-x-0 items-start",
                    i === ticks.length - 1 && "-translate-x-full items-end"
                  )}
                >
                  <span className="font-mono text-[10px]">
                    {formatTime(tick.time)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Spans Tree / Timeline Body */}
      <div
        role="tree"
        aria-label="Trace spans"
        className="divide-y divide-border/40 overflow-x-auto"
      >
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            No spans available
          </div>
        ) : (
          rows.map((row, index) => {
            const isSelected = selectionState.value === row.span.id
            const isFocused = activeFocusId === row.span.id
            const isZeroDuration = row.span.duration <= 0

            return (
              <div
                key={row.span.id}
                ref={(el) => {
                  if (el) rowRefs.current.set(row.span.id, el)
                  else rowRefs.current.delete(row.span.id)
                }}
                role="treeitem"
                aria-level={row.depth + 1}
                aria-posinset={row.position}
                aria-setsize={row.siblingCount}
                aria-expanded={row.hasChildren ? row.isExpanded : undefined}
                aria-selected={isSelected}
                aria-label={row.accessibleLabel}
                tabIndex={isFocused ? 0 : -1}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onClick={() => {
                  setFocusedId(row.span.id)
                  selectionState.setValue(
                    selectionState.value === row.span.id ? null : row.span.id
                  )
                }}
                className={cn(
                  "group flex cursor-pointer items-center transition-colors hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
                  isSelected && "bg-muted/80 font-medium"
                )}
              >
                {/* Left Tree Column */}
                <div
                  className="flex w-5/12 min-w-[220px] shrink-0 items-center gap-1.5 border-r border-border py-1.5 pr-2"
                  style={{ paddingLeft: `${row.depth * 16 + 8}px` }}
                >
                  {row.hasChildren ? (
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-hidden="true"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFocusedId(row.span.id)
                        rowRefs.current.get(row.span.id)?.focus()
                        toggleExpand(row.span.id)
                      }}
                      className="flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-transform hover:text-foreground"
                    >
                      <ChevronRightIcon
                        className={cn(
                          "size-3.5 transition-transform",
                          row.isExpanded && "rotate-90"
                        )}
                      />
                    </button>
                  ) : (
                    <span className="size-4 shrink-0" aria-hidden="true" />
                  )}

                  {row.span.status === "error" && (
                    <TriangleAlertIcon
                      className="size-3.5 shrink-0 text-destructive"
                      aria-hidden="true"
                    />
                  )}

                  <span
                    className="truncate font-mono text-xs"
                    title={row.span.name}
                  >
                    {row.span.name}
                  </span>

                  {row.span.service && (
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {row.span.service}
                    </span>
                  )}

                  <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">
                    {formatTime(row.span.duration)}
                  </span>
                </div>

                {/* Right Waterfall Column */}
                <div className="relative flex flex-1 items-center self-stretch px-3 py-2">
                  {/* Vertical Alignment Grid Lines */}
                  {showGridLines && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 w-full"
                    >
                      {ticks.map((tick) => (
                        <div
                          key={tick.time}
                          style={{ left: `${tick.percent}%` }}
                          className="absolute top-0 bottom-0 border-r border-dashed border-border/40"
                        />
                      ))}
                    </div>
                  )}

                  {/* Span Timing Bar */}
                  <div
                    aria-hidden="true"
                    title={row.accessibleLabel}
                    style={{
                      left: `${row.leftPercent}%`,
                      width: `max(${row.widthPercent}%, ${minBarWidth}px)`,
                    }}
                    className={cn(
                      "relative h-4 rounded-sm shadow-xs transition-opacity group-hover:opacity-90",
                      row.colorClass,
                      isZeroDuration &&
                        "min-w-[4px] shadow-none ring-1 ring-border"
                    )}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
