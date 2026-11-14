export const DEFAULT_MASK_DEFINITIONS: Record<string, RegExp> = {
  "#": /\d/,
  a: /[a-zA-Z]/,
  A: /[a-zA-Z]/,
  "*": /[a-zA-Z0-9]/,
}

export function isMaskToken(
  char: string,
  definitions = DEFAULT_MASK_DEFINITIONS
): boolean {
  return char in definitions
}

export interface UnmaskResult {
  raw: string
  tokensBeforeCursor: number
}

/**
 * Unmasks a value against a mask pattern, returning the raw unmasked tokens
 * and tracking how many accepted tokens occurred strictly before cursorPos.
 */
export function unmaskWithDetails(
  value: string,
  mask: string,
  cursorPos?: number,
  definitions = DEFAULT_MASK_DEFINITIONS
): UnmaskResult {
  if (!value) return { raw: "", tokensBeforeCursor: 0 }

  let raw = ""
  let tokensBeforeCursor = 0
  let valueIdx = 0
  let maskIdx = 0

  while (maskIdx < mask.length && valueIdx < value.length) {
    const maskChar = mask[maskIdx]
    const tokenRegex = definitions[maskChar]

    if (tokenRegex) {
      let found = false
      while (valueIdx < value.length) {
        const char = value[valueIdx]
        const currentIndex = valueIdx
        valueIdx++
        if (tokenRegex.test(char)) {
          raw += char
          if (cursorPos !== undefined && currentIndex < cursorPos) {
            tokensBeforeCursor++
          }
          found = true
          break
        }
      }
      if (!found) break
      maskIdx++
    } else {
      let literalSegment = ""
      let lookahead = maskIdx
      while (lookahead < mask.length && !definitions[mask[lookahead]]) {
        literalSegment += mask[lookahead]
        lookahead++
      }

      if (value[valueIdx] === literalSegment[0]) {
        let matched = 0
        while (
          matched < literalSegment.length &&
          valueIdx < value.length &&
          value[valueIdx] === literalSegment[matched]
        ) {
          matched++
          valueIdx++
        }
      }
      maskIdx = lookahead
    }
  }

  return { raw, tokensBeforeCursor }
}

export function unmaskValue(
  value: string,
  mask: string,
  definitions = DEFAULT_MASK_DEFINITIONS
): string {
  return unmaskWithDetails(value, mask, undefined, definitions).raw
}

export function applyMask(
  raw: string,
  mask: string,
  definitions = DEFAULT_MASK_DEFINITIONS
): { formatted: string; raw: string } {
  if (!raw) return { formatted: "", raw: "" }

  let formatted = ""
  let cleanRaw = ""
  let rawIdx = 0

  for (let m = 0; m < mask.length; m++) {
    const maskChar = mask[m]
    const tokenRegex = definitions[maskChar]

    if (tokenRegex) {
      if (rawIdx >= raw.length) break
      let found = false
      while (rawIdx < raw.length) {
        const char = raw[rawIdx++]
        if (tokenRegex.test(char)) {
          formatted += char
          cleanRaw += char
          found = true
          break
        }
      }
      if (!found) break
    } else {
      if (rawIdx > 0 && rawIdx <= raw.length) {
        formatted += maskChar
      } else if (rawIdx === 0 && raw.length > 0) {
        formatted += maskChar
      } else {
        break
      }
    }
  }

  return { formatted, raw: cleanRaw }
}

export function deleteTokenPastFormatting(
  previous: string,
  text: string,
  caret: number,
  isForward: boolean,
  mask: string,
  definitions = DEFAULT_MASK_DEFINITIONS
): { text: string; caret: number } {
  const previousRaw = unmaskValue(previous, mask, definitions)
  const textRaw = unmaskValue(text, mask, definitions)
  const removedFormatting =
    previous.length - text.length === 1 && previousRaw === textRaw

  if (!removedFormatting) return { text, caret }

  if (isForward) {
    for (let i = caret; i < text.length; i++) {
      const char = text[i]
      if (Object.values(definitions).some((regex) => regex.test(char))) {
        return {
          text: text.slice(0, i) + text.slice(i + 1),
          caret,
        }
      }
    }
  } else {
    const rawBefore = unmaskValue(text.slice(0, caret), mask, definitions)
    if (rawBefore.length === 0) return { text, caret }

    for (let i = caret - 1; i >= 0; i--) {
      const char = text[i]
      if (Object.values(definitions).some((regex) => regex.test(char))) {
        return {
          text: text.slice(0, i) + text.slice(i + 1),
          caret: i,
        }
      }
    }
  }

  return { text, caret }
}

export function calculateMaskCaretPosition({
  nextFormatted,
  rawInput,
  rawCursorPos,
  mask,
  definitions = DEFAULT_MASK_DEFINITIONS,
}: {
  nextFormatted: string
  rawInput: string
  rawCursorPos: number
  mask: string
  definitions?: Record<string, RegExp>
}): number {
  const { tokensBeforeCursor } = unmaskWithDetails(
    rawInput,
    mask,
    rawCursorPos,
    definitions
  )

  if (tokensBeforeCursor === 0) {
    let idx = 0
    while (idx < nextFormatted.length && !isMaskToken(mask[idx], definitions)) {
      idx++
    }
    return idx
  }

  let tokenCount = 0
  let caretIndex = nextFormatted.length

  for (let i = 0; i < nextFormatted.length; i++) {
    if (isMaskToken(mask[i], definitions)) {
      tokenCount++
      if (tokenCount === tokensBeforeCursor) {
        caretIndex = i + 1
        break
      }
    }
  }

  while (
    caretIndex < nextFormatted.length &&
    !isMaskToken(mask[caretIndex], definitions)
  ) {
    caretIndex++
  }

  return Math.min(caretIndex, nextFormatted.length)
}

export function getLocaleDigitMap(locale: string = "en-US"): {
  toStandard: Record<string, string>
  isDigit: (char: string) => boolean
} {
  const formatter = new Intl.NumberFormat(locale, { useGrouping: false })
  const toStandard: Record<string, string> = {}
  for (let i = 0; i <= 9; i++) {
    const loc = formatter.format(i)
    toStandard[loc] = String(i)
    toStandard[String(i)] = String(i)
  }
  return {
    toStandard,
    isDigit: (char: string) => char in toStandard,
  }
}

export function getCurrencyInfo(
  locale: string = "en-US",
  currency: string = "USD"
) {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  })
  const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2
  const sampleParts = formatter.formatToParts(123456.78)

  const decimal = sampleParts.find((p) => p.type === "decimal")?.value ?? "."
  const group = sampleParts.find((p) => p.type === "group")?.value ?? ","
  const currencySymbol =
    sampleParts.find((p) => p.type === "currency")?.value ?? currency

  const firstNumIdx = sampleParts.findIndex((p) => p.type === "integer")
  const lastNumIdx = sampleParts.findLastIndex(
    (p) => p.type === "fraction" || p.type === "integer"
  )

  const prefix = sampleParts
    .slice(0, firstNumIdx !== -1 ? firstNumIdx : 0)
    .map((p) => p.value)
    .join("")
  const suffix = sampleParts
    .slice(lastNumIdx !== -1 ? lastNumIdx + 1 : sampleParts.length)
    .map((p) => p.value)
    .join("")

  const negParts = formatter.formatToParts(-123456.78)
  const negFirstNumIdx = negParts.findIndex((p) => p.type === "integer")
  const negLastNumIdx = negParts.findLastIndex(
    (p) => p.type === "fraction" || p.type === "integer"
  )

  const negPrefix = negParts
    .slice(0, negFirstNumIdx !== -1 ? negFirstNumIdx : 0)
    .map((p) => p.value)
    .join("")
  const negSuffix = negParts
    .slice(negLastNumIdx !== -1 ? negLastNumIdx + 1 : negParts.length)
    .map((p) => p.value)
    .join("")

  return {
    formatter,
    fractionDigits,
    decimal,
    group,
    currencySymbol,
    prefix,
    suffix,
    negPrefix,
    negSuffix,
  }
}

export function formatCurrency(
  cents: number | null | undefined,
  locale: string = "en-US",
  currency: string = "USD"
): string {
  if (cents === null || cents === undefined || Number.isNaN(cents)) {
    return ""
  }

  const { formatter, fractionDigits } = getCurrencyInfo(locale, currency)
  const amount =
    fractionDigits > 0 ? cents / Math.pow(10, fractionDigits) : cents

  return formatter.format(amount)
}

export function parseCurrency(
  text: string,
  locale: string = "en-US",
  currency: string = "USD"
): number | null {
  if (!text || !text.trim()) return null

  const { fractionDigits, decimal } = getCurrencyInfo(locale, currency)
  const { toStandard, isDigit } = getLocaleDigitMap(locale)

  let isNegative = false
  let intDigits = ""
  let fracDigits = ""
  let foundDecimal = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === "-") {
      isNegative = true
    } else if (char === decimal && fractionDigits > 0) {
      foundDecimal = true
    } else if (isDigit(char)) {
      const standardChar = toStandard[char]
      if (foundDecimal) {
        if (fracDigits.length < fractionDigits) {
          fracDigits += standardChar
        }
      } else {
        const maxIntDigits = Math.max(1, 15 - fractionDigits)
        if (intDigits.length < maxIntDigits) {
          intDigits += standardChar
        }
      }
    }
  }

  if (!intDigits && !fracDigits) return null

  const intVal = intDigits ? Number(intDigits) : 0
  const paddedFrac = fracDigits
    .padEnd(fractionDigits, "0")
    .slice(0, fractionDigits)
  const fracVal = fractionDigits > 0 ? Number(paddedFrac) : 0
  const total = intVal * Math.pow(10, fractionDigits) + fracVal

  return isNegative ? -total : total
}

export function formatCurrencyLive(
  input: string,
  locale: string = "en-US",
  currency: string = "USD"
): { formatted: string; cents: number | null } {
  if (!input || !input.trim()) {
    return { formatted: "", cents: null }
  }

  const { fractionDigits, decimal, prefix, suffix, negPrefix, negSuffix } =
    getCurrencyInfo(locale, currency)
  const { toStandard, isDigit } = getLocaleDigitMap(locale)

  let isNegative = false
  let intDigits = ""
  let fracDigits = ""
  let foundDecimal = false

  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    if (char === "-") {
      isNegative = true
    } else if (char === decimal && fractionDigits > 0) {
      if (!foundDecimal) {
        foundDecimal = true
      }
    } else if (isDigit(char)) {
      const standardChar = toStandard[char]
      if (foundDecimal) {
        if (fracDigits.length < fractionDigits) {
          fracDigits += standardChar
        }
      } else {
        const maxIntDigits = Math.max(1, 15 - fractionDigits)
        if (intDigits.length < maxIntDigits) {
          intDigits += standardChar
        }
      }
    }
  }

  if (!intDigits && !fracDigits && !foundDecimal) {
    return { formatted: "", cents: null }
  }

  const intNumber = intDigits ? Number(intDigits) : 0
  const formattedInt = new Intl.NumberFormat(locale, {
    useGrouping: true,
  }).format(intNumber)

  const displayInt = intDigits ? formattedInt : "0"

  let body = displayInt
  if (foundDecimal) {
    let displayFrac = ""
    const locFormatter = new Intl.NumberFormat(locale, { useGrouping: false })
    for (const c of fracDigits) {
      displayFrac += locFormatter.format(Number(c))
    }
    body += decimal + displayFrac
  }

  const activePrefix = isNegative ? negPrefix : prefix
  const activeSuffix = isNegative ? negSuffix : suffix
  const formatted = `${activePrefix}${body}${activeSuffix}`

  const paddedFrac = fracDigits
    .padEnd(fractionDigits, "0")
    .slice(0, fractionDigits)
  const fracVal = fractionDigits > 0 ? Number(paddedFrac) : 0
  const total = intNumber * Math.pow(10, fractionDigits) + fracVal
  const cents = isNegative ? -total : total

  return { formatted, cents }
}

export function deleteCurrencyDigitPastFormatting(
  previous: string,
  text: string,
  caret: number,
  isForward: boolean,
  locale: string = "en-US"
): { text: string; caret: number } {
  const { isDigit } = getLocaleDigitMap(locale)

  const prevDigits = Array.from(previous).filter(isDigit).join("")
  const textDigits = Array.from(text).filter(isDigit).join("")

  const removedFormatting =
    previous.length - text.length === 1 && prevDigits === textDigits

  if (!removedFormatting) return { text, caret }

  if (isForward) {
    for (let i = caret; i < text.length; i++) {
      if (isDigit(text[i])) {
        return {
          text: text.slice(0, i) + text.slice(i + 1),
          caret,
        }
      }
    }
  } else {
    for (let i = caret - 1; i >= 0; i--) {
      if (isDigit(text[i])) {
        return {
          text: text.slice(0, i) + text.slice(i + 1),
          caret: i,
        }
      }
    }
  }

  return { text, caret }
}

export function calculateCurrencyCaretPosition({
  nextFormatted,
  rawInput,
  rawCursorPos,
  locale = "en-US",
  currency = "USD",
}: {
  nextFormatted: string
  rawInput: string
  rawCursorPos: number
  locale?: string
  currency?: string
}): number {
  const { decimal } = getCurrencyInfo(locale, currency)
  const { isDigit } = getLocaleDigitMap(locale)

  const rawDecimalIdx = rawInput.indexOf(decimal)
  const isPastDecimal = rawDecimalIdx !== -1 && rawCursorPos > rawDecimalIdx

  let digitsBefore = 0
  for (let i = 0; i < Math.min(rawCursorPos, rawInput.length); i++) {
    if (isDigit(rawInput[i])) {
      digitsBefore++
    }
  }

  if (digitsBefore === 0) {
    if (isPastDecimal) {
      const nextDec = nextFormatted.indexOf(decimal)
      return nextDec !== -1 ? nextDec + 1 : nextFormatted.length
    }
    let idx = 0
    while (idx < nextFormatted.length && !isDigit(nextFormatted[idx])) {
      idx++
    }
    return idx
  }

  let count = 0
  let caretIndex = nextFormatted.length

  for (let i = 0; i < nextFormatted.length; i++) {
    if (isDigit(nextFormatted[i])) {
      count++
      if (count === digitsBefore) {
        caretIndex = i + 1
        break
      }
    }
  }

  if (isPastDecimal) {
    const nextDec = nextFormatted.indexOf(decimal)
    if (nextDec !== -1 && caretIndex <= nextDec) {
      caretIndex = nextDec + 1
    }
  }

  return Math.min(caretIndex, nextFormatted.length)
}
