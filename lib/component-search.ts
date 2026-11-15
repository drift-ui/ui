const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "for",
  "i",
  "in",
  "it",
  "let",
  "me",
  "my",
  "need",
  "of",
  "on",
  "or",
  "people",
  "some",
  "that",
  "the",
  "they",
  "this",
  "to",
  "want",
  "we",
  "with",
  "you",
])

export function searchWords(query: string) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter((word) => word && !STOPWORDS.has(word))
}

export function matchScore(fields: string[], words: string[]) {
  const haystack = fields.join(" ").toLowerCase()
  return words.filter((word) => haystack.includes(word)).length
}
