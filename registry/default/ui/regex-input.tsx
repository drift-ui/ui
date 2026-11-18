"use client"

import * as React from "react"
import { AlertCircleIcon } from "lucide-react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  DEFAULT_AVAILABLE_FLAGS,
  findRegexMatches,
  highlightSampleText,
  normalizeFlags,
  REGEX_FLAGS,
  toggleFlag,
  validateRegex,
  type RegexFlagInfo,
} from "@/registry/default/lib/regex-input-utils"
import { cn } from "@/registry/default/lib/utils"
import { Badge } from "@/registry/default/ui/badge"

export interface RegexInputProps extends Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> {
  /** The regex pattern string (without slash delimiters) */
  value?: string
  /** Uncontrolled default pattern */
  defaultValue?: string
  /** Callback when pattern changes */
  onValueChange?: (pattern: string) => void

  /** Active regex flags (e.g. "i", "ims") */
  flags?: string
  /** Uncontrolled default flags */
  defaultFlags?: string
  /** Callback when flags change */
  onFlagsChange?: (flags: string) => void

  /** Available flag toggle buttons to display. Defaults to ["i", "m", "s"] */
  availableFlags?: readonly string[]

  /** Sample text to test pattern against */
  sample?: string

  /** Placeholder text for pattern input */
  placeholder?: string

  /** Disabled state */
  disabled?: boolean
  /** Read-only state */
  readOnly?: boolean

  /** Form field name for hidden input */
  name?: string

  /** Whether to show regex delimiters `/` ... `/`. Defaults to true */
  showDelimiters?: boolean

  /** Whether to show flag toggle buttons. Defaults to true */
  showFlags?: boolean

  /** Whether to display constructor error message on invalid regex. Defaults to true */
  showError?: boolean

  /** Whether to show sample text highlight and match preview when sample is provided. Defaults to true */
  showSamplePreview?: boolean

  /** Maximum matches to process. Defaults to 100 */
  maxMatches?: number

  /** Maximum sample text length. Defaults to 20000 */
  maxSampleLength?: number

  /** Additional props forwarded to the underlying text input */
  inputProps?: Omit<
    React.ComponentProps<"input">,
    "value" | "defaultValue" | "onChange" | "disabled" | "readOnly"
  >

  /** Ref to the underlying text input */
  inputRef?: React.Ref<HTMLInputElement>
}

function RegexInput({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  flags: flagsProp,
  defaultFlags = "",
  onFlagsChange,
  availableFlags = DEFAULT_AVAILABLE_FLAGS,
  sample,
  placeholder = "pattern",
  disabled = false,
  readOnly = false,
  name,
  showDelimiters = true,
  showFlags = true,
  showError = true,
  showSamplePreview = true,
  maxMatches = 100,
  maxSampleLength = 20000,
  inputRef,
  inputProps,
  className,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: RegexInputProps) {
  const { value: pattern, setValue: setPattern } = useControllableState({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  })

  const { value: currentFlags, setValue: setCurrentFlags } =
    useControllableState({
      value: flagsProp !== undefined ? normalizeFlags(flagsProp) : undefined,
      defaultValue: normalizeFlags(defaultFlags),
      onChange: onFlagsChange,
    })

  const generatedId = React.useId()
  const inputId = `regex-pattern-${generatedId}`
  const errorId = `regex-error-${generatedId}`
  const sampleId = `regex-sample-${generatedId}`
  const statusId = `regex-status-${generatedId}`

  const internalInputRef = React.useRef<HTMLInputElement | null>(null)
  React.useImperativeHandle(
    inputRef,
    () => internalInputRef.current as HTMLInputElement
  )

  // Validate pattern
  const validation = React.useMemo(
    () => validateRegex(pattern, currentFlags),
    [pattern, currentFlags]
  )
  const isValid = validation.isValid
  const error = validation.error

  // Find matches if sample text is provided
  const matchResult = React.useMemo(() => {
    if (!sample || !isValid) return null
    return findRegexMatches(pattern, currentFlags, sample, {
      maxMatches,
      maxSampleLength,
    })
  }, [pattern, currentFlags, sample, isValid, maxMatches, maxSampleLength])

  const matches = React.useMemo(() => matchResult?.matches ?? [], [matchResult])
  const matchCount = matchResult?.matchCount ?? 0

  // Segment sample text for highlighting
  const segments = React.useMemo(
    () => highlightSampleText(sample ?? "", matches),
    [sample, matches]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPattern(e.target.value)
  }

  const handleToggleFlag = (flag: string) => {
    if (disabled || readOnly) return
    const nextFlags = toggleFlag(currentFlags, flag)
    setCurrentFlags(nextFlags)
  }

  return (
    <div
      data-slot="regex-input"
      className={cn("flex w-full flex-col gap-2 text-sm", className)}
      {...props}
    >
      <div
        data-slot="regex-input-control"
        data-invalid={!isValid || undefined}
        className={cn(
          "flex h-control w-full items-center gap-1.5 rounded-control border bg-background px-3 shadow-control transition-all",
          "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
          !isValid &&
            "border-destructive focus-within:border-destructive focus-within:ring-destructive/20 dark:focus-within:ring-destructive/40",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        {showDelimiters && (
          <span
            aria-hidden="true"
            className="font-mono font-medium text-muted-foreground select-none"
          >
            /
          </span>
        )}

        <input
          ref={internalInputRef}
          id={inputProps?.id ?? inputId}
          type="text"
          value={pattern}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={!isValid}
          aria-label={
            inputProps?.["aria-label"] ??
            ariaLabel ??
            (ariaLabelledBy || inputProps?.["aria-labelledby"]
              ? undefined
              : "Regular expression pattern")
          }
          aria-labelledby={inputProps?.["aria-labelledby"] ?? ariaLabelledBy}
          aria-describedby={
            cn(
              !isValid && showError && errorId,
              sample && statusId,
              ariaDescribedBy,
              inputProps?.["aria-describedby"]
            ) || undefined
          }
          {...inputProps}
          className={cn(
            "flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed",
            inputProps?.className
          )}
        />

        {showDelimiters && (
          <span
            aria-hidden="true"
            className="font-mono font-medium text-muted-foreground select-none"
          >
            /
          </span>
        )}

        {showFlags && availableFlags.length > 0 && (
          <div
            role="group"
            aria-label="Regex flags"
            className="flex items-center gap-0.5 border-l border-border pl-1.5"
          >
            {availableFlags.map((flag) => {
              const info: RegexFlagInfo | undefined = REGEX_FLAGS[flag]
              const isActive = currentFlags.includes(flag)
              const label = info ? `${info.label} (${flag})` : `Flag ${flag}`
              const title = info
                ? `${info.label} (${flag}): ${info.description}`
                : `Flag ${flag}`

              return (
                <button
                  key={flag}
                  type="button"
                  aria-pressed={isActive}
                  aria-label={label}
                  title={title}
                  disabled={disabled || readOnly}
                  onClick={() => handleToggleFlag(flag)}
                  className={cn(
                    "inline-flex size-6 cursor-pointer items-center justify-center rounded-sm font-mono text-xs font-semibold transition-colors select-none",
                    isActive
                      ? "bg-accent font-bold text-accent-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    "focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  {flag}
                </button>
              )
            })}
          </div>
        )}

        {sample && isValid && pattern && (
          <Badge
            variant="secondary"
            className="h-5 shrink-0 px-1.5 text-[10px] font-normal"
          >
            {matchCount} {matchCount === 1 ? "match" : "matches"}
            {matchResult?.truncated && "+"}
          </Badge>
        )}
      </div>

      {!isValid && showError && error && (
        <div
          id={errorId}
          role="alert"
          aria-live="assertive"
          className="flex items-center gap-1.5 text-xs font-medium text-destructive"
        >
          <AlertCircleIcon className="size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {sample && (
        <div id={statusId} className="sr-only" aria-live="polite">
          {isValid && pattern
            ? `${matchCount} matches found in sample text`
            : !isValid
              ? "Invalid regex pattern"
              : ""}
        </div>
      )}

      {sample && showSamplePreview && (
        <div
          id={sampleId}
          data-slot="regex-sample-preview"
          className="flex flex-col gap-2 rounded-control border border-border bg-muted/30 p-3 text-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground">
              Test Sample
            </span>
            <span className="text-[11px] text-muted-foreground">
              {pattern ? (
                isValid ? (
                  <>
                    <span className="font-medium text-foreground">
                      {matchCount}
                    </span>{" "}
                    {matchCount === 1 ? "match" : "matches"}
                    {matchResult?.truncated ? " (limit reached)" : ""}
                  </>
                ) : (
                  <span className="font-medium text-destructive">
                    Invalid pattern
                  </span>
                )
              ) : (
                "Enter a pattern to test"
              )}
            </span>
          </div>

          <pre className="max-h-48 overflow-auto rounded-sm border border-border/60 bg-background/80 p-2.5 font-mono text-xs break-all whitespace-pre-wrap select-text">
            {segments.map((seg, i) =>
              seg.isMatch ? (
                <mark
                  key={i}
                  data-match-index={seg.matchIndex}
                  className="rounded-xs border-b border-primary/50 bg-primary/20 px-0.5 font-medium text-foreground"
                >
                  {seg.text}
                </mark>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )}
          </pre>

          {matches.some((m) => m.groups.length > 0) && (
            <div className="mt-1 space-y-1.5 border-t border-border/50 pt-2">
              <span className="text-[11px] font-semibold text-muted-foreground">
                Capture Groups
              </span>
              <div className="max-h-36 space-y-1 overflow-auto font-mono text-[11px]">
                {matches.slice(0, 10).map((m, mIdx) => (
                  <div
                    key={mIdx}
                    className="rounded-sm border border-border/40 bg-background/60 p-1.5"
                  >
                    <span className="text-muted-foreground">
                      Match {mIdx + 1}:{" "}
                    </span>
                    <span className="font-medium">&quot;{m.match}&quot;</span>
                    <div className="mt-0.5 ml-3 space-y-0.5">
                      {m.groups.map((g, gIdx) => (
                        <div key={gIdx} className="text-muted-foreground">
                          <span className="font-medium text-primary">
                            {g.name ? `$${g.name}` : `Group ${g.number}`}
                          </span>
                          :{" "}
                          <span className="text-foreground">
                            &quot;{g.value}&quot;
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {matches.length > 10 && (
                  <p className="text-[10px] text-muted-foreground italic">
                    + {matches.length - 10} more matches
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {name && (
        <input type="hidden" name={name} value={pattern} disabled={disabled} />
      )}
    </div>
  )
}

export { RegexInput }
