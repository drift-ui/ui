import { MentionTextareaAsyncSearchPreview as BaseUiMentionTextareaAsyncSearchPreview } from "@/components/preview/base/examples/mention-textarea/async-search"
import { MentionTextareaAsyncSearchPreview } from "@/components/preview/examples/mention-textarea/async-search"
import { MentionTextareaControlledPreview as BaseUiMentionTextareaControlledPreview } from "@/components/preview/base/examples/mention-textarea/controlled"
import { MentionTextareaControlledPreview } from "@/components/preview/examples/mention-textarea/controlled"
import { MentionTextareaCustomTriggerPreview as BaseUiMentionTextareaCustomTriggerPreview } from "@/components/preview/base/examples/mention-textarea/custom-trigger"
import { MentionTextareaCustomTriggerPreview } from "@/components/preview/examples/mention-textarea/custom-trigger"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "controlled",
    title: "Controlled",
    description:
      "value is plain text with the trigger and value inserted, so reading mentions back is one regular expression.",
    Preview: MentionTextareaControlledPreview,
    BasePreview: BaseUiMentionTextareaControlledPreview,
  },
  {
    id: "async-search",
    title: "Search as you type",
    description:
      "Pass a function instead of a list and it is called with the query and an AbortSignal. Older requests are aborted, so a slow answer never replaces a newer one. Type @fail to see the error state.",
    Preview: MentionTextareaAsyncSearchPreview,
    BasePreview: BaseUiMentionTextareaAsyncSearchPreview,
  },
  {
    id: "custom-trigger",
    title: "Any trigger character",
    description:
      "triggers takes any character as a key, so / can open a command list.",
    Preview: MentionTextareaCustomTriggerPreview,
    BasePreview: BaseUiMentionTextareaCustomTriggerPreview,
  },
]
