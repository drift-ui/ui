import { RequestInspector } from "@/registry/base/ui/request-inspector"

export function RequestInspectorPreview() {
  return (
    <RequestInspector
      className="w-full max-w-2xl"
      request={{
        method: "POST",
        url: "https://api.drift-ui.dev/v1/deployments?env=production",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer dft_test_example",
          "User-Agent": "drift-cli/1.4.0",
        },
        body: {
          project: "drift-dashboard",
          branch: "main",
          commit: "8f3e21a",
          autoRollback: true,
        },
      }}
      response={{
        status: 201,
        statusText: "Created",
        headers: {
          "Content-Type": "application/json",
          "X-Request-Id": "req_88f9120bc7",
          "Set-Cookie": "session=sess_9934acb; Path=/; Secure; HttpOnly",
        },
        body: {
          id: "dep_410294",
          status: "queued",
          targetUrl: "https://dash.drift-ui.dev",
          createdAt: "2026-11-23T12:00:00Z",
        },
        durationMs: 148,
      }}
    />
  )
}
