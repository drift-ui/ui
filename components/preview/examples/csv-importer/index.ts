import { CsvImporterBasicPreview } from "@/components/preview/examples/csv-importer/basic"
import { CsvImporterCustomTransformPreview } from "@/components/preview/examples/csv-importer/custom-transform"
import { CsvImporterValidationPreview } from "@/components/preview/examples/csv-importer/validation"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "basic",
    title: "Basic contact import",
    description:
      "A simple 4-step import flow with required and optional fields.",
    Preview: CsvImporterBasicPreview,
  },
  {
    id: "validation",
    title: "Custom validation rules",
    description:
      "Enforce regex patterns and numeric constraints, with inline cell error indicators.",
    Preview: CsvImporterValidationPreview,
  },
  {
    id: "custom-transform",
    title: "Field transformations",
    description:
      "Clean and normalize values into typed JavaScript objects (numbers, booleans, lowercase strings).",
    Preview: CsvImporterCustomTransformPreview,
  },
]
