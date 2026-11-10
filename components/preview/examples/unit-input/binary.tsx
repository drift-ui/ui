import { BINARY_BYTE_UNITS } from "@/registry/default/lib/unit-input-utils"
import { Label } from "@/registry/default/ui/label"
import { UnitInput } from "@/registry/default/ui/unit-input"

export function UnitInputBinaryPreview() {
  return (
    <div className="flex w-64 flex-col gap-2">
      <Label htmlFor="binary-quota">Storage quota</Label>
      <UnitInput
        id="binary-quota"
        units={BINARY_BYTE_UNITS}
        defaultValue={2 * 1024 ** 3}
        defaultUnit="GiB"
      />
      <p className="text-xs text-muted-foreground">
        Binary scaling by 1024, so 2 GiB is 2,147,483,648 bytes.
      </p>
    </div>
  )
}
