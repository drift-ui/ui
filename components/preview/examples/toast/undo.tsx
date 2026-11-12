"use client"

import * as React from "react"
import { ArchiveIcon, RotateCcwIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import { toast } from "@/registry/default/ui/sonner"

type Thread = { id: string; from: string; subject: string; time: string }

const THREADS: Thread[] = [
  {
    id: "stripe",
    from: "Stripe",
    subject: "Invoice 0412 is ready",
    time: "9:41",
  },
  {
    id: "linear",
    from: "Linear",
    subject: "3 issues assigned to you",
    time: "8:15",
  },
  {
    id: "vercel",
    from: "Vercel",
    subject: "Your trial ends Friday",
    time: "Mon",
  },
  { id: "figma", from: "Figma", subject: "Noor left 4 comments", time: "Sun" },
]

export function ToastUndoPreview() {
  const [threads, setThreads] = React.useState(THREADS)
  const [log, setLog] = React.useState<string[]>([])

  function remove(thread: Thread, verb: "Archived" | "Deleted") {
    setThreads((current) => current.filter((item) => item.id !== thread.id))
    toast.undo(`${verb} conversation`, {
      description: thread.subject,
      shortcut: "Mod+Z",
      onUndo: () =>
        setThreads((current) =>
          THREADS.filter(
            (item) =>
              item.id === thread.id ||
              current.some((kept) => kept.id === item.id)
          )
        ),
      onCommit: () =>
        setLog((current) =>
          [`${verb} ${thread.from} for good`, ...current].slice(0, 3)
        ),
    })
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ul className="divide-y rounded-box border text-sm">
        {threads.length === 0 ? (
          <li className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="text-muted-foreground">Inbox zero</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setThreads(THREADS)}
            >
              <RotateCcwIcon />
              Reset
            </Button>
          </li>
        ) : (
          threads.map((thread) => (
            <li key={thread.id} className="flex items-center gap-3 px-3 py-1.5">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{thread.from}</p>
                <p className="truncate text-muted-foreground">
                  {thread.subject}
                </p>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {thread.time}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Archive ${thread.subject}`}
                onClick={() => remove(thread, "Archived")}
              >
                <ArchiveIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${thread.subject}`}
                onClick={() => remove(thread, "Deleted")}
              >
                <Trash2Icon />
              </Button>
            </li>
          ))
        )}
      </ul>
      <p className="font-mono text-xs text-muted-foreground">
        {log.length === 0 ? "Nothing committed yet" : log.join(" · ")}
      </p>
    </div>
  )
}
