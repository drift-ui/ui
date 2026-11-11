"use client"

import * as React from "react"
import { PlusIcon, XIcon } from "lucide-react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  createRow,
  findDuplicateKeys,
  pasteRows,
  type KeyValueRow,
} from "@/registry/default/lib/key-value-editor-utils"
import { cn } from "@/registry/default/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { Input } from "@/registry/default/ui/input"
import { PasswordInput } from "@/registry/default/ui/password-input"

const EMPTY_ROWS: KeyValueRow[] = []

// Never equal to a row id, so any id is safe to use.
const ADD_BUTTON = Symbol("add button")
type FocusTarget = string | typeof ADD_BUTTON

function KeyValueEditor({
  value,
  defaultValue = EMPTY_ROWS,
  onValueChange,
  secretValues = false,
  keyLabel = "Key",
  valueLabel = "Value",
  keyPlaceholder = "KEY",
  valuePlaceholder = "Value",
  addLabel = "Add row",
  disabled = false,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "defaultValue"> & {
  value?: KeyValueRow[]
  defaultValue?: KeyValueRow[]
  onValueChange?: (rows: KeyValueRow[]) => void
  secretValues?: boolean
  keyLabel?: string
  valueLabel?: string
  keyPlaceholder?: string
  valuePlaceholder?: string
  addLabel?: string
  disabled?: boolean
}) {
  const { value: rows, setValue: setRows } = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const rootRef = React.useRef<HTMLDivElement>(null)
  // Where focus goes after the next render: a row's key input, or the add button.
  const pendingFocus = React.useRef<FocusTarget | null>(null)
  const baseId = React.useId()
  const duplicates = findDuplicateKeys(rows)

  function focusTarget(target: FocusTarget) {
    const root = rootRef.current
    if (!root) return
    // Compared, not interpolated into a selector, so any id works.
    const container =
      target === ADD_BUTTON
        ? root
        : [
            ...root.querySelectorAll<HTMLElement>(
              '[data-slot="key-value-editor-row"]'
            ),
          ].find((row) => row.dataset.rowId === target)
    container
      ?.querySelector<HTMLElement>(
        target === ADD_BUTTON
          ? '[data-slot="key-value-editor-add"]'
          : '[data-slot="key-value-editor-key"]'
      )
      ?.focus()
  }

  React.useLayoutEffect(() => {
    const target = pendingFocus.current
    if (target === null) return
    pendingFocus.current = null
    focusTarget(target)
  })

  function update(id: string, patch: Partial<KeyValueRow>) {
    setRows(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  function addRow() {
    const row = createRow()
    pendingFocus.current = row.id
    setRows([...rows, row])
  }

  function removeRow(index: number) {
    const neighbour = rows[index + 1] ?? rows[index - 1]
    pendingFocus.current = neighbour ? neighbour.id : ADD_BUTTON
    setRows(rows.filter((_, rowIndex) => rowIndex !== index))
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return
    event.preventDefault()
    if (index === rows.length - 1) addRow()
    else focusTarget(rows[index + 1].id)
  }

  function handlePaste(
    event: React.ClipboardEvent<HTMLInputElement>,
    index: number
  ) {
    const next = pasteRows(rows, index, event.clipboardData.getData("text"))
    if (!next) return
    event.preventDefault()
    pendingFocus.current = next.at(-1)?.id ?? null
    setRows(next)
  }

  return (
    <div
      ref={rootRef}
      role="group"
      data-slot="key-value-editor"
      className={cn("grid gap-2", className)}
      {...props}
    >
      {rows.length > 0 && (
        <div
          aria-hidden
          className="grid grid-cols-[1fr_1fr_2.25rem] gap-2 text-xs font-medium text-muted-foreground"
        >
          <span>{keyLabel}</span>
          <span>{valueLabel}</span>
        </div>
      )}
      {rows.map((row, index) => {
        const number = index + 1
        const isDuplicate = duplicates.has(row.key.trim())
        const errorId = `${baseId}-${row.id}-error`
        const ValueInput = secretValues ? PasswordInput : Input
        return (
          <div
            key={row.id}
            data-row-id={row.id}
            data-slot="key-value-editor-row"
            className="grid grid-cols-[1fr_1fr_2.25rem] gap-2"
          >
            <Input
              data-slot="key-value-editor-key"
              aria-label={`${keyLabel} ${number}`}
              aria-invalid={isDuplicate || undefined}
              aria-describedby={isDuplicate ? errorId : undefined}
              placeholder={keyPlaceholder}
              value={row.key}
              disabled={disabled}
              spellCheck={false}
              autoComplete="off"
              className="font-mono"
              onChange={(event) => update(row.id, { key: event.target.value })}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onPaste={(event) => handlePaste(event, index)}
            />
            <ValueInput
              data-slot="key-value-editor-value"
              aria-label={`${valueLabel} ${number}`}
              placeholder={valuePlaceholder}
              value={row.value}
              disabled={disabled}
              spellCheck={false}
              autoComplete="off"
              className="font-mono"
              onChange={(event) =>
                update(row.id, { value: event.target.value })
              }
              onKeyDown={(event) => handleKeyDown(event, index)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove row ${number}`}
              disabled={disabled}
              onClick={() => removeRow(index)}
            >
              <XIcon />
            </Button>
            {isDuplicate && (
              <p id={errorId} className="col-span-3 text-xs text-destructive">
                Duplicate key
              </p>
            )}
          </div>
        )
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-slot="key-value-editor-add"
        disabled={disabled}
        onClick={addRow}
        className="justify-self-start"
      >
        <PlusIcon />
        {addLabel}
      </Button>
    </div>
  )
}

export { KeyValueEditor, type KeyValueRow }
