"use client"

import * as React from "react"
import { UploadIcon } from "lucide-react"

import { Button } from "@/registry/base/ui/button"
import { toast } from "@/registry/base/ui/toast"

const FILES = [
  { name: "q3-roadmap.png", size: "1.2 MB" },
  { name: "brand-guidelines.pdf", size: "4.8 MB" },
  { name: "invoice-0412.pdf", size: "310 KB" },
]

export function ToastProgressPreview() {
  const timer = React.useRef<ReturnType<typeof setInterval>>(undefined)
  const [isUploading, setIsUploading] = React.useState(false)

  React.useEffect(() => () => clearInterval(timer.current), [])

  function upload() {
    const id = "upload"
    let value = 0
    setIsUploading(true)

    const cancel = () => {
      clearInterval(timer.current)
      setIsUploading(false)
      toast.add({ id, type: "info", title: "Upload cancelled" })
    }

    timer.current = setInterval(() => {
      value = Math.min(100, value + 7)
      const file = FILES[Math.min(FILES.length - 1, Math.floor(value / 34))]

      if (value < 100) {
        toast.progress({
          id,
          value,
          title: `Uploading ${FILES.length} files`,
          description: `${file.name} · ${file.size}`,
          actionProps: { children: "Cancel", onClick: cancel },
        })
        return
      }

      clearInterval(timer.current)
      setIsUploading(false)
      toast.add({
        id,
        type: "success",
        title: `Uploaded ${FILES.length} files`,
        description: "Saved to Marketing / Q3.",
        actionProps: { children: "View" },
      })
    }, 250)
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ul className="divide-y rounded-box border text-sm">
        {FILES.map((file) => (
          <li key={file.name} className="flex justify-between gap-3 px-3 py-2">
            <span>{file.name}</span>
            <span className="text-muted-foreground tabular-nums">
              {file.size}
            </span>
          </li>
        ))}
      </ul>
      <Button className="self-start" disabled={isUploading} onClick={upload}>
        <UploadIcon />
        Upload
      </Button>
    </div>
  )
}
