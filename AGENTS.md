# AGENTS.md

Instructions for coding agents (Claude Code, Codex, Cursor, Copilot, Gemini and others) working in this repo. Humans should read [CONTRIBUTING.md](CONTRIBUTING.md); this file points at it rather than repeating it.

## Project

drift-ui is a shadcn-compatible component registry: React 19, Tailwind v4, Radix, Next.js 16, Bun. The repo is both the registry source and the docs site that serves it.

Maintainers: [@localhostd3veloper](https://github.com/localhostd3veloper) and [@syedfahadjunaid](https://github.com/syedfahadjunaid). Repo: `localhostd3veloper/drift-ui`.

## Commands

```bash
bun install
bun dev                   # site at http://localhost:3000
bun run registry:build    # regenerate public/r/*.json from registry.json
bun run typecheck
bun run lint
bun run test
bun run format
```

## Where things live

| Path                                    | What                                                    |
| --------------------------------------- | ------------------------------------------------------- |
| `registry/default/ui/<name>.tsx`        | Component source, the thing users install               |
| `registry/default/lib/<name>.ts`        | Pure logic behind a component, tested without rendering |
| `registry/base/ui/<name>.tsx`           | Base UI version of a file that depends on Radix         |
| `registry.json`                         | Registry manifest read by `shadcn build`                |
| `components/preview/<name>-preview.tsx` | Live demo and usage example on the docs page            |
| `components/preview/examples/<name>/`   | Examples, one file each plus `index.ts`                 |
| `components/docs/preview-registry.tsx`  | Maps slugs to previews                                  |
| `lib/catalog.ts`                        | Categories, alphabetical within each                    |
| `lib/agent-docs/component-usage.ts`     | Usage notes served at `/llms.txt` and `/llms-full.txt`  |
| `tests/ui`, `tests/lib`                 | Vitest suites                                           |
| `public/r/**/*.json`                    | Build output, gitignored. Regenerate, never hand-edit   |
| `lib/contributors.ts`                   | Maintainers and GitHub data behind `/contributors`      |

## Working on a GitHub issue

Use the `gh` CLI. If you are not authenticated, ask the human to run `gh auth login`.

### 1. Choose the issue

If you were given a number, use it. Otherwise list candidates and let the human pick:

```bash
gh issue list --state open --label "priority: high"
gh issue list --state open --label "good first issue"
```

Skip issues that already have an assignee or a linked open pull request (`gh issue view <n> --json assignees,closedByPullRequestsReferences`).

### 2. Read it fully

```bash
gh issue view <n> --comments
```

Labels tell you the kind of work: `new component` means the full component checklist below, `bug` means reproduce first and add a failing test, and `inputs`, `structure` and `workflow` give the catalog category. If the issue is ambiguous, ask in the conversation before writing code. Do not guess an API.

### 3. Claim it and branch

Ask the human before claiming, since it is visible to others. Maintainers assign themselves (`gh issue edit <n> --add-assignee @me`), others comment on the issue.

```bash
git switch main && git pull
git switch -c <type>/<n>-<short-slug>     # e.g. feat/14-avatar-group, fix/31-stepper-focus
```

### 4. Implement

For a new component, follow every step of [Adding a component](CONTRIBUTING.md#adding-a-component) and the [component guidelines](CONTRIBUTING.md#component-guidelines). The short version:

1. `registry/default/ui/<name>.tsx`, with pure logic in `registry/default/lib/<name>.ts`
2. Entry in `registry.json` with `dependencies` and `registryDependencies` (shadcn built-ins by bare name, like `button`; `@drift-ui/` prefix only for drift-only items)
3. `components/preview/<name>-preview.tsx`, registered in `components/docs/preview-registry.tsx`
4. Category in `lib/catalog.ts`
5. Usage notes and snippet in `lib/agent-docs/component-usage.ts`, prop reference in `lib/agent-docs/component-api.ts`, and at least one example in `components/preview/examples/<name>/`
6. Tests in `tests/ui/<name>.test.tsx`, plus `tests/lib/<name>.test.ts` for lib code, covering keyboard interaction
7. A link in the README component table, at its catalog position, with the count updated

Insert at the alphabetical position in `registry.json`, `lib/catalog.ts` (within the category), `component-usage.ts` and `component-api.ts`, never at the end. Appending is what makes pull requests conflict, and `tests/lib/sorted-lists.test.ts` fails if a list is out of order. If a conflict still happens, keep both entries.

Before writing a component, read two existing ones that are close to it (for example `tags-input.tsx` and `stepper.tsx`) and match their structure. Rules that reviewers enforce:

- Controlled and uncontrolled support through `use-controllable-state`
- Accept `className` and spread remaining props onto the styled element
- Follow the WAI-ARIA pattern for the widget
- Colors come from theme tokens in `app/globals.css`, never hard-coded
- Primitives keep the exact shadcn/ui API
- Keep the scope to the issue. No drive-by refactors

### 5. Verify

All of these must pass before you open a pull request:

```bash
bun run typecheck && bun run lint && bun run test
```

For visual changes, run `bun dev`, open `/components/<name>`, and check light and dark mode. Attach a screenshot to the pull request.

### 6. Commit and open the pull request

Commits follow [Conventional Commits](https://www.conventionalcommits.org), scoped to the component: `feat(avatar-group): add overflow count`. One logical change per commit.

Ask the human before pushing or opening the pull request. Then:

```bash
git push -u origin HEAD
gh pr create --title "feat(avatar-group): add avatar group" --body-file pr-body.md
```

Write `pr-body.md` outside the repo, or delete it before committing. Base it on [.github/pull_request_template.md](.github/pull_request_template.md) and tick only what you actually ran. `Closes #<n>` must be in the body so the issue closes on merge.

### 7. Credit

`/contributors` reads GitHub's contributors API and ranks people by commits on main, so there is nothing to edit to credit yourself or anyone else. Merging a pull request is what adds its author. Only the two maintainers are listed in code, in `lib/contributors.ts`.

## Do not

- Push to `main` or force-push a shared branch
- Commit or hand-edit `public/r/*.json`
- Add dependencies without saying why in the pull request
- Work on more than one issue in a single pull request
