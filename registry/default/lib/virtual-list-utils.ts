export function rowOffsets(count: number, sizeOf: (index: number) => number) {
  const offsets = new Array<number>(count + 1)
  offsets[0] = 0
  for (let index = 0; index < count; index++) {
    offsets[index + 1] = offsets[index] + sizeOf(index)
  }
  return offsets
}

export function rowAt(offsets: number[], position: number) {
  let low = 0
  let high = Math.max(0, offsets.length - 2)
  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    if (offsets[middle] <= position) low = middle
    else high = middle - 1
  }
  return low
}

export function visibleRange(
  offsets: number[],
  scrollTop: number,
  viewportHeight: number
) {
  return {
    first: rowAt(offsets, scrollTop),
    last: rowAt(offsets, scrollTop + viewportHeight),
  }
}

export function scrollTopToReveal(
  offsets: number[],
  index: number,
  scrollTop: number,
  viewportHeight: number
) {
  const top = offsets[index]
  const bottom = offsets[index + 1]
  if (top < scrollTop) return top
  if (bottom > scrollTop + viewportHeight) return bottom - viewportHeight
  return scrollTop
}

export function nextRowIndex(
  offsets: number[],
  index: number,
  key: string,
  viewportHeight: number
) {
  const lastIndex = offsets.length - 2
  switch (key) {
    case "ArrowDown":
      return Math.min(index + 1, lastIndex)
    case "ArrowUp":
      return Math.max(index - 1, 0)
    case "PageDown":
      return Math.max(
        Math.min(index + 1, lastIndex),
        rowAt(offsets, offsets[index] + viewportHeight)
      )
    case "PageUp":
      return Math.min(
        Math.max(index - 1, 0),
        rowAt(offsets, offsets[index] - viewportHeight)
      )
    case "Home":
      return 0
    case "End":
      return lastIndex
    default:
      return null
  }
}
