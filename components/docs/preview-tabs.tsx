"use client"

import { useState } from "react"
import { RotateCcwIcon } from "lucide-react"
import * as m from "motion/react-m"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/registry/default/lib/utils"
import { CodeFrame } from "@/components/docs/code-frame"
import { TabsRail } from "@/components/docs/tabs-rail"
import { ThemeScopeControl } from "@/components/docs/theme-scope-control"
import type { HighlightedFile } from "@/lib/component-docs"

const TABS = [
  { value: "preview", label: "Preview" },
  { value: "code", label: "Code" },
]

export function PreviewTabs({
  preview,
  usage,
  compact = false,
}: {
  preview: React.ReactNode
  usage: HighlightedFile
  compact?: boolean
}) {
  const [tab, setTab] = useState("preview")
  const [resetCount, setResetCount] = useState(0)

  return (
    <TabsPrimitive.Root
      value={tab}
      onValueChange={setTab}
      className={cn(!compact && "flex flex-col")}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-4",
          !compact && "h-12 shrink-0 border-b px-2"
        )}
      >
        <TabsRail items={TABS} value={tab} label="Example" />
        {tab === "preview" && (
          <div className="flex items-center gap-1">
            {!compact && <ThemeScopeControl />}
            <button
              type="button"
              onClick={() => setResetCount((count) => count + 1)}
              className="flex h-8 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <m.span
                animate={{ rotate: resetCount * -360 }}
                transition={{ type: "spring", stiffness: 180, damping: 18 }}
                className="flex"
              >
                <RotateCcwIcon className="size-3.5" />
              </m.span>
              Reset
            </button>
          </div>
        )}
      </div>
      <TabsPrimitive.Content
        value="preview"
        forceMount
        className={cn(
          "outline-none data-[state=inactive]:hidden",
          compact && "mt-3"
        )}
      >
        <div
          data-theme-scope
          className={cn(
            "flex items-center justify-center bg-background bg-[radial-gradient(80%_70%_at_50%_0%,color-mix(in_oklab,var(--foreground)_5%,transparent),transparent)] px-4 font-sans text-foreground sm:px-10",
            compact
              ? "min-h-56 overflow-hidden rounded-[1.75rem] border py-10"
              : "min-h-[26rem] py-10 md:py-16"
          )}
        >
          <div
            key={resetCount}
            className={cn("w-full max-w-2xl", compact && "flex justify-center")}
          >
            {preview}
          </div>
        </div>
      </TabsPrimitive.Content>
      <TabsPrimitive.Content
        value="code"
        className={cn("outline-none", compact ? "mt-3" : "p-3")}
      >
        <CodeFrame {...usage} collapsible />
      </TabsPrimitive.Content>
    </TabsPrimitive.Root>
  )
}
