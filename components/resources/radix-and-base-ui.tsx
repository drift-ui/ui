import { DocSection } from "@/components/docs/doc-section"
import {
  Callout,
  CodeSample,
  Table,
} from "@/components/resources/article-blocks"
import { siteConfig } from "@/lib/site-config"

const PR = `${siteConfig.repo}/pull/23`
const ISSUE = `${siteConfig.repo}/issues/1`
const BASE_UI = "https://base-ui.com"
const GOOD_FIRST_ISSUES = `${siteConfig.repo}/labels/good%20first%20issue`

const REWRITES = `{ source: "/r/:style(base-[^/]+)/:name", destination: "/r/base/:name" },
{ source: "/r/:style/:name", destination: "/r/:name" },`

const TO_BASE_UI_ITEM = `export function toBaseUiItem(item) {
  const files = item.files.map((file) => ({
    ...file,
    path: baseUiSourcePath(file.path),
  }))
  const importsBaseUi = files.some((file) =>
    readFileSync(file.path, "utf8").includes('from "@base-ui/react/')
  )
  const dependencies = (item.dependencies ?? []).filter(
    (dependency) => dependency !== "radix-ui"
  )

  return {
    ...item,
    files,
    dependencies: importsBaseUi
      ? ["@base-ui/react", ...dependencies]
      : dependencies,
  }
}`

const SLOT_BUTTON = `function SlotButton({ asChild, children, ...props }) {
  return useRender({
    defaultTagName: "button",
    render: asChild ? children : undefined,
    props: asChild ? props : { ...props, children },
  })
}`

const VITEST_PROJECTS = `const baseUiAliases = readdirSync("registry/base/ui").map((file) => ({
  find: \`@/registry/default/ui/\${path.parse(file).name}\`,
  replacement: path.resolve("registry/base/ui", file),
}))

projects: [
  { test: { name: "radix", include: ["tests/**/*.test.{ts,tsx}"] } },
  {
    resolve: { alias: baseUiAliases },
    test: { name: "base", include: ["tests/ui/**/*.test.tsx"] },
  },
]`

export function RadixAndBaseUi() {
  return (
    <>
      <p>
        shadcn/ui now offers <a href={BASE_UI}>Base UI</a> styles next to its
        Radix ones. A project set up with <code>base-nova</code> has no{" "}
        <code>radix-ui</code> in its dependencies, and until October 28 our
        components would have added it.
      </p>
      <p>
        <a href={PR}>Pull request #23</a> fixed that and closed{" "}
        <a href={ISSUE}>issue #1</a>, the first one we filed. This post covers
        how one registry serves both libraries without keeping two copies of
        every component, and what we did to test both.
      </p>

      <DocSection id="one-command" title="One command, two builds">
        <p>You install a drift-ui component the same way on either library:</p>
        <CodeSample title="Terminal" code="npx shadcn add @drift-ui/stepper" />
        <p>
          The shadcn CLI requests <code>/r/{"{style}"}/stepper.json</code> and
          fills in the <code>style</code> from your <code>components.json</code>
          . Two rewrites in <code>next.config.ts</code> decide which build that
          URL serves:
        </p>
        <CodeSample title="next.config.ts" code={REWRITES} />
        <p>
          Any style starting with <code>base-</code> gets the Base UI build.
          Everything else, including <code>new-york</code>, gets Radix. You
          don’t pick a library at install time, because you already picked one
          when you set up the project.
        </p>
        <Callout title="If you still get Radix">
          <p>
            A <code>@drift-ui</code> entry under <code>registries</code> in your{" "}
            <code>components.json</code> overrides the shadcn directory. If it
            points at the older <code>/r/{"{name}"}.json</code> URL, you’ll keep
            getting Radix until you delete it.
          </p>
        </Callout>
      </DocSection>

      <DocSection id="which-files" title="Which files get a second copy">
        <p>
          The registry has 60 items. Only 13 files have a Base UI version, in{" "}
          <code>registry/base/ui</code>. The rest import nothing from Radix, so
          both builds ship the same file.
        </p>
        <Table label="Files with a Base UI version">
          <thead>
            <tr>
              <th>Files</th>
              <th>Why they need one</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>avatar</code>, <code>badge</code>, <code>button</code>,{" "}
                <code>dialog</code>, <code>label</code>, <code>popover</code>
              </td>
              <td>Primitives built directly on a Radix part</td>
            </tr>
            <tr>
              <td>
                <code>stepper</code>, <code>filter-menu</code>,{" "}
                <code>color-picker-controls</code>, <code>bulk-action-bar</code>
              </td>
              <td>drift components that import from Radix</td>
            </tr>
            <tr>
              <td>
                <code>tour</code>, <code>multi-select</code>,{" "}
                <code>mention-textarea</code>
              </td>
              <td>
                They use <code>PopoverAnchor</code>, and shadcn’s Base UI
                popover has no anchor
              </td>
            </tr>
          </tbody>
        </Table>
        <p>
          We left the Radix source in <code>registry/default</code> and didn’t
          move it to <code>registry/radix</code>. A move would have touched
          every import in the site and the tests, for no change in what anyone
          installs.
        </p>
      </DocSection>

      <DocSection id="derived" title="The Base UI registry is generated">
        <p>
          Nobody edits a second manifest. <code>bun run registry:build</code>{" "}
          maps every item in <code>registry.json</code> through one function,
          writes the result to <code>registry.base.json</code> (which is
          gitignored) and builds it to <code>public/r/base</code>.
        </p>
        <CodeSample title="lib/base-ui-registry.ts" code={TO_BASE_UI_ITEM} />
        <p>
          <code>baseUiSourcePath</code> swaps <code>registry/default/</code> for{" "}
          <code>registry/base/</code> when that file exists. The dependency list
          drops <code>radix-ui</code> and adds <code>@base-ui/react</code> only
          if a file imports it. The Base UI <code>label</code> is a plain{" "}
          <code>&lt;label&gt;</code>, so installing it adds neither package.
        </p>
      </DocSection>

      <DocSection
        id="shared-files"
        title="Changing files so they can be shared"
      >
        <p>
          Before adding copies, we checked which Radix imports could go. Five
          files changed so that one version works on both libraries:
        </p>
        <ul>
          <li>
            <code>file-dropzone</code> renders its progress bar as a{" "}
            <code>div</code> with <code>role=&quot;progressbar&quot;</code>.
          </li>
          <li>
            <code>tour-spotlight</code> portals with <code>react-dom</code>.
          </li>
          <li>
            <code>color-picker</code>, <code>date-time-range</code> and{" "}
            <code>filter-chip</code> style their <code>PopoverTrigger</code>{" "}
            with <code>buttonVariants</code> instead of wrapping a{" "}
            <code>Button</code> through <code>asChild</code>.
          </li>
        </ul>
        <p>
          <code>filter-chip</code> also needed both open-state selectors. Radix
          sets <code>data-state=&quot;open&quot;</code> and Base UI sets{" "}
          <code>data-popup-open</code>, so the class list has{" "}
          <code>data-[state=open]:bg-accent</code> and{" "}
          <code>data-popup-open:bg-accent</code> side by side.
        </p>
        <p>
          That changed the Radix output too. <code>file-dropzone</code> stopped
          depending on <code>radix-ui</code>, and <code>ColorPicker</code> lost
          an <code>asChild</code> prop that never did anything useful on a
          popover trigger.
        </p>
      </DocSection>

      <DocSection id="one-api" title="One API on both libraries">
        <p>
          Base UI composes with a <code>render</code> prop where Radix uses{" "}
          <code>asChild</code>. shadcn’s own Base UI primitives follow Base UI,
          so a Base UI <code>Button</code> takes <code>render</code>.
        </p>
        <p>
          drift’s own components keep the same props on both. Code written
          against <code>&lt;StepperNext asChild&gt;</code> shouldn’t break
          because the project moved libraries. The Base UI stepper maps{" "}
          <code>asChild</code> onto Base UI’s <code>useRender</code> hook:
        </p>
        <CodeSample title="registry/base/ui/stepper.tsx" code={SLOT_BUTTON} />
        <p>
          The same goes for the rest. <code>TourTarget</code> still wraps its
          child, <code>FilterMenuItem</code> still takes <code>onSelect</code>,
          and <code>FilterMenu</code> still takes <code>onCloseAutoFocus</code>.
          The three anchored components use <code>Popover.Positioner</code> from{" "}
          <code>@base-ui/react</code> directly to place their popups.
        </p>
      </DocSection>

      <DocSection id="testing" title="Testing both">
        <p>
          <code>bun run test</code> runs the UI tests twice. Vitest has a{" "}
          <code>radix</code> project and a <code>base</code> project, and the
          second one points each import of a file that has a Base UI copy at
          that copy:
        </p>
        <CodeSample title="vitest.config.ts" code={VITEST_PROJECTS} />
        <p>
          <code>bun run typecheck</code> does the same thing for types, with a
          second <code>tsc</code> pass through{" "}
          <code>tsconfig.base-ui.json</code>. And{" "}
          <code>tests/lib/base-ui-registry.test.ts</code> fails if any file in{" "}
          <code>public/r/base</code> mentions <code>radix-ui</code>, which is
          the bug we set out to fix.
        </p>
        <p>
          Four tests failed on Base UI the first time, and none of them were
          bugs in the components:
        </p>
        <Table label="Tests that changed for Base UI">
          <thead>
            <tr>
              <th>Test</th>
              <th>What was different</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>tour and filter-builder</td>
              <td>
                Base UI moves focus one frame after a popup opens, so the tests
                wait for focus before typing
              </td>
            </tr>
            <tr>
              <td>Linear stepper</td>
              <td>
                A disabled Base UI tab uses <code>aria-disabled</code> instead
                of <code>disabled</code>, so the test now checks that clicking a
                locked step does nothing
              </td>
            </tr>
            <tr>
              <td>
                <code>Button asChild</code>
              </td>
              <td>
                Skipped on Base UI, where <code>Button</code> takes{" "}
                <code>render</code>
              </td>
            </tr>
          </tbody>
        </Table>
      </DocSection>

      <DocSection id="docs-pages" title="Two pages per component">
        <p>
          Every component has a page for each library, at{" "}
          <code>/components/base/&lt;name&gt;</code> and{" "}
          <code>/components/radix/&lt;name&gt;</code>. Both are generated at
          build time, so the install note, dependency list and Source tab are
          already right when the page loads. If you visit{" "}
          <code>/components/&lt;name&gt;</code>, <code>proxy.ts</code> sends you
          to the library you picked last, which it reads from a cookie, or to
          Base UI if you haven’t picked one.
        </p>
      </DocSection>

      <DocSection id="gaps" title="What’s still different">
        <p>
          The Base UI primitives are ports of drift’s Radix primitives with the
          same classes. They aren’t copies of shadcn’s Base UI files. That
          doesn’t matter much in practice, because primitives install by bare
          name and a Base UI project gets shadcn’s own <code>button</code> and{" "}
          <code>popover</code>. But the preview on our site can look slightly
          different from what you get.
        </p>
        <p>React Aria was out of scope for the issue and still is.</p>
      </DocSection>

      <DocSection id="your-pr" title="If your component imports Radix">
        <p>
          Before you add a file to <code>registry/base/ui</code>, try the shared
          route first. Style a trigger with <code>buttonVariants</code>, portal
          with <code>react-dom</code>, or use a plain element with the right
          role. A second copy is a second file to keep in step, and review will
          ask whether you needed it.
        </p>
        <p>
          If you do need one, give it the same props as the Radix version and
          run <code>bun run test</code>. The <code>base</code> project picks the
          new file up on its own. Our{" "}
          <a href={GOOD_FIRST_ISSUES}>good first issues</a> are a smaller place
          to start.
        </p>
      </DocSection>
    </>
  )
}
