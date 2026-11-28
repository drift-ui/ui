"use client"

import * as React from "react"

import {
  SchemaViewer,
  type SchemaTable,
} from "@/registry/default/ui/schema-viewer"

const ORDERS_TABLE: SchemaTable = {
  name: "orders",
  schema: "public",
  description: "Customer purchase orders and fulfillment totals.",
  columns: [
    {
      name: "id",
      type: "uuid",
      primaryKey: true,
      default: "gen_random_uuid()",
    },
    {
      name: "user_id",
      type: "uuid",
      nullable: false,
      references: "users.id",
      indexed: true,
    },
    {
      name: "order_number",
      type: "text",
      nullable: false,
      unique: true,
    },
    {
      name: "total",
      type: "numeric(10,2)",
      nullable: false,
      default: "0",
    },
    {
      name: "status",
      type: "order_status",
      nullable: false,
      default: "'pending'",
      indexed: true,
    },
    {
      name: "notes",
      type: "text",
    },
    {
      name: "created_at",
      type: "timestamptz",
      nullable: false,
      default: "now()",
    },
  ],
}

export function SchemaViewerPreview() {
  const [selectedRef, setSelectedRef] = React.useState<string | null>(null)

  return (
    <div className="flex w-full max-w-3xl flex-col gap-2">
      <SchemaViewer
        table={ORDERS_TABLE}
        onReferenceClick={(ref) => setSelectedRef(ref)}
      />
      {selectedRef && (
        <p className="text-xs text-muted-foreground">
          Selected reference:{" "}
          <span className="font-mono text-foreground">{selectedRef}</span>
        </p>
      )}
    </div>
  )
}
