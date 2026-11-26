"use client"

import * as React from "react"
import {
  KanbanBoard,
  type KanbanColumn,
} from "@/registry/default/ui/kanban-board"

interface Bug {
  id: string
  title: string
}

const COLUMNS: KanbanColumn[] = [
  { id: "reported", title: "Reported" },
  { id: "triaged", title: "Triaged" },
  { id: "resolved", title: "Resolved" },
]

const BUGS: Record<string, Bug[]> = {
  reported: [
    { id: "bug-1", title: "Mobile safari sticky header flicker" },
    { id: "bug-2", title: "Dark mode contrast in table rows" },
  ],
  triaged: [],
  resolved: [],
}

export function KanbanBoardEmptyColumnsPreview() {
  const [board, setBoard] = React.useState(BUGS)

  return (
    <div className="w-full max-w-3xl">
      <KanbanBoard
        aria-label="Bug triage"
        columns={COLUMNS}
        value={board}
        onValueChange={setBoard}
        renderEmptyColumn={(column) => (
          <div className="flex h-24 flex-col items-center justify-center rounded-md border border-dashed border-border px-3 text-center text-xs text-muted-foreground">
            <span>Drop here to mark</span>
            <span className="font-medium text-foreground">{column.title}</span>
          </div>
        )}
      />
    </div>
  )
}
