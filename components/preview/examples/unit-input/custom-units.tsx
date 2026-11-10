import { Label } from "@/registry/default/ui/label"
import { UnitInput } from "@/registry/default/ui/unit-input"

const BANDWIDTH_UNITS = [
  { id: "Kbps", label: "Kbps", factor: 1e3 },
  { id: "Mbps", label: "Mbps", factor: 1e6 },
  { id: "Gbps", label: "Gbps", factor: 1e9 },
]

export function UnitInputCustomUnitsPreview() {
  return (
    <div className="flex w-64 flex-col gap-2">
      <Label htmlFor="custom-bandwidth">Egress cap</Label>
      <UnitInput
        id="custom-bandwidth"
        units={BANDWIDTH_UNITS}
        defaultValue={250_000_000}
        min={1_000_000}
        max={10_000_000_000}
        step={10}
      />
      <p className="text-xs text-muted-foreground">
        Between 1 Mbps and 10 Gbps, stored in bits per second.
      </p>
    </div>
  )
}
