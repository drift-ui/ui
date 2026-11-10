"use client"

import * as React from "react"

import { cn } from "@/registry/default/lib/utils"
import {
  isFunctionKey,
  isModifierKey,
  modifiersFromEvent,
  shortcutFromEvent,
  shortcutKeyLabel,
  splitShortcut,
  type ShortcutModifier,
} from "@/registry/default/lib/shortcut"
import { useControllableState } from "@/registry/default/hooks/use-controllable-state"

function subscribeToNothing() {
  return () => {}
}

function readIsMac() {
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
}

function useIsMac() {
  return React.useSyncExternalStore(subscribeToNothing, readIsMac, () => false)
}

function ShortcutKeys({
  shortcut,
  className,
  ...props
}: React.ComponentProps<"span"> & { shortcut: string }) {
  const isMac = useIsMac()

  return (
    <span
      data-slot="shortcut-keys"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    >
      {splitShortcut(shortcut).map((part, index) => (
        <kbd
          key={`${part}-${index}`}
          data-slot="shortcut-key"
          className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-sans text-[11px] font-medium text-muted-foreground"
        >
          {shortcutKeyLabel(part, isMac)}
        </kbd>
      ))}
    </span>
  )
}

function ShortcutRecorder({
  value,
  defaultValue = "",
  onValueChange,
  placeholder = "Record shortcut",
  requireModifier = true,
  className,
  "aria-label": ariaLabel,
  ...props
}: Omit<
  React.ComponentProps<"button">,
  "value" | "defaultValue" | "onChange"
> & {
  value?: string
  defaultValue?: string
  onValueChange?: (shortcut: string) => void
  placeholder?: string
  requireModifier?: boolean
}) {
  const isMac = useIsMac()
  const { value: shortcut, setValue: setShortcut } = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const [isRecording, setIsRecording] = React.useState(false)
  const [heldModifiers, setHeldModifiers] = React.useState<ShortcutModifier[]>(
    []
  )

  function stopRecording() {
    setIsRecording(false)
    setHeldModifiers([])
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!isRecording) return
    const modifiers = modifiersFromEvent(event, isMac)
    const hasModifier = modifiers.length > 0
    const isLeavingWithTab =
      event.key === "Tab" && modifiers.every((modifier) => modifier === "Shift")
    if (isLeavingWithTab) return stopRecording()

    event.preventDefault()
    event.stopPropagation()
    if (isModifierKey(event.key)) return setHeldModifiers(modifiers)
    if (!hasModifier && event.key === "Escape") return stopRecording()
    if (!hasModifier && ["Backspace", "Delete"].includes(event.key)) {
      setShortcut("")
      return stopRecording()
    }
    if (requireModifier && !hasModifier && !isFunctionKey(event.key)) return

    setShortcut(shortcutFromEvent(event, isMac) ?? "")
    stopRecording()
  }

  function handleKeyUp(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!isRecording) return
    setHeldModifiers(modifiersFromEvent(event, isMac))
  }

  return (
    <button
      type="button"
      {...props}
      data-slot="shortcut-recorder"
      data-recording={isRecording || undefined}
      aria-pressed={isRecording}
      onClick={() => (isRecording ? stopRecording() : setIsRecording(true))}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onBlur={stopRecording}
      className={cn(
        "inline-flex h-control min-w-40 items-center justify-between gap-3 rounded-control border border-input bg-transparent px-3 text-sm shadow-control transition-[color,box-shadow] outline-none dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "data-recording:border-ring data-recording:ring-[3px] data-recording:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
    >
      {ariaLabel && <span className="sr-only">{ariaLabel}:</span>}{" "}
      <ShortcutRecorderDisplay
        isRecording={isRecording}
        heldModifiers={heldModifiers}
        shortcut={shortcut}
        placeholder={placeholder}
      />
      <span aria-live="polite" className="sr-only">
        {isRecording &&
          "Recording. Press a key combination, Escape to cancel, Backspace to clear."}
      </span>
    </button>
  )
}

function ShortcutRecorderDisplay({
  isRecording,
  heldModifiers,
  shortcut,
  placeholder,
}: {
  isRecording: boolean
  heldModifiers: ShortcutModifier[]
  shortcut: string
  placeholder: string
}) {
  if (isRecording && heldModifiers.length > 0)
    return <ShortcutKeys shortcut={heldModifiers.join("+")} />
  if (isRecording)
    return (
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className="size-1.5 animate-pulse rounded-full bg-destructive" />
        Press keys
      </span>
    )
  if (shortcut) return <ShortcutKeys shortcut={shortcut} />
  return <span className="text-muted-foreground">{placeholder}</span>
}

export { ShortcutKeys, ShortcutRecorder }
