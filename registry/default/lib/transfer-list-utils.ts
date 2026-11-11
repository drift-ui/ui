export interface TransferItem {
  id: string
  label: string
  description?: string
  disabled?: boolean
}

export function partitionItems<T extends TransferItem>(
  items: readonly T[],
  selectedIds: readonly string[]
): { sourceItems: T[]; targetItems: T[] } {
  const selectedSet = new Set(selectedIds)
  const sourceItems: T[] = []
  const targetItems: T[] = []

  for (const item of items) {
    if (selectedSet.has(item.id)) {
      targetItems.push(item)
    } else {
      sourceItems.push(item)
    }
  }

  return { sourceItems, targetItems }
}

export function filterTransferItems<T extends TransferItem>(
  items: readonly T[],
  query: string
): T[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return [...items]

  return items.filter(
    (item) =>
      item.label.toLowerCase().includes(normalizedQuery) ||
      item.description?.toLowerCase().includes(normalizedQuery)
  )
}

export function moveItems(
  currentSelectedIds: readonly string[],
  idsToMove: readonly string[],
  direction: "toTarget" | "toSource"
): string[] {
  if (direction === "toTarget") {
    return Array.from(new Set([...currentSelectedIds, ...idsToMove]))
  }

  const moveSet = new Set(idsToMove)
  return currentSelectedIds.filter((id) => !moveSet.has(id))
}

export function selectRange(
  itemIds: readonly string[],
  fromId: string,
  toId: string,
  currentChecked: readonly string[]
): string[] {
  const toIndex = itemIds.indexOf(toId)
  if (toIndex === -1) return [...currentChecked]

  const fromIndex = itemIds.indexOf(fromId)
  const anchorIndex = fromIndex === -1 ? toIndex : fromIndex
  const start = Math.min(anchorIndex, toIndex)
  const end = Math.max(anchorIndex, toIndex)

  return Array.from(
    new Set([...currentChecked, ...itemIds.slice(start, end + 1)])
  )
}

export function getNavigationTarget(
  itemIds: readonly string[],
  currentId: string,
  key: string
): string | undefined {
  const index = itemIds.indexOf(currentId)

  switch (key) {
    case "ArrowDown":
      return itemIds[Math.min(index + 1, itemIds.length - 1)]
    case "ArrowUp":
      return itemIds[Math.max(index - 1, 0)]
    case "Home":
      return itemIds[0]
    case "End":
      return itemIds[itemIds.length - 1]
    default:
      return undefined
  }
}

export function getTransferAnnouncement(
  labels: readonly string[],
  destination: string
): string {
  const subject = labels.length === 1 ? labels[0] : `${labels.length} items`
  return `Moved ${subject} to ${destination}.`
}
