"use client"

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
    attributes: { "http.method": "POST", "http.status_code": 402 },
  },
  {
    id: "auth",
    parentId: "root",
    name: "jwt.verify",
    start: 12,
    duration: 28,
    service: "api-gateway",
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
    attributes: { "db.system": "postgresql", "db.rows_returned": 3 },
  },
  {
    id: "payment",
    parentId: "root",
    name: "stripe.charge",
    start: 115,
    duration: 140,
    service: "payment-svc",
    status: "error",
    attributes: {
      "error.type": "card_declined",
      "stripe.request_id": "req_8Fq2LxN0",
    },
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
  return (
    <div className="w-full max-w-2xl">
      <TraceWaterfall
        spans={TRACE_SPANS}
        defaultExpandedSpanIds={["root", "inventory"]}
        defaultSelectedSpanId="payment"
      />
    </div>
  )
}
