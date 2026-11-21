"use client"

import * as React from "react"

import { Label } from "@/registry/default/ui/label"
import { LocalePicker } from "@/registry/default/ui/locale-picker"

export function LocalePickerPreview() {
  const [locale, setLocale] = React.useState("ja-JP")

  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="preview-locale">Locale</Label>
      <LocalePicker
        id="preview-locale"
        value={locale}
        onValueChange={setLocale}
      />
    </div>
  )
}
