# Neural network explorer

A pedagogical, one-page explorer for small dense feed-forward neural networks.
It is intended to be read before a class, not only run: the mathematics is meant
to be easy to inspect, alter, and trust.

Production site: <https://nn.eoin.ai>

## Status

Gate 6 — teaching polish. The dense network engine, the exploration state, and
the teaching view are in place: a scalar input `x`, editable `theta` and `phi`,
per-unit plots of `z` and `h`, the output `y(x)`, unit exclusion, an overlay of
the weighted terms `φᵢhᵢ`, and three presets.

Every plot is drawn from one shared set of sampled `x` positions and keeps that
original `x` on its horizontal axis, so a hover anywhere reports the same input
everywhere and each plot states it as mathematics: `z₁(0.25) = 0.80`. The
keyboard-operable probe is separate from that ephemeral hover — it is marked on
every curve and reported as a forward-pass summary in text, so nothing has to be
pointed at to be read.

Axis scaling is a stated policy rather than a chart-library default. The fixed
teaching scale keeps the axes still so magnitude changes stay comparable while
the sliders move; reachable scaling derives them from the values the network
actually reaches over `x`, sharing one `z` range and one `h` range across each
layer so the cards beside each other remain comparable, and deriving the output
axis from sampled `y(x)`. Both change the value axis only — every plot keeps the
original `x` horizontally, so one probe still means one input everywhere.

Motion is used only where it carries an element's identity from one state to the
next, within a 120-180 ms budget, and `prefers-reduced-motion` removes it
document-wide. Nothing has to move to be understood: charts rescale immediately
rather than morphing, and every state change is also stated in text.

The engine is not shallow. Width, depth, and activation are read from preset
data, so a preset with five units renders five cards and a preset with two
hidden layers renders two strips, with no change to the layout.

Still to come: domain mutation testing. The gate plan lives in
[IMPLEMENTATION.md](IMPLEMENTATION.md) and the architectural rules in
[CLAUDE.md](CLAUDE.md).

Deliberately absent, and not planned for v1: training, datasets, gradient
descent, and editing a network's shape. The domain would support them, which is
not a reason to build them. This tool is for seeing what a fixed network
computes.

## The mathematics

A hidden unit is an affine function of its input followed by an activation.
For unit `i` of a shallow network:

```text
zᵢ(x) = θᵢ₀ + θᵢ₁x        pre-activation: an intercept and a slope
hᵢ(x) = a[zᵢ(x)]          activation: the only nonlinearity in the network
```

The output is an affine function of those activations, weighted by `phi`:

```text
y(x) = φ₀ + Σᵢ φᵢhᵢ(x)
```

Nothing else happens. That is the whole model, and it is why the three plots on
each card and the one below them are enough to see all of it.

### Why ReLU bends the line

`a[z] = max(0, z)` is two straight lines meeting at `z = 0`, so `hᵢ(x)` is flat
until `zᵢ(x)` crosses zero and then follows it. That crossing — the **hinge** —
sits at:

```text
x = -θᵢ₀ / θᵢ₁
```

Each unit contributes one hinge, so `n` units cut the input into at most `n + 1`
regions and `y(x)` is straight within each of them. The default preset places
its three hinges at `x = -0.25`, `-0.1`, and `0.45`: three bends, four straight
regions, all inside the sampled domain. Move `θᵢ₀` and the hinge slides; move
`θᵢ₁` and the ramp tilts; move `φᵢ` and that unit's share of `y` scales.

### Why identity flattens it

Set every activation to identity and each `hᵢ = zᵢ` is affine in `x`. A sum of
affine functions is affine, so `y(x)` becomes a single straight line however
many units or layers are stacked. Depth without a nonlinearity buys nothing —
the app is arranged so you can check that claim rather than take it.

### Parameter count

Each hidden unit owns one intercept plus one weight per incoming connection, and
the output owns `φ₀` plus one weight per unit it reads. For a dense
`1 → n → 1` network:

```text
P(n) = 3n + 1        so P(3) = 10
```

The activation's own configuration — leaky ReLU's `α`, say — is **not** counted.
It selects the function `a`; it is not a `theta` or a `phi`.

### Exclusion

Excluding a unit is an intervention on the forward pass, not an edit to the
network. The unit keeps every parameter, still computes and plots its own `z`
and `h`, and supplies zero to whatever reads it — so `φᵢhᵢ` drops out of the sum
while `φᵢ` stays exactly where it was. Exclude every unit and `y` collapses to
the constant `φ₀`, which the output section says out loud.

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

A single hidden layer writes its parameters as Prince writes a shallow network:
`θ₁₀`, `θ₁₁`, `z₁`, `h₁`. Add depth and the layer index appears, `θ₂₁₁` and
`z₂₁`, because unit 1 of layer 1 and unit 1 of layer 2 are different units.

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

Excluding a unit, moving the probe, choosing a preset, and rescaling an axis are
all exploration state, held apart from the canonical network. None of them can
change a `theta` or a `phi`.

Presets are teaching data rather than special-case code, and each is validated
by tests: unique ids, finite parameters, dense wiring, an activation the registry
declares, a fixed scale the opening function fits inside, and a function with a
visible bend in it.

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
