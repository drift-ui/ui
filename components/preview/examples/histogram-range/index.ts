import { HistogramRangeBasicPreview as BaseUiHistogramRangeBasicPreview } from "@/components/preview/base/examples/histogram-range/basic"
import { HistogramRangeBasicPreview } from "@/components/preview/examples/histogram-range/basic"
import { HistogramRangeCustomFormatPreview as BaseUiHistogramRangeCustomFormatPreview } from "@/components/preview/base/examples/histogram-range/custom-format"
import { HistogramRangeCustomFormatPreview } from "@/components/preview/examples/histogram-range/custom-format"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "basic",
    title: "Basic price range",
    description:
      "A dual-thumb range filter with dollar formatting and active result count.",
    Preview: HistogramRangeBasicPreview,
    BasePreview: BaseUiHistogramRangeBasicPreview,
  },
  {
    id: "custom-format",
    title: "Custom units and styling",
    description:
      "File size filtering with megabytes formatting and chart color tokens.",
    Preview: HistogramRangeCustomFormatPreview,
    BasePreview: BaseUiHistogramRangeCustomFormatPreview,
  },
]
