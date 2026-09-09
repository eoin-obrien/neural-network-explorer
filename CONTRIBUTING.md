# Contributing

## Setup

```sh
corepack enable
pnpm install
pnpm exec playwright install --with-deps chromium
```

`pnpm install` runs Husky, which installs the `commit-msg` hook.

## Quality gates

```sh
pnpm check    # formatting, docs, spelling, types, lint, architecture, knip, tests, build, size
pnpm verify   # pnpm check, then Playwright and Axe
```

CI is authoritative. Run `pnpm check` before every commit and `pnpm verify`
before anything that changes browser behaviour or deployment.

Do not respond to a failing gate by weakening it. If a rule is genuinely wrong
for this repository, change the rule deliberately and say why in the commit.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), enforced by
Commitlint locally and in CI:

```text
<type>[optional scope][!]: <description>
```

```text
feat(charts): add reachable range scaling
fix(domain): preserve excluded unit parameters
test(activation): cover leaky ReLU negative branch
```

Subjects are limited to 72 characters. Scopes name a concept — `domain`,
`activation`, `charts`, `ui`, `test`, `docs`, `ci`, `tooling` — not a ticket.

`main` is squash-merged, so the pull-request title becomes the commit subject on
`main` and is linted by CI too.

## Deliberate deviations

These are decisions, not oversights. Revisit them rather than copying them.

- **TypeScript 5.9.3, not 6.x.** TypeScript 7 is the hard constraint: `latest`
  is already 7.x and falls outside `typescript-eslint`'s supported range
  (`>=4.8.4 <6.1.0`), so adopting it would cost type-aware linting, which is a
  requirement. TypeScript 6.0.3 is inside that range, and the reason it was
  refused no longer holds: it failed with `TS2320` across roughly twenty
  `@mantine/core` 9.6.0 input components, and those errors reached the build
  only because the application project kept `skipLibCheck: false`. It no longer
  does — see the next entry — so a TypeScript 6 bump is now an open question
  rather than a blocked one, and should be evaluated on its own merits.
- **`skipLibCheck` is `true` for both projects.** `tsconfig.node.json` has
  always needed it: Vite and Vitest publish `.d.ts` files that do not survive
  `exactOptionalPropertyTypes`, and one references a module pnpm does not
  hoist. `tsconfig.app.json` joined it at Gate 3, when the charts arrived.
  Mantine Charts pulls in Recharts, whose transitive `@reduxjs/toolkit` ships
  declarations written without `exactOptionalPropertyTypes` in mind: six errors
  in `dist/index.d.mts`, five of them `ThunkApiConfig` constraint failures and
  one a `TaskAbortError` that declares `code?: string` against a
  `SerializedError` requiring `code: string`. Every one is inside
  `node_modules` and none in this source tree, and all six disappear when
  `exactOptionalPropertyTypes` is turned off, so they are a strictness mismatch
  rather than a broken dependency. Both the resolved 2.9.0 and the latest
  2.12.0 were checked under a pnpm override and behave identically, so pinning
  buys nothing. Application code keeps every strict flag,
  `exactOptionalPropertyTypes` included. What is lost is the early warning that
  caught the Mantine declaration breakage above, so a dependency bump that
  breaks types will now surface at the point of use rather than at the point of
  upgrade. Turning it on also made `ESNext.Collection` and `ESNext.Float16`
  redundant in `tsconfig.app.json#lib`; both were there only to satisfy
  declarations that are no longer checked.
- **`eslint-plugin-jsx-a11y` declares support only up to ESLint 9.** ESLint 9 is
  end-of-life, so this repository runs ESLint 10 and records the override in
  `pnpm.peerDependencyRules`. The plugin was verified to lint correctly under
  ESLint 10.
- **`CLAUDE.md` and `IMPLEMENTATION.md` are excluded from Prettier and
  markdownlint.** They embed raw LaTeX display math, which is not Markdown:
  Prettier rewrites a leading `+ \sum ...` into a list bullet and corrupts the
  equations. Every other Markdown file is fully gated.
- **`src/main.tsx` is excluded from coverage.** It is the DOM bootstrap. All
  other source is held to 100% statements, branches, functions, and lines.
- **Mutation testing is not configured yet.** Per IMPLEMENTATION.md it is
  introduced after Gate 2. The domain now exists, so this is the next piece of
  tooling owed rather than a standing decision.
- **The bundle budget jumped at Gate 3.** The gzip JavaScript limit went from
  80 kB to 245 kB against a measured 232.0 kB. Mantine Charts and its Recharts
  dependency tree — Redux Toolkit, Immer, `es-toolkit`, and the d3 modules
  behind `victory-vendor` — account for essentially all of it. The budget was
  re-measured, not estimated; treat any further increase the same way.
- **`knip --production` reports `reachableRange` as unused.** It is Gate 1 work
  whose consumer is the reachable scale mode at Gate 5; Gate 3 ships the fixed
  teaching scale only. `src/testSetup.ts` is likewise reported, because it is
  the test harness and `--production` excludes test entries. Plain `pnpm knip`,
  which is what CI runs, is clean.

## Licence obligations

The project is AGPL-3.0-or-later. Section 13 requires that anyone who interacts
with a modified version over a network be offered its corresponding source, so
the deployed interface must carry a visible link to the repository. The header
carries that link; keep it visible in any future layout.

## Pages and DNS

One-time setup, outside the repository:

1. **Settings → Pages → Build and deployment → Source**: GitHub Actions.
2. **Settings → Pages → Custom domain**: `nn.eoin.ai`.
3. At the DNS provider for `eoin.ai`, add a `CNAME` record for `nn` pointing at
   `<github-user>.github.io` — never at a repository path.
4. Verify `eoin.ai` under the account's Pages settings so immediate subdomains
   are protected against Pages-domain takeover.
5. Enable **Enforce HTTPS** once the certificate is issued.

The Vite production base stays `/`. There is no `CNAME` file in the source tree
and there must not be one: repository settings and DNS are authoritative.
