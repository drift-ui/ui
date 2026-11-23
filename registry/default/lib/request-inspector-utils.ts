export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS"
  | (string & {})

export type RequestInspectorHeaders =
  Record<string, string | string[] | undefined> | [string, string][]

export type RequestInspectorRequest = {
  method: HttpMethod
  url: string
  headers?: RequestInspectorHeaders
  body?: unknown
}

export type RequestInspectorResponse = {
  status: number
  statusText?: string
  headers?: RequestInspectorHeaders
  body?: unknown
  durationMs?: number
}

export const DEFAULT_SENSITIVE_HEADERS = [
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "api-key",
  "proxy-authorization",
]

const STATUS_TEXT_MAP: Record<number, string> = {
  100: "Continue",
  101: "Switching Protocols",
  200: "OK",
  201: "Created",
  202: "Accepted",
  204: "No Content",
  301: "Moved Permanently",
  302: "Found",
  304: "Not Modified",
  307: "Temporary Redirect",
  308: "Permanent Redirect",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  413: "Payload Too Large",
  415: "Unsupported Media Type",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
}

export function quoteShell(arg: string): string {
  return `'${arg.replace(/'/g, "'\\''")}'`
}

export function isSensitiveHeader(
  name: string,
  sensitiveHeaders: string[] = DEFAULT_SENSITIVE_HEADERS
): boolean {
  const lower = name.toLowerCase()
  return sensitiveHeaders.some((header) => header.toLowerCase() === lower)
}

export function normalizeHeaders(
  headers?: RequestInspectorHeaders
): [string, string][] {
  if (!headers) return []
  if (Array.isArray(headers)) return headers

  const entries: [string, string][] = []
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      for (const item of value) {
        entries.push([key, item])
      }
    } else {
      entries.push([key, String(value)])
    }
  }
  return entries
}

export function parseQueryParams(url: string): [string, string][] {
  try {
    const parsed = new URL(url, "https://drift-ui.dev")
    const entries: [string, string][] = []
    parsed.searchParams.forEach((value, key) => {
      entries.push([key, value])
    })
    return entries
  } catch {
    return []
  }
}

export function parseBody(body: unknown): {
  isJson: boolean
  jsonValue?: unknown
  text: string
} {
  if (body === undefined || body === null) {
    return { isJson: false, text: "" }
  }

  if (typeof body === "object") {
    return {
      isJson: true,
      jsonValue: body,
      text: JSON.stringify(body, null, 2),
    }
  }

  if (typeof body === "string") {
    const trimmed = body.trim()
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        const parsed = JSON.parse(body)
        if (typeof parsed === "object" && parsed !== null) {
          return {
            isJson: true,
            jsonValue: parsed,
            text: body,
          }
        }
      } catch {
        // Not JSON
      }
    }
    return { isJson: false, text: body }
  }

  return { isJson: false, text: String(body) }
}

export function formatDuration(ms?: number): string {
  if (ms === undefined || ms === null || !Number.isFinite(ms) || ms < 0) {
    return "—"
  }
  if (ms === 0) {
    return "0 ms"
  }
  if (ms < 1) {
    return "< 1 ms"
  }
  if (ms < 1000) {
    const rounded = Number.isInteger(ms) ? ms : Number(ms.toFixed(1))
    return `${rounded} ms`
  }
  const sec = Number((ms / 1000).toFixed(2))
  return `${sec} s`
}

export function getStatusText(status: number): string {
  return STATUS_TEXT_MAP[status] ?? "Unknown"
}

export function getStatusBadgeClass(status: number): {
  className: string
  label: string
} {
  if (status >= 100 && status < 200) {
    return {
      className: "border-border bg-muted text-muted-foreground",
      label: "Informational",
    }
  }
  if (status >= 200 && status < 300) {
    return {
      className: "border-chart-2/30 bg-chart-2/15 text-chart-2",
      label: "Success",
    }
  }
  if (status >= 300 && status < 400) {
    return {
      className: "border-chart-4/30 bg-chart-4/15 text-chart-4",
      label: "Redirection",
    }
  }
  if (status >= 400 && status < 500) {
    return {
      className: "border-chart-5/30 bg-chart-5/15 text-chart-5",
      label: "Client error",
    }
  }
  if (status >= 500 && status < 600) {
    return {
      className: "border-destructive/30 bg-destructive/15 text-destructive",
      label: "Server error",
    }
  }
  return {
    className: "border-border bg-muted text-muted-foreground",
    label: "Unknown",
  }
}

export function buildCurlCommand(request: RequestInspectorRequest): string {
  const parts: string[] = ["curl"]
  const method = (request.method || "GET").toUpperCase()

  parts.push(quoteShell(request.url))

  const hasBody =
    request.body !== undefined && request.body !== null && request.body !== ""

  if (method !== "GET" || hasBody) {
    parts.push(`-X ${method}`)
  }

  const headers = normalizeHeaders(request.headers)
  for (const [key, value] of headers) {
    parts.push(`-H ${quoteShell(`${key}: ${value}`)}`)
  }

  if (hasBody) {
    let bodyString = ""
    if (typeof request.body === "string") {
      bodyString = request.body
    } else {
      bodyString = JSON.stringify(request.body, null, 2)
    }
    parts.push(`--data-raw ${quoteShell(bodyString)}`)
  }

  if (parts.length <= 2) {
    return parts.join(" ")
  }

  return parts[0] + " " + parts.slice(1).join(" \\\n  ")
}
