# CLAUDE.md

## Purpose

This repository is a small pedagogical neural-network explorer. Treat it as a **reference implementation**, not merely a demo.

Project identity:

- repository: `neural-network-explorer`;
- production site: `https://nn.eoin.ai`;
- hosting: GitHub Pages via GitHub Actions;
- production Vite base: `/` because the custom domain serves the application at its root.

The repository name describes the software; the custom domain describes this deployment. Do not derive production asset paths from the repository name.

The code should make the mathematics easy to inspect, alter, and trust before a class. Prefer the smallest clear implementation that preserves the intended extension points.

The initial UI presents a scalar-input, scalar-output network with one hidden layer of three units, but the underlying domain model must support:

- arbitrary hidden-layer width;
- multiple dense hidden layers;
- pluggable activation functions;
- stable unit and connection identities;
- deterministic evaluation and sampling;
- future teaching views without rewriting the mathematical core.

Do not trade current clarity for speculative flexibility.

---

## Canonical mathematics and terminology

Use the notation and terminology from Simon Prince's *Understanding Deep Learning* throughout the UI, tests, comments, and domain vocabulary.

For a shallow scalar-input network:

\[
z_i = \theta_{i0} + \theta_{i1}x
\]

\[
h_i = a[z_i]
\]

\[
y = \phi_0 + \sum_i \phi_i h_i
\]

For deeper networks, retain the same concepts with a layer index:

\[
z_{\ell i}
= \theta_{\ell i0}
+ \sum_j \theta_{\ell ij} h_{\ell-1,j}
\]

\[
h_{\ell i}=a_\ell[z_{\ell i}]
\]

The final output layer uses \(\phi\), not \(\theta\).

Canonical names:

- `x`: scalar network input;
- `z`: pre-activation;
- `a[z]`: activation function;
- `h`: hidden-unit activation/output;
- `theta`: hidden-layer parameters;
- `phi`: output-layer parameters;
- `y`: scalar network output.

Do not replace these with verbose software synonyms when the mathematical name is clearer.

The default `1 → 3 → 1` preset has exactly **10 trainable network parameters**:

- 6 hidden-layer \(\theta\) parameters;
- 4 output-layer \(\phi\) parameters.

Activation configuration such as the negative slope \(\alpha\) of leaky ReLU is **not** counted as a \(\theta\) or \(\phi\) network parameter.

---

## Non-negotiable architecture

The dependency direction is:

```text
domain
  ↑
application/state
  ↑
presentation
```

### `src/domain/**`

The domain is the mathematical model.

It must:

- contain pure data and pure functions wherever practical;
- know nothing about React, Mantine, Recharts, browser APIs, routing, storage, or GitHub Pages;
- support arbitrary hidden-layer widths;
- support multiple hidden layers;
- represent activations as pluggable definitions;
- use stable IDs for layers, units, and connections where identity matters;
- never use array position as semantic identity;
- retain both `z` and `h` in forward-pass results;
- expose explicit public types at module boundaries;
- remain independently unit-testable.

It must not:

- hard-code three hidden units;
- hard-code ReLU in network evaluation;
- hard-code one hidden layer;
- manufacture Recharts-shaped data;
- contain UI state such as hover, selected probe, expanded panels, or chart scale mode;
- contain a generic `utils`, `helpers`, or `common` dumping ground.

### `src/application/**`

Application state coordinates the mathematical network with exploration controls.

Keep **network definition** separate from **exploration state**.

For example, turning a unit off for demonstration is an exploration intervention, not a new trainable parameter. Prefer an `excludedUnitIds`/intervention concept outside the canonical network parameter structure.

Application code may depend on `domain`, but not on presentational components.

### `src/presentation/**`

Presentation contains React, Mantine, Mantine Charts/Recharts adapters, interaction state that is purely visual, formatting, and layout.

Chart-library data shapes belong here. Convert domain sampling results at this boundary rather than distorting domain types for Recharts.

---

## General implementation rule

**Architect for extension; implement only what is currently used.**

Examples:

- The domain may support multiple layers before the UI exposes layer editing.
- The activation registry may make adding activations easy, but do not build an unused plugin framework.
- Do not create factories, adapters, hooks, context providers, repositories, services, or interfaces “for later” unless they solve a current problem.

Knip must be able to remove speculative dead code by failing CI.

---

## TypeScript constraints

Use the current stable TypeScript 6.x toolchain compatible with the selected dependencies. Pin exact tool versions once scaffolded.

The application TypeScript configuration must explicitly enable strictness, including at least:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitOverride": true,
  "noPropertyAccessFromIndexSignature": true,
  "noUncheckedSideEffectImports": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "allowUnreachableCode": false,
  "allowUnusedLabels": false,
  "forceConsistentCasingInFileNames": true,
  "isolatedModules": true,
  "verbatimModuleSyntax": true,
  "erasableSyntaxOnly": true,
  "skipLibCheck": false,
  "noEmit": true
}
```

Do not weaken a compiler option to make an implementation easier.

### Type discipline

- No `any` in application source.
- No non-null assertions (`!`) in application source.
- Avoid type assertions. In `domain/**`, a type assertion requires an exceptional, documented reason. Prefer narrowing, discriminated unions, `satisfies`, and constructors/validators.
- `as const` is acceptable when used only to preserve literal inference, not to lie about runtime data.
- Prefer `unknown` at untrusted boundaries, then validate/narrow.
- Use `import type` for type-only imports.
- Exported functions and public module boundaries have explicit return types.
- Obvious local values and callbacks may use inference; do not annotate everything redundantly.
- Prefer discriminated unions over boolean flag combinations when states are mutually exclusive.
- Prefer `readonly` domain data unless mutation is genuinely required.
- Avoid classes unless a class clearly improves the domain model. Pure functions and immutable records are the default.

Do not use runtime TypeScript constructs that conflict with `erasableSyntaxOnly`, such as runtime enums or namespaces.

---

## ESLint constraints

Use ESLint flat config with type-aware linting through `typescript-eslint` Project Service.

Base the TypeScript source rules on:

- `@eslint/js` recommended;
- `typescript-eslint` `strictTypeChecked`;
- `typescript-eslint` `stylisticTypeChecked`.

Use `parserOptions.projectService: true`.

All ESLint warnings are CI failures: `eslint --max-warnings=0`.

At minimum, enforce or retain strict rules for:

- no explicit `any`;
- no unsafe assignment/call/member access/argument/return;
- no floating promises;
- exhaustive switches;
- strict boolean expressions where practical;
- consistent type imports;
- explicit module-boundary types;
- no unused expressions/variables;
- no unreachable code;
- no focused or disabled tests in committed code.

### Complexity and size budgets

Start with these budgets and tighten rather than loosen them where practical:

```text
cyclomatic complexity             ≤ 8
block nesting depth               ≤ 3
function parameters               ≤ 4
source file code lines            ≤ 250
ordinary function code lines      ≤ 50
React component code lines        ≤ 70
statements per function           ≤ 20
nested callbacks                  ≤ 3
```

Blank lines and comments should not count toward line budgets where the ESLint rule supports that distinction.

If a limit is exceeded, first split responsibilities. Do not add an ESLint suppression merely to preserve generated structure.

### Suppressions

- `@ts-ignore` is forbidden.
- `@ts-expect-error` is allowed only with a specific explanation and only for a genuinely unavoidable boundary.
- ESLint disable comments require a reason on the same line/comment.
- Unused suppressions fail CI.
- Do not disable a rule for an entire file unless the file is an explicit configuration/generated boundary and the reason is documented.

---

## Functional domain rules

Apply functional/immutability lint rules selectively to `src/domain/**`.

The goal is:

- no mutation of domain inputs;
- readonly domain structures by default;
- deterministic pure evaluation;
- no hidden state;
- no I/O;
- no classes as state containers.

Do not adopt functional-programming rules that make simple mathematics harder to read. Readability wins over ideological purity.

---

## Dependency and architecture enforcement

Use Dependency Cruiser (or an equivalently explicit architecture checker) in CI.

Enforce at least:

- no circular dependencies;
- no unresolved imports;
- `domain/**` cannot import `application/**` or `presentation/**`;
- `domain/**` cannot import React, Mantine, Recharts, or browser-specific libraries;
- `application/**` cannot import `presentation/**`;
- chart adapters remain in presentation.

Architecture rules are executable constraints, not documentation only.

---

## Dead-code and dependency discipline

Use Knip aggressively.

CI should reject:

- unused files;
- unused exports;
- unused types;
- unused dependencies;
- unused dev dependencies;
- missing dependencies;
- speculative code with no caller.

Do not add a dependency when a few obvious lines of platform code are clearer.

Avoid generic dependency-heavy solutions for state, validation, utilities, or CSS unless there is a demonstrated need.

Runtime dependencies should remain close to:

- React;
- Mantine Core/Hooks;
- Mantine Charts;
- Recharts as required by Mantine Charts.

Development dependencies may include TypeScript, Vite, ESLint tooling, Prettier, Vitest, Testing Library, Playwright, Axe, Knip, Dependency Cruiser, and domain-only mutation testing.

---

## Formatting and exports

Prettier owns formatting. ESLint owns semantics and maintainability.

- Pin the Prettier version exactly.
- `prettier --check .` runs in CI.
- Prefer named exports in application source.
- Configuration files may use the export style required by their ecosystem.
- Avoid barrel files unless they represent a genuine public module boundary. Prefer imports that reveal where a concept lives.

---

## Repository hygiene and reproducibility

Treat repository structure and Git history as part of the reference implementation.

Commit and maintain:

- `.editorconfig` with UTF-8, LF line endings, final newline, and spaces;
- `.gitattributes` with normalized text/LF behaviour;
- `.gitignore` covering `node_modules`, `dist`, coverage, Playwright reports/results, local environment files, editor/OS noise, and generated artifacts;
- one explicit Node version (`.node-version` or equivalent) matching `package.json#engines`;
- an exact `packageManager` entry for pnpm;
- the pnpm lockfile;
- `.npmrc`/pnpm settings that prefer exact dependency versions, enforce the declared engine, and keep peer-dependency failures visible;
- `package.json` with `private: true` unless there is an explicit decision to publish a package.

Use frozen lockfile installs in CI. Do not commit `dist`, coverage output, Playwright artifacts, local caches, `.env` files containing secrets, or generated reports.

If configuration is eventually required, commit a documented `.env.example` containing names only, never credentials.

Prefer exact dependency versions for this small reference repository. Dependency upgrades should be deliberate and reviewed rather than silently drifting through semver ranges.

Use GitHub-native dependency and security hygiene where available:

- Dependabot updates for the pnpm/npm ecosystem and GitHub Actions;
- Dependabot/security alerts;
- secret scanning for a public repository;
- a deliberate `LICENSE` choice before publishing publicly.

Do not add release automation, changelog generators, or package-publishing machinery until the project actually has versioned releases that need them.

### Documentation hygiene

Use `markdownlint-cli2` for repository Markdown and `cspell` for learner-facing prose/source strings with a small project dictionary for mathematical/library vocabulary.

Documentation and spelling checks are quality gates, not editor-only conveniences.

### Bundle-size discipline

After the initial Mantine/Recharts shell is built, record a realistic production bundle baseline and enforce a small explicit size budget with a tool such as Size Limit.

Do not invent an arbitrary budget before measuring the unavoidable framework/chart baseline. Once set, a budget increase requires deliberate review; installing a large dependency should never silently inflate this teaching app.

---

## Conventional commits and Git discipline

Use Conventional Commits and enforce them with Commitlint.

Required tooling:

- `@commitlint/cli`;
- `@commitlint/config-conventional`;
- `commitlint.config.mjs`;
- a lightweight Git `commit-msg` hook, preferably Husky, that runs Commitlint locally.

Use the conventional shape:

```text
<type>[optional scope][!]: <description>
```

Examples:

```text
feat(charts): add reachable range scaling
fix(domain): preserve excluded unit parameters
test(activation): cover leaky ReLU negative branch
docs: explain identity activation
ci: require browser tests before Pages deploy
refactor(domain)!: change connection identity representation
```

Use the standard Conventional Commit types from `config-conventional`; do not create a bespoke taxonomy without a real need. Scopes are optional and should name a genuine concept (`domain`, `activation`, `charts`, `ui`, `test`, `docs`, `ci`, `tooling`) rather than ticket numbers.

Add a modest header-length limit (for example 72 characters) to encourage concise subjects. Do not weaken semantic rules just to accept generated commit prose.

Local hooks are convenience feedback only. CI is authoritative and must lint the relevant commit range. On pull requests, also lint the PR title so squash-merging produces a valid Conventional Commit on `main`.

Recommended repository merge policy:

- protect `main` with a GitHub ruleset;
- require the CI checks defined below;
- prefer squash merge for this small teaching repository;
- require a linear history;
- disable force pushes and branch deletion on `main`;
- require conversation resolution on pull requests where practical.

Do not bypass CI with a direct push to `main` once protection is enabled.

---

## GitHub Actions requirements

GitHub Actions is the authoritative integration gate and GitHub Pages deployment mechanism.

Use a single clear CI workflow for pull requests and pushes to `main`, plus a separate slower mutation workflow only if mutation testing proves too slow for the required PR path.

### Workflow security and determinism

- Default workflow permissions to `contents: read`.
- Grant `pages: write` and `id-token: write` only to the deploy job.
- Never use `pull_request_target` to execute untrusted repository code.
- Pin third-party and GitHub Actions to immutable full commit SHAs, with the human-readable release/version in a comment; let Dependabot update those pins.
- Pin Node and pnpm to the repository-declared versions.
- Use `pnpm install --frozen-lockfile`.
- Set sensible `timeout-minutes` on every job.
- Use workflow concurrency and cancel superseded PR runs.
- Do not expose secrets to pull-request jobs. The initial Pages app should require no repository secrets.
- Keep Pages deployment in the GitHub `pages` environment.

### Required CI jobs

At minimum:

1. **commit-style** — fetch full Git history, lint every commit in the PR/push range, and lint PR title on pull requests;
2. **quality** — install once and run the fast deterministic quality gate (`pnpm check`);
3. **browser** — run Playwright/Axe after `quality` succeeds;
4. **pages-build/deploy** — only on a push to protected `main`, and only after all required jobs succeed.

The Pages job must deploy the production artifact built from the same green revision. A failed quality, commit-style, browser, or build job must make deployment impossible.

Mutation testing may run on PRs if it remains fast enough; otherwise run it on `main`, on a scheduled cadence, and via `workflow_dispatch`. Mutation survivors in `src/domain/**` must be investigated rather than ignored by default.

### Production domain and Pages configuration

The canonical production URL is `https://nn.eoin.ai`.

- Configure Vite with `base: '/'` (or omit `base`, whose default is `/`). Do not use `/neural-network-explorer/` in the production build.
- Configure GitHub Pages to publish with **GitHub Actions**.
- Configure `nn.eoin.ai` as the repository's custom domain in **Settings → Pages**.
- For the DNS provider, configure the `nn` subdomain as a `CNAME` to `<GITHUB_USER>.github.io`; never point it to a repository path.
- Verify `eoin.ai` in the GitHub account's Pages settings before relying on the subdomain where practical; this protects immediate subdomains against Pages-domain takeover.
- Enable **Enforce HTTPS** once GitHub has issued the certificate and the DNS check is healthy.
- A committed `CNAME` file is not required for the custom GitHub Actions publishing flow and must not be treated as the source of truth for the custom domain. Repository Pages settings and DNS are authoritative.
- The default project-pages URL `<GITHUB_USER>.github.io/neural-network-explorer/` is not a supported production fallback for this root-based build; production verification happens at `https://nn.eoin.ai`.
- No application or deployment secret is required merely to publish this static site.

If the deployment host changes later, keep the repository identity `neural-network-explorer` independent from the hostname unless there is a deliberate repository migration.

---

## Naming and comments

This is pedagogical source code.

Prefer canonical mathematical identifiers where they aid correspondence with the UI and equations:

```text
x, z, h, y, theta, phi, phi0
```

Do not “clarify” them into names such as `preActivationOutputValue` when `z` is the concept being taught.

Comments explain:

- why a choice exists;
- a mathematical correspondence;
- an invariant;
- a non-obvious compatibility constraint.

Comments do **not** narrate syntax.

Bad:

```ts
// Multiply theta by x and add the bias.
const z = theta0 + theta1 * x;
```

Useful:

```ts
// Prince notation: theta0 is the bias term; theta1 is the scalar-input weight.
const z = theta0 + theta1 * x;
```

Also avoid:

- commented-out code;
- decorative section banners;
- JSDoc that merely repeats a TypeScript signature;
- TODOs without a concrete reason or issue/reference;
- prose-heavy abstractions that obscure one-line mathematics.

---

## Activation functions

Activation is a first-class domain concept and is configured per hidden layer internally.

The initial UI may expose one global selector that applies the same activation to every hidden layer.

Initial activation set:

- ReLU;
- leaky ReLU;
- logistic/sigmoid;
- tanh;
- identity.

Each activation definition should provide only the information currently required, such as:

- stable ID;
- display name;
- mathematical notation/description metadata;
- pure evaluator;
- typed configuration when required.

Network evaluation calls the selected activation. It must never branch on activation IDs throughout unrelated code.

The identity activation is an important teaching control: with identity activations at every hidden layer, a dense scalar-input/scalar-output network must remain affine in `x` regardless of depth.

---

## Sampling and chart data

Network evaluation and network sampling are domain concerns.

Mantine/Recharts data shaping is not.

A sampled forward pass should preserve semantic structure, for example conceptually:

```text
x
layers[]
  units[]
    z
    h
y
```

Do not manufacture `z1`, `z2`, `z3`, etc. in domain code.

Use one shared set of sampled original input `x` values for function plots so synchronized hovering/probing remains mathematically meaningful.

---

## Chart-scale policy

Axis scaling is an explicit presentation policy, not an accidental Recharts default.

Support the architecture for at least two scale modes:

1. **Fixed teaching scale** — stable axes chosen by the preset/view so magnitude changes are directly comparable while manipulating parameters.
2. **Reachable range** — derive visible value ranges deterministically from the values reachable over the configured scalar input domain.

Important distinction:

- Function plots such as `z_li(x)`, `h_li(x)`, and `y(x)` keep the **original scalar network input `x` on the horizontal axis**. This preserves synchronized forward-pass inspection across all layers.
- Reachable-range scaling normally changes the **value/y-axis**, not the semantic meaning of the x-axis.
- For the first layer, a normalized input preset may use `x ∈ [-1, 1]`; every function plot samples that same domain.
- For a layer, reachable scaling should be based on the union of relevant sampled values across its units so cards within that layer remain visually comparable.
- `z` and `h` may use separate shared layer ranges because activation changes the reachable values.
- The final output chart derives its reachable y-range from sampled `y(x)`.
- Add deterministic padding and a sensible non-zero range for constant functions. Never let a flat function create a zero-width axis.

If a future view plots the activation transfer function `a[z]` directly against `z`, that view may use the sampled reachable `z` range as its horizontal domain. Do not confuse that transfer-function view with the main `h_i(x)` plots.

Scale calculations must be pure and tested.

Avoid axis jitter: rescaling should be stable and deterministic while sliders move. Do not round ranges differently from frame to frame without a specified rule.

---

## Motion and animation

Use animation only when it helps the learner preserve object identity or understand a state change.

Desired character: **clean, restrained, fast, and quiet**.

Good uses:

- subtle card/state transitions when a unit is included/excluded;
- a short transition when changing activation or scale mode;
- restrained emphasis for the selected probe point;
- modest expansion/collapse transitions for optional parameter detail.

Avoid:

- decorative entrance animation;
- bouncing/springy controls;
- looping motion;
- animated gradients;
- long chart morphs;
- animation that delays slider feedback;
- simultaneous animations competing across many neuron cards.

Slider-driven mathematical updates should feel immediate. Do not queue chart animations on every pointer event.

As a starting budget, discrete UI transitions should generally be about **120–180 ms** and should use simple opacity/transform changes.

Honor `prefers-reduced-motion`. Reduced-motion mode must remain fully understandable and usable with motion removed.

Animation must never be required to perceive a mathematical change; the final static state must communicate the result.

---

## React and accessibility

Use the current React Hooks ESLint recommended rules and strict JSX accessibility linting.

Prefer local state/reducers over a state library unless complexity demonstrates a real need.

Do not store derived mathematical values in React state. Derive them from canonical network/exploration state.

Every control must have an accessible name that includes both mathematical and plain-language meaning where helpful, for example:

```text
θ₁₀ — intercept
θ₁₁ — slope
φ₁ — output weight
```

Keyboard interaction must work for sliders, activation selection, unit inclusion switches, probe controls, and expandable details.

Use automated Axe checks in browser tests, but do not treat Axe as a substitute for semantic markup and keyboard testing.

---

## Testing philosophy

Tests specify our mathematics and behaviour, not the internals of Mantine or Recharts.

Do not assert brittle SVG path strings.

### Domain tests

Domain code is small, pure, and deterministic. Require **100% line, branch, function, and statement coverage** for `src/domain/**` unless a documented tool limitation makes a specific metric meaningless.

Test mathematical properties, including at least:

- correct affine/pre-activation computation;
- each activation's defining behaviour;
- `h = a[z]`;
- layer composition uses previous-layer `h`, not `z`;
- output uses `phi` parameters;
- arbitrary widths;
- multiple hidden layers;
- activation changes preserve upstream `z` values where expected;
- exclusion/intervention propagates correctly without mutating network parameters;
- parameter count matches the dense-network formula;
- default `1 → 3 → 1` preset has exactly 10 trainable parameters;
- identity activation at every hidden layer yields an affine function of scalar `x` regardless of depth;
- scale/range calculations handle positive, negative, mixed, and constant data.

### Application/component tests

Use Vitest + Testing Library + `user-event`.

Test user-visible behaviour, including:

- rendering arbitrary neuron counts;
- changing `theta` changes the relevant `z`, `h`, and downstream output;
- changing `phi` changes output but not hidden-unit functions;
- changing `phi0` vertically shifts output;
- changing activation changes `h`/downstream values without changing upstream `z`;
- excluding and restoring a unit preserves its parameters;
- changing probe `x` updates the displayed forward pass;
- switching scale mode produces the expected deterministic domains;
- reset restores the selected preset.

### Browser tests

Keep Playwright focused and small. Cover integration failures that unit/component tests cannot catch:

- app loads;
- default preset reports 10 parameters;
- slider interaction updates the visible model;
- unit exclusion changes final output;
- activation switching works end-to-end;
- synchronized/probe interaction remains usable;
- reset works;
- no serious Axe violations on the principal view.

No `test.only`, `describe.only`, `test.skip`, or silent skipped suites in main.

### Mutation testing

Use mutation testing selectively on `src/domain/**` after the domain stabilizes.

It need not run on every local edit, but it should be available as a script and suitable for CI/manual/nightly verification. Mathematical operators changing without a test failure are a defect in the test suite.

---

## Presets and validation

Presets are teaching data, not special-case code.

Each preset must be validated by tests for:

- stable/unique IDs;
- finite parameter values;
- valid dense connections;
- valid activation configuration;
- expected parameter count where pedagogically important.

The initial preset is a one-hidden-layer, three-unit network with normalized input domain `[-1, 1]` unless a later implementation decision explicitly changes it.

---

## UI principles

Use stock Mantine styling as the baseline.

Aim for:

- compact one-page layout;
- restrained color;
- one consistent color identity per unit where useful;
- generous but not wasteful whitespace;
- no hero section;
- no visual “AI” tropes;
- no gradients unless a specific teaching reason emerges;
- no unnecessary icons;
- no ornamental cards.

Neuron/unit collections must support horizontal scrolling and arbitrary counts. Do not use a layout assumption equivalent to `grid-cols-3`.

The shallow view should make this progression visually obvious:

```text
z_i(x) = θ_i0 + θ_i1 x
        ↓
h_i(x) = a[z_i(x)]
        ↓
y(x) = φ_0 + Σ φ_i h_i(x)
```

All function charts should share the original sampled `x` positions so the same probe can be inspected throughout the forward pass.

---

## Commands and quality gates

Use `pnpm` for the new repository unless an existing repository already standardizes on another package manager. Commit the lockfile and use frozen installs in CI.

Provide scripts with these semantics:

```text
pnpm format          write formatting
pnpm format:check    verify formatting
pnpm docs:lint       Markdown linting
pnpm spellcheck      learner-facing prose/source spelling
pnpm typecheck       TypeScript, no emit
pnpm lint            ESLint with zero warnings
pnpm architecture    dependency constraints
pnpm knip            dead-code/dependency analysis
pnpm test            unit/component tests
pnpm test:coverage   tests with coverage thresholds
pnpm test:e2e        Playwright + accessibility checks
pnpm test:mutation   domain mutation tests
pnpm size            production bundle-size budget
pnpm build           production Vite build
pnpm commitlint      Commitlint entry point; CI supplies the commit range
pnpm check           fast commit/PR quality gate
pnpm verify          full gate including browser tests
```

`pnpm check` should include, in a sensible fail-fast order:

1. formatting check;
2. Markdown/spelling checks;
3. typecheck;
4. ESLint with zero warnings;
5. architecture checks;
6. Knip;
7. unit/component tests with coverage;
8. production build;
9. bundle-size check once the baseline budget is established.

Commitlint is intentionally event/range-aware and is run by the local `commit-msg` hook and the dedicated CI commit-style job rather than blindly inside `pnpm check`.

`pnpm verify` adds Playwright/accessibility integration tests.

GitHub Pages deployment must depend on the full required CI gate. Do not deploy a build that fails typechecking, linting, architecture checks, tests, or production build.

---

## Gate 0

Before implementing the neural-network domain, establish a green scaffold containing:

- Vite + React + TypeScript;
- Mantine Core/Hooks + Mantine Charts/Recharts;
- strict TypeScript configuration;
- type-aware ESLint flat config;
- Prettier;
- Markdown linting and spelling checks;
- Commitlint + Conventional Commits config and local commit-msg hook;
- `.editorconfig`, `.gitattributes`, `.gitignore`, pinned Node/pnpm metadata, and strict package-manager settings;
- architecture checks;
- Knip;
- production bundle-size budget after the baseline shell is measured;
- Vitest + Testing Library;
- Playwright + Axe;
- GitHub CI with least-privilege permissions, commit/PR-title linting, concurrency, and timeouts;
- GitHub Pages build/deploy job gated on green CI;
- Dependabot configuration for dependencies and GitHub Actions;
- a concise pull-request template / contribution notes if the repository will accept contributions;
- all required scripts;
- an essentially empty app that passes `pnpm verify`.

Do not begin feature implementation until Gate 0 is green.

---

## Working method

Implement in small vertical or domain-first increments.

For every meaningful change:

1. understand the mathematical or UI contract;
2. write/update focused tests;
3. implement the smallest solution;
4. run the narrow relevant tests;
5. run `pnpm check` before considering the change complete;
6. run `pnpm verify` before release/deployment changes.

When refactoring, preserve behaviour with tests first.

Do not respond to a failing quality gate by weakening the gate unless the rule itself is demonstrably harming clarity or correctness. If a rule needs changing, explain why the rule is wrong for this repository rather than merely inconvenient for the current code.

---

## Final review checklist

Before marking any substantial task complete, check explicitly:

- Is there any hard-coded assumption of three units?
- Is there any hard-coded assumption of one hidden layer?
- Has ReLU leaked outside the activation abstraction?
- Are `theta` and `phi` used consistently with Prince notation?
- Is UI/intervention state contaminating the canonical network model?
- Did chart-library types leak into the domain?
- Is anything stored in React state that could be derived?
- Is there a new abstraction with only one speculative use?
- Did an unused export/file/dependency appear?
- Did comments or names become more verbose than the mathematics?
- Are chart domains/scales deterministic and testable?
- Does motion remain restrained and reduced-motion safe?
- Are tests asserting our behaviour rather than Recharts internals?
- Is the repository free of generated artifacts, accidental secrets, and dependency drift?
- Does the commit/PR title satisfy Conventional Commits?
- Are GitHub workflow permissions minimal and action references pinned immutably?
- Did bundle size stay within the accepted baseline budget?
- Does `pnpm check` pass?
- Does `pnpm verify` pass when the task affects browser behaviour or deployment?
