"use client"

import * as React from "react"
import { CheckIcon, RotateCcwIcon, SaveIcon } from "lucide-react"

import {
  PermissionMatrix,
  type PermissionGrants,
  type PermissionGroup,
  type PermissionRole,
} from "@/registry/default/ui/permission-matrix"
import { Button } from "@/registry/default/ui/button"

const ROLES: PermissionRole[] = [
  { id: "viewer", name: "Viewer" },
  { id: "editor", name: "Editor", inheritsFrom: "viewer" },
  { id: "admin", name: "Admin", inheritsFrom: "editor" },
]

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "content",
    name: "Content",
    permissions: [
      { id: "content.read", name: "Read Content" },
      { id: "content.write", name: "Write Content" },
      { id: "content.publish", name: "Publish Content" },
    ],
  },
  {
    id: "settings",
    name: "Settings",
    permissions: [
      { id: "settings.view", name: "View Settings" },
      { id: "settings.update", name: "Update Settings" },
    ],
  },
]

const INITIAL_GRANTS: PermissionGrants = {
  viewer: ["content.read", "settings.view"],
  editor: ["content.write"],
  admin: ["content.publish", "settings.update"],
}

export function PermissionMatrixControlledPreview() {
  const [grants, setGrants] = React.useState<PermissionGrants>(INITIAL_GRANTS)
  const [savedGrants, setSavedGrants] =
    React.useState<PermissionGrants>(INITIAL_GRANTS)
  const [savedNotice, setSavedNotice] = React.useState(false)
  const noticeTimeout = React.useRef<ReturnType<typeof setTimeout>>(undefined)

  React.useEffect(() => () => clearTimeout(noticeTimeout.current), [])

  const isDirty = Object.keys({ ...grants, ...savedGrants }).some((role) => {
    const current = new Set(grants[role] ?? [])
    const saved = new Set(savedGrants[role] ?? [])
    return (
      current.size !== saved.size || [...current].some((id) => !saved.has(id))
    )
  })

  function handleSave() {
    setSavedGrants(grants)
    setSavedNotice(true)
    clearTimeout(noticeTimeout.current)
    noticeTimeout.current = setTimeout(() => setSavedNotice(false), 2000)
  }

  function handleReset() {
    setGrants(savedGrants)
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {isDirty ? (
            <span className="font-medium text-amber-600 dark:text-amber-400">
              Unsaved policy changes
            </span>
          ) : savedNotice ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckIcon className="size-3.5" />
              Permissions saved
            </span>
          ) : (
            <span>All permissions synchronized</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 gap-1 text-xs"
            >
              <RotateCcwIcon className="size-3.5" />
              Discard
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            disabled={!isDirty}
            onClick={handleSave}
            className="h-8 gap-1 text-xs"
          >
            <SaveIcon className="size-3.5" />
            Save Changes
          </Button>
        </div>
      </div>

      <PermissionMatrix
        roles={ROLES}
        permissions={PERMISSION_GROUPS}
        value={grants}
        onValueChange={setGrants}
      />
    </div>
  )
}
