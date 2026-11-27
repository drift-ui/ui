import { RequestInspectorBasicPreview as BaseUiRequestInspectorBasicPreview } from "@/components/preview/base/examples/request-inspector/basic"
import { RequestInspectorBasicPreview } from "@/components/preview/examples/request-inspector/basic"
import { RequestInspectorErrorPreview as BaseUiRequestInspectorErrorPreview } from "@/components/preview/base/examples/request-inspector/error"
import { RequestInspectorErrorPreview } from "@/components/preview/examples/request-inspector/error"
import { RequestInspectorWebhookPreview as BaseUiRequestInspectorWebhookPreview } from "@/components/preview/base/examples/request-inspector/webhook"
import { RequestInspectorWebhookPreview } from "@/components/preview/examples/request-inspector/webhook"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "basic",
    title: "Resource lookup",
    description:
      "Inspect a standard GET API call with response caching, headers, and formatted JSON body.",
    Preview: RequestInspectorBasicPreview,
    BasePreview: BaseUiRequestInspectorBasicPreview,
  },
  {
    id: "webhook",
    title: "Webhook delivery",
    description:
      "Inspect incoming webhooks with custom signature verification headers and plain text responses.",
    Preview: RequestInspectorWebhookPreview,
    BasePreview: BaseUiRequestInspectorWebhookPreview,
  },
  {
    id: "error",
    title: "Validation error",
    description:
      "Review client error responses with status badge color mapping and field error details.",
    Preview: RequestInspectorErrorPreview,
    BasePreview: BaseUiRequestInspectorErrorPreview,
  },
]
