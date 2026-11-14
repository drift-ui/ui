"use client"

import { Button } from "@/registry/base/ui/button"
import { toast } from "@/registry/base/ui/toast"
import { readableDuration, toastText } from "@/registry/default/lib/toast"

const MESSAGES = [
  { title: "Saved", description: "" },
  {
    title: "Could not publish the post",
    description:
      "The cover image is larger than 10 MB. Compress it or pick another image, then publish again. Your draft is safe.",
  },
]

export function ToastReadingTimePreview() {
  return (
    <ul className="flex w-full max-w-md flex-col gap-2 text-sm">
      {MESSAGES.map(({ title, description }) => {
        const seconds =
          readableDuration(toastText(title, description), 5000) / 1000

        return (
          <li
            key={title}
            className="flex items-center justify-between gap-3 rounded-box border px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{title}</p>
              <p className="text-muted-foreground">
                Stays {seconds.toFixed(1)}s
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.add({
                  type: description ? "error" : "success",
                  title,
                  description: description || undefined,
                })
              }
            >
              Show
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
