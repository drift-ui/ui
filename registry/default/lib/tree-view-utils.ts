export type TreeData = {
  id: string
  children?: TreeData[]
  isBranch?: boolean
  disabled?: boolean
}

export type CheckedState = boolean | "mixed"

export type TreeRow<T extends TreeData> =
  | {
      status?: undefined
      node: T
      depth: number
      parentId: string | null
      isBranch: boolean
      position: number
      siblingCount: number
    }
  | { status: "loading" | "failed"; node: T; depth: number }

export type NodeRow<T extends TreeData> = Extract<
  TreeRow<T>,
  { status?: undefined }
>

export function isBranch(node: TreeData) {
  return node.isBranch ?? node.children !== undefined
}

export function flattenTree<T extends TreeData>(
  nodes: T[],
  expanded: ReadonlySet<string>,
  failed: ReadonlySet<string> = new Set(),
  depth = 0,
  parentId: string | null = null,
  rows: TreeRow<T>[] = []
) {
  nodes.forEach((node, index) => {
    const branch = isBranch(node)
    rows.push({
      node,
      depth,
      parentId,
      isBranch: branch,
      position: index + 1,
      siblingCount: nodes.length,
    })
    if (!branch || !expanded.has(node.id)) return
    if (node.children) {
      flattenTree(
        node.children as T[],
        expanded,
        failed,
        depth + 1,
        node.id,
        rows
      )
    } else {
      rows.push({
        status: failed.has(node.id) ? "failed" : "loading",
        node,
        depth: depth + 1,
      })
    }
  })
  return rows
}

export function stepNode<T extends TreeData>(
  rows: TreeRow<T>[],
  index: number,
  step: 1 | -1
) {
  for (let next = index + step; next >= 0 && next < rows.length; next += step) {
    if (!rows[next].status) return next
  }
  return -1
}

export function checkedStates(nodes: TreeData[], checked: ReadonlySet<string>) {
  const states = new Map<string, CheckedState>()
  function visit(node: TreeData, inherited: boolean): CheckedState {
    const own = checked.has(node.id) || (inherited && !node.disabled)
    let state: CheckedState = own
    if (node.children?.length) {
      const children = node.children.map((child) => visit(child, own))
      if (children.every((child) => child === true)) state = true
      else if (children.some((child) => child !== false)) state = "mixed"
      else state = false
    }
    states.set(node.id, state)
    return state
  }
  for (const node of nodes) visit(node, false)
  return states
}

function pathTo(nodes: TreeData[], id: string): TreeData[] | null {
  for (const node of nodes) {
    if (node.id === id) return [node]
    const rest = node.children && pathTo(node.children, id)
    if (rest) return [node, ...rest]
  }
  return null
}

function enabledSubtree(node: TreeData): TreeData[] {
  if (node.disabled) return []
  return [node, ...(node.children ?? []).flatMap(enabledSubtree)]
}

function checkedIds(states: Map<string, CheckedState>) {
  return [...states].filter(([, state]) => state === true).map(([id]) => id)
}

export function toggleChecked(
  nodes: TreeData[],
  checked: string[],
  id: string
) {
  const path = pathTo(nodes, id)
  const target = path?.[path.length - 1]
  if (!path || !target || target.disabled) return checked
  const before = checkedStates(nodes, new Set(checked))
  const targets = enabledSubtree(target)
  const check = !targets
    .filter((node) => !node.children?.length)
    .every((node) => before.get(node.id) === true)
  const next = new Set(checkedIds(before))

  for (const node of targets) {
    if (!check) next.delete(node.id)
    else if (!node.children?.length) next.add(node.id)
  }
  if (!check) for (const ancestor of path) next.delete(ancestor.id)

  return checkedIds(checkedStates(nodes, next))
}
