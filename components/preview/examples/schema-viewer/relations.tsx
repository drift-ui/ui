"use client"

import * as React from "react"

import { parseReference } from "@/registry/default/lib/schema-viewer-utils"
import { Button } from "@/registry/default/ui/button"
import {
  SchemaViewer,
  type SchemaTable,
} from "@/registry/default/ui/schema-viewer"

const TABLES: Record<string, SchemaTable> = {
  orders: {
    name: "orders",
    columns: [
      { name: "id", type: "uuid", primaryKey: true },
      {
        name: "user_id",
        type: "uuid",
        nullable: false,
        references: "users.id",
      },
      {
        name: "total",
        type: "numeric(10,2)",
        nullable: false,
        default: "0",
      },
    ],
  },
  users: {
    name: "users",
    columns: [
      { name: "id", type: "uuid", primaryKey: true },
      { name: "org_id", type: "uuid", nullable: false, references: "orgs.id" },
      { name: "email", type: "citext", nullable: false, unique: true },
    ],
  },
  orgs: {
    name: "orgs",
    columns: [
      { name: "id", type: "uuid", primaryKey: true },
      {
        name: "slug",
        type: "text",
        nullable: false,
        unique: true,
        indexed: true,
      },
      { name: "plan", type: "text", nullable: false, default: "'free'" },
    ],
  },
}

export function SchemaViewerRelationsPreview() {
  const [activeTable, setActiveTable] = React.useState("orders")

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {Object.keys(TABLES).map((name) => (
          <Button
            key={name}
            type="button"
            size="sm"
            variant={activeTable === name ? "default" : "outline"}
            onClick={() => setActiveTable(name)}
          >
            {name}
          </Button>
        ))}
      </div>
      <SchemaViewer
        table={TABLES[activeTable]}
        onReferenceClick={(ref) => {
          const parsed = parseReference(ref)
          if (parsed && TABLES[parsed.table]) {
            setActiveTable(parsed.table)
          }
        }}
      />
    </div>
  )
}
