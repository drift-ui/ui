export interface KanbanColumn {
  id: string
  title: string
  description?: string
}

export interface KanbanCardLocation<T> {
  columnId: string
  index: number
  card: T
}

export interface MoveCardResult<T> {
  nextBoard: Record<string, T[]>
  movedCard: T | null
  fromColumnId: string | null
  fromIndex: number | null
  toColumnId: string
  toIndex: number
}

export function getDefaultCardId(card: unknown, index: number): string {
  if (typeof card === "string" || typeof card === "number") return String(card)
  if (typeof card === "object" && card !== null && "id" in card) {
    const { id } = card as { id: unknown }
    if (typeof id === "string" || typeof id === "number") return String(id)
  }
  return String(index)
}

export function getDefaultCardLabel(card: unknown, index: number): string {
  if (typeof card === "string") return card
  if (typeof card === "object" && card !== null) {
    const c = card as Record<string, unknown>
    if (typeof c.title === "string") return c.title
    if (typeof c.label === "string") return c.label
    if (typeof c.name === "string") return c.name
    if (typeof c.id === "string" || typeof c.id === "number")
      return String(c.id)
  }
  return `Card ${index + 1}`
}

export function findCardLocation<T>(
  board: Record<string, readonly T[] | undefined>,
  cardId: string,
  getCardId: (card: T, index: number) => string = getDefaultCardId
): KanbanCardLocation<T> | null {
  for (const [columnId, cards] of Object.entries(board)) {
    if (!Array.isArray(cards)) continue
    const index = cards.findIndex(
      (card, idx) => getCardId(card, idx) === cardId
    )
    if (index !== -1) {
      return { columnId, index, card: cards[index] }
    }
  }
  return null
}

export function reorderCardInColumn<T>(
  cards: readonly T[],
  fromIndex: number,
  toIndex: number
): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    fromIndex >= cards.length ||
    toIndex < 0 ||
    toIndex >= cards.length
  ) {
    return [...cards]
  }
  const result = [...cards]
  const [removed] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, removed)
  return result
}

export function moveCard<T>(
  board: Record<string, readonly T[] | undefined>,
  cardId: string,
  toColumnId: string,
  toIndex: number,
  getCardId: (card: T, index: number) => string = getDefaultCardId
): MoveCardResult<T> {
  const loc = findCardLocation(board, cardId, getCardId)
  if (!loc) {
    const safeBoard: Record<string, T[]> = {}
    for (const [k, v] of Object.entries(board)) {
      safeBoard[k] = Array.isArray(v) ? [...v] : []
    }
    return {
      nextBoard: safeBoard,
      movedCard: null,
      fromColumnId: null,
      fromIndex: null,
      toColumnId,
      toIndex,
    }
  }

  const { columnId: fromColumnId, index: fromIndex, card: movedCard } = loc
  const nextBoard: Record<string, T[]> = {}
  for (const [k, v] of Object.entries(board)) {
    nextBoard[k] = Array.isArray(v) ? [...v] : []
  }
  if (!nextBoard[toColumnId]) {
    nextBoard[toColumnId] = []
  }

  if (fromColumnId === toColumnId) {
    const targetIndex = Math.max(
      0,
      Math.min(toIndex, nextBoard[toColumnId].length - 1)
    )
    nextBoard[toColumnId] = reorderCardInColumn(
      nextBoard[toColumnId],
      fromIndex,
      targetIndex
    )
    return {
      nextBoard,
      movedCard,
      fromColumnId,
      fromIndex,
      toColumnId,
      toIndex: targetIndex,
    }
  }

  nextBoard[fromColumnId].splice(fromIndex, 1)
  const targetIndex = Math.max(
    0,
    Math.min(toIndex, nextBoard[toColumnId].length)
  )
  nextBoard[toColumnId].splice(targetIndex, 0, movedCard)

  return {
    nextBoard,
    movedCard,
    fromColumnId,
    fromIndex,
    toColumnId,
    toIndex: targetIndex,
  }
}

export function getPickupAnnouncement(
  cardLabel: string,
  columnTitle: string,
  index: number,
  total: number
): string {
  return `Picked up ${cardLabel}, position ${index + 1} of ${total} in ${columnTitle}. Use arrow keys to move, Space to drop, Escape to cancel.`
}

export function getMoveAnnouncement(
  cardLabel: string,
  columnTitle: string,
  index: number,
  total: number
): string {
  return `Moved ${cardLabel} to position ${index + 1} of ${total} in ${columnTitle}.`
}

export function getDropAnnouncement(
  cardLabel: string,
  columnTitle: string,
  index: number,
  total: number
): string {
  return `Dropped ${cardLabel}, final position ${index + 1} of ${total} in ${columnTitle}.`
}

export function getCancelAnnouncement(
  cardLabel: string,
  originalColumnTitle: string,
  originalIndex: number,
  total: number
): string {
  return `Move cancelled. ${cardLabel} returned to position ${originalIndex + 1} of ${total} in ${originalColumnTitle}.`
}

export function getKeyboardMoveTarget(
  key: string,
  currentColumnId: string,
  currentIndex: number,
  columns: readonly KanbanColumn[],
  board: Record<string, readonly unknown[] | undefined>
): { targetColumnId: string; targetIndex: number } | null {
  const colIndex = columns.findIndex((c) => c.id === currentColumnId)
  if (colIndex === -1) return null

  const currentCards = board[currentColumnId] ?? []

  switch (key) {
    case "ArrowUp": {
      if (currentIndex <= 0) return null
      return { targetColumnId: currentColumnId, targetIndex: currentIndex - 1 }
    }
    case "ArrowDown": {
      if (currentIndex >= currentCards.length - 1) return null
      return { targetColumnId: currentColumnId, targetIndex: currentIndex + 1 }
    }
    case "ArrowLeft": {
      if (colIndex <= 0) return null
      const targetCol = columns[colIndex - 1]
      const targetCards = board[targetCol.id] ?? []
      const targetIndex = Math.min(currentIndex, targetCards.length)
      return { targetColumnId: targetCol.id, targetIndex }
    }
    case "ArrowRight": {
      if (colIndex >= columns.length - 1) return null
      const targetCol = columns[colIndex + 1]
      const targetCards = board[targetCol.id] ?? []
      const targetIndex = Math.min(currentIndex, targetCards.length)
      return { targetColumnId: targetCol.id, targetIndex }
    }
    default:
      return null
  }
}
