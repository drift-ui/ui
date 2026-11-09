"use client"

import { createContext, use, useState } from "react"

export type DocsSections = {
  items: { value: string; label: string }[]
  active: string
  open: (value: string) => void
}

type DocsSectionsState = [
  DocsSections | null,
  (sections: DocsSections | null) => void,
]

const DocsSectionsContext = createContext<DocsSectionsState>([null, () => {}])

export function DocsSectionsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const state = useState<DocsSections | null>(null)

  return <DocsSectionsContext value={state}>{children}</DocsSectionsContext>
}

export function useDocsSections() {
  return use(DocsSectionsContext)
}
