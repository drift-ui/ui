"use client"

import * as React from "react"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import {
  Toaster as Sonner,
  toast as sonnerToast,
  type ExternalToast,
  type ToasterProps,
  type ToastT,
} from "sonner"

import {
  clampProgress,
  countToast,
  createUndoTimer,
  forgetToast,
  isMacPlatform,
  onToastPersist,
  persistToast,
  readableDuration,
  shortcutLabel,
  toastText,
  trackPause,
  type PersistedToast,
  type UndoTimer,
} from "@/registry/default/lib/toast"

type ToastMessage = Parameters<typeof sonnerToast>[0]

type ToastOptions = ExternalToast & {
  persist?: boolean
}

type UndoToastOptions = Omit<ExternalToast, "id" | "action" | "onAutoClose"> & {
  onCommit: () => void
  onUndo?: () => void
  undoLabel?: React.ReactNode
  shortcut?: string
}

type ProgressToastOptions = Omit<ExternalToast, "duration"> & {
  value: number
}

const DEFAULT_DURATION = 4000
const TOASTER_SELECTOR = "[data-sonner-toaster]"

let toasterDuration = DEFAULT_DURATION
let undoSequence = 0

function resolveNode(node: ToastMessage | ExternalToast["description"]) {
  return typeof node === "function" ? node() : node
}

function ToastKbd({ shortcut }: { shortcut: string }) {
  return (
    <kbd
      data-slot="toast-kbd"
      className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-current/20 px-1 font-sans text-[10px] font-medium opacity-70"
    >
      {shortcutLabel(shortcut)}
    </kbd>
  )
}

function ToastCount({ count }: { count: number }) {
  return (
    <span
      data-slot="toast-count"
      className="ms-1.5 inline-flex rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground tabular-nums"
    >
      <span aria-hidden="true">×{count}</span>
      <span className="sr-only">, shown {count} times</span>
    </span>
  )
}

function Alert({ children }: { children: React.ReactNode }) {
  return <span role="alert">{children}</span>
}

function enhance(
  show: typeof sonnerToast.success,
  kind: string,
  assertive = false
) {
  return (message: ToastMessage, data: ToastOptions = {}) => {
    const { persist, ...options } = data
    const id = options.id
    const count = id === undefined ? 1 : countToast(id, kind)
    const content = resolveNode(message)
    const description = resolveNode(options.description)
    const duration =
      options.duration ??
      readableDuration(toastText(content, description), toasterDuration)
    const title =
      count > 1 ? (
        <>
          {content}
          <ToastCount count={count} />
        </>
      ) : (
        content
      )
    const close = (toast: ToastT) => {
      if (id !== undefined) forgetToast(id)
      if (persist)
        persistToast(toast.id, toastText(content), toastText(description))
    }

    return show(assertive ? <Alert>{title}</Alert> : title, {
      ...options,
      // sonner keeps the old remaining time when a toast is updated in place and only resets it when duration changes, so alternate it by 1ms to restart the timer.
      duration: count % 2 === 0 ? duration + 1 : duration,
      onDismiss: (toast: ToastT) => {
        close(toast)
        options.onDismiss?.(toast)
      },
      onAutoClose: (toast: ToastT) => {
        close(toast)
        options.onAutoClose?.(toast)
      },
    })
  }
}

function UndoCountdown({
  timer,
  duration,
}: {
  timer: UndoTimer
  duration: number
}) {
  const ringRef = React.useRef<SVGCircleElement>(null)

  React.useEffect(() => {
    const ring = ringRef.current
    if (!ring) return

    const animation = Number.isFinite(duration)
      ? ring.animate?.([{ strokeDashoffset: 0 }, { strokeDashoffset: 1 }], {
          duration,
          fill: "forwards",
        })
      : undefined
    if (animation) animation.currentTime = duration - timer.remaining()

    const stop = trackPause(
      ring.closest(TOASTER_SELECTOR) ?? ring,
      (paused) => {
        if (paused) {
          timer.pause()
          animation?.pause()
        } else {
          timer.resume()
          animation?.play()
        }
      }
    )

    return () => {
      stop()
      animation?.cancel()
    }
  }, [timer, duration])

  return (
    <svg
      data-slot="toast-countdown"
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="size-4 -rotate-90"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        strokeWidth="2"
        className="stroke-current opacity-20"
      />
      <circle
        ref={ringRef}
        cx="8"
        cy="8"
        r="6"
        fill="none"
        strokeWidth="2"
        pathLength={1}
        strokeDasharray="1"
        className="stroke-current"
      />
    </svg>
  )
}

function undo(
  message: ToastMessage,
  {
    onCommit,
    onUndo,
    undoLabel = "Undo",
    shortcut,
    duration,
    ...options
  }: UndoToastOptions
) {
  const id = `undo-${++undoSequence}`
  const total =
    duration ??
    readableDuration(
      toastText(resolveNode(message), resolveNode(options.description)),
      toasterDuration
    )
  const timer = createUndoTimer({
    duration: total,
    shortcut,
    onCommit: () => {
      onCommit()
      sonnerToast.dismiss(id)
    },
    onUndo: () => {
      onUndo?.()
      sonnerToast.dismiss(id)
    },
  })

  return sonnerToast(message, {
    ...options,
    id,
    duration: Infinity,
    icon: <UndoCountdown timer={timer} duration={total} />,
    action: (
      <button
        type="button"
        data-slot="toast-undo"
        aria-keyshortcuts={shortcut?.replace(
          "Mod",
          isMacPlatform() ? "Meta" : "Control"
        )}
        className="relative ms-auto inline-flex h-control-sm shrink-0 items-center gap-2 rounded-control border bg-background px-3 text-xs font-medium text-foreground shadow-control outline-none after:absolute after:-inset-1.5 hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        onClick={timer.undo}
      >
        {undoLabel}
        {shortcut && <ToastKbd shortcut={shortcut} />}
      </button>
    ),
    onDismiss: (toast: ToastT) => {
      timer.commit()
      options.onDismiss?.(toast)
    },
  })
}

function ToastProgress({
  value,
  label,
  description,
}: {
  value: number
  label: string
  description: React.ReactNode
}) {
  const percent = Math.round(clampProgress(value))

  return (
    <span className="flex flex-col gap-1.5">
      {description}
      <span className="flex items-center gap-2">
        <span
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          data-slot="toast-progress"
          className="h-1 flex-1 overflow-hidden rounded-full bg-muted"
        >
          <span
            className="block h-full bg-primary transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${100 - percent}%)` }}
          />
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {percent}%
        </span>
      </span>
    </span>
  )
}

function progress(
  message: ToastMessage,
  { value, description, ...options }: ProgressToastOptions
) {
  const content = resolveNode(message)

  return sonnerToast(content, {
    ...options,
    duration: Infinity,
    description: (
      <ToastProgress
        value={value}
        label={toastText(content) || "Progress"}
        description={resolveNode(description)}
      />
    ),
  })
}

type PromiseResult = {
  message: React.ReactNode
  description?: unknown
  duration?: number
}

function isPromiseResult(result: unknown): result is PromiseResult {
  return (
    typeof result === "object" &&
    result !== null &&
    !Array.isArray(result) &&
    !React.isValidElement(result) &&
    "message" in result
  )
}

function settledToast(result: unknown, assertive: boolean) {
  if (result === null || result === undefined || typeof result === "boolean") {
    return result
  }
  const { message, ...options }: PromiseResult = isPromiseResult(result)
    ? result
    : { message: result as React.ReactNode }

  return {
    ...options,
    message: assertive ? <Alert>{message}</Alert> : message,
    duration:
      options.duration ??
      readableDuration(
        toastText(
          message,
          resolveNode(options.description as ExternalToast["description"])
        ),
        toasterDuration
      ),
  }
}

function settle<Option>(option: Option, assertive: boolean) {
  if (option === undefined) return option
  return (
    typeof option === "function"
      ? async (value: unknown) => settledToast(await option(value), assertive)
      : settledToast(option, assertive)
  ) as Option
}

const toast = Object.assign(enhance(sonnerToast, "default"), {
  ...sonnerToast,
  success: enhance(sonnerToast.success, "success"),
  info: enhance(sonnerToast.info, "info"),
  warning: enhance(sonnerToast.warning, "warning"),
  error: enhance(sonnerToast.error, "error", true),
  message: enhance(sonnerToast.message, "default"),
  loading: enhance(sonnerToast.loading, "loading"),
  promise: ((promise, data) =>
    sonnerToast.promise(
      promise,
      data && {
        ...data,
        success: settle(data.success, false),
        error: settle(data.error, true),
      }
    )) as typeof sonnerToast.promise,
  undo,
  progress,
})

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const duration =
    props.duration ?? props.toastOptions?.duration ?? DEFAULT_DURATION

  React.useEffect(() => {
    toasterDuration = duration
  }, [duration])

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group font-sans!"
      icons={{
        success: <CircleCheckIcon className="size-4 text-chart-2" />,
        info: <InfoIcon className="size-4 text-muted-foreground" />,
        warning: <TriangleAlertIcon className="size-4 text-chart-5" />,
        error: <OctagonXIcon className="size-4 text-destructive" />,
        loading: (
          <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-card)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "shadow-card! text-sm! gap-2.5!",
          description: "text-muted-foreground!",
          actionButton:
            "h-control-sm! rounded-control! border! border-border! bg-background! px-3! text-xs! font-medium! text-foreground! shadow-control! hover:bg-accent! hover:text-accent-foreground!",
          cancelButton:
            "h-control-sm! rounded-control! bg-transparent! px-3! text-xs! font-medium! text-muted-foreground! hover:text-foreground!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, onToastPersist, toast }
export type {
  PersistedToast,
  ProgressToastOptions,
  ToastOptions,
  UndoToastOptions,
}
