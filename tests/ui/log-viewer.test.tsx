import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { LogViewer, type LogLine } from "@/registry/default/ui/log-viewer"

const observers = new Map<Element, ResizeObserverCallback>()

class ResizeObserverMock {
  constructor(private callback: ResizeObserverCallback) {}
  observe(target: Element) {
    observers.set(target, this.callback)
  }
  unobserve() {}
  disconnect() {}
}

const TEST_LOGS: LogLine[] = [
  {
    id: "log-1",
    timestamp: 1714561200000,
    level: "info",
    message: "Server initialized on port 3000",
  },
  {
    id: "log-2",
    timestamp: 1714561201000,
    level: "warn",
    message: "\u001b[33mWarning:\u001b[0m High CPU usage detected",
  },
  {
    id: "log-3",
    timestamp: 1714561202000,
    level: "error",
    message: "\u001b[31mError:\u001b[0m Database connection timeout",
  },
  {
    id: "log-4",
    timestamp: 1714561203000,
    level: "debug",
    message: "\u001b[1;36mDebug:\u001b[0m Packet payload 0x8F",
  },
]

describe("LogViewer", () => {
  beforeEach(() => {
    observers.clear()
    vi.stubGlobal("ResizeObserver", ResizeObserverMock)
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(400)
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(1000)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("renders with correct ARIA roles and log lines", () => {
    render(<LogViewer lines={TEST_LOGS} />)

    expect(
      screen.getByRole("region", { name: "Log viewer" })
    ).toBeInTheDocument()
    const logRegion = screen.getByRole("log", { name: "Log lines" })
    expect(logRegion).toHaveAttribute("aria-live", "polite")
    expect(logRegion).toHaveAttribute("aria-atomic", "false")

    expect(
      screen.getByText("Server initialized on port 3000")
    ).toBeInTheDocument()
    expect(screen.getByText("Warning:")).toBeInTheDocument()
    expect(screen.getByText("Database connection timeout")).toBeInTheDocument()
  })

  it("renders line numbers, timestamps, and level badges", () => {
    render(<LogViewer lines={TEST_LOGS} showLineNumbers showTimestamps />)

    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()

    expect(screen.getByText("INFO")).toBeInTheDocument()
    expect(screen.getByText("WARN")).toBeInTheDocument()
    expect(screen.getByText("ERROR")).toBeInTheDocument()
    expect(screen.getByText("DEBUG")).toBeInTheDocument()
  })

  it("can hide line numbers and timestamps when configured", () => {
    render(
      <LogViewer
        lines={TEST_LOGS}
        showLineNumbers={false}
        showTimestamps={false}
      />
    )

    expect(screen.queryByText("1")).not.toBeInTheDocument()
    expect(
      screen.getByText("Server initialized on port 3000")
    ).toBeInTheDocument()
  })

  it("parses ANSI color codes and styles safely into spans", () => {
    render(<LogViewer lines={TEST_LOGS} />)

    const warnSpan = screen.getByText("Warning:")
    expect(warnSpan.tagName).toBe("SPAN")
    expect(warnSpan.className).toContain("text-amber-600")

    const errorSpan = screen.getByText("Error:")
    expect(errorSpan.tagName).toBe("SPAN")
    expect(errorSpan.className).toContain("text-red-600")

    const debugSpan = screen.getByText("Debug:")
    expect(debugSpan.tagName).toBe("SPAN")
    expect(debugSpan.className).toContain("font-bold")
    expect(debugSpan.className).toContain("text-cyan-600")
  })

  it("filters logs by search query and clears search", async () => {
    const user = userEvent.setup()
    render(<LogViewer lines={TEST_LOGS} />)

    const searchInput = screen.getByRole("textbox", { name: "Search logs" })
    await user.type(searchInput, "Database")

    expect(screen.getByText("Database connection timeout")).toBeInTheDocument()
    expect(
      screen.queryByText("Server initialized on port 3000")
    ).not.toBeInTheDocument()
    expect(screen.getByText("1 of 4 lines")).toBeInTheDocument()

    const clearButton = screen.getByRole("button", { name: "Clear search" })
    await user.click(clearButton)

    expect(screen.getByText("4 lines")).toBeInTheDocument()
    expect(
      screen.getByText("Server initialized on port 3000")
    ).toBeInTheDocument()
  })

  it("filters logs by severity level", async () => {
    const user = userEvent.setup()
    render(<LogViewer lines={TEST_LOGS} />)

    const errorButton = screen.getByRole("button", { name: "error" })
    await user.click(errorButton)

    expect(screen.getByText("Database connection timeout")).toBeInTheDocument()
    expect(
      screen.queryByText("Server initialized on port 3000")
    ).not.toBeInTheDocument()
    expect(screen.getByText("1 of 4 lines")).toBeInTheDocument()

    const allButton = screen.getByRole("button", { name: "All" })
    await user.click(allButton)

    expect(screen.getByText("4 lines")).toBeInTheDocument()
    expect(
      screen.getByText("Server initialized on port 3000")
    ).toBeInTheDocument()
  })

  it("shows empty message when no lines match criteria", async () => {
    const user = userEvent.setup()
    render(
      <LogViewer lines={TEST_LOGS} emptyMessage="Custom empty search result" />
    )

    const searchInput = screen.getByRole("textbox", { name: "Search logs" })
    await user.type(searchInput, "nonexistent pattern xyz")

    expect(screen.getByText("Custom empty search result")).toBeInTheDocument()
  })

  it("toggles auto-scroll follow mode", async () => {
    const user = userEvent.setup()
    const onFollowChange = vi.fn()
    render(
      <LogViewer
        lines={TEST_LOGS}
        defaultFollow={true}
        onFollowChange={onFollowChange}
      />
    )

    const followButton = screen.getByRole("button", {
      name: "Pause auto-scroll",
    })
    await user.click(followButton)

    expect(onFollowChange).toHaveBeenCalledWith(false)
  })

  it("shows jump to latest button when follow is paused and restores follow on click", async () => {
    const user = userEvent.setup()
    render(<LogViewer lines={TEST_LOGS} follow={false} />)

    const jumpButton = screen.getByRole("button", { name: "Jump to latest" })
    expect(jumpButton).toBeInTheDocument()

    await user.click(jumpButton)
  })

  it("pauses follow when user scrolls away from bottom", () => {
    const onFollowChange = vi.fn()
    render(
      <LogViewer
        lines={TEST_LOGS}
        defaultFollow={true}
        onFollowChange={onFollowChange}
      />
    )

    const list = screen.getByRole("log")
    fireEvent.scroll(list, {
      target: {
        scrollTop: 100,
      },
    })

    expect(onFollowChange).toHaveBeenCalledWith(false)
  })

  it("supports controlled search and level", async () => {
    const user = userEvent.setup()
    const onSearchChange = vi.fn()
    const onLevelChange = vi.fn()

    render(
      <LogViewer
        lines={TEST_LOGS}
        search="initial"
        onSearchChange={onSearchChange}
        level="error"
        onLevelChange={onLevelChange}
      />
    )

    const searchInput = screen.getByRole("textbox", { name: "Search logs" })
    expect(searchInput).toHaveValue("initial")

    await user.type(searchInput, "x")
    expect(onSearchChange).toHaveBeenCalled()

    const warnButton = screen.getByRole("button", { name: "warn" })
    await user.click(warnButton)
    expect(onLevelChange).toHaveBeenCalledWith("warn")
  })
})
