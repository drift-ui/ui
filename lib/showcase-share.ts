import {
  DEFAULT_RADIUS,
  RADIUS_OPTIONS,
  RADIUS_TOKEN,
  THEME_PRESETS,
  applyPreset,
  findActivePreset,
  readRadius,
  type ThemePreset,
} from "@/lib/showcase-presets"
import { SHOWCASE_STYLES, type ShowcaseStyle } from "@/lib/style-tokens"
import { EMPTY_THEME, type Theme } from "@/lib/theme-css"

export const SHARE_PARAM = "preset"

type ShareState = { theme: Theme; style: ShowcaseStyle }

function hash(text: string) {
  let value = 0x811c9dc5
  for (let index = 0; index < text.length; index++) {
    value ^= text.charCodeAt(index)
    value = Math.imul(value, 0x01000193)
  }
  return (value >>> 0).toString(36).padStart(7, "0")
}

function shareKey(style: ShowcaseStyle, preset: ThemePreset, radius: string) {
  return hash(`${style.id}:${preset.id}:${radius}`)
}

function buildTheme(preset: ThemePreset, radius: string) {
  if (radius === DEFAULT_RADIUS) return preset.theme
  return applyPreset(
    { light: { [RADIUS_TOKEN]: radius }, dark: EMPTY_THEME.dark },
    preset
  )
}

export function encodeShare({ theme, style }: ShareState) {
  const preset = findActivePreset(theme)
  const radius = readRadius(theme)
  if (!preset || !RADIUS_OPTIONS.includes(radius)) return null
  return shareKey(style, preset, radius)
}

export function decodeShare(code: string): ShareState | null {
  for (const style of SHOWCASE_STYLES)
    for (const preset of THEME_PRESETS)
      for (const radius of RADIUS_OPTIONS)
        if (shareKey(style, preset, radius) === code)
          return { style, theme: buildTheme(preset, radius) }
  return null
}
