"use client"

import { useRef } from "react"
import { SearchIcon, XIcon } from "lucide-react"

import { cn } from "@/registry/default/lib/utils"
import { useSlashFocus } from "@/hooks/use-slash-focus"

export function SearchField({
  value,
  onValueChange,
  label = "Search components",
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  label?: string
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useSlashFocus(inputRef)

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Escape") return

    onValueChange("")
    inputRef.current?.blur()
  }

  return (
    <div className={cn("relative flex items-center", className)}>
      <SearchIcon className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={handleKeyDown}
        aria-label={label}
        placeholder={label}
        className="h-10 w-full rounded-md border bg-card/60 pr-14 pl-9 text-sm shadow-xs transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onValueChange("")}
          aria-label="Clear search"
          className="absolute right-1.5 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <XIcon className="size-3.5" />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute right-2.5 hidden h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-[11px] text-muted-foreground sm:flex">
          /
        </kbd>
      )}
    </div>
  )
}
