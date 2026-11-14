import { DiffViewerContextLinesPreview } from "@/components/preview/examples/diff-viewer/context-lines"
import { DiffViewerIgnoreWhitespacePreview } from "@/components/preview/examples/diff-viewer/ignore-whitespace"
import { DiffViewerLargeDiffPreview } from "@/components/preview/examples/diff-viewer/large-diff"
import { DiffViewerLineSlotsPreview } from "@/components/preview/examples/diff-viewer/line-slots"
import { DiffViewerUnifiedPreview } from "@/components/preview/examples/diff-viewer/unified"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "unified",
    title: "Unified",
    description:
      'mode="unified" puts both sides in one column, which suits narrow panels.',
    Preview: DiffViewerUnifiedPreview,
  },
  {
    id: "context-lines",
    title: "Context lines",
    description:
      "contextLines sets how many unchanged lines stay beside each change. The rest collapse behind a button.",
    Preview: DiffViewerContextLinesPreview,
  },
  {
    id: "ignore-whitespace",
    title: "Ignore whitespace",
    description:
      "ignoreWhitespace treats lines that differ only in whitespace as unchanged, so a re-indented block shows just the new lines.",
    Preview: DiffViewerIgnoreWhitespacePreview,
  },
  {
    id: "large-diff",
    title: "Large diff",
    description:
      "Two 10,000-line files with 1,000 changed lines. Rows have a fixed height and only those near the viewport render.",
    Preview: DiffViewerLargeDiffPreview,
  },
  {
    id: "line-slots",
    title: "Line slots",
    description:
      "renderLine takes over the line text, for example to run Shiki or Prism. renderGutter adds a cell per line for actions like comments.",
    Preview: DiffViewerLineSlotsPreview,
  },
]
