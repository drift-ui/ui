import { TraceWaterfallBasicPreview } from "@/components/preview/examples/trace-waterfall/basic"
import { TraceWaterfallErrorSpansPreview } from "@/components/preview/examples/trace-waterfall/error-spans"
import { TraceWaterfallInteractivePreview } from "@/components/preview/examples/trace-waterfall/interactive"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "basic",
    title: "Request trace",
    description:
      "Visualizes the call tree and execution timeline of an API request across database and service boundaries.",
    Preview: TraceWaterfallBasicPreview,
  },
  {
    id: "interactive",
    title: "Selection and inspection",
    description:
      "Control expanded branches and inspect the active span when clicked or activated via keyboard.",
    Preview: TraceWaterfallInteractivePreview,
  },
  {
    id: "error-spans",
    title: "Errors and zero-duration events",
    description:
      "Highlights failed operations with destructive status styling and renders zero-duration checkpoint events with a visible marker.",
    Preview: TraceWaterfallErrorSpansPreview,
  },
]
