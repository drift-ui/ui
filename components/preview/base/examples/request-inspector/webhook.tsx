import { RequestInspector } from "@/registry/base/ui/request-inspector"

export function RequestInspectorWebhookPreview() {
  return (
    <RequestInspector
      className="w-full max-w-xl"
      sensitiveHeaders={[
        "authorization",
        "cookie",
        "set-cookie",
        "x-api-key",
        "api-key",
        "x-hub-signature-256",
      ]}
      request={{
        method: "POST",
        url: "https://api.example.com/webhooks/stripe",
        headers: {
          "Content-Type": "application/json",
          "X-Hub-Signature-256": "sha256=d3b07384d113edec49eaa6238ad5ff00",
          "User-Agent": "Stripe/1.0 (+https://stripe.com/docs/webhooks)",
        },
        body: {
          id: "evt_3Mvw92LkdIwHu7ix0Sne85Y",
          object: "event",
          type: "payment_intent.succeeded",
          created: 1793356800,
          data: {
            object: {
              id: "pi_3Mvw92LkdIwHu7ix0",
              amount: 25000,
              currency: "usd",
              status: "succeeded",
            },
          },
        },
      }}
      response={{
        status: 200,
        statusText: "OK",
        headers: {
          "Content-Type": "text/plain",
        },
        body: "Webhook received",
        durationMs: 42,
      }}
    />
  )
}
