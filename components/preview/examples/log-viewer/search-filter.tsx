"use client"

import * as React from "react"

import { LogViewer, type LogLine } from "@/registry/default/ui/log-viewer"

const FILTER_LOGS: LogLine[] = [
  {
    id: "1",
    timestamp: 1714561500000,
    level: "info",
    message: "Deployment pipeline started by user @devops",
  },
  {
    id: "2",
    timestamp: 1714561501200,
    level: "debug",
    message: "Cloning commit hash 8f4e21a from origin/main",
  },
  {
    id: "3",
    timestamp: 1714561503400,
    level: "warn",
    message:
      "\u001b[33m[deprecated]\u001b[0m Node.js runtime v18 will reach end-of-life soon",
  },
  {
    id: "4",
    timestamp: 1714561505000,
    level: "info",
    message: "Running typecheck and test suites...",
  },
  {
    id: "5",
    timestamp: 1714561509100,
    level: "error",
    message:
      "\u001b[31m[test-failed]\u001b[0m billing-worker.test.ts: expected 200 received 500",
  },
  {
    id: "6",
    timestamp: 1714561510200,
    level: "error",
    message: "\u001b[31m[fatal]\u001b[0m Pipeline halted due to 1 test failure",
  },
  {
    id: "7",
    timestamp: 1714561511000,
    level: "info",
    message: "Cleaning up container runner environment",
  },
]

export function LogViewerSearchFilterPreview() {
  return (
    <div className="w-full max-w-2xl">
      <LogViewer
        lines={FILTER_LOGS}
        defaultLevel="error"
        defaultSearch="test"
        height={260}
        showLineNumbers
        showTimestamps
      />
    </div>
  )
}
