import {
  matchesShortcut,
  shortcutKeyLabel,
  splitShortcut,
} from "@/registry/default/lib/shortcut"

export type ToastKey = string | number

export type PersistedToast = {
  id: string
  title: string
  body?: string
  createdAt: Date
}

export type UndoTimer = {
  commit: () => void
  undo: () => void
  pause: () => void
  resume: () => void
  remaining: () => number
}

export type UndoTimerOptions = {
  duration: number
  onCommit: () => void
  onUndo?: () => void
  shortcut?: string
}

const READING_LEAD_MS = 1000
const MS_PER_CHARACTER = 60

const counts = new Map<ToastKey, { kind: string; count: number }>()
const shortcutHandlers: { shortcut: string; run: () => void }[] = []
const persistListeners = new Set<(toast: PersistedToast) => void>()

export function isMacPlatform() {
  return (
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
  )
}

export function shortcutLabel(shortcut: string, isMac = isMacPlatform()) {
  return splitShortcut(shortcut)
    .map((part) => shortcutKeyLabel(part, isMac))
    .join(isMac ? "" : "+")
}

function isEditable(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  )
}

function onShortcutKeyDown(event: KeyboardEvent) {
  const handler = shortcutHandlers.at(-1)
  if (!handler || event.defaultPrevented || isEditable(event.target)) return
  if (!matchesShortcut(event, handler.shortcut, isMacPlatform())) return
  event.preventDefault()
  handler.run()
}

function bindShortcut(shortcut: string, run: () => void) {
  const handler = { shortcut, run }
  if (shortcutHandlers.length === 0) {
    document.addEventListener("keydown", onShortcutKeyDown)
  }
  shortcutHandlers.push(handler)

  return () => {
    shortcutHandlers.splice(shortcutHandlers.indexOf(handler), 1)
    if (shortcutHandlers.length === 0) {
      document.removeEventListener("keydown", onShortcutKeyDown)
    }
  }
}

export function onToastPersist(listener: (toast: PersistedToast) => void) {
  persistListeners.add(listener)
  return () => {
    persistListeners.delete(listener)
  }
}

export function persistToast(id: ToastKey, title: string, body?: string) {
  if (!title) return
  const toast: PersistedToast = {
    id: String(id),
    title,
    ...(body ? { body } : {}),
    createdAt: new Date(),
  }
  persistListeners.forEach((listener) => listener(toast))
}

export function clampProgress(value: number) {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0
}

export function toastText(...parts: unknown[]) {
  return parts
    .filter((part) => typeof part === "string" || typeof part === "number")
    .join(" ")
    .trim()
}

export function readableDuration(text: string, minimum: number) {
  return Math.max(minimum, READING_LEAD_MS + text.length * MS_PER_CHARACTER)
}

export function countToast(key: ToastKey, kind = "default") {
  const previous = counts.get(key)
  const count = previous?.kind === kind ? previous.count + 1 : 1
  counts.set(key, { kind, count })
  return count
}

export function forgetToast(key: ToastKey) {
  counts.delete(key)
}

export function createUndoTimer({
  duration,
  onCommit,
  onUndo,
  shortcut,
}: UndoTimerOptions): UndoTimer {
  let remaining = duration
  let startedAt = 0
  let timeout: ReturnType<typeof setTimeout> | undefined
  let settled = false
  const unbindShortcut = shortcut ? bindShortcut(shortcut, undo) : undefined

  function settle(callback?: () => void) {
    if (settled) return
    settled = true
    clearTimeout(timeout)
    timeout = undefined
    window.removeEventListener("pagehide", commit)
    unbindShortcut?.()
    callback?.()
  }

  function commit() {
    settle(onCommit)
  }

  function undo() {
    settle(onUndo)
  }

  function pause() {
    if (timeout === undefined) return
    clearTimeout(timeout)
    timeout = undefined
    remaining -= Date.now() - startedAt
  }

  function resume() {
    if (settled || timeout !== undefined || remaining === Infinity) return
    startedAt = Date.now()
    timeout = setTimeout(commit, remaining)
  }

  window.addEventListener("pagehide", commit)
  resume()

  return {
    commit,
    undo,
    pause,
    resume,
    remaining: () =>
      timeout === undefined ? remaining : remaining - (Date.now() - startedAt),
  }
}

export function trackPause(
  region: Element,
  onPausedChange: (paused: boolean) => void
) {
  let hovered = region.matches(":hover")
  let focused = region.contains(document.activeElement)

  const update = () => onPausedChange(hovered || focused || document.hidden)
  const onPointerEnter = () => {
    hovered = true
    update()
  }
  const onPointerLeave = () => {
    hovered = false
    update()
  }
  const onFocusIn = () => {
    focused = true
    update()
  }
  const onFocusOut = (event: Event) => {
    focused = region.contains((event as FocusEvent).relatedTarget as Node)
    update()
  }

  region.addEventListener("pointerenter", onPointerEnter)
  region.addEventListener("pointerleave", onPointerLeave)
  region.addEventListener("focusin", onFocusIn)
  region.addEventListener("focusout", onFocusOut)
  document.addEventListener("visibilitychange", update)
  update()

  return () => {
    region.removeEventListener("pointerenter", onPointerEnter)
    region.removeEventListener("pointerleave", onPointerLeave)
    region.removeEventListener("focusin", onFocusIn)
    region.removeEventListener("focusout", onFocusOut)
    document.removeEventListener("visibilitychange", update)
  }
}
