"use client"

import * as React from "react"

import { SavedViews, type SavedView } from "@/registry/default/ui/saved-views"

const INITIAL_VIEWS: SavedView[] = [
  { id: "all", name: "All Issues", isDefault: true, isLocked: true },
  { id: "mine", name: "Assigned to Me" },
  { id: "stale", name: "Stale" },
]

export function SavedViewsAsyncStoragePreview() {
  const [views, setViews] = React.useState(INITIAL_VIEWS)
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
        onCreate={(view) => request(`POST /views ${view.name}`)}
        onRename={(view) => request(`PATCH /views/${view.id}`)}
        onDuplicate={(view) => request(`POST /views ${view.name}`)}
        onDelete={(id) => request(`DELETE /views/${id}`)}
        onSetDefault={(id) => request(`PUT /views/default ${id}`)}
      />
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={failRequests}
          onChange={(event) => setFailRequests(event.target.checked)}
        />
        Make requests fail
      </label>
      <ul className="font-mono text-xs text-muted-foreground">
        {log.map((line, index) => (
          <li key={`${index}-${line}`}>{line}</li>
        ))}
      </ul>
    </div>
  )
}
