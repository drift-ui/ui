"use client"

import * as React from "react"
import {
  KeyRoundIcon,
  Link2Icon,
  SearchIcon,
  SearchXIcon,
  Table2Icon,
  XIcon,
} from "lucide-react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  filterColumns,
  formatTableName,
  getColumnBadges,
  isColumnNullable,
  SCHEMA_BADGE_META,
  type SchemaBadgeKind,
  type SchemaColumn,
  type SchemaTable,
} from "@/registry/default/lib/schema-viewer-utils"
import { cn } from "@/registry/default/lib/utils"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import { Input } from "@/registry/default/ui/input"

export type { SchemaBadgeKind, SchemaColumn, SchemaTable }

const BADGE_VARIANT: Record<
  SchemaBadgeKind,
  "default" | "secondary" | "outline"
> = {
  pk: "default",
  fk: "secondary",
  unique: "outline",
  index: "outline",
}

export interface SchemaViewerProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  table: SchemaTable
  onReferenceClick?: (ref: string, column: SchemaColumn) => void
  filter?: string
  defaultFilter?: string
  onFilterChange?: (filter: string) => void
  searchable?: boolean
}

function SchemaViewer({
  table,
  onReferenceClick,
  filter: controlledFilter,
  defaultFilter = "",
  onFilterChange,
  searchable = true,
  className,
  "aria-label": ariaLabel,
  ...props
}: SchemaViewerProps) {
  const filterInputRef = React.useRef<HTMLInputElement>(null)
  const { value: filterQuery, setValue: setFilterQuery } = useControllableState(
    {
      value: controlledFilter,
      defaultValue: defaultFilter,
      onChange: onFilterChange,
    }
  )

  const tableName = formatTableName(table)
  const needle = filterQuery.trim()
  const visibleColumns = React.useMemo(
    () => (searchable ? filterColumns(table.columns, needle) : table.columns),
    [searchable, table.columns, needle]
  )

  const totalCount = table.columns.length
  const visibleCount = visibleColumns.length

  function clearFilter() {
    setFilterQuery("")
    filterInputRef.current?.focus()
  }

  return (
    <div
      data-slot="schema-viewer"
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-box border bg-card text-card-foreground",
        className
      )}
      {...props}
    >
      <div
        data-slot="schema-viewer-header"
        className="flex flex-col gap-2.5 border-b bg-muted/30 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <Table2Icon
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground"
            />
            <span className="truncate font-mono text-sm font-semibold text-foreground">
              {tableName}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {needle
                ? `${visibleCount} of ${totalCount} ${totalCount === 1 ? "column" : "columns"}`
                : `${totalCount} ${totalCount === 1 ? "column" : "columns"}`}
            </span>
          </div>
          {table.description && (
            <p className="text-xs text-muted-foreground">{table.description}</p>
          )}
        </div>

        {searchable && (
          <div className="relative w-full sm:w-56">
            <SearchIcon
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              ref={filterInputRef}
              type="search"
              aria-label="Filter columns"
              placeholder="Filter columns"
              value={filterQuery}
              onChange={(event) => setFilterQuery(event.target.value)}
              className={cn("h-control-sm py-0 pl-8 text-xs", needle && "pr-8")}
            />
            {needle && (
              <button
                type="button"
                aria-label="Clear filter"
                onClick={clearFilter}
                className="absolute top-1/2 right-1.5 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <XIcon aria-hidden className="size-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table
          aria-label={ariaLabel ?? `${tableName} schema`}
          className="w-full border-collapse text-left text-xs"
        >
          <thead>
            <tr className="border-b bg-muted/40 text-muted-foreground">
              <th scope="col" className="px-3.5 py-2 font-medium">
                Column
              </th>
              <th scope="col" className="px-3.5 py-2 font-medium">
                Type
              </th>
              <th scope="col" className="px-3.5 py-2 font-medium">
                Nullable
              </th>
              <th scope="col" className="px-3.5 py-2 font-medium">
                Default
              </th>
              <th scope="col" className="px-3.5 py-2 font-medium">
                Constraints
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {totalCount === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3.5 py-6 text-center text-muted-foreground"
                >
                  No columns defined
                </td>
              </tr>
            ) : visibleCount === 0 ? (
              <tr>
                <td colSpan={5} className="px-3.5 py-6 text-center">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <SearchXIcon
                      aria-hidden
                      className="size-5 text-muted-foreground"
                    />
                    <p className="text-sm font-medium text-foreground">
                      No columns found
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Nothing matches &ldquo;{needle}&rdquo;
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-1"
                      onClick={clearFilter}
                    >
                      Clear filter
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              visibleColumns.map((column) => {
                const badges = getColumnBadges(column)
                const nullable = isColumnNullable(column)
                const reference = column.references?.trim()

                return (
                  <tr
                    key={column.name}
                    data-slot="schema-viewer-row"
                    className="transition-colors hover:bg-muted/30"
                  >
                    <th
                      scope="row"
                      className="px-3.5 py-2.5 align-top font-mono font-medium text-foreground"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1.5">
                          {column.primaryKey && (
                            <KeyRoundIcon
                              aria-hidden
                              className="size-3 shrink-0 text-primary"
                            />
                          )}
                          <span>{column.name}</span>
                        </span>
                        {column.description && (
                          <span className="font-sans text-[11px] font-normal text-muted-foreground">
                            {column.description}
                          </span>
                        )}
                      </div>
                    </th>
                    <td className="px-3.5 py-2.5 align-top font-mono whitespace-nowrap text-muted-foreground">
                      {column.type}
                    </td>
                    <td className="px-3.5 py-2.5 align-top whitespace-nowrap">
                      <span
                        className={cn(
                          "font-mono text-[11px]",
                          nullable
                            ? "text-muted-foreground"
                            : "font-medium text-foreground"
                        )}
                      >
                        {nullable ? "NULL" : "NOT NULL"}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 align-top font-mono whitespace-nowrap text-muted-foreground">
                      {column.default !== undefined ? (
                        <span className="text-foreground">
                          {column.default}
                        </span>
                      ) : (
                        <span aria-label="No default">—</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 align-top">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {badges.map((kind) => {
                          const meta = SCHEMA_BADGE_META[kind]
                          return (
                            <Badge
                              key={kind}
                              variant={BADGE_VARIANT[kind]}
                              title={meta.label}
                              aria-label={meta.label}
                              className="h-5 px-1.5 font-mono text-[10px]"
                            >
                              {meta.shortLabel}
                            </Badge>
                          )
                        })}
                        {reference && (
                          <a
                            href={`#${encodeURIComponent(reference)}`}
                            aria-label={`References ${reference}`}
                            onClick={(event) => {
                              if (onReferenceClick) {
                                event.preventDefault()
                                onReferenceClick(reference, column)
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-sm font-mono text-xs text-primary underline decoration-primary/40 underline-offset-2 outline-none hover:decoration-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          >
                            <Link2Icon
                              aria-hidden
                              className="size-3 shrink-0"
                            />
                            <span>{reference}</span>
                          </a>
                        )}
                        {badges.length === 0 && !reference && (
                          <span
                            aria-label="No constraints"
                            className="text-muted-foreground"
                          >
                            —
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <span role="status" className="sr-only">
        {needle
          ? `${visibleCount} of ${totalCount} ${totalCount === 1 ? "column" : "columns"} matching ${needle}`
          : ""}
      </span>
    </div>
  )
}

export { SchemaViewer }
