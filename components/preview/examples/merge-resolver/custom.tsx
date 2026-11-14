"use client"

import * as React from "react"

import type {
  MergedRecord,
  MergeField,
  MergeResolutions,
} from "@/registry/default/lib/merge-resolver.ts"
import { Button } from "@/registry/default/ui/button"
import { MergeResolver } from "@/registry/default/ui/merge-resolver"

const CONFIG_FIELDS: MergeField[] = [
  {
    name: "endpoint",
    label: "API Endpoint",
    ours: "https://api-stage.internal/v1",
    theirs: "https://api-prod.internal/v2",
  },
  {
    name: "timeout",
    label: "Timeout (seconds)",
    ours: "30",
    theirs: "60",
  },
]

export function MergeResolverCustomPreview() {
  const [resolutions, setResolutions] = React.useState<MergeResolutions>({
    endpoint: {
      choice: "custom",
      customValue: "https://api-gateway.internal/v2",
    },
  })
  const [resolved, setResolved] = React.useState<MergedRecord | null>(null)

  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setResolutions({})
            setResolved(null)
          }}
        >
          Reset selections
        </Button>
      </div>
      <MergeResolver
        fields={CONFIG_FIELDS}
        value={resolutions}
        onValueChange={setResolutions}
        onResolve={(record) => setResolved(record)}
      />
      {resolved && (
        <div className="rounded border bg-muted/40 p-2 font-mono text-xs">
          Endpoint: {resolved.endpoint}, Timeout: {resolved.timeout}s
        </div>
      )}
    </div>
  )
}
