"use client"

import * as React from "react"
import { Badge } from "@/registry/default/ui/badge"
import {
  KanbanBoard,
  type KanbanColumn,
} from "@/registry/default/ui/kanban-board"

interface TaskCard {
  id: string
  title: string
  tag: string
}

const COLUMNS: KanbanColumn[] = [
  { id: "todo", title: "To do" },
  { id: "in-progress", title: "In progress" },
  { id: "done", title: "Done" },
]

const INITIAL_TASKS: Record<string, TaskCard[]> = {
  todo: [
    { id: "task-1", title: "Quarterly roadmap review", tag: "Strategy" },
    { id: "task-2", title: "Design token audit", tag: "Design" },
  ],
  "in-progress": [
    { id: "task-3", title: "Passkey authentication", tag: "Security" },
  ],
  done: [{ id: "task-4", title: "Optimize bundle size", tag: "Performance" }],
}

export function KanbanBoardPreview() {
  const [board, setBoard] = React.useState(INITIAL_TASKS)

  return (
    <div className="w-full max-w-4xl py-4">
      <KanbanBoard
        aria-label="Sprint tasks"
        columns={COLUMNS}
        value={board}
        onValueChange={setBoard}
        renderCard={(task) => (
          <div className="flex flex-col gap-2">
            <span className="leading-snug font-medium">{task.title}</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {task.tag}
              </Badge>
            </div>
          </div>
        )}
      />
    </div>
  )
}
