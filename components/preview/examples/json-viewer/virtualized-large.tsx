import { JsonViewer } from "@/registry/default/ui/json-viewer"

const LARGE_DATASET = Array.from({ length: 1_000 }, (_, index) => ({
  id: `rec_${index + 1}`,
  code: 200 + (index % 5),
  status: index % 7 === 0 ? "error" : "success",
  durationMs: 12 + (index % 80),
  client: {
    ip: `192.168.1.${(index % 254) + 1}`,
    region: ["us-east", "eu-central", "ap-southeast"][index % 3],
  },
}))

export function JsonViewerVirtualizedLargePreview() {
  return (
    <JsonViewer
      virtual
      aria-label="Virtualized dataset"
      data={LARGE_DATASET}
      defaultExpandDepth={0}
      className="h-80 w-full max-w-lg"
    />
  )
}
