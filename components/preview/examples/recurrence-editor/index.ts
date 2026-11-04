import { RecurrenceEditorAwkwardPreview } from "@/components/preview/examples/recurrence-editor/awkward-recurrences"
import { RecurrenceEditorCalendarFixturesPreview } from "@/components/preview/examples/recurrence-editor/calendar-fixtures"
import { RecurrenceEditorControlledPreview } from "@/components/preview/examples/recurrence-editor/controlled"
import { RecurrenceEditorEndsAfterPreview } from "@/components/preview/examples/recurrence-editor/ends-after"
import { RecurrenceEditorExdatesPreview } from "@/components/preview/examples/recurrence-editor/exdates"
import { RecurrenceEditorMonthlyPreview } from "@/components/preview/examples/recurrence-editor/monthly"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "monthly",
    title: "Monthly by weekday",
    description:
      "An ordinal in BYDAY means the nth weekday, so 1MO is the first Monday of each month.",
    Preview: RecurrenceEditorMonthlyPreview,
  },
  {
    id: "ends-after",
    title: "Ends after a count",
    description:
      "COUNT stops the rule after that many occurrences, and the editor shows it as the end option.",
    Preview: RecurrenceEditorEndsAfterPreview,
  },
  {
    id: "calendar-fixtures",
    title: "Calendar exports and BYSETPOS",
    description:
      "Round-trips real-world exports from Google Calendar, Outlook, and Apple Calendar with BYSETPOS while preserving unhandled parts like WKST on serialization.",
    Preview: RecurrenceEditorCalendarFixturesPreview,
  },
  {
    id: "exdates",
    title: "Excluded dates",
    description:
      "Skip individual dates from a series using exdates without disrupting the rest of the schedule.",
    Preview: RecurrenceEditorExdatesPreview,
  },
  {
    id: "awkward-recurrences",
    title: "Awkward recurrences",
    description:
      "Handles edge cases like the 5th weekday of a month that only has 4, leap days, and daylight saving time changes.",
    Preview: RecurrenceEditorAwkwardPreview,
  },
  {
    id: "controlled",
    title: "Read the rule",
    description:
      "onValueChange gives you an RRULE string to store. parseRRule and describeRecurrence from the recurrence lib turn it back into a sentence anywhere else.",
    Preview: RecurrenceEditorControlledPreview,
  },
]
