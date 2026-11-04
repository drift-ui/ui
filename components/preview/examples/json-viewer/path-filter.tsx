import { JsonViewer } from "@/registry/default/ui/json-viewer"

const USERS_DATA = {
  organization: "Acme Corp",
  users: [
    {
      id: "usr_1",
      name: "Alice Johnson",
      email: "alice@acme.com",
      role: "admin",
      permissions: ["users:read", "users:write"],
    },
    {
      id: "usr_2",
      name: "Bob Smith",
      email: "bob@acme.com",
      role: "member",
      permissions: ["users:read"],
    },
    {
      id: "usr_3",
      name: "Carol Danvers",
      email: "carol@acme.com",
      role: "viewer",
      permissions: ["audit:read"],
    },
  ],
  meta: {
    page: 1,
    per_page: 20,
    total: 3,
  },
}

export function JsonViewerPathFilterPreview() {
  return (
    <JsonViewer
      aria-label="User directory"
      data={USERS_DATA}
      defaultPathFilter="users[*].email"
      defaultExpandDepth={3}
      className="h-64 w-full max-w-lg"
    />
  )
}
