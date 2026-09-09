# Neural network explorer

A pedagogical, one-page explorer for small dense feed-forward neural networks.
It is intended to be read before a class, not only run: the mathematics is meant
to be easy to inspect, alter, and trust.

Production site: <https://nn.eoin.ai>

## Status

Gate 0 — constrained scaffold. The quality gates, build, and deployment pipeline
are in place; no neural-network functionality is implemented yet. The gate plan
lives in [IMPLEMENTATION.md](IMPLEMENTATION.md) and the architectural rules in
[CLAUDE.md](CLAUDE.md).

## Notation

The application uses the notation of Simon Prince's _Understanding Deep
Learning_ throughout its code, tests, and interface.

| Concept                 | Symbol | Code    |
| ----------------------- | ------ | ------- |
| Network input           | x      | `x`     |
| Pre-activation          | z      | `z`     |
| Activation function     | a[z]   | `a`     |
| Hidden activation       | h      | `h`     |
| Hidden-layer parameters | theta  | `theta` |
| Output-layer parameters | phi    | `phi`   |
| Network output          | y      | `y`     |

## Requirements

- Node — the version in [.node-version](.node-version)
- pnpm — the version in `package.json#packageManager`

```sh
corepack enable
pnpm install
```

## Commands

| Command              | Purpose                                     |
| -------------------- | ------------------------------------------- |
| `pnpm dev`           | Vite development server                     |
| `pnpm build`         | Production build                            |
| `pnpm check`         | Fast commit/pull-request quality gate       |
| `pnpm verify`        | `pnpm check` plus Playwright/Axe            |
| `pnpm format`        | Write formatting                            |
| `pnpm format:check`  | Verify formatting                           |
| `pnpm docs:lint`     | Markdown linting                            |
| `pnpm spellcheck`    | Spelling of prose and source strings        |
| `pnpm typecheck`     | TypeScript, no emit                         |
| `pnpm lint`          | ESLint, zero warnings                       |
| `pnpm architecture`  | Dependency-direction constraints            |
| `pnpm knip`          | Dead code and dependency analysis           |
| `pnpm test`          | Unit and component tests                    |
| `pnpm test:coverage` | Tests with coverage thresholds              |
| `pnpm test:e2e`      | Playwright with accessibility checks        |
| `pnpm size`          | Production bundle-size budget               |
| `pnpm commitlint`    | Commitlint entry point; CI supplies a range |

## Architecture

```text
domain          pure mathematics; no React, Mantine, Recharts, or browser APIs
  ^
application     network definition plus separate exploration state
  ^
presentation    React, Mantine, chart adapters, visual interaction state
```

The direction is enforced by Dependency Cruiser, not only by convention.

## Deployment

GitHub Actions builds and deploys to GitHub Pages from a green `main` revision.
The custom domain serves the application at its root, so the Vite production
base is `/` and never `/neural-network-explorer/`.

Repository settings and DNS are the source of truth for the domain; there is
deliberately no `CNAME` file in the source tree. See
[CONTRIBUTING.md](CONTRIBUTING.md) for the one-time setup steps.

## Licence

[GNU Affero General Public License v3.0 or later](LICENSE).

This is teaching material, and the share-alike terms are the point: anyone may
run, study, and adapt it, but a modified version — including one merely hosted
for other learners — must be offered back under the same licence.
