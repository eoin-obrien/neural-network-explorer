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

- **TypeScript 5.9.3, not 6.x.** TypeScript 6.0.3 is released and is inside
  `typescript-eslint`'s supported range (`>=4.8.4 <6.1.0`), so the blocker is
  not availability. It is Mantine: under TypeScript 6 the declaration files
  `@mantine/core` 9.6.0 ships fail with `TS2320` across roughly twenty input
  components, because `__BaseInputProps` and `ElementProps` disagree on
  `disabled`. None of that is this repository's code — the errors surface only
  because the application project deliberately keeps `skipLibCheck: false`, and
  turning that off to buy a version bump would trade a real guarantee for a
  cosmetic one. Revisit when Mantine publishes TypeScript 6 compatible types.
  TypeScript 7 is a separate matter: `latest` is already 7.x, and it falls
  outside `typescript-eslint`'s range, so it would cost type-aware linting,
  which is a hard requirement.
- **`skipLibCheck` is `false` for the application project only.** Vite and
  Vitest publish `.d.ts` files that do not survive
  `exactOptionalPropertyTypes`, and one references a module pnpm does not
  hoist. `tsconfig.node.json` therefore sets `skipLibCheck: true`;
  `tsconfig.app.json` does not.
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
  introduced after Gate 2, once there is a mathematical domain to mutate.

## Licence obligations

The project is AGPL-3.0-or-later. Section 13 requires that anyone who interacts
with a modified version over a network be offered its corresponding source, so
the deployed interface must carry a visible link to the repository. The Gate 0
shell has no header yet; add that link when the header lands at Gate 3.

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
