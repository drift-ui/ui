"use client"

import * as React from "react"

import { matchesFilters, type FilterField } from "@/registry/default/lib/filter"
import {
  parseQuery,
  tokenizeQuery,
} from "@/registry/default/lib/query-input-utils"
import { QueryInput } from "@/registry/base/ui/query-input"

const AUTHORS = [
  { value: "noor", label: "Noor Haddad" },
  { value: "kofi", label: "Kofi Mensah" },
  { value: "ilse", label: "Ilse Marchetti" },
]

const FIELDS: FilterField[] = [
  {
    id: "is",
    label: "State",
    type: "select",
    options: [
      { value: "open", label: "Open" },
      { value: "closed", label: "Closed" },
    ],
  },
  {
    id: "author",
    label: "Author",
    type: "select",
    options: AUTHORS,
  },
  {
    id: "label",
    label: "Label",
    type: "select",
    options: [
      { value: "bug", label: "Bug" },
      { value: "auth", label: "Auth" },
      { value: "needs review", label: "Needs review" },
    ],
  },
  { id: "comments", label: "Comments", type: "number" },
]

const ISSUES = [
  {
    title: "Login page loops after SSO",
    is: "open",
    author: "noor",
    label: "auth",
    comments: 12,
  },
  {
    title: "Password reset email never arrives",
    is: "open",
    author: "kofi",
    label: "bug",
    comments: 4,
  },
  {
    title: "Remember me checkbox on the login page",
    is: "closed",
    author: "noor",
    label: "needs review",
    comments: 1,
  },
  {
    title: "Session expires during upload",
    is: "open",
    author: "ilse",
    label: "bug",
    comments: 9,
  },
]

const INITIAL_QUERY = "is:open -label:bug login"

export function QueryInputPreview() {
  const [result, setResult] = React.useState(() =>
    parseQuery(INITIAL_QUERY, FIELDS)
  )
  const words = tokenizeQuery(result.text).map(({ text }) =>
    text.replace(/^"|"$/g, "").toLowerCase()
  )
  const issues = ISSUES.filter(
    (issue) =>
      matchesFilters(issue, result.filters) &&
      words.every((word) => issue.title.toLowerCase().includes(word))
  )

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <QueryInput
        aria-label="Search issues"
        placeholder="is:open author:noor login"
        fields={FIELDS}
        defaultValue={INITIAL_QUERY}
        onFiltersChange={(filters, text) => setResult({ filters, text })}
      />
      <ul className="flex flex-col gap-1 text-sm">
        {issues.map((issue) => (
          <li key={issue.title} className="flex justify-between gap-4">
            {issue.title}
            <span className="text-muted-foreground">
              {AUTHORS.find((author) => author.value === issue.author)?.label}
            </span>
          </li>
        ))}
        {issues.length === 0 && (
          <li className="text-muted-foreground">No matching issues</li>
        )}
      </ul>
    </div>
  )
}
