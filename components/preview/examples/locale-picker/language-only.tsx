"use client"

import * as React from "react"

import { Label } from "@/registry/default/ui/label"
import { LocalePicker } from "@/registry/default/ui/locale-picker"

const CONTENT_LANGUAGES = ["en", "de", "fr", "es", "ja"]

export function LocalePickerLanguageOnlyPreview() {
  const [locale, setLocale] = React.useState("fr")

  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="content-language">Content language</Label>
      <LocalePicker
        id="content-language"
        locales={CONTENT_LANGUAGES}
        value={locale}
        onValueChange={setLocale}
      />
    </div>
  )
}
