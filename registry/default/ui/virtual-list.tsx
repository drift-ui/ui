"use client"

import * as React from "react"

import { cn } from "@/registry/default/lib/utils"
import {
  nextRowIndex,
  rowOffsets,
  scrollTopToReveal,
  visibleRange,
} from "@/registry/default/lib/virtual-list-utils"

function indexKey(_: unknown, index: number): React.Key {
  return index
}

function anchorPosition(container: HTMLElement, offsets: number[]) {
  const { scrollTop, clientHeight } = container
  const focused = container.querySelector<HTMLElement>(
    '[data-slot="virtual-list-row"]:focus-within'
  )
  if (!focused) return scrollTop
  const index = Number(focused.dataset.index)
  const isInView =
    scrollTopToReveal(offsets, index, scrollTop, clientHeight) === scrollTop
  return isInView ? offsets[index] : scrollTop
}

function VirtualRow({
  rowKey,
  onMeasure,
  ...props
}: React.ComponentProps<"div"> & {
  rowKey: React.Key
  onMeasure: (key: React.Key, row: HTMLElement, height: number) => void
}) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    const row = ref.current
    if (!row) return
    const observer = new ResizeObserver(([entry]) => {
      onMeasure(rowKey, row, entry.borderBoxSize[0].blockSize)
    })
    observer.observe(row)
    return () => observer.disconnect()
  }, [rowKey, onMeasure])

  return <div ref={ref} {...props} />
}

function VirtualList<T>({
  items,
  estimateSize,
  overscan = 4,
  getItemKey = indexKey,
  children,
  ref,
  className,
  onScroll,
  onKeyDown,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  items: T[]
  estimateSize: number
  overscan?: number
  getItemKey?: (item: T, index: number) => React.Key
  children: (item: T, index: number) => React.ReactNode
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const pendingFocus = React.useRef(false)
  const pendingReveal = React.useRef(false)
  const pendingScrollDelta = React.useRef(0)
  const [sizes, setSizes] = React.useState(new Map<React.Key, number>())
  const [range, setRange] = React.useState({ first: 0, last: 0 })
  const [activeKey, setActiveKey] = React.useState<React.Key | null>(null)

  const offsets = React.useMemo(
    () =>
      rowOffsets(
        items.length,
        (index) => sizes.get(getItemKey(items[index], index)) ?? estimateSize
      ),
    [items, estimateSize, getItemKey, sizes]
  )
  const latest = React.useRef({ offsets, sizes, estimateSize })

  const activeIndex =
    activeKey === null
      ? -1
      : items.findIndex((item, index) => getItemKey(item, index) === activeKey)
  const start = Math.max(0, range.first - overscan)
  const end = Math.min(items.length - 1, range.last + overscan)
  const rendered = Array.from(
    { length: Math.max(0, end - start + 1) },
    (_, index) => start + index
  )
  if (activeIndex !== -1 && activeIndex < start) rendered.unshift(activeIndex)
  if (activeIndex > end) rendered.push(activeIndex)
  const tabStop = activeIndex === -1 ? range.first : activeIndex

  const syncRange = React.useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const next = visibleRange(
      latest.current.offsets,
      container.scrollTop,
      container.clientHeight
    )
    setRange((previous) =>
      previous.first === next.first && previous.last === next.last
        ? previous
        : next
    )
  }, [])

  const measure = React.useCallback(
    (key: React.Key, row: HTMLElement, height: number) => {
      const container = containerRef.current
      const previous =
        latest.current.sizes.get(key) ?? latest.current.estimateSize
      if (!container || height === 0 || height === previous) return
      const { offsets } = latest.current
      if (
        offsets[Number(row.dataset.index)] < anchorPosition(container, offsets)
      ) {
        pendingScrollDelta.current += height - previous
      }
      if (row === document.activeElement) pendingReveal.current = true
      setSizes((current) => new Map(current).set(key, height))
    },
    []
  )

  React.useImperativeHandle(ref, () => containerRef.current as HTMLDivElement)

  React.useLayoutEffect(() => {
    latest.current = { offsets, sizes, estimateSize }
    const container = containerRef.current
    if (container) {
      container.scrollTop += pendingScrollDelta.current
      pendingScrollDelta.current = 0
    }
    if (container && pendingReveal.current) {
      pendingReveal.current = false
      container.scrollTop = scrollTopToReveal(
        offsets,
        Number((document.activeElement as HTMLElement).dataset.index),
        container.scrollTop,
        container.clientHeight
      )
    }
    syncRange()
  }, [offsets, sizes, estimateSize, syncRange])

  React.useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(syncRange)
    observer.observe(container)
    return () => observer.disconnect()
  }, [syncRange])

  React.useLayoutEffect(() => {
    if (!pendingFocus.current) return
    pendingFocus.current = false
    containerRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.focus({ preventScroll: true })
  }, [activeIndex])

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event)
    const container = containerRef.current
    const row = event.target as HTMLElement
    if (event.defaultPrevented || !container) return
    if (!row.matches('[data-slot="virtual-list-row"]')) return
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return

    const index = Number(row.dataset.index)
    const next = nextRowIndex(offsets, index, event.key, container.clientHeight)
    if (next === null) return
    event.preventDefault()
    if (next === index) return
    container.scrollTop = scrollTopToReveal(
      offsets,
      next,
      container.scrollTop,
      container.clientHeight
    )
    pendingFocus.current = true
    setActiveKey(getItemKey(items[next], next))
  }

  return (
    <div
      ref={containerRef}
      role="list"
      data-slot="virtual-list"
      onScroll={(event) => {
        onScroll?.(event)
        syncRange()
      }}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative overflow-y-auto [overflow-anchor:none]",
        className
      )}
      {...props}
    >
      <div
        className="relative w-full"
        style={{ height: offsets[items.length] }}
      >
        {rendered.map((index) => {
          const key = getItemKey(items[index], index)
          return (
            <VirtualRow
              key={key}
              rowKey={key}
              onMeasure={measure}
              role="listitem"
              data-slot="virtual-list-row"
              data-index={index}
              aria-posinset={index + 1}
              aria-setsize={items.length}
              tabIndex={index === tabStop ? 0 : -1}
              onFocus={() => setActiveKey(key)}
              style={{ transform: `translateY(${offsets[index]}px)` }}
              className="absolute top-0 left-0 w-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
            >
              {children(items[index], index)}
            </VirtualRow>
          )
        })}
      </div>
    </div>
  )
}

export { VirtualList }
