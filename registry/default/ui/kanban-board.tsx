"use client"

import * as React from "react"
import { GripVerticalIcon } from "lucide-react"

import { cn } from "@/registry/default/lib/utils"
import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import { Badge } from "@/registry/default/ui/badge"
import {
  findCardLocation,
  getCancelAnnouncement,
  getDefaultCardId,
  getDefaultCardLabel,
  getDropAnnouncement,
  getKeyboardMoveTarget,
  getMoveAnnouncement,
  getPickupAnnouncement,
  moveCard,
  type KanbanColumn,
} from "@/registry/default/lib/kanban-board-utils"

export type { KanbanColumn }

export interface KanbanBoardProps<T = Record<string, unknown>> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "value" | "children"
> {
  columns: KanbanColumn[]
  value?: Record<string, T[]>
  defaultValue?: Record<string, T[]>
  onValueChange?: (value: Record<string, T[]>) => void
  onMove?: (
    card: T,
    fromColumnId: string,
    toColumnId: string,
    toIndex: number
  ) => void
  getCardId?: (card: T, index: number) => string
  getCardLabel?: (card: T, index: number) => string
  renderCard?: (
    card: T,
    info: { columnId: string; index: number; isGrabbed: boolean }
  ) => React.ReactNode
  renderColumnHeader?: (column: KanbanColumn, cards: T[]) => React.ReactNode
  renderEmptyColumn?: (column: KanbanColumn) => React.ReactNode
  disabled?: boolean
}

interface GrabSession<T> {
  cardId: string
  fromColumnId: string
  fromIndex: number
  currentColumnId: string
  currentIndex: number
  initialBoard: Record<string, T[]>
}

interface DragTarget {
  columnId: string
  index: number
}

const EMPTY_BOARD: Record<string, never[]> = {}

export function KanbanBoard<T = Record<string, unknown>>({
  columns,
  value: valueProp,
  defaultValue,
  onValueChange,
  onMove,
  getCardId = getDefaultCardId,
  getCardLabel = getDefaultCardLabel,
  renderCard,
  renderColumnHeader,
  renderEmptyColumn,
  disabled = false,
  className,
  onKeyDown,
  ...props
}: KanbanBoardProps<T>) {
  const instructionsId = React.useId()
  const [announcement, setAnnouncement] = React.useState("")

  const { value: board, setValue: setBoard } = useControllableState<
    Record<string, T[]>
  >({
    value: valueProp,
    defaultValue:
      defaultValue ?? (EMPTY_BOARD as unknown as Record<string, T[]>),
    onChange: onValueChange,
  })

  const [grabSession, setGrabSession] = React.useState<GrabSession<T> | null>(
    null
  )
  const [dragCardId, setDragCardId] = React.useState<string | null>(null)
  const [dropTarget, setDropTarget] = React.useState<DragTarget | null>(null)
  const dropTargetRef = React.useRef<DragTarget | null>(null)

  const cardElementsRef = React.useRef<Map<string, HTMLElement>>(new Map())

  // Ensure grabbed card retains focus across re-renders
  React.useEffect(() => {
    if (grabSession) {
      const el = cardElementsRef.current.get(grabSession.cardId)
      if (el && document.activeElement !== el) {
        el.focus()
      }
    }
  }, [grabSession, board])

  function registerCardElement(id: string, el: HTMLElement | null) {
    if (el) {
      cardElementsRef.current.set(id, el)
    } else {
      cardElementsRef.current.delete(id)
    }
  }

  function cancelGrab() {
    if (!grabSession) return
    const origCol = columns.find((c) => c.id === grabSession.fromColumnId)
    const origTitle = origCol?.title ?? grabSession.fromColumnId
    const origCards = grabSession.initialBoard[grabSession.fromColumnId] ?? []
    const originalCardLoc = findCardLocation(
      grabSession.initialBoard,
      grabSession.cardId,
      getCardId
    )
    const label = originalCardLoc
      ? getCardLabel(originalCardLoc.card, originalCardLoc.index)
      : grabSession.cardId

    setBoard(grabSession.initialBoard)
    setAnnouncement(
      getCancelAnnouncement(
        label,
        origTitle,
        grabSession.fromIndex,
        origCards.length
      )
    )
    setGrabSession(null)
  }

  function handleCardKeyDown(
    event: React.KeyboardEvent<HTMLElement>,
    card: T,
    columnId: string,
    index: number
  ) {
    if (disabled) return
    const cardId = getCardId(card, index)
    const cardLabel = getCardLabel(card, index)
    const colObj = columns.find((c) => c.id === columnId)
    const colTitle = colObj?.title ?? columnId

    if (event.key === " " || event.key === "Enter") {
      event.preventDefault()
      if (!grabSession) {
        // Pick up
        const total = (board[columnId] ?? []).length
        setGrabSession({
          cardId,
          fromColumnId: columnId,
          fromIndex: index,
          currentColumnId: columnId,
          currentIndex: index,
          initialBoard: board,
        })
        setAnnouncement(
          getPickupAnnouncement(cardLabel, colTitle, index, total)
        )
      } else if (grabSession.cardId === cardId) {
        // Drop
        const total = (board[columnId] ?? []).length
        const hasMoved =
          grabSession.fromColumnId !== columnId ||
          grabSession.fromIndex !== index

        setAnnouncement(getDropAnnouncement(cardLabel, colTitle, index, total))
        setGrabSession(null)

        if (hasMoved) {
          onMove?.(card, grabSession.fromColumnId, columnId, index)
        }
      }
      return
    }

    if (grabSession && grabSession.cardId === cardId) {
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        cancelGrab()
        return
      }

      if (
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight"
      ) {
        event.preventDefault()
        const target = getKeyboardMoveTarget(
          event.key,
          columnId,
          index,
          columns,
          board
        )
        if (!target) return

        const res = moveCard(
          board,
          cardId,
          target.targetColumnId,
          target.targetIndex,
          getCardId
        )
        setBoard(res.nextBoard)
        setGrabSession((prev) =>
          prev
            ? {
                ...prev,
                currentColumnId: target.targetColumnId,
                currentIndex: res.toIndex,
              }
            : null
        )

        const targetCol = columns.find((c) => c.id === target.targetColumnId)
        const targetTitle = targetCol?.title ?? target.targetColumnId
        const targetCount = (res.nextBoard[target.targetColumnId] ?? []).length
        setAnnouncement(
          getMoveAnnouncement(cardLabel, targetTitle, res.toIndex, targetCount)
        )
      }
      return
    }

    // Roving focus when not grabbed
    if (
      event.key === "ArrowUp" ||
      event.key === "ArrowDown" ||
      event.key === "ArrowLeft" ||
      event.key === "ArrowRight"
    ) {
      const colIdx = columns.findIndex((c) => c.id === columnId)
      if (colIdx === -1) return

      if (event.key === "ArrowUp" && index > 0) {
        event.preventDefault()
        const prevCard = board[columnId]?.[index - 1]
        if (prevCard) {
          cardElementsRef.current.get(getCardId(prevCard, index - 1))?.focus()
        }
      } else if (
        event.key === "ArrowDown" &&
        index < (board[columnId]?.length ?? 0) - 1
      ) {
        event.preventDefault()
        const nextCard = board[columnId]?.[index + 1]
        if (nextCard) {
          cardElementsRef.current.get(getCardId(nextCard, index + 1))?.focus()
        }
      } else if (event.key === "ArrowLeft" && colIdx > 0) {
        event.preventDefault()
        const prevCol = columns[colIdx - 1]
        const prevCards = board[prevCol.id] ?? []
        if (prevCards.length > 0) {
          const targetIdx = Math.min(index, prevCards.length - 1)
          cardElementsRef.current
            .get(getCardId(prevCards[targetIdx], targetIdx))
            ?.focus()
        }
      } else if (event.key === "ArrowRight" && colIdx < columns.length - 1) {
        event.preventDefault()
        const nextCol = columns[colIdx + 1]
        const nextCards = board[nextCol.id] ?? []
        if (nextCards.length > 0) {
          const targetIdx = Math.min(index, nextCards.length - 1)
          cardElementsRef.current
            .get(getCardId(nextCards[targetIdx], targetIdx))
            ?.focus()
        }
      }
    }
  }

  function handleDragStart(
    event: React.DragEvent<HTMLElement>,
    card: T,
    columnId: string,
    index: number
  ) {
    if (disabled) return
    const cardId = getCardId(card, index)
    event.dataTransfer.setData("text/plain", cardId)
    event.dataTransfer.effectAllowed = "move"
    setDragCardId(cardId)
  }

  function handleDragEnd() {
    setDragCardId(null)
    setDropTarget(null)
    dropTargetRef.current = null
  }

  function handleColumnDragOver(
    event: React.DragEvent<HTMLElement>,
    columnId: string
  ) {
    if (disabled || !dragCardId) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"

    const cards = board[columnId] ?? []
    if (dropTargetRef.current?.columnId !== columnId) {
      const nextTarget = { columnId, index: cards.length }
      dropTargetRef.current = nextTarget
      setDropTarget(nextTarget)
    }
  }

  function handleCardDragOver(
    event: React.DragEvent<HTMLElement>,
    columnId: string,
    cardIndex: number
  ) {
    if (disabled || !dragCardId) return
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = "move"

    const rect = event.currentTarget.getBoundingClientRect()
    const midpoint = rect.top + rect.height / 2
    const targetIndex =
      typeof event.clientY === "number" && rect.height > 0
        ? event.clientY < midpoint
          ? cardIndex
          : cardIndex + 1
        : cardIndex

    if (
      dropTargetRef.current?.columnId !== columnId ||
      dropTargetRef.current?.index !== targetIndex
    ) {
      const nextTarget = { columnId, index: targetIndex }
      dropTargetRef.current = nextTarget
      setDropTarget(nextTarget)
    }
  }

  function handleDrop(
    event: React.DragEvent<HTMLElement>,
    targetColumnId: string
  ) {
    if (disabled || !dragCardId) return
    event.preventDefault()
    event.stopPropagation()

    const currentDropTarget = dropTargetRef.current
    const targetIndex =
      currentDropTarget?.columnId === targetColumnId
        ? currentDropTarget.index
        : (board[targetColumnId] ?? []).length

    const loc = findCardLocation(board, dragCardId, getCardId)
    if (loc) {
      const res = moveCard(
        board,
        dragCardId,
        targetColumnId,
        targetIndex,
        getCardId
      )
      setBoard(res.nextBoard)
      if (loc.columnId !== targetColumnId || loc.index !== res.toIndex) {
        onMove?.(loc.card, loc.columnId, targetColumnId, res.toIndex)
      }
    }

    setDragCardId(null)
    setDropTarget(null)
    dropTargetRef.current = null
  }

  return (
    <div
      data-slot="kanban-board"
      className={cn(
        "flex w-full min-w-0 snap-x flex-row items-start gap-4 overflow-x-auto pt-1 pb-4",
        className
      )}
      onKeyDown={(e) => {
        if (grabSession && e.key === "Escape") {
          e.preventDefault()
          cancelGrab()
          return
        }
        onKeyDown?.(e)
      }}
      {...props}
    >
      <span id={instructionsId} className="sr-only">
        Press Space to pick up, Up and Down to move within the column, Left and
        Right to move across columns, Space to drop, Escape to cancel.
      </span>

      <div
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {columns.map((column) => {
        const cards = board[column.id] ?? []
        const isColumnDropActive =
          dragCardId !== null &&
          dropTarget?.columnId === column.id &&
          cards.length === 0

        return (
          <section
            key={column.id}
            data-slot="kanban-column"
            data-column-id={column.id}
            aria-labelledby={`kanban-col-title-${column.id}`}
            className="flex w-72 shrink-0 snap-start flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3 shadow-xs"
            onDragOver={(e) => handleColumnDragOver(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center justify-between gap-2 px-1">
              {renderColumnHeader ? (
                renderColumnHeader(column, cards)
              ) : (
                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <h3
                    id={`kanban-col-title-${column.id}`}
                    className="truncate text-sm font-semibold text-foreground"
                  >
                    {column.title}
                  </h3>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {cards.length}
                  </Badge>
                </div>
              )}
            </div>

            {column.description && (
              <p className="px-1 text-xs text-muted-foreground">
                {column.description}
              </p>
            )}

            <div
              role="list"
              aria-label={column.title}
              className={cn(
                "flex min-h-[5rem] flex-col gap-2 rounded-md transition-colors",
                isColumnDropActive && "bg-primary/5 ring-2 ring-primary/40"
              )}
            >
              {cards.length === 0 ? (
                renderEmptyColumn ? (
                  <div role="listitem">{renderEmptyColumn(column)}</div>
                ) : (
                  <div
                    role="listitem"
                    data-slot="kanban-empty-column"
                    className="flex h-20 items-center justify-center rounded-md border border-dashed border-border/80 px-3 text-center text-xs text-muted-foreground"
                  >
                    No cards
                  </div>
                )
              ) : (
                cards.map((card, idx) => {
                  const cardId = getCardId(card, idx)
                  const isGrabbed = grabSession?.cardId === cardId
                  const isDragging = dragCardId === cardId
                  const isDropIndicatorAbove =
                    dragCardId !== null &&
                    dropTarget?.columnId === column.id &&
                    dropTarget.index === idx
                  const isDropIndicatorBelow =
                    dragCardId !== null &&
                    dropTarget?.columnId === column.id &&
                    dropTarget.index === idx + 1 &&
                    idx === cards.length - 1

                  return (
                    <React.Fragment key={cardId}>
                      {isDropIndicatorAbove && (
                        <div
                          data-slot="kanban-drop-indicator"
                          className="h-1 w-full rounded-full bg-primary"
                        />
                      )}
                      <div
                        role="listitem"
                        className="group relative flex flex-col"
                      >
                        <div
                          ref={(el) => registerCardElement(cardId, el)}
                          role="button"
                          tabIndex={disabled ? -1 : 0}
                          aria-roledescription="kanban card"
                          aria-grabbed={isGrabbed}
                          aria-describedby={instructionsId}
                          draggable={!disabled && !isGrabbed}
                          data-slot="kanban-card"
                          data-card-id={cardId}
                          data-grabbed={isGrabbed ? "" : undefined}
                          onKeyDown={(e) =>
                            handleCardKeyDown(e, card, column.id, idx)
                          }
                          onDragStart={(e) =>
                            handleDragStart(e, card, column.id, idx)
                          }
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) =>
                            handleCardDragOver(e, column.id, idx)
                          }
                          className={cn(
                            "flex w-full cursor-grab flex-col rounded-md border border-border bg-card p-3 text-left text-sm text-card-foreground shadow-xs transition-[box-shadow,transform,opacity,border-color] outline-none",
                            "hover:border-border/80 hover:shadow-sm focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                            isGrabbed &&
                              "scale-[1.02] cursor-grabbing border-primary shadow-md ring-[3px] ring-primary/40",
                            isDragging && "opacity-40",
                            disabled &&
                              "cursor-not-allowed opacity-50 hover:border-border hover:shadow-xs"
                          )}
                        >
                          {renderCard ? (
                            renderCard(card, {
                              columnId: column.id,
                              index: idx,
                              isGrabbed,
                            })
                          ) : (
                            <div className="flex items-start gap-2">
                              <GripVerticalIcon
                                className="size-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-muted-foreground"
                                aria-hidden="true"
                              />
                              <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <span className="font-medium text-foreground">
                                  {getCardLabel(card, idx)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {isDropIndicatorBelow && (
                        <div
                          data-slot="kanban-drop-indicator"
                          className="h-1 w-full rounded-full bg-primary"
                        />
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
