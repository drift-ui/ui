"use client"

import {
  CheckIcon,
  ChevronUpIcon,
  ClipboardPasteIcon,
  CopyIcon,
  PencilIcon,
  RotateCcwIcon,
} from "lucide-react"
import { useRef, useState } from "react"

import { cn } from "@/registry/default/lib/utils"
import { Button } from "@/registry/default/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/default/ui/popover"
import { ModePicker } from "@/components/showcase/mode-picker"
import { PresetPicker } from "@/components/showcase/preset-picker"
import { RadiusPicker } from "@/components/showcase/radius-picker"
import { StylePicker } from "@/components/showcase/style-picker"
import { ThemeCssDialog } from "@/components/showcase/theme-css-dialog"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import {
  RADIUS_TOKEN,
  applyPreset,
  findActivePreset,
  readRadius,
} from "@/lib/showcase-presets"
import type { ShowcaseStyle } from "@/lib/style-tokens"
import {
  formatThemeCss,
  isEmptyTheme,
  withToken,
  type Theme,
} from "@/lib/theme-css"

const HOVER_CLOSE_DELAY = 150

function ToolbarPopover({
  label,
  value,
  contentClassName,
  children,
}: {
  label: string
  value: React.ReactNode
  contentClassName?: string
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const lastPointerType = useRef("")
  const isHoverOpen = useRef(false)

  function openOnHover(event: React.PointerEvent) {
    if (event.pointerType !== "mouse") return
    clearTimeout(closeTimer.current)
    if (!isOpen) isHoverOpen.current = true
    setIsOpen(true)
  }

  function closeAfterHover(event: React.PointerEvent) {
    if (event.pointerType !== "mouse") return
    closeTimer.current = setTimeout(() => setIsOpen(false), HOVER_CLOSE_DELAY)
  }

  function keepHoverOpenOnClick(event: React.MouseEvent) {
    if (lastPointerType.current === "mouse" && isOpen) event.preventDefault()
  }

  function skipFocusOnHover(event: Event) {
    if (isHoverOpen.current) event.preventDefault()
  }

  function changeOpen(next: boolean) {
    isHoverOpen.current = false
    setIsOpen(next)
  }

  return (
    <Popover open={isOpen} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onPointerDown={(event) =>
            (lastPointerType.current = event.pointerType)
          }
          onPointerEnter={openOnHover}
          onPointerLeave={closeAfterHover}
          onClick={keepHoverOpenOnClick}
          className="flex h-8 shrink-0 items-center gap-2 rounded-full px-3 text-sm transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:bg-accent"
        >
          <span className="sr-only text-muted-foreground sm:not-sr-only">
            {label}
          </span>
          <span className="flex items-center gap-1.5 font-medium">{value}</span>
          <ChevronUpIcon className="size-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        data-theme-control
        side="top"
        sideOffset={10}
        onPointerEnter={openOnHover}
        onPointerLeave={closeAfterHover}
        onOpenAutoFocus={skipFocusOnHover}
        onCloseAutoFocus={skipFocusOnHover}
        className={cn("rounded-xl p-2", contentClassName)}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}

function ToolbarDivider() {
  return <span aria-hidden className="mx-0.5 h-5 w-px shrink-0 bg-border" />
}

export function ThemeToolbar({
  theme,
  style,
  isDefault,
  onThemeChange,
  onStyleChange,
  onReset,
  className,
}: {
  theme: Theme
  style: ShowcaseStyle
  isDefault: boolean
  onThemeChange: (theme: Theme) => void
  onStyleChange: (style: ShowcaseStyle) => void
  onReset: () => void
  className?: string
}) {
  const { hasCopied, copy } = useCopyToClipboard()
  const activePreset = findActivePreset(theme)
  const hasCss = !isEmptyTheme(theme)

  return (
    <div
      role="group"
      aria-label="Theme controls"
      className={cn(
        "flex max-w-[calc(100vw-2rem)] [scrollbar-width:none] items-center gap-1 overflow-x-auto rounded-full border bg-popover/85 p-1.5 text-popover-foreground shadow-lg backdrop-blur-md",
        className
      )}
    >
      <ToolbarPopover
        label="Style"
        value={style.label}
        contentClassName="w-[min(26rem,calc(100vw-2rem))]"
      >
        <StylePicker value={style} onValueChange={onStyleChange} />
      </ToolbarPopover>
      <ToolbarPopover
        label="Preset"
        value={
          <>
            <span
              aria-hidden
              data-theme-scope
              className="size-2.5 rounded-full bg-primary ring-1 ring-border"
            />
            {activePreset?.label ?? "Custom"}
          </>
        }
        contentClassName="w-80"
      >
        <PresetPicker
          activePresetId={activePreset?.id}
          onSelect={(preset) => onThemeChange(applyPreset(theme, preset))}
        />
      </ToolbarPopover>
      <ToolbarPopover
        label="Radius"
        value={<span className="tabular-nums">{readRadius(theme)}</span>}
        contentClassName="w-72"
      >
        <RadiusPicker
          value={readRadius(theme)}
          onValueChange={(radius) =>
            onThemeChange(withToken(theme, "light", RADIUS_TOKEN, radius))
          }
        />
      </ToolbarPopover>
      <ToolbarDivider />
      <ModePicker className="shrink-0" />
      <ToolbarDivider />
      <ThemeCssDialog theme={theme} onApply={onThemeChange}>
        <Button size="sm" variant="ghost" className="rounded-full">
          {hasCss ? <PencilIcon /> : <ClipboardPasteIcon />}
          {hasCss ? "Edit CSS" : "Paste CSS"}
        </Button>
      </ThemeCssDialog>
      {hasCss && (
        <Button
          size="icon"
          variant="ghost"
          className="size-8 rounded-full"
          aria-label={hasCopied ? "Copied" : "Copy CSS"}
          onClick={() => copy(formatThemeCss(theme))}
        >
          {hasCopied ? <CheckIcon /> : <CopyIcon />}
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        disabled={isDefault}
        onClick={onReset}
        className="rounded-full"
      >
        <RotateCcwIcon />
        Reset
      </Button>
    </div>
  )
}
