import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  RequestInspector,
  type RequestInspectorRequest,
  type RequestInspectorResponse,
} from "@/registry/default/ui/request-inspector"
import { RequestInspector as BaseRequestInspector } from "@/registry/base/ui/request-inspector"

const SAMPLE_REQUEST: RequestInspectorRequest = {
  method: "POST",
  url: "https://api.example.com/v1/users?role=admin",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer secret-token-12345",
  },
  body: { name: "Jane Doe", email: "jane@example.com" },
}

const SAMPLE_RESPONSE: RequestInspectorResponse = {
  status: 201,
  statusText: "Created",
  headers: {
    "Content-Type": "application/json",
    "Set-Cookie": "session=xyz987654321",
    "X-Request-Id": "req_abc123",
  },
  body: { id: "usr_99", name: "Jane Doe", createdAt: "2026-11-23" },
  durationMs: 182,
}

describe.each([
  ["Radix", RequestInspector],
  ["Base UI", BaseRequestInspector],
])("RequestInspector (%s)", (_library, RequestInspector) => {
  it("renders request method, URL, status badge, and duration", () => {
    render(
      <RequestInspector request={SAMPLE_REQUEST} response={SAMPLE_RESPONSE} />
    )

    expect(screen.getAllByText("POST")[0]).toBeInTheDocument()
    expect(
      screen.getByText("https://api.example.com/v1/users?role=admin")
    ).toBeInTheDocument()
    expect(screen.getAllByText(/201 Created/)[0]).toBeInTheDocument()
    expect(screen.getAllByText("182 ms")[0]).toBeInTheDocument()
  })

  it("navigates across tabs (Request, Response, Headers, Timing)", async () => {
    const user = userEvent.setup()
    render(
      <RequestInspector request={SAMPLE_REQUEST} response={SAMPLE_RESPONSE} />
    )

    // Request tab is active by default
    expect(screen.getByText("Query Parameters (1)")).toBeInTheDocument()
    expect(screen.getByText("role")).toBeInTheDocument()
    expect(screen.getByText("admin")).toBeInTheDocument()
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument()

    // Switch to Response tab
    const responseTab = screen.getByRole("tab", { name: /Response/ })
    await user.click(responseTab)
    expect(screen.getByText(/usr_99/)).toBeInTheDocument()

    // Switch to Headers tab
    const headersTab = screen.getByRole("tab", { name: /Headers/ })
    await user.click(headersTab)
    expect(screen.getByText("Request Headers (2)")).toBeInTheDocument()
    expect(screen.getByText("Response Headers (3)")).toBeInTheDocument()

    // Switch to Timing tab
    const timingTab = screen.getByRole("tab", { name: /Timing/ })
    await user.click(timingTab)
    expect(screen.getByText("Roundtrip Latency")).toBeInTheDocument()
    expect(screen.getByText("Fast")).toBeInTheDocument()
  })

  it("supports keyboard tab navigation with arrow keys", async () => {
    const user = userEvent.setup()
    render(
      <RequestInspector request={SAMPLE_REQUEST} response={SAMPLE_RESPONSE} />
    )

    const requestTab = screen.getByRole("tab", { name: /Request/ })
    const responseTab = screen.getByRole("tab", { name: /Response/ })
    const headersTab = screen.getByRole("tab", { name: /Headers/ })

    requestTab.focus()
    expect(requestTab).toHaveFocus()

    // Navigate right
    await user.keyboard("{ArrowRight}")
    expect(responseTab).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(responseTab).toHaveAttribute("aria-selected", "true")

    await user.keyboard("{ArrowRight}")
    expect(headersTab).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(headersTab).toHaveAttribute("aria-selected", "true")

    // Navigate left
    await user.keyboard("{ArrowLeft}")
    expect(responseTab).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(responseTab).toHaveAttribute("aria-selected", "true")
  })

  it("masks sensitive headers by default and reveals them on click or enter", async () => {
    const user = userEvent.setup()
    render(
      <RequestInspector
        request={SAMPLE_REQUEST}
        response={SAMPLE_RESPONSE}
        defaultTab="headers"
      />
    )

    // Authorization is sensitive -> rendered with SecretField
    const authGroup = screen.getByRole("group", {
      name: "Authorization header",
    })
    expect(authGroup).toBeInTheDocument()
    expect(authGroup).not.toHaveTextContent("secret-token-12345")

    // Reveal Authorization via click
    const revealAuthBtn = authGroup.querySelector('button[aria-label="Reveal"]')
    expect(revealAuthBtn).not.toBeNull()
    await user.click(revealAuthBtn!)
    expect(authGroup).toHaveTextContent("Bearer secret-token-12345")

    // Non-sensitive header (X-Request-Id) is visible directly and copyable
    expect(screen.getByText("req_abc123")).toBeInTheDocument()
    const copyHeaderBtn = screen.getByRole("button", {
      name: "Copy X-Request-Id header value",
    })
    await user.click(copyHeaderBtn)
    expect(await navigator.clipboard.readText()).toBe("req_abc123")
  })

  it("respects custom sensitiveHeaders prop", () => {
    render(
      <RequestInspector
        request={SAMPLE_REQUEST}
        response={SAMPLE_RESPONSE}
        defaultTab="headers"
        sensitiveHeaders={["X-Request-Id"]}
      />
    )

    // X-Request-Id should now be masked
    expect(
      screen.getByRole("group", { name: "X-Request-Id header" })
    ).toBeInTheDocument()

    // Authorization should NOT be masked
    expect(
      screen.queryByRole("group", { name: "Authorization header" })
    ).not.toBeInTheDocument()
    expect(screen.getByText("Bearer secret-token-12345")).toBeInTheDocument()
  })

  it("copies URL and cURL command to clipboard", async () => {
    const user = userEvent.setup()
    render(
      <RequestInspector request={SAMPLE_REQUEST} response={SAMPLE_RESPONSE} />
    )

    // Copy URL button
    const copyUrlBtn = screen.getByRole("button", { name: "Copy URL" })
    await user.click(copyUrlBtn)
    expect(await navigator.clipboard.readText()).toBe(SAMPLE_REQUEST.url)

    // Copy cURL command button
    const curlBtn = screen.getByRole("button", { name: "Copy as cURL" })
    await user.click(curlBtn)

    const clipboardText = await navigator.clipboard.readText()
    expect(clipboardText).toContain(
      "curl 'https://api.example.com/v1/users?role=admin'"
    )
    expect(clipboardText).toContain("-X 'POST'")
    expect(clipboardText).toContain(
      "-H 'Authorization: Bearer secret-token-12345'"
    )
    expect(clipboardText).toContain("--data-raw")

    expect(screen.getByText("Copied to clipboard")).toBeInTheDocument()
  })

  it("hides cURL button when hideCurl is true", () => {
    render(
      <RequestInspector
        request={SAMPLE_REQUEST}
        response={SAMPLE_RESPONSE}
        hideCurl
      />
    )
    expect(
      screen.queryByRole("button", { name: "Copy as cURL" })
    ).not.toBeInTheDocument()
  })

  it("copies request body and response body to clipboard", async () => {
    const user = userEvent.setup()
    render(
      <RequestInspector request={SAMPLE_REQUEST} response={SAMPLE_RESPONSE} />
    )

    // Copy request body
    const copyReqBodyBtn = screen.getByRole("button", {
      name: "Copy request body",
    })
    await user.click(copyReqBodyBtn)
    const reqClipboard = await navigator.clipboard.readText()
    expect(reqClipboard).toContain("Jane Doe")

    // Switch to response tab and copy response body
    const resTab = screen.getByRole("tab", { name: /Response/ })
    await user.click(resTab)

    const copyResBodyBtn = screen.getByRole("button", {
      name: "Copy response body",
    })
    await user.click(copyResBodyBtn)
    const resClipboard = await navigator.clipboard.readText()
    expect(resClipboard).toContain("usr_99")
  })

  it("supports text body with wrap toggle via click and keyboard", async () => {
    const user = userEvent.setup()
    render(
      <RequestInspector
        request={{
          method: "POST",
          url: "https://api.example.com/webhook",
          body: "event=charge.succeeded&amount=4000&currency=usd",
        }}
        response={{
          status: 200,
          body: "Raw plain text webhook acknowledgment response",
        }}
      />
    )

    // Request body wrap toggle
    const wrapReqBtn = screen.getByRole("button", { name: /Wrap/ })
    expect(wrapReqBtn).toHaveAttribute("aria-pressed", "false")

    await user.click(wrapReqBtn)
    expect(wrapReqBtn).toHaveAttribute("aria-pressed", "true")

    // Keyboard activation of wrap toggle
    wrapReqBtn.focus()
    await user.keyboard("{Enter}")
    expect(wrapReqBtn).toHaveAttribute("aria-pressed", "false")

    // Switch to Response tab with raw text body
    const resTab = screen.getByRole("tab", { name: /Response/ })
    await user.click(resTab)

    const wrapResBtn = screen.getByRole("button", { name: /Wrap/ })
    expect(wrapResBtn).toHaveAttribute("aria-pressed", "false")
    await user.click(wrapResBtn)
    expect(wrapResBtn).toHaveAttribute("aria-pressed", "true")
  })

  it("handles missing body and response cleanly", async () => {
    const user = userEvent.setup()
    render(
      <RequestInspector
        request={{
          method: "GET",
          url: "https://api.example.com/ping",
        }}
        defaultTab="request"
      />
    )

    expect(screen.getByText("No request body")).toBeInTheDocument()

    // Switch to response tab
    const resTab = screen.getByRole("tab", { name: /Response/ })
    await user.click(resTab)
    expect(screen.getByText("No response recorded")).toBeInTheDocument()

    // Switch to headers tab without headers
    const headersTab = screen.getByRole("tab", { name: /Headers/ })
    await user.click(headersTab)
    expect(screen.getAllByText("No headers")[0]).toBeInTheDocument()

    // Switch to timing tab without response
    const timingTab = screen.getByRole("tab", { name: /Timing/ })
    await user.click(timingTab)
    expect(screen.getAllByText("—")[0]).toBeInTheDocument()
  })

  it("falls back to getStatusText when statusText is empty string", () => {
    render(
      <RequestInspector
        request={{ method: "GET", url: "https://api.example.com/health" }}
        response={{ status: 200, statusText: "" }}
      />
    )
    expect(screen.getAllByText(/200 OK/)[0]).toBeInTheDocument()
  })

  it("supports controlled tab state", async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()

    function ControlledInspector() {
      const [tab, setTab] = React.useState<
        "request" | "response" | "headers" | "timing"
      >("request")
      return (
        <RequestInspector
          request={SAMPLE_REQUEST}
          response={SAMPLE_RESPONSE}
          tab={tab}
          onTabChange={(next) => {
            setTab(next)
            onTabChange(next)
          }}
        />
      )
    }

    render(<ControlledInspector />)

    const timingTab = screen.getByRole("tab", { name: /Timing/ })
    await user.click(timingTab)

    expect(onTabChange).toHaveBeenCalledWith("timing")
    expect(screen.getByText("Roundtrip Latency")).toBeInTheDocument()
  })

  it("renders latency categories (Normal, Slow) in Timing tab", () => {
    const { rerender } = render(
      <RequestInspector
        request={SAMPLE_REQUEST}
        response={{ ...SAMPLE_RESPONSE, durationMs: 450 }}
        defaultTab="timing"
      />
    )
    expect(screen.getByText("Normal")).toBeInTheDocument()

    rerender(
      <RequestInspector
        request={SAMPLE_REQUEST}
        response={{ ...SAMPLE_RESPONSE, durationMs: 1500 }}
        defaultTab="timing"
      />
    )
    expect(screen.getByText("Slow")).toBeInTheDocument()
  })
})
