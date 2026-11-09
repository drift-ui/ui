"use client"

import * as React from "react"

import {
  TraceWaterfall,
  type Span,
} from "@/registry/default/ui/trace-waterfall"

const PIPELINE_SPANS: Span[] = [
  {
    id: "pipeline",
    name: "Build & Deploy Pipeline",
    start: 0,
    duration: 12500,
    service: "ci-runner",
  },
  {
    id: "lint",
    parentId: "pipeline",
    name: "eslint && prettier",
    start: 200,
    duration: 1800,
    service: "linter",
  },
  {
    id: "test",
    parentId: "pipeline",
    name: "vitest run",
    start: 2100,
    duration: 4600,
    service: "test-suite",
  },
  {
    id: "build",
    parentId: "pipeline",
    name: "next build",
    start: 6800,
    duration: 3800,
    service: "compiler",
  },
  {
    id: "deploy",
    parentId: "pipeline",
    name: "docker push",
    start: 10700,
    duration: 1600,
    service: "deployer",
  },
]

export function TraceWaterfallInteractivePreview() {
  const [expandedIds, setExpandedIds] = React.useState<string[]>(["pipeline"])

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Click a span or press Enter to inspect</span>
        <button
          type="button"
          onClick={() =>
            setExpandedIds(expandedIds.length > 0 ? [] : ["pipeline"])
          }
          className="rounded border border-border px-2 py-1 text-foreground transition-colors hover:bg-muted"
        >
          {expandedIds.length > 0 ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <TraceWaterfall
        spans={PIPELINE_SPANS}
        expandedSpanIds={expandedIds}
        onExpandedChange={setExpandedIds}
      />
    </div>
  )
}
