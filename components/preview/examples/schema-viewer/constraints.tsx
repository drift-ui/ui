import {
  SchemaViewer,
  type SchemaTable,
} from "@/registry/default/ui/schema-viewer"

const INVOICES_TABLE: SchemaTable = {
  name: "invoices",
  schema: "billing",
  description: "Issued monthly subscription invoices.",
  columns: [
    {
      name: "id",
      type: "bigint",
      primaryKey: true,
      description: "Monotonic surrogate key",
    },
    {
      name: "external_id",
      type: "text",
      nullable: false,
      unique: true,
      indexed: true,
      description: "Provider invoice identifier",
    },
    {
      name: "account_id",
      type: "uuid",
      nullable: false,
      references: "accounts.id",
      indexed: true,
    },
    {
      name: "amount_cents",
      type: "integer",
      nullable: false,
      default: "0",
    },
    {
      name: "paid_at",
      type: "timestamptz",
    },
  ],
}

export function SchemaViewerConstraintsPreview() {
  return (
    <SchemaViewer
      table={INVOICES_TABLE}
      searchable={false}
      className="w-full max-w-3xl"
    />
  )
}
