export type OnboardingChecklistAction = {
  label: string
  onClick?: (event?: unknown) => void
  href?: string
  disabled?: boolean
}

export type OnboardingChecklistItem = {
  id: string
  title: string
  description?: unknown
  action?: OnboardingChecklistAction
  disabled?: boolean
}

export type OnboardingChecklistProgress = {
  total: number
  completedCount: number
  percentage: number
  isComplete: boolean
  ratioText: string
}

export function calculateProgress(
  total: number,
  completedCount: number
): OnboardingChecklistProgress {
  const safeTotal = Math.max(0, total)
  const safeCompleted = Math.min(safeTotal, Math.max(0, completedCount))
  const percentage =
    safeTotal === 0 ? 0 : Math.round((safeCompleted / safeTotal) * 100)
  const isComplete = safeTotal > 0 && safeCompleted === safeTotal

  return {
    total: safeTotal,
    completedCount: safeCompleted,
    percentage,
    isComplete,
    ratioText: `${safeCompleted} of ${safeTotal} done`,
  }
}

export function toggleItem(completed: readonly string[], id: string): string[] {
  if (completed.includes(id)) {
    return completed.filter((item) => item !== id)
  }
  return [...completed, id]
}

export function isItemCompleted(
  completed: readonly string[],
  id: string
): boolean {
  return completed.includes(id)
}

export function getCompletedCount(
  items: readonly { id: string }[],
  completed: readonly string[]
): number {
  const validIds = new Set(items.map((item) => item.id))
  return new Set(completed.filter((id) => validIds.has(id))).size
}
