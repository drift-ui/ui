"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { useRender } from "@base-ui/react/use-render"
import { XIcon } from "lucide-react"

import { cn } from "@/registry/default/lib/utils"
import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import { Button } from "@/registry/base/ui/button"
import {
  TourSpotlight,
  findTourTarget,
  useScrollTargetIntoView,
} from "@/registry/default/ui/tour-spotlight"

type TourStep = {
  target: string
  title: string
  description?: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
}

function TourTarget({
  name,
  children,
  ...props
}: Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  name: string
  children: React.ReactElement
}) {
  return useRender({
    render: children,
    props: { "data-tour-target": name, ...props },
  })
}

function TourProgress({ count, current }: { count: number; current: number }) {
  return (
    <div aria-hidden className="flex items-center gap-1">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-1.5 rounded-full bg-muted-foreground/30 transition-all duration-300",
            index === current ? "w-4 bg-foreground" : "w-1.5"
          )}
        />
      ))}
    </div>
  )
}

function Tour({
  steps,
  open,
  defaultOpen = false,
  onOpenChange,
  step,
  defaultStep = 0,
  onStepChange,
  onComplete,
  children,
}: {
  steps: TourStep[]
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  step?: number
  defaultStep?: number
  onStepChange?: (step: number) => void
  onComplete?: () => void
  children?: React.ReactNode
}) {
  const titleId = React.useId()
  const nextButtonRef = React.useRef<HTMLButtonElement>(null)
  const { value: isOpen, setValue: setIsOpen } = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })
  const { value: stepIndex, setValue: setStepIndex } = useControllableState({
    value: step,
    defaultValue: defaultStep,
    onChange: onStepChange,
  })
  const currentStep = isOpen ? steps[stepIndex] : undefined
  const isLastStep = stepIndex === steps.length - 1
  const targetName = currentStep?.target ?? null
  useScrollTargetIntoView(targetName)

  const findAnchor = React.useCallback(
    () => (targetName ? findTourTarget(targetName) : null),
    [targetName]
  )

  function endTour() {
    setIsOpen(false)
    setStepIndex(0)
  }

  function goNext() {
    if (!isLastStep) return setStepIndex(stepIndex + 1)
    endTour()
    onComplete?.()
  }

  function goBack() {
    if (stepIndex > 0) setStepIndex(stepIndex - 1)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowRight":
        return goNext()
      case "ArrowLeft":
        return goBack()
    }
  }

  return (
    <>
      {children}
      {currentStep && (
        <PopoverPrimitive.Root
          open
          modal
          onOpenChange={(next, { reason }) => {
            if (!next && reason !== "outside-press") endTour()
          }}
        >
          <TourSpotlight target={currentStep.target} />
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Positioner
              anchor={findAnchor}
              side={currentStep.side ?? "bottom"}
              sideOffset={14}
              className="isolate z-50"
            >
              <PopoverPrimitive.Popup
                data-slot="tour-card"
                aria-labelledby={titleId}
                initialFocus={nextButtonRef}
                onKeyDown={handleKeyDown}
                className="z-50 flex w-80 origin-(--transform-origin) flex-col gap-3 rounded-box border bg-popover p-4 text-popover-foreground shadow-md outline-hidden data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {stepIndex + 1} of {steps.length}
                    </span>
                    <h2 id={titleId} className="leading-none font-medium">
                      {currentStep.title}
                    </h2>
                  </div>
                  <PopoverPrimitive.Close
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="End tour"
                        className="-mt-1 -mr-2 size-7"
                      />
                    }
                  >
                    <XIcon />
                  </PopoverPrimitive.Close>
                </div>
                {currentStep.description && (
                  <div className="text-sm text-muted-foreground">
                    {currentStep.description}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <TourProgress count={steps.length} current={stepIndex} />
                  <div className="flex gap-2">
                    {stepIndex > 0 && (
                      <Button variant="ghost" size="sm" onClick={goBack}>
                        Back
                      </Button>
                    )}
                    <Button ref={nextButtonRef} size="sm" onClick={goNext}>
                      {isLastStep ? "Finish" : "Next"}
                    </Button>
                  </div>
                </div>
              </PopoverPrimitive.Popup>
            </PopoverPrimitive.Positioner>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      )}
    </>
  )
}

export { Tour, TourTarget, type TourStep }
