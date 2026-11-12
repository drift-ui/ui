"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import { toast } from "@/registry/default/ui/sonner"

export function ToastTypesPreview() {
  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-2">
      <Button
        variant="outline"
        onClick={() =>
          toast.success("Payment received", {
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
          toast.info("New version available", {
            description: "Reload to get dark mode and faster search.",
            action: { label: "Reload", onClick: () => {} },
          })
        }
      >
        <InfoIcon />
        Info
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.warning("Storage almost full", {
            description: "9.2 of 10 GB used. Uploads stop at 10 GB.",
            action: { label: "Upgrade", onClick: () => {} },
          })
        }
      >
        <TriangleAlertIcon />
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error("Card declined", {
            description: "Your bank declined the charge. Try another card.",
            action: { label: "Retry", onClick: () => {} },
          })
        }
      >
        <OctagonXIcon />
        Error
      </Button>
    </div>
  )
}
