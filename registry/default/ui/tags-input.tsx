"use client"

import * as React from "react"
import { XIcon } from "lucide-react"

import { cn } from "@/registry/default/lib/utils"
import { Badge } from "@/registry/default/ui/badge"

const PASTE_SEPARATORS = /[,\n\t]/

function TagsInput({
  value,
  defaultValue = [],
  onValueChange,
  max,
  allowDuplicates = false,
  validate,
  addOnBlur = false,
  disabled,
  placeholder,
  className,
  onKeyDown,
  onBlur,
  onPaste,
  ...props
}: Omit<
  React.ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type" | "max"
> & {
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (tags: string[]) => void
  max?: number
  allowDuplicates?: boolean
  validate?: (tag: string) => boolean
  addOnBlur?: boolean
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [uncontrolledTags, setUncontrolledTags] = React.useState(defaultValue)
  const [draft, setDraft] = React.useState("")
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)
  const [announcement, setAnnouncement] = React.useState("")
  const tags = value ?? uncontrolledTags
  const isFull = max !== undefined && tags.length >= max

  function updateTags(next: string[]) {
    if (value === undefined) setUncontrolledTags(next)
    onValueChange?.(next)
  }

  function addTags(candidates: string[]) {
    const accepted: string[] = []
    for (const candidate of candidates) {
      const tag = candidate.trim()
      const isDuplicate = [...tags, ...accepted].includes(tag)
      const hasRoom = max === undefined || tags.length + accepted.length < max
      if (!tag || !hasRoom) continue
      if (isDuplicate && !allowDuplicates) continue
      if (validate && !validate(tag)) continue
      accepted.push(tag)
    }
    if (accepted.length === 0) return false

    const next = [...tags, ...accepted]
    updateTags(next)
    const limitNote =
      max !== undefined && next.length >= max
        ? `. Limit of ${max} reached, remove a tag to add more`
        : ""
    setAnnouncement(`Added ${accepted.join(", ")}${limitNote}`)
    return true
  }

  function selectTag(index: number | null) {
    setActiveIndex(index)
    if (index === null) return
    setAnnouncement(
      `${tags[index]} selected, ${index + 1} of ${tags.length}. Press Backspace to remove`
    )
  }

  function removeTag(index: number) {
    const removed = tags[index]
    updateTags(tags.filter((_, tagIndex) => tagIndex !== index))
    setActiveIndex(null)
    setAnnouncement(`Removed ${removed}`)
    inputRef.current?.focus()
  }

  function commitDraft() {
    if (addTags([draft])) setDraft("")
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event)
    if (event.defaultPrevented) return

    const { selectionStart, selectionEnd } = event.currentTarget
    const isCaretAtStart = selectionStart === 0 && selectionEnd === 0
    const lastIndex = tags.length - 1

    switch (event.key) {
      case "Enter":
      case ",":
        event.preventDefault()
        commitDraft()
        return
      case "Backspace":
        if (!isCaretAtStart || tags.length === 0) return
        event.preventDefault()
        if (activeIndex === null) selectTag(lastIndex)
        else removeTag(activeIndex)
        return
      case "Delete":
        if (activeIndex === null) return
        event.preventDefault()
        removeTag(activeIndex)
        return
      case "ArrowLeft":
        if (!isCaretAtStart || tags.length === 0) return
        event.preventDefault()
        selectTag(
          activeIndex === null ? lastIndex : Math.max(0, activeIndex - 1)
        )
        return
      case "ArrowRight":
        if (activeIndex === null) return
        event.preventDefault()
        selectTag(activeIndex >= lastIndex ? null : activeIndex + 1)
        return
      case "Escape":
        setActiveIndex(null)
        return
      default:
        setActiveIndex(null)
    }
  }

  return (
    <div
      data-slot="tags-input"
      data-disabled={disabled ? "" : undefined}
      onClick={() => inputRef.current?.focus()}
      className={cn(
        "flex min-h-control w-full min-w-0 cursor-text flex-wrap items-center gap-1.5 rounded-control border border-input bg-transparent px-2 py-1.5 text-base shadow-control transition-[color,box-shadow] md:text-sm dark:bg-input/30",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        "has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-destructive/20",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
    >
      {tags.map((tag, index) => (
        <Badge
          key={`${tag}-${tags.slice(0, index).filter((t) => t === tag).length}`}
          data-slot="tags-input-tag"
          data-active={activeIndex === index ? "" : undefined}
          variant="secondary"
          className="gap-1 pr-1 data-[active]:ring-2 data-[active]:ring-ring"
        >
          {tag}
          <button
            type="button"
            tabIndex={-1}
            aria-label={`Remove ${tag}`}
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation()
              removeTag(index)
            }}
            className="rounded-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <XIcon className="size-3" />
          </button>
        </Badge>
      ))}
      <input
        ref={inputRef}
        type="text"
        data-slot="tags-input-field"
        value={draft}
        disabled={disabled}
        readOnly={isFull}
        placeholder={isFull ? undefined : placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={(event) => {
          onPaste?.(event)
          const text = event.clipboardData.getData("text")
          if (!PASTE_SEPARATORS.test(text)) return
          event.preventDefault()
          addTags(text.split(PASTE_SEPARATORS))
        }}
        onBlur={(event) => {
          onBlur?.(event)
          setActiveIndex(null)
          if (addOnBlur) commitDraft()
        }}
        className="h-6 min-w-20 flex-1 bg-transparent px-1 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        {...props}
      />
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  )
}

export { TagsInput }
