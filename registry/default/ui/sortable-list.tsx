"use client"

import * as React from "react"
import { GripVerticalIcon } from "lucide-react"
import {
  MotionConfig,
  Reorder,
  useDragControls,
  type DragControls,
  type HTMLMotionProps,
} from "motion/react"

import { cn } from "@/registry/default/lib/utils"
import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  applyOrder,
  getCancelAnnouncement,
  getDefaultItemKey,
  getDefaultItemLabel,
  getDropAnnouncement,
  getMoveAnnouncement,
  getPickupAnnouncement,
  getTargetIndex,
  reorderItem,
  type SortableKey,
  type SortableOrientation,
} from "@/registry/default/lib/sortable-list-utils"

const SORTABLE_SPRING = {
  type: "spring",
  bounce: 0.15,
  visualDuration: 0.25,
} as const

const DROP_SETTLE = { bounceStiffness: 500, bounceDamping: 45 }
const LIFTED_SCALE = 1.02
const INTERACTIVE_SELECTOR = "a,button,input,select,textarea,[contenteditable]"

interface SortSession {
  key: SortableKey
  order: SortableKey[]
  dragControls?: DragControls
}

interface SortableContextValue {
  activeKey: SortableKey | null
  isPointerDrag: boolean
  orientation: SortableOrientation
  disabled: boolean
  instructionsId: string
  getLabel: (key: SortableKey) => string
  beginPointerDrag: (key: SortableKey, dragControls: DragControls) => void
  finishSession: () => void
  onItemKeyDown: (
    event: React.KeyboardEvent<HTMLElement>,
    key: SortableKey
  ) => void
}

const SortableContext = React.createContext<SortableContextValue | null>(null)

function useSortableContext() {
  const context = React.useContext(SortableContext)
  if (!context) {
    throw new Error("SortableItem must be used within a SortableList")
  }
  return context
}

interface SortableItemContextValue {
  value: SortableKey
  disabled: boolean
  isGrabbed: boolean
  registerHandle: () => () => void
  startDrag: (event: React.PointerEvent<HTMLElement>) => void
}

const SortableItemContext =
  React.createContext<SortableItemContextValue | null>(null)

function useSortableItemContext() {
  const context = React.useContext(SortableItemContext)
  if (!context) {
    throw new Error("SortableDragHandle must be used within a SortableItem")
  }
  return context
}

export interface SortableListProps<T> extends Omit<
  HTMLMotionProps<"ul">,
  "children" | "defaultValue" | "layout" | "values"
> {
  value?: T[]
  defaultValue?: T[]
  onValueChange?: (items: T[]) => void
  getKey?: (item: T, index: number) => SortableKey
  getItemLabel?: (item: T, index: number) => string
  orientation?: SortableOrientation
  disabled?: boolean
  children: (item: T, index: number) => React.ReactNode
}

export function SortableList<T>({
  value,
  defaultValue = [],
  onValueChange,
  getKey = getDefaultItemKey,
  getItemLabel = getDefaultItemLabel,
  orientation = "vertical",
  disabled = false,
  className,
  children,
  ...props
}: SortableListProps<T>) {
  const { value: items, setValue: setItems } = useControllableState<T[]>({
    value,
    defaultValue,
    onChange: onValueChange,
  })

  const [session, setSession] = React.useState<SortSession | null>(null)
  const [announcement, setAnnouncement] = React.useState("")
  const sessionRef = React.useRef<SortSession | null>(null)
  const instructionsId = React.useId()

  const keys = items.map((item, index) => getKey(item, index))
  const orderedItems = session
    ? applyOrder(items, session.order, getKey)
    : items

  function updateSession(next: SortSession | null) {
    sessionRef.current = next
    setSession(next)
  }

  function getLabel(key: SortableKey) {
    const index = keys.indexOf(key)
    return index === -1 ? String(key) : getItemLabel(items[index], index)
  }

  function pickUp(key: SortableKey, dragControls?: DragControls) {
    updateSession({ key, order: keys, dragControls })
    setAnnouncement(
      getPickupAnnouncement(getLabel(key), keys.indexOf(key), keys.length)
    )
  }

  function moveTo(order: SortableKey[]) {
    const current = sessionRef.current
    if (!current) return

    updateSession({ ...current, order })
    setAnnouncement(
      getMoveAnnouncement(
        getLabel(current.key),
        order.indexOf(current.key),
        order.length
      )
    )
  }

  function finishSession() {
    const current = sessionRef.current
    if (!current) return

    const nextItems = applyOrder(items, current.order, getKey)
    updateSession(null)
    setAnnouncement(
      getDropAnnouncement(
        getLabel(current.key),
        current.order.indexOf(current.key),
        current.order.length
      )
    )
    if (nextItems.some((item, index) => item !== items[index])) {
      setItems(nextItems)
    }
  }

  function cancelSession() {
    const current = sessionRef.current
    if (!current) return

    updateSession(null)
    current.dragControls?.stop()
    setAnnouncement(
      getCancelAnnouncement(
        getLabel(current.key),
        keys.indexOf(current.key),
        keys.length
      )
    )
  }

  function onItemKeyDown(
    event: React.KeyboardEvent<HTMLElement>,
    key: SortableKey
  ) {
    if (disabled) return

    const current = sessionRef.current
    const isGrabbed = current?.key === key && !current.dragControls

    if (event.key === " " || event.key === "Enter") {
      event.preventDefault()
      if (event.repeat) return
      if (isGrabbed) {
        finishSession()
      } else {
        pickUp(key)
      }
      return
    }

    if (!isGrabbed) return

    const currentIndex = current.order.indexOf(key)
    const targetIndex = getTargetIndex(
      event.key,
      currentIndex,
      current.order.length,
      orientation
    )
    if (targetIndex === null) return

    event.preventDefault()
    if (targetIndex !== currentIndex) {
      moveTo(reorderItem(current.order, currentIndex, targetIndex))
    }
  }

  React.useEffect(() => {
    if (!session) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      event.preventDefault()
      event.stopPropagation()
      cancelSession()
    }

    window.addEventListener("keydown", handleEscape, true)
    return () => window.removeEventListener("keydown", handleEscape, true)
  })

  return (
    <SortableContext.Provider
      value={{
        activeKey: session?.key ?? null,
        isPointerDrag: Boolean(session?.dragControls),
        orientation,
        disabled,
        instructionsId,
        getLabel,
        beginPointerDrag: pickUp,
        finishSession,
        onItemKeyDown,
      }}
    >
      <MotionConfig reducedMotion="user" transition={SORTABLE_SPRING}>
        <Reorder.Group
          as="ul"
          role="list"
          axis={orientation === "vertical" ? "y" : "x"}
          values={session?.order ?? keys}
          onReorder={moveTo}
          data-orientation={orientation}
          data-disabled={disabled ? "" : undefined}
          className={cn(
            "flex gap-2",
            orientation === "vertical" ? "flex-col" : "flex-row",
            session && "select-none",
            className
          )}
          {...props}
        >
          {orderedItems.map((item, index) => children(item, index))}
        </Reorder.Group>
      </MotionConfig>

      <span id={instructionsId} className="sr-only">
        Press Space or Enter to pick up the item. Use arrow keys to reorder.
        Press Space or Enter again to drop. Press Escape to cancel.
      </span>

      <span aria-live="assertive" aria-atomic="true" className="sr-only">
        {announcement}
      </span>
    </SortableContext.Provider>
  )
}

export interface SortableItemProps extends Omit<
  HTMLMotionProps<"li">,
  "children" | "layout" | "value"
> {
  value: SortableKey
  disabled?: boolean
  children?: React.ReactNode
}

export function SortableItem({
  value,
  disabled: itemDisabled = false,
  className,
  children,
  onBlur,
  onDragEnd,
  onDragStart,
  onKeyDown,
  onPointerDown,
  ...props
}: SortableItemProps) {
  const {
    activeKey,
    isPointerDrag,
    orientation,
    disabled: listDisabled,
    instructionsId,
    beginPointerDrag,
    finishSession,
    onItemKeyDown,
  } = useSortableContext()

  const dragControls = useDragControls()
  const [hasHandle, setHasHandle] = React.useState(false)
  const disabled = listDisabled || itemDisabled
  const isActive = activeKey === value
  const isGrabbed = isActive && !isPointerDrag
  const isDragging = isActive && isPointerDrag
  const isRowDraggable = !hasHandle && !disabled

  const registerHandle = React.useCallback(() => {
    setHasHandle(true)
    return () => setHasHandle(false)
  }, [])

  const startDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (!disabled && event.button === 0 && event.isPrimary) {
      dragControls.start(event)
    }
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLLIElement>) => {
    onPointerDown?.(event)
    const isInteractiveTarget =
      event.target instanceof Element &&
      event.target.closest(INTERACTIVE_SELECTOR) !== null
    if (!hasHandle && !event.defaultPrevented && !isInteractiveTarget) {
      startDrag(event)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLLIElement>) => {
    onKeyDown?.(event)
    if (
      isRowDraggable &&
      event.target === event.currentTarget &&
      !event.defaultPrevented
    ) {
      onItemKeyDown(event, value)
    }
  }

  const handleBlur = (event: React.FocusEvent<HTMLLIElement>) => {
    onBlur?.(event)
    if (isGrabbed && !event.currentTarget.contains(event.relatedTarget)) {
      finishSession()
    }
  }

  return (
    <SortableItemContext.Provider
      value={{ value, disabled, isGrabbed, registerHandle, startDrag }}
    >
      <Reorder.Item
        as="li"
        role="listitem"
        value={value}
        layout="position"
        drag={disabled ? false : orientation === "vertical" ? "y" : "x"}
        dragListener={false}
        dragControls={dragControls}
        dragMomentum={false}
        dragTransition={DROP_SETTLE}
        initial={false}
        animate={{ scale: isActive ? LIFTED_SCALE : 1 }}
        data-sortable-item=""
        data-grabbed={isGrabbed ? "" : undefined}
        data-dragging={isDragging ? "" : undefined}
        data-orientation={orientation}
        data-disabled={disabled ? "" : undefined}
        tabIndex={isRowDraggable ? 0 : undefined}
        aria-roledescription="sortable item"
        aria-grabbed={isActive}
        aria-describedby={hasHandle ? undefined : instructionsId}
        onBlur={handleBlur}
        onDragEnd={(event, info) => {
          onDragEnd?.(event, info)
          finishSession()
        }}
        onDragStart={(event, info) => {
          onDragStart?.(event, info)
          beginPointerDrag(value, dragControls)
        }}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        className={cn(
          "group relative flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-card-foreground shadow-xs transition-[border-color,box-shadow,opacity]",
          isRowDraggable &&
            "cursor-grab select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none active:cursor-grabbing",
          isRowDraggable &&
            (orientation === "vertical" ? "touch-pan-x" : "touch-pan-y"),
          isGrabbed && "border-ring shadow-md ring-2 ring-ring/50",
          isDragging && "cursor-grabbing border-ring shadow-lg",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </Reorder.Item>
    </SortableItemContext.Provider>
  )
}

export type SortableDragHandleProps = React.ComponentProps<"button">

export function SortableDragHandle({
  className,
  children,
  onKeyDown,
  onPointerDown,
  ...props
}: SortableDragHandleProps) {
  const { instructionsId, getLabel, onItemKeyDown } = useSortableContext()
  const { value, disabled, isGrabbed, registerHandle, startDrag } =
    useSortableItemContext()

  React.useLayoutEffect(registerHandle, [registerHandle])

  return (
    <button
      type="button"
      data-sortable-handle=""
      aria-label={`Reorder ${getLabel(value)}`}
      aria-describedby={instructionsId}
      aria-pressed={isGrabbed}
      disabled={disabled}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (!event.defaultPrevented) onItemKeyDown(event, value)
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (!event.defaultPrevented) startDrag(event)
      }}
      className={cn(
        "shrink-0 cursor-grab touch-none rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing",
        isGrabbed && "bg-muted text-foreground",
        className
      )}
      {...props}
    >
      {children ?? <GripVerticalIcon className="size-4" />}
    </button>
  )
}
