"use client"

import * as React from "react"
import { PencilIcon } from "lucide-react"

import { cn } from "@/registry/default/lib/utils"

function InlineEdit({
  value,
  onSave,
  placeholder = "Empty",
  disabled,
  className,
  "aria-label": ariaLabel,
  ...props
}: Omit<React.ComponentProps<"div">, "onChange"> & {
  value: string
  onSave: (value: string) => void | Promise<void>
  placeholder?: string
  disabled?: boolean
}) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(value)
  const [hasFailed, setHasFailed] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()
  const shouldRefocusTriggerRef = React.useRef(false)

  function startEditing() {
    setDraft(value)
    setHasFailed(false)
    setIsEditing(true)
  }

  function stopEditing() {
    shouldRefocusTriggerRef.current = true
    setIsEditing(false)
  }

  function save() {
    if (draft === value) return stopEditing()
    startTransition(async () => {
      try {
        await onSave(draft)
        stopEditing()
      } catch {
        setHasFailed(true)
      }
    })
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "Enter":
        event.preventDefault()
        save()
        return
      case "Escape":
        event.preventDefault()
        stopEditing()
        return
    }
  }

  return (
    <div
      data-slot="inline-edit"
      data-editing={isEditing || undefined}
      className={cn("group/inline-edit relative w-full min-w-0", className)}
      {...props}
    >
      {isEditing ? (
        <input
          autoFocus
          data-slot="inline-edit-input"
          aria-label={ariaLabel}
          aria-invalid={hasFailed || undefined}
          aria-busy={isPending || undefined}
          value={draft}
          readOnly={isPending}
          placeholder={placeholder}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (!isPending) save()
          }}
          className={cn(
            "-mx-2 h-control-sm w-[calc(100%+1rem)] rounded-control border border-input bg-transparent px-2 text-sm shadow-control outline-none dark:bg-input/30",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "aria-busy:opacity-60 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
          )}
        />
      ) : (
        <button
          ref={(node) => {
            if (!node || !shouldRefocusTriggerRef.current) return
            shouldRefocusTriggerRef.current = false
            node.focus()
          }}
          type="button"
          data-slot="inline-edit-trigger"
          disabled={disabled}
          onClick={startEditing}
          className={cn(
            "-mx-2 flex h-control-sm w-[calc(100%+1rem)] items-center justify-between gap-2 rounded-control px-2 text-left text-sm outline-none",
            "hover:bg-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none"
          )}
        >
          {ariaLabel && <span className="sr-only">Edit {ariaLabel}:</span>}{" "}
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          <PencilIcon className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-focus-within/inline-edit:opacity-100 group-hover/inline-edit:opacity-100" />
        </button>
      )}
    </div>
  )
}

export { InlineEdit }
