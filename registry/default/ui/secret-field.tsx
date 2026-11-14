"use client"

import * as React from "react"
import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon } from "lucide-react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import { useCopyToClipboard } from "@/registry/default/hooks/use-copy-to-clipboard"
import {
  getVisibleTail,
  maskSecret,
} from "@/registry/default/lib/secret-field-utils"
import { cn } from "@/registry/default/lib/utils"

const BUTTON_CLASS_NAME =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-control text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-3.5"

function SecretField({
  value,
  visibleChars = 4,
  revealed: revealedProp,
  defaultRevealed = false,
  onRevealedChange,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  value: string
  visibleChars?: number
  revealed?: boolean
  defaultRevealed?: boolean
  onRevealedChange?: (revealed: boolean) => void
}) {
  const { value: revealed, setValue: setRevealed } = useControllableState({
    value: revealedProp,
    defaultValue: defaultRevealed,
    onChange: onRevealedChange,
  })
  const { copied, copy } = useCopyToClipboard()
  const tail = getVisibleTail(value, visibleChars)

  return (
    <div
      role="group"
      data-slot="secret-field"
      data-revealed={revealed}
      className={cn(
        "flex h-control w-full min-w-0 items-center gap-1 rounded-control border bg-transparent pr-1 pl-3 font-mono text-sm shadow-control dark:bg-input/30",
        className
      )}
      {...props}
    >
      <span data-slot="secret-field-value" className="min-w-0 flex-1 truncate">
        {revealed ? (
          value
        ) : (
          <>
            <span aria-hidden>{maskSecret(value, visibleChars)}</span>
            <span className="sr-only">
              {tail ? `Hidden, ends in ${tail}` : "Hidden"}
            </span>
          </>
        )}
      </span>
      <button
        type="button"
        data-slot="secret-field-reveal"
        aria-label="Reveal"
        aria-pressed={revealed}
        onClick={() => setRevealed((previous) => !previous)}
        className={BUTTON_CLASS_NAME}
      >
        {revealed ? <EyeOffIcon /> : <EyeIcon />}
      </button>
      <button
        type="button"
        data-slot="secret-field-copy"
        aria-label="Copy"
        onClick={() => copy(value)}
        className={BUTTON_CLASS_NAME}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      <span role="status" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </div>
  )
}

export { SecretField }
