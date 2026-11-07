"use client"

import * as React from "react"

import { LogViewer, type LogLine } from "@/registry/default/ui/log-viewer"

const ANSI_DEMO_LOGS: LogLine[] = [
  {
    id: "1",
    level: "info",
    message:
      "Standard colors: \u001b[31mRed\u001b[0m \u001b[32mGreen\u001b[0m \u001b[33mYellow\u001b[0m \u001b[34mBlue\u001b[0m \u001b[35mMagenta\u001b[0m \u001b[36mCyan\u001b[0m",
  },
  {
    id: "2",
    level: "info",
    message:
      "Bright colors:   \u001b[91mBright Red\u001b[0m \u001b[92mBright Green\u001b[0m \u001b[93mBright Yellow\u001b[0m \u001b[94mBright Blue\u001b[0m \u001b[96mBright Cyan\u001b[0m",
  },
  {
    id: "3",
    level: "info",
    message:
      "Text styles:     \u001b[1mBold Text\u001b[0m, \u001b[2mDim Text\u001b[0m, \u001b[3mItalic Text\u001b[0m, \u001b[4mUnderline Text\u001b[0m, \u001b[9mStrikethrough\u001b[0m",
  },
  {
    id: "4",
    level: "info",
    message:
      "256-color codes: \u001b[38;5;196mColor 196\u001b[0m \u001b[38;5;208mColor 208\u001b[0m \u001b[38;5;220mColor 220\u001b[0m \u001b[38;5;46mColor 46\u001b[0m \u001b[38;5;51mColor 51\u001b[0m",
  },
  {
    id: "5",
    level: "info",
    message:
      "Compound styles: \u001b[1;32;4m✓ Success (Bold + Underline + Green)\u001b[0m",
  },
]

export function LogViewerAnsiColorsPreview() {
  return (
    <div className="w-full max-w-2xl">
      <LogViewer
        lines={ANSI_DEMO_LOGS}
        height={220}
        showLineNumbers
        showTimestamps={false}
        filterable={false}
        searchable={false}
      />
    </div>
  )
}
