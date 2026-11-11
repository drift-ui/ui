export type Point = {
  x: number
  y: number
}

export type Size = {
  width: number
  height: number
}

export type PixelCrop = {
  x: number
  y: number
  width: number
  height: number
}

export type CropShape = "rect" | "round"

export function computeCropSize(
  containerWidth: number,
  containerHeight: number,
  aspect?: number | null
): Size {
  const paddingFactor = 0.85
  const maxWidth = Math.max(40, containerWidth * paddingFactor)
  const maxHeight = Math.max(40, containerHeight * paddingFactor)

  if (!aspect || aspect <= 0) {
    return {
      width: Math.round(maxWidth),
      height: Math.round(maxHeight),
    }
  }

  const containerAspect = maxWidth / maxHeight

  let width: number
  let height: number

  if (aspect >= containerAspect) {
    width = maxWidth
    height = width / aspect
    if (height > maxHeight) {
      height = maxHeight
      width = height * aspect
    }
  } else {
    height = maxHeight
    width = height * aspect
    if (width > maxWidth) {
      width = maxWidth
      height = width / aspect
    }
  }

  return {
    width: Math.max(20, Math.round(width)),
    height: Math.max(20, Math.round(height)),
  }
}

export function computeInitialRenderSize(
  naturalSize: Size,
  cropSize: Size,
  rotation: number = 0
): Size {
  if (naturalSize.width <= 0 || naturalSize.height <= 0) {
    return { width: cropSize.width, height: cropSize.height }
  }

  const rad = (rotation * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))

  const requiredWidth = cropSize.width * cos + cropSize.height * sin
  const requiredHeight = cropSize.height * cos + cropSize.width * sin

  const scale = Math.max(
    requiredWidth / naturalSize.width,
    requiredHeight / naturalSize.height
  )

  return {
    width: Math.max(1, Math.round(naturalSize.width * scale)),
    height: Math.max(1, Math.round(naturalSize.height * scale)),
  }
}

export function getRotatedSize(size: Size, rotation: number): Size {
  const rad = (rotation * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))

  return {
    width: size.width * cos + size.height * sin,
    height: size.width * sin + size.height * cos,
  }
}

export function getBoundaries(
  imageRenderSize: Size,
  cropSize: Size,
  zoom: number,
  rotation: number = 0
): { maxPanX: number; maxPanY: number } {
  const rotated = getRotatedSize(imageRenderSize, rotation)
  const scaledWidth = rotated.width * zoom
  const scaledHeight = rotated.height * zoom

  const maxPanX = Math.max(0, (scaledWidth - cropSize.width) / 2)
  const maxPanY = Math.max(0, (scaledHeight - cropSize.height) / 2)

  return { maxPanX, maxPanY }
}

export function clampCrop(
  crop: Point,
  imageRenderSize: Size,
  cropSize: Size,
  zoom: number,
  rotation: number = 0
): Point {
  const { maxPanX, maxPanY } = getBoundaries(
    imageRenderSize,
    cropSize,
    zoom,
    rotation
  )

  const x = Math.max(-maxPanX, Math.min(maxPanX, crop.x))
  const y = Math.max(-maxPanY, Math.min(maxPanY, crop.y))

  return {
    x: Object.is(x, -0) ? 0 : x,
    y: Object.is(y, -0) ? 0 : y,
  }
}

export function computePixelCrop(
  crop: Point,
  imageRenderSize: Size,
  cropSize: Size,
  naturalSize: Size,
  zoom: number,
  rotation: number = 0
): PixelCrop {
  const rotNatural = getRotatedSize(naturalSize, rotation)
  const rotRender = getRotatedSize(imageRenderSize, rotation)

  if (rotRender.width <= 0 || rotRender.height <= 0) {
    return { x: 0, y: 0, width: naturalSize.width, height: naturalSize.height }
  }

  const scaleX = rotNatural.width / rotRender.width
  const scaleY = rotNatural.height / rotRender.height

  const renderCropWidth = cropSize.width / zoom
  const renderCropHeight = cropSize.height / zoom

  const centerX = rotRender.width / 2 - crop.x / zoom
  const centerY = rotRender.height / 2 - crop.y / zoom

  const pixelWidth = renderCropWidth * scaleX
  const pixelHeight = renderCropHeight * scaleY

  const pixelX = (centerX - renderCropWidth / 2) * scaleX
  const pixelY = (centerY - renderCropHeight / 2) * scaleY

  const clampedX = Math.max(0, Math.min(rotNatural.width - pixelWidth, pixelX))
  const clampedY = Math.max(
    0,
    Math.min(rotNatural.height - pixelHeight, pixelY)
  )
  const clampedWidth = Math.min(rotNatural.width - clampedX, pixelWidth)
  const clampedHeight = Math.min(rotNatural.height - clampedY, pixelHeight)

  return {
    x: Math.round(clampedX),
    y: Math.round(clampedY),
    width: Math.max(1, Math.round(clampedWidth)),
    height: Math.max(1, Math.round(clampedHeight)),
  }
}

export function drawCroppedImageToCanvas(
  image: CanvasImageSource,
  naturalSize: Size,
  pixelCrop: PixelCrop,
  rotation: number = 0,
  targetCanvas?: HTMLCanvasElement
): HTMLCanvasElement {
  const canvas = targetCanvas ?? document.createElement("canvas")
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  const ctx = canvas.getContext("2d")
  if (!ctx) return canvas

  const normalizedRotation = ((rotation % 360) + 360) % 360

  if (normalizedRotation === 0) {
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )
    return canvas
  }

  const rotNatural = getRotatedSize(naturalSize, normalizedRotation)

  const rotatedCanvas = document.createElement("canvas")
  rotatedCanvas.width = Math.round(rotNatural.width)
  rotatedCanvas.height = Math.round(rotNatural.height)

  const rotCtx = rotatedCanvas.getContext("2d")
  if (!rotCtx) return canvas

  rotCtx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2)
  rotCtx.rotate((normalizedRotation * Math.PI) / 180)
  rotCtx.drawImage(
    image,
    -naturalSize.width / 2,
    -naturalSize.height / 2,
    naturalSize.width,
    naturalSize.height
  )

  ctx.drawImage(
    rotatedCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return canvas
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string = "image/png",
  quality: number = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob !== "function") {
      reject(new Error("canvas.toBlob is not supported in this environment"))
      return
    }

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error("Failed to create blob from canvas"))
        }
      },
      type,
      quality
    )
  })
}
