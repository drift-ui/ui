"use client"

import * as React from "react"

import { cn } from "@/registry/default/lib/utils"
import {
  filterSections,
  matchesTrigger,
  type CheatsheetSection,
} from "@/registry/default/lib/shortcut-cheatsheet-utils"
import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/registry/default/ui/dialog"
import { Input } from "@/registry/default/ui/input"
import { ShortcutKeys } from "@/registry/default/ui/shortcut-recorder"

function ShortcutCheatsheet({
  sections,
  trigger = "?",
  open,
  defaultOpen = false,
  onOpenChange,
  className,
  ...props
}: React.ComponentProps<typeof DialogContent> & {
  sections: CheatsheetSection[]
  trigger?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const { value: isOpen, setValue: setIsOpen } = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
      if (event.defaultPrevented || !matchesTrigger(event, trigger, isMac))
        return
      event.preventDefault()
      setIsOpen(true)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [trigger, setIsOpen])

  React.useEffect(() => {
    if (!isOpen) return
    const opener = document.activeElement
    return () => {
      if (opener instanceof HTMLElement) opener.focus({ preventScroll: true })
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        data-slot="shortcut-cheatsheet"
        className={cn("sm:max-w-xl", className)}
        {...props}
      >
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription className="sr-only">
            Search by action or section. Press Escape to close.
          </DialogDescription>
        </DialogHeader>
        <ShortcutCheatsheetResults sections={sections} />
      </DialogContent>
    </Dialog>
  )
}

function ShortcutCheatsheetResults({
  sections,
}: {
  sections: CheatsheetSection[]
}) {
  const [query, setQuery] = React.useState("")
  const visibleSections = filterSections(sections, query)
  const count = visibleSections.reduce(
    (total, section) => total + section.shortcuts.length,
    0
  )

  return (
    <>
      <Input
        type="search"
        aria-label="Search shortcuts"
        placeholder="Search shortcuts"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.repeat && !query) event.preventDefault()
        }}
      />
      <div
        role="region"
        aria-label="Shortcuts"
        tabIndex={0}
        data-slot="shortcut-cheatsheet-sections"
        className="flex max-h-[60vh] flex-col gap-5 overflow-y-auto rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {visibleSections.map((section, sectionIndex) => (
          <section key={`${section.title}-${sectionIndex}`}>
            <h3 className="mb-1 text-xs font-medium text-muted-foreground">
              {section.title}
            </h3>
            <dl>
              {section.shortcuts.map((shortcut, shortcutIndex) => (
                <div
                  key={`${shortcut.label}-${shortcutIndex}`}
                  className="flex items-center justify-between gap-4 py-1 text-sm"
                >
                  <dt>{shortcut.label}</dt>
                  <dd>
                    <ShortcutKeys shortcut={shortcut.keys} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <p
          role="status"
          className={cn(
            "py-6 text-center text-sm text-muted-foreground",
            count > 0 && "sr-only"
          )}
        >
          {count === 0 && "No shortcuts found"}
          {count === 1 && "1 shortcut"}
          {count > 1 && `${count} shortcuts`}
        </p>
      </div>
    </>
  )
}

export { ShortcutCheatsheet }
