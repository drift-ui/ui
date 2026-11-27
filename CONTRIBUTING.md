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
2. Run `bun run format`, then make sure `bun run typecheck`, `bun run lint` and `bun run test` pass. Check your diff against [Automated review](#automated-review).
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

## Automated review

Two bots check every pull request. [cubic](https://cubic.dev) leaves line comments on each push, and Codecov reports how much of your diff the tests run. On the component pull requests from #155 to #177, cubic left 215 comments, and most of them repeat the mistakes below. Go through your diff with this list before you push.

### What cubic flags

Ordered by how often each came up.

| Area                    | What went wrong                                                                                                                                                                                                 | Check before pushing                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Docs that drift         | `component-api.ts`, `component-usage.ts`, `component-keyboard.ts` and example descriptions promised behavior the component lacks (#168 promised ReDoS protection) or left out public props (#167 `defaultOpen`) | Every exported prop and helper is in `component-api.ts` with its real type, written out (#160 shipped `...` inside a type). The keyboard table lists every key the component handles and none it ignores. Each example description claims only what that example shows. A usage snippet that passes a callback starts with `"use client"` (#155, #161). Lib files install to `@/lib/<name>`, so document that path (#156)                                                                 |
| Tests that can't fail   | Assertions checked that an element exists, or a test was named for a branch it never ran (#166, #168, #172)                                                                                                     | For each test, ask whether it would fail if you broke the behavior. Assert content, order and position. Use `toHaveBeenCalledTimes(1)` for one-action callbacks (#163). Assert what must be absent as well as present (#155). Check `aria-live` and `aria-checked`, not only text (#157, #161). Test keys, not only `user.click` (#161, #174). Use fake timers, never short real ones (#157). Don't depend on the runner's time zone (#160)                                               |
| Accessibility           | Ids collided between two instances, state was shown only visually, and focus was lost when a view changed                                                                                                       | Prefix ids and native radio `name`s with `useId()` (#161, #172). Link descriptions with `aria-describedby` (#161, #173). A checkmark needs `aria-checked` (#167), and a "copied" icon needs a polite status message (#162). An `aria-label` on a plain `div` needs `role="group"` (#165). Clamp `aria-valuenow` to the range (#173). Move focus when a view removes the focused element (#167). Internal buttons get `type="button"` (#166), and hidden form inputs get `disabled` (#167) |
| Previews that pretend   | A Copy button said "copied" without writing to the clipboard, action buttons had empty handlers (#157), and Reset left stale results on screen (#161, #163)                                                     | Every control in a preview and example does what its label says. Reset clears derived state too. Clean up timers and intervals on unmount and on reset                                                                                                                                                                                                                                                                                                                                    |
| Numeric props           | `columns={0}` and `slotMinutes={0}` looped forever (#163, #166), `Math.min(...data)` threw on 200,000 values (#156), and `duration: Infinity` overflowed `setTimeout` and fired at once (#157)                  | Decide what 0, negative numbers, `NaN` and `Infinity` do for each numeric prop, and test them. Find extremes with a loop instead of spreading the array                                                                                                                                                                                                                                                                                                                                   |
| Dates and time zones    | A DST gap scheduled reminders an hour early, calendar days were read in the wrong zone, and Sunday as weekday `0` failed a `>= 0` guard (#167). A leap-day cron ran past a five-year search cap (#160)          | Test one DST transition, one zone east of UTC+9, a Sunday, and February 29                                                                                                                                                                                                                                                                                                                                                                                                                |
| Prop spreading          | `{...props}` after internal handlers replaced them: a caller's `onKeyDown` disabled the keyboard logic (#171), and `inputProps` overwrote `className` and `aria-describedby` (#160, #168)                       | Spread consumer props first, then the component's own attributes. Compose event handlers and merge refs instead of overwriting them                                                                                                                                                                                                                                                                                                                                                       |
| Strings and object keys | `constructor` and `__proto__` passed as valid keys (#160, #161), search dropped non-ASCII queries (#162) and ignored accents (#171), and a copied cURL command left the method unquoted (#174)                  | Use `Object.hasOwn` when looking up user input, and a `Map` for records keyed by it. Normalize search text with NFD. Quote everything that goes into a shell command. Wrap `JSON.stringify` of unknown values in `try` (#174)                                                                                                                                                                                                                                                             |
| React                   | Reading `localStorage` in a `useState` initializer broke hydration (#166), and a new tuple on every render invalidated a `useMemo` (#156)                                                                       | Read browser storage in an effect after mount. Keep memo dependencies primitive or stable                                                                                                                                                                                                                                                                                                                                                                                                 |
| Tailwind                | `xs:` is not a breakpoint here, so a label never appeared (#174), and classes named tokens that don't exist (#176)                                                                                              | Use Tailwind's default breakpoints (`sm` and up) and only tokens defined in `app/globals.css`                                                                                                                                                                                                                                                                                                                                                                                             |

### Replying to cubic

- cubic reviews every push on its own. Don't comment `@cubic-dev-ai review`.
- Fix comments that are right. For one that is wrong or out of scope, reply in its thread with the reason and resolve it.
- A common false positive is "the Base UI file has no tests". `bun run test` runs `tests/ui` twice, and the `base` project in `vitest.config.ts` swaps `@/registry/default/ui/<name>` for the Base UI file, so importing through that path covers both.
- New code gets reviewed too. In #168, the worker added to answer a ReDoS comment drew six more comments, so leave time for a second round.

### Codecov

`codecov/patch` fails when the lines you changed are less covered than the project as a whole. The target is `auto`, which has been between 80% and 84% lately.

Nearly every miss from #155 to #177 was a partial branch, not a line that never ran: the kanban board had 41 partials and 2 missing lines (#172). Each `??`, `?.`, `||`, ternary, default parameter and early `return` has two sides, and Codecov wants a test that takes each one. Check your files before pushing:

```bash
bunx vitest run tests/ui/<name>.test.tsx tests/lib/<name>.test.ts --coverage \
  --coverage.include=registry/default/ui/<name>.tsx \
  --coverage.include=registry/default/lib/<name>-utils.ts \
  --coverage.reporter=text
```

Add an `--coverage.include` for the Base UI file, the preview and each example. `Uncovered Line #s` lists every line with an untaken branch.

- If a branch can't happen, delete it rather than writing a test to reach it.
- `components/**` counts. `tests/ui/component-examples.test.tsx` renders every example, but only a `tests/ui/<name>-examples.test.tsx` that clicks through the controls covers their handlers. See `icon-picker-examples.test.tsx`.

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
