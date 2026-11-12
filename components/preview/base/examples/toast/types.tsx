"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { Button } from "@/registry/base/ui/button"
import { toast } from "@/registry/base/ui/toast"

export function ToastTypesPreview() {
  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-2">
      <Button
        variant="outline"
        onClick={() =>
          toast.add({
            type: "success",
            title: "Payment received",
            description: "$1,240.00 from Acme Corp for invoice 0412.",
          })
        }
      >
        <CircleCheckIcon />
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.add({
            type: "info",
            title: "New version available",
            description: "Reload to get dark mode and faster search.",
            actionProps: { children: "Reload" },
          })
        }
      >
        <InfoIcon />
        Info
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.add({
            type: "warning",
            title: "Storage almost full",
            description: "9.2 of 10 GB used. Uploads stop at 10 GB.",
            actionProps: { children: "Upgrade" },
          })
        }
      >
        <TriangleAlertIcon />
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.add({
            type: "error",
            title: "Card declined",
            description: "Your bank declined the charge. Try another card.",
            actionProps: { children: "Retry" },
          })
        }
      >
        <OctagonXIcon />
        Error
      </Button>
    </div>
  )
}
