"use client"

import * as React from "react"

import {
  readViewParam,
  writeViewParam,
} from "@/registry/default/lib/saved-views"
import { SavedViews, type SavedView } from "@/registry/default/ui/saved-views"

const VIEWS: SavedView[] = [
  { id: "all", name: "All Issues", isDefault: true },
  { id: "mine", name: "Assigned to Me" },
  { id: "stale", name: "Stale" },
]

export function SavedViewsUrlStatePreview() {
  const [search, setSearch] = React.useState("q=bug&view=mine")
  const activeId = readViewParam(search, VIEWS)

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="text-muted-foreground select-none">?</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Query string"
          className="flex-1 rounded-md border bg-background px-2 py-1 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <SavedViews
        views={VIEWS}
        activeId={activeId}
        onActiveChange={(id) => setSearch(writeViewParam(search, id))}
        allowCreate={false}
        allowRename={false}
        allowDuplicate={false}
        allowDelete={false}
        allowSetDefault={false}
      />
      <p className="text-xs text-muted-foreground">
        A missing or unknown id shows the default view.
      </p>
    </div>
  )
}
