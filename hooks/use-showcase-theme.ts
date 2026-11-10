import { useSyncExternalStore } from "react"

import { SHARE_PARAM, decodeShare } from "@/lib/showcase-share"
import {
  DEFAULT_STYLE,
  findStyle,
  type ShowcaseStyle,
} from "@/lib/style-tokens"
import {
  EMPTY_THEME,
  formatThemeCss,
  isEmptyTheme,
  parseThemeCss,
  type Theme,
} from "@/lib/theme-css"

const STORAGE_KEY = "drift-ui:showcase-theme"
const STYLE_STORAGE_KEY = "drift-ui:showcase-style"

type ShowcaseState = { theme: Theme; style: ShowcaseStyle }

const SERVER_STATE: ShowcaseState = { theme: EMPTY_THEME, style: DEFAULT_STYLE }

const listeners = new Set<() => void>()
let currentState: ShowcaseState | null = null

function loadStoredState(): ShowcaseState {
  try {
    const shared = decodeShare(
      new URLSearchParams(window.location.search).get(SHARE_PARAM) ?? ""
    )
    if (shared) return shared
    return {
      theme: parseThemeCss(window.localStorage.getItem(STORAGE_KEY) ?? ""),
      style: findStyle(window.localStorage.getItem(STYLE_STORAGE_KEY)),
    }
  } catch {
    return SERVER_STATE
  }
}

function persistState({ theme, style }: ShowcaseState) {
  try {
    if (isEmptyTheme(theme)) window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, formatThemeCss(theme))
    if (style === DEFAULT_STYLE)
      window.localStorage.removeItem(STYLE_STORAGE_KEY)
    else window.localStorage.setItem(STYLE_STORAGE_KEY, style.id)
  } catch {}
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  currentState ??= loadStoredState()
  return currentState
}

function getServerSnapshot() {
  return SERVER_STATE
}

export function updateShowcaseTheme(next: Partial<ShowcaseState>) {
  currentState = { ...getSnapshot(), ...next }
  persistState(currentState)
  listeners.forEach((listener) => listener())
}

export function useShowcaseTheme() {
  //#region queries
  const { theme, style } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )
  const isDefault = isEmptyTheme(theme) && style === DEFAULT_STYLE
  //#endregion

  //#region mutations
  function setTheme(next: Theme) {
    updateShowcaseTheme({ theme: next })
  }

  function setStyle(next: ShowcaseStyle) {
    updateShowcaseTheme({ style: next })
  }

  function resetTheme() {
    updateShowcaseTheme({ theme: EMPTY_THEME, style: DEFAULT_STYLE })
  }
  //#endregion

  return { theme, style, isDefault, setTheme, setStyle, resetTheme }
}
