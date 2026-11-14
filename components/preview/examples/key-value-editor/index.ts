import { KeyValueEditorControlledPreview } from "@/components/preview/examples/key-value-editor/controlled"
import { KeyValueEditorSecretValuesPreview } from "@/components/preview/examples/key-value-editor/secret-values"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "secret-values",
    title: "Secret values",
    description:
      "secretValues masks every value with its own reveal button, so one secret can be checked without showing the rest. Type or paste a value to see it masked, or paste KEY=value lines into a key to add several rows.",
    Preview: KeyValueEditorSecretValuesPreview,
  },
  {
    id: "controlled",
    title: "Controlled, with duplicates",
    description:
      "value and onValueChange keep the rows in the parent. Two rows share a key here, so both are flagged.",
    Preview: KeyValueEditorControlledPreview,
  },
]
