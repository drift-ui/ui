"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
import { LogViewer, type LogLine } from "@/registry/default/ui/log-viewer"

const INITIAL_STREAM: LogLine[] = [
  {
    id: "1",
    timestamp: Date.now() - 5000,
    level: "info",
    message: "Job worker service starting up...",
  },
  {
    id: "2",
    timestamp: Date.now() - 4000,
    level: "info",
    message:
      "\u001b[32m✓\u001b[0m Queue consumer connected to amqp://queue.internal:5672",
  },
  {
    id: "3",
    timestamp: Date.now() - 3000,
    level: "debug",
    message: "Prefetch count set to 50 concurrent tasks",
  },
]

const SAMPLE_MESSAGES = [
  {
    level: "info",
    message: "Processing batch \u001b[36m#batch-8491\u001b[0m (12 items)",
  },
  { level: "debug", message: "Dispatched task to worker thread 3" },
  { level: "info", message: "\u001b[32m✓\u001b[0m Batch completed in 42ms" },
  {
    level: "warn",
    message:
      "\u001b[33m[throttle]\u001b[0m API rate limit approaching 85% capacity",
  },
  { level: "info", message: "Syncing status with webhook endpoint" },
  {
    level: "error",
    message:
      "\u001b[31m[fail]\u001b[0m Third-party webhook 503 Service Unavailable",
  },
]

export function LogViewerStreamingPreview() {
  const [lines, setLines] = React.useState<LogLine[]>(INITIAL_STREAM)
  const [isStreaming, setIsStreaming] = React.useState(true)

  React.useEffect(() => {
    if (!isStreaming) return

    const interval = setInterval(() => {
      setLines((prev) => {
        const nextIndex = prev.length % SAMPLE_MESSAGES.length
        const sample = SAMPLE_MESSAGES[nextIndex]
        const newLine: LogLine = {
          id: String(prev.length + 1),
          timestamp: Date.now(),
          level: sample.level,
          message: sample.message,
        }
        return [...prev, newLine]
      })
    }, 1500)

    return () => clearInterval(interval)
  }, [isStreaming])

  return (
    <div className="flex w-full max-w-2xl flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Simulating real-time server stream ({lines.length} lines)
        </span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => setIsStreaming(!isStreaming)}
        >
          {isStreaming ? "Pause stream" : "Resume stream"}
        </Button>
      </div>
      <LogViewer lines={lines} height={280} showLineNumbers showTimestamps />
    </div>
  )
}
