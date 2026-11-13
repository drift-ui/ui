import { CronInput } from "@/registry/default/ui/cron-input"
import { Label } from "@/registry/default/ui/label"

export function CronInputBasicPreview() {
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <Label htmlFor="basic-cron">Sync schedule</Label>
      <CronInput
        defaultValue="0 9 * * 1-5"
        inputProps={{ id: "basic-cron", "aria-label": "Sync schedule" }}
      />
    </div>
  )
}
