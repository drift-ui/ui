"use client"

import * as React from "react"
import {
  CheckIcon,
  ChevronRightIcon,
  LoaderIcon,
  MinusIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  checkedStates,
  flattenTree,
  stepNode,
  toggleChecked,
  type NodeRow,
} from "@/registry/default/lib/tree-view-utils"
import { cn } from "@/registry/default/lib/utils"
import {
  rowOffsets,
  scrollTopToReveal,
  visibleRange,
} from "@/registry/default/lib/virtual-list-utils"

type TreeNode = {
  id: string
  label: React.ReactNode
  textValue?: string
  icon?: React.ReactNode
  children?: TreeNode[]
  isBranch?: boolean
  disabled?: boolean
}

type SingleSelection = {
  multiple?: false
  selected?: string | null
  defaultSelected?: string | null
  onSelectedChange?: (id: string) => void
}

type MultipleSelection = {
  multiple: true
  selected?: string[]
  defaultSelected?: string[]
  onSelectedChange?: (ids: string[]) => void
}

type TreeViewProps = Omit<
  React.ComponentProps<"ul">,
  "children" | "defaultValue"
> & {
  items: TreeNode[]
  expanded?: string[]
  defaultExpanded?: string[]
  onExpandedChange?: (expanded: string[]) => void
  loadChildren?: (node: TreeNode) => Promise<unknown>
  virtual?: boolean
} & (SingleSelection | MultipleSelection)

const TYPEAHEAD_RESET_MS = 500
const ROW_HEIGHT_PX = 32
const OVERSCAN_ROWS = 8

function textOf(node: TreeNode) {
  return (
    node.textValue ?? (typeof node.label === "string" ? node.label : "")
  ).toLowerCase()
}

function without(set: ReadonlySet<string>, id: string) {
  if (!set.has(id)) return set
  const next = new Set(set)
  next.delete(id)
  return next
}

function TreeView({
  items,
  expanded,
  defaultExpanded = [],
  onExpandedChange,
  multiple = false,
  selected,
  defaultSelected,
  onSelectedChange,
  loadChildren,
  virtual = false,
  className,
  ref,
  onScroll,
  ...props
}: TreeViewProps) {
  const expandedState = useControllableState({
    value: expanded,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
  })
  const selection = useControllableState<string | string[] | null>({
    value: selected,
    defaultValue: defaultSelected ?? (multiple ? [] : null),
    onChange: onSelectedChange as (value: string | string[] | null) => void,
  })
  const [focusedId, setFocusedId] = React.useState<string | null>(null)
  const [failed, setFailed] = React.useState<ReadonlySet<string>>(new Set())
  const [viewport, setViewport] = React.useState({ top: 0, height: 0 })
  const listRef = React.useRef<HTMLUListElement>(null)
  const itemRefs = React.useRef(new Map<string, HTMLLIElement>())
  const requested = React.useRef(new Map<string, object>())
  const pendingFocus = React.useRef(false)
  const typeahead = React.useRef({ query: "", lastKeyAt: 0 })
  const statusId = React.useId()

  const expandedIds = expandedState.value
  const expandedSet = React.useMemo(() => new Set(expandedIds), [expandedIds])
  const rows = React.useMemo(
    () => flattenTree(items, expandedSet, failed),
    [items, expandedSet, failed]
  )
  const checkedIds = multiple ? (selection.value as string[]) : null
  const checked = React.useMemo(
    () => checkedIds && checkedStates(items, new Set(checkedIds)),
    [items, checkedIds]
  )
  const selectedId = multiple ? null : (selection.value as string | null)
  const offsets = React.useMemo(
    () => (virtual ? rowOffsets(rows.length, () => ROW_HEIGHT_PX) : []),
    [virtual, rows.length]
  )

  const indexOf = (id: string | null) =>
    id === null
      ? -1
      : rows.findIndex((row) => !row.status && row.node.id === id)
  const focusedIndex = indexOf(focusedId)
  const selectedIndex = indexOf(selectedId)
  const tabStopIndex =
    focusedIndex !== -1
      ? focusedIndex
      : selectedIndex !== -1
        ? selectedIndex
        : stepNode(rows, -1, 1)

  let rendered = rows.map((_, index) => index)
  if (virtual) {
    const { first, last } = visibleRange(offsets, viewport.top, viewport.height)
    const start = Math.max(0, first - OVERSCAN_ROWS)
    const end = Math.min(rows.length - 1, last + OVERSCAN_ROWS)
    rendered = rendered.slice(start, end + 1)
    if (tabStopIndex !== -1 && (tabStopIndex < start || tabStopIndex > end)) {
      rendered.push(tabStopIndex)
    }
  }

  React.useImperativeHandle(ref, () => listRef.current as HTMLUListElement)

  React.useEffect(() => {
    if (!loadChildren) return
    for (const row of rows) {
      if (row.status !== "loading" || requested.current.has(row.node.id)) {
        continue
      }
      const { id } = row.node
      const request = {}
      requested.current.set(id, request)
      new Promise((resolve) => resolve(loadChildren(row.node))).catch(() => {
        if (requested.current.get(id) !== request) return
        requested.current.delete(id)
        setFailed((current) => new Set(current).add(id))
      })
    }
  }, [rows, loadChildren])

  const syncViewport = React.useCallback(() => {
    const list = listRef.current
    if (!list) return
    const { scrollTop: top, clientHeight: height } = list
    setViewport((current) =>
      Math.floor(current.top / ROW_HEIGHT_PX) ===
        Math.floor(top / ROW_HEIGHT_PX) && current.height === height
        ? current
        : { top, height }
    )
  }, [])

  React.useLayoutEffect(() => {
    const list = listRef.current
    if (!virtual || !list) return
    syncViewport()
    const observer = new ResizeObserver(syncViewport)
    observer.observe(list)
    return () => observer.disconnect()
  }, [virtual, syncViewport])

  React.useLayoutEffect(() => {
    if (!pendingFocus.current || focusedId === null) return
    pendingFocus.current = false
    itemRefs.current.get(focusedId)?.focus({ preventScroll: true })
  })

  function setExpanded(id: string, open: boolean) {
    if (open === expandedSet.has(id)) return
    if (!open) {
      requested.current.delete(id)
      setFailed((current) => without(current, id))
    }
    expandedState.setValue(
      open
        ? [...expandedIds, id]
        : expandedIds.filter((expandedId) => expandedId !== id)
    )
  }

  function retry(id: string) {
    requested.current.delete(id)
    setFailed((current) => without(current, id))
  }

  function activate(row: NodeRow<TreeNode>, key: "click" | "Enter" | " ") {
    if (row.node.disabled) return
    if (multiple) {
      if (row.isBranch && key !== " ")
        setExpanded(row.node.id, !expandedSet.has(row.node.id))
      else check(row.node.id)
      return
    }
    selection.setValue(row.node.id)
    if (row.isBranch && key !== " ") {
      setExpanded(row.node.id, !expandedSet.has(row.node.id))
    }
  }

  function check(id: string) {
    selection.setValue(toggleChecked(items, checkedIds ?? [], id))
  }

  function focusRow(index: number) {
    const row = rows[index]
    if (index === -1 || !row || row.status) return
    const list = listRef.current
    if (virtual && list) {
      list.scrollTop = scrollTopToReveal(
        offsets,
        index,
        list.scrollTop,
        list.clientHeight
      )
    }
    pendingFocus.current = true
    setFocusedId(row.node.id)
    itemRefs.current.get(row.node.id)?.focus({ preventScroll: virtual })
  }

  function focusByTypeahead(
    key: string,
    fromIndex: number,
    keyPressedAtMs: number
  ) {
    const state = typeahead.current
    state.query =
      keyPressedAtMs - state.lastKeyAt > TYPEAHEAD_RESET_MS
        ? key
        : state.query + key
    state.lastKeyAt = keyPressedAtMs
    const searchStart = state.query.length > 1 ? fromIndex : fromIndex + 1
    for (let offset = 0; offset < rows.length; offset++) {
      const index = (searchStart + offset) % rows.length
      const row = rows[index]
      if (!row.status && textOf(row.node).startsWith(state.query)) {
        focusRow(index)
        return
      }
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLLIElement>,
    index: number
  ) {
    const row = rows[index] as NodeRow<TreeNode>
    const isExpanded = expandedSet.has(row.node.id)

    switch (event.key) {
      case "ArrowDown":
        focusRow(stepNode(rows, index, 1))
        break
      case "ArrowUp":
        focusRow(stepNode(rows, index, -1))
        break
      case "ArrowRight":
        if (!row.isBranch) return
        if (!isExpanded) setExpanded(row.node.id, true)
        else if (failed.has(row.node.id)) retry(row.node.id)
        else if (row.node.children?.length) focusRow(index + 1)
        break
      case "ArrowLeft":
        if (row.isBranch && isExpanded) setExpanded(row.node.id, false)
        else focusRow(indexOf(row.parentId))
        break
      case "Home":
        focusRow(stepNode(rows, -1, 1))
        break
      case "End":
        focusRow(stepNode(rows, rows.length, -1))
        break
      case "Enter":
      case " ":
        activate(row, event.key)
        break
      default:
        if (
          event.key.length !== 1 ||
          event.metaKey ||
          event.ctrlKey ||
          event.altKey
        )
          return
        focusByTypeahead(event.key.toLowerCase(), index, event.timeStamp)
    }
    event.preventDefault()
  }

  function positionOf(index: number, depth: number): React.CSSProperties {
    const indent = { paddingLeft: `calc(${depth} * 1rem + 0.5rem)` }
    if (!virtual) return indent
    return {
      ...indent,
      position: "absolute",
      insetInline: 0,
      top: 0,
      height: ROW_HEIGHT_PX,
      transform: `translateY(${offsets[index]}px)`,
    }
  }

  return (
    <ul
      ref={listRef}
      role="tree"
      data-slot="tree-view"
      aria-multiselectable={multiple || undefined}
      onScroll={(event) => {
        onScroll?.(event)
        if (virtual) syncViewport()
      }}
      className={cn(
        "flex flex-col gap-px text-sm",
        virtual && "relative overflow-y-auto [overflow-anchor:none]",
        className
      )}
      {...props}
    >
      {virtual && (
        <li
          role="none"
          className="shrink-0"
          style={{ height: offsets[rows.length] }}
        />
      )}
      {rendered.map((index) => {
        const row = rows[index]

        if (row.status) {
          return (
            <li
              key={`${row.node.id}\u0000status`}
              id={`${statusId}-${index}`}
              role="none"
              data-slot="tree-view-status"
              data-status={row.status}
              style={positionOf(index, row.depth)}
              className="flex h-8 items-center gap-1.5 text-muted-foreground [&_svg]:size-4"
            >
              {row.status === "loading" ? (
                <>
                  <LoaderIcon className="animate-spin" />
                  Loading
                </>
              ) : (
                <>
                  <TriangleAlertIcon className="text-destructive" />
                  Couldn&apos;t load
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => retry(row.node.id)}
                    className="rounded-sm px-1 font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Retry
                  </button>
                </>
              )}
            </li>
          )
        }

        const { node } = row
        const isExpanded = row.isBranch && expandedSet.has(node.id)
        const hasStatus = isExpanded && node.children === undefined
        const checkedState = checked?.get(node.id) ?? false

        return (
          <li
            key={node.id}
            ref={(element) => {
              if (element) itemRefs.current.set(node.id, element)
              else itemRefs.current.delete(node.id)
            }}
            role="treeitem"
            data-slot="tree-view-item"
            aria-level={row.depth + 1}
            aria-posinset={row.position}
            aria-setsize={row.siblingCount}
            aria-expanded={row.isBranch ? isExpanded : undefined}
            aria-selected={multiple ? undefined : selectedId === node.id}
            aria-checked={
              multiple
                ? checkedState === "mixed"
                  ? "mixed"
                  : checkedState
                : undefined
            }
            aria-disabled={node.disabled || undefined}
            aria-busy={(hasStatus && !failed.has(node.id)) || undefined}
            aria-describedby={
              hasStatus ? `${statusId}-${index + 1}` : undefined
            }
            tabIndex={index === tabStopIndex ? 0 : -1}
            onFocus={() => setFocusedId(node.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onClick={() => activate(row, "click")}
            style={positionOf(index, row.depth)}
            className={cn(
              "flex h-8 cursor-default items-center gap-1.5 rounded-md pr-2 outline-none select-none",
              "hover:bg-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/50",
              virtual && "focus-visible:ring-inset",
              "aria-selected:bg-accent aria-selected:font-medium aria-selected:text-accent-foreground",
              "aria-disabled:pointer-events-none aria-disabled:opacity-50",
              "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground"
            )}
          >
            {row.isBranch ? (
              <ChevronRightIcon
                className={cn(
                  "transition-transform duration-200",
                  isExpanded && "rotate-90"
                )}
              />
            ) : (
              <span className="size-4 shrink-0" />
            )}
            {multiple && (
              <span
                aria-hidden
                data-slot="tree-view-checkbox"
                data-state={
                  checkedState === "mixed"
                    ? "indeterminate"
                    : checkedState
                      ? "checked"
                      : "unchecked"
                }
                onClick={(event) => {
                  event.stopPropagation()
                  if (!node.disabled) check(node.id)
                }}
                className="flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input shadow-xs data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary dark:bg-input/30 dark:data-[state=checked]:bg-primary dark:data-[state=indeterminate]:bg-primary"
              >
                {checkedState === "mixed" ? (
                  <MinusIcon className="size-3.5! text-primary-foreground!" />
                ) : checkedState ? (
                  <CheckIcon className="size-3.5! text-primary-foreground!" />
                ) : null}
              </span>
            )}
            {node.icon}
            <span className="truncate">{node.label}</span>
          </li>
        )
      })}
    </ul>
  )
}

export { TreeView, type TreeNode }
