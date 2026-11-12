"use client"

import { CopyIcon, RefreshCwIcon } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import { Input } from "@/registry/default/ui/input"
import { toast } from "@/registry/default/ui/sonner"

const INVITE_LINK = "https://acme.app/join/7f3k-q2pd"

export function ToastMergePreview() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3 rounded-box border p-4 text-sm">
      <div className="flex flex-col gap-1">
        <p className="font-medium">Invite your team</p>
        <p className="text-muted-foreground">
          Click either button a few times. Each repeat bumps the count and
          restarts the timer instead of stacking another toast.
        </p>
      </div>
      <div className="flex gap-2">
        <Input readOnly aria-label="Invite link" value={INVITE_LINK} />
        <Button
          variant="outline"
          onClick={() =>
            toast.success("Invite link copied", {
              id: "invite-link",
              description: "Anyone with the link can join as a viewer.",
            })
          }
        >
          <CopyIcon />
          Copy
        </Button>
      </div>
      <Button
        variant="ghost"
        className="self-start"
        onClick={() =>
          toast.info("You're up to date", {
            id: "update-check",
            description: "drift-ui 2.4.0 is the latest version.",
          })
        }
      >
        <RefreshCwIcon />
        Check for updates
      </Button>
    </div>
  )
}
