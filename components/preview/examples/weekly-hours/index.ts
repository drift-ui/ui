import { WeeklyHoursShopHoursPreview } from "@/components/preview/examples/weekly-hours/shop-hours"
import { WeeklyHoursWorkweekPreview } from "@/components/preview/examples/weekly-hours/workweek"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "shop-hours",
    title: "Shop opening hours",
    description:
      "The week starts on Sunday, times use a 12-hour clock, ArrowUp and ArrowDown on the minutes step by 30, and days with no hours read Closed.",
    Preview: WeeklyHoursShopHoursPreview,
  },
  {
    id: "workweek",
    title: "Workweek, controlled",
    description:
      "weekdays limits the rows to Monday to Friday. The value is a flat list of { day, start, end } entries, shown under the editor as it changes.",
    Preview: WeeklyHoursWorkweekPreview,
  },
]
