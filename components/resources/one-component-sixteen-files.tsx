import { DocSection } from "@/components/docs/doc-section"
import {
  Callout,
  CodeSample,
  Table,
} from "@/components/resources/article-blocks"
import { siteConfig } from "@/lib/site-config"

const PR = `${siteConfig.repo}/pull/112`
const CONTRIBUTING = `${siteConfig.repo}/blob/main/CONTRIBUTING.md#adding-a-component`
const TREE_PATTERN = "https://www.w3.org/WAI/ARIA/apg/patterns/treeview/"
const GOOD_FIRST_ISSUES = `${siteConfig.repo}/labels/good%20first%20issue`

const REGISTRY_ENTRY = `{
  "name": "trace-waterfall",
  "type": "registry:ui",
  "title": "Trace Waterfall",
  "dependencies": ["lucide-react"],
  "registryDependencies": ["utils", "@drift-ui/use-controllable-state"],
  "files": [
    { "path": "registry/default/ui/trace-waterfall.tsx", "type": "registry:ui" },
    { "path": "registry/default/lib/trace-waterfall-utils.ts", "type": "registry:lib" }
  ]
}`

const CYCLE_TEST = `it("breaks multi-span parent cycles and promotes members to root level", () => {
  const cycleSpans: Span[] = [
    { id: "A", parentId: "B", name: "Span A", start: 0, duration: 10 },
    { id: "B", parentId: "A", name: "Span B", start: 10, duration: 10 },
  ]
  const ids = buildSpanTree(cycleSpans).map((t) => t.span.id)
  expect(ids).toContain("A")
  expect(ids).toContain("B")
})`

export function OneComponentSixteenFiles() {
  return (
    <>
      <p>
        When you run <code>npx shadcn add</code> for the trace waterfall, two
        files land in your project. The pull request that added it changed 16.
      </p>
      <p>
        If you’re planning to add a component to drift-ui, the other 14 are the
        part that surprises people. This post walks through{" "}
        <a href={PR}>pull request #112</a> by Syed Fahad Junaid, file by file,
        and then through the six things review caught before it merged.
      </p>

      <DocSection id="the-pr" title="The pull request">
        <p>
          The trace waterfall shows the spans of one request as a collapsible
          tree, with a bar for each span on a shared timeline. It’s the view
          you’d see in Jaeger or Honeycomb when a request is slow and you want
          to know which call took the time.
        </p>
        <p>
          The pull request opened on November 8 and merged the next morning. It
          added 1,589 lines across 16 files. 593 of those lines are the
          component itself. 556 are tests.
        </p>
      </DocSection>

      <DocSection id="the-files" title="Where the 16 files go">
        <Table label="Files changed in pull request #112">
          <thead>
            <tr>
              <th>File</th>
              <th>What it does</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>registry/default/ui/trace-waterfall.tsx</code>
              </td>
              <td>The component people install, 356 lines</td>
            </tr>
            <tr>
              <td>
                <code>registry/default/lib/trace-waterfall-utils.ts</code>
              </td>
              <td>Pure functions behind it, 237 lines</td>
            </tr>
            <tr>
              <td>
                <code>registry.json</code>
              </td>
              <td>Tells the shadcn CLI what to install</td>
            </tr>
            <tr>
              <td>
                <code>tests/lib/</code> and <code>tests/ui/</code>
              </td>
              <td>15 tests for the logic, 7 for the rendered component</td>
            </tr>
            <tr>
              <td>
                <code>components/preview/</code>, four example files and{" "}
                <code>preview-registry.tsx</code>
              </td>
              <td>The live demo and examples on the docs page</td>
            </tr>
            <tr>
              <td>
                <code>lib/catalog.ts</code>
              </td>
              <td>Puts it in the Structure category</td>
            </tr>
            <tr>
              <td>
                <code>lib/component-keyboard.ts</code>
              </td>
              <td>The keyboard table on the docs page</td>
            </tr>
            <tr>
              <td>
                <code>component-usage.ts</code> and{" "}
                <code>component-api.ts</code>
              </td>
              <td>
                Notes and props for coding agents, served at{" "}
                <code>/llms.txt</code>
              </td>
            </tr>
            <tr>
              <td>
                <code>README.md</code>
              </td>
              <td>
                A link in the component table, and the count from 50 to 51
              </td>
            </tr>
          </tbody>
        </Table>
        <p>
          Most of these are one-line additions. <code>catalog.ts</code> got one
          line and <code>preview-registry.tsx</code> got two. They still matter,
          because without them the component builds but never shows up on the
          site.
        </p>
        <Callout title="Insert, don’t append">
          <p>
            Every list here is alphabetical, and{" "}
            <code>tests/lib/sorted-lists.test.ts</code> fails if one isn’t. The
            trace waterfall went between <code>timeline</code> and{" "}
            <code>tree-view</code>. When two people append to the end of the
            same list, their pull requests conflict.
          </p>
        </Callout>
      </DocSection>

      <DocSection id="split-logic" title="Why the logic is a separate file">
        <p>
          The lib file has no React in it. It turns a flat list of spans into a
          tree, works out where the timeline starts and ends, picks tick marks
          and formats durations like 840 µs or 1.2 s.
        </p>
        <p>
          Splitting it out made most of the testing cheap. 15 of the 22 tests
          call plain functions with plain data, so they don’t render anything or
          simulate clicks. The 7 UI tests are left for what only a browser can
          show, like keyboard focus and expand state.
        </p>
      </DocSection>

      <DocSection id="registry-entry" title="The registry entry">
        <CodeSample title="registry.json" code={REGISTRY_ENTRY} />
        <p>
          <code>dependencies</code> lists npm packages, here only{" "}
          <code>lucide-react</code> for the chevron icons.{" "}
          <code>registryDependencies</code> lists other registry items. shadcn
          built-ins like <code>utils</code> go in by bare name, and items that
          only drift-ui has get the <code>@drift-ui/</code> prefix. Get one of
          these wrong and the install works on your machine, where the file
          already exists, and fails on someone else’s.
        </p>
      </DocSection>

      <DocSection id="keyboard" title="The keyboard map">
        <p>
          A trace is a tree, so the component follows the{" "}
          <a href={TREE_PATTERN}>WAI-ARIA tree view pattern</a>. Up and Down
          move between visible spans. Right expands a span, and pressing it
          again moves into the first child. Left does the reverse. Home and End
          jump to the first and last span, and Enter or Space selects one.
        </p>
        <p>
          Those five bindings live in <code>component-keyboard.ts</code> as
          data, and the docs page renders them as a table. If the component and
          the table disagree, the docs are wrong, so they’re worth checking
          against each other before you open the pull request.
        </p>
      </DocSection>

      <DocSection id="review" title="What review caught">
        <p>
          cubic, the review bot on this repo, left six comments on the first
          version. Fahad fixed all six in one follow-up commit and replied to
          each one with what changed.
        </p>
        <Table label="Review comments on pull request #112">
          <thead>
            <tr>
              <th>Comment</th>
              <th>What would have happened</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Parent cycles</td>
              <td>
                Spans where A’s parent is B and B’s parent is A disappeared from
                the tree
              </td>
            </tr>
            <tr>
              <td>
                <code>NaN</code> start or duration
              </td>
              <td>
                Bars rendered with a width of <code>NaN%</code>
              </td>
            </tr>
            <tr>
              <td>Start time in the label</td>
              <td>
                A span drawn at 0 ms was announced to screen readers as starting
                at 100 ms
              </td>
            </tr>
            <tr>
              <td>Focus after clicking the expander</td>
              <td>Keyboard focus got stuck on a hidden button</td>
            </tr>
            <tr>
              <td>Controlled mode</td>
              <td>No test passed in expanded or selected state from outside</td>
            </tr>
            <tr>
              <td>
                <code>attributes</code> field
              </td>
              <td>The API reference left out part of the span type</td>
            </tr>
          </tbody>
        </Table>
        <p>
          The first one is the most interesting. The code already handled a span
          that names itself as its parent. It didn’t handle a loop of two. Each
          span was waiting to be attached under the other, so neither was a
          root, and the tree came out empty. Real tracing data can do this when
          span IDs collide.
        </p>
        <p>The fix walks up from each span and stops if it sees an ID twice:</p>
        <CodeSample
          title="tests/lib/trace-waterfall.test.ts"
          code={CYCLE_TEST}
        />
        <p>
          The label bug came from the same shortcut in two places. The bars were
          positioned relative to the earliest span, but the accessible name used
          the raw start time. Sighted users and screen reader users were reading
          different numbers off the same chart.
        </p>
      </DocSection>

      <DocSection id="your-pr" title="If you’re adding one">
        <p>
          The full list is in <a href={CONTRIBUTING}>Adding a component</a> in
          CONTRIBUTING.md. Before you start, read two components close to yours.
          Fahad’s is a good one to read if you’re building anything tree-shaped,
          and <code>tags-input.tsx</code> is a good one for inputs.
        </p>
        <p>
          You don’t need to start with a whole component. A missing keyboard
          binding or a wrong line in the API reference is a real fix and a
          smaller first pull request. Our{" "}
          <a href={GOOD_FIRST_ISSUES}>good first issues</a> include both kinds.
        </p>
      </DocSection>
    </>
  )
}
