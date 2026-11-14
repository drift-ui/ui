import { DiffViewer } from "@/registry/default/ui/diff-viewer"

const BEFORE = Array.from(
  { length: 10_000 },
  (_, index) => `const row${index} = load(${index})`
)
const AFTER = BEFORE.map((line, index) =>
  index % 10 === 0 ? `${line} // cached` : line
)

export function DiffViewerLargeDiffPreview() {
  return (
    <DiffViewer
      aria-label="Changes to rows.ts"
      oldValue={BEFORE.join("\n")}
      newValue={AFTER.join("\n")}
      mode="unified"
      contextLines={10}
      className="w-full max-w-2xl"
    />
  )
}
