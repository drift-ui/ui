"use client"

import * as React from "react"
import {
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SaveIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react"

import { cn } from "@/registry/default/lib/utils"
import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import { Input } from "@/registry/default/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/default/ui/popover"
import {
  createSavedView,
  deleteSavedView,
  duplicateSavedView,
  getActiveSavedView,
  isViewDirty,
  renameSavedView,
  restoreSavedView,
  setDefaultSavedView,
  type SavedView,
} from "@/registry/default/lib/saved-views"

export type { SavedView }

export type SavedViewAction =
  "create" | "rename" | "duplicate" | "delete" | "setDefault" | "save"

type MaybePromise = void | PromiseLike<unknown>

export interface SavedViewsProps<T = unknown> extends Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onReset" | "onError"
> {
  views?: SavedView<T>[]
  defaultViews?: SavedView<T>[]
  onViewsChange?: (views: SavedView<T>[]) => void

  activeId?: string
  defaultActiveId?: string
  onActiveChange?: (activeId: string) => void

  currentData?: T
  isEqual?: (saved: T | undefined, current: T) => boolean

  isDirty?: boolean
  onSave?: (view: SavedView<T>) => MaybePromise
  onReset?: (view: SavedView<T>) => void

  onCreate?: (view: SavedView<T>) => MaybePromise
  onRename?: (view: SavedView<T>, newName: string) => MaybePromise
  onDuplicate?: (
    newView: SavedView<T>,
    sourceView: SavedView<T>
  ) => MaybePromise
  onDelete?: (deletedViewId: string) => MaybePromise
  onSetDefault?: (defaultViewId: string) => MaybePromise
  onError?: (error: unknown, action: SavedViewAction) => void

  variant?: "tabs" | "select"
  showReset?: boolean
  allowCreate?: boolean
  allowRename?: boolean
  allowDuplicate?: boolean
  allowDelete?: boolean
  allowSetDefault?: boolean
  placeholder?: string
  "aria-label"?: string
}

function SavedViews<T = unknown>({
  views: viewsProp,
  defaultViews = [],
  onViewsChange,
  activeId: activeIdProp,
  defaultActiveId,
  onActiveChange,
  currentData,
  isEqual,
  isDirty: isDirtyProp,
  onSave,
  onReset,
  onCreate,
  onRename,
  onDuplicate,
  onDelete,
  onSetDefault,
  onError,
  variant = "tabs",
  showReset = true,
  allowCreate = true,
  allowRename = true,
  allowDuplicate = true,
  allowDelete = true,
  allowSetDefault = true,
  placeholder = "New view name...",
  "aria-label": ariaLabel = "Saved views",
  className,
  ...props
}: SavedViewsProps<T>) {
  const { value: views, setValue: setViews } = useControllableState<
    SavedView<T>[]
  >({
    value: viewsProp,
    defaultValue: defaultViews,
    onChange: onViewsChange,
  })

  const initialActive = React.useMemo(() => {
    if (defaultActiveId) return defaultActiveId
    const def = views.find((v) => v.isDefault)
    return def ? def.id : (views[0]?.id ?? "")
  }, [defaultActiveId, views])

  const { value: activeId, setValue: setActiveId } =
    useControllableState<string>({
      value: activeIdProp,
      defaultValue: initialActive,
      onChange: onActiveChange,
    })

  const activeView = React.useMemo(
    () => getActiveSavedView(views, activeId),
    [views, activeId]
  )

  const computedDirty = React.useMemo(
    () => isViewDirty(activeView, currentData, isEqual),
    [activeView, currentData, isEqual]
  )
  const isDirty = isDirtyProp ?? computedDirty

  const viewsRef = React.useRef(views)
  const activeIdRef = React.useRef(activeId)
  const settersRef = React.useRef({ setViews, setActiveId })
  React.useLayoutEffect(() => {
    viewsRef.current = views
    activeIdRef.current = activeId
    settersRef.current = { setViews, setActiveId }
  })

  const [pendingIds, setPendingIds] = React.useState<ReadonlySet<string>>(
    () => new Set()
  )
  const [failure, setFailure] = React.useState<string | null>(null)
  const isActivePending = activeView ? pendingIds.has(activeView.id) : false

  function applyViews(next: SavedView<T>[]) {
    viewsRef.current = next
    settersRef.current.setViews(next)
  }

  function applyActive(id: string) {
    activeIdRef.current = id
    settersRef.current.setActiveId(id)
  }

  function track(
    result: MaybePromise,
    {
      action,
      viewId,
      message,
      revert,
    }: {
      action: SavedViewAction
      viewId: string
      message: string
      revert: () => void
    }
  ) {
    setFailure(null)
    if (!result || typeof result.then !== "function") return
    setPendingIds((prev) => new Set(prev).add(viewId))
    const settle = () =>
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(viewId)
        return next
      })
    result.then(settle, (error: unknown) => {
      settle()
      revert()
      setFailure(`${message} The change was undone.`)
      onError?.(error, action)
    })
  }

  const [createOpen, setCreateOpen] = React.useState(false)
  const [selectOpen, setSelectOpen] = React.useState(false)
  const [newViewName, setNewViewName] = React.useState("")
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editingName, setEditingName] = React.useState("")
  const tabRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map())
  const prevEditingIdRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!editingId && prevEditingIdRef.current) {
      tabRefs.current.get(prevEditingIdRef.current)?.focus()
    }
    prevEditingIdRef.current = editingId
  }, [editingId])

  function handleSelect(id: string) {
    setActiveId(id)
    setSelectOpen(false)
  }

  function handleCreateSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    const name = newViewName.trim() || `View ${views.length + 1}`
    const newView = createSavedView<T>(name, { data: currentData })
    addView(newView, "create", `Couldn't create "${newView.name}".`, () =>
      onCreate?.(newView)
    )
    setNewViewName("")
    setCreateOpen(false)
    setSelectOpen(false)
  }

  function addView(
    newView: SavedView<T>,
    action: "create" | "duplicate",
    message: string,
    persist: () => MaybePromise
  ) {
    const previousActiveId = activeIdRef.current
    applyViews([...views, newView])
    applyActive(newView.id)
    track(persist(), {
      action,
      viewId: newView.id,
      message,
      revert: () => {
        const reverted = viewsRef.current.filter((v) => v.id !== newView.id)
        applyViews(reverted)
        if (activeIdRef.current === newView.id) {
          const fallback = getActiveSavedView(reverted, previousActiveId)
          if (fallback) applyActive(fallback.id)
        }
      },
    })
  }

  function handleStartRename(view: SavedView<T>) {
    if (pendingIds.has(view.id)) return
    setEditingId(view.id)
    setEditingName(view.name)
  }

  function handleRenameSubmit(id: string) {
    const trimmed = editingName.trim()
    const target = views.find((v) => v.id === id)
    setEditingId(null)
    if (!trimmed || !target || trimmed === target.name) return
    applyViews(renameSavedView(views, id, trimmed))
    track(onRename?.({ ...target, name: trimmed }, trimmed), {
      action: "rename",
      viewId: id,
      message: `Couldn't rename "${target.name}".`,
      revert: () =>
        applyViews(
          viewsRef.current.map((v) =>
            v.id === id && v.name === trimmed ? { ...v, name: target.name } : v
          )
        ),
    })
  }

  function handleDuplicate(view: SavedView<T>) {
    const duplicated = duplicateSavedView(view, views)
    addView(duplicated, "duplicate", `Couldn't duplicate "${view.name}".`, () =>
      onDuplicate?.(duplicated, view)
    )
  }

  function handleDelete(id: string) {
    if (views.length <= 1 || pendingIds.has(id)) return
    const index = views.findIndex((v) => v.id === id)
    const target = views[index]
    if (!target || target.isLocked) return
    const wasActive = activeView?.id === id
    const { views: nextViews, nextActiveId } = deleteSavedView(
      views,
      id,
      activeView?.id
    )
    applyViews(nextViews)
    if (wasActive && nextActiveId) applyActive(nextActiveId)
    track(onDelete?.(id), {
      action: "delete",
      viewId: id,
      message: `Couldn't delete "${target.name}".`,
      revert: () => {
        applyViews(restoreSavedView(viewsRef.current, target, index))
        if (wasActive && activeIdRef.current === nextActiveId) applyActive(id)
      },
    })
  }

  function handleSetDefault(id: string) {
    const target = views.find((v) => v.id === id)
    if (!target || pendingIds.has(id)) return
    const previousDefaultId = views.find((v) => v.isDefault)?.id
    applyViews(setDefaultSavedView(views, id))
    track(onSetDefault?.(id), {
      action: "setDefault",
      viewId: id,
      message: `Couldn't make "${target.name}" the default.`,
      revert: () => {
        const current = viewsRef.current
        if (current.find((v) => v.isDefault)?.id !== id) return
        applyViews(
          current.map((v) => ({ ...v, isDefault: v.id === previousDefaultId }))
        )
      },
    })
  }

  function handleSave() {
    if (!activeView || isActivePending) return
    const previousData = activeView.data
    const toSave =
      currentData !== undefined
        ? { ...activeView, data: currentData }
        : activeView
    if (currentData !== undefined) {
      applyViews(views.map((v) => (v.id === activeView.id ? toSave : v)))
    }
    track(onSave?.(toSave), {
      action: "save",
      viewId: activeView.id,
      message: `Couldn't save "${activeView.name}".`,
      revert: () => {
        if (currentData === undefined) return
        applyViews(
          viewsRef.current.map((v) =>
            v.id === toSave.id && v.data === toSave.data
              ? { ...v, data: previousData }
              : v
          )
        )
      },
    })
  }

  function handleTabKeyDown(
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
    view: SavedView<T>
  ) {
    if (e.key === "F2" && allowRename && !view.isLocked) {
      e.preventDefault()
      handleStartRename(view)
      return
    }

    if (e.key === "ArrowRight") {
      e.preventDefault()
      const nextIndex = (index + 1) % views.length
      const nextView = views[nextIndex]
      if (nextView) {
        setActiveId(nextView.id)
        tabRefs.current.get(nextView.id)?.focus()
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      const prevIndex = (index - 1 + views.length) % views.length
      const prevView = views[prevIndex]
      if (prevView) {
        setActiveId(prevView.id)
        tabRefs.current.get(prevView.id)?.focus()
      }
    } else if (e.key === "Home") {
      e.preventDefault()
      const firstView = views[0]
      if (firstView) {
        setActiveId(firstView.id)
        tabRefs.current.get(firstView.id)?.focus()
      }
    } else if (e.key === "End") {
      e.preventDefault()
      const lastView = views[views.length - 1]
      if (lastView) {
        setActiveId(lastView.id)
        tabRefs.current.get(lastView.id)?.focus()
      }
    }
  }

  const dirtyActions = isDirty && activeView && (
    <div
      data-slot="saved-views-dirty-actions"
      className="flex items-center gap-1.5"
    >
      <Badge
        variant="outline"
        className="border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400"
      >
        Unsaved
      </Badge>
      {showReset && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-xs"
          onClick={() => onReset?.(activeView)}
        >
          <RotateCcwIcon className="size-3.5" />
          Discard
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        className="h-8 gap-1 px-2.5 text-xs shadow-xs aria-disabled:opacity-50 motion-safe:aria-busy:animate-pulse"
        aria-disabled={isActivePending || undefined}
        aria-busy={isActivePending || undefined}
        onClick={handleSave}
      >
        <SaveIcon className="size-3.5" />
        Save
      </Button>
    </div>
  )

  const failureMessage = failure && (
    <div
      data-slot="saved-views-error"
      role="alert"
      className="flex basis-full items-center gap-2 text-xs text-destructive"
    >
      <span>{failure}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 px-1.5 text-xs"
        onClick={() => setFailure(null)}
      >
        Dismiss
      </Button>
    </div>
  )

  if (variant === "select") {
    return (
      <div
        data-slot="saved-views"
        className={cn("flex flex-wrap items-center gap-2", className)}
        {...props}
      >
        <Popover open={selectOpen} onOpenChange={setSelectOpen}>
          <PopoverTrigger
            type="button"
            className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            aria-label={`${ariaLabel}: ${activeView?.name ?? "Select view"}`}
          >
            <span className="flex items-center gap-1.5 font-medium">
              {activeView?.isDefault && (
                <StarIcon
                  className="size-3.5 fill-amber-500 text-amber-500"
                  aria-hidden="true"
                />
              )}
              {activeView?.name ?? "Select view"}
            </span>
            {isDirty && (
              <span
                className="size-2 rounded-full bg-amber-500"
                aria-label="Unsaved changes"
              />
            )}
            <ChevronDownIcon className="size-4 opacity-50" />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-1">
            <div role="listbox" aria-label={ariaLabel} className="space-y-0.5">
              {views.map((view) => {
                const isActive = view.id === activeView?.id
                const isEditing = editingId === view.id

                if (isEditing) {
                  return (
                    <form
                      key={view.id}
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleRenameSubmit(view.id)
                      }}
                      className="flex items-center gap-1 p-1"
                    >
                      <Input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleRenameSubmit(view.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            e.preventDefault()
                            setEditingId(null)
                          }
                        }}
                        className="h-7 text-xs"
                        aria-label="Rename view"
                      />
                    </form>
                  )
                }

                return (
                  <div
                    key={view.id}
                    role="option"
                    aria-selected={isActive}
                    aria-busy={pendingIds.has(view.id) || undefined}
                    data-pending={pendingIds.has(view.id) || undefined}
                    className={cn(
                      "group flex items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground data-pending:opacity-60 motion-safe:data-pending:animate-pulse",
                      isActive && "bg-accent/60 font-medium"
                    )}
                  >
                    <button
                      type="button"
                      className="flex flex-1 items-center gap-2 text-left"
                      onClick={() => handleSelect(view.id)}
                    >
                      {isActive ? (
                        <CheckIcon
                          className="size-3.5 text-primary"
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="size-3.5" aria-hidden="true" />
                      )}
                      <span className="truncate">{view.name}</span>
                      {view.isDefault && (
                        <StarIcon
                          className="size-3 fill-amber-500 text-amber-500"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                    {(allowRename ||
                      allowDuplicate ||
                      allowSetDefault ||
                      allowDelete) && (
                      <ViewOptionsMenu
                        view={view}
                        isOnlyView={views.length <= 1}
                        isPending={pendingIds.has(view.id)}
                        allowRename={allowRename}
                        allowDuplicate={allowDuplicate}
                        allowSetDefault={allowSetDefault}
                        allowDelete={allowDelete}
                        onStartRename={() => handleStartRename(view)}
                        onDuplicate={() => handleDuplicate(view)}
                        onSetDefault={() => handleSetDefault(view.id)}
                        onDelete={() => handleDelete(view.id)}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            {allowCreate && (
              <>
                <div className="my-1 h-px bg-border" />
                <form
                  onSubmit={handleCreateSubmit}
                  className="flex items-center gap-1 p-1"
                >
                  <Input
                    size={1}
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    placeholder={placeholder}
                    className="h-7 text-xs"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    disabled={!newViewName.trim()}
                  >
                    Add
                  </Button>
                </form>
              </>
            )}
          </PopoverContent>
        </Popover>

        {dirtyActions}
        {failureMessage}
      </div>
    )
  }

  return (
    <div
      data-slot="saved-views"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        className
      )}
      {...props}
    >
      <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1">
        <div
          role="tablist"
          aria-label={ariaLabel}
          className="flex items-center gap-1"
        >
          {views.map((view, index) => {
            if (editingId === view.id) return null
            const isActive = view.id === activeView?.id
            return (
              <button
                key={view.id}
                ref={(el) => {
                  if (el) tabRefs.current.set(view.id, el)
                  else tabRefs.current.delete(view.id)
                }}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-busy={pendingIds.has(view.id) || undefined}
                data-pending={pendingIds.has(view.id) || undefined}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleSelect(view.id)}
                onDoubleClick={() => {
                  if (allowRename && !view.isLocked) {
                    handleStartRename(view)
                  }
                }}
                onKeyDown={(e) => handleTabKeyDown(e, index, view)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring data-pending:opacity-60 motion-safe:data-pending:animate-pulse",
                  isActive
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                )}
              >
                {view.isDefault && (
                  <StarIcon
                    className="size-3 fill-amber-500 text-amber-500"
                    aria-hidden="true"
                  />
                )}
                <span>{view.name}</span>
                {isActive && isDirty && (
                  <span
                    className="size-1.5 rounded-full bg-amber-500"
                    aria-label="Unsaved changes"
                  />
                )}
              </button>
            )
          })}
        </div>

        {editingId && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleRenameSubmit(editingId)
            }}
            className="flex items-center px-1"
          >
            <Input
              autoFocus
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={() => handleRenameSubmit(editingId)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault()
                  setEditingId(null)
                }
              }}
              className="h-7 w-28 px-2 py-0 text-xs md:text-xs"
              aria-label="Rename view"
            />
          </form>
        )}

        {(allowRename || allowDuplicate || allowSetDefault || allowDelete) &&
          activeView &&
          !editingId && (
            <ViewOptionsMenu
              view={activeView}
              isOnlyView={views.length <= 1}
              isPending={isActivePending}
              allowRename={allowRename}
              allowDuplicate={allowDuplicate}
              allowSetDefault={allowSetDefault}
              allowDelete={allowDelete}
              onStartRename={() => handleStartRename(activeView)}
              onDuplicate={() => handleDuplicate(activeView)}
              onSetDefault={() => handleSetDefault(activeView.id)}
              onDelete={() => handleDelete(activeView.id)}
            />
          )}

        {allowCreate && !editingId && (
          <Popover open={createOpen} onOpenChange={setCreateOpen}>
            <PopoverTrigger
              type="button"
              className="flex size-7 items-center justify-center rounded-md border border-dashed border-muted-foreground/30 text-muted-foreground transition-colors outline-none hover:border-foreground hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Create new view"
            >
              <PlusIcon className="size-3.5" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-3">
              <form onSubmit={handleCreateSubmit} className="space-y-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Create new view</h4>
                  <p className="text-xs text-muted-foreground">
                    Save the current filters and configuration as a named view.
                  </p>
                </div>
                <Input
                  autoFocus
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  placeholder={placeholder}
                  className="h-8 text-xs"
                />
                <div className="flex justify-end gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    disabled={!newViewName.trim()}
                  >
                    Create view
                  </Button>
                </div>
              </form>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {dirtyActions}
      {failureMessage}
    </div>
  )
}

function ViewOptionsMenu({
  view,
  isOnlyView,
  isPending,
  allowRename,
  allowDuplicate,
  allowSetDefault,
  allowDelete,
  onStartRename,
  onDuplicate,
  onSetDefault,
  onDelete,
}: {
  view: SavedView
  isOnlyView: boolean
  isPending: boolean
  allowRename: boolean
  allowDuplicate: boolean
  allowSetDefault: boolean
  allowDelete: boolean
  onStartRename: () => void
  onDuplicate: () => void
  onSetDefault: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const items: {
    label: string
    icon: React.ReactNode
    onClick: () => void
    destructive?: boolean
  }[] = []

  if (allowRename && !view.isLocked) {
    items.push({
      label: "Rename",
      icon: <PencilIcon className="size-3.5 text-muted-foreground" />,
      onClick: onStartRename,
    })
  }

  if (allowDuplicate) {
    items.push({
      label: "Duplicate",
      icon: <CopyIcon className="size-3.5 text-muted-foreground" />,
      onClick: onDuplicate,
    })
  }

  if (allowSetDefault && !view.isDefault) {
    items.push({
      label: "Set as default",
      icon: <StarIcon className="size-3.5 fill-amber-500 text-amber-500" />,
      onClick: onSetDefault,
    })
  }

  if (allowDelete && !view.isLocked && !isOnlyView) {
    items.push({
      label: "Delete",
      icon: <Trash2Icon className="size-3.5" />,
      onClick: onDelete,
      destructive: true,
    })
  }

  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const first = menuRef.current?.querySelector<HTMLButtonElement>(
          '[role="menuitem"]:not([disabled])'
        )
        first?.focus()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [open])

  function handleItemKeyDown(
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      e.stopPropagation()
      const nextIndex = (index + 1) % items.length
      const buttons = menuRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not([disabled])'
      )
      buttons?.[nextIndex]?.focus()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      e.stopPropagation()
      const prevIndex = (index - 1 + items.length) % items.length
      const buttons = menuRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not([disabled])'
      )
      buttons?.[prevIndex]?.focus()
    } else if (e.key === "Home") {
      e.preventDefault()
      e.stopPropagation()
      const buttons = menuRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not([disabled])'
      )
      buttons?.[0]?.focus()
    } else if (e.key === "End") {
      e.preventDefault()
      e.stopPropagation()
      const buttons = menuRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not([disabled])'
      )
      buttons?.[buttons.length - 1]?.focus()
    } else if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
      triggerRef.current?.focus()
    }
  }

  return (
    <Popover
      open={open && !isPending}
      onOpenChange={(next) => setOpen(next && !isPending)}
    >
      <PopoverTrigger
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open && !isPending}
        aria-disabled={isPending || undefined}
        aria-label={`Options for ${view.name}`}
        className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-70 transition-opacity outline-none hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-ring aria-disabled:opacity-40"
      >
        <MoreHorizontalIcon className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-44 p-1">
        <div
          ref={menuRef}
          role="menu"
          aria-label={`Options for ${view.name}`}
          className="space-y-0.5 text-xs outline-none"
        >
          {items.map((item, index) => (
            <React.Fragment key={item.label}>
              {item.destructive && <div className="my-1 h-px bg-border" />}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  item.onClick()
                }}
                onKeyDown={(e) => handleItemKeyDown(e, index)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors outline-none",
                  item.destructive
                    ? "text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                    : "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { SavedViews }
