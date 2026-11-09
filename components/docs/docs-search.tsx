"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CornerDownLeftIcon } from "lucide-react"

import { cn } from "@/registry/default/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/registry/default/ui/command"
import { ShortcutKeys } from "@/registry/default/ui/shortcut-recorder"
import { matchesShortcut } from "@/registry/default/lib/shortcut"
import { useActiveComponent } from "@/components/docs/component-nav-list"
import { scoreSearchEntry } from "@/lib/docs-search"
import { componentPath } from "@/lib/primitive-library"

export type SearchGroup = {
  id: string
  label: string
  entries: { slug: string; name: string; description: string }[]
}

const SEARCH_SHORTCUT = "Mod+K"

const PAGES = [
  { href: "/components", label: "All components" },
  { href: "/blocks", label: "Blocks" },
  { href: "/themes", label: "Themes" },
  { href: "/#install", label: "Install" },
  { href: "/contributors", label: "Contributors" },
]

function PageItem({
  label,
  onSelect,
}: {
  label: string
  onSelect: () => void
}) {
  return (
    <CommandItem onSelect={onSelect} className="group/item gap-3">
      {label}
      <CornerDownLeftIcon className="ml-auto hidden shrink-0 text-muted-foreground group-data-[selected=true]/item:block" />
    </CommandItem>
  )
}

function EntryItem({
  entry,
  onSelect,
}: {
  entry: SearchGroup["entries"][number]
  onSelect: () => void
}) {
  return (
    <CommandItem
      value={entry.name}
      keywords={[entry.slug, entry.description]}
      onSelect={onSelect}
      className="group/item gap-3"
    >
      <span className="shrink-0">{entry.name}</span>
      <span className="ml-auto hidden min-w-0 truncate text-xs text-muted-foreground group-data-[selected=true]/item:block">
        {entry.description}
      </span>
      <CornerDownLeftIcon className="hidden shrink-0 text-muted-foreground group-data-[selected=true]/item:block" />
    </CommandItem>
  )
}

export function DocsSearch({ groups }: { groups: SearchGroup[] }) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { library } = useActiveComponent()

  useEffect(() => {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return
      if (!matchesShortcut(event, SEARCH_SHORTCUT, isMac)) return

      event.preventDefault()
      if (rootRef.current?.contains(document.activeElement)) {
        inputRef.current?.blur()
      } else {
        inputRef.current?.focus()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  function close() {
    setQuery("")
    setIsOpen(false)
    inputRef.current?.blur()
  }

  function navigate(href: string) {
    close()
    router.push(href)
  }

  const entryItems = (group: SearchGroup) =>
    group.entries.map((entry) => (
      <EntryItem
        key={entry.slug}
        entry={entry}
        onSelect={() => navigate(componentPath(entry.slug, library))}
      />
    ))
  const pageItems = PAGES.map((page) => (
    <PageItem
      key={page.href}
      label={page.label}
      onSelect={() => navigate(page.href)}
    />
  ))

  return (
    <Command
      ref={rootRef}
      label="Search docs"
      filter={scoreSearchEntry}
      onFocus={() => setIsOpen(true)}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node)) {
          setIsOpen(false)
        }
      }}
      onKeyDown={(event) => event.key === "Escape" && close()}
      className="fixed inset-x-0 bottom-4 z-40 mx-auto h-auto w-[min(34rem,calc(100vw-2rem))] rounded-2xl border bg-popover/95 shadow-[0_16px_48px_-20px] shadow-foreground/30 backdrop-blur-md **:data-[slot=command-input-wrapper]:h-12 **:data-[slot=command-input-wrapper]:border-b-0 **:data-[slot=command-input-wrapper]:px-4 [&_[cmdk-group-heading]]:sticky [&_[cmdk-group-heading]]:top-0 [&_[cmdk-group-heading]]:z-10 [&_[cmdk-group-heading]]:bg-popover [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:uppercase"
    >
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <CommandList
            className={cn(
              "max-h-[min(22rem,55dvh)] border-b p-1",
              query && "[&_[cmdk-list-sizer]]:p-1"
            )}
          >
            <CommandEmpty>No results found.</CommandEmpty>
            {query ? (
              <>
                {groups.map(entryItems)}
                {pageItems}
              </>
            ) : (
              <>
                {groups.map((group) => (
                  <CommandGroup key={group.id} heading={group.label}>
                    {entryItems(group)}
                  </CommandGroup>
                ))}
                <CommandGroup heading="Pages">{pageItems}</CommandGroup>
              </>
            )}
          </CommandList>
        </div>
      </div>
      <CommandInput
        ref={inputRef}
        value={query}
        onValueChange={setQuery}
        placeholder="Search components and pages"
      />
      {!isOpen && (
        <ShortcutKeys
          shortcut={SEARCH_SHORTCUT}
          className="pointer-events-none absolute right-4 bottom-3.5"
        />
      )}
    </Command>
  )
}
