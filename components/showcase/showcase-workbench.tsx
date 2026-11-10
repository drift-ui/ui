"use client"

import { useEffect } from "react"

import { ThemeScopeControl } from "@/components/docs/theme-scope-control"
import { ThemeToolbar } from "@/components/showcase/theme-toolbar"
import { themeScopeCss } from "@/components/theme-scope-style"
import { useHasHydrated } from "@/hooks/use-has-hydrated"
import { useShowcaseTheme } from "@/hooks/use-showcase-theme"
import { SHARE_PARAM, decodeShare, encodeShare } from "@/lib/showcase-share"
import { DEFAULT_STYLE } from "@/lib/style-tokens"
import { isEmptyTheme } from "@/lib/theme-css"

function replaceShareParam(code: string | null) {
  const url = new URL(window.location.href)
  if (code) url.searchParams.set(SHARE_PARAM, code)
  else url.searchParams.delete(SHARE_PARAM)
  window.history.replaceState(window.history.state, "", url)
}

export function ShowcaseWorkbench({
  sharedCode,
  children,
}: {
  sharedCode: string | undefined
  children: React.ReactNode
}) {
  const store = useShowcaseTheme()
  const hasHydrated = useHasHydrated()
  const shared = hasHydrated ? null : decodeShare(sharedCode ?? "")
  const { theme, style } = shared ?? store
  const isDefault = shared
    ? isEmptyTheme(theme) && style === DEFAULT_STYLE
    : store.isDefault
  const { setTheme, setStyle, resetTheme } = store
  const shareCode = isDefault ? null : encodeShare({ theme, style })

  useEffect(() => {
    replaceShareParam(shareCode)
  }, [shareCode])

  return (
    <>
      {shared && <style>{themeScopeCss(shared.theme, shared.style)}</style>}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-28 bg-linear-to-t from-background via-background/70 to-transparent"
      />
      <ThemeToolbar
        theme={theme}
        style={style}
        isDefault={isDefault}
        onThemeChange={setTheme}
        onStyleChange={setStyle}
        onReset={resetTheme}
        className="fixed bottom-4 left-1/2 z-40 hidden -translate-x-1/2 lg:flex"
      />
      <ThemeScopeControl
        side="top"
        align="center"
        className="fixed bottom-4 left-1/2 z-40 h-11 -translate-x-1/2 rounded-full border bg-popover/85 px-5 text-popover-foreground shadow-lg backdrop-blur-md lg:hidden"
      />
      <div
        data-showcase-canvas
        className="@container min-w-0 rounded-3xl border bg-background p-3 font-sans text-foreground sm:p-4"
      >
        {children}
      </div>
    </>
  )
}
