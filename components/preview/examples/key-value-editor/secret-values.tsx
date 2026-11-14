import { KeyValueEditor } from "@/registry/default/ui/key-value-editor"

export function KeyValueEditorSecretValuesPreview() {
  return (
    <KeyValueEditor
      aria-label="Secrets"
      secretValues
      valuePlaceholder="Paste the secret"
      defaultValue={[
        { id: "1", key: "STRIPE_SECRET_KEY", value: "" },
        { id: "2", key: "DATABASE_URL", value: "" },
      ]}
      className="w-full max-w-lg"
    />
  )
}
