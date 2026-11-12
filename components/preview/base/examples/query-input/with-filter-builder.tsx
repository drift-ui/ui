"use client"

import * as React from "react"

import type { Filter, FilterField } from "@/registry/default/lib/filter"
import {
  formatQuery,
  parseQuery,
} from "@/registry/default/lib/query-input-utils"
import { FilterBuilder } from "@/registry/default/ui/filter-builder"
import { QueryInput } from "@/registry/base/ui/query-input"

const FIELDS: FilterField[] = [
  {
    id: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "active", label: "Active" },
      { value: "trial", label: "Trial" },
      { value: "churned", label: "Churned" },
    ],
  },
  { id: "company", label: "Company", type: "text" },
  { id: "seats", label: "Seats", type: "number" },
]

const INITIAL_QUERY = "status:active seats:>10 acme"

export function QueryInputWithFilterBuilderPreview() {
  const [query, setQuery] = React.useState(INITIAL_QUERY)
  const [filters, setFilters] = React.useState<Filter[]>(
    () => parseQuery(INITIAL_QUERY, FIELDS).filters
  )

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <QueryInput
        aria-label="Search accounts"
        fields={FIELDS}
        value={query}
        onValueChange={setQuery}
        onFiltersChange={setFilters}
      />
      <FilterBuilder
        fields={FIELDS}
        value={filters}
        onValueChange={(next: Filter[]) => {
          setFilters(next)
          setQuery(formatQuery(next, parseQuery(query, FIELDS).text))
        }}
      />
    </div>
  )
}
