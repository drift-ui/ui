"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  calculateProgress,
  getCompletedCount,
  isItemCompleted,
  toggleItem,
  type OnboardingChecklistProgress,
} from "@/registry/default/lib/onboarding-checklist.ts"
import { cn } from "@/registry/default/lib/utils"
import { Button, buttonVariants } from "@/registry/default/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"

export type OnboardingChecklistAction = {
  label: string
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  href?: string
  disabled?: boolean
}

export type OnboardingChecklistItem = {
  id: string
  title: string
  description?: React.ReactNode
  action?: OnboardingChecklistAction
  disabled?: boolean
}

export type { OnboardingChecklistProgress }

export interface OnboardingChecklistProps extends Omit<
  React.ComponentProps<typeof Card>,
  "title"
> {
  title?: React.ReactNode
  description?: React.ReactNode
  items: OnboardingChecklistItem[]
  completed?: string[]
  defaultCompleted?: string[]
  onCompletedChange?: (completed: string[]) => void
  onItemToggle?: (item: OnboardingChecklistItem, completed: boolean) => void
  collapsible?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  progressFormat?: (progress: OnboardingChecklistProgress) => React.ReactNode
}

function OnboardingChecklist({
  title = "Getting started",
  description,
  items = [],
  completed: completedProp,
  defaultCompleted = [],
  onCompletedChange,
  onItemToggle,
  collapsible = false,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  progressFormat,
  className,
  ...props
}: OnboardingChecklistProps) {
  const generatedId = React.useId()
  const contentId = `${generatedId}-content`

  const { value: completed, setValue: setCompleted } = useControllableState<
    string[]
  >({
    value: completedProp,
    defaultValue: defaultCompleted,
    onChange: onCompletedChange,
  })

  const { value: isOpen, setValue: setIsOpen } = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })

  const completedCount = getCompletedCount(items, completed)
  const progress = calculateProgress(items.length, completedCount)

  const handleToggle = (item: OnboardingChecklistItem) => {
    if (item.disabled) return
    const willComplete = !isItemCompleted(completed, item.id)
    const next = toggleItem(completed, item.id)
    setCompleted(next)
    onItemToggle?.(item, willComplete)
  }

  const isExpanded = !collapsible || isOpen

  return (
    <Card
      data-slot="onboarding-checklist"
      className={cn("w-full", className)}
      {...props}
    >
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {collapsible && (
            <CardAction>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-control-sm text-muted-foreground"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls={contentId}
                aria-label={isOpen ? "Collapse checklist" : "Expand checklist"}
              >
                <ChevronDownIcon
                  className={cn(
                    "size-4 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                />
              </Button>
            </CardAction>
          )}
        </div>

        <div className="col-span-full flex flex-col gap-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>
              {progressFormat ? progressFormat(progress) : progress.ratioText}
            </span>
          </div>
          <progress
            aria-label={`${typeof title === "string" ? title : "Onboarding"} progress`}
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.completedCount}
            aria-valuetext={progress.ratioText}
            value={progress.completedCount}
            max={progress.total || 1}
            className={cn(
              "h-2 w-full appearance-none overflow-hidden rounded-full bg-secondary transition-all",
              "[&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-secondary",
              "[&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-webkit-progress-value]:transition-all",
              "[&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-primary"
            )}
          />
        </div>
      </CardHeader>

      <CardContent id={contentId} hidden={!isExpanded}>
        <ul className="flex flex-col gap-2.5" role="list">
          {items.map((item) => {
            const isChecked = isItemCompleted(completed, item.id)
            const inputId = `${generatedId}-item-${item.id}`

            return (
              <li
                key={item.id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors",
                  isChecked
                    ? "border-muted bg-muted/40"
                    : "border-border bg-card",
                  item.disabled && "opacity-60"
                )}
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      id={inputId}
                      checked={isChecked}
                      disabled={item.disabled}
                      onChange={() => handleToggle(item)}
                      className={cn(
                        "size-4 shrink-0 cursor-pointer rounded border-input text-primary accent-primary",
                        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                        "disabled:cursor-not-allowed disabled:opacity-50"
                      )}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <label
                      htmlFor={inputId}
                      className={cn(
                        "cursor-pointer text-sm leading-tight font-medium select-none",
                        isChecked && "text-muted-foreground line-through",
                        item.disabled && "cursor-not-allowed"
                      )}
                    >
                      {item.title}
                    </label>
                    {item.description && (
                      <div
                        className={cn(
                          "text-xs leading-relaxed text-muted-foreground",
                          isChecked && "opacity-75"
                        )}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>

                {item.action && (
                  <div className="shrink-0">
                    {item.action.href ? (
                      <a
                        href={
                          item.action.disabled ? undefined : item.action.href
                        }
                        role={item.action.disabled ? "link" : undefined}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "h-control-sm text-xs",
                          item.action.disabled &&
                            "pointer-events-none opacity-50"
                        )}
                        aria-disabled={item.action.disabled}
                        tabIndex={item.action.disabled ? -1 : undefined}
                        onClick={
                          item.action.disabled
                            ? (e) => e.preventDefault()
                            : undefined
                        }
                      >
                        {item.action.label}
                      </a>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-control-sm text-xs"
                        disabled={item.action.disabled}
                        onClick={item.action.onClick}
                      >
                        {item.action.label}
                      </Button>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

export { OnboardingChecklist }
