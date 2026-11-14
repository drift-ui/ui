"use client"

import * as React from "react"

import { DiffViewer } from "@/registry/default/ui/diff-viewer"

const BEFORE = `if (user) {
  notify(user)
}`

const AFTER = `if (user) {
  if (user.active) {
    notify(user)
  }
}`

export function DiffViewerIgnoreWhitespacePreview() {
  const [ignoreWhitespace, setIgnoreWhitespace] = React.useState(true)
  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={ignoreWhitespace}
          onChange={(event) => setIgnoreWhitespace(event.target.checked)}
          className="size-4 accent-primary"
        />
        Hide whitespace changes
      </label>
      <DiffViewer
        aria-label="Changes to notify.ts"
        oldValue={BEFORE}
        newValue={AFTER}
        ignoreWhitespace={ignoreWhitespace}
      />
    </div>
  )
}
