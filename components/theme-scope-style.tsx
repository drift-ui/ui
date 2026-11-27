"use client"

import { useShowcaseTheme } from "@/hooks/use-showcase-theme"
import { scopeStyleCss, type ShowcaseStyle } from "@/lib/style-tokens"
import { isEmptyTheme, scopeThemeCss, type Theme } from "@/lib/theme-css"

const THEME_SCOPE = [
  "[data-theme-scope]",
  "[data-showcase-canvas]",
  '[data-radix-popper-content-wrapper]:not(:has([role="tooltip"], [data-theme-control]))',
  '[data-slot="dialog-content"]:not([data-theme-editor])',
]

export function radiusScaleCss(scopeSelectors: string[]) {
  return `${scopeSelectors.join(",\n")} {
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}`
}

export function themeScopeCss(theme: Theme, style: ShowcaseStyle) {
  return [
    radiusScaleCss(THEME_SCOPE),
    isEmptyTheme(theme) ? "" : scopeThemeCss(theme, THEME_SCOPE),
    scopeStyleCss(style, THEME_SCOPE),
  ]
    .filter(Boolean)
    .join("\n")
}

export function ThemeScopeStyle() {
  const { theme, style } = useShowcaseTheme()

  return <style>{themeScopeCss(theme, style)}</style>
}
