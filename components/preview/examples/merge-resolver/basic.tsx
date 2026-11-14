"use client"

import * as React from "react"

import type {
  MergedRecord,
  MergeField,
} from "@/registry/default/lib/merge-resolver.ts"
import { MergeResolver } from "@/registry/default/ui/merge-resolver"

const PROFILE_FIELDS: MergeField[] = [
  {
    name: "displayName",
    label: "Display Name",
    ours: "Morgan Chen",
    theirs: "Morgan C.",
  },
  {
    name: "role",
    label: "Role",
    ours: "Lead Designer",
    theirs: "Principal Designer",
  },
  {
    name: "status",
    label: "Status",
    ours: "Active",
    theirs: "Active",
  },
]

export function MergeResolverBasicPreview() {
  const [saved, setSaved] = React.useState<MergedRecord | null>(null)

  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <MergeResolver
        fields={PROFILE_FIELDS}
        onResolve={(record) => setSaved(record)}
      />
      {saved && (
        <p className="text-xs text-muted-foreground">
          Resolved: {saved.displayName} ({saved.role})
        </p>
      )}
    </div>
  )
}
