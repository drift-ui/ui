# Contributing to drift-ui

drift-ui is a set of components shadcn/ui doesn't ship, like tags inputs, tree views and diff viewers. People install them into their own apps with the shadcn CLI, so what you write here runs in other people's products.

You don't need open source experience to start. A maintainer reads every pull request and will tell you what to change. Once your first one merges, your GitHub handle goes on the [contributors page][contributors], and you can ask for the Contributor role on [Discord][discord].

## Your first contribution

1. Pick one of the [good first issues][good-first-issues]. Each one lists the files involved and what done looks like.
2. Comment on the issue to claim it, after checking that nobody else has.
3. [Set up the project](#setup), make the change, and [open a pull request](#opening-a-pull-request).

> [!TIP]
> Stuck? Ask on the issue or in [Discord][discord], or open a draft pull request with what you have and ask there.

Work comes in three sizes, and it's fine to start with the smallest:

| Size   | Work                            | What it takes                                                                                          |
| ------ | ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Small  | New example or docs fix         | One file and a list entry: [the steps](#adding-an-example)                                             |
| Medium | [Bug][bugs] fix                 | Reproduce it, add a failing test, fix it                                                               |
| Large  | [New component][new-components] | The [full checklist](#adding-a-component), after claiming an issue or [requesting it][issue-templates] |

## Setup

You need [Bun](https://bun.sh) 1.2 or newer. [Fork the repo][fork], then clone your fork:

```bash
git clone https://github.com/<your-username>/ui.git
cd ui
bun install
bun run registry:build
bun dev
```

The site runs at <http://localhost:3000>, and each component has a page at `/components/<name>`.

## Adding an example

Examples are the live demos below the main preview on a component's page.

| Step | Do this                                                                                                                            |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Add `components/preview/examples/<name>/<example>.tsx`. Copy the shape of a file next to it, and keep the demo short and realistic |
| 2    | List it in that folder's `index.ts` with an `id`, a `title` and a one-sentence `description`                                       |
| 3    | Open `/components/<name>` and check it in light and dark mode                                                                      |

The page finds the folder by name, so no other file changes.

> [!NOTE]
> If the component has a folder in `components/preview/base/examples/`, add the same example there and set `BasePreview` on its entry. Avoid `asChild` on shared primitives in other examples, since Base UI uses `render`.

## Opening a pull request

1. Branch from `main` in your fork as `<type>/<issue>-<slug>`, for example `feat/14-avatar-group` or `fix/31-stepper-focus-ring`.
2. Run `bun run format`, then make sure `bun run typecheck`, `bun run lint` and `bun run test` pass.
3. Open the pull request and fill in the template. Put `Closes #<issue>` in the description, and add a screenshot or a short recording for visual changes.

New to pull requests from a fork? GitHub has a [walkthrough][fork-pr-guide]. If nobody has replied after a few days, say so in Discord.

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org), with the component name as the scope when the change is limited to one component. Keep one logical change per commit:

```text
feat(tags-input): add paste support
fix(tree-view): keep focus on the collapsed branch
test(time-field): cover segment editing
```

> [!IMPORTANT]
> Commit with an email linked to your GitHub account. That's how the [contributors page][contributors] matches your commits to you. It ranks people by commits on main and can take a few hours to update after a merge.

## Adding a component

> [!TIP]
> Read two existing components close to yours first, such as `tags-input.tsx` and `stepper.tsx`, and match their structure.

| Step | File                                    | What goes in it                                                     |
| ---- | --------------------------------------- | ------------------------------------------------------------------- |
| 1    | `registry/default/ui/<name>.tsx`        | The component source                                                |
| 2    | `registry/default/lib/<name>-utils.ts`  | Pure logic such as parsing, math or state machines, if there is any |
| 3    | `registry.json`                         | An item with its `dependencies` and `registryDependencies`          |
| 4    | `components/preview/<name>-preview.tsx` | A short, realistic live demo                                        |
| 5    | `components/docs/preview-registry.tsx`  | Register the preview                                                |
| 6    | `lib/catalog.ts`                        | A category for the component                                        |
| 7    | `components/preview/examples/<name>/`   | [At least one example](#adding-an-example)                          |
| 8    | `lib/agent-docs/component-usage.ts`     | Usage notes and a usage snippet                                     |
| 9    | `lib/agent-docs/component-api.ts`       | The prop reference                                                  |
| 10   | `tests/ui/<name>.test.tsx`              | Tests, including keyboard interaction                               |
| 11   | `tests/lib/<name>.test.ts`              | Tests for the lib file, if you added one                            |
| 12   | `registry/base/ui/<name>.tsx`           | A [Base UI version](#base-ui-versions), if it needs one             |
| 13   | `README.md`                             | A link in the component table, under its category                   |

> [!WARNING]
> `public/r` is generated by `bun run registry:build` and gitignored, so it never goes in a pull request.

<details>
<summary>Imports, registry dependencies and what each file feeds</summary>

- Import helpers through `@/registry/default/...`. The docs site rewrites these paths to `@/components/ui/...` and `@/lib/...` when it shows the source to users.
- Depend on shadcn's built-in items by bare name (`utils`, `button`, `badge`, `input`, `label`, `popover`) so installing never overwrites a user's existing primitives.
- Use the `@drift-ui/` prefix only for items that exist nowhere else, such as `@drift-ui/use-controllable-state`.
- Pure logic lives in `registry/default/lib` so it can be tested without rendering.
- The preview is the live demo and the usage example on the docs page.
- The `/components/<name>` page is generated from `preview-registry.tsx` and `catalog.ts`.
- `component-usage.ts` and `component-api.ts` feed the docs page, `/llms.txt` and `/llms-full.txt`.
- `bun run test` runs `tests/ui` once against Radix and once against Base UI.

</details>

### Component guidelines

| Area          | Rule                                                                                                                                                                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| State         | Support controlled and uncontrolled use. `use-controllable-state` handles the `value`, `defaultValue` and `onValueChange` trio                                                                                                                                                     |
| Props         | Spread remaining props onto the element a user expects to style, and accept `className`                                                                                                                                                                                            |
| Accessibility | Follow the WAI-ARIA pattern for the widget and test keyboard interaction, not only clicks                                                                                                                                                                                          |
| Color         | Read colors from the theme tokens in `app/globals.css`. Do not hard-code colors                                                                                                                                                                                                    |
| Shape         | Use `h-control`, `h-control-sm`, `rounded-control`, `rounded-box` and `shadow-control` for fields and buttons, and `rounded-card`, `py-card`, `px-card`, `gap-card`, `shadow-card` and `rounded-dialog` for cards and dialogs, and add `@drift-ui/shape` to `registryDependencies` |
| Primitives    | If shadcn/ui already ships a component, keep its API identical                                                                                                                                                                                                                     |

### Base UI versions

The Base UI build at `/r/base` uses a file from `registry/base` wherever one exists and the `registry/default` file everywhere else.

| If the component                                                                      | Then                                                                 |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Imports `radix-ui`, or passes `asChild` or `PopoverAnchor` to a shadcn primitive      | Write a version with the same props at `registry/base/ui/<name>.tsx` |
| Only needs a few lines of React, such as a `role="progressbar"` div or `createPortal` | Write that instead so the file stays shared                          |

### Avoiding merge conflicts

Insert at your alphabetical position in `registry.json`, `lib/catalog.ts` (within the category), `component-usage.ts` and `component-api.ts`. Appending makes two pull requests conflict at the same spot, and `tests/lib/sorted-lists.test.ts` fails if a list is out of order. If two components sort next to each other and you still get a conflict, keep both entries.

## Code style

Prettier and ESLint settle formatting. Tailwind classes are sorted by `prettier-plugin-tailwindcss`, so do not reorder them by hand.

<details>
<summary>All scripts</summary>

| Command                  | What it does                                   |
| ------------------------ | ---------------------------------------------- |
| `bun dev`                | Start the Next.js dev server                   |
| `bun run registry:build` | Rebuild `public/r/*.json` from `registry.json` |
| `bun run test`           | Build the registry, then run Vitest once       |
| `bun run test:watch`     | Run Vitest in watch mode                       |
| `bun run typecheck`      | Type-check the project with `tsc --noEmit`     |
| `bun run lint`           | Run ESLint                                     |
| `bun run format`         | Format `.ts` and `.tsx` files with Prettier    |
| `bun run build`          | Build the registry, then the production site   |

</details>

## Working with coding agents

[AGENTS.md](AGENTS.md) holds the issue-to-pull-request workflow for coding agents such as Claude Code, Codex, Cursor and Copilot. In Claude Code, run `/work-on-issue <number>`. Review agent output the same way you would review your own code before opening the pull request.

## Reporting bugs and requesting components

Use the [issue templates][issue-templates], and include:

| Reporting       | Include                                                              |
| --------------- | -------------------------------------------------------------------- |
| A bug           | The component, the browser, and the smallest steps that reproduce it |
| A new component | The job it does on a real screen, and links to any prior art         |

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).

[bugs]: https://github.com/drift-ui/ui/labels/bug
[contributors]: https://drift-ui.dev/contributors
[discord]: https://discord.gg/tJH3dC8Exz
[fork]: https://github.com/drift-ui/ui/fork
[fork-pr-guide]: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork
[good-first-issues]: https://github.com/drift-ui/ui/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22
[issue-templates]: https://github.com/drift-ui/ui/issues/new/choose
[new-components]: https://github.com/drift-ui/ui/labels/new%20component
