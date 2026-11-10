"use client"

import * as React from "react"
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  MinusIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"

import { cn } from "@/registry/default/lib/utils"
import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  filterTransferItems,
  getNavigationTarget,
  getTransferAnnouncement,
  moveItems,
  partitionItems,
  selectRange,
  type TransferItem,
} from "@/registry/default/lib/transfer-list.ts"
import { Button } from "@/registry/default/ui/button"
import { Input } from "@/registry/default/ui/input"

function SelectionMark({
  checked,
  indeterminate,
}: {
  checked: boolean
  indeterminate?: boolean
}) {
  return (
    <span
      data-checked={checked ? "" : undefined}
      className="flex size-4 shrink-0 items-center justify-center rounded-lg border border-input transition-colors data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground"
    >
      {checked && <CheckIcon className="size-3 stroke-3" />}
      {indeterminate && !checked && (
        <MinusIcon className="size-3 stroke-3 text-foreground" />
      )}
    </span>
  )
}

function useTransferSide<T extends TransferItem>(items: T[]) {
  const [checkedIds, setCheckedIds] = React.useState<string[]>([])
  const [query, setQuery] = React.useState("")

  const visibleItems = filterTransferItems(items, query)
  const enabledIds = visibleItems
    .filter((item) => !item.disabled)
    .map((item) => item.id)
  const movableIds = enabledIds.filter((id) => checkedIds.includes(id))

  return {
    checkedIds,
    setCheckedIds,
    query,
    setQuery,
    visibleItems,
    enabledIds,
    movableIds,
  }
}

interface TransferPanelProps<T extends TransferItem> {
  title: string
  side: ReturnType<typeof useTransferSide<T>>
  searchable: boolean
  showSelectAll: boolean
  disabled: boolean
  renderItem?: (item: T) => React.ReactNode
  onItemMove: (id: string) => void
}

function TransferPanel<T extends TransferItem>({
  title,
  side,
  searchable,
  showSelectAll,
  disabled,
  renderItem,
  onItemMove,
}: TransferPanelProps<T>) {
  const {
    checkedIds,
    setCheckedIds,
    query,
    setQuery,
    visibleItems,
    enabledIds,
    movableIds,
  } = side
  const [anchorId, setAnchorId] = React.useState<string | null>(null)
  const [focusedId, setFocusedId] = React.useState<string | null>(null)
  const listRef = React.useRef<HTMLUListElement>(null)

  const tabStopId =
    focusedId && enabledIds.includes(focusedId) ? focusedId : enabledIds[0]
  const isAllChecked =
    enabledIds.length > 0 && movableIds.length === enabledIds.length
  const isSomeChecked = movableIds.length > 0 && !isAllChecked

  function handleToggleAll() {
    setCheckedIds((current) =>
      isAllChecked
        ? current.filter((id) => !enabledIds.includes(id))
        : Array.from(new Set([...current, ...enabledIds]))
    )
  }

  function toggleItem(id: string, extendRange: boolean) {
    if (extendRange && anchorId) {
      setCheckedIds(selectRange(enabledIds, anchorId, id, checkedIds))
    } else {
      setCheckedIds((current) =>
        current.includes(id)
          ? current.filter((checkedId) => checkedId !== id)
          : [...current, id]
      )
    }
    setAnchorId(id)
  }

  function handleItemKeyDown(event: React.KeyboardEvent, id: string) {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault()
      toggleItem(id, event.shiftKey)
      return
    }

    const nextId = getNavigationTarget(enabledIds, id, event.key)
    if (!nextId) return

    event.preventDefault()
    if (event.shiftKey) {
      setCheckedIds(selectRange(enabledIds, id, nextId, checkedIds))
      setAnchorId(nextId)
    }
    listRef.current
      ?.querySelectorAll<HTMLElement>(
        '[role="option"]:not([aria-disabled="true"])'
      )
      [enabledIds.indexOf(nextId)]?.focus()
  }

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-1 flex-col rounded-lg border border-border bg-card text-card-foreground shadow-xs transition-opacity",
        disabled && "opacity-60"
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {showSelectAll && (
            <button
              type="button"
              role="checkbox"
              aria-checked={isSomeChecked ? "mixed" : isAllChecked}
              aria-label={`Select all ${title}`}
              disabled={disabled || enabledIds.length === 0}
              onClick={handleToggleAll}
              className="flex items-center justify-center rounded p-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <SelectionMark
                checked={isAllChecked}
                indeterminate={isSomeChecked}
              />
            </button>
          )}
          <span className="truncate text-sm font-medium">{title}</span>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {movableIds.length} / {visibleItems.length}
        </span>
      </div>

      {searchable && (
        <div className="relative border-b border-border p-2">
          <SearchIcon className="absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label={`Search ${title}`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.preventDefault()
            }}
            placeholder={`Search ${title.toLowerCase()}...`}
            disabled={disabled}
            className="h-control-sm pr-7 pl-8 text-xs md:text-xs"
          />
          {query && (
            <button
              type="button"
              aria-label={`Clear search ${title}`}
              disabled={disabled}
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-3.5 -translate-y-1/2 rounded text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <XIcon className="size-3" />
            </button>
          )}
        </div>
      )}

      <ul
        ref={listRef}
        role="listbox"
        aria-multiselectable="true"
        aria-label={title}
        className="h-64 overflow-y-auto p-1.5"
      >
        {visibleItems.length === 0 ? (
          <li
            role="presentation"
            className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground"
          >
            No items
          </li>
        ) : (
          visibleItems.map((item) => {
            const isChecked = checkedIds.includes(item.id)
            const isInactive = disabled || item.disabled
            return (
              <li
                key={item.id}
                role="option"
                aria-selected={isChecked}
                aria-disabled={isInactive || undefined}
                tabIndex={
                  isInactive ? undefined : item.id === tabStopId ? 0 : -1
                }
                onFocus={() => setFocusedId(item.id)}
                onClick={(event) => {
                  if (!isInactive) toggleItem(item.id, event.shiftKey)
                }}
                onDoubleClick={() => {
                  if (!isInactive) onItemMove(item.id)
                }}
                onKeyDown={(event) => {
                  if (!isInactive) handleItemKeyDown(event, item.id)
                }}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs transition-colors select-none",
                  isChecked
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted/60",
                  item.disabled &&
                    "cursor-not-allowed opacity-40 hover:bg-transparent",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                )}
              >
                <SelectionMark checked={isChecked} />
                <div className="flex min-w-0 flex-1 flex-col">
                  {renderItem ? (
                    renderItem(item)
                  ) : (
                    <>
                      <span className="truncate font-medium">{item.label}</span>
                      {item.description && (
                        <span className="truncate text-[10px] text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}

export interface TransferListProps<
  T extends TransferItem = TransferItem,
> extends Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> {
  items: T[]
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  titles?: [string, string]
  searchable?: boolean
  showSelectAll?: boolean
  disabled?: boolean
  renderItem?: (item: T) => React.ReactNode
}

export function TransferList<T extends TransferItem = TransferItem>({
  items,
  value,
  defaultValue = [],
  onValueChange,
  titles = ["Available", "Selected"],
  searchable = false,
  showSelectAll = true,
  disabled = false,
  renderItem,
  className,
  ...props
}: TransferListProps<T>) {
  const { value: selectedIds, setValue: setSelectedIds } = useControllableState(
    {
      value,
      defaultValue,
      onChange: onValueChange,
    }
  )
  const [announcement, setAnnouncement] = React.useState("")

  const { sourceItems, targetItems } = partitionItems(items, selectedIds)
  const source = useTransferSide(sourceItems)
  const target = useTransferSide(targetItems)

  function move(ids: string[], direction: "toTarget" | "toSource") {
    const origin = direction === "toTarget" ? source : target
    const destination = direction === "toTarget" ? titles[1] : titles[0]
    const labels = items
      .filter((item) => ids.includes(item.id))
      .map((item) => item.label)

    setSelectedIds(moveItems(selectedIds, ids, direction))
    origin.setCheckedIds((current) => current.filter((id) => !ids.includes(id)))
    setAnnouncement(getTransferAnnouncement(labels, destination))
  }

  const panelProps = { searchable, showSelectAll, disabled, renderItem }

  return (
    <div
      role="group"
      aria-label="Transfer list"
      className={cn("flex flex-col items-center gap-3 sm:flex-row", className)}
      {...props}
    >
      <TransferPanel
        title={titles[0]}
        side={source}
        onItemMove={(id) => move([id], "toTarget")}
        {...panelProps}
      />

      <div className="flex flex-row gap-1 sm:flex-col">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Move all to ${titles[1]}`}
          disabled={disabled || source.enabledIds.length === 0}
          onClick={() => move(source.enabledIds, "toTarget")}
          className="size-control-sm"
        >
          <ChevronsRightIcon className="size-4 rotate-90 sm:rotate-0" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Move selected to ${titles[1]}`}
          disabled={disabled || source.movableIds.length === 0}
          onClick={() => move(source.movableIds, "toTarget")}
          className="size-control-sm"
        >
          <ChevronRightIcon className="size-4 rotate-90 sm:rotate-0" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Move selected to ${titles[0]}`}
          disabled={disabled || target.movableIds.length === 0}
          onClick={() => move(target.movableIds, "toSource")}
          className="size-control-sm"
        >
          <ChevronLeftIcon className="size-4 rotate-90 sm:rotate-0" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Move all to ${titles[0]}`}
          disabled={disabled || target.enabledIds.length === 0}
          onClick={() => move(target.enabledIds, "toSource")}
          className="size-control-sm"
        >
          <ChevronsLeftIcon className="size-4 rotate-90 sm:rotate-0" />
        </Button>
      </div>

      <TransferPanel
        title={titles[1]}
        side={target}
        onItemMove={(id) => move([id], "toSource")}
        {...panelProps}
      />

      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  )
}
