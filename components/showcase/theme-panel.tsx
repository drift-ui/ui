"use client"

import { RotateCcwIcon } from "lucide-react"

import { cn } from "@/registry/default/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { ModePicker } from "@/components/showcase/mode-picker"
import { PresetPicker } from "@/components/showcase/preset-picker"
import { RadiusPicker } from "@/components/showcase/radius-picker"
import { StylePicker } from "@/components/showcase/style-picker"
import { ThemeCssSummary } from "@/components/showcase/theme-css-summary"
import {
  RADIUS_TOKEN,
  applyPreset,
  findActivePreset,
  readRadius,
} from "@/lib/showcase-presets"
import type { ShowcaseStyle } from "@/lib/style-tokens"
import { withToken, type Theme } from "@/lib/theme-css"

function PanelSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}

export function ThemePanel({
  theme,
  style,
  isDefault,
  onThemeChange,
  onStyleChange,
  onReset,
  className,
}: {
  theme: Theme
  style: ShowcaseStyle
  isDefault: boolean
  onThemeChange: (theme: Theme) => void
  onStyleChange: (style: ShowcaseStyle) => void
  onReset: () => void
  className?: string
}) {
  const activePreset = findActivePreset(theme)

  return (
    <aside
      aria-labelledby="theme-panel-title"
      className={cn("flex flex-col gap-6 rounded-3xl border p-4", className)}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <h2 id="theme-panel-title" className="font-medium">
            Theme
          </h2>
          <span className="text-xs text-muted-foreground">
            {activePreset?.label ?? "Custom"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={isDefault}
          onClick={onReset}
        >
          <RotateCcwIcon />
          Reset
        </Button>
      </header>
      <PanelSection title="Style">
        <StylePicker value={style} onValueChange={onStyleChange} />
      </PanelSection>
      <PanelSection title="Preset">
        <PresetPicker
          activePresetId={activePreset?.id}
          onSelect={(preset) => onThemeChange(applyPreset(theme, preset))}
        />
      </PanelSection>
      <PanelSection title="Radius">
        <RadiusPicker
          value={readRadius(theme)}
          onValueChange={(radius) =>
            onThemeChange(withToken(theme, "light", RADIUS_TOKEN, radius))
          }
        />
      </PanelSection>
      <PanelSection title="Mode">
        <ModePicker className="rounded-lg border p-1 *:flex-1 *:justify-center" />
      </PanelSection>
      <PanelSection title="Your CSS">
        <ThemeCssSummary theme={theme} onApply={onThemeChange} />
      </PanelSection>
    </aside>
  )
}
