"use client"

import * as React from "react"
import { FolderPlusIcon, ListFilterIcon, XIcon } from "lucide-react"

import { cn } from "@/registry/default/lib/utils"
import {
  createFilter,
  createFilterGroup,
  isFilterGroup,
  type Filter,
  type FilterField,
  type FilterGroup,
  type FilterItem,
} from "@/registry/default/lib/filter"
import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import { Button } from "@/registry/default/ui/button"
import { FilterChip } from "@/registry/default/ui/filter-chip"
import { FilterMenu, FilterMenuItem } from "@/registry/default/ui/filter-menu"

const MAX_NESTING_DEPTH = 2

type FilterBuilderBaseProps = Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> & {
  fields: FilterField[]
  allowGroups?: boolean
}

type FilterBuilderGroupProps = FilterBuilderBaseProps & {
  value: FilterGroup
  defaultValue?: FilterGroup
  onValueChange?: (value: FilterGroup) => void
}

type FilterBuilderFlatProps = FilterBuilderBaseProps & {
  value: Filter[]
  defaultValue?: Filter[]
  allowGroups?: false
  onValueChange?: (value: Filter[]) => void
}

type FilterBuilderExplicitGroupsFlatProps = FilterBuilderBaseProps & {
  value: Filter[]
  defaultValue?: Filter[]
  allowGroups: true
  onValueChange?: (value: Filter[] | FilterGroup) => void
}

type FilterBuilderUncontrolledOrUnionProps = FilterBuilderBaseProps & {
  value?: Filter[] | FilterGroup
  defaultValue?: Filter[] | FilterGroup
  onValueChange?: (value: Filter[] | FilterGroup) => void
}

type FilterBuilderProps =
  | FilterBuilderGroupProps
  | FilterBuilderFlatProps
  | FilterBuilderExplicitGroupsFlatProps
  | FilterBuilderUncontrolledOrUnionProps

function FilterBuilder({
  fields,
  value,
  defaultValue = [] as Filter[] | FilterGroup,
  onValueChange,
  allowGroups: allowGroupsProp,
  "aria-label": ariaLabel = "Filters",
  className,
  ...props
}: FilterBuilderProps) {
  const allowGroups =
    allowGroupsProp !== undefined
      ? allowGroupsProp
      : value !== undefined
        ? isFilterGroup(value)
        : true

  const { value: filters, setValue: setFilters } = useControllableState<
    Filter[] | FilterGroup
  >({
    value,
    defaultValue,
    onChange: onValueChange as
      ((value: Filter[] | FilterGroup) => void) | undefined,
  })

  const [newFilterId, setNewFilterId] = React.useState<string | null>(null)
  const didAddFilterRef = React.useRef(false)
  const fieldsById = React.useMemo(
    () => new Map(fields.map((field) => [field.id, field])),
    [fields]
  )

  const isGrouped = isFilterGroup(filters)

  // Flat mode handlers
  function addFilterFlat(field: FilterField) {
    const filter = createFilter(field)
    setFilters((current) => [
      ...(Array.isArray(current) ? current : []),
      filter,
    ])
    setNewFilterId(filter.id)
    didAddFilterRef.current = true
  }

  function addGroupFlat() {
    if (!allowGroups) return
    const newGroup = createFilterGroup("and")
    const currentFilters = Array.isArray(filters) ? filters : []
    setFilters({
      id: "root",
      conjunction: "and",
      filters: [...currentFilters, newGroup],
    })
  }

  function updateFilterFlat(next: Filter) {
    setFilters((current) =>
      Array.isArray(current)
        ? current.map((filter) => (filter.id === next.id ? next : filter))
        : current
    )
  }

  function removeFilterFlat(id: string) {
    setFilters((current) =>
      Array.isArray(current)
        ? current.filter((filter) => filter.id !== id)
        : current
    )
  }

  // Grouped mode handlers
  function updateInGroup(
    group: FilterGroup,
    targetId: string,
    updater: (item: FilterItem) => FilterItem | null
  ): FilterGroup {
    const nextFilters: FilterItem[] = []
    for (const child of group.filters) {
      if (child.id === targetId) {
        const updated = updater(child)
        if (updated !== null) nextFilters.push(updated)
      } else if (isFilterGroup(child)) {
        nextFilters.push(updateInGroup(child, targetId, updater))
      } else {
        nextFilters.push(child)
      }
    }
    return { ...group, filters: nextFilters }
  }

  function toggleConjunction(groupId: string) {
    setFilters((current) => {
      if (!isFilterGroup(current)) return current
      if (current.id === groupId) {
        return {
          ...current,
          conjunction: current.conjunction === "and" ? "or" : "and",
        }
      }
      return updateInGroup(current, groupId, (item) =>
        isFilterGroup(item)
          ? { ...item, conjunction: item.conjunction === "and" ? "or" : "and" }
          : item
      )
    })
  }

  function addFilterToGroup(groupId: string, field: FilterField) {
    const filter = createFilter(field)
    setNewFilterId(filter.id)
    didAddFilterRef.current = true

    setFilters((current) => {
      if (!isFilterGroup(current)) return current
      if (current.id === groupId) {
        return { ...current, filters: [...current.filters, filter] }
      }
      return updateInGroup(current, groupId, (group) =>
        isFilterGroup(group)
          ? { ...group, filters: [...group.filters, filter] }
          : group
      )
    })
  }

  function addSubGroupToGroup(groupId: string) {
    const newGroup = createFilterGroup("and")
    setFilters((current) => {
      if (!isFilterGroup(current)) return current
      if (current.id === groupId) {
        return { ...current, filters: [...current.filters, newGroup] }
      }
      return updateInGroup(current, groupId, (group) =>
        isFilterGroup(group)
          ? { ...group, filters: [...group.filters, newGroup] }
          : group
      )
    })
  }

  function updateFilterInGroup(next: Filter) {
    setFilters((current) => {
      if (!isFilterGroup(current)) return current
      return updateInGroup(current, next.id, () => next)
    })
  }

  function removeItemFromGroup(id: string) {
    setFilters((current) => {
      if (!isFilterGroup(current)) return current
      return updateInGroup(current, id, () => null)
    })
  }

  function handleClear() {
    if (isGrouped) {
      setFilters({ ...(filters as FilterGroup), filters: [] })
    } else {
      setFilters([])
    }
  }

  function renderGroupContent(group: FilterGroup, depth = 0): React.ReactNode {
    const isRoot = depth === 0
    const showConjunction = group.filters.length > 1 || !isRoot
    const canAddGroup = allowGroups && depth < MAX_NESTING_DEPTH

    return (
      <>
        {showConjunction && (
          <Button
            variant="outline"
            size="sm"
            data-slot="filter-builder-conjunction"
            aria-label={`Conjunction: ${group.conjunction.toUpperCase()}`}
            onClick={() => toggleConjunction(group.id)}
            className="h-control-sm font-mono text-xs font-semibold uppercase"
          >
            {group.conjunction}
          </Button>
        )}
        {group.filters.map((item) => {
          if (isFilterGroup(item)) {
            return (
              <div
                key={item.id}
                data-slot="filter-group"
                role="group"
                aria-label={`Filter group (${item.conjunction.toUpperCase()})`}
                className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border/70 bg-muted/20 p-1.5"
              >
                {renderGroupContent(item, depth + 1)}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label="Remove filter group"
                  onClick={() => removeItemFromGroup(item.id)}
                >
                  <XIcon className="size-3.5" />
                </Button>
              </div>
            )
          }

          const field = fieldsById.get(item.fieldId)
          if (!field) return null
          return (
            <FilterChip
              key={item.id}
              field={field}
              filter={item}
              isNew={item.id === newFilterId}
              onFilterChange={updateFilterInGroup}
              onRemove={() => removeItemFromGroup(item.id)}
            />
          )
        })}
        <FilterMenu
          onCloseAutoFocus={(event) => {
            if (!didAddFilterRef.current) return
            didAddFilterRef.current = false
            event.preventDefault()
          }}
          trigger={
            <Button
              variant="outline"
              size="sm"
              data-slot="filter-builder-add"
              aria-label={isRoot ? "Add filter" : "Add filter to group"}
              className="border-dashed"
            >
              <ListFilterIcon />
              {isRoot && group.filters.length === 0 && "Filter"}
            </Button>
          }
        >
          {fields.map((field) => (
            <FilterMenuItem
              key={field.id}
              onSelect={() => addFilterToGroup(group.id, field)}
            >
              {field.icon}
              {field.label}
            </FilterMenuItem>
          ))}
          {canAddGroup && (
            <>
              <div role="separator" className="my-1 border-t border-border" />
              <FilterMenuItem onSelect={() => addSubGroupToGroup(group.id)}>
                <FolderPlusIcon />
                Add group
              </FilterMenuItem>
            </>
          )}
        </FilterMenu>
      </>
    )
  }

  const isEmpty = isGrouped
    ? (filters as FilterGroup).filters.length === 0
    : (filters as Filter[]).length === 0

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      data-slot="filter-builder"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    >
      {isGrouped ? (
        renderGroupContent(filters as FilterGroup, 0)
      ) : (
        <>
          {(filters as Filter[]).map((filter) => {
            const field = fieldsById.get(filter.fieldId)
            if (!field) return null
            return (
              <FilterChip
                key={filter.id}
                field={field}
                filter={filter}
                isNew={filter.id === newFilterId}
                onFilterChange={updateFilterFlat}
                onRemove={() => removeFilterFlat(filter.id)}
              />
            )
          })}
          <FilterMenu
            onCloseAutoFocus={(event) => {
              if (!didAddFilterRef.current) return
              didAddFilterRef.current = false
              event.preventDefault()
            }}
            trigger={
              <Button
                variant="outline"
                size="sm"
                data-slot="filter-builder-add"
                aria-label="Add filter"
                className="border-dashed"
              >
                <ListFilterIcon />
                {isEmpty && "Filter"}
              </Button>
            }
          >
            {fields.map((field) => (
              <FilterMenuItem
                key={field.id}
                onSelect={() => addFilterFlat(field)}
              >
                {field.icon}
                {field.label}
              </FilterMenuItem>
            ))}
            {allowGroups && (
              <>
                <div role="separator" className="my-1 border-t border-border" />
                <FilterMenuItem onSelect={addGroupFlat}>
                  <FolderPlusIcon />
                  Add group
                </FilterMenuItem>
              </>
            )}
          </FilterMenu>
        </>
      )}

      {!isEmpty && (
        <Button
          variant="ghost"
          size="sm"
          data-slot="filter-builder-clear"
          onClick={handleClear}
        >
          Clear
        </Button>
      )}
    </div>
  )
}

export { FilterBuilder, type FilterBuilderProps }
