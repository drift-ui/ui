import { RequestInspector } from "@/registry/base/ui/request-inspector"

export function RequestInspectorBasicPreview() {
  return (
    <RequestInspector
      className="w-full max-w-xl"
      request={{
        method: "GET",
        url: "https://api.example.com/v1/users/usr_48102",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer sec_token_abcdef123456",
        },
      }}
      response={{
        status: 200,
        statusText: "OK",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "max-age=3600, private",
          "X-Request-Id": "req_f8204",
        },
        body: {
          id: "usr_48102",
          name: "Amara Vance",
          email: "amara@example.com",
          role: "team_admin",
          verified: true,
        },
        durationMs: 76,
      }}
    />
  )
}
