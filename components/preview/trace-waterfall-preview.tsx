"use client"

import * as React from "react"

import {
  TraceWaterfall,
  type Span,
} from "@/registry/default/ui/trace-waterfall"

const TRACE_SPANS: Span[] = [
  {
    id: "root",
    name: "POST /checkout",
    start: 0,
    duration: 320,
    service: "api-gateway",
  },
  {
    id: "auth",
    parentId: "root",
    name: "jwt.verify",
    start: 12,
    duration: 28,
    service: "auth-svc",
  },
  {
    id: "inventory",
    parentId: "root",
    name: "inventory.checkStock",
    start: 45,
    duration: 65,
    service: "inventory-svc",
  },
  {
    id: "db-items",
    parentId: "inventory",
    name: "SELECT items FROM inventory",
    start: 52,
    duration: 48,
    service: "postgres",
  },
  {
    id: "payment",
    parentId: "root",
    name: "stripe.charge",
    start: 115,
    duration: 140,
    service: "payment-svc",
  },
  {
    id: "receipt",
    parentId: "root",
    name: "email.sendConfirmation",
    start: 260,
    duration: 45,
    service: "mailer",
  },
]

export function TraceWaterfallPreview() {
  const [selectedSpan, setSelectedSpan] = React.useState<Span | null>(null)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <TraceWaterfall
        spans={TRACE_SPANS}
        defaultExpandedSpanIds={["root", "inventory"]}
        onSpanSelect={setSelectedSpan}
      />
      {selectedSpan && (
        <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
          <div className="font-semibold">{selectedSpan.name}</div>
          <div className="mt-1 text-muted-foreground">
            Service: {selectedSpan.service ?? "unknown"} • Duration:{" "}
            {selectedSpan.duration} ms • Start: {selectedSpan.start} ms
          </div>
        </div>
      )}
    </div>
  )
}
