import { KanbanBoardEmptyColumnsPreview } from "@/components/preview/examples/kanban-board/empty-columns"
import { KanbanBoardOnMovePreview } from "@/components/preview/examples/kanban-board/on-move"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "on-move",
    title: "Granular moves with onMove",
    description:
      "onMove reports the exact card, previous column, target column, and index so you can persist changes without diffing the full board.",
    Preview: KanbanBoardOnMovePreview,
  },
  {
    id: "empty-columns",
    title: "Empty column states",
    description:
      "renderEmptyColumn customizes the drop target when a column has no cards.",
    Preview: KanbanBoardEmptyColumnsPreview,
  },
]
