"use client"

import { PaintbrushIcon } from "lucide-react"

import { cn } from "@/registry/default/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/default/ui/popover"
import { ThemePanel } from "@/components/showcase/theme-panel"
import { useShowcaseTheme } from "@/hooks/use-showcase-theme"
import { findActivePreset } from "@/lib/showcase-presets"

function keepOpenForEditor(event: Event) {
  if ((event.target as Element | null)?.closest?.("[data-theme-editor]"))
    event.preventDefault()
}

export function ThemeScopeControl({
  side,
  align = "end",
  className,
}: {
  side?: "top" | "bottom"
  align?: "start" | "center" | "end"
  className?: string
}) {
  const { theme, style, isDefault, setTheme, setStyle, resetTheme } =
    useShowcaseTheme()
  const label = isDefault
    ? "Try your theme"
    : (findActivePreset(theme)?.label ?? "Your theme")

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-8 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:text-foreground",
            className
          )}
        >
          {isDefault ? (
            <PaintbrushIcon className="size-3.5" />
          ) : (
            <span
              data-theme-scope
              className="size-3 rounded-full bg-primary ring-1 ring-border"
            />
          )}
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent
        data-theme-control
        side={side}
        align={align}
        onInteractOutside={keepOpenForEditor}
        onFocusOutside={keepOpenForEditor}
        className="max-h-(--radix-popover-content-available-height) w-72 overflow-y-auto p-0"
      >
        <ThemePanel
          theme={theme}
          style={style}
          isDefault={isDefault}
          onThemeChange={setTheme}
          onStyleChange={setStyle}
          onReset={resetTheme}
          className="rounded-none border-0"
        />
        <p className="border-t px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          Every preview on drift-ui uses this theme until you reset it.
        </p>
      </PopoverContent>
    </Popover>
  )
}
