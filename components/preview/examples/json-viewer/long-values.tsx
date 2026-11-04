import { JsonViewer } from "@/registry/default/ui/json-viewer"

const LOG_ENTRY = {
  timestamp: "2026-11-04T12:30:45.120Z",
  level: "error",
  service: "payment-gateway",
  requestId: "req_99203a11b8",
  token:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  stackTrace:
    "Error: Connection reset by peer\n    at TCP.onStreamRead (node:internal/stream_base_commons:217:20)\n    at Socket.emit (node:events:517:28)\n    at emitErrorNT (node:internal/streams/destroy:151:8)\n    at processTicksAndRejections (node:internal/process/task_queues:82:21)",
  query:
    "SELECT users.id, users.email, orders.total\nFROM users\nLEFT JOIN orders ON orders.user_id = users.id\nWHERE orders.status = 'failed'\nORDER BY orders.created_at DESC\nLIMIT 50;",
}

export function JsonViewerLongValuesPreview() {
  return (
    <JsonViewer
      aria-label="Server error log"
      data={LOG_ENTRY}
      defaultExpandDepth={1}
      className="h-72 w-full max-w-lg"
    />
  )
}
