import { TemplateInputControlledPreview as BaseUiTemplateInputControlledPreview } from "@/components/preview/base/examples/template-input/controlled"
import { TemplateInputControlledPreview } from "@/components/preview/examples/template-input/controlled"
import { TemplateInputUnknownVariablesPreview as BaseUiTemplateInputUnknownVariablesPreview } from "@/components/preview/base/examples/template-input/unknown-variables"
import { TemplateInputUnknownVariablesPreview } from "@/components/preview/examples/template-input/unknown-variables"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "controlled",
    title: "Controlled",
    description:
      "The value is the template string itself, so any template engine can render it. This one fills in sample values with a regular expression.",
    Preview: TemplateInputControlledPreview,
    BasePreview: BaseUiTemplateInputControlledPreview,
  },
  {
    id: "unknown-variables",
    title: "Unknown variables",
    description:
      "Variables that are not in the list get a wavy underline. findUnknownVariables returns their names, so a form can block saving until they are fixed.",
    Preview: TemplateInputUnknownVariablesPreview,
    BasePreview: BaseUiTemplateInputUnknownVariablesPreview,
  },
]
