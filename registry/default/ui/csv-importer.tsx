"use client"

import * as React from "react"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileSpreadsheetIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  buildRowRecords,
  cleanImportRows,
  parseCsv,
  suggestColumnMapping,
  updateRowValue,
  type CsvField,
  type CsvRowRecord,
} from "@/registry/default/lib/csv-importer.ts"
import { cn } from "@/registry/default/lib/utils"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"
import { FileDropzone } from "@/registry/default/ui/file-dropzone"
import { Input } from "@/registry/default/ui/input"
import { Label } from "@/registry/default/ui/label"
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperList,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/registry/default/ui/stepper"
import { VirtualList } from "@/registry/default/ui/virtual-list"

export type { CsvField, CsvRowRecord }

export interface CsvImporterProps extends Omit<
  React.ComponentProps<typeof Card>,
  "onComplete"
> {
  fields: CsvField[]
  onComplete: (rows: Record<string, unknown>[]) => void
  onCancel?: () => void
  maxRows?: number
  maxFileSize?: number
  sampleRowsCount?: number
  autoMap?: boolean
  step?: number
  defaultStep?: number
  onStepChange?: (step: number) => void
  defaultFile?: File
}

const SELECT_CLASS_NAME =
  "h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 [&>option]:bg-popover [&>option]:text-popover-foreground"

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    sizes.length - 1
  )
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const STEP_TITLES = ["Upload", "Map Columns", "Review Data", "Import"]

export function CsvImporter({
  fields,
  onComplete,
  onCancel,
  maxRows = 10000,
  maxFileSize = 10 * 1024 * 1024,
  sampleRowsCount = 3,
  autoMap = true,
  step: controlledStep,
  defaultStep = 0,
  onStepChange,
  defaultFile,
  className,
  onKeyDown,
  ...props
}: CsvImporterProps) {
  const { value: activeStep, setValue: setActiveStep } =
    useControllableState<number>({
      value: controlledStep,
      defaultValue: defaultStep,
      onChange: onStepChange,
    })

  // Uploaded file data state
  const [file, setFile] = React.useState<File | null>(null)
  const [parseError, setParseError] = React.useState<string | null>(null)
  const [isParsing, setIsParsing] = React.useState(false)
  const [headers, setHeaders] = React.useState<string[]>([])
  const [rawRows, setRawRows] = React.useState<string[][]>([])
  const [isTruncated, setIsTruncated] = React.useState(false)

  // Mapping state: fieldId -> CSV header name or col-X index
  const [mapping, setMapping] = React.useState<Record<string, string>>({})
  const [lastBuiltMappingKey, setLastBuiltMappingKey] = React.useState<
    string | null
  >(null)

  // Row records state for review step
  const [rowRecords, setRowRecords] = React.useState<CsvRowRecord[]>([])
  const [reviewFilter, setReviewFilter] = React.useState<
    "all" | "invalid" | "valid"
  >("all")

  const defaultFileInitializedRef = React.useRef(false)

  // Handle file acceptance and CSV parsing
  const handleFilesAccepted = React.useCallback(
    async (files: File[]) => {
      const selected = files[0]
      if (!selected) return

      setIsParsing(true)
      setParseError(null)

      try {
        const text = await selected.text()
        const result = parseCsv(text, { maxRows })

        if (result.headers.length === 0) {
          setParseError(
            "The CSV file is empty or does not contain a header row."
          )
          setIsParsing(false)
          return
        }

        setFile(selected)
        setHeaders(result.headers)
        setRawRows(result.rows)
        setIsTruncated(result.truncated)
        setRowRecords([])
        setLastBuiltMappingKey(null)
        setReviewFilter("all")

        if (autoMap) {
          const suggested = suggestColumnMapping(result.headers, fields)
          setMapping(suggested)
        } else {
          setMapping({})
        }

        setActiveStep(1)
      } catch (err) {
        setParseError(
          err instanceof Error ? err.message : "Failed to parse CSV file."
        )
      } finally {
        setIsParsing(false)
      }
    },
    [autoMap, fields, maxRows, setActiveStep]
  )

  React.useEffect(() => {
    if (!defaultFile || defaultFileInitializedRef.current) return
    defaultFileInitializedRef.current = true

    let active = true

    void Promise.resolve().then(() => {
      if (!active) return

      if (maxFileSize !== undefined && defaultFile.size > maxFileSize) {
        setParseError(
          `File exceeds maximum allowed size of ${formatBytes(maxFileSize)}.`
        )
        return
      }

      return defaultFile.text().then((text) => {
        if (!active) return
        try {
          const result = parseCsv(text, { maxRows })
          if (result.headers.length === 0) {
            setParseError(
              "The CSV file is empty or does not contain a header row."
            )
            return
          }
          setFile(defaultFile)
          setHeaders(result.headers)
          setRawRows(result.rows)
          setIsTruncated(result.truncated)
          setRowRecords([])
          setLastBuiltMappingKey(null)
          setReviewFilter("all")
          if (autoMap) {
            setMapping(suggestColumnMapping(result.headers, fields))
          } else {
            setMapping({})
          }
          setActiveStep(1)
        } catch (err) {
          setParseError(
            err instanceof Error ? err.message : "Failed to parse CSV file."
          )
        }
      })
    })

    return () => {
      active = false
    }
  }, [defaultFile, maxFileSize, maxRows, autoMap, fields, setActiveStep])

  // Check required fields mapping
  const unmappedRequiredFields = React.useMemo(() => {
    return fields.filter((f) => f.required && !mapping[f.id])
  }, [fields, mapping])

  const canProceedToReview = unmappedRequiredFields.length === 0

  // Advance from Mapping to Review
  const handleProceedToReview = React.useCallback(() => {
    const currentKey = JSON.stringify(mapping)
    if (rowRecords.length === 0 || lastBuiltMappingKey !== currentKey) {
      const summary = buildRowRecords(rawRows, headers, mapping, fields)
      setRowRecords(summary.rows)
      setLastBuiltMappingKey(currentKey)
    }
    setActiveStep(2)
  }, [
    fields,
    headers,
    lastBuiltMappingKey,
    mapping,
    rawRows,
    rowRecords.length,
    setActiveStep,
  ])

  // Cell edit in Review step
  const handleCellChange = React.useCallback(
    (rowId: string, fieldId: string, newValue: string) => {
      setRowRecords((prev) =>
        prev.map((row) => {
          if (row.id === rowId) {
            return updateRowValue(row, fieldId, newValue, fields)
          }
          return row
        })
      )
    },
    [fields]
  )

  // Delete row in Review step
  const handleDeleteRow = React.useCallback((rowId: string) => {
    setRowRecords((prev) => prev.filter((r) => r.id !== rowId))
  }, [])

  // Remove all invalid rows in Review step
  const handleRemoveInvalidRows = React.useCallback(() => {
    setRowRecords((prev) => prev.filter((r) => r.isValid))
    setReviewFilter("all")
  }, [])

  // Calculate review stats
  const { validCount, invalidCount, totalCount } = React.useMemo(() => {
    let valid = 0
    let invalid = 0
    for (const r of rowRecords) {
      if (r.isValid) valid++
      else invalid++
    }
    return {
      validCount: valid,
      invalidCount: invalid,
      totalCount: rowRecords.length,
    }
  }, [rowRecords])

  // Filtered rows for VirtualList
  const filteredRows = React.useMemo(() => {
    if (reviewFilter === "valid") return rowRecords.filter((r) => r.isValid)
    if (reviewFilter === "invalid") return rowRecords.filter((r) => !r.isValid)
    return rowRecords
  }, [reviewFilter, rowRecords])

  // Active mapped fields for table columns
  const mappedFields = React.useMemo(() => {
    return fields.filter((f) => Boolean(mapping[f.id]))
  }, [fields, mapping])

  // Reset / start over
  const handleReset = React.useCallback(() => {
    setFile(null)
    setHeaders([])
    setRawRows([])
    setMapping({})
    setRowRecords([])
    setLastBuiltMappingKey(null)
    setReviewFilter("all")
    setParseError(null)
    setActiveStep(0)
    onCancel?.()
  }, [onCancel, setActiveStep])

  // Keyboard shortcut listener: Escape resets or cancels active step
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e)
      if (e.defaultPrevented) return

      if (e.key === "Escape") {
        const target = e.target as HTMLElement
        if (
          target &&
          (target.tagName === "INPUT" || target.tagName === "SELECT")
        ) {
          target.blur()
          return
        }
        if (activeStep > 0) {
          e.preventDefault()
          handleReset()
        }
      }
    },
    [activeStep, handleReset, onKeyDown]
  )

  // Final Complete Import
  const handleCompleteImport = React.useCallback(() => {
    const cleanData = cleanImportRows(rowRecords, fields)
    onComplete(cleanData)
  }, [fields, onComplete, rowRecords])

  return (
    <Card
      data-slot="csv-importer"
      className={cn("w-full overflow-hidden shadow-xs", className)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <CardHeader className="border-b pb-4">
        <Stepper
          value={activeStep}
          onValueChange={setActiveStep}
          stepCount={STEP_TITLES.length}
          linear
        >
          <StepperList
            aria-label="CSV Import Progress"
            className="w-full justify-between"
          >
            {STEP_TITLES.map((title, idx) => (
              <StepperItem key={title} step={idx} className="flex-1">
                <StepperTrigger
                  disabled={
                    (idx === 1 && !file) ||
                    (idx === 2 &&
                      (rowRecords.length === 0 || !canProceedToReview)) ||
                    (idx === 3 && (rowRecords.length === 0 || validCount === 0))
                  }
                >
                  <StepperIndicator />
                  <StepperTitle>{title}</StepperTitle>
                </StepperTrigger>
                {idx < STEP_TITLES.length - 1 && <StepperSeparator />}
              </StepperItem>
            ))}
          </StepperList>

          {/* Step 0: Upload */}
          <StepperContent step={0}>
            <div className="space-y-4 pt-4">
              <div>
                <CardTitle className="text-lg">Upload CSV File</CardTitle>
                <CardDescription>
                  Upload your UTF-8 encoded .csv file to begin importing data.
                </CardDescription>
              </div>

              <FileDropzone
                accept=".csv,text/csv"
                maxSize={maxFileSize}
                multiple={false}
                maxFiles={1}
                disabled={isParsing}
                onFilesAccepted={handleFilesAccepted}
                onFilesRejected={(rejections) => {
                  const first = rejections[0]
                  if (first.reason === "size") {
                    setParseError(
                      `File exceeds maximum allowed size of ${formatBytes(maxFileSize)}.`
                    )
                  } else if (first.reason === "type") {
                    setParseError("Only .csv files are supported.")
                  } else {
                    setParseError("Invalid file upload.")
                  }
                }}
                className="py-12"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full border bg-muted/40">
                    <UploadIcon className="size-6 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">
                    Drag and drop your CSV file here, or{" "}
                    <span className="text-primary underline underline-offset-4">
                      browse
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Up to {formatBytes(maxFileSize)} (max{" "}
                    {maxRows.toLocaleString()} rows)
                  </span>
                </div>
              </FileDropzone>

              {parseError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  <AlertCircleIcon className="size-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          </StepperContent>

          {/* Step 1: Map Columns */}
          <StepperContent step={1}>
            <div className="space-y-4 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">Map Columns</CardTitle>
                  <CardDescription>
                    Match columns from{" "}
                    <span className="font-medium text-foreground">
                      {file?.name}
                    </span>{" "}
                    ({rawRows.length} rows detected) to application fields.
                  </CardDescription>
                </div>
                {isTruncated && (
                  <Badge
                    variant="outline"
                    className="border-amber-500/50 text-amber-600 dark:text-amber-400"
                  >
                    Showing first {maxRows} rows
                  </Badge>
                )}
              </div>

              {unmappedRequiredFields.length > 0 && (
                <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                  <AlertCircleIcon className="size-4 shrink-0" />
                  <span>
                    Please map all required fields:{" "}
                    <strong>
                      {unmappedRequiredFields.map((f) => f.label).join(", ")}
                    </strong>
                  </span>
                </div>
              )}

              <div className="space-y-3 divide-y rounded-lg border bg-card p-4">
                {fields.map((field) => {
                  const mappedVal = mapping[field.id] ?? ""
                  let colIdx = -1
                  if (
                    typeof mappedVal === "string" &&
                    mappedVal.startsWith("col-")
                  ) {
                    colIdx = parseInt(mappedVal.slice(4), 10)
                  } else if (mappedVal) {
                    colIdx = headers.indexOf(mappedVal)
                  }

                  const selectedSelectValue =
                    colIdx >= 0 && colIdx < headers.length
                      ? `col-${colIdx}`
                      : ""

                  const sampleValues =
                    colIdx >= 0 && colIdx < headers.length
                      ? rawRows
                          .slice(0, sampleRowsCount)
                          .map((r) => r[colIdx] ?? "")
                          .filter((v) => v !== "")
                      : []

                  return (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 items-start gap-3 pt-3 first:pt-0 sm:grid-cols-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor={`map-${field.id}`}
                            className="font-medium"
                          >
                            {field.label}
                          </Label>
                          {field.required ? (
                            <Badge variant="secondary" className="text-[10px]">
                              Required
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Optional
                            </span>
                          )}
                        </div>
                        {field.description && (
                          <p className="text-xs text-muted-foreground">
                            {field.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <select
                          id={`map-${field.id}`}
                          aria-label={`Map ${field.label}`}
                          value={selectedSelectValue}
                          onChange={(e) => {
                            const val = e.target.value
                            setMapping((prev) => {
                              if (prev[field.id] === val) return prev
                              return {
                                ...prev,
                                [field.id]: val,
                              }
                            })
                            setRowRecords([])
                            setLastBuiltMappingKey(null)
                          }}
                          className={SELECT_CLASS_NAME}
                        >
                          <option value="">-- Do not import --</option>
                          {headers.map((h, idx) => {
                            const isDuplicate =
                              headers.filter((header) => header === h).length >
                              1
                            const label = isDuplicate
                              ? `${h} (Column ${idx + 1})`
                              : h
                            const colKey = `col-${idx}`
                            return (
                              <option key={colKey} value={colKey}>
                                {label}
                              </option>
                            )
                          })}
                        </select>

                        {selectedSelectValue && sampleValues.length > 0 && (
                          <p className="truncate text-xs text-muted-foreground">
                            Preview:{" "}
                            <span className="font-mono text-[11px] text-foreground">
                              {sampleValues.join(", ")}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveStep(0)}
                >
                  <ChevronLeftIcon className="size-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={!canProceedToReview}
                  onClick={handleProceedToReview}
                >
                  Continue to Review
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          </StepperContent>

          {/* Step 2: Review Data */}
          <StepperContent step={2}>
            <div className="space-y-4 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">Review & Fix Data</CardTitle>
                  <CardDescription>
                    Review parsed data. Edit invalid cells directly or remove
                    rows.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div
                    role="tablist"
                    aria-label="Filter rows"
                    className="flex rounded-lg border bg-muted/40 p-0.5 text-xs font-medium"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={reviewFilter === "all"}
                      onClick={() => setReviewFilter("all")}
                      className={cn(
                        "rounded-md px-2.5 py-1 transition-colors",
                        reviewFilter === "all"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      All ({totalCount})
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={reviewFilter === "invalid"}
                      onClick={() => setReviewFilter("invalid")}
                      className={cn(
                        "rounded-md px-2.5 py-1 transition-colors",
                        reviewFilter === "invalid"
                          ? "bg-background text-destructive shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Invalid ({invalidCount})
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={reviewFilter === "valid"}
                      onClick={() => setReviewFilter("valid")}
                      className={cn(
                        "rounded-md px-2.5 py-1 transition-colors",
                        reviewFilter === "valid"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Valid ({validCount})
                    </button>
                  </div>

                  {invalidCount > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveInvalidRows}
                      className="text-xs"
                    >
                      <Trash2Icon className="size-3.5 text-muted-foreground" />
                      Discard invalid ({invalidCount})
                    </Button>
                  )}
                </div>
              </div>

              {invalidCount > 0 && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircleIcon className="size-4 shrink-0" />
                  <span>
                    {invalidCount} row
                    {invalidCount === 1 ? " contains" : "s contain"} validation
                    errors. Fix values in the table below or discard them.
                  </span>
                </div>
              )}

              {/* Virtualized Table */}
              <div className="rounded-lg border bg-card">
                {/* Header */}
                <div className="flex border-b bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
                  <div className="w-12 shrink-0">#</div>
                  {mappedFields.map((field) => (
                    <div key={field.id} className="min-w-36 flex-1 px-2">
                      <span className="text-foreground">{field.label}</span>
                      {field.required && (
                        <span className="ml-0.5 text-destructive">*</span>
                      )}
                    </div>
                  ))}
                  <div className="w-12 shrink-0 text-right">Action</div>
                </div>

                {filteredRows.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No rows match the current filter.
                  </div>
                ) : (
                  <VirtualList
                    aria-label="CSV records table"
                    items={filteredRows}
                    estimateSize={52}
                    overscan={6}
                    getItemKey={(row) => row.id}
                    className="max-h-80 divide-y overflow-y-auto"
                  >
                    {(row) => {
                      return (
                        <div
                          key={row.id}
                          className={cn(
                            "flex items-center px-3 py-1.5 text-xs transition-colors",
                            !row.isValid && "bg-destructive/5"
                          )}
                        >
                          <div className="w-12 shrink-0 font-mono text-[11px] text-muted-foreground">
                            {row.rowIndex + 1}
                          </div>

                          {mappedFields.map((field) => {
                            const error = row.errors[field.id]
                            const value = row.values[field.id] ?? ""

                            return (
                              <div
                                key={field.id}
                                className="min-w-36 flex-1 px-2 py-0.5"
                              >
                                <Input
                                  aria-label={`${field.label} row ${row.rowIndex + 1}`}
                                  aria-invalid={Boolean(error)}
                                  value={value}
                                  onChange={(e) =>
                                    handleCellChange(
                                      row.id,
                                      field.id,
                                      e.target.value
                                    )
                                  }
                                  className={cn(
                                    "h-8 text-xs",
                                    Boolean(error) &&
                                      "border-destructive focus-visible:ring-destructive/30"
                                  )}
                                />
                                {error && (
                                  <span className="mt-0.5 block truncate text-[10px] text-destructive">
                                    {error}
                                  </span>
                                )}
                              </div>
                            )
                          })}

                          <div className="w-12 shrink-0 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRow(row.id)}
                              aria-label={`Delete row ${row.rowIndex + 1}`}
                              className="size-7 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2Icon className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      )
                    }}
                  </VirtualList>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveStep(1)}
                >
                  <ChevronLeftIcon className="size-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={validCount === 0}
                  onClick={() => setActiveStep(3)}
                >
                  {invalidCount === 0
                    ? "Continue to Import"
                    : `Import ${validCount} valid row${validCount === 1 ? "" : "s"}`}
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          </StepperContent>

          {/* Step 3: Summary / Import */}
          <StepperContent step={3}>
            <div className="space-y-4 pt-4">
              <div>
                <CardTitle className="text-lg">Confirm Import</CardTitle>
                <CardDescription>
                  Review the import summary before committing records to the
                  application.
                </CardDescription>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1 rounded-lg border bg-muted/20 p-4">
                  <span className="text-xs text-muted-foreground">
                    Source file
                  </span>
                  <div className="flex items-center gap-2 font-medium">
                    <FileSpreadsheetIcon className="size-4 text-primary" />
                    <span className="truncate">
                      {file?.name ?? "Imported file"}
                    </span>
                  </div>
                  {file && (
                    <span className="text-xs text-muted-foreground">
                      Size: {formatBytes(file.size)}
                    </span>
                  )}
                </div>

                <div className="space-y-1 rounded-lg border bg-muted/20 p-4">
                  <span className="text-xs text-muted-foreground">
                    Import readiness
                  </span>
                  <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2Icon className="size-4 shrink-0" />
                    <span>
                      {validCount} record{validCount === 1 ? "" : "s"} ready
                    </span>
                  </div>
                  {invalidCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({invalidCount} invalid row{invalidCount === 1 ? "" : "s"}{" "}
                      will be skipped)
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 rounded-lg border p-4">
                <span className="text-xs font-medium text-muted-foreground">
                  Mapped Fields ({mappedFields.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {mappedFields.map((field) => (
                    <Badge
                      key={field.id}
                      variant="secondary"
                      className="text-xs"
                    >
                      {field.label} &larr; {mapping[field.id]}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveStep(2)}
                >
                  <ChevronLeftIcon className="size-4" />
                  Back
                </Button>

                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" onClick={handleReset}>
                    Start Over
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCompleteImport}
                    disabled={validCount === 0}
                  >
                    Complete Import ({validCount})
                  </Button>
                </div>
              </div>
            </div>
          </StepperContent>
        </Stepper>
      </CardHeader>
    </Card>
  )
}
