export type BlockGroupId = "account" | "operations" | "collaboration"

export type BlockKind =
  | "onboarding"
  | "team-invite"
  | "profile"
  | "security"
  | "release"
  | "service-status"
  | "trace-inspector"
  | "api-keys"
  | "file-manager"
  | "code-review"
  | "roles"
  | "audit-log"

export type Block = {
  kind: BlockKind
  group: BlockGroupId
  name: string
  description: string
  uses: string[]
}

export const BLOCK_GROUPS: {
  id: BlockGroupId
  label: string
  description: string
}[] = [
  {
    id: "account",
    label: "Account",
    description: "What a person sets up in the first minutes after signing up.",
  },
  {
    id: "operations",
    label: "Operations",
    description: "Shipping a service, watching it run and finding what broke.",
  },
  {
    id: "collaboration",
    label: "Collaboration",
    description:
      "Shared files, reviews, access and the history of who did what.",
  },
]

export const BLOCKS: Block[] = [
  {
    kind: "onboarding",
    group: "account",
    name: "Onboarding",
    description:
      "A first-run flow that sets up a workspace step by step, with its teams and seat count.",
    uses: ["stepper", "tags-input", "number-input"],
  },
  {
    kind: "team-invite",
    group: "account",
    name: "Team invite",
    description:
      "Invite several people in one go by typing or pasting emails, with one role for the batch.",
    uses: ["tags-input"],
  },
  {
    kind: "profile",
    group: "account",
    name: "Profile",
    description:
      "Edit account details in place, with a phone number and the time zone notifications follow.",
    uses: ["avatar", "description-list", "phone-input", "timezone-picker"],
  },
  {
    kind: "security",
    group: "account",
    name: "Security settings",
    description:
      "Change a password against a strength meter and see the sessions it will sign out.",
    uses: ["password-input"],
  },
  {
    kind: "release",
    group: "operations",
    name: "Release scheduler",
    description:
      "Pick a deploy window and follow the release through its timeline.",
    uses: ["date-time-range", "timeline"],
  },
  {
    kind: "service-status",
    group: "operations",
    name: "Service status",
    description:
      "Sixty days of uptime for a service above the log lines from its last incident.",
    uses: ["uptime-bar", "log-viewer"],
  },
  {
    kind: "trace-inspector",
    group: "operations",
    name: "Trace inspector",
    description:
      "Follow a failed request span by span and read the attributes of the call that broke it.",
    uses: ["trace-waterfall", "json-viewer"],
  },
  {
    kind: "api-keys",
    group: "operations",
    name: "API keys",
    description:
      "A masked secret key with copy and reveal, next to the scopes it was issued with.",
    uses: ["secret-field", "multi-select"],
  },
  {
    kind: "file-manager",
    group: "collaboration",
    name: "File manager",
    description:
      "Browse a folder tree next to a dropzone for uploading into the open folder.",
    uses: ["tree-view", "file-dropzone"],
  },
  {
    kind: "code-review",
    group: "collaboration",
    name: "Code review",
    description:
      "A config change as a diff, with the review thread for the lines that moved.",
    uses: ["diff-viewer", "comment-thread"],
  },
  {
    kind: "roles",
    group: "collaboration",
    name: "Roles and permissions",
    description:
      "Grant permissions per role, see what each role inherits, and who holds it.",
    uses: ["permission-matrix", "avatar-group"],
  },
  {
    kind: "audit-log",
    group: "collaboration",
    name: "Audit log",
    description:
      "Account activity as a timeline, narrowed by actor and action filters.",
    uses: ["tags-input", "timeline"],
  },
]
