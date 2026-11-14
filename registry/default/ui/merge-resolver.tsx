"use client"

import * as React from "react"
import { CheckIcon, GitMergeIcon } from "lucide-react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import type { DiffSegment } from "@/registry/default/lib/diff"
import {
  getConflictAnnouncement,
  getFieldDiff,
  getMergedRecord,
  getUnresolvedCount,
  isAllResolved,
  isFieldConflict,
  isFieldResolved,
  resolveAll,
  type MergedRecord,
  type MergeField,
  type MergeFieldChoice,
  type MergeResolutions,
} from "@/registry/default/lib/merge-resolver-utils"
import { cn } from "@/registry/default/lib/utils"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import { Input } from "@/registry/default/ui/input"

const EMPTY_RESOLUTIONS: MergeResolutions = {}

function renderOursSegments(segments: DiffSegment[]) {
  if (segments.length === 0) {
    return <span className="text-muted-foreground italic">&lt;empty&gt;</span>
  }
  return segments.map((segment, index) =>
    segment.changed ? (
      <del
        key={index}
        className="text-destructive-foreground rounded-sm bg-destructive/25 px-0.5 font-semibold no-underline dark:text-destructive"
      >
        <span className="sr-only">Removed: </span>
        {segment.text}
      </del>
    ) : (
      <span key={index}>{segment.text}</span>
    )
  )
}

function renderTheirsSegments(segments: DiffSegment[]) {
  if (segments.length === 0) {
    return <span className="text-muted-foreground italic">&lt;empty&gt;</span>
  }
  return segments.map((segment, index) =>
    segment.changed ? (
      <ins
        key={index}
        className="rounded-sm bg-[color-mix(in_oklab,var(--chart-2)_35%,transparent)] px-0.5 font-semibold no-underline"
      >
        <span className="sr-only">Added: </span>
        {segment.text}
      </ins>
    ) : (
      <span key={index}>{segment.text}</span>
    )
  )
}

type MergeResolverProps = Omit<React.ComponentProps<"div">, "defaultValue"> & {
  fields: MergeField[]
  value?: MergeResolutions
  defaultValue?: MergeResolutions
  onValueChange?: (resolutions: MergeResolutions) => void
  onResolve?: (merged: MergedRecord) => void
  oursLabel?: string
  theirsLabel?: string
  customLabel?: string
  resolveLabel?: string
  acceptAllOursLabel?: string
  acceptAllTheirsLabel?: string
  disabled?: boolean
}

function MergeResolver({
  fields,
  value,
  defaultValue = EMPTY_RESOLUTIONS,
  onValueChange,
  onResolve,
  oursLabel = "Ours (Local)",
  theirsLabel = "Theirs (Remote)",
  customLabel = "Custom",
  resolveLabel = "Save resolutions",
  acceptAllOursLabel = "Accept all ours",
  acceptAllTheirsLabel = "Accept all theirs",
  disabled = false,
  className,
  ...props
}: MergeResolverProps) {
  const { value: resolutions, setValue: setResolutions } = useControllableState(
    {
      value,
      defaultValue,
      onChange: onValueChange,
    }
  )

  const unresolvedCount = React.useMemo(
    () => getUnresolvedCount(fields, resolutions),
    [fields, resolutions]
  )
  const allResolved = React.useMemo(
    () => isAllResolved(fields, resolutions),
    [fields, resolutions]
  )
  const conflictingFields = React.useMemo(
    () => fields.filter(isFieldConflict),
    [fields]
  )

  const handleChoiceChange = (field: MergeField, choice: MergeFieldChoice) => {
    const current = resolutions[field.name]
    const customValue =
      choice === "custom"
        ? (current?.customValue ?? field.ours)
        : current?.customValue

    setResolutions({
      ...resolutions,
      [field.name]: {
        choice,
        customValue,
      },
    })
  }

  const handleCustomChange = (fieldName: string, customValue: string) => {
    setResolutions({
      ...resolutions,
      [fieldName]: {
        choice: "custom",
        customValue,
      },
    })
  }

  const handleAcceptAll = (choice: "ours" | "theirs") => {
    setResolutions(resolveAll(fields, choice, resolutions))
  }

  const handleSave = () => {
    onResolve?.(getMergedRecord(fields, resolutions))
  }

  const announcement = getConflictAnnouncement(unresolvedCount)
  const baseId = React.useId()

  return (
    <div
      data-slot="merge-resolver"
      className={cn(
        "flex flex-col gap-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm",
        className
      )}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-2">
          <GitMergeIcon
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <span
            aria-live="polite"
            aria-atomic="true"
            data-slot="merge-resolver-status"
            className="text-sm font-medium"
          >
            {announcement}
          </span>
          <Badge
            variant={unresolvedCount === 0 ? "secondary" : "destructive"}
            className="text-xs"
          >
            {unresolvedCount === 0
              ? "Resolved"
              : `${unresolvedCount} remaining`}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || conflictingFields.length === 0}
            onClick={() => handleAcceptAll("ours")}
          >
            {acceptAllOursLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || conflictingFields.length === 0}
            onClick={() => handleAcceptAll("theirs")}
          >
            {acceptAllTheirsLabel}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {fields.map((field) => {
          const fieldId = `${baseId}-${field.name}`
          const isConflict = isFieldConflict(field)
          const fieldRes = resolutions[field.name]
          const isResolved = isFieldResolved(fieldRes)
          const fieldLabel = field.label ?? field.name

          if (!isConflict) {
            return (
              <div
                key={field.name}
                data-slot="merge-resolver-field"
                data-field-name={field.name}
                data-state="identical"
                className="rounded-md border bg-muted/20 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold">
                    {fieldLabel}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    No conflict
                  </Badge>
                </div>
                <div className="mt-2 rounded bg-muted/40 p-2 font-mono text-xs text-muted-foreground">
                  {field.ours || <span className="italic">&lt;empty&gt;</span>}
                </div>
              </div>
            )
          }

          const diff = getFieldDiff(field.ours, field.theirs)

          return (
            <div
              key={field.name}
              data-slot="merge-resolver-field"
              data-field-name={field.name}
              data-state={isResolved ? "resolved" : "unresolved"}
              className={cn(
                "rounded-md border p-3.5 transition-colors",
                isResolved
                  ? "border-border bg-card"
                  : "border-destructive/40 bg-destructive/5"
              )}
            >
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <span
                    id={`${fieldId}-label`}
                    className="font-mono text-sm font-semibold"
                  >
                    {fieldLabel}
                  </span>
                  {field.base !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      (Base: {field.base})
                    </span>
                  )}
                </div>
                <Badge
                  variant={isResolved ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  {isResolved ? "Resolved" : "Conflict"}
                </Badge>
              </div>

              <div
                role="radiogroup"
                aria-labelledby={`${fieldId}-label`}
                className="grid gap-2.5 pt-1"
              >
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-md border p-2.5 text-xs transition-colors",
                    fieldRes?.choice === "ours"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <input
                    type="radio"
                    name={`${fieldId}-choice`}
                    value="ours"
                    checked={fieldRes?.choice === "ours"}
                    disabled={disabled}
                    onChange={() => handleChoiceChange(field, "ours")}
                    aria-label={`${oursLabel} for ${fieldLabel}`}
                    aria-describedby={`${fieldId}-ours-value`}
                    className="mt-0.5 size-4 shrink-0 text-primary accent-primary"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between pb-1 font-medium">
                      <span>{oursLabel}</span>
                      <span className="text-[10px] text-muted-foreground">
                        Local
                      </span>
                    </div>
                    <div
                      id={`${fieldId}-ours-value`}
                      className="rounded bg-muted/40 p-2 font-mono text-xs break-all whitespace-pre-wrap"
                    >
                      {renderOursSegments(diff.oursSegments)}
                    </div>
                  </div>
                </label>

                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-md border p-2.5 text-xs transition-colors",
                    fieldRes?.choice === "theirs"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <input
                    type="radio"
                    name={`${fieldId}-choice`}
                    value="theirs"
                    checked={fieldRes?.choice === "theirs"}
                    disabled={disabled}
                    onChange={() => handleChoiceChange(field, "theirs")}
                    aria-label={`${theirsLabel} for ${fieldLabel}`}
                    aria-describedby={`${fieldId}-theirs-value`}
                    className="mt-0.5 size-4 shrink-0 text-primary accent-primary"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between pb-1 font-medium">
                      <span>{theirsLabel}</span>
                      <span className="text-[10px] text-muted-foreground">
                        Remote
                      </span>
                    </div>
                    <div
                      id={`${fieldId}-theirs-value`}
                      className="rounded bg-muted/40 p-2 font-mono text-xs break-all whitespace-pre-wrap"
                    >
                      {renderTheirsSegments(diff.theirsSegments)}
                    </div>
                  </div>
                </label>

                <div
                  className={cn(
                    "flex flex-col gap-2 rounded-md border p-2.5 text-xs transition-colors",
                    fieldRes?.choice === "custom"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <label className="flex cursor-pointer items-center gap-3 font-medium">
                    <input
                      type="radio"
                      name={`${fieldId}-choice`}
                      value="custom"
                      checked={fieldRes?.choice === "custom"}
                      disabled={disabled}
                      onChange={() => handleChoiceChange(field, "custom")}
                      aria-label={`${customLabel} for ${fieldLabel}`}
                      className="size-4 shrink-0 text-primary accent-primary"
                    />
                    <span>{customLabel}</span>
                  </label>

                  {fieldRes?.choice === "custom" && (
                    <div className="pt-1 pl-7">
                      <Input
                        value={fieldRes.customValue ?? ""}
                        placeholder="Enter custom value..."
                        disabled={disabled}
                        aria-label={`Custom value for ${fieldLabel}`}
                        onChange={(e) =>
                          handleCustomChange(field.name, e.target.value)
                        }
                        className="font-mono text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-end border-t pt-3">
        <Button
          type="button"
          disabled={disabled || !allResolved}
          onClick={handleSave}
        >
          <CheckIcon className="size-4" />
          {resolveLabel}
        </Button>
      </div>
    </div>
  )
}

export { MergeResolver, type MergeResolverProps }
