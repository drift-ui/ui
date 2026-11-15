"use client"

import * as React from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

import { cn } from "@/registry/default/lib/utils"

const COPIED_RESET_MS = 1600

export function CopyCommand({
  command,
  iconOnly = false,
  className,
}: {
  command: string
  iconOnly?: boolean
  className?: string
}) {
  const [hasCopied, setHasCopied] = React.useState(false)
  const resetTimerRef = React.useRef<ReturnType<typeof setTimeout>>(undefined)

  React.useEffect(() => () => clearTimeout(resetTimerRef.current), [])

  async function copyCommand() {
    await navigator.clipboard.writeText(command)
    setHasCopied(true)
    clearTimeout(resetTimerRef.current)
    resetTimerRef.current = setTimeout(
      () => setHasCopied(false),
      COPIED_RESET_MS
    )
  }

  const status = (
    <span className="sr-only" role="status">
      {hasCopied ? "Copied to clipboard" : ""}
    </span>
  )

  const icon = hasCopied ? (
    <CheckIcon className="size-3.5 text-emerald-400" />
  ) : (
    <CopyIcon className="size-3.5 transition-transform group-active:scale-90" />
  )

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={copyCommand}
        aria-label={`Copy ${command}`}
        className={cn(
          "group flex size-8 shrink-0 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors outline-none hover:border-border hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
          className
        )}
      >
        {icon}
        {status}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={copyCommand}
      aria-label={`Copy ${command}`}
      className={cn(
        "group flex min-h-10 max-w-full min-w-0 items-center gap-3 rounded-md border bg-card/60 px-3.5 py-2 text-left font-mono text-[13px] text-muted-foreground backdrop-blur-sm transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className
      )}
    >
      <span className="text-muted-foreground/60">$</span>
      <span className="min-w-0 text-foreground">
        {command.split(" ").map((word, index) => (
          <React.Fragment key={index}>
            {index > 0 && " "}
            <span className="whitespace-nowrap">{word}</span>
          </React.Fragment>
        ))}
      </span>
      <span className="ml-auto flex size-4 items-center justify-center">
        {icon}
      </span>
      {status}
    </button>
  )
}
