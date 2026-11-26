export interface RequestInspectorHeaders {
  [key: string]: string | string[] | undefined
}

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"
  | (string & {})

export interface RequestInspectorRequest {
  method: HttpMethod
  url: string
  headers?: RequestInspectorHeaders | [string, string][]
  body?: unknown
}

export interface RequestInspectorResponse {
  status: number
  statusText?: string
  headers?: RequestInspectorHeaders | [string, string][]
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
  "x-auth-token",
  "x-access-token",
]

const STATUS_TEXT_MAP: Record<number, string> = {
  100: "Continue",
  101: "Switching Protocols",
  102: "Processing",
  103: "Early Hints",
  200: "OK",
  201: "Created",
  202: "Accepted",
  203: "Non-Authoritative Information",
  204: "No Content",
  205: "Reset Content",
  206: "Partial Content",
  207: "Multi-Status",
  208: "Already Reported",
  226: "IM Used",
  300: "Multiple Choices",
  301: "Moved Permanently",
  302: "Found",
  303: "See Other",
  304: "Not Modified",
  305: "Use Proxy",
  307: "Temporary Redirect",
  308: "Permanent Redirect",
  400: "Bad Request",
  401: "Unauthorized",
  402: "Payment Required",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  407: "Proxy Authentication Required",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  411: "Length Required",
  412: "Precondition Failed",
  413: "Payload Too Large",
  414: "URI Too Long",
  415: "Unsupported Media Type",
  416: "Range Not Satisfiable",
  417: "Expectation Failed",
  418: "I'm a teapot",
  421: "Misdirected Request",
  422: "Unprocessable Entity",
  423: "Locked",
  424: "Failed Dependency",
  425: "Too Early",
  426: "Upgrade Required",
  428: "Precondition Required",
  429: "Too Many Requests",
  431: "Request Header Fields Too Large",
  451: "Unavailable For Legal Reasons",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
  505: "HTTP Version Not Supported",
  506: "Variant Also Negotiates",
  507: "Insufficient Storage",
  508: "Loop Detected",
  510: "Not Extended",
  511: "Network Authentication Required",
}

export function quoteShell(arg: string): string {
  return `'${arg.replace(/'/g, "'\\''")}'`
}

export function isSensitiveHeader(
  name: string,
  sensitiveHeaders: string[] = DEFAULT_SENSITIVE_HEADERS
): boolean {
  const lower = name.trim().toLowerCase()
  return sensitiveHeaders.some(
    (header) => header.trim().toLowerCase() === lower
  )
}

export function normalizeHeaders(
  headers?: RequestInspectorHeaders | [string, string][]
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
  if (!url) return []
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
    try {
      const jsonText = JSON.stringify(body, null, 2)
      return {
        isJson: true,
        jsonValue: body,
        text: jsonText,
      }
    } catch {
      return { isJson: false, text: String(body) }
    }
  }

  if (typeof body === "string") {
    const trimmed = body.trim()
    try {
      const parsed = JSON.parse(trimmed)
      if (typeof parsed === "object" && parsed !== null) {
        return {
          isJson: true,
          jsonValue: parsed,
          text: body,
        }
      }
    } catch {
      // not valid object/array JSON
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
  const roundedMs = Number.isInteger(ms) ? ms : Number(ms.toFixed(1))
  if (roundedMs < 1000) {
    return `${roundedMs} ms`
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

export function buildCurlCommand(
  request: RequestInspectorRequest,
  options?: {
    maskSensitive?: boolean
    sensitiveHeaders?: string[]
  }
): string {
  const parts: string[] = ["curl"]
  const rawMethod = request.method?.trim() || "GET"
  const upperMethod = rawMethod.toUpperCase()

  parts.push(quoteShell(request.url))

  const hasBody =
    request.body !== undefined && request.body !== null && request.body !== ""

  if (upperMethod === "HEAD") {
    parts.push("-I")
  } else if (upperMethod !== "GET" || hasBody) {
    parts.push(`-X ${quoteShell(rawMethod)}`)
  }

  const mask = options?.maskSensitive ?? false
  const sensitiveList = options?.sensitiveHeaders ?? DEFAULT_SENSITIVE_HEADERS
  const headers = normalizeHeaders(request.headers)
  for (const [key, value] of headers) {
    const val =
      mask && isSensitiveHeader(key, sensitiveList) ? "[REDACTED]" : value
    parts.push(`-H ${quoteShell(`${key}: ${val}`)}`)
  }

  if (hasBody) {
    let bodyString = ""
    if (typeof request.body === "string") {
      bodyString = request.body
    } else {
      try {
        bodyString = JSON.stringify(request.body, null, 2)
      } catch {
        bodyString = String(request.body)
      }
    }
    parts.push(`--data-raw ${quoteShell(bodyString)}`)
  }

  if (parts.length <= 2) {
    return parts.join(" ")
  }

  return parts[0] + " " + parts.slice(1).join(" \\\n  ")
}
