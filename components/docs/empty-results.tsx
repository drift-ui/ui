import type * as React from "react"
import { SearchXIcon } from "lucide-react"

import { Button } from "@/registry/default/ui/button"

export function EmptyResults({
  query,
  onReset,
  hint = "Try a behavior instead of a name, like “keyboard”, “upload” or “time”.",
  resetLabel = "Show all components",
  action,
}: {
  query: string
  onReset: () => void
  hint?: string
  resetLabel?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-5 rounded-[1.75rem] border border-dashed px-6 py-16 sm:items-center sm:text-center">
      <span className="flex size-11 items-center justify-center rounded-xl border bg-card">
        <SearchXIcon className="size-5 text-muted-foreground" />
      </span>
      <div className="flex flex-col gap-1.5">
        <p className="font-medium">
          Nothing matches &ldquo;{query.trim()}&rdquo;
        </p>
        <p className="max-w-[44ch] text-sm text-muted-foreground">{hint}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-center">
        <Button
          variant="outline"
          onClick={onReset}
          className="active:scale-[0.98]"
        >
          {resetLabel}
        </Button>
        {action}
      </div>
    </div>
  )
}
