"use client"

import * as React from "react"
import { CircleDotIcon, HashIcon, TextIcon } from "lucide-react"

import {
  matchesFilter,
  serializeFilters,
  type Filter,
  type FilterField,
} from "@/registry/default/lib/filter"
import { FilterBuilder } from "@/registry/default/ui/filter-builder"
import { SavedViews, type SavedView } from "@/registry/default/ui/saved-views"

const FIELDS: FilterField[] = [
  {
    id: "status",
    label: "Status",
    type: "select",
    icon: <CircleDotIcon />,
    options: [
      { value: "open", label: "Open" },
      { value: "in-review", label: "In review" },
      { value: "closed", label: "Closed" },
    ],
  },
  { id: "title", label: "Title", type: "text", icon: <TextIcon /> },
  { id: "points", label: "Points", type: "number", icon: <HashIcon /> },
]

const ISSUES = [
  {
    id: "DR-101",
    title: "Keyboard navigation in tree view",
    status: "open",
    points: 5,
  },
  {
    id: "DR-102",
    title: "Fix color contrast in dark mode",
    status: "in-review",
    points: 2,
  },
  {
    id: "DR-103",
    title: "Support Arabic numerals in currency input",
    status: "closed",
    points: 3,
  },
  {
    id: "DR-104",
    title: "Caret stability when backspacing delimiters",
    status: "open",
    points: 8,
  },
]

type Issue = (typeof ISSUES)[number]

const INITIAL_VIEWS: SavedView<Filter[]>[] = [
  {
    id: "all",
    name: "All Issues",
    isDefault: true,
    data: [],
  },
  {
    id: "open",
    name: "Open Issues",
    data: [{ id: "f-1", fieldId: "status", operator: "is", value: "open" }],
  },
  {
    id: "high-points",
    name: "High Points",
    data: [{ id: "f-2", fieldId: "points", operator: "gt", value: "3" }],
  },
]

function sameFilters(saved: Filter[] | undefined, current: Filter[]) {
  return serializeFilters(saved ?? []) === serializeFilters(current)
}

export function SavedViewsPreview() {
  const [views, setViews] = React.useState<SavedView<Filter[]>[]>(INITIAL_VIEWS)
  const [activeId, setActiveId] = React.useState("all")

  const currentView = views.find((v) => v.id === activeId) ?? views[0]
  const [activeFilters, setActiveFilters] = React.useState<Filter[]>(
    currentView?.data ?? []
  )

  function handleActiveChange(nextId: string) {
    setActiveId(nextId)
    const target = views.find((v) => v.id === nextId)
    if (target) {
      setActiveFilters(target.data ?? [])
    }
  }

  const savedFilters = currentView?.data ?? []

  function handleSave(view: SavedView<Filter[]>) {
    setViews((prev) =>
      prev.map((v) => (v.id === view.id ? { ...v, data: activeFilters } : v))
    )
  }

  function handleReset() {
    setActiveFilters(savedFilters)
  }

  function handleCreate(newView: SavedView<Filter[]>) {
    setViews((prev) =>
      prev.map((v) =>
        v.id === newView.id ? { ...v, data: [...activeFilters] } : v
      )
    )
  }

  const visibleIssues = ISSUES.filter((issue) =>
    activeFilters.every((filter) =>
      matchesFilter(issue[filter.fieldId as keyof Issue], filter)
    )
  )

  return (
    <div className="flex w-full flex-col gap-4">
      <SavedViews
        views={views}
        onViewsChange={setViews}
        activeId={activeId}
        onActiveChange={handleActiveChange}
        currentData={activeFilters}
        isEqual={sameFilters}
        onSave={handleSave}
        onReset={handleReset}
        onCreate={handleCreate}
        onDuplicate={(newView) => setActiveFilters(newView.data ?? [])}
      />

      <div className="flex items-center gap-2">
        <FilterBuilder
          fields={FIELDS}
          value={activeFilters}
          onValueChange={setActiveFilters}
        />
      </div>

      <ul className="divide-y rounded-md border text-sm">
        {visibleIssues.map((issue) => (
          <li key={issue.id} className="flex items-center gap-3 px-3 py-2.5">
            <span className="font-mono text-xs text-muted-foreground">
              {issue.id}
            </span>
            <span className="flex-1 truncate">{issue.title}</span>
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {issue.status}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {issue.points} pts
            </span>
          </li>
        ))}
        {visibleIssues.length === 0 && (
          <li className="px-3 py-6 text-center text-muted-foreground">
            No issues match this view.
          </li>
        )}
      </ul>
    </div>
  )
}
