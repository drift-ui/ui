import { describe, expect, it } from "vitest"

import {
  RADIUS_OPTIONS,
  RADIUS_TOKEN,
  THEME_PRESETS,
  applyPreset,
  findActivePreset,
  readRadius,
} from "@/lib/showcase-presets"
import { decodeShare, encodeShare } from "@/lib/showcase-share"
import { SHOWCASE_STYLES, findStyle } from "@/lib/style-tokens"
import { EMPTY_THEME, withToken } from "@/lib/theme-css"

const COMBOS = SHOWCASE_STYLES.flatMap((style) =>
  THEME_PRESETS.flatMap((preset) =>
    RADIUS_OPTIONS.map((radius) => ({
      style,
      preset,
      radius,
      theme: withToken(
        applyPreset(EMPTY_THEME, preset),
        "light",
        RADIUS_TOKEN,
        radius
      ),
    }))
  )
)

describe("share code", () => {
  it("restores every style, preset and radius the toolbar can pick", () => {
    for (const combo of COMBOS) {
      const code = encodeShare(combo)
      const shared = code ? decodeShare(code) : null

      expect(code).toMatch(/^[0-9a-z]{7}$/)
      expect(shared?.style).toBe(combo.style)
      expect(findActivePreset(shared!.theme)).toBe(combo.preset)
      expect(readRadius(shared!.theme)).toBe(combo.radius)
    }
  })

  it("gives every combination its own code", () => {
    const codes = COMBOS.map((combo) => encodeShare(combo))

    expect(new Set(codes).size).toBe(COMBOS.length)
  })

  it("has no code for pasted CSS or an unknown code", () => {
    const custom = withToken(EMPTY_THEME, "light", "--primary", "red")

    expect(encodeShare({ theme: custom, style: findStyle("nova") })).toBeNull()
    expect(decodeShare("zzzzzzz")).toBeNull()
    expect(decodeShare("")).toBeNull()
  })
})
