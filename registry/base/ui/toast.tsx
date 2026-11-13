"use client"

import * as React from "react"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"
import { Toast as ToastPrimitive } from "@base-ui/react/toast"

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
} from "@/registry/default/lib/toast.ts"
import { cn } from "@/registry/default/lib/utils"
import { Button } from "@/registry/base/ui/button"

type ToastManager = ReturnType<typeof ToastPrimitive.createToastManager>
type ManagerAddOptions = Parameters<ToastManager["add"]>[0]

type ToastAddOptions = ManagerAddOptions & {
  key?: string
  persist?: boolean
}

type UndoToastOptions = Omit<
  ManagerAddOptions,
  "id" | "type" | "actionProps"
> & {
  onCommit: () => void
  onUndo?: () => void
  undoLabel?: React.ReactNode
  shortcut?: string
}

type ProgressToastOptions = Omit<ManagerAddOptions, "timeout"> & {
  value: number
}

type UndoData = {
  timer: UndoTimer
  duration: number
  label: React.ReactNode
  shortcut?: string
}

type ToastData = {
  count?: number
  undo?: UndoData
  progress?: number
}

const DEFAULT_TIMEOUT = 5000
const VIEWPORT_SELECTOR = '[data-slot="toast-viewport"]'

let toasterTimeout = DEFAULT_TIMEOUT
let toastSequence = 0

const persisted = new Map<
  string,
  Pick<ManagerAddOptions, "title" | "description">
>()

const manager = ToastPrimitive.createToastManager()

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

function defaultTimeout(options: ManagerAddOptions) {
  if (toasterTimeout === 0) return 0
  return readableDuration(
    toastText(options.title, options.description),
    toasterTimeout
  )
}

function add({ key, persist, ...options }: ToastAddOptions) {
  const id = key ?? options.id ?? `toast-${++toastSequence}`
  const count = countToast(id, options.type)
  if (persist) {
    persisted.set(id, {
      title: options.title,
      description: options.description,
    })
  }

  return manager.add({
    ...options,
    id,
    timeout: options.timeout ?? defaultTimeout(options),
    priority:
      options.priority ?? (options.type === "error" ? "high" : undefined),
    data: { ...options.data, count },
    onClose: () => {
      forgetToast(id)
      const latest = persisted.get(id)
      if (latest) {
        persisted.delete(id)
        persistToast(id, toastText(latest.title), toastText(latest.description))
      }
      options.onClose?.()
    },
  })
}

function undo({
  onCommit,
  onUndo,
  undoLabel = "Undo",
  shortcut,
  timeout,
  ...options
}: UndoToastOptions) {
  const id = `undo-${++toastSequence}`
  const duration =
    timeout ??
    readableDuration(
      toastText(options.title, options.description),
      toasterTimeout || DEFAULT_TIMEOUT
    )
  const timer = createUndoTimer({
    duration,
    shortcut,
    onCommit: () => {
      onCommit()
      manager.close(id)
    },
    onUndo: () => {
      onUndo?.()
      manager.close(id)
    },
  })

  return manager.add({
    ...options,
    id,
    timeout: 0,
    data: {
      ...options.data,
      undo: { timer, duration, label: undoLabel, shortcut },
    },
    onClose: () => {
      timer.commit()
      options.onClose?.()
    },
  })
}

function progress({ value, ...options }: ProgressToastOptions) {
  return manager.add({
    ...options,
    id: options.id ?? `progress-${++toastSequence}`,
    timeout: 0,
    data: { ...options.data, progress: clampProgress(value) },
  })
}

type PromiseUpdate = Parameters<ToastManager["update"]>[1]

function settledToast(
  option: string | Exclude<PromiseUpdate, (...args: never[]) => unknown>,
  priority?: "high"
) {
  const resolved = typeof option === "string" ? { description: option } : option

  return {
    ...resolved,
    ...(priority ? { priority } : {}),
    timeout: resolved.timeout ?? defaultTimeout(resolved),
  }
}

const promise: ToastManager["promise"] = (value, options) =>
  manager.promise(value, {
    ...options,
    success: (result) =>
      settledToast(
        typeof options.success === "function"
          ? options.success(result)
          : options.success
      ),
    error: (reason: unknown) =>
      settledToast(
        typeof options.error === "function"
          ? options.error(reason)
          : options.error,
        "high"
      ),
  })

const update: ToastManager["update"] = (id, updates) => {
  const entry = persisted.get(id)
  if (entry && typeof updates === "object") {
    persisted.set(id, {
      title: "title" in updates ? updates.title : entry.title,
      description:
        "description" in updates ? updates.description : entry.description,
    })
  }
  manager.update(id, updates)
}

const toast = { ...manager, add, update, promise, undo, progress }

function ToastProvider({ ...props }: ToastPrimitive.Provider.Props) {
  return <ToastPrimitive.Provider {...props} />
}

function ToastPortal({ ...props }: ToastPrimitive.Portal.Props) {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />
}

function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "pointer-events-none fixed inset-x-4 bottom-4 z-50 mx-auto w-auto max-w-sm outline-none sm:right-4 sm:left-auto sm:mx-0 sm:w-full",
        className
      )}
      {...props}
    />
  )
}

function Toast({ className, ...props }: ToastPrimitive.Root.Props) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(
        "group/toast pointer-events-auto absolute right-0 bottom-0 z-[calc(1000-var(--toast-index))] w-full origin-bottom rounded-card border bg-popover text-popover-foreground shadow-card will-change-transform outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]",
        "h-(--height) [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))] [transition:transform_500ms_cubic-bezier(0.22,1,0.36,1),opacity_500ms,height_150ms]",
        "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
        "data-expanded:h-(--toast-height) data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]",
        "data-limited:opacity-0 data-starting-style:[transform:translateY(150%)]",
        "[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(150%)]",
        "data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
        "data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
        "data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        "data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
        "data-expanded:data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
        "data-expanded:data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
        "data-expanded:data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        "data-expanded:data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
        className
      )}
      {...props}
    />
  )
}

function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        "flex h-full items-center gap-3 overflow-hidden p-4 transition-opacity duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-behind:opacity-0 data-expanded:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  )
}

function ToastDescription({
  className,
  ...props
}: ToastPrimitive.Description.Props) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function ToastAction({
  className,
  render = <Button variant="outline" size="sm" />,
  ...props
}: ToastPrimitive.Action.Props) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={cn("shrink-0", className)}
      {...props}
    />
  )
}

function ToastClose({
  className,
  children,
  render = <Button variant="ghost" size="icon" />,
  ...props
}: ToastPrimitive.Close.Props) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label="Close toast"
      render={render}
      className={cn(
        "relative size-control-sm shrink-0 text-muted-foreground after:absolute after:-inset-2 after:content-[''] hover:text-foreground",
        className
      )}
      {...props}
    >
      {children ?? <XIcon aria-hidden="true" />}
    </ToastPrimitive.Close>
  )
}

const TOAST_ICONS: Record<string, React.ReactNode> = {
  success: <CircleCheckIcon aria-hidden="true" className="text-chart-2" />,
  info: <InfoIcon aria-hidden="true" className="text-muted-foreground" />,
  warning: <TriangleAlertIcon aria-hidden="true" className="text-chart-5" />,
  error: <OctagonXIcon aria-hidden="true" className="text-destructive" />,
  loading: (
    <Loader2Icon
      aria-hidden="true"
      className="animate-spin text-muted-foreground"
    />
  ),
}

function ToastIcon({ type }: { type: string | undefined }) {
  const icon = type ? TOAST_ICONS[type] : undefined
  if (!icon) return null

  return (
    <span
      data-slot="toast-icon"
      className="shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4"
    >
      {icon}
    </span>
  )
}

function ToastCount({ count }: { count: number | undefined }) {
  if (!count || count < 2) return null

  return (
    <span
      data-slot="toast-count"
      className="ms-1.5 inline-flex rounded-full bg-muted px-1.5 align-middle text-xs font-medium text-muted-foreground tabular-nums"
    >
      <span aria-hidden="true">×{count}</span>
      <span className="sr-only">, shown {count} times</span>
    </span>
  )
}

function UndoCountdown({ timer, duration }: Omit<UndoData, "label">) {
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
      ring.closest(VIEWPORT_SELECTOR) ?? ring,
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

function ToastUndo({ undo }: { undo: UndoData }) {
  return (
    <Button
      data-slot="toast-undo"
      variant="outline"
      size="sm"
      aria-keyshortcuts={undo.shortcut?.replace(
        "Mod",
        isMacPlatform() ? "Meta" : "Control"
      )}
      className="relative shrink-0 gap-2 after:absolute after:-inset-1.5"
      onClick={undo.timer.undo}
    >
      {undo.label}
      {undo.shortcut && <ToastKbd shortcut={undo.shortcut} />}
    </Button>
  )
}

function ToastProgress({ value, label }: { value: number; label: string }) {
  const percent = Math.round(value)

  return (
    <div className="flex items-center gap-2">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        data-slot="toast-progress"
        className="h-1 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full bg-primary transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${100 - percent}%)` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        {percent}%
      </span>
    </div>
  )
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager<ToastData>()

  return toasts.map((toastItem) => (
    <Toast key={toastItem.id} toast={toastItem}>
      <ToastContent>
        {toastItem.data?.undo ? (
          <span data-slot="toast-icon" className="shrink-0">
            <UndoCountdown
              timer={toastItem.data.undo.timer}
              duration={toastItem.data.undo.duration}
            />
          </span>
        ) : (
          <ToastIcon type={toastItem.type} />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ToastTitle>
            {toastItem.title ? (
              <>
                {toastItem.title}
                <ToastCount count={toastItem.data?.count} />
              </>
            ) : undefined}
          </ToastTitle>
          <ToastDescription />
          {toastItem.data?.progress !== undefined && (
            <ToastProgress
              value={toastItem.data.progress}
              label={toastText(toastItem.title) || "Progress"}
            />
          )}
        </div>
        {toastItem.data?.undo ? (
          <ToastUndo undo={toastItem.data.undo} />
        ) : (
          <ToastAction />
        )}
        <ToastClose />
      </ToastContent>
    </Toast>
  ))
}

function Toaster({
  children,
  toastManager = toast,
  ...props
}: ToastPrimitive.Provider.Props) {
  const timeout = props.timeout ?? DEFAULT_TIMEOUT

  React.useEffect(() => {
    toasterTimeout = timeout
  }, [timeout])

  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  )
}

const createToastManager = ToastPrimitive.createToastManager
const useToastManager = ToastPrimitive.useToastManager

export {
  Toaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  onToastPersist,
  toast,
  useToastManager,
}
export type {
  PersistedToast,
  ProgressToastOptions,
  ToastAddOptions,
  UndoToastOptions,
}
