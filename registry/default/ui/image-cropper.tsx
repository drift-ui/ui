"use client"

import * as React from "react"
import {
  CheckIcon,
  ImageOffIcon,
  RotateCcwIcon,
  RotateCwIcon,
  Undo2Icon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  canvasToBlob,
  clampCrop,
  computeCropSize,
  computeInitialRenderSize,
  computePixelCrop,
  drawCroppedImageToCanvas,
  type CropShape,
  type PixelCrop,
  type Point,
  type Size,
} from "@/registry/default/lib/image-cropper-utils"
import { cn } from "@/registry/default/lib/utils"
import { Button } from "@/registry/default/ui/button"

interface ImageCropperProps extends Omit<
  React.ComponentProps<"div">,
  "onChange"
> {
  src: string | File | Blob
  aspect?: number | null
  cropShape?: CropShape
  zoom?: number
  defaultZoom?: number
  onZoomChange?: (zoom: number) => void
  minZoom?: number
  maxZoom?: number
  rotation?: number
  defaultRotation?: number
  onRotationChange?: (rotation: number) => void
  crop?: Point
  defaultCrop?: Point
  onCropChange?: (crop: Point) => void
  onCropComplete?: (blob: Blob, pixelCrop: PixelCrop) => void
  onCropError?: (error: Error) => void
  outputType?: "image/png" | "image/jpeg" | "image/webp"
  outputQuality?: number
  showControls?: boolean
  showGrid?: boolean
  disabled?: boolean
}

function ImageCropper({
  src,
  aspect = 1,
  cropShape = "rect",
  zoom: controlledZoom,
  defaultZoom = 1,
  onZoomChange,
  minZoom = 1,
  maxZoom = 3,
  rotation: controlledRotation,
  defaultRotation = 0,
  onRotationChange,
  crop: controlledCrop,
  defaultCrop = { x: 0, y: 0 },
  onCropChange,
  onCropComplete,
  onCropError,
  outputType = "image/png",
  outputQuality = 0.92,
  showControls = true,
  showGrid = true,
  disabled = false,
  className,
  "aria-label": ariaLabel = "Image cropper",
  ...props
}: ImageCropperProps) {
  const { value: zoom, setValue: setZoom } = useControllableState({
    value: controlledZoom,
    defaultValue: defaultZoom,
    onChange: onZoomChange,
  })

  const { value: rotation, setValue: setRotation } = useControllableState({
    value: controlledRotation,
    defaultValue: defaultRotation,
    onChange: onRotationChange,
  })

  const { value: requestedCrop, setValue: setCrop } = useControllableState({
    value: controlledCrop,
    defaultValue: defaultCrop,
    onChange: onCropChange,
  })

  const containerRef = React.useRef<HTMLDivElement>(null)
  const imageRef = React.useRef<HTMLImageElement>(null)
  const instructionsId = React.useId()

  const [containerSize, setContainerSize] = React.useState<Size>({
    width: 320,
    height: 320,
  })
  const [naturalSize, setNaturalSize] = React.useState<Size>({
    width: 0,
    height: 0,
  })
  const [isDragging, setIsDragging] = React.useState(false)
  const [statusAnnouncement, setStatusAnnouncement] = React.useState("")
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null)
  const [settledImage, setSettledImage] = React.useState<{
    src: string
    status: "loaded" | "error"
  } | null>(null)

  const activePointers = React.useRef<Map<number, Point>>(new Map())
  const pinchStart = React.useRef<{ distance: number; zoom: number } | null>(
    null
  )
  const dragStart = React.useRef<{ pointer: Point; crop: Point }>({
    pointer: { x: 0, y: 0 },
    crop: { x: 0, y: 0 },
  })

  React.useEffect(() => {
    if (
      typeof window !== "undefined" &&
      typeof src !== "string" &&
      src instanceof Blob
    ) {
      const url = URL.createObjectURL(src)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setObjectUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      }
    }
    setObjectUrl(null)
  }, [src])

  const imageSrc = typeof src === "string" ? src : (objectUrl ?? "")
  const imageStatus =
    settledImage?.src === imageSrc ? settledImage.status : "loading"

  React.useEffect(
    function replayImageEventMissedBeforeHydration() {
      const img = imageRef.current
      if (!img?.complete) return
      img.dispatchEvent(new Event(img.naturalWidth > 0 ? "load" : "error"))
    },
    [imageSrc]
  )

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateSize = () => {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setContainerSize({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        })
      }
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const cropSize = React.useMemo(() => {
    return computeCropSize(containerSize.width, containerSize.height, aspect)
  }, [containerSize.width, containerSize.height, aspect])

  const imageRenderSize = React.useMemo(() => {
    return computeInitialRenderSize(naturalSize, cropSize, rotation)
  }, [naturalSize, cropSize, rotation])

  const crop = clampCrop(
    requestedCrop,
    imageRenderSize,
    cropSize,
    zoom,
    rotation
  )

  const updateZoom = React.useCallback(
    (targetZoom: number) => {
      const clampedZoom = Math.min(maxZoom, Math.max(minZoom, targetZoom))
      const roundedZoom = Number(clampedZoom.toFixed(3))
      const zoomRatio = roundedZoom / zoom
      setZoom(roundedZoom)
      const nextCrop = clampCrop(
        { x: crop.x * zoomRatio, y: crop.y * zoomRatio },
        imageRenderSize,
        cropSize,
        roundedZoom,
        rotation
      )
      setCrop(nextCrop)
      setStatusAnnouncement(`Zoom ${Math.round(roundedZoom * 100)}%`)
    },
    [
      maxZoom,
      minZoom,
      zoom,
      crop,
      imageRenderSize,
      cropSize,
      rotation,
      setZoom,
      setCrop,
    ]
  )

  const commitCrop = React.useCallback(async () => {
    if (imageStatus !== "loaded" || !imageRef.current) return

    const pixelCrop = computePixelCrop(
      crop,
      imageRenderSize,
      cropSize,
      naturalSize,
      zoom,
      rotation
    )

    try {
      const canvas = drawCroppedImageToCanvas(
        imageRef.current,
        naturalSize,
        pixelCrop,
        rotation
      )
      const blob = await canvasToBlob(canvas, outputType, outputQuality)
      onCropComplete?.(blob, pixelCrop)
      setStatusAnnouncement("Crop applied")
    } catch (err) {
      onCropError?.(err instanceof Error ? err : new Error(String(err)))
    }
  }, [
    imageStatus,
    crop,
    imageRenderSize,
    cropSize,
    naturalSize,
    zoom,
    rotation,
    outputType,
    outputQuality,
    onCropComplete,
    onCropError,
  ])

  function handleImageLoad(event: React.SyntheticEvent<HTMLImageElement>) {
    const img = event.currentTarget
    setNaturalSize({
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
    })
    setSettledImage({ src: imageSrc, status: "loaded" })
  }

  function handleImageError() {
    setSettledImage({ src: imageSrc, status: "error" })
    setStatusAnnouncement("Image failed to load")
    onCropError?.(new Error("Failed to load image source"))
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    activePointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })

    if (activePointers.current.size === 1) {
      setIsDragging(true)
      dragStart.current = {
        pointer: { x: event.clientX, y: event.clientY },
        crop: { ...crop },
      }
    } else if (activePointers.current.size === 2) {
      const pts = Array.from(activePointers.current.values())
      const distance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      pinchStart.current = { distance, zoom }
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled || !activePointers.current.has(event.pointerId)) return
    activePointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })

    if (activePointers.current.size === 2 && pinchStart.current) {
      const pts = Array.from(activePointers.current.values())
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      if (pinchStart.current.distance > 0) {
        const factor = currentDist / pinchStart.current.distance
        updateZoom(pinchStart.current.zoom * factor)
      }
      return
    }

    if (isDragging && activePointers.current.size === 1) {
      const dx = event.clientX - dragStart.current.pointer.x
      const dy = event.clientY - dragStart.current.pointer.y

      const nextCrop = clampCrop(
        {
          x: dragStart.current.crop.x + dx,
          y: dragStart.current.crop.y + dy,
        },
        imageRenderSize,
        cropSize,
        zoom,
        rotation
      )

      setCrop(nextCrop)
    }
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    activePointers.current.delete(event.pointerId)
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {}

    if (activePointers.current.size === 0) {
      setIsDragging(false)
      pinchStart.current = null
    } else if (activePointers.current.size === 1) {
      pinchStart.current = null
      const remaining = Array.from(activePointers.current.values())[0]
      dragStart.current = {
        pointer: { x: remaining.x, y: remaining.y },
        crop: { ...crop },
      }
      setIsDragging(true)
    }
  }

  React.useEffect(() => {
    const el = containerRef.current
    if (!el || disabled) return

    const onWheel = (e: WheelEvent) => {
      const isPinch = e.ctrlKey
      const atZoomLimit = e.deltaY > 0 ? zoom <= minZoom : zoom >= maxZoom
      if (atZoomLimit && !isPinch) return

      e.preventDefault()
      const deltaPixels =
        e.deltaMode === WheelEvent.DOM_DELTA_LINE ? e.deltaY * 16 : e.deltaY
      updateZoom(zoom * Math.exp(-deltaPixels * (isPinch ? 0.01 : 0.002)))
    }

    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [disabled, zoom, minZoom, maxZoom, updateZoom])

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled || event.metaKey || event.ctrlKey || event.altKey) return

    const step = event.shiftKey ? 50 : 5
    let dx = 0
    let dy = 0

    if (event.key === "ArrowLeft") dx = -step
    else if (event.key === "ArrowRight") dx = step
    else if (event.key === "ArrowUp") dy = -step
    else if (event.key === "ArrowDown") dy = step
    else if (event.key === "+" || event.key === "=" || event.key === "]") {
      event.preventDefault()
      updateZoom(zoom + 0.1)
      return
    } else if (event.key === "-" || event.key === "_" || event.key === "[") {
      event.preventDefault()
      updateZoom(zoom - 0.1)
      return
    } else if (event.key === "r" || event.key === "R") {
      event.preventDefault()
      handleRotate(90)
      return
    } else if (event.key === "Enter") {
      event.preventDefault()
      commitCrop()
      return
    } else {
      return
    }

    event.preventDefault()
    const nextCrop = clampCrop(
      { x: crop.x + dx, y: crop.y + dy },
      imageRenderSize,
      cropSize,
      zoom,
      rotation
    )
    setCrop(nextCrop)
    setStatusAnnouncement(
      `Position ${Math.round(nextCrop.x)}, ${Math.round(nextCrop.y)}`
    )
  }

  function handleRotate(delta: number) {
    if (disabled) return
    const nextRotation = (((rotation + delta) % 360) + 360) % 360
    setRotation(nextRotation)
    const nextRenderSize = computeInitialRenderSize(
      naturalSize,
      cropSize,
      nextRotation
    )
    const nextCrop = clampCrop(
      crop,
      nextRenderSize,
      cropSize,
      zoom,
      nextRotation
    )
    setCrop(nextCrop)
    setStatusAnnouncement(`Rotated to ${nextRotation} degrees`)
  }

  function handleReset() {
    setZoom(defaultZoom)
    setRotation(defaultRotation)
    setCrop(defaultCrop)
    setStatusAnnouncement("Crop reset")
  }

  return (
    <div
      data-slot="image-cropper"
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card p-3 text-card-foreground shadow-xs",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      {...props}
    >
      <div id={instructionsId} className="sr-only">
        Use arrow keys to pan (hold Shift for 10x larger steps), plus and minus
        or bracket keys to zoom, R to rotate, and Enter to apply crop.
      </div>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {statusAnnouncement}
      </div>

      <div
        ref={containerRef}
        role="region"
        aria-label={ariaLabel}
        aria-describedby={instructionsId}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative flex h-72 w-full touch-none items-center justify-center overflow-hidden rounded-md bg-muted outline-none select-none sm:h-80",
          isDragging ? "cursor-grabbing" : "cursor-grab",
          imageStatus === "loading" && "motion-safe:animate-pulse",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        {imageSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Source preview"
            crossOrigin="anonymous"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              width: imageRenderSize.width || "auto",
              height: imageRenderSize.height || "auto",
              transform: `translate(${crop.x}px, ${crop.y}px) rotate(${rotation}deg) scale(${zoom})`,
              transformOrigin: "center center",
            }}
            className={cn(
              "pointer-events-none max-h-none max-w-none",
              !isDragging && "transition-transform duration-75 ease-out",
              imageStatus !== "loaded" && "invisible"
            )}
          />
        )}

        {imageStatus === "error" && (
          <div
            data-slot="crop-error"
            className="absolute flex flex-col items-center gap-2 text-sm text-muted-foreground"
          >
            <ImageOffIcon className="size-5" />
            Couldn&apos;t load this image
          </div>
        )}

        <div
          data-slot="crop-area"
          style={{
            width: cropSize.width,
            height: cropSize.height,
            boxShadow:
              "0 0 0 9999px color-mix(in oklab, var(--background) 70%, transparent)",
          }}
          className={cn(
            "pointer-events-none absolute border border-foreground/80 transition-all",
            cropShape === "round" ? "rounded-full" : "rounded-xs",
            imageStatus !== "loaded" && "invisible"
          )}
        >
          {showGrid && cropShape === "rect" && (
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-foreground/30" />
              <div className="border-r border-b border-foreground/30" />
              <div className="border-b border-foreground/30" />
              <div className="border-r border-b border-foreground/30" />
              <div className="border-r border-b border-foreground/30" />
              <div className="border-b border-foreground/30" />
              <div className="border-r border-b border-foreground/30" />
              <div className="border-r border-b border-foreground/30" />
              <div />
            </div>
          )}
        </div>
      </div>

      {showControls && (
        <div data-slot="crop-controls" className="flex flex-col gap-3 pt-1">
          <div className="flex items-center gap-2">
            <ZoomOutIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="range"
              aria-label="Zoom level"
              aria-valuemin={minZoom}
              aria-valuemax={maxZoom}
              aria-valuenow={zoom}
              aria-valuetext={`${Math.round(zoom * 100)}%`}
              min={minZoom}
              max={maxZoom}
              step={0.01}
              disabled={disabled}
              value={zoom}
              onChange={(e) => updateZoom(parseFloat(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
            />
            <ZoomInIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="w-10 shrink-0 text-right font-mono text-xs text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled}
              onClick={handleReset}
              aria-label="Reset crop"
              title="Reset crop"
            >
              <Undo2Icon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled}
              onClick={() => handleRotate(-90)}
              aria-label="Rotate counter-clockwise"
              title="Rotate counter-clockwise"
            >
              <RotateCcwIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled}
              onClick={() => handleRotate(90)}
              aria-label="Rotate clockwise"
              title="Rotate clockwise"
            >
              <RotateCwIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={disabled || imageStatus !== "loaded"}
              onClick={() => commitCrop()}
              className="ml-auto gap-1.5"
            >
              <CheckIcon className="h-4 w-4" />
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export {
  ImageCropper,
  type ImageCropperProps,
  type CropShape,
  type PixelCrop,
  type Point,
  type Size,
}
