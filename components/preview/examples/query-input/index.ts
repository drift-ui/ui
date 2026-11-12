import { QueryInputParsedOutputPreview as BaseUiQueryInputParsedOutputPreview } from "@/components/preview/base/examples/query-input/parsed-output"
import { QueryInputParsedOutputPreview } from "@/components/preview/examples/query-input/parsed-output"
import { QueryInputWithFilterBuilderPreview as BaseUiQueryInputWithFilterBuilderPreview } from "@/components/preview/base/examples/query-input/with-filter-builder"
import { QueryInputWithFilterBuilderPreview } from "@/components/preview/examples/query-input/with-filter-builder"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "parsed-output",
    title: "What it parses",
    description:
      "Comma lists become is-any-of, *text* becomes contains, > and < compare numbers and dates, and a..b is a date range. Anything that is not a known key stays in the free text.",
    Preview: QueryInputParsedOutputPreview,
    BasePreview: BaseUiQueryInputParsedOutputPreview,
  },
  {
    id: "with-filter-builder",
    title: "Next to a filter builder",
    description:
      "Both components use the Filter type, so they can share one filters array. Typing updates the chips, and editing a chip rewrites the query with formatQuery.",
    Preview: QueryInputWithFilterBuilderPreview,
    BasePreview: BaseUiQueryInputWithFilterBuilderPreview,
  },
]
