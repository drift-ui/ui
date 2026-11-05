import { JsonViewerExpandDepthPreview } from "@/components/preview/examples/json-viewer/expand-depth"
import { JsonViewerLongValuesPreview } from "@/components/preview/examples/json-viewer/long-values"
import { JsonViewerOnCopyPreview } from "@/components/preview/examples/json-viewer/on-copy"
import { JsonViewerPathFilterPreview } from "@/components/preview/examples/json-viewer/path-filter"
import { JsonViewerVirtualizedLargePreview } from "@/components/preview/examples/json-viewer/virtualized-large"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "expand-depth",
    title: "Start collapsed",
    description:
      "defaultExpandDepth={0} opens only the root, for large payloads people want to explore a level at a time.",
    Preview: JsonViewerExpandDepthPreview,
  },
  {
    id: "path-filter",
    title: "Path filter",
    description:
      "Filter nested structures with wildcard path patterns like users[*].email or *.id matching the exact path format produced by copy path.",
    Preview: JsonViewerPathFilterPreview,
  },
  {
    id: "long-values",
    title: "Long and multi-line values",
    description:
      "Strings exceeding maxStringLength or containing newlines truncate with inline expand and collapse controls, while full text is preserved on copy.",
    Preview: JsonViewerLongValuesPreview,
  },
  {
    id: "virtualized-large",
    title: "Virtualized large payload",
    description:
      "Pass virtual to virtualize row rendering for large datasets; expand a range to browse its records.",
    Preview: JsonViewerVirtualizedLargePreview,
  },
  {
    id: "on-copy",
    title: "React to copying",
    description:
      "onCopy runs after a value or path is copied, so you can confirm it or record it. Hover a row to see the copy buttons.",
    Preview: JsonViewerOnCopyPreview,
  },
]
