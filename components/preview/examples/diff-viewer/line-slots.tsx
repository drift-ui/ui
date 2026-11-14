"use client"

import * as React from "react"
import { MessageSquarePlusIcon } from "lucide-react"

import type { DiffLine } from "@/registry/default/lib/diff"
import { DiffViewer } from "@/registry/default/ui/diff-viewer"

const BEFORE = `const retries = 3
const timeout = 30`

const AFTER = `const retries = 5
const timeout = 30
const debug = false`

// A stand-in for Shiki or Prism: keywords and numbers get their own color.
function highlight(line: DiffLine) {
  return line.text.split(/(\bconst\b|\b\d+\b)/).map((part, index) =>
    index % 2 === 1 ? (
      <span
        key={index}
        className={/\d/.test(part) ? "text-chart-4" : "text-chart-1"}
      >
        {part}
      </span>
    ) : (
      part
    )
  )
}

export function DiffViewerLineSlotsPreview() {
  const [commented, setCommented] = React.useState<string | null>(null)
  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <DiffViewer
        aria-label="Changes to config.ts"
        oldValue={BEFORE}
        newValue={AFTER}
        mode="unified"
        renderLine={highlight}
        renderGutter={(line) => {
          const label = `line ${line.newNumber ?? line.oldNumber}`
          return (
            <button
              type="button"
              aria-label={`Comment on ${label}`}
              onClick={() => setCommented(label)}
              className="flex size-5 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <MessageSquarePlusIcon className="size-3.5" />
            </button>
          )
        }}
      />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {commented
          ? `Commenting on ${commented}`
          : "Pick a line to comment on."}
      </p>
    </div>
  )
}
