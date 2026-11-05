"use client"

import * as React from "react"

import { SavedViews, type SavedView } from "@/registry/default/ui/saved-views"

type TableState = {
  sort: "updated" | "priority"
  columns: string[]
  search?: string
}

const EMPTY_STATE: TableState = { sort: "updated", columns: ["title"] }

const INITIAL_VIEWS: SavedView<TableState>[] = [
  {
    id: "all",
    name: "All Issues",
    isDefault: true,
    data: { sort: "updated", columns: ["title", "status"] },
  },
  {
    id: "triage",
    name: "Triage",
    data: { sort: "priority", columns: ["title", "priority"] },
  },
]

export function SavedViewsDirtyTrackingPreview() {
  const [views, setViews] = React.useState(INITIAL_VIEWS)
  const [activeId, setActiveId] = React.useState("all")
  const [draft, setDraft] = React.useState<{
    viewId: string
    state: TableState
  }>()
  const activeView = views.find((v) => v.id === activeId)
  const state =
    draft?.viewId === activeId ? draft.state : (activeView?.data ?? EMPTY_STATE)

  function update(change: (prev: TableState) => TableState) {
    setDraft({ viewId: activeId, state: change(state) })
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <SavedViews
        views={views}
        onViewsChange={setViews}
        activeId={activeId}
        onActiveChange={setActiveId}
        currentData={state}
        onReset={() => setDraft(undefined)}
      />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() =>
            update((prev) => ({
              ...prev,
              sort: prev.sort === "updated" ? "priority" : "updated",
            }))
          }
          className="rounded-md border px-2.5 py-1 hover:bg-accent"
        >
          Sort by {state.sort === "updated" ? "priority" : "updated"}
        </button>
        <button
          type="button"
          onClick={() =>
            update((prev) => ({
              columns: prev.columns,
              search: undefined,
              sort: prev.sort,
            }))
          }
          className="rounded-md border px-2.5 py-1 hover:bg-accent"
        >
          Reorder keys and add search: undefined
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        The second button changes key order and adds an undefined field. Neither
        counts as an unsaved change.
      </p>
    </div>
  )
}
