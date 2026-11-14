"use client"

import { CheckIcon, CopyIcon } from "lucide-react"
import { AnimatePresence } from "motion/react"
import * as m from "motion/react-m"

import { cn } from "@/registry/default/lib/utils"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"

export function CopyButton({
  value,
  label = "Copy code",
  className,
}: {
  value: string | (() => string)
  label?: string
  className?: string
}) {
  const { hasCopied, copy } = useCopyToClipboard()

  return (
    <button
      type="button"
      onClick={() => copy(typeof value === "function" ? value() : value)}
      aria-label={label}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-[color,background-color,scale] outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-90",
        className
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <m.span
          key={hasCopied ? "copied" : "idle"}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: "spring", stiffness: 520, damping: 32 }}
          className="flex"
        >
          {hasCopied ? (
            <CheckIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <CopyIcon className="size-3.5" />
          )}
        </m.span>
      </AnimatePresence>
      <span aria-live="polite" className="sr-only">
        {hasCopied ? "Copied" : ""}
      </span>
    </button>
  )
}
