"use client"

import * as React from "react"

import { SavedViews, type SavedView } from "@/registry/default/ui/saved-views"

type Sort = "updated" | "priority"

const INITIAL_VIEWS: SavedView<Sort>[] = [
  {
    id: "all",
    name: "All Issues",
    isDefault: true,
    isLocked: true,
    data: "updated",
  },
  { id: "mine", name: "Assigned to Me", data: "priority" },
  { id: "stale", name: "Stale", data: "updated" },
]

export function SavedViewsAsyncStoragePreview() {
  const [views, setViews] = React.useState(INITIAL_VIEWS)
  const [activeId, setActiveId] = React.useState("all")
  const [draft, setDraft] = React.useState<{ viewId: string; sort: Sort }>()
  const activeView = views.find((v) => v.id === activeId)
  const sort =
    draft?.viewId === activeId ? draft.sort : (activeView?.data ?? "updated")
  const [failRequests, setFailRequests] = React.useState(false)
  const [log, setLog] = React.useState<string[]>([])

  function request(label: string) {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        setLog((prev) =>
          [`${label}: ${failRequests ? "failed" : "ok"}`, ...prev].slice(0, 4)
        )
        if (failRequests) reject(new Error("Server unavailable"))
        else resolve()
      }, 900)
    })
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <SavedViews
        views={views}
        onViewsChange={setViews}
        activeId={activeId}
        onActiveChange={setActiveId}
        currentData={sort}
        onReset={() => setDraft(undefined)}
        onSave={(view) => request(`PUT /views/${view.id} sort=${view.data}`)}
        onCreate={(view) => request(`POST /views ${view.name}`)}
        onRename={(view) => request(`PATCH /views/${view.id}`)}
        onDuplicate={(view) => request(`POST /views ${view.name}`)}
        onDelete={(id) => request(`DELETE /views/${id}`)}
        onSetDefault={(id) => request(`PUT /views/default ${id}`)}
        onError={() => {}}
      />
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <button
          type="button"
          onClick={() =>
            setDraft({
              viewId: activeId,
              sort: sort === "updated" ? "priority" : "updated",
            })
          }
          className="rounded-md border px-2.5 py-1 hover:bg-accent"
        >
          Sort by {sort === "updated" ? "priority" : "updated"}
        </button>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={failRequests}
            onChange={(event) => setFailRequests(event.target.checked)}
          />
          Make requests fail
        </label>
      </div>
      <ul className="font-mono text-xs text-muted-foreground">
        {log.map((line, index) => (
          <li key={`${index}-${line}`}>{line}</li>
        ))}
      </ul>
    </div>
  )
}
