"use client"

import * as React from "react"

type StateUpdate<T> = T | ((previous: T) => T)

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T
  defaultValue: T
  onChange?: (value: T) => void
}) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : uncontrolledValue
  const pendingRef = React.useRef<{ value: T } | null>(null)

  const setValue = React.useCallback(
    (update: StateUpdate<T>) => {
      const previous = pendingRef.current
        ? pendingRef.current.value
        : currentValue
      const next =
        typeof update === "function"
          ? (update as (previous: T) => T)(previous)
          : update
      if (Object.is(next, previous)) return
      if (!pendingRef.current) {
        queueMicrotask(() => {
          pendingRef.current = null
        })
      }
      pendingRef.current = { value: next }
      if (!isControlled) setUncontrolledValue(next)
      onChange?.(next)
    },
    [currentValue, isControlled, onChange]
  )

  return { value: currentValue, setValue }
}
