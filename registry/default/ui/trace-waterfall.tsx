"use client"

import * as React from "react"
import { ChevronRightIcon, TriangleAlertIcon, XIcon } from "lucide-react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  buildSpanTree,
  calculateTimeTicks,
  calculateTraceBounds,
  findParentRowIndex,
  flattenSpanTree,
  formatDuration,
  getServiceColors,
  stepSpanRow,
  type Span,
  type TimeTick,
  type TraceBounds,
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
  showSpanDetails?: boolean
}

const ERROR_STRIPES =
  "bg-[repeating-linear-gradient(135deg,transparent_0_3px,color-mix(in_oklab,var(--color-background)_40%,transparent)_3px_5px)]"

function breakableName(name: string) {
  return name
    .split(/(?<=[./_:-])/)
    .flatMap((part, index) =>
      index === 0 ? [part] : [<wbr key={index} />, part]
    )
}

function tickAlignment(tick: TimeTick) {
  if (tick.percent === 0) return "translate-x-0"
  if (tick.percent > 92) return "-translate-x-full"
  return "-translate-x-1/2"
}

function GridLines({ ticks }: { ticks: TimeTick[] }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {ticks.map((tick) => (
        <div
          key={tick.time}
          style={{ left: `${tick.percent}%` }}
          className="absolute inset-y-0 border-l border-dashed border-border/60"
        />
      ))}
    </div>
  )
}

function SpanDetails({
  span,
  bounds,
  swatchClass,
  formatTime,
  onClose,
}: {
  span: Span
  bounds: TraceBounds
  swatchClass?: string
  formatTime: (ms: number) => string
  onClose: () => void
}) {
  const offset = Math.max(0, span.start - bounds.minStart)
  const share = Math.round((span.duration / bounds.totalDuration) * 1000) / 10
  const attributes = Object.entries(span.attributes ?? {})
  const fields: [string, React.ReactNode][] = [
    ["Duration", formatTime(span.duration)],
    ["Share of trace", `${share}%`],
    ["Starts at", `+${formatTime(offset)}`],
    ["Status", span.status ?? "unset"],
    ["Span ID", span.id],
  ]

  return (
    <section
      aria-label={`Details for ${span.name}`}
      className="border-t border-border bg-muted/30 px-4 py-3"
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-sm font-medium">{span.name}</p>
          {span.service && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("size-2 rounded-[2px]", swatchClass)} />
              {span.service}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close span details"
          className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-5">
        {fields.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-muted-foreground">{label}</dt>
            <dd
              className={cn(
                "font-mono wrap-break-word",
                label === "Status" &&
                  span.status === "error" &&
                  "text-destructive"
              )}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {attributes.length > 0 && (
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-border pt-3 font-mono text-xs">
          {attributes.map(([key, value]) => (
            <React.Fragment key={key}>
              <dt className="text-muted-foreground">{key}</dt>
              <dd className="min-w-0 break-all">{String(value)}</dd>
            </React.Fragment>
          ))}
        </dl>
      )}
    </section>
  )
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
  showSpanDetails = true,
  className,
  ...props
}: TraceWaterfallProps) {
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
  const serviceColors = React.useMemo(() => getServiceColors(spans), [spans])
  const ticks = React.useMemo(
    () => calculateTimeTicks(bounds.totalDuration, 5),
    [bounds.totalDuration]
  )

  const rows = React.useMemo(
    () => flattenSpanTree(tree, expandedSet, bounds, serviceColors),
    [tree, expandedSet, bounds, serviceColors]
  )

  const errorCount = spans.filter((s) => s.status === "error").length
  const rootSpan = tree[0]?.span
  const selectedSpan = spans.find((s) => s.id === selectionState.value) ?? null

  const [focusedId, setFocusedId] = React.useState<string | null>(null)
  const rowRefs = React.useRef(new Map<string, HTMLDivElement>())

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

  function toggleSelected(id: string) {
    selectionState.setValue(selectionState.value === id ? null : id)
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
        toggleSelected(row.span.id)
        break
    }
  }

  return (
    <div
      role="region"
      aria-label="Trace waterfall"
      data-slot="trace-waterfall"
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-lg border border-border bg-card text-sm text-card-foreground",
        className
      )}
      {...props}
    >
      {rootSpan && (
        <div className="flex flex-col gap-2 border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="truncate font-mono text-sm font-medium">
              {rootSpan.name}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatTime(bounds.totalDuration)} · {spans.length}{" "}
              {spans.length === 1 ? "span" : "spans"} · {serviceColors.size}{" "}
              {serviceColors.size === 1 ? "service" : "services"}
              {errorCount > 0 && (
                <span className="text-destructive">
                  {" "}
                  · {errorCount} {errorCount === 1 ? "error" : "errors"}
                </span>
              )}
            </span>
          </div>
          {serviceColors.size > 0 && (
            <ul
              aria-label="Services"
              className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground"
            >
              {Array.from(serviceColors, ([service, colorClass]) => (
                <li key={service} className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={cn("size-2 rounded-[2px]", colorClass)}
                  />
                  {service}
                </li>
              ))}
              {errorCount > 0 && (
                <li className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-2 w-3 rounded-[2px] bg-destructive",
                      ERROR_STRIPES
                    )}
                  />
                  error
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {showTimeAxis && (
        <div className="flex border-b border-border bg-muted/40 text-[11px] text-muted-foreground select-none">
          <div className="w-2/5 shrink-0 border-r border-border px-3 py-1.5 font-medium">
            Span
          </div>
          <div className="min-w-0 flex-1 px-4 py-1.5">
            <div className="relative h-4">
              {ticks.map((tick) => (
                <span
                  key={tick.time}
                  style={{ left: `${tick.percent}%` }}
                  className={cn(
                    "absolute top-0 font-mono whitespace-nowrap tabular-nums",
                    tickAlignment(tick)
                  )}
                >
                  {formatTime(tick.time)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div role="tree" aria-label="Trace spans">
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            No spans available
          </div>
        ) : (
          rows.map((row, index) => {
            const isSelected = selectionState.value === row.span.id
            const isFocused = activeFocusId === row.span.id
            const isError = row.span.status === "error"

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
                  toggleSelected(row.span.id)
                }}
                className={cn(
                  "group flex min-h-10 cursor-pointer transition-colors outline-none hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  isSelected &&
                    "bg-accent shadow-[inset_2px_0_0_var(--color-primary)] hover:bg-accent"
                )}
              >
                <div className="flex w-2/5 min-w-0 shrink-0 items-start border-r border-border pr-3 pl-2">
                  {Array.from({ length: row.depth }, (_, level) => (
                    <span
                      key={level}
                      aria-hidden="true"
                      className="relative w-4 shrink-0 self-stretch before:absolute before:inset-y-0 before:left-2 before:border-l before:border-border"
                    />
                  ))}

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
                      className="mt-2 flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
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

                  <div className="ml-1.5 flex min-w-0 flex-1 flex-col py-1.5">
                    <span className="flex min-w-0 items-center gap-1.5">
                      {isError && (
                        <TriangleAlertIcon
                          className="size-3.5 shrink-0 text-destructive"
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className={cn(
                          "min-w-0 font-mono text-xs wrap-break-word",
                          isSelected && "font-medium",
                          isError && "text-destructive"
                        )}
                      >
                        {breakableName(row.span.name)}
                      </span>
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                      {row.span.service && (
                        <>
                          <span
                            aria-hidden="true"
                            className={cn(
                              "size-1.5 shrink-0 rounded-full",
                              serviceColors.get(row.span.service)
                            )}
                          />
                          <span className="truncate">{row.span.service}</span>
                        </>
                      )}
                      <span className="ml-auto shrink-0 pl-2 font-mono tabular-nums">
                        {formatTime(row.span.duration)}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="relative min-w-0 flex-1 px-4">
                  <div className="relative h-full">
                    {showGridLines && <GridLines ticks={ticks} />}

                    <div
                      aria-hidden="true"
                      title={row.accessibleLabel}
                      style={{
                        left: `${row.leftPercent}%`,
                        width: `max(${row.widthPercent}%, ${minBarWidth}px)`,
                      }}
                      className={cn(
                        "absolute top-1/2 h-3 -translate-y-1/2 rounded-[3px] transition-[filter] group-hover:brightness-110",
                        row.colorClass,
                        isError && ERROR_STRIPES,
                        isSelected &&
                          "ring-2 ring-foreground/50 ring-offset-1 ring-offset-card"
                      )}
                    />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {showSpanDetails && selectedSpan && (
        <SpanDetails
          span={selectedSpan}
          bounds={bounds}
          swatchClass={
            selectedSpan.service
              ? serviceColors.get(selectedSpan.service)
              : undefined
          }
          formatTime={formatTime}
          onClose={() => selectionState.setValue(null)}
        />
      )}
    </div>
  )
}
