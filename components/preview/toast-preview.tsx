"use client"

import * as React from "react"
import {
  FileImageIcon,
  FileTextIcon,
  FileVideoIcon,
  LinkIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import { Toaster, toast } from "@/registry/default/ui/sonner"

type ProjectFile = {
  name: string
  size: string
  edited: string
  kind: "image" | "doc" | "video"
}

const FILES: ProjectFile[] = [
  { name: "q3-roadmap.png", size: "1.2 MB", edited: "2h ago", kind: "image" },
  {
    name: "brand-guidelines.pdf",
    size: "4.8 MB",
    edited: "Yesterday",
    kind: "doc",
  },
  { name: "invoice-0412.pdf", size: "310 KB", edited: "Mon", kind: "doc" },
]

const UPLOAD: ProjectFile = {
  name: "launch-teaser.mp4",
  size: "18.4 MB",
  edited: "Just now",
  kind: "video",
}

const ICONS = {
  image: FileImageIcon,
  doc: FileTextIcon,
  video: FileVideoIcon,
}

function sync(attempt: number) {
  return new Promise<void>((resolve, reject) =>
    setTimeout(
      () =>
        attempt % 2 === 1
          ? reject(
              new Error(
                "The storage server did not answer within 30 seconds. Your files are safe on this device and will sync when the connection is back."
              )
            )
          : resolve(),
      1500
    )
  )
}

export function ToastPreview() {
  const [files, setFiles] = React.useState(FILES)
  const [status, setStatus] = React.useState("Synced 2 min ago")
  const [isUploading, setIsUploading] = React.useState(false)
  const attempts = React.useRef(0)
  const uploadTimer = React.useRef<ReturnType<typeof setInterval>>(undefined)

  React.useEffect(() => () => clearInterval(uploadTimer.current), [])

  function remove(file: ProjectFile) {
    setFiles((current) => current.filter((item) => item.name !== file.name))
    toast.undo("Moved to trash", {
      description: file.name,
      shortcut: "Mod+Z",
      onUndo: () =>
        setFiles((current) =>
          [...FILES, UPLOAD].filter(
            (item) =>
              item.name === file.name ||
              current.some((kept) => kept.name === item.name)
          )
        ),
      onCommit: () => setStatus(`Deleted ${file.name}`),
    })
  }

  function upload() {
    let value = 0
    setIsUploading(true)
    uploadTimer.current = setInterval(() => {
      value = Math.min(100, value + 9)
      if (value < 100) {
        toast.progress(`Uploading ${UPLOAD.name}`, {
          id: "upload",
          value,
          description: UPLOAD.size,
        })
        return
      }
      clearInterval(uploadTimer.current)
      setIsUploading(false)
      setFiles((current) => [...current, UPLOAD])
      toast.success(`Uploaded ${UPLOAD.name}`, {
        id: "upload",
        description: "Added to Marketing / Q3.",
      })
    }, 200)
  }

  function syncNow() {
    attempts.current += 1
    setStatus("Syncing")
    toast.promise(sync(attempts.current), {
      loading: "Syncing Marketing / Q3",
      success: () => {
        setStatus("Synced just now")
        return "All files are up to date"
      },
      error: (error: Error) => {
        setStatus("Sync failed")
        return { message: "Could not sync", description: error.message }
      },
    })
  }

  return (
    <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-card border bg-card text-sm shadow-card">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <p className="font-medium">Marketing / Q3</p>
          <p className="text-xs text-muted-foreground">Shared with 4 people</p>
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.success("Link copied", {
                id: "share-link",
                description: "Anyone in Acme with the link can view.",
              })
            }
          >
            <LinkIcon />
            Share
          </Button>
          <Button size="sm" disabled={isUploading} onClick={upload}>
            <UploadIcon />
            Upload
          </Button>
        </div>
      </div>
      <ul className="divide-y">
        {files.length === 0 ? (
          <li className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-muted-foreground">
              No files in this folder
            </span>
            <Button variant="ghost" size="sm" onClick={() => setFiles(FILES)}>
              <RotateCcwIcon />
              Restore samples
            </Button>
          </li>
        ) : (
          files.map((file) => {
            const Icon = ICONS[file.kind]

            return (
              <li key={file.name} className="flex items-center gap-3 px-4 py-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-box bg-muted text-muted-foreground">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.size} · {file.edited}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${file.name}`}
                  onClick={() => remove(file)}
                >
                  <Trash2Icon />
                </Button>
              </li>
            )
          })
        )}
      </ul>
      <div className="flex items-center justify-between gap-3 border-t bg-muted/40 px-4 py-2">
        <span className="text-xs text-muted-foreground">
          {files.length} files · {status}
        </span>
        <Button variant="ghost" size="sm" onClick={syncNow}>
          <RefreshCwIcon />
          Sync now
        </Button>
      </div>
      <Toaster />
    </div>
  )
}
