import { DateTimeRangeBoundsPreview } from "@/components/preview/examples/date-time-range/bounds"
import { DateTimeRangeClockChangePreview } from "@/components/preview/examples/date-time-range/clock-change"
import { DateTimeRangeControlledPreview } from "@/components/preview/examples/date-time-range/controlled"
import { DateTimeRangeLocalePreview } from "@/components/preview/examples/date-time-range/locale"
import { DateTimeRangePresetsPreview } from "@/components/preview/examples/date-time-range/presets"
import { DateTimeRangeSingleMonthPreview } from "@/components/preview/examples/date-time-range/single-month"
import { DateTimeRangeTypedPreview } from "@/components/preview/examples/date-time-range/typed"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "controlled",
    title: "Controlled",
    description:
      "value and onValueChange hold the range as two Date objects, with the chosen times applied.",
    Preview: DateTimeRangeControlledPreview,
  },
  {
    id: "presets",
    title: "Presets",
    description:
      "presets is a list of labels and ranges. They are built once in useState, so the pressed preset still matches after a re-render.",
    Preview: DateTimeRangePresetsPreview,
  },
  {
    id: "typed",
    title: "Typed ranges",
    description:
      'Type "last 24 hours", "yesterday to now" or "mon 9am to fri 5pm" in the popover. The parsed range shows as you type and Enter applies it. max is now, so a range in the future is cut off at the current time. Pass parse to read other phrasings or languages, for example with chrono-node.',
    Preview: DateTimeRangeTypedPreview,
  },
  {
    id: "bounds",
    title: "Min and max",
    description:
      "Bookings open on the first full hour more than two hours from now and close at 18:00 two weeks out. Days outside are disabled, and on the first and last day a time past the limit snaps back to it.",
    Preview: DateTimeRangeBoundsPreview,
  },
  {
    id: "clock-change",
    title: "Across a clock change",
    description:
      "This range crosses the March daylight saving change in the US and Europe. Where your zone shifts, the start and end show different offsets.",
    Preview: DateTimeRangeClockChangePreview,
  },
  {
    id: "single-month",
    title: "One month",
    description:
      "numberOfMonths={1} keeps the popover narrow for sidebars and small screens.",
    Preview: DateTimeRangeSingleMonthPreview,
  },
  {
    id: "locale",
    title: "Locale",
    description:
      "locale formats the trigger label and picks a 12 or 24 hour clock. German uses 24 hours.",
    Preview: DateTimeRangeLocalePreview,
  },
]
