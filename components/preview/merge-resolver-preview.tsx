"use client"

import * as React from "react"

import type {
  MergedRecord,
  MergeField,
} from "@/registry/default/lib/merge-resolver.ts"
import { MergeResolver } from "@/registry/default/ui/merge-resolver"

const FIELDS: MergeField[] = [
  {
    name: "title",
    label: "Document Title",
    ours: "Quarterly Roadmap Draft",
    theirs: "Q3 Product Roadmap",
    base: "Product Roadmap",
  },
  {
    name: "author",
    label: "Author",
    ours: "Alex Rivera",
    theirs: "Alex Rivera",
  },
  {
    name: "summary",
    label: "Summary",
    ours: "Added sprint planning dates and mobile app feature milestones.",
    theirs: "Updated delivery milestones and added Q4 planning items.",
    base: "Initial draft roadmap.",
  },
]

export function MergeResolverPreview() {
  const [result, setResult] = React.useState<MergedRecord | null>(null)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <MergeResolver
        fields={FIELDS}
        onValueChange={() => setResult(null)}
        onResolve={(merged) => setResult(merged)}
      />
      {result && (
        <div className="rounded-md border bg-muted/30 p-3 text-xs">
          <p className="pb-1 font-semibold">Resolved Record:</p>
          <pre className="font-mono">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
