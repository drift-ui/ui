import { SnoozePickerCustomPresetsPreview } from "@/components/preview/examples/snooze-picker/custom-presets"
import { SnoozePickerDefaultPreview } from "@/components/preview/examples/snooze-picker/default"
import { SnoozePickerNotificationPreview } from "@/components/preview/examples/snooze-picker/notification"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "default",
    title: "Quick presets",
    description:
      "Relative presets like Later today, Tomorrow, This weekend, and Next week automatically adjust to the current time.",
    Preview: SnoozePickerDefaultPreview,
  },
  {
    id: "custom-presets",
    title: "Custom presets and times",
    description:
      "Pass custom preset configs with dynamic resolver functions and configure default preset target times.",
    Preview: SnoozePickerCustomPresetsPreview,
  },
  {
    id: "notification",
    title: "Notification snooze button",
    description:
      "Use size='icon' and variant='ghost' to create compact snooze actions for notifications, tasks, or emails.",
    Preview: SnoozePickerNotificationPreview,
  },
]
