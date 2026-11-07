"use client"

import * as React from "react"

import { LogViewer, type LogLine } from "@/registry/default/ui/log-viewer"

const INITIAL_LOGS: LogLine[] = [
  {
    id: "1",
    timestamp: 1714561200000,
    level: "info",
    message:
      "\u001b[1;34m[server]\u001b[0m Starting production server v2.4.1...",
  },
  {
    id: "2",
    timestamp: 1714561200150,
    level: "debug",
    message: "Loading environment variables from .env.production",
  },
  {
    id: "3",
    timestamp: 1714561200320,
    level: "info",
    message:
      "\u001b[32m✓\u001b[0m Connected to primary PostgreSQL database at pool-01:5432",
  },
  {
    id: "4",
    timestamp: 1714561200480,
    level: "info",
    message:
      "\u001b[32m✓\u001b[0m Redis cache cluster initialized (3 shards ready)",
  },
  {
    id: "5",
    timestamp: 1714561201100,
    level: "warn",
    message:
      "\u001b[33m[warn]\u001b[0m High memory threshold reached on node-3 (78% used)",
  },
  {
    id: "6",
    timestamp: 1714561202400,
    level: "info",
    message:
      "HTTP server listening on \u001b[4;36mhttp://0.0.0.0:8080\u001b[0m",
  },
  {
    id: "7",
    timestamp: 1714561203000,
    level: "debug",
    message: "Incoming request GET /api/v1/health from 10.0.4.12",
  },
  {
    id: "8",
    timestamp: 1714561203015,
    level: "info",
    message: "GET /api/v1/health \u001b[32m200 OK\u001b[0m - 14ms",
  },
  {
    id: "9",
    timestamp: 1714561205200,
    level: "error",
    message:
      "\u001b[31m[error]\u001b[0m Failed to process webhook event evt_9942: Connection timeout after 5000ms",
  },
  {
    id: "10",
    timestamp: 1714561206100,
    level: "warn",
    message:
      "\u001b[33m[retry]\u001b[0m Scheduling retry attempt 1 for webhook evt_9942 in 30s",
  },
  {
    id: "11",
    timestamp: 1714561207800,
    level: "info",
    message: "Background worker pool processed 1,420 jobs successfully",
  },
  {
    id: "12",
    timestamp: 1714561209000,
    level: "debug",
    message: "Garbage collection completed in 2.1ms (freed 48MB)",
  },
]

export function LogViewerPreview() {
  return (
    <div className="w-full max-w-2xl">
      <LogViewer
        lines={INITIAL_LOGS}
        height={320}
        showLineNumbers
        showTimestamps
      />
    </div>
  )
}
