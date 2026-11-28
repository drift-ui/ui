import { SchemaViewerConstraintsPreview } from "@/components/preview/examples/schema-viewer/constraints"
import { SchemaViewerRelationsPreview } from "@/components/preview/examples/schema-viewer/relations"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "relations",
    title: "Navigating foreign keys",
    description:
      "Follow foreign key reference links across related tables with onReferenceClick.",
    Preview: SchemaViewerRelationsPreview,
  },
  {
    id: "constraints",
    title: "Constraints and descriptions",
    description:
      "Display primary keys, unique constraints, indexes, column descriptions, and compact mode without the filter bar.",
    Preview: SchemaViewerConstraintsPreview,
  },
]
