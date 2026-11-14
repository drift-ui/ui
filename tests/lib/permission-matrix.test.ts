import { describe, expect, it } from "vitest"

import {
  filterPermissionGroups,
  getGridNextCoordinates,
  getGroupStatus,
  getPermissionStatus,
  resolveRoleInheritance,
  toggleAllGrants,
  toggleGroupGrants,
  togglePermissionGrant,
  type PermissionAction,
  type PermissionGroup,
  type PermissionRole,
} from "@/registry/default/lib/permission-matrix-utils"

const ROLES: PermissionRole[] = [
  { id: "viewer", name: "Viewer" },
  { id: "editor", name: "Editor", inheritsFrom: "viewer" },
  { id: "admin", name: "Admin", inheritsFrom: "editor" },
  { id: "auditor", name: "Auditor" },
]

const SAMPLE_GROUP: PermissionGroup = {
  id: "docs",
  name: "Documents",
  description: "Document management actions",
  permissions: [
    { id: "docs.read", name: "Read Documents" },
    { id: "docs.write", name: "Write Documents" },
    { id: "docs.delete", name: "Delete Documents" },
  ],
}

describe("resolveRoleInheritance", () => {
  it("resolves single and chained ancestors", () => {
    const map = resolveRoleInheritance(ROLES)
    expect(map.get("viewer")).toEqual([])
    expect(map.get("editor")).toEqual(["viewer"])
    expect(map.get("admin")).toEqual(["editor", "viewer"])
  })

  it("handles multiple inheritance", () => {
    const roles: PermissionRole[] = [
      { id: "r1", name: "R1" },
      { id: "r2", name: "R2" },
      { id: "composite", name: "Composite", inheritsFrom: ["r1", "r2"] },
    ]
    const map = resolveRoleInheritance(roles)
    expect(map.get("composite")).toEqual(["r1", "r2"])
  })

  it("safely handles circular inheritance without infinite loops", () => {
    const cyclicRoles: PermissionRole[] = [
      { id: "a", name: "A", inheritsFrom: "b" },
      { id: "b", name: "B", inheritsFrom: "a" },
    ]
    const map = resolveRoleInheritance(cyclicRoles)
    expect(map.get("a")).toEqual(["b"])
    expect(map.get("b")).toEqual(["a"])
  })
})

describe("getPermissionStatus", () => {
  it("identifies direct grants", () => {
    const grants = { viewer: ["docs.read"] }
    const status = getPermissionStatus("viewer", "docs.read", grants, ROLES)
    expect(status).toEqual({
      granted: true,
      direct: true,
      inherited: false,
    })
  })

  it("identifies inherited grants from ancestor roles", () => {
    const grants = { viewer: ["docs.read"] }
    const status = getPermissionStatus("admin", "docs.read", grants, ROLES)
    expect(status).toEqual({
      granted: true,
      direct: false,
      inherited: true,
      inheritedFrom: "Viewer",
    })
  })

  it("returns ungranted when neither role nor ancestors have the grant", () => {
    const grants = { viewer: ["docs.read"] }
    const status = getPermissionStatus("viewer", "docs.write", grants, ROLES)
    expect(status).toEqual({
      granted: false,
      direct: false,
      inherited: false,
    })
  })

  it("prioritizes direct grant when permission is both direct and inherited", () => {
    const grants = { viewer: ["docs.read"], editor: ["docs.read"] }
    const status = getPermissionStatus("editor", "docs.read", grants, ROLES)
    expect(status).toEqual({
      granted: true,
      direct: true,
      inherited: false,
    })
  })
})

describe("getPermissionStatus with intermediate denies", () => {
  it("blocks descendants when an intermediate role denies", () => {
    const grants = { viewer: ["docs.read"], editor: ["!docs.read"] }
    expect(
      getPermissionStatus("admin", "docs.read", grants, ROLES).granted
    ).toBe(false)
  })

  it("still grants through another parent that does not deny", () => {
    const roles: PermissionRole[] = [
      { id: "viewer", name: "Viewer" },
      { id: "editor", name: "Editor", inheritsFrom: "viewer" },
      { id: "reader", name: "Reader", inheritsFrom: "viewer" },
      { id: "admin", name: "Admin", inheritsFrom: ["editor", "reader"] },
    ]
    const grants = { viewer: ["docs.read"], editor: ["!docs.read"] }
    const status = getPermissionStatus("admin", "docs.read", grants, roles)
    expect(status.granted).toBe(true)
    expect(status.inheritedFrom).toBe("Viewer")
  })
})

describe("getGroupStatus", () => {
  it("returns 'unchecked' when no permissions in the group are granted", () => {
    const grants = {}
    expect(getGroupStatus("editor", SAMPLE_GROUP, grants, ROLES)).toBe(
      "unchecked"
    )
  })

  it("returns 'checked' when all permissions in the group are granted", () => {
    const grants = {
      editor: ["docs.read", "docs.write", "docs.delete"],
    }
    expect(getGroupStatus("editor", SAMPLE_GROUP, grants, ROLES)).toBe(
      "checked"
    )
  })

  it("returns 'checked' when combination of direct and inherited covers all permissions", () => {
    const grants = {
      viewer: ["docs.read"],
      editor: ["docs.write", "docs.delete"],
    }
    expect(getGroupStatus("editor", SAMPLE_GROUP, grants, ROLES)).toBe(
      "checked"
    )
  })

  it("returns 'indeterminate' when some permissions are granted", () => {
    const grants = {
      editor: ["docs.read"],
    }
    expect(getGroupStatus("editor", SAMPLE_GROUP, grants, ROLES)).toBe(
      "indeterminate"
    )
  })

  it("returns 'unchecked' for empty group", () => {
    const emptyGroup: PermissionGroup = {
      id: "empty",
      name: "Empty",
      permissions: [],
    }
    expect(getGroupStatus("viewer", emptyGroup, {}, ROLES)).toBe("unchecked")
  })
})

describe("togglePermissionGrant", () => {
  it("grants permission if not already granted", () => {
    const initial = { editor: ["docs.read"] }
    const updated = togglePermissionGrant(initial, "editor", "docs.write")
    expect(updated.editor).toEqual(["docs.read", "docs.write"])
    expect(initial.editor).toEqual(["docs.read"]) // immutable
  })

  it("removes permission if already granted", () => {
    const initial = { editor: ["docs.read", "docs.write"] }
    const updated = togglePermissionGrant(initial, "editor", "docs.read")
    expect(updated.editor).toEqual(["docs.write"])
  })

  it("adds explicit deny when overriding an inherited permission", () => {
    // editor inherits docs.read from viewer
    const initial = { viewer: ["docs.read"], editor: [] }
    const updated = togglePermissionGrant(initial, "editor", "docs.read", ROLES)
    expect(updated.editor).toEqual(["!docs.read"])
    const status = getPermissionStatus("editor", "docs.read", updated, ROLES)
    expect(status.granted).toBe(false)
    expect(status.overridden).toBe(true)

    // Toggling again removes the deny and restores inheritance
    const restored = togglePermissionGrant(
      updated,
      "editor",
      "docs.read",
      ROLES
    )
    expect(restored.editor).toEqual([])
    const restoredStatus = getPermissionStatus(
      "editor",
      "docs.read",
      restored,
      ROLES
    )
    expect(restoredStatus.granted).toBe(true)
    expect(restoredStatus.inherited).toBe(true)
  })
})

describe("toggleGroupGrants", () => {
  it("grants all group permissions when unchecked", () => {
    const initial = {}
    const updated = toggleGroupGrants(initial, "editor", SAMPLE_GROUP, ROLES)
    expect(updated.editor).toEqual(["docs.read", "docs.write", "docs.delete"])
  })

  it("grants all remaining permissions when indeterminate", () => {
    const initial = { editor: ["docs.read"] }
    const updated = toggleGroupGrants(initial, "editor", SAMPLE_GROUP, ROLES)
    expect(updated.editor).toEqual(["docs.read", "docs.write", "docs.delete"])
  })

  it("ungrants all permissions in group when checked", () => {
    const initial = {
      editor: ["docs.read", "docs.write", "docs.delete", "other.perm"],
    }
    const updated = toggleGroupGrants(initial, "editor", SAMPLE_GROUP, ROLES)
    expect(updated.editor).toEqual(["other.perm"])
  })

  it("does not modify grants for disabled actions in group", () => {
    const groupWithDisabled: PermissionGroup = {
      id: "docs",
      name: "Documents",
      permissions: [
        { id: "docs.read", name: "Read" },
        { id: "docs.write", name: "Write", disabled: true },
      ],
    }
    const initial = { editor: ["docs.write"] }
    // Indeterminate -> grant enabled only
    const granted = toggleGroupGrants(
      initial,
      "editor",
      groupWithDisabled,
      ROLES
    )
    expect(granted.editor).toEqual(["docs.write", "docs.read"])

    // Checked -> ungrant enabled only
    const ungranted = toggleGroupGrants(
      { editor: ["docs.read", "docs.write"] },
      "editor",
      groupWithDisabled,
      ROLES
    )
    expect(ungranted.editor).toEqual(["docs.write"])
  })

  it("does not deny inherited permissions when overrides are disallowed", () => {
    const initial = {
      viewer: ["docs.read", "docs.write", "docs.delete"],
      editor: [],
    }
    const updated = toggleGroupGrants(
      initial,
      "editor",
      SAMPLE_GROUP,
      ROLES,
      false
    )
    expect(updated.editor).toEqual([])
  })

  it("does not pin already inherited permissions when granting an indeterminate group", () => {
    // editor inherits from viewer
    // viewer has docs.read; group has docs.read and docs.write
    const initial = {
      viewer: ["docs.read"],
      editor: [],
    }
    const updated = toggleGroupGrants(initial, "editor", SAMPLE_GROUP, ROLES)
    // Only docs.write and docs.delete should be added as direct grants to editor
    expect(updated.editor).toEqual(["docs.write", "docs.delete"])
    expect(updated.viewer).toEqual(["docs.read"])
  })
})

describe("toggleAllGrants", () => {
  const actions: PermissionAction[] = [
    { id: "a1", name: "Action 1" },
    { id: "a2", name: "Action 2" },
  ]

  it("grants all when not all granted", () => {
    const updated = toggleAllGrants({ r1: ["a1"] }, "r1", actions)
    expect(updated.r1).toEqual(["a1", "a2"])
  })

  it("clears all when all are already granted", () => {
    const updated = toggleAllGrants({ r1: ["a1", "a2"] }, "r1", actions)
    expect(updated.r1).toEqual([])
  })

  it("determines completeness correctly with stale or unrelated IDs", () => {
    // ['a1', 'legacy'] has length 2 === actions.length, but a2 is not granted
    const updated = toggleAllGrants({ r1: ["a1", "legacy"] }, "r1", actions)
    expect(updated.r1).toEqual(["a1", "legacy", "a2"])
  })

  it("skips disabled actions when granting all", () => {
    const actionsWithDisabled: PermissionAction[] = [
      { id: "a1", name: "Action 1" },
      { id: "a2", name: "Action 2", disabled: true },
    ]
    const updated = toggleAllGrants({ r1: [] }, "r1", actionsWithDisabled)
    expect(updated.r1).toEqual(["a1"])
  })

  it("removes deny markers when granting all", () => {
    const updated = toggleAllGrants({ r1: ["!a1"] }, "r1", actions)
    expect(updated.r1).toEqual(["a1", "a2"])
  })

  it("keeps grants on disabled actions when clearing all", () => {
    const actionsWithDisabled: PermissionAction[] = [
      { id: "a1", name: "Action 1" },
      { id: "a2", name: "Action 2", disabled: true },
    ]
    const updated = toggleAllGrants(
      { r1: ["a1", "a2"] },
      "r1",
      actionsWithDisabled
    )
    expect(updated.r1).toEqual(["a2"])
  })
})

describe("filterPermissionGroups", () => {
  const groups: PermissionGroup[] = [
    {
      id: "users",
      name: "Users",
      permissions: [
        { id: "users.create", name: "Create User" },
        { id: "users.list", name: "List Users" },
      ],
    },
    {
      id: "billing",
      name: "Billing",
      description: "Invoices and subscriptions",
      permissions: [{ id: "billing.view", name: "View Invoices" }],
    },
  ]

  it("returns all groups for empty query", () => {
    expect(filterPermissionGroups(groups, "")).toEqual(groups)
    expect(filterPermissionGroups(groups, "   ")).toEqual(groups)
  })

  it("matches group name and retains all its permissions", () => {
    const result = filterPermissionGroups(groups, "users")
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("users")
    expect(result[0].permissions).toHaveLength(2)
  })

  it("matches group description", () => {
    const result = filterPermissionGroups(groups, "invoices")
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("billing")
  })

  it("matches individual permission name and filters siblings in the group", () => {
    const result = filterPermissionGroups(groups, "create")
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("users")
    expect(result[0].permissions).toHaveLength(1)
    expect(result[0].permissions[0].id).toBe("users.create")
  })

  it("matches permission ID", () => {
    const result = filterPermissionGroups(groups, "billing.view")
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("billing")
  })

  it("returns empty array when nothing matches", () => {
    expect(filterPermissionGroups(groups, "nonexistent")).toEqual([])
  })
})

describe("getGridNextCoordinates", () => {
  const bounds = { rowCount: 5, colCount: 4 }

  it("navigates with arrow keys within bounds", () => {
    expect(
      getGridNextCoordinates(
        [1, 1],
        "ArrowUp",
        bounds.rowCount,
        bounds.colCount
      )
    ).toEqual([0, 1])
    expect(
      getGridNextCoordinates(
        [0, 1],
        "ArrowUp",
        bounds.rowCount,
        bounds.colCount
      )
    ).toEqual([0, 1]) // clamp

    expect(
      getGridNextCoordinates(
        [1, 1],
        "ArrowDown",
        bounds.rowCount,
        bounds.colCount
      )
    ).toEqual([2, 1])
    expect(
      getGridNextCoordinates(
        [4, 1],
        "ArrowDown",
        bounds.rowCount,
        bounds.colCount
      )
    ).toEqual([4, 1]) // clamp

    expect(
      getGridNextCoordinates(
        [1, 1],
        "ArrowLeft",
        bounds.rowCount,
        bounds.colCount
      )
    ).toEqual([1, 0])
    expect(
      getGridNextCoordinates(
        [1, 0],
        "ArrowLeft",
        bounds.rowCount,
        bounds.colCount
      )
    ).toEqual([1, 0]) // clamp

    expect(
      getGridNextCoordinates(
        [1, 1],
        "ArrowRight",
        bounds.rowCount,
        bounds.colCount
      )
    ).toEqual([1, 2])
    expect(
      getGridNextCoordinates(
        [1, 3],
        "ArrowRight",
        bounds.rowCount,
        bounds.colCount
      )
    ).toEqual([1, 3]) // clamp
  })

  it("navigates with Home, End, PageUp, PageDown", () => {
    expect(
      getGridNextCoordinates([2, 2], "Home", bounds.rowCount, bounds.colCount)
    ).toEqual([2, 0])
    expect(
      getGridNextCoordinates([2, 2], "End", bounds.rowCount, bounds.colCount)
    ).toEqual([2, 3])
    expect(
      getGridNextCoordinates([2, 2], "PageUp", bounds.rowCount, bounds.colCount)
    ).toEqual([0, 2])
    expect(
      getGridNextCoordinates(
        [2, 2],
        "PageDown",
        bounds.rowCount,
        bounds.colCount
      )
    ).toEqual([4, 2])
  })
})
