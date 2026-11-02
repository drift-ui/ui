# drift-ui

![drift-ui, the components shadcn left out](public/brand/exports/drift-ui-github-social-1280x640.png)

A shadcn-compatible component registry built on React 19, Tailwind v4, and Radix or Base UI. It covers the components shadcn/ui leaves out, like a tags input, stepper, tree view and file dropzone, and installs them with the shadcn CLI.

Browse the live previews at [drift-ui.dev](https://drift-ui.dev).

## Components

Components are grouped into inputs, structure, workflow and primitives. The primitives have the same API as their shadcn/ui counterparts, so skip any you already have. Every component has a live preview, its source and install steps at [`/components/<name>`](https://drift-ui.dev/components).

## Usage

In a project that already ran `npx shadcn init`, install the theme and any component:

```bash
npx shadcn add @drift-ui/theme @drift-ui/tags-input @drift-ui/tree-view
```

`@drift-ui` is listed in the [shadcn registry directory](https://ui.shadcn.com/docs/directory), so the CLI knows the namespace without any setup. Registry dependencies such as `utils`, `button` and `use-controllable-state` are installed automatically.

The CLI picks a build from the `style` in your `components.json`. A `base-` style such as `base-nova` gets the Base UI build, which never installs `radix-ui`, and any other style gets Radix. A `@drift-ui` entry under `registries` in `components.json` overrides the directory, so if you registered the older `/r/{name}.json` URL you will keep getting Radix until you delete that entry.

### For AI agents

The site serves [`/llms.txt`](https://drift-ui.dev/llms.txt) with an index of the registry and [`/llms-full.txt`](https://drift-ui.dev/llms-full.txt) with install commands, usage notes and examples for every component.

## Develop

```bash
git clone https://github.com/localhostd3veloper/drift-ui.git
cd drift-ui
bun install
bun run registry:build
bun dev
```

The site runs at <http://localhost:3000> and the built registry at <http://localhost:3000/r/{name}.json>.

| Command                  | What it does                                   |
| ------------------------ | ---------------------------------------------- |
| `bun dev`                | Start the dev server                           |
| `bun run registry:build` | Rebuild `public/r/*.json` from `registry.json` |
| `bun run test`           | Run the Vitest suite                           |
| `bun run typecheck`      | Type-check with `tsc --noEmit`                 |
| `bun run lint`           | Run ESLint                                     |
| `bun run format`         | Format with Prettier                           |
| `bun run build`          | Build the registry, then the production site   |

## Layout

```text
registry.json                  item manifest read by `shadcn build`
registry/default/ui/*.tsx      component source
registry/default/lib/*.ts      cn() helper and pure logic behind components
registry/default/hooks/*.ts    shared hooks such as use-controllable-state
components/preview/*           live demos, also used as usage examples in the docs
components/docs/*              docs site UI
components/landing/*           landing page sections
lib/catalog.ts                 component categories, alphabetical within each
lib/agent-docs/*               content for /llms.txt and /llms-full.txt
tests/                         Vitest suites for components and lib code
public/r/*.json                gitignored build output, served as static files
```

## Contributing

Bug reports, component requests and pull requests are welcome. Open an [issue](https://github.com/localhostd3veloper/drift-ui/issues/new/choose) to report a bug or request a component. Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, the steps to add a component, and the commit conventions. Coding agents start from [AGENTS.md](AGENTS.md). Everyone with a merged pull request is listed on the [contributors page](https://drift-ui.dev/contributors).

## License

[MIT](LICENSE)
