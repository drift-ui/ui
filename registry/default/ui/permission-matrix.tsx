"use client"

import * as React from "react"
import {
  CheckIcon,
  ChevronRightIcon,
  MinusIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"

import { cn } from "@/registry/default/lib/utils"
import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import { Badge } from "@/registry/default/ui/badge"
import { Input } from "@/registry/default/ui/input"
import {
  filterPermissionGroups,
  getGridNextCoordinates,
  getGroupStatus,
  getPermissionStatus,
  resolveRoleInheritance,
  toggleGroupGrants,
  togglePermissionGrant,
  type PermissionAction,
  type PermissionGrants,
  type PermissionGroup,
  type PermissionRole,
  type PermissionStatus,
} from "@/registry/default/lib/permission-matrix.ts"

export type {
  PermissionAction,
  PermissionGrants,
  PermissionGroup,
  PermissionRole,
  PermissionStatus,
}

export interface PermissionMatrixProps extends Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "value" | "onChange"
> {
  roles: PermissionRole[]
  permissions: PermissionGroup[]
  value?: PermissionGrants
  defaultValue?: PermissionGrants
  onValueChange?: (value: PermissionGrants) => void

  readOnly?: boolean
  disabled?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  allowOverrideInherited?: boolean

  expandedGroups?: string[]
  defaultExpandedGroups?: string[]
  onExpandedGroupsChange?: (groups: string[]) => void

  "aria-label"?: string
}

type MatrixRow =
  | {
      type: "group"
      id: string
      group: PermissionGroup
    }
  | {
      type: "action"
      id: string
      group: PermissionGroup
      action: PermissionAction
    }

export function PermissionMatrix({
  roles = [],
  permissions = [],
  value: valueProp,
  defaultValue = {},
  onValueChange,
  readOnly = false,
  disabled = false,
  searchable = true,
  searchPlaceholder = "Filter permissions...",
  allowOverrideInherited = true,
  expandedGroups: expandedProp,
  defaultExpandedGroups,
  onExpandedGroupsChange,
  "aria-label": ariaLabel = "Permissions Matrix",
  className,
  ...props
}: PermissionMatrixProps) {
  const { value: grants, setValue: setGrants } =
    useControllableState<PermissionGrants>({
      value: valueProp,
      defaultValue,
      onChange: onValueChange,
    })

  const [searchQuery, setSearchQuery] = React.useState("")

  const initialExpanded = React.useMemo(() => {
    if (defaultExpandedGroups) return defaultExpandedGroups
    return permissions.map((g) => g.id)
  }, [defaultExpandedGroups, permissions])

  const { value: expanded, setValue: setExpanded } = useControllableState<
    string[]
  >({
    value: expandedProp,
    defaultValue: initialExpanded,
    onChange: onExpandedGroupsChange,
  })

  const inheritanceMap = React.useMemo(
    () => resolveRoleInheritance(roles),
    [roles]
  )

  const actionMap = React.useMemo(() => {
    const map = new Map<string, PermissionAction>()
    for (const group of permissions) {
      for (const action of group.permissions) {
        map.set(action.id, action)
      }
    }
    return map
  }, [permissions])

  const filteredGroups = React.useMemo(
    () => filterPermissionGroups(permissions, searchQuery),
    [permissions, searchQuery]
  )

  // Automatically treat groups as expanded when searching
  const effectiveExpanded = React.useMemo(() => {
    if (searchQuery.trim()) {
      return filteredGroups.map((g) => g.id)
    }
    return expanded
  }, [searchQuery, filteredGroups, expanded])

  function toggleGroupExpansion(groupId: string) {
    if (searchQuery.trim()) return
    const isExpanded = effectiveExpanded.includes(groupId)
    const next = isExpanded
      ? effectiveExpanded.filter((id: string) => id !== groupId)
      : [...effectiveExpanded, groupId]
    setExpanded(next)
  }

  // Flatten rows for grid representation
  const rows: MatrixRow[] = React.useMemo(() => {
    const list: MatrixRow[] = []
    for (const group of filteredGroups) {
      list.push({ type: "group", id: `group-${group.id}`, group })
      if (effectiveExpanded.includes(group.id)) {
        for (const action of group.permissions) {
          list.push({
            type: "action",
            id: `action-${group.id}-${action.id}`,
            group,
            action,
          })
        }
      }
    }
    return list
  }, [filteredGroups, effectiveExpanded])

  // Grid coordinates: row 0 is header row, row 1..rows.length are body rows.
  // Col 0 is permissions column, Col 1..roles.length are role columns.
  const totalRows = rows.length + 1
  const totalCols = roles.length + 1

  const [focusedCell, setFocusedCell] = React.useState<[number, number]>([0, 0])
  const cellRefs = React.useRef<Map<string, HTMLElement>>(new Map())

  function getCellKey(r: number, c: number) {
    return `${r}:${c}`
  }

  function handleCellKeyDown(
    e: React.KeyboardEvent,
    rowIndex: number,
    colIndex: number
  ) {
    const key = e.key

    if (
      [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
        "PageUp",
        "PageDown",
      ].includes(key)
    ) {
      e.preventDefault()
      const [nextRow, nextCol] = getGridNextCoordinates(
        [rowIndex, colIndex],
        key,
        totalRows,
        totalCols
      )
      setFocusedCell([nextRow, nextCol])
      cellRefs.current.get(getCellKey(nextRow, nextCol))?.focus()
      return
    }

    if (key === " " || key === "Enter") {
      // Toggle if on interactive body cell
      if (rowIndex > 0) {
        e.preventDefault()
        const row = rows[rowIndex - 1]
        if (!row) return

        if (colIndex === 0 && row.type === "group") {
          toggleGroupExpansion(row.group.id)
        } else if (colIndex > 0) {
          const role = roles[colIndex - 1]
          if (!role || role.disabled || disabled || readOnly) return

          if (row.type === "group") {
            handleToggleGroup(role.id, row.group)
          } else if (row.type === "action") {
            if (row.action.disabled) return
            handleToggleAction(role.id, row.action.id)
          }
        }
      }
    }
  }

  function handleToggleAction(roleId: string, actionId: string) {
    if (disabled || readOnly) return
    const action = actionMap.get(actionId)
    if (action?.disabled) return

    const status = getPermissionStatus(roleId, actionId, grants, roles)
    if (status.inherited && !allowOverrideInherited) return

    const next = togglePermissionGrant(grants, roleId, actionId, roles)
    setGrants(next)
  }

  function handleToggleGroup(roleId: string, group: PermissionGroup) {
    if (disabled || readOnly) return
    const next = toggleGroupGrants(
      grants,
      roleId,
      group,
      roles,
      allowOverrideInherited
    )
    setGrants(next)
  }

  return (
    <div
      data-slot="permission-matrix"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    >
      {searchable && (
        <div className="flex items-center justify-between gap-2">
          <div className="relative w-full max-w-xs">
            <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-control-sm pl-8 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <XIcon className="size-3" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-primary" />
              Direct
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full border border-muted-foreground/60 bg-muted-foreground/40" />
              Inherited
            </span>
          </div>
        </div>
      )}

      <div className="relative max-h-[540px] w-full overflow-auto rounded-md border border-border bg-card shadow-xs">
        <table
          role="grid"
          aria-label={ariaLabel}
          aria-rowcount={rows.length === 0 ? 2 : totalRows}
          aria-colcount={totalCols}
          className="w-full border-collapse text-left text-sm"
        >
          {/* Table Header: Roles */}
          <thead className="sticky top-0 z-20 bg-background shadow-xs">
            <tr role="row" aria-rowindex={1} className="border-b border-border">
              <th
                role="columnheader"
                aria-colindex={1}
                tabIndex={focusedCell[0] === 0 && focusedCell[1] === 0 ? 0 : -1}
                ref={(el) => {
                  if (el) cellRefs.current.set(getCellKey(0, 0), el)
                }}
                onKeyDown={(e) => handleCellKeyDown(e, 0, 0)}
                onClick={() => setFocusedCell([0, 0])}
                className="sticky left-0 z-30 min-w-[240px] bg-background px-4 py-3 font-semibold text-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                Permissions
              </th>
              {roles.map((role, roleIndex) => {
                const colIdx = roleIndex + 1
                const isFocused =
                  focusedCell[0] === 0 && focusedCell[1] === colIdx
                const ancestors = inheritanceMap.get(role.id) ?? []
                const ancestorNames = ancestors
                  .map((id) => roles.find((r) => r.id === id)?.name ?? id)
                  .join(", ")

                return (
                  <th
                    key={role.id}
                    role="columnheader"
                    aria-colindex={colIdx + 1}
                    tabIndex={isFocused ? 0 : -1}
                    ref={(el) => {
                      if (el) cellRefs.current.set(getCellKey(0, colIdx), el)
                    }}
                    onKeyDown={(e) => handleCellKeyDown(e, 0, colIdx)}
                    onClick={() => setFocusedCell([0, colIdx])}
                    className="min-w-[130px] px-3 py-3 text-center font-medium text-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <span className="font-semibold">{role.name}</span>
                      {ancestorNames && (
                        <span
                          className="max-w-[120px] truncate text-[11px] font-normal text-muted-foreground"
                          title={`Inherits from ${ancestorNames}`}
                        >
                          inherits {ancestorNames}
                        </span>
                      )}
                      {role.description && !ancestorNames && (
                        <span className="max-w-[120px] truncate text-[11px] font-normal text-muted-foreground">
                          {role.description}
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          {/* Table Body: Groups and Action Rows */}
          <tbody>
            {rows.length === 0 ? (
              <tr role="row" aria-rowindex={2}>
                <td
                  role="gridcell"
                  colSpan={totalCols}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No matching permissions found.
                </td>
              </tr>
            ) : (
              rows.map((row, rIndex) => {
                const rowIndex = rIndex + 1

                if (row.type === "group") {
                  const isExpanded = effectiveExpanded.includes(row.group.id)
                  const isHeaderFocused =
                    focusedCell[0] === rowIndex && focusedCell[1] === 0

                  return (
                    <tr
                      key={row.id}
                      role="row"
                      aria-rowindex={rowIndex + 1}
                      className="border-b border-border bg-muted/40 font-medium transition-colors hover:bg-muted/60"
                    >
                      {/* Group Row Header */}
                      <th
                        role="rowheader"
                        aria-colindex={1}
                        tabIndex={isHeaderFocused ? 0 : -1}
                        ref={(el) => {
                          if (el)
                            cellRefs.current.set(getCellKey(rowIndex, 0), el)
                        }}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIndex, 0)}
                        onClick={() => {
                          setFocusedCell([rowIndex, 0])
                          toggleGroupExpansion(row.group.id)
                        }}
                        className="sticky left-0 z-10 min-w-[240px] bg-muted/90 px-3 py-2 text-foreground outline-hidden backdrop-blur-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                      >
                        <div className="flex cursor-pointer items-center gap-2 select-none">
                          <button
                            type="button"
                            tabIndex={-1}
                            className="flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
                            aria-label={
                              isExpanded
                                ? `Collapse ${row.group.name}`
                                : `Expand ${row.group.name}`
                            }
                          >
                            <ChevronRightIcon
                              className={cn(
                                "size-4 transition-transform duration-150",
                                isExpanded && "rotate-90"
                              )}
                            />
                          </button>
                          <span className="text-xs font-semibold tracking-wide text-foreground/80 uppercase">
                            {row.group.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className="h-4.5 px-1.5 text-[10px] font-normal text-muted-foreground"
                          >
                            {row.group.permissions.length}
                          </Badge>
                        </div>
                      </th>

                      {/* Group Checkbox Per Role */}
                      {roles.map((role, roleIndex) => {
                        const colIdx = roleIndex + 1
                        const isCellFocused =
                          focusedCell[0] === rowIndex &&
                          focusedCell[1] === colIdx
                        const groupStatus = getGroupStatus(
                          role.id,
                          row.group,
                          grants,
                          roles
                        )
                        const isRoleDisabled =
                          role.disabled || disabled || readOnly

                        return (
                          <td
                            key={role.id}
                            role="gridcell"
                            aria-colindex={colIdx + 1}
                            aria-label={`${row.group.name} group permissions for ${role.name}`}
                            tabIndex={isCellFocused ? 0 : -1}
                            ref={(el) => {
                              if (el)
                                cellRefs.current.set(
                                  getCellKey(rowIndex, colIdx),
                                  el
                                )
                            }}
                            onKeyDown={(e) =>
                              handleCellKeyDown(e, rowIndex, colIdx)
                            }
                            onClick={() => {
                              setFocusedCell([rowIndex, colIdx])
                              if (!isRoleDisabled) {
                                handleToggleGroup(role.id, row.group)
                              }
                            }}
                            className="cursor-pointer px-3 py-2 text-center outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                          >
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                role="checkbox"
                                tabIndex={-1}
                                aria-checked={
                                  groupStatus === "indeterminate"
                                    ? "mixed"
                                    : groupStatus === "checked"
                                }
                                aria-label={`${row.group.name} group permissions for ${role.name}`}
                                disabled={isRoleDisabled}
                                className={cn(
                                  "flex size-4.5 items-center justify-center rounded-sm border border-input transition-colors focus-visible:outline-hidden",
                                  groupStatus === "checked" &&
                                    "border-primary bg-primary text-primary-foreground",
                                  groupStatus === "indeterminate" &&
                                    "border-primary/50 bg-primary/10 text-primary",
                                  isRoleDisabled &&
                                    "cursor-not-allowed opacity-50"
                                )}
                              >
                                {groupStatus === "checked" && (
                                  <CheckIcon className="size-3.5 stroke-3" />
                                )}
                                {groupStatus === "indeterminate" && (
                                  <MinusIcon className="size-3.5 stroke-3" />
                                )}
                              </button>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                }

                // Individual Action Permission Row
                const isHeaderFocused =
                  focusedCell[0] === rowIndex && focusedCell[1] === 0

                return (
                  <tr
                    key={row.id}
                    role="row"
                    aria-rowindex={rowIndex + 1}
                    className="border-b border-border/60 transition-colors hover:bg-muted/20"
                  >
                    {/* Action Row Header */}
                    <th
                      role="rowheader"
                      aria-colindex={1}
                      tabIndex={isHeaderFocused ? 0 : -1}
                      ref={(el) => {
                        if (el)
                          cellRefs.current.set(getCellKey(rowIndex, 0), el)
                      }}
                      onKeyDown={(e) => handleCellKeyDown(e, rowIndex, 0)}
                      onClick={() => setFocusedCell([rowIndex, 0])}
                      className="sticky left-0 z-10 min-w-[240px] bg-background px-4 py-2 text-left font-normal text-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    >
                      <div className="flex flex-col pl-6">
                        <span className="text-sm font-medium text-foreground">
                          {row.action.name}
                        </span>
                        {row.action.description && (
                          <span className="line-clamp-1 text-xs text-muted-foreground">
                            {row.action.description}
                          </span>
                        )}
                      </div>
                    </th>

                    {/* Action Checkbox Per Role */}
                    {roles.map((role, roleIndex) => {
                      const colIdx = roleIndex + 1
                      const isCellFocused =
                        focusedCell[0] === rowIndex && focusedCell[1] === colIdx
                      const status = getPermissionStatus(
                        role.id,
                        row.action.id,
                        grants,
                        roles
                      )
                      const isRoleDisabled =
                        role.disabled ||
                        row.action.disabled ||
                        disabled ||
                        readOnly ||
                        (status.inherited && !allowOverrideInherited)

                      return (
                        <td
                          key={role.id}
                          role="gridcell"
                          aria-colindex={colIdx + 1}
                          aria-label={`${row.action.name} for ${role.name}`}
                          tabIndex={isCellFocused ? 0 : -1}
                          ref={(el) => {
                            if (el)
                              cellRefs.current.set(
                                getCellKey(rowIndex, colIdx),
                                el
                              )
                          }}
                          onKeyDown={(e) =>
                            handleCellKeyDown(e, rowIndex, colIdx)
                          }
                          onClick={() => {
                            setFocusedCell([rowIndex, colIdx])
                            if (!isRoleDisabled) {
                              handleToggleAction(role.id, row.action.id)
                            }
                          }}
                          className="cursor-pointer px-3 py-2 text-center outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                        >
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              role="checkbox"
                              tabIndex={-1}
                              aria-checked={status.granted}
                              aria-label={`${row.action.name} for ${role.name}: ${
                                status.inherited
                                  ? `Inherited from ${status.inheritedFrom}`
                                  : status.granted
                                    ? "Granted"
                                    : "Not granted"
                              }`}
                              disabled={isRoleDisabled}
                              title={
                                status.inherited
                                  ? `Inherited from ${status.inheritedFrom}`
                                  : undefined
                              }
                              className={cn(
                                "relative flex size-4.5 items-center justify-center rounded-sm border transition-colors focus-visible:outline-hidden",
                                status.direct &&
                                  "border-primary bg-primary text-primary-foreground",
                                status.inherited &&
                                  "border-dashed border-muted-foreground/60 bg-muted/80 text-muted-foreground",
                                !status.granted &&
                                  "border-input bg-background hover:bg-accent",
                                isRoleDisabled &&
                                  "cursor-not-allowed opacity-50"
                              )}
                            >
                              {status.direct && (
                                <CheckIcon className="size-3.5 stroke-3" />
                              )}
                              {status.inherited && (
                                <CheckIcon className="stroke-2.5 size-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
