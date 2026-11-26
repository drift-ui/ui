"use client"

import * as React from "react"
import {
  CheckIcon,
  ClockIcon,
  CopyIcon,
  TerminalIcon,
  TextWrapIcon,
} from "lucide-react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import { useCopyToClipboard } from "@/registry/default/hooks/use-copy-to-clipboard"
import {
  buildCurlCommand,
  DEFAULT_SENSITIVE_HEADERS,
  formatDuration,
  getStatusBadgeClass,
  getStatusText,
  isSensitiveHeader,
  normalizeHeaders,
  parseBody,
  parseQueryParams,
  type HttpMethod,
  type RequestInspectorHeaders,
  type RequestInspectorRequest,
  type RequestInspectorResponse,
} from "@/registry/default/lib/request-inspector-utils"
import { cn } from "@/registry/default/lib/utils"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import { JsonViewer } from "@/registry/default/ui/json-viewer"
import { SecretField } from "@/registry/default/ui/secret-field"

export type {
  HttpMethod,
  RequestInspectorHeaders,
  RequestInspectorRequest,
  RequestInspectorResponse,
}

export interface RequestInspectorProps extends Omit<
  React.ComponentProps<"div">,
  "defaultValue"
> {
  request: RequestInspectorRequest
  response?: RequestInspectorResponse
  defaultTab?: "request" | "response" | "headers" | "timing"
  tab?: "request" | "response" | "headers" | "timing"
  onTabChange?: (tab: "request" | "response" | "headers" | "timing") => void
  sensitiveHeaders?: string[]
  hideCurl?: boolean
}

function HeaderList({
  title,
  headers,
  sensitiveHeaders,
  onCopy,
  copiedKey,
}: {
  title: string
  headers: [string, string][]
  sensitiveHeaders: string[]
  onCopy: (text: string, key: string) => void
  copiedKey: string | null
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">
          {title} ({headers.length})
        </span>
      </div>
      {headers.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
          No headers
        </div>
      ) : (
        <div className="flex flex-col divide-y rounded-md border bg-card">
          {headers.map(([name, value], index) => {
            const isSensitive = isSensitiveHeader(name, sensitiveHeaders)
            const itemKey = `${title}-${name}-${index}`
            const isCopied = copiedKey === itemKey

            return (
              <div
                key={itemKey}
                className="flex flex-col gap-1.5 p-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <span
                  className="font-mono text-xs font-semibold text-foreground sm:w-44 sm:shrink-0"
                  title={name}
                >
                  {name}
                </span>
                <div className="min-w-0 flex-1">
                  {isSensitive ? (
                    <SecretField
                      aria-label={`${name} header`}
                      value={value}
                      className="h-7 text-xs"
                    />
                  ) : (
                    <div className="group flex items-center justify-between gap-2 rounded border bg-muted/20 px-2 py-1 font-mono text-xs text-foreground">
                      <span className="min-w-0 truncate select-all">
                        {value}
                      </span>
                      <button
                        type="button"
                        aria-label={`Copy ${name} header value`}
                        onClick={() => onCopy(value, itemKey)}
                        className="inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-60 transition-opacity hover:bg-background hover:text-foreground hover:opacity-100 focus-visible:opacity-100"
                      >
                        {isCopied ? (
                          <CheckIcon className="size-3" />
                        ) : (
                          <CopyIcon className="size-3" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function RequestInspector({
  request,
  response,
  defaultTab = "request",
  tab: tabProp,
  onTabChange,
  sensitiveHeaders = DEFAULT_SENSITIVE_HEADERS,
  hideCurl = false,
  className,
  ...props
}: RequestInspectorProps) {
  const { value: activeTab, setValue: setActiveTab } =
    useControllableState<string>({
      value: tabProp,
      defaultValue: defaultTab,
      onChange: onTabChange as ((value: string) => void) | undefined,
    })

  const [wrapRequest, setWrapRequest] = React.useState(false)
  const [wrapResponse, setWrapResponse] = React.useState(false)

  const { copied, copy } = useCopyToClipboard()

  const queryParams = React.useMemo(
    () => parseQueryParams(request.url),
    [request.url]
  )
  const requestHeaders = React.useMemo(
    () => normalizeHeaders(request.headers),
    [request.headers]
  )
  const responseHeaders = React.useMemo(
    () => normalizeHeaders(response?.headers),
    [response?.headers]
  )

  const requestBodyParsed = React.useMemo(
    () => parseBody(request.body),
    [request.body]
  )
  const responseBodyParsed = React.useMemo(
    () => parseBody(response?.body),
    [response?.body]
  )

  const curlCommand = React.useMemo(() => buildCurlCommand(request), [request])

  const statusVariant = response
    ? getStatusBadgeClass(response.status)
    : { className: "", label: "" }
  const statusText = response
    ? response.statusText?.trim() || getStatusText(response.status)
    : ""

  const totalHeadersCount = requestHeaders.length + responseHeaders.length

  return (
    <div
      data-slot="request-inspector"
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    >
      {/* Header bar / overview */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-3 py-2.5 sm:px-4">
        <div className="flex min-w-[min(100%,24rem)] flex-1 items-center gap-2">
          <Badge
            variant="outline"
            className="shrink-0 font-mono text-xs font-semibold tracking-wider uppercase"
          >
            {request.method}
          </Badge>
          <span
            className="min-w-0 flex-1 truncate font-mono text-xs text-foreground select-all"
            title={request.url}
          >
            {request.url}
          </span>
          <button
            type="button"
            aria-label="Copy URL"
            onClick={() => copy(request.url, "url")}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {copied === "url" ? (
              <CheckIcon className="size-3.5" />
            ) : (
              <CopyIcon className="size-3.5" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {response && (
            <>
              <Badge
                className={cn(
                  "shrink-0 border font-mono text-xs font-medium",
                  statusVariant.className
                )}
              >
                {response.status} {statusText}
              </Badge>
              {response.durationMs !== undefined && (
                <span className="hidden items-center gap-1 font-mono text-xs text-muted-foreground sm:inline-flex">
                  <ClockIcon className="size-3" />
                  {formatDuration(response.durationMs)}
                </span>
              )}
            </>
          )}

          {!hideCurl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copy(curlCommand, "curl")}
              className="h-7 gap-1.5 px-2 text-xs"
              aria-label="Copy as cURL"
            >
              {copied === "curl" ? (
                <CheckIcon className="size-3.5" />
              ) : (
                <TerminalIcon className="size-3.5" />
              )}
              <span className="hidden sm:inline">
                {copied === "curl" ? "Copied" : "Copy as cURL"}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs navigation & panels */}
      <TabsPrimitive.Root
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col"
      >
        <TabsPrimitive.List
          aria-label="Request and response details"
          className="flex gap-1 overflow-x-auto border-b border-border bg-muted/20 px-3 pt-2"
        >
          <TabsPrimitive.Trigger
            value="request"
            className="inline-flex items-center gap-1.5 rounded-t-sm border-b-2 border-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:border-primary data-[state=active]:text-foreground"
          >
            <span>Request</span>
            {requestBodyParsed.text ? (
              <span className="py-0.2 rounded bg-muted px-1 text-[10px] text-muted-foreground">
                {requestBodyParsed.isJson ? "JSON" : "Body"}
              </span>
            ) : null}
          </TabsPrimitive.Trigger>

          <TabsPrimitive.Trigger
            value="response"
            className="inline-flex items-center gap-1.5 rounded-t-sm border-b-2 border-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:border-primary data-[state=active]:text-foreground"
          >
            <span>Response</span>
            {response ? (
              <span
                className={cn(
                  "py-0.2 rounded border px-1 font-mono text-[10px]",
                  statusVariant.className
                )}
              >
                {response.status}
              </span>
            ) : null}
          </TabsPrimitive.Trigger>

          <TabsPrimitive.Trigger
            value="headers"
            className="inline-flex items-center gap-1.5 rounded-t-sm border-b-2 border-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:border-primary data-[state=active]:text-foreground"
          >
            <span>Headers</span>
            {totalHeadersCount > 0 && (
              <span className="py-0.2 rounded bg-muted px-1.5 text-[10px] text-muted-foreground">
                {totalHeadersCount}
              </span>
            )}
          </TabsPrimitive.Trigger>

          <TabsPrimitive.Trigger
            value="timing"
            className="inline-flex items-center gap-1.5 rounded-t-sm border-b-2 border-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:border-primary data-[state=active]:text-foreground"
          >
            <span>Timing</span>
            {response?.durationMs !== undefined && (
              <span className="font-mono text-[10px] text-muted-foreground">
                {formatDuration(response.durationMs)}
              </span>
            )}
          </TabsPrimitive.Trigger>
        </TabsPrimitive.List>

        {/* Tab 1: Request */}
        <TabsPrimitive.Content
          value="request"
          className="flex flex-col gap-4 p-4 outline-none"
        >
          {queryParams.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Query Parameters ({queryParams.length})
              </span>
              <div className="flex flex-col divide-y rounded-md border bg-card">
                {queryParams.map(([key, val], index) => (
                  <div
                    key={`${key}-${index}`}
                    className="flex items-center justify-between px-3 py-1.5 font-mono text-xs"
                  >
                    <span className="font-medium text-foreground">{key}</span>
                    <span className="text-muted-foreground select-all">
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Request Body
              </span>
              {requestBodyParsed.text && (
                <div className="flex items-center gap-1">
                  {!requestBodyParsed.isJson && (
                    <Button
                      type="button"
                      size="sm"
                      variant={wrapRequest ? "secondary" : "ghost"}
                      aria-pressed={wrapRequest}
                      onClick={() => setWrapRequest(!wrapRequest)}
                      className="h-6 gap-1 px-2 text-xs"
                    >
                      <TextWrapIcon className="size-3" />
                      Wrap
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => copy(requestBodyParsed.text, "req-body")}
                    className="h-6 gap-1 px-2 text-xs"
                    aria-label="Copy request body"
                  >
                    {copied === "req-body" ? (
                      <CheckIcon className="size-3" />
                    ) : (
                      <CopyIcon className="size-3" />
                    )}
                    {copied === "req-body" ? "Copied" : "Copy"}
                  </Button>
                </div>
              )}
            </div>

            {!requestBodyParsed.text ? (
              <div className="rounded-md border border-dashed py-8 text-center text-xs text-muted-foreground">
                No request body
              </div>
            ) : requestBodyParsed.isJson ? (
              <JsonViewer
                data={requestBodyParsed.jsonValue}
                defaultExpandDepth={2}
                aria-label="Request JSON body"
                className="rounded-md border bg-muted/10 p-2"
              />
            ) : (
              <pre
                className={cn(
                  "max-h-80 overflow-auto rounded-md border bg-muted/20 p-3 font-mono text-xs",
                  wrapRequest
                    ? "break-all whitespace-pre-wrap"
                    : "whitespace-pre"
                )}
              >
                <code>{requestBodyParsed.text}</code>
              </pre>
            )}
          </div>
        </TabsPrimitive.Content>

        {/* Tab 2: Response */}
        <TabsPrimitive.Content
          value="response"
          className="flex flex-col gap-4 p-4 outline-none"
        >
          {!response ? (
            <div className="rounded-md border border-dashed py-10 text-center text-xs text-muted-foreground">
              No response recorded
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/20 p-3 text-xs">
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge
                    className={cn(
                      "border font-mono text-xs font-medium",
                      statusVariant.className
                    )}
                  >
                    {response.status} {statusText}
                  </Badge>
                </div>
                {response.durationMs !== undefined && (
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-semibold text-foreground">
                      {formatDuration(response.durationMs)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Response Body
                  </span>
                  {responseBodyParsed.text && (
                    <div className="flex items-center gap-1">
                      {!responseBodyParsed.isJson && (
                        <Button
                          type="button"
                          size="sm"
                          variant={wrapResponse ? "secondary" : "ghost"}
                          aria-pressed={wrapResponse}
                          onClick={() => setWrapResponse(!wrapResponse)}
                          className="h-6 gap-1 px-2 text-xs"
                        >
                          <TextWrapIcon className="size-3" />
                          Wrap
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          copy(responseBodyParsed.text, "res-body")
                        }
                        className="h-6 gap-1 px-2 text-xs"
                        aria-label="Copy response body"
                      >
                        {copied === "res-body" ? (
                          <CheckIcon className="size-3" />
                        ) : (
                          <CopyIcon className="size-3" />
                        )}
                        {copied === "res-body" ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  )}
                </div>

                {!responseBodyParsed.text ? (
                  <div className="rounded-md border border-dashed py-8 text-center text-xs text-muted-foreground">
                    No response body
                  </div>
                ) : responseBodyParsed.isJson ? (
                  <JsonViewer
                    data={responseBodyParsed.jsonValue}
                    defaultExpandDepth={2}
                    aria-label="Response JSON body"
                    className="rounded-md border bg-muted/10 p-2"
                  />
                ) : (
                  <pre
                    className={cn(
                      "max-h-80 overflow-auto rounded-md border bg-muted/20 p-3 font-mono text-xs",
                      wrapResponse
                        ? "break-all whitespace-pre-wrap"
                        : "whitespace-pre"
                    )}
                  >
                    <code>{responseBodyParsed.text}</code>
                  </pre>
                )}
              </div>
            </>
          )}
        </TabsPrimitive.Content>

        {/* Tab 3: Headers */}
        <TabsPrimitive.Content
          value="headers"
          className="flex flex-col gap-6 p-4 outline-none"
        >
          <HeaderList
            title="Request Headers"
            headers={requestHeaders}
            sensitiveHeaders={sensitiveHeaders}
            onCopy={copy}
            copiedKey={copied}
          />
          <HeaderList
            title="Response Headers"
            headers={responseHeaders}
            sensitiveHeaders={sensitiveHeaders}
            onCopy={copy}
            copiedKey={copied}
          />
        </TabsPrimitive.Content>

        {/* Tab 4: Timing */}
        <TabsPrimitive.Content
          value="timing"
          className="flex flex-col gap-4 p-4 outline-none"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1 rounded-md border bg-card p-3">
              <span className="text-xs text-muted-foreground">Duration</span>
              <span className="font-mono text-base font-semibold text-foreground">
                {formatDuration(response?.durationMs)}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-md border bg-card p-3">
              <span className="text-xs text-muted-foreground">Status</span>
              <span className="font-mono text-base font-semibold text-foreground">
                {response ? `${response.status} ${statusText}` : "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-md border bg-card p-3">
              <span className="text-xs text-muted-foreground">Headers</span>
              <span className="font-mono text-base font-semibold text-foreground">
                {requestHeaders.length} req / {responseHeaders.length} res
              </span>
            </div>
          </div>

          {response?.durationMs !== undefined && (
            <div className="flex flex-col gap-1.5 rounded-md border bg-muted/10 p-3">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-muted-foreground">Roundtrip Latency</span>
                <span
                  className={cn(
                    "font-medium",
                    response.durationMs < 200
                      ? "text-chart-2"
                      : response.durationMs < 1000
                        ? "text-chart-4"
                        : "text-chart-5"
                  )}
                >
                  {response.durationMs < 200
                    ? "Fast"
                    : response.durationMs < 1000
                      ? "Normal"
                      : "Slow"}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    response.durationMs < 200
                      ? "bg-chart-2"
                      : response.durationMs < 1000
                        ? "bg-chart-4"
                        : "bg-chart-5"
                  )}
                  style={{
                    width: `${Math.min(100, Math.max(5, (response.durationMs / 1000) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}
        </TabsPrimitive.Content>
      </TabsPrimitive.Root>

      {/* Screen reader notification for copy actions */}
      <span role="status" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </div>
  )
}

export { RequestInspector }
