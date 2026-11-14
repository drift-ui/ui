export interface PermissionRole {
  id: string
  name: string
  description?: string
  disabled?: boolean
  inheritsFrom?: string | string[]
}

export interface PermissionAction {
  id: string
  name: string
  description?: string
  disabled?: boolean
}

export interface PermissionGroup {
  id: string
  name: string
  description?: string
  permissions: PermissionAction[]
}

export type PermissionGrants = Record<string, string[]>

export interface PermissionStatus {
  granted: boolean
  direct: boolean
  inherited: boolean
  inheritedFrom?: string
  overridden?: boolean
}

/**
 * Resolves role inheritance chains recursively.
 * Detects cycles to prevent infinite loops.
 */
export function resolveRoleInheritance(
  roles: PermissionRole[]
): Map<string, string[]> {
  const roleMap = new Map(roles.map((r) => [r.id, r]))
  const result = new Map<string, string[]>()

  for (const role of roles) {
    const ancestors: string[] = []
    const visited = new Set<string>([role.id])
    const queue = Array.isArray(role.inheritsFrom)
      ? [...role.inheritsFrom]
      : role.inheritsFrom
        ? [role.inheritsFrom]
        : []

    while (queue.length > 0) {
      const currentId = queue.shift()!
      if (!visited.has(currentId)) {
        visited.add(currentId)
        ancestors.push(currentId)
        const parentRole = roleMap.get(currentId)
        if (parentRole?.inheritsFrom) {
          const nextParents = Array.isArray(parentRole.inheritsFrom)
            ? parentRole.inheritsFrom
            : [parentRole.inheritsFrom]
          queue.push(...nextParents)
        }
      }
    }
    result.set(role.id, ancestors)
  }

  return result
}

function findGrantSource(
  roleId: string,
  permissionId: string,
  grants: PermissionGrants,
  roleMap: Map<string, PermissionRole>,
  visited: Set<string>
): string | undefined {
  if (visited.has(roleId)) return undefined
  visited.add(roleId)

  const direct = grants[roleId] ?? []
  if (direct.includes(`!${permissionId}`)) return undefined
  if (direct.includes(permissionId)) return roleId

  const inheritsFrom = roleMap.get(roleId)?.inheritsFrom
  const parents = Array.isArray(inheritsFrom)
    ? inheritsFrom
    : inheritsFrom
      ? [inheritsFrom]
      : []

  for (const parentId of parents) {
    const source = findGrantSource(
      parentId,
      permissionId,
      grants,
      roleMap,
      visited
    )
    if (source) return source
  }
  return undefined
}

/**
 * Computes whether a permission is granted directly or through an ancestor role.
 */
export function getPermissionStatus(
  roleId: string,
  permissionId: string,
  grants: PermissionGrants,
  roles: PermissionRole[] = []
): PermissionStatus {
  if ((grants[roleId] ?? []).includes(`!${permissionId}`)) {
    return {
      granted: false,
      direct: false,
      inherited: false,
      overridden: true,
    }
  }

  const roleMap = new Map(roles.map((r) => [r.id, r]))
  const source = findGrantSource(
    roleId,
    permissionId,
    grants,
    roleMap,
    new Set()
  )

  if (!source) {
    return {
      granted: false,
      direct: false,
      inherited: false,
    }
  }

  if (source === roleId) {
    return {
      granted: true,
      direct: true,
      inherited: false,
    }
  }

  return {
    granted: true,
    direct: false,
    inherited: true,
    inheritedFrom: roleMap.get(source)?.name ?? source,
  }
}

/**
 * Calculates the tri-state check status for an entire permission group under a specific role.
 */
export function getGroupStatus(
  roleId: string,
  group: PermissionGroup,
  grants: PermissionGrants,
  roles: PermissionRole[] = []
): "checked" | "unchecked" | "indeterminate" {
  if (group.permissions.length === 0) {
    return "unchecked"
  }

  let grantedCount = 0

  for (const action of group.permissions) {
    const status = getPermissionStatus(roleId, action.id, grants, roles)
    if (status.granted) {
      grantedCount++
    }
  }

  if (grantedCount === 0) return "unchecked"
  if (grantedCount === group.permissions.length) return "checked"
  return "indeterminate"
}

/**
 * Toggles an individual permission grant for a role, returning an updated grants record.
 * Supports overriding inherited permissions by adding or removing an explicit deny (!id).
 */
export function togglePermissionGrant(
  grants: PermissionGrants,
  roleId: string,
  permissionId: string,
  roles: PermissionRole[] = []
): PermissionGrants {
  const current = grants[roleId] ?? []
  const denyId = `!${permissionId}`
  const status = getPermissionStatus(roleId, permissionId, grants, roles)

  let next: string[]
  if (current.includes(denyId)) {
    // Explicit deny exists -> remove it to restore inherited grant or ungranted
    next = current.filter((id) => id !== denyId)
  } else if (status.inherited) {
    // Inherited grant -> override with explicit deny
    next = [...current.filter((id) => id !== permissionId), denyId]
  } else if (current.includes(permissionId)) {
    // Direct grant -> remove
    next = current.filter((id) => id !== permissionId)
  } else {
    // Ungranted -> add grant
    next = [...current.filter((id) => id !== denyId), permissionId]
  }

  return {
    ...grants,
    [roleId]: next,
  }
}

/**
 * Toggles all permissions in a group for a role.
 * If currently "checked", ungrants permissions in the group (denying inherited).
 * If "unchecked" or "indeterminate", grants all ungranted permissions in the group.
 */
export function toggleGroupGrants(
  grants: PermissionGrants,
  roleId: string,
  group: PermissionGroup,
  roles: PermissionRole[] = [],
  allowOverrideInherited = true
): PermissionGrants {
  const status = getGroupStatus(roleId, group, grants, roles)
  const currentDirect = grants[roleId] ?? []
  const groupActionIds = group.permissions
    .filter((p) => !p.disabled)
    .map((p) => p.id)

  if (status === "checked") {
    // Ungrant all permissions in this group
    const next = currentDirect.filter((id) => !groupActionIds.includes(id))
    for (const actionId of groupActionIds) {
      const pStatus = getPermissionStatus(roleId, actionId, grants, roles)
      if (pStatus.inherited && allowOverrideInherited) {
        next.push(`!${actionId}`)
      }
    }
    return {
      ...grants,
      [roleId]: next,
    }
  }

  // Grant all permissions in this group: remove denies and grant ungranted
  const denyIds = groupActionIds.map((a) => `!${a}`)
  const next = currentDirect.filter((id) => !denyIds.includes(id))
  for (const actionId of groupActionIds) {
    const pStatus = getPermissionStatus(
      roleId,
      actionId,
      { ...grants, [roleId]: next },
      roles
    )
    if (!pStatus.granted && !next.includes(actionId)) {
      next.push(actionId)
    }
  }

  return {
    ...grants,
    [roleId]: next,
  }
}

/**
 * Toggles all permissions in the matrix for a role.
 */
export function toggleAllGrants(
  grants: PermissionGrants,
  roleId: string,
  allPermissions: PermissionAction[],
  shouldGrant?: boolean
): PermissionGrants {
  const current = grants[roleId] ?? []
  const enabledPermissions = allPermissions.filter((p) => !p.disabled)
  const allIds = enabledPermissions.map((p) => p.id)
  const grant = shouldGrant ?? !allIds.every((id) => current.includes(id))

  const denyIds = allIds.map((id) => `!${id}`)

  return {
    ...grants,
    [roleId]: grant
      ? Array.from(
          new Set([...current.filter((id) => !denyIds.includes(id)), ...allIds])
        )
      : current.filter((id) => !allIds.includes(id)),
  }
}

/**
 * Filters permission groups and their child permissions by search query.
 */
export function filterPermissionGroups(
  groups: PermissionGroup[],
  searchQuery: string
): PermissionGroup[] {
  const query = searchQuery.trim().toLowerCase()
  if (!query) return groups

  return groups
    .map((group) => {
      const groupMatches =
        group.name.toLowerCase().includes(query) ||
        (group.description?.toLowerCase().includes(query) ?? false)

      if (groupMatches) {
        return group
      }

      const matchingPermissions = group.permissions.filter(
        (action) =>
          action.name.toLowerCase().includes(query) ||
          action.id.toLowerCase().includes(query) ||
          (action.description?.toLowerCase().includes(query) ?? false)
      )

      if (matchingPermissions.length > 0) {
        return {
          ...group,
          permissions: matchingPermissions,
        }
      }

      return null
    })
    .filter((g): g is PermissionGroup => g !== null)
}

/**
 * Computes next cell coordinates in a grid for 2D keyboard navigation.
 */
export function getGridNextCoordinates(
  current: [number, number],
  key: string,
  rowCount: number,
  colCount: number
): [number, number] {
  const [row, col] = current

  switch (key) {
    case "ArrowUp":
      return [Math.max(0, row - 1), col]
    case "ArrowDown":
      return [Math.min(rowCount - 1, row + 1), col]
    case "ArrowLeft":
      return [row, Math.max(0, col - 1)]
    case "ArrowRight":
      return [row, Math.min(colCount - 1, col + 1)]
    case "Home":
      return [row, 0]
    case "End":
      return [row, colCount - 1]
    case "PageUp":
      return [0, col]
    case "PageDown":
      return [rowCount - 1, col]
    default:
      return current
  }
}
