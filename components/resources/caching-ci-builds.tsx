import { DocSection } from "@/components/docs/doc-section"
import {
  Callout,
  CodeSample,
  Table,
} from "@/components/resources/article-blocks"
import { siteConfig } from "@/lib/site-config"

const PR = `${siteConfig.repo}/pull/158`
const NEXT_GUIDE =
  "https://nextjs.org/docs/pages/guides/ci-build-caching#github-actions"
const ACTIONS_CACHE = "https://github.com/actions/cache"

const CACHE_STEP = `- uses: oven-sh/setup-bun@v2

- uses: actions/cache@v6
  with:
    path: |
      ~/.bun/install/cache
      \${{ github.workspace }}/.next/cache
    key: \${{ runner.os }}-nextjs-\${{ hashFiles('bun.lock') }}-\${{ hashFiles('**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx') }}
    restore-keys: |
      \${{ runner.os }}-nextjs-\${{ hashFiles('bun.lock') }}-

- run: bun install --frozen-lockfile`

const SAVE_ON_MAIN = `- uses: actions/cache/restore@v6
  with:
    path: |
      ~/.bun/install/cache
      \${{ github.workspace }}/.next/cache
    key: \${{ runner.os }}-nextjs-\${{ hashFiles('bun.lock') }}-\${{ github.sha }}
    restore-keys: |
      \${{ runner.os }}-nextjs-\${{ hashFiles('bun.lock') }}-

# install, check, test and build as before

- if: github.event_name == 'push'
  uses: actions/cache/save@v6
  with:
    path: |
      ~/.bun/install/cache
      \${{ github.workspace }}/.next/cache
    key: \${{ runner.os }}-nextjs-\${{ hashFiles('bun.lock') }}-\${{ github.sha }}`

export function CachingCiBuilds() {
  return (
    <>
      <p>
        drift-ui’s CI workflow is one job: install, format check, typecheck,
        lint, tests with coverage, then <code>next build</code>. On November 13
        we merged <a href={PR}>pull request #158</a>, which adds a cache step so
        the build can reuse its work from earlier runs.
      </p>
      <p>
        Four days and 39 runs later, the build step was 10 seconds faster and
        the job as a whole was about 9 seconds slower. This post shows the
        numbers and where the extra time goes.
      </p>

      <DocSection id="the-change" title="The change">
        <p>
          Since Next.js 16.3, Turbopack’s filesystem cache is on for builds, and
          it lives in <code>.next/cache</code>. A GitHub Actions runner starts
          empty, so before #158 every build began from nothing. The fix is the
          snippet from the <a href={NEXT_GUIDE}>Next.js CI caching guide</a>,
          with two changes for Bun:
        </p>
        <CodeSample title=".github/workflows/ci.yml" code={CACHE_STEP} />
        <p>
          The key hashes <code>bun.lock</code> where the guide hashes{" "}
          <code>package-lock.json</code>, and it caches{" "}
          <code>~/.bun/install/cache</code> in place of <code>~/.npm</code>. The
          step also runs before <code>bun install</code>, so the Bun cache is
          back in place before the install needs it, and{" "}
          <code>node_modules</code> doesn’t exist yet when <code>**/*.ts</code>{" "}
          gets hashed.
        </p>
      </DocSection>

      <DocSection id="the-key" title="How the key works">
        <p>
          The key has three parts: the runner OS, a hash of{" "}
          <code>bun.lock</code>, and a hash of every JavaScript and TypeScript
          file in the repo. Almost every commit changes a source file, so a run
          almost never finds an exact match for its key.
        </p>
        <p>
          That’s what <code>restore-keys</code> is for. When the exact key
          misses, the action looks for the newest cache whose key starts with
          the OS and lockfile hash, and restores that one. Turbopack then
          rebuilds only what changed since that cache was saved.
        </p>
        <p>
          A pull request can restore caches saved on its own branch or on{" "}
          <code>main</code>, but not ones saved by other pull requests. In
          practice, the first run on a new branch starts from the latest{" "}
          <code>main</code> build.
        </p>
      </DocSection>

      <DocSection id="the-numbers" title="Before and after">
        <p>
          We pulled step timings for every successful CI run from the GitHub
          Actions API. “Before” is 231 runs from October 28 to the merge on
          November 13. “After” is the 39 runs from the merge to November 17.
          Each figure is a median, in seconds.
        </p>
        <Table label="Median step times before and after the cache">
          <thead>
            <tr>
              <th>Step</th>
              <th>Before</th>
              <th>After</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Restore cache</td>
              <td>none</td>
              <td>6</td>
            </tr>
            <tr>
              <td>
                <code>bun install</code>
              </td>
              <td>3</td>
              <td>1</td>
            </tr>
            <tr>
              <td>Turbopack compile, inside the build</td>
              <td>11.7</td>
              <td>4.3</td>
            </tr>
            <tr>
              <td>Build</td>
              <td>38</td>
              <td>28</td>
            </tr>
            <tr>
              <td>Save cache</td>
              <td>none</td>
              <td>15</td>
            </tr>
            <tr>
              <td>Test</td>
              <td>88</td>
              <td>131</td>
            </tr>
            <tr>
              <td>Whole job</td>
              <td>164</td>
              <td>222</td>
            </tr>
          </tbody>
        </Table>
        <p>
          The compile time comes from the “Compiled successfully in” line that{" "}
          <code>next build</code> prints. On a cache hit it dropped from 11.7 to
          4.3 seconds. On the four runs that missed, it was 11.2, the same as
          before.
        </p>
        <Callout title="Why the whole job got longer">
          <p>
            The test step grew from 88 to 131 seconds over the same weeks,
            because components kept landing with their tests. The cache doesn’t
            touch tests, so the whole-job row mixes the two changes. Compare the
            cache rows and the build row on their own.
          </p>
        </Callout>
      </DocSection>

      <DocSection id="misses" title="The four misses">
        <p>
          35 of the 39 runs restored a cache. All four misses happened on
          November 13, within 20 minutes of the merge:
        </p>
        <ul>
          <li>
            The first <code>main</code> run after the merge, when no cache
            existed yet.
          </li>
          <li>
            A Renovate pull request that started before that <code>main</code>{" "}
            run had finished saving.
          </li>
          <li>
            The toast pull request, which added a dependency. A new{" "}
            <code>bun.lock</code> means a new hash, so no saved key matches even
            the prefix.
          </li>
          <li>
            The <code>main</code> run after the toast merge, for the same
            reason.
          </li>
        </ul>
        <p>
          After that, every run until November 17 restored a cache. A miss only
          costs the time the build took before the cache existed.
        </p>
      </DocSection>

      <DocSection id="the-cost" title="Where the time goes">
        <p>
          The cache saves about 12 seconds a run: 10 in the build and 2 in the
          install. Restoring it takes 6 seconds and saving it takes 15, so each
          run comes out about 9 seconds behind.
        </p>
        <p>
          The save is the expensive part. Because the key includes a hash of
          every source file, each run has a key nobody has used, and the action
          uploads a new entry at the end. All 39 runs saved one, between 318 and
          510 MB each, with a median of 376 MB.
        </p>
        <p>
          That also fills the repo’s cache storage. GitHub’s default limit is 10
          GB per repository, which holds about 27 entries of that size. Past
          that, GitHub evicts the least recently used entries. Most entries come
          from pull request branches, and only later runs on the same branch can
          restore them.
        </p>
      </DocSection>

      <DocSection id="next-change" title="What the numbers point to">
        <p>
          Pull requests restore from <code>main</code> anyway, so they don’t
          need to save their own cache.{" "}
          <a href={ACTIONS_CACHE}>actions/cache</a> has separate{" "}
          <code>restore</code> and <code>save</code> actions for this. Every run
          restores, and only pushes to <code>main</code> save:
        </p>
        <CodeSample title=".github/workflows/ci.yml" code={SAVE_ON_MAIN} />
        <p>
          That should take the 15-second save off every pull request run. The
          trade is that a second push to the same branch restores{" "}
          <code>main</code>’s cache instead of its own, so Turbopack may have a
          little more to rebuild. The key uses the commit SHA, since a hash of
          the source files no longer does anything there. We haven’t made this
          change yet. When we do, we’ll measure it the same way.
        </p>
      </DocSection>

      <DocSection id="your-pr" title="What this means for your PR">
        <p>
          Nothing, in most cases. Your first run restores the latest{" "}
          <code>main</code> build, and later pushes to the same branch restore
          your own.
        </p>
        <p>
          If your pull request adds or updates a dependency,{" "}
          <code>bun.lock</code> changes and the first run builds from scratch.
          That’s expected, and it doesn’t mean CI is broken. If a run fails, the
          cache is rarely the cause. Look at the failing step’s log first.
        </p>
      </DocSection>
    </>
  )
}
