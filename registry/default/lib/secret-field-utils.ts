const MASK_CHAR = "•"
// Fixed so the mask does not reveal how long the secret is.
const MASK_LENGTH = 8

export function getVisibleTail(value: string, visibleChars: number) {
  const count = Math.floor(visibleChars)
  // `!(count > 0)` also rejects NaN, which slice would treat as 0 and show the whole value.
  if (!(count > 0) || value.length <= count) return ""
  return value.slice(-count)
}

export function maskSecret(value: string, visibleChars: number) {
  return MASK_CHAR.repeat(MASK_LENGTH) + getVisibleTail(value, visibleChars)
}
