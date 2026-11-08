"use client"

import {
  TraceWaterfall,
  type Span,
} from "@/registry/default/ui/trace-waterfall"

const SPANS: Span[] = [
  {
    id: "1",
    name: "GET /api/v1/users",
    start: 0,
    duration: 180,
    service: "web",
  },
  {
    id: "2",
    parentId: "1",
    name: "authenticate",
    start: 5,
    duration: 20,
    service: "auth",
  },
  {
    id: "3",
    parentId: "1",
    name: "findUsers",
    start: 30,
    duration: 110,
    service: "user-svc",
  },
  {
    id: "4",
    parentId: "3",
    name: "SELECT * FROM users LIMIT 50",
    start: 40,
    duration: 85,
    service: "db",
  },
  {
    id: "5",
    parentId: "1",
    name: "serializeResponse",
    start: 145,
    duration: 25,
    service: "web",
  },
]

export function TraceWaterfallBasicPreview() {
  return (
    <div className="w-full max-w-xl">
      <TraceWaterfall spans={SPANS} />
    </div>
  )
}
