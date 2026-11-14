"use client"

import {
  TraceWaterfall,
  type Span,
} from "@/registry/default/ui/trace-waterfall"

const FAILING_TRACE: Span[] = [
  {
    id: "req",
    name: "POST /api/charge",
    start: 0,
    duration: 410,
    service: "api-server",
    status: "error",
  },
  {
    id: "auth",
    parentId: "req",
    name: "verifyCustomer",
    start: 10,
    duration: 35,
    service: "auth",
    status: "ok",
  },
  {
    id: "pg",
    parentId: "req",
    name: "acquireDbConnection",
    start: 50,
    duration: 120,
    service: "postgres",
    status: "ok",
  },
  {
    id: "payment",
    parentId: "req",
    name: "gateway.chargeCard",
    start: 175,
    duration: 230,
    service: "payment-gateway",
    status: "error",
  },
  {
    id: "retry",
    parentId: "payment",
    name: "webhook.timeout",
    start: 405,
    duration: 0,
    service: "payment-gateway",
    status: "error",
  },
]

export function TraceWaterfallErrorSpansPreview() {
  return (
    <div className="w-full max-w-xl">
      <TraceWaterfall
        spans={FAILING_TRACE}
        defaultExpandedSpanIds={["req", "payment"]}
      />
    </div>
  )
}
