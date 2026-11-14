export type MultiSelectOption = {
  value: string
  label: string
  group?: string
}

export type MultiSelectGroup = {
  label?: string
  options: MultiSelectOption[]
}

export function filterOptions(options: MultiSelectOption[], query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return options
  return options.filter(
    (option) =>
      option.label.toLowerCase().includes(needle) ||
      option.value.toLowerCase().includes(needle)
  )
}

export function groupOptions(options: MultiSelectOption[]): MultiSelectGroup[] {
  const groups = new Map<string | undefined, MultiSelectOption[]>()
  for (const option of options) {
    groups.set(option.group, [...(groups.get(option.group) ?? []), option])
  }
  return Array.from(groups, ([label, groupOptions]) => ({
    label,
    options: groupOptions,
  }))
}

export function toggleValue(
  selected: string[],
  value: string,
  maxSelected?: number
) {
  if (selected.includes(value)) return selected.filter((item) => item !== value)
  if (maxSelected !== undefined && selected.length >= maxSelected) {
    return selected
  }
  return [...selected, value]
}

export function toggleAll(selected: string[], options: MultiSelectOption[]) {
  const values = options.map((option) => option.value)
  if (values.every((value) => selected.includes(value))) {
    return selected.filter((value) => !values.includes(value))
  }
  return [...selected, ...values.filter((value) => !selected.includes(value))]
}
