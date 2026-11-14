"use client"

import * as React from "react"
import { EraserIcon, KeyboardIcon, PenLineIcon, Undo2Icon } from "lucide-react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  exportSignature,
  nameFontSize,
  PAD_HEIGHT,
  PAD_WIDTH,
  PEN_WIDTH,
  SIGNATURE_BASELINE,
  signatureImageSrc,
  strokeToPath,
  type SignatureFormat,
  type SignatureInk,
  type SignaturePoint,
  type SignatureStroke,
} from "@/registry/default/lib/signature-pad-utils"
import { cn } from "@/registry/default/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { Input } from "@/registry/default/ui/input"

function SignaturePad({
  value,
  defaultValue = "",
  onValueChange,
  format = "svg",
  penColor = "currentColor",
  name,
  placeholder = "Sign here",
  disabled = false,
  className,
  "aria-label": ariaLabel = "Signature",
  ...props
}: Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  format?: SignatureFormat
  penColor?: string
  name?: string
  placeholder?: string
  disabled?: boolean
}) {
  const { value: signature, setValue } = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const [strokes, setStrokes] = React.useState<SignatureStroke[]>([])
  const [typing, setTyping] = React.useState(false)
  const [typedName, setTypedName] = React.useState("")
  const [activePointer, setActivePointer] = React.useState<number | null>(null)
  const [exported, setExported] = React.useState(signature)
  const surfaceRef = React.useRef<SVGSVGElement>(null)
  const draftRef = React.useRef<SVGPathElement>(null)
  const draftStroke = React.useRef<SignatureStroke>([])

  if (signature !== exported) {
    setExported(signature)
    setStrokes([])
    setTypedName("")
    setTyping(false)
  }

  const trimmedName = typedName.trim()
  const hasInk = typing ? trimmedName.length > 0 : strokes.length > 0
  const saved = signature !== "" && !hasInk
  const showPlaceholder = !hasInk && !saved && activePointer === null

  function commit(ink: SignatureInk) {
    const color =
      format === "svg" && penColor === "currentColor"
        ? penColor
        : getComputedStyle(surfaceRef.current!).color
    const next = exportSignature(ink, format, color)
    setExported(next)
    setValue(next)
  }

  function toPoint(event: { clientX: number; clientY: number }) {
    const rect = surfaceRef.current!.getBoundingClientRect()
    return [
      ((event.clientX - rect.left) / rect.width) * PAD_WIDTH,
      ((event.clientY - rect.top) / rect.height) * PAD_HEIGHT,
    ] satisfies SignaturePoint
  }

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (typing || saved || disabled) return
    if (event.button !== 0 || activePointer !== null) return
    event.currentTarget.setPointerCapture(event.pointerId)
    draftStroke.current = [toPoint(event)]
    draftRef.current?.setAttribute("d", strokeToPath(draftStroke.current))
    setActivePointer(event.pointerId)
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (event.pointerId !== activePointer) return
    const samples = event.nativeEvent.getCoalescedEvents?.() ?? []
    const moves = samples.length > 0 ? samples : [event]
    draftStroke.current.push(...moves.map(toPoint))
    draftRef.current?.setAttribute("d", strokeToPath(draftStroke.current))
  }

  function handlePointerEnd(event: React.PointerEvent<SVGSVGElement>) {
    if (event.pointerId !== activePointer) return
    const next = [...strokes, draftStroke.current]
    draftRef.current?.removeAttribute("d")
    setActivePointer(null)
    setStrokes(next)
    commit(next)
  }

  function undo() {
    const next = strokes.slice(0, -1)
    setStrokes(next)
    commit(next)
  }

  function clear() {
    setStrokes([])
    setTypedName("")
    commit([])
  }

  function toggleMode() {
    setTyping(!typing)
    commit(typing ? strokes : trimmedName)
  }

  const inertClassName =
    "aria-disabled:pointer-events-none aria-disabled:opacity-50"

  return (
    <div
      role="group"
      data-slot="signature-pad"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      className={cn("grid w-full gap-2", className)}
      {...props}
    >
      <div
        data-slot="signature-pad-surface"
        className={cn(
          "relative overflow-hidden rounded-box border border-input bg-transparent shadow-control dark:bg-input/30",
          disabled && "opacity-50"
        )}
      >
        <svg
          ref={surfaceRef}
          role="img"
          aria-label={
            hasInk || saved ? `${ariaLabel} added` : `${ariaLabel} empty`
          }
          viewBox={`0 0 ${PAD_WIDTH} ${PAD_HEIGHT}`}
          style={{ color: penColor }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          className={cn(
            "block aspect-3/1 w-full touch-none select-none",
            !typing && !saved && !disabled && "cursor-crosshair"
          )}
        >
          <line
            x1={24}
            x2={PAD_WIDTH - 24}
            y1={SIGNATURE_BASELINE + 8}
            y2={SIGNATURE_BASELINE + 8}
            className="stroke-border"
          />
          {typing ? (
            <text
              x={PAD_WIDTH / 2}
              y={SIGNATURE_BASELINE}
              textAnchor="middle"
              fontFamily="cursive"
              fontStyle="italic"
              fontSize={nameFontSize(trimmedName)}
              fill="currentColor"
            >
              {trimmedName}
            </text>
          ) : (
            <g
              fill="none"
              stroke="currentColor"
              strokeWidth={PEN_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {strokes.map((stroke, index) => (
                <path key={index} d={strokeToPath(stroke)} />
              ))}
              <path ref={draftRef} />
            </g>
          )}
        </svg>
        {saved && (
          <div
            data-slot="signature-pad-saved"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundColor: penColor,
              mask: `url("${signatureImageSrc(signature)}") center / contain no-repeat`,
            }}
          />
        )}
        {showPlaceholder && (
          <span className="pointer-events-none absolute bottom-1/4 left-6 text-sm text-muted-foreground">
            {placeholder}
          </span>
        )}
      </div>
      {typing && (
        <Input
          autoFocus
          aria-label="Type your name"
          placeholder="Your full name"
          value={typedName}
          disabled={disabled}
          onChange={(event) => {
            setTypedName(event.target.value)
            commit(event.target.value.trim())
          }}
        />
      )}
      <div
        data-slot="signature-pad-actions"
        className="flex items-center gap-1"
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled || saved}
          onClick={toggleMode}
        >
          {typing ? <PenLineIcon /> : <KeyboardIcon />}
          {typing ? "Draw instead" : "Type instead"}
        </Button>
        {!typing && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            aria-disabled={strokes.length === 0 || undefined}
            onClick={() => strokes.length > 0 && undo()}
            className={cn("ml-auto", inertClassName)}
          >
            <Undo2Icon />
            Undo
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          aria-disabled={signature === "" || undefined}
          onClick={() => signature !== "" && clear()}
          className={cn(typing && "ml-auto", inertClassName)}
        >
          <EraserIcon />
          Clear
        </Button>
      </div>
      {name && (
        <input
          type="hidden"
          name={name}
          disabled={disabled}
          value={signature}
        />
      )}
    </div>
  )
}

export { SignaturePad }
