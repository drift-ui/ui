"use client"

import * as React from "react"

import type { FilterField } from "@/registry/default/lib/filter"
import { parseQuery } from "@/registry/default/lib/query-input-utils"
import { QueryInput } from "@/registry/default/ui/query-input"

const FIELDS: FilterField[] = [
  { id: "service", label: "Service", type: "text" },
  {
    id: "level",
    label: "Level",
    type: "select",
    options: [
      { value: "error", label: "Error" },
      { value: "warn", label: "Warning" },
      { value: "info", label: "Info" },
    ],
  },
  { id: "duration", label: "Duration (ms)", type: "number" },
  { id: "date", label: "Date", type: "date" },
]

export function QueryInputParsedOutputPreview() {
  const [query, setQuery] = React.useState(
    'level:error,warn service:*api* duration:>500 date:2025-03-01..2025-03-07 "timed out"'
  )

  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <QueryInput
        aria-label="Search logs"
        fields={FIELDS}
        value={query}
        onValueChange={setQuery}
        className="font-mono"
      />
      <pre className="overflow-x-auto rounded-box bg-muted p-3 text-xs">
        {JSON.stringify(parseQuery(query, FIELDS), null, 2)}
      </pre>
    </div>
  )
}
