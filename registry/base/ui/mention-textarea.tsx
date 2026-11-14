"use client"

import * as React from "react"
import { flushSync } from "react-dom"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/registry/default/lib/utils"
import {
  deleteMention,
  expandSelection,
  filterMentionOptions,
  findActiveMention,
  findMentionRanges,
  insertMention,
  limitMentionOptions,
  snapCaret,
  type MentionOption,
  type MentionSource,
} from "@/registry/default/lib/mention"
import { useControllableState } from "@/registry/default/hooks/use-controllable-state"

type SearchResult = {
  key: string
  status: "done" | "error"
  options: MentionOption[]
}

function MentionTextarea({
  value,
  defaultValue = "",
  onValueChange,
  triggers,
  searchDelay = 150,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
  onBlur,
  onPointerDown,
  className,
  ...props
}: Omit<
  React.ComponentProps<"textarea">,
  "value" | "defaultValue" | "onChange" | "onSelect"
> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  triggers: Record<string, MentionSource>
  searchDelay?: number
}) {
  const listId = React.useId()
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const isComposingRef = React.useRef(false)
  const steppedRef = React.useRef(false)
  const triggersRef = React.useRef(triggers)
  React.useLayoutEffect(() => {
    triggersRef.current = triggers
  })
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
  const [inserted, setInserted] = React.useState<ReadonlySet<string>>(
    () => new Set()
  )
  const [result, setResult] = React.useState<SearchResult | null>(null)

  // Static options and anything picked from a search count as mentions. Keyed
  // on content, so an inline triggers object doesn't redo the scan each render.
  const staticTokens = Object.entries(triggers)
    .flatMap(([trigger, source]) =>
      typeof source === "function"
        ? []
        : source.map((option) => `${trigger}${option.value}`)
    )
    .join("\n")
  const tokens = React.useMemo(() => {
    const known = new Set(inserted)
    for (const token of staticTokens.split("\n")) if (token) known.add(token)
    return known
  }, [staticTokens, inserted])
  const ranges = React.useMemo(
    () => findMentionRanges(text, tokens),
    [text, tokens]
  )

  const mention = findActiveMention(text, caret, Object.keys(triggers))
  const source = mention ? triggers[mention.trigger] : undefined
  const isSearch = typeof source === "function"
  const mentionKey = mention
    ? `${mention.trigger}:${mention.start}:${mention.query}`
    : ""
  const current = isSearch && result?.key === mentionKey ? result : null
  const status = !isSearch ? "done" : (current?.status ?? "loading")
  const options = !mention
    ? []
    : isSearch
      ? (current?.options ?? [])
      : filterMentionOptions(source ?? [], mention.query)
  const isOpen =
    mention !== null &&
    mention.start !== dismissedStart &&
    (isSearch || options.length > 0)
  const activeIndex = Math.min(
    highlightedIndex,
    Math.max(0, options.length - 1)
  )
  const [previousMentionKey, setPreviousMentionKey] = React.useState(mentionKey)

  if (mentionKey !== previousMentionKey) {
    setPreviousMentionKey(mentionKey)
    setHighlightedIndex(0)
    // Leaving a mention forgets its dismissal and its last search result.
    if (!mention) {
      setDismissedStart(null)
      setResult(null)
    }
  }

  const searchTrigger = isSearch && isOpen ? mention?.trigger : undefined
  const searchQuery = isSearch && isOpen ? mention?.query : undefined
  React.useEffect(() => {
    if (searchTrigger === undefined || searchQuery === undefined) return
    // Aborting on every new query is what drops stale responses.
    const controller = new AbortController()
    const { signal } = controller
    const timer = setTimeout(() => {
      const search = triggersRef.current[searchTrigger]
      if (typeof search !== "function") return
      // Wrapping catches a search that throws, returns a non-promise or
      // resolves something other than an array.
      Promise.resolve()
        .then(() => search(searchQuery, { signal }))
        .then((found) => {
          if (!Array.isArray(found)) throw new TypeError("Expected an array")
          if (signal.aborted) return
          setResult({
            key: mentionKey,
            status: "done",
            options: limitMentionOptions(found),
          })
        })
        .catch(() => {
          if (signal.aborted) return
          setResult({ key: mentionKey, status: "error", options: [] })
        })
    }, searchDelay)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [searchTrigger, searchQuery, mentionKey, searchDelay])

  function commit(next: { text: string; caret: number }) {
    flushSync(() => {
      setText(next.text)
      setCaret(next.caret)
    })
    textareaRef.current?.setSelectionRange(next.caret, next.caret)
  }

  function selectOption(option: MentionOption) {
    if (!mention) return
    setInserted((previous) =>
      new Set(previous).add(`${mention.trigger}${option.value}`)
    )
    commit(insertMention(text, mention, caret, option))
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    // Keys that confirm an IME composition (Japanese, Chinese, Korean) belong
    // to the IME. Safari reports them as keyCode 229 after compositionend.
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    steppedRef.current = event.key === "ArrowLeft" || event.key === "ArrowRight"

    const { selectionStart, selectionEnd } = event.currentTarget
    const hasModifier = event.altKey || event.ctrlKey || event.metaKey
    if (
      (event.key === "Backspace" || event.key === "Delete") &&
      selectionStart === selectionEnd &&
      !hasModifier
    ) {
      const next = deleteMention(
        text,
        ranges,
        selectionStart,
        event.key === "Backspace" ? "backward" : "forward"
      )
      if (next) {
        event.preventDefault()
        commit(next)
        return
      }
    }

    if (!isOpen) return
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        if (options.length === 0) return
        event.preventDefault()
        const delta = event.key === "ArrowDown" ? 1 : -1
        setHighlightedIndex(
          (activeIndex + delta + options.length) % options.length
        )
        return
      }
      case "Enter":
      case "Tab":
        if (options.length === 0) return
        event.preventDefault()
        selectOption(options[activeIndex])
        return
      case "Escape":
        event.preventDefault()
        setDismissedStart(mention.start)
        return
    }
  }

  function handleSelect(event: React.SyntheticEvent<HTMLTextAreaElement>) {
    const element = event.currentTarget
    const { selectionStart, selectionEnd } = element
    // React also fires onSelect on keydown, before the caret moves, so keep
    // the arrow flag until the caret actually changes.
    if (selectionStart === selectionEnd && selectionStart === caret) return
    const stepped = steppedRef.current
    steppedRef.current = false
    if (isComposingRef.current) {
      setCaret(selectionStart)
      return
    }
    normalizeSelection(element, stepped)
  }

  function normalizeSelection(element: HTMLTextAreaElement, stepped = false) {
    const { selectionStart, selectionEnd, selectionDirection } = element
    if (selectionStart === selectionEnd) {
      const snapped = snapCaret(ranges, selectionStart, caret, stepped)
      if (snapped !== selectionStart) {
        element.setSelectionRange(snapped, snapped)
      }
      setCaret(snapped)
      return
    }
    const expanded = expandSelection(ranges, selectionStart, selectionEnd)
    if (expanded.start !== selectionStart || expanded.end !== selectionEnd) {
      element.setSelectionRange(
        expanded.start,
        expanded.end,
        selectionDirection ?? undefined
      )
    }
    setCaret(expanded.start)
  }

  const statusMessage =
    status === "loading"
      ? "Loading suggestions"
      : status === "error"
        ? "Couldn't load suggestions"
        : isSearch && options.length === 0
          ? "No results"
          : ""

  const textareaProps = {
    ref: textareaRef,
    "data-slot": "mention-textarea",
    "aria-autocomplete": "list",
    "aria-haspopup": "listbox",
    "aria-controls": isOpen ? listId : undefined,
    "aria-activedescendant":
      isOpen && options.length > 0 ? `${listId}-${activeIndex}` : undefined,
    value: text,
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(event.target.value)
      setCaret(event.target.selectionStart)
    },
    onSelect: handleSelect,
    onKeyDown: handleKeyDown,
    onCompositionStart: (
      event: React.CompositionEvent<HTMLTextAreaElement>
    ) => {
      isComposingRef.current = true
      onCompositionStart?.(event)
    },
    onCompositionEnd: (event: React.CompositionEvent<HTMLTextAreaElement>) => {
      isComposingRef.current = false
      // The caret wasn't snapped during the composition, so snap it now.
      normalizeSelection(event.currentTarget)
      onCompositionEnd?.(event)
    },
    onPointerDown: (event: React.PointerEvent<HTMLTextAreaElement>) => {
      steppedRef.current = false
      onPointerDown?.(event)
    },
    onBlur: (event: React.FocusEvent<HTMLTextAreaElement>) => {
      isComposingRef.current = false
      onBlur?.(event)
    },
    className: cn(
      "flex field-sizing-content min-h-16 w-full rounded-box border border-input bg-transparent px-3 py-2 text-base shadow-control transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
      "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
      className
    ),
    ...props,
  } as const

  // Lives outside the popup so it exists before the first message and
  // announcements aren't lost when the popup mounts or closes.
  const announcer = (
    <span role="status" className="sr-only">
      {isOpen ? statusMessage : ""}
    </span>
  )

  const list = (
    <>
      <ul
        id={listId}
        role="listbox"
        aria-busy={status === "loading"}
        data-slot="mention-textarea-list"
      >
        {options.map((option, index) => (
          <li
            key={option.value}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            onPointerDown={(event) => event.preventDefault()}
            onPointerMove={() => setHighlightedIndex(index)}
            onClick={() => selectOption(option)}
            className="flex cursor-default flex-col rounded-sm px-2 py-1.5 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
          >
            <span>{option.label}</span>
            {option.description && (
              <span className="text-xs text-muted-foreground">
                {option.description}
              </span>
            )}
          </li>
        ))}
      </ul>
      {isSearch && statusMessage && (
        <p
          data-slot="mention-textarea-status"
          className="px-2 py-1.5 text-sm text-muted-foreground"
        >
          {statusMessage}
        </p>
      )}
    </>
  )

  return (
    <PopoverPrimitive.Root
      open={isOpen}
      onOpenChange={(open, { event, reason }) => {
        if (open || !mention) return
        // Clicking the textarea itself keeps the list; Tab away still closes it.
        if (reason === "outside-press" && event.target === textareaRef.current)
          return
        setDismissedStart(mention.start)
      }}
    >
      <textarea {...textareaProps} />
      {announcer}
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          anchor={textareaRef}
          align="start"
          sideOffset={4}
          className="isolate z-50"
        >
          <PopoverPrimitive.Popup
            initialFocus={false}
            finalFocus={false}
            className="z-50 w-64 origin-(--transform-origin) rounded-box border bg-popover p-1 text-popover-foreground shadow-md outline-hidden data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95"
          >
            {list}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export { MentionTextarea }
