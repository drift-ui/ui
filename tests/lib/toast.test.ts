import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  countToast,
  createUndoTimer,
  forgetToast,
  readableDuration,
  toastText,
  trackPause,
} from "@/registry/default/lib/toast"

describe("readableDuration", () => {
  it("never drops below the minimum", () => {
    expect(readableDuration("Saved", 4000)).toBe(4000)
    expect(readableDuration("", 5000)).toBe(5000)
  })

  it("grows with the length of the text", () => {
    const short = readableDuration("x".repeat(60), 4000)
    const long = readableDuration("x".repeat(200), 4000)

    expect(short).toBeGreaterThan(4000)
    expect(long).toBeGreaterThan(short)
  })

  it("keeps an infinite minimum", () => {
    expect(readableDuration("Saved", Infinity)).toBe(Infinity)
  })
})

describe("toastText", () => {
  it("joins the plain text parts and skips nodes", () => {
    expect(toastText("Saved", undefined, { type: "span" }, 3)).toBe("Saved 3")
  })
})

describe("countToast", () => {
  it("counts repeats of a key until it is forgotten", () => {
    expect(countToast("copied")).toBe(1)
    expect(countToast("copied")).toBe(2)
    expect(countToast("copied")).toBe(3)

    forgetToast("copied")
    expect(countToast("copied")).toBe(1)
  })

  it("starts over when the same key changes kind", () => {
    expect(countToast("save", "loading")).toBe(1)
    expect(countToast("save", "success")).toBe(1)
    expect(countToast("save", "success")).toBe(2)
  })
})

describe("createUndoTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("commits once the duration passes", () => {
    const onCommit = vi.fn()
    createUndoTimer({ duration: 5000, onCommit })

    vi.advanceTimersByTime(4999)
    expect(onCommit).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onCommit).toHaveBeenCalledTimes(1)
  })

  it("never commits after undo", () => {
    const onCommit = vi.fn()
    const onUndo = vi.fn()
    const timer = createUndoTimer({ duration: 5000, onCommit, onUndo })

    timer.undo()
    timer.commit()
    vi.advanceTimersByTime(10_000)
    window.dispatchEvent(new Event("pagehide"))

    expect(onUndo).toHaveBeenCalledTimes(1)
    expect(onCommit).not.toHaveBeenCalled()
  })

  it("commits only once when closed early", () => {
    const onCommit = vi.fn()
    const timer = createUndoTimer({ duration: 5000, onCommit })

    timer.commit()
    timer.commit()
    vi.advanceTimersByTime(10_000)

    expect(onCommit).toHaveBeenCalledTimes(1)
  })

  it("commits on pagehide", () => {
    const onCommit = vi.fn()
    createUndoTimer({ duration: 5000, onCommit })

    window.dispatchEvent(new Event("pagehide"))

    expect(onCommit).toHaveBeenCalledTimes(1)
  })

  it("keeps the remaining time while paused", () => {
    const onCommit = vi.fn()
    const timer = createUndoTimer({ duration: 5000, onCommit })

    vi.advanceTimersByTime(2000)
    timer.pause()
    expect(timer.remaining()).toBe(3000)

    vi.advanceTimersByTime(10_000)
    expect(onCommit).not.toHaveBeenCalled()

    timer.resume()
    vi.advanceTimersByTime(2999)
    expect(onCommit).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onCommit).toHaveBeenCalledTimes(1)
  })
})

describe("trackPause", () => {
  it("pauses while the region is hovered or holds focus", () => {
    const region = document.createElement("div")
    const button = document.createElement("button")
    region.append(button)
    document.body.append(region)
    const onPausedChange = vi.fn()

    const stop = trackPause(region, onPausedChange)
    expect(onPausedChange).toHaveBeenLastCalledWith(false)

    region.dispatchEvent(new Event("pointerenter"))
    expect(onPausedChange).toHaveBeenLastCalledWith(true)
    region.dispatchEvent(new Event("pointerleave"))
    expect(onPausedChange).toHaveBeenLastCalledWith(false)

    button.focus()
    expect(onPausedChange).toHaveBeenLastCalledWith(true)
    button.blur()
    expect(onPausedChange).toHaveBeenLastCalledWith(false)

    stop()
    onPausedChange.mockClear()
    region.dispatchEvent(new Event("pointerenter"))
    expect(onPausedChange).not.toHaveBeenCalled()
    region.remove()
  })
})
