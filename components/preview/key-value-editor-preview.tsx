import { KeyValueEditor } from "@/registry/default/ui/key-value-editor"

export function KeyValueEditorPreview() {
  return (
    <KeyValueEditor
      aria-label="Environment variables"
      defaultValue={[
        { id: "1", key: "API_URL", value: "https://api.example.com" },
        { id: "2", key: "LOG_LEVEL", value: "info" },
      ]}
      className="w-full max-w-lg"
    />
  )
}
