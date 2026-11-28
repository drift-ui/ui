import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"

function increment(n: number) {
  return n + 1
}

describe("useControllableState", () => {
  it("applies two functional updates in the same tick when uncontrolled", () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useControllableState({ defaultValue: 0, onChange })
    )

    act(() => {
      result.current.setValue(increment)
      result.current.setValue(increment)
    })

    expect(result.current.value).toBe(2)
    expect(onChange.mock.calls).toEqual([[1], [2]])
  })

  it("passes each functional update the previous one's result when controlled", () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useControllableState({ value: 0, defaultValue: 0, onChange })
    )

    act(() => {
      result.current.setValue(increment)
      result.current.setValue(increment)
    })

    expect(onChange.mock.calls).toEqual([[1], [2]])
  })

  it("starts from the controlled value again after the tick when the parent ignores a change", async () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useControllableState({ value: 0, defaultValue: 0, onChange })
    )

    act(() => result.current.setValue(increment))
    await act(async () => {})
    act(() => result.current.setValue(increment))

    expect(onChange.mock.calls).toEqual([[1], [1]])
  })

  it("skips onChange when an update returns the same value", () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useControllableState({ defaultValue: 3, onChange })
    )

    act(() => result.current.setValue(3))
    act(() => result.current.setValue((n) => n))

    expect(onChange).not.toHaveBeenCalled()
  })

  it("accepts plain values", () => {
    const { result } = renderHook(() =>
      useControllableState({ defaultValue: "a" })
    )

    act(() => result.current.setValue("b"))

    expect(result.current.value).toBe("b")
  })
})
