"use client"

import { useRef, useState } from "react"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { cn } from "@/registry/default/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { CopyButton } from "@/components/docs/copy-button"

const COLLAPSE_AFTER_LINES = 22

export function CodeFrame({
  title,
  html,
  lines,
  collapsible = false,
  className,
}: {
  title: string
  html: string
  lines: number
  collapsible?: boolean
  className?: string
}) {
  const codeRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const canCollapse = collapsible && lines > COLLAPSE_AFTER_LINES
  const isCollapsed = canCollapse && !isExpanded

  return (
    <figure
      className={cn(
        "overflow-hidden rounded-2xl border bg-card text-card-foreground",
        className
      )}
    >
      <figcaption className="flex h-11 items-center justify-between gap-4 border-b pr-1.5 pl-4 font-mono text-xs text-muted-foreground">
        <span className="truncate">{title}</span>
        <CopyButton
          value={() => codeRef.current?.textContent ?? ""}
          label={`Copy ${title}`}
        />
      </figcaption>
      <div
        className={cn("relative", isCollapsed && "max-h-96 overflow-hidden")}
      >
        <div
          ref={codeRef}
          className="code-block overflow-x-auto py-4 font-mono text-[13px] leading-6"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {isCollapsed && (
          <div className="absolute inset-x-0 bottom-0 flex h-36 items-end justify-center bg-linear-to-t from-card from-30% to-transparent pb-5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="active:scale-[0.98]"
            >
              <ChevronDownIcon />
              Show all {lines} lines
            </Button>
          </div>
        )}
      </div>
      {canCollapse && isExpanded && (
        <div className="flex justify-center border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
          >
            <ChevronUpIcon />
            Collapse
          </Button>
        </div>
      )}
    </figure>
  )
}
