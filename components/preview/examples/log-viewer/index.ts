import { LogViewerAnsiColorsPreview } from "@/components/preview/examples/log-viewer/ansi-colors"
import { LogViewerSearchFilterPreview } from "@/components/preview/examples/log-viewer/search-filter"
import { LogViewerStreamingPreview } from "@/components/preview/examples/log-viewer/streaming"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "streaming",
    title: "Streaming follow",
    description:
      "Simulates real-time log streaming. When follow is active, new lines automatically scroll into view. Scrolling up pauses follow and shows a floating Jump to latest button.",
    Preview: LogViewerStreamingPreview,
  },
  {
    id: "search-filter",
    title: "Search and level filtering",
    description:
      "Isolate log lines by log level (such as error or warn) and filter lines matching a search query with instant highlighting.",
    Preview: LogViewerSearchFilterPreview,
  },
  {
    id: "ansi-colors",
    title: "ANSI color sequences",
    description:
      "Supports 16-color ANSI codes, 256-color lookup, text styling (bold, italic, underline, dim), and safely renders untrusted logs without innerHTML.",
    Preview: LogViewerAnsiColorsPreview,
  },
]
