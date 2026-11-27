"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CornerDownLeftIcon, SearchIcon } from "lucide-react"

import { cn } from "@/registry/default/lib/utils"
import {
  CommandDialog,
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

const KEY_HINTS = [
  { keys: "↑↓", label: "Navigate" },
  { keys: "↵", label: "Open" },
  { keys: "Esc", label: "Close" },
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

function SearchPanel({
  groups,
  onOpenComponent,
  onNavigate,
}: {
  groups: SearchGroup[]
  onOpenComponent: (slug: string) => void
  onNavigate: (href: string) => void
}) {
  const [query, setQuery] = useState("")
  const entryItems = (group: SearchGroup) =>
    group.entries.map((entry) => (
      <EntryItem
        key={entry.slug}
        entry={entry}
        onSelect={() => onOpenComponent(entry.slug)}
      />
    ))
  const pageItems = PAGES.map((page) => (
    <PageItem
      key={page.href}
      label={page.label}
      onSelect={() => onNavigate(page.href)}
    />
  ))

  return (
    <>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search components and pages"
      />
      <CommandList
        className={cn(
          "max-h-[min(24rem,60dvh)] scroll-pt-9",
          query && "[&_[cmdk-list-sizer]]:p-2"
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
      <div className="flex items-center gap-4 border-t px-3 py-2 text-xs text-muted-foreground max-sm:hidden">
        {KEY_HINTS.map((hint) => (
          <span key={hint.label} className="flex items-center gap-1.5">
            <kbd className="rounded border bg-muted px-1 font-mono text-[11px]">
              {hint.keys}
            </kbd>
            {hint.label}
          </span>
        ))}
      </div>
    </>
  )
}

export function DocsSearch({ groups }: { groups: SearchGroup[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { library } = useActiveComponent()

  useEffect(() => {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return
      if (!matchesShortcut(event, SEARCH_SHORTCUT, isMac)) return

      event.preventDefault()
      setIsOpen((open) => !open)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  function navigate(href: string) {
    setIsOpen(false)
    router.push(href)
  }

  function openComponent(slug: string) {
    navigate(componentPath(slug, library))
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Search docs"
        className="flex h-9 items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 max-lg:w-9 max-lg:justify-center lg:w-44 lg:border lg:bg-card/60 lg:px-2.5"
      >
        <SearchIcon className="size-4 shrink-0" />
        <span className="hidden flex-1 text-left lg:block">Search</span>
        <ShortcutKeys shortcut={SEARCH_SHORTCUT} className="hidden lg:flex" />
      </button>
      <CommandDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Search docs"
        description="Find a component or a page"
        filter={scoreSearchEntry}
        showCloseButton={false}
        className="top-[12dvh] translate-y-0 sm:max-w-xl"
      >
        <SearchPanel
          groups={groups}
          onOpenComponent={openComponent}
          onNavigate={navigate}
        />
      </CommandDialog>
    </>
  )
}
