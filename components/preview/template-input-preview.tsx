import { TemplateInput } from "@/registry/default/ui/template-input"

const VARIABLES = [
  { value: "first_name", label: "First name" },
  { value: "order_id", label: "Order number" },
  { value: "tracking_url", label: "Tracking link" },
  { value: "delivery_date", label: "Delivery date" },
]

export function TemplateInputPreview() {
  return (
    <TemplateInput
      aria-label="Message"
      variables={VARIABLES}
      defaultValue="Hi {{first_name}}, order {{order_id}} shipped and should arrive by {{delivery_date}}."
      className="max-w-md"
    />
  )
}
