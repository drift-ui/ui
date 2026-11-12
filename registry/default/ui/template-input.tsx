"use client"

import * as React from "react"
import { flushSync } from "react-dom"

import { cn } from "@/registry/default/lib/utils"
import {
  filterMentionOptions,
  type MentionOption,
} from "@/registry/default/lib/mention"
import {
  findActiveVariable,
  findTemplateVariables,
  findUnknownVariables,
  insertVariable,
} from "@/registry/default/lib/template-input-utils"
import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/registry/default/ui/popover"

const TEXT_BOX =
  "px-3 py-2 text-base break-words whitespace-pre-wrap md:text-sm"

function TemplateInput({
  value,
  defaultValue = "",
  onValueChange,
  variables,
  ref,
  onKeyDown,
  onScroll,
  className,
  "aria-describedby": ariaDescribedBy,
  ...props
}: Omit<
  React.ComponentProps<"textarea">,
  "value" | "defaultValue" | "onChange" | "onSelect"
> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  variables: MentionOption[]
}) {
  const listId = React.useId()
  const unknownId = React.useId()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const highlightsRef = React.useRef<HTMLDivElement>(null)
  React.useImperativeHandle(
    ref,
    () => textareaRef.current as HTMLTextAreaElement
  )
  const { value: text, setValue: setText } = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const [caret, setCaret] = React.useState(0)
  const [dismissedStart, setDismissedStart] = React.useState<number | null>(
    null
  )
  const [highlightedIndex, setHighlightedIndex] = React.useState(0)

  const active = findActiveVariable(text, caret)
  const options = active ? filterMentionOptions(variables, active.query) : []
  const isOpen =
    active !== null && active.start !== dismissedStart && options.length > 0
  const activeIndex = Math.min(
    highlightedIndex,
    Math.max(0, options.length - 1)
  )
  const activeKey = active ? `${active.start}:${active.query}` : ""
  const [previousKey, setPreviousKey] = React.useState(activeKey)

  if (activeKey !== previousKey) {
    setPreviousKey(activeKey)
    setHighlightedIndex(0)
    if (!active) setDismissedStart(null)
  }

  const unknown = findUnknownVariables(text, variables)
  const highlights: React.ReactNode[] = []
  let index = 0
  for (const variable of findTemplateVariables(text)) {
    highlights.push(
      text.slice(index, variable.start),
      <span
        key={variable.start}
        data-slot="template-input-variable"
        data-unknown={unknown.includes(variable.name) || undefined}
        className="rounded-sm bg-primary/15 data-unknown:bg-destructive/15 data-unknown:underline data-unknown:decoration-destructive data-unknown:decoration-wavy"
      >
        {text.slice(variable.start, variable.end)}
      </span>
    )
    index = variable.end
  }
  highlights.push(`${text.slice(index)} `)

  function selectOption(option: MentionOption) {
    if (!active) return
    const next = insertVariable(text, active, caret, option)
    flushSync(() => {
      setText(next.text)
      setCaret(next.caret)
    })
    textareaRef.current?.setSelectionRange(next.caret, next.caret)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    onKeyDown?.(event)
    if (event.defaultPrevented || !isOpen) return
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault()
        const delta = event.key === "ArrowDown" ? 1 : -1
        setHighlightedIndex(
          (activeIndex + delta + options.length) % options.length
        )
        return
      }
      case "Enter":
      case "Tab":
        event.preventDefault()
        selectOption(options[activeIndex])
        return
    }
  }

  const describedBy =
    [ariaDescribedBy, unknown.length > 0 ? unknownId : undefined]
      .filter(Boolean)
      .join(" ") || undefined

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && active) setDismissedStart(active.start)
      }}
    >
      <PopoverAnchor asChild>
        <div
          ref={rootRef}
          data-slot="template-input"
          className={cn(
            "relative flex w-full rounded-box border border-input bg-transparent shadow-control transition-[color,box-shadow] dark:bg-input/30",
            "has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-[3px] has-[textarea:focus-visible]:ring-ring/50",
            "has-aria-invalid:border-destructive has-[textarea:disabled]:cursor-not-allowed has-[textarea:disabled]:opacity-50",
            className
          )}
        >
          <div
            ref={highlightsRef}
            aria-hidden
            data-slot="template-input-highlights"
            className={cn(
              TEXT_BOX,
              "pointer-events-none absolute inset-0 overflow-hidden text-transparent select-none"
            )}
          >
            {highlights}
          </div>
          <textarea
            ref={textareaRef}
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-controls={isOpen ? listId : undefined}
            aria-activedescendant={
              isOpen ? `${listId}-${activeIndex}` : undefined
            }
            aria-describedby={describedBy}
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              setCaret(event.target.selectionStart)
            }}
            onSelect={(event) => setCaret(event.currentTarget.selectionStart)}
            onKeyDown={handleKeyDown}
            onScroll={(event) => {
              highlightsRef.current?.scrollTo(
                event.currentTarget.scrollLeft,
                event.currentTarget.scrollTop
              )
              onScroll?.(event)
            }}
            className={cn(
              TEXT_BOX,
              "relative field-sizing-content min-h-16 w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
            )}
            {...props}
          />
          {unknown.length > 0 && (
            <span id={unknownId} className="sr-only">
              Unknown {unknown.length === 1 ? "variable" : "variables"}:{" "}
              {unknown.join(", ")}
            </span>
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (rootRef.current?.contains(event.target as Node)) {
            event.preventDefault()
          }
        }}
        className="w-64 p-1"
      >
        <ul id={listId} role="listbox" data-slot="template-input-list">
          {options.map((option, optionIndex) => (
            <li
              key={option.value}
              id={`${listId}-${optionIndex}`}
              role="option"
              aria-selected={optionIndex === activeIndex}
              onPointerDown={(event) => event.preventDefault()}
              onPointerMove={() => setHighlightedIndex(optionIndex)}
              onClick={() => selectOption(option)}
              className="flex cursor-default flex-col rounded-sm px-2 py-1.5 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
            >
              <span className="flex items-baseline justify-between gap-2">
                {option.label}
                <span className="font-mono text-xs text-muted-foreground">
                  {option.value}
                </span>
              </span>
              {option.description && (
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              )}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

export { TemplateInput }
