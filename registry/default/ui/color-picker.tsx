"use client"

import * as React from "react"
import { PipetteIcon } from "lucide-react"

import { cn } from "@/registry/default/lib/utils"
import {
  formatHex,
  formatOklch,
  parseHex,
  type Hsva,
} from "@/registry/default/lib/color"
import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import { Button, buttonVariants } from "@/registry/default/ui/button"
import {
  AlphaSlider,
  ColorArea,
  ColorSwatch,
  HueSlider,
} from "@/registry/default/ui/color-picker-controls"
import { Input } from "@/registry/default/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/default/ui/popover"

const BLACK: Hsva = { h: 0, s: 0, v: 0, a: 1 }

type EyeDropperConstructor = new () => {
  open: () => Promise<{ sRGBHex: string }>
}

function subscribeToNothing() {
  return () => {}
}

function readEyeDropper() {
  return (window as { EyeDropper?: EyeDropperConstructor }).EyeDropper ?? null
}

function useEyeDropper() {
  return React.useSyncExternalStore(
    subscribeToNothing,
    readEyeDropper,
    () => null
  )
}

function HexInput({
  hex,
  onCommit,
}: {
  hex: string
  onCommit: (hex: string) => void
}) {
  const [draft, setDraft] = React.useState(hex)

  return (
    <Input
      aria-label="Hex color"
      spellCheck={false}
      value={draft}
      aria-invalid={parseHex(draft) ? undefined : true}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => onCommit(draft)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onCommit(draft)
      }}
      className="h-control-sm font-mono text-xs"
    />
  )
}

function ColorPicker({
  value,
  defaultValue = "#000000",
  onValueChange,
  showAlpha = true,
  swatches,
  variant = "outline",
  size,
  className,
  "aria-label": ariaLabel,
  ...props
}: Omit<React.ComponentProps<"button">, "value" | "defaultValue" | "onChange"> &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size"> & {
    value?: string
    defaultValue?: string
    onValueChange?: (hex: string) => void
    showAlpha?: boolean
    swatches?: string[]
  }) {
  const EyeDropper = useEyeDropper()
  const { value: hex, setValue: setHex } = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const [hsva, setHsva] = React.useState(() => parseHex(hex) ?? BLACK)
  const [syncedHex, setSyncedHex] = React.useState(hex)

  if (hex !== syncedHex) {
    setSyncedHex(hex)
    if (hex !== formatHex(hsva)) setHsva(parseHex(hex) ?? hsva)
  }

  function updateHsva(next: Hsva) {
    const normalized = showAlpha ? next : { ...next, a: 1 }
    const nextHex = formatHex(normalized)
    setHsva(normalized)
    setSyncedHex(nextHex)
    setHex(nextHex)
  }

  function commitHex(candidate: string) {
    const parsed = parseHex(candidate)
    if (parsed) updateHsva(parsed)
  }

  async function pickFromScreen() {
    if (!EyeDropper) return
    try {
      const { sRGBHex } = await new EyeDropper().open()
      const picked = parseHex(sRGBHex)
      if (picked) updateHsva({ ...picked, a: hsva.a })
    } catch {
      return
    }
  }

  return (
    <Popover>
      <PopoverTrigger
        data-slot="color-picker-trigger"
        className={cn(
          buttonVariants({ variant, size }),
          "justify-start gap-2 font-mono text-xs",
          className
        )}
        {...props}
      >
        {ariaLabel && <span className="sr-only">{ariaLabel}:</span>}{" "}
        <ColorSwatch color={hex} />
        {hex}
      </PopoverTrigger>
      <PopoverContent
        data-slot="color-picker-content"
        align="start"
        className="flex w-64 flex-col gap-3 p-3"
      >
        <ColorArea hsva={hsva} onHsvaChange={updateHsva} />
        <div className="flex items-center gap-3">
          {EyeDropper && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Pick a color from the screen"
              onClick={pickFromScreen}
              className="size-control-sm"
            >
              <PipetteIcon />
            </Button>
          )}
          <div className="flex flex-1 flex-col gap-3">
            <HueSlider hsva={hsva} onHsvaChange={updateHsva} />
            {showAlpha && <AlphaSlider hsva={hsva} onHsvaChange={updateHsva} />}
          </div>
        </div>
        <HexInput key={hex} hex={hex} onCommit={commitHex} />
        <output className="truncate font-mono text-[11px] text-muted-foreground select-all">
          {formatOklch(hsva)}
        </output>
        {swatches && (
          <div className="grid grid-cols-8 gap-1.5">
            {swatches.map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={`Use ${swatch}`}
                onClick={() => commitHex(swatch)}
                className="rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <ColorSwatch color={swatch} className="size-full" />
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export { ColorPicker }
