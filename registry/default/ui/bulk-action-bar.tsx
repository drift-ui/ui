"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { XIcon } from "lucide-react"
import { AnimatePresence, motion, MotionConfig } from "motion/react"
import { Portal, Toolbar as ToolbarPrimitive } from "radix-ui"

import { cn } from "@/registry/default/lib/utils"
import { Button } from "@/registry/default/ui/button"

const BAR_SPRING = { type: "spring", bounce: 0.2, visualDuration: 0.3 } as const
const BAR_HIDDEN = { opacity: 0, y: 16 }

const bulkActionBarVariants = cva(
  "pointer-events-none inset-x-0 z-50 flex justify-center px-4",
  {
    variants: {
      placement: {
        viewport: "fixed bottom-6",
        container: "absolute bottom-4",
      },
    },
    defaultVariants: {
      placement: "viewport",
    },
  }
)

function useClearOnEscape(isActive: boolean, onClear: () => void) {
  React.useEffect(() => {
    if (!isActive) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return
      onClear()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isActive, onClear])
}

function SelectedCount({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-1.5 px-2 text-sm whitespace-nowrap">
      <span className="relative inline-flex h-5 min-w-5 items-center justify-center overflow-hidden rounded-md bg-primary px-1 font-mono text-xs text-primary-foreground tabular-nums">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={count}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={BAR_SPRING}
          >
            {count}
          </motion.span>
        </AnimatePresence>
      </span>{" "}
      selected
    </span>
  )
}

function BulkActionBar({
  selectedCount,
  onClear,
  placement,
  "aria-label": ariaLabel = "Bulk actions",
  className,
  children,
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.Root> &
  VariantProps<typeof bulkActionBarVariants> & {
    selectedCount: number
    onClear: () => void
  }) {
  const isVisible = selectedCount > 0
  useClearOnEscape(isVisible, onClear)

  const bar = (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            key="bulk-action-bar"
            initial={BAR_HIDDEN}
            animate={{ opacity: 1, y: 0 }}
            exit={BAR_HIDDEN}
            transition={BAR_SPRING}
            className={bulkActionBarVariants({ placement })}
          >
            <ToolbarPrimitive.Root
              data-slot="bulk-action-bar"
              aria-label={ariaLabel}
              className={cn(
                "pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-lg",
                className
              )}
              {...props}
            >
              <SelectedCount count={selectedCount} />
              <ToolbarPrimitive.Separator className="mx-1 h-5 w-px shrink-0 bg-border" />
              {children}
              <ToolbarPrimitive.Separator className="mx-1 h-5 w-px shrink-0 bg-border" />
              <ToolbarPrimitive.Button asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Clear selection"
                  onClick={onClear}
                  className="size-control-sm"
                >
                  <XIcon />
                </Button>
              </ToolbarPrimitive.Button>
            </ToolbarPrimitive.Root>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  )

  if (placement === "container") return bar
  return <Portal.Root>{bar}</Portal.Root>
}

function BulkActionBarButton({
  variant = "ghost",
  size = "sm",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <ToolbarPrimitive.Button asChild>
      <Button
        data-slot="bulk-action-bar-button"
        variant={variant}
        size={size}
        {...props}
      />
    </ToolbarPrimitive.Button>
  )
}

export { BulkActionBar, BulkActionBarButton, bulkActionBarVariants }
