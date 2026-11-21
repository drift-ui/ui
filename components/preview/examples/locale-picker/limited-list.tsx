"use client"

import * as React from "react"

import { Label } from "@/registry/default/ui/label"
import { LocalePicker } from "@/registry/default/ui/locale-picker"

const SUPPORTED_LOCALES = ["en-US", "de-DE", "ja-JP", "pt-BR"]

export function LocalePickerLimitedListPreview() {
  const [locale, setLocale] = React.useState("de-DE")

  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="limited-locale">Supported language</Label>
      <LocalePicker
        id="limited-locale"
        locales={SUPPORTED_LOCALES}
        value={locale}
        onValueChange={setLocale}
      />
    </div>
  )
}
