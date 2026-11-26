import { RequestInspector } from "@/registry/base/ui/request-inspector"

export function RequestInspectorErrorPreview() {
  return (
    <RequestInspector
      className="w-full max-w-xl"
      defaultTab="response"
      request={{
        method: "POST",
        url: "https://api.example.com/v1/subscriptions",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer sk_test_invalid_token",
        },
        body: {
          planId: "plan_enterprise",
          seats: -5,
        },
      }}
      response={{
        status: 422,
        statusText: "Unprocessable Entity",
        headers: {
          "Content-Type": "application/json",
          "X-Request-Id": "req_err_91823",
        },
        body: {
          error: "validation_failed",
          message: "The seat quantity must be a positive integer.",
          field: "seats",
          code: 422,
        },
        durationMs: 310,
      }}
    />
  )
}
