# Neural Network Explorer — Implementation Specification

## 1. Objective

Build a clean, compact, one-page teaching application for exploring small dense feed-forward neural networks.

The first release should make a shallow scalar-input/scalar-output network tangible:

- scalar input `x`;
- one hidden layer;
- three hidden units by default;
- scalar output `y`;
- 10 trainable parameters in the default network;
- editable hidden-layer and output parameters;
- synchronized plots of pre-activation, post-activation, and final output;
- unit inclusion/exclusion for experimentation;
- a persistent scalar-input probe;
- pluggable activation functions;
- fixed and reachable-range chart scaling;
- restrained, purposeful animation;
- strong automated quality gates and tests.

The first UI is intentionally shallow. The **domain engine is not**: it must support multiple dense hidden layers and arbitrary width from the outset.

This is a pedagogical reference implementation. Mathematical legibility and maintainability outrank feature count.

### 1.1 Project and deployment identity

Use these names consistently:

- repository: `neural-network-explorer`;
- production site: `https://nn.eoin.ai`;
- deployment: GitHub Pages via a custom GitHub Actions workflow;
- production Vite base: `/`.

The repository name describes the project; the hostname describes this deployment. The application must not assume that its production path contains the repository name.

---

## 2. Mathematical model

### 2.1 Shallow form

For hidden unit `i`:

\[
z_i(x)=\theta_{i0}+\theta_{i1}x
\]

\[
h_i(x)=a[z_i(x)]
\]

The scalar output is:

\[
y(x)=\phi_0+\sum_{i=1}^{n}\phi_i h_i(x)
\]

For the default `n=3` network:

\[
y(x)=\phi_0+\phi_1h_1(x)+\phi_2h_2(x)+\phi_3h_3(x)
\]

Parameter count:

\[
P(n)=3n+1
\]

so:

\[
P(3)=10.
\]

### 2.2 General deep form

Let `h_0 = x` for the scalar input.

For hidden layer `ℓ` and unit `i`:

\[
z_{\ell i}
=
\theta_{\ell i0}
+
\sum_{j=1}^{n_{\ell-1}}
\theta_{\ell ij}h_{\ell-1,j}
\]

\[
h_{\ell i}=a_\ell[z_{\ell i}]
\]

For the final hidden layer `L`:

\[
y
=
\phi_0
+
\sum_{i=1}^{n_L}\phi_i h_{Li}.
\]

For hidden widths `n_1, …, n_L` and scalar input `n_0=1`, the trainable parameter count is:

\[
P
=
\sum_{\ell=1}^{L}
 n_\ell(n_{\ell-1}+1)
+
(n_L+1).
\]

Activation-function configuration values such as leaky-ReLU `α` are not counted as `θ` or `φ` trainable network parameters in this tool.

---

## 3. Pedagogical notation

Use Prince/UDL notation as the canonical language of the application and code.

| Concept | Symbol | Preferred code vocabulary |
|---|---|---|
| Network input | `x` | `x` |
| Pre-activation | `z` | `z` |
| Activation function | `a[z]` | `activation` |
| Hidden activation | `h` | `h` |
| Hidden-layer parameters | `θ` | `theta` |
| Output-layer parameters | `φ` | `phi` |
| Output intercept | `φ₀` | `phi0` / output bias field |
| Network output | `y` | `y` |

For the shallow UI, suppress unnecessary layer indices. Show:

\[
z_i=\theta_{i0}+\theta_{i1}x
\]

rather than the more cumbersome deep-network notation.

Plain-language labels should accompany symbols where this helps novices:

```text
θ₁₀  intercept
θ₁₁  slope
φ₁   output weight
```

For deeper layers, do not call incoming weights “slopes”; label them by their source activation, for example `θ₂₁₂ — from h₁₂`.

---

## 4. Domain architecture

### 4.1 Core principle

Implement a general scalar-input/scalar-output **dense feed-forward network engine**.

The initial `1 → 3 → 1` shallow network is a preset consumed by that engine, not a special evaluator.

### 4.2 Suggested domain types

Exact field names may evolve, but the semantics must remain explicit.

```ts
export type LayerId = string;
export type UnitId = string;
export type NodeId = string;

export interface IncomingTheta {
  readonly sourceId: NodeId;
  readonly value: number;
}

export interface HiddenUnit {
  readonly id: UnitId;
  readonly thetaBias: number;
  readonly incomingTheta: readonly IncomingTheta[];
}

export interface HiddenLayer {
  readonly id: LayerId;
  readonly units: readonly HiddenUnit[];
  readonly activation: ActivationSelection;
}

export interface OutputPhi {
  readonly sourceId: UnitId;
  readonly value: number;
}

export interface OutputLayer {
  readonly phi0: number;
  readonly incomingPhi: readonly OutputPhi[];
}

export interface Network {
  readonly hiddenLayers: readonly HiddenLayer[];
  readonly output: OutputLayer;
}
```

Stable IDs prevent semantic connections from silently changing when units are added, removed, or reordered.

Do not rely on `units[1]` meaning “unit 2” when the identity matters.

### 4.3 Exploration state is separate

The canonical network should contain mathematical architecture and parameters, not transient UI controls.

Suggested exploration state:

```ts
export interface ExplorationState {
  readonly xDomain: readonly [number, number];
  readonly probeX: number;
  readonly excludedUnitIds: ReadonlySet<UnitId>;
  readonly scaleMode: ScaleMode;
  readonly selectedPresetId: PresetId;
}
```

The exact representation of excluded IDs may be adapted to serialize cleanly, but the separation must remain.

Excluding a unit is a teaching intervention, not an additional network parameter.

### 4.4 Exclusion semantics

When a unit is excluded:

- still calculate and display its own `z` and mathematical `h`;
- retain all its parameters;
- supply zero as its effective downstream contribution/value;
- visually mark it as “Excluded from output” or “Excluded downstream” rather than rewriting the canonical equations with a gate variable.

For a shallow network, exclusion removes `φ_i h_i` from the final sum.

For a deep network, exclusion supplies zero from that unit to all connections in the next layer, allowing the effect to propagate through later layers.

The forward-pass result may therefore need to distinguish mathematical `h` from the effective downstream value used under an exploration intervention.

---

## 5. Activation system

### 5.1 Activation as a registry

Activation functions are pluggable definitions, selected per hidden layer internally.

The network evaluator must not contain scattered activation-specific branches.

Suggested shape:

```ts
export type ActivationId =
  | 'relu'
  | 'leaky-relu'
  | 'sigmoid'
  | 'tanh'
  | 'identity';

export interface ActivationDefinition<Config = undefined> {
  readonly id: ActivationId;
  readonly name: string;
  readonly notation: string;
  readonly evaluate: (z: number, config: Config) => number;
}
```

Avoid over-generalizing the generic type if a simpler discriminated union produces clearer code.

### 5.2 Initial activations

Implement and test:

#### ReLU

\[
a[z]=\max(0,z)
\]

#### Leaky ReLU

\[
a[z]=
\begin{cases}
z,&z\ge0\\
\alpha z,&z<0
\end{cases}
\]

Default `α` should be an explicit activation configuration value.

#### Logistic / sigmoid

\[
a[z]=\frac{1}{1+e^{-z}}
\]

#### Tanh

\[
a[z]=\tanh(z)
\]

#### Identity

\[
a[z]=z
\]

Identity is a deliberate teaching control. With identity at every hidden layer, the whole network must remain affine in the scalar input regardless of depth.

### 5.3 Initial UI behaviour

The first UI exposes one global activation selector and applies that activation to every hidden layer.

Internally, activation remains a layer property so future versions can independently configure layers without changing the evaluator.

---

## 6. Forward-pass API

Keep the mathematical evaluator pure.

Conceptual API:

```ts
evaluateHiddenUnit(...)
evaluateHiddenLayer(...)
evaluateOutputLayer(...)
evaluateNetwork(...)
sampleNetwork(...)
countParameters(...)
```

A forward pass should retain enough information for inspection:

```ts
interface UnitEvaluation {
  readonly unitId: UnitId;
  readonly z: number;
  readonly h: number;
  readonly downstreamValue: number;
}

interface LayerEvaluation {
  readonly layerId: LayerId;
  readonly units: readonly UnitEvaluation[];
}

interface NetworkEvaluation {
  readonly x: number;
  readonly layers: readonly LayerEvaluation[];
  readonly y: number;
}
```

The evaluator should make the computation sequence obvious:

```text
previous h values
      ↓
weighted affine combination using θ
      ↓
z
      ↓
a[z]
      ↓
h
      ↓
next layer
      ↓
final φ-weighted output
```

---

## 7. Sampling

### 7.1 Scalar input domain

The first teaching preset uses normalized input:

\[
x\in[-1,1].
\]

Make the input domain configurable by preset/view, not hard-coded into evaluation.

### 7.2 Shared sample locations

Generate one deterministic set of scalar `x` samples and evaluate the complete network at every sample.

All `z_li(x)`, `h_li(x)`, and `y(x)` function plots use those same original `x` coordinates.

This enables synchronized hover/probe interaction across the entire forward pass.

A starting point of roughly 161 samples over `[-1, 1]` is sufficient, but define the sample-count choice in one configuration location and test endpoint inclusion.

### 7.3 Domain representation

Keep sampled data structured by layers and units.

Do not create domain objects with hard-coded fields such as:

```text
z1, h1, z2, h2, z3, h3
```

Those names may appear only in presentation adapters if a chart API absolutely requires flat keys, and even there dynamic generation is preferable.

---

## 8. Chart scaling

### 8.1 Motivation

The tool should support both stable visual comparison and the ability to inspect the reachable value range produced by each layer.

A normalized input such as `x ∈ [-1, 1]` should be represented accurately. As parameters and depth alter the values produced by the network, the user should optionally be able to rescale charts to the values actually reachable over that input domain.

### 8.2 Scale modes

Implement or architect for two explicit modes.

#### Fixed teaching scale

Axes are stable while parameters move.

Advantages:

- magnitude changes remain visually meaningful;
- charts do not “chase” the line;
- useful during explanation and comparison.

Preset configuration may provide sensible fixed ranges.

#### Reachable range

Derive chart value ranges from the set of values reachable over the configured `x` domain.

For each hidden layer:

- compute the union of sampled `z` values across units for the layer's pre-activation charts;
- compute the union of sampled `h` values across units for the layer's activation charts;
- use a shared `z` scale across units in that layer;
- use a shared `h` scale across units in that layer;
- derive the final output scale from sampled `y(x)`.

This makes units within a layer visually comparable while allowing deeper layers to occupy value ranges appropriate to what is actually reachable.

### 8.3 Preserve x-axis semantics

The normal neuron/function charts always plot quantities as functions of the **original scalar input**:

\[
z_{\ell i}(x),\qquad h_{\ell i}(x),\qquad y(x).
\]

Therefore their horizontal axis remains the original `x` domain, for example `[-1, 1]`, at every layer.

Do **not** relabel a deep-layer horizontal axis with the range of a previous layer's activation: later layers have multidimensional incoming activations, and doing so would be mathematically misleading.

What changes in reachable-range mode is primarily the **vertical/value scale**.

### 8.4 Future activation-transfer view

A future optional view may plot the activation function itself:

\[
h=a[z]
\]

with `z` on the horizontal axis.

For that distinct view, the horizontal domain should use the reachable `z` range for the relevant layer/unit. This is not the same chart as `h_i(x)`.

### 8.5 Range algorithm

Implement scale-domain calculation as a pure tested function.

Requirements:

- include all finite sampled values in the target collection;
- calculate min/max deterministically;
- add modest deterministic padding, initially around 5–10%;
- use a minimum absolute padding/range for constant or near-constant functions;
- handle all-positive, all-negative, mixed-sign, and zero-valued ranges;
- never emit `NaN`, `Infinity`, or a zero-width axis domain;
- avoid frame-to-frame “nice tick” instability caused by inconsistent rounding.

Keep “nice ticks” and label formatting in presentation; keep numerical reachable-range calculation testable independently.

---

## 9. Motion and animation

### 9.1 Principle

Motion should help users maintain context, not decorate the app.

The desired feel is Mantine-native: compact, calm, and responsive.

### 9.2 Appropriate animation

Use short, subtle transitions for:

- activation selection changes;
- scale-mode changes;
- unit include/exclude state;
- expanding/collapsing optional parameter details;
- persistent probe emphasis;
- small layout changes where motion preserves object identity.

Use approximately `120–180 ms` as the default discrete transition budget unless a specific component feels clearer without animation.

Prefer opacity and small transforms over elaborate motion.

### 9.3 Chart updates

Parameter sliders produce continuous input events. Mathematical chart updates should be immediate.

Do not start a new long Recharts animation on every slider event. This causes lag and makes the plotted state trail behind the control.

If chart interpolation is used at all:

- keep it very short;
- ensure it does not queue;
- ensure slider feedback remains effectively immediate;
- disable it when reduced motion is requested.

Axis-range changes may transition subtly only if this is smooth and does not produce misleading overshoot/jitter. Immediate deterministic rescaling is preferable to a visually impressive but confusing morph.

### 9.4 Reduced motion

Honor `prefers-reduced-motion` globally.

Every mathematical state change must remain completely understandable with animation disabled.

Do not use motion as the sole indicator that a unit, activation, scale, or output changed.

---

## 10. Initial page layout

### 10.1 Header

Compact header area containing:

- title: `Shallow neural network` initially;
- architecture summary, e.g. `1 → 3 ReLU → 1`;
- computed parameter count, e.g. `10 parameters`;
- rendered output equation;
- reset action;
- optional preset selection when implemented.

Do not build a marketing-style hero.

### 10.2 Global controls

Near the header:

- activation selector;
- activation definition, e.g. `a[z] = max(0, z)`;
- scalar probe control for `x`;
- chart scale mode: `Fixed` / `Reachable`.

A compact segmented control is suitable where labels fit; otherwise use a Mantine `Select`.

### 10.3 Hidden-unit strip

Render units from data, never as three hard-coded components.

Use a horizontal scroll area with fixed/minimum card width so:

- 1 unit looks sensible;
- 3 units fit a normal desktop well;
- 6+ units scroll horizontally;
- arbitrary width remains usable.

The output chart remains outside the horizontal neuron scroll.

### 10.4 Hidden-unit card

For shallow unit `i`:

```text
Neuron i                              [Included]

Pre-activation
zᵢ = θᵢ₀ + θᵢ₁x
[ line chart ]

Activation
hᵢ = a[zᵢ]
[ activation chart ]

θᵢ₀   intercept      [ slider ] [value]
θᵢ₁   slope          [ slider ] [value]
φᵢ    output weight  [ slider ] [value]
```

When excluded:

- keep the card visible;
- keep both charts visible;
- keep controls editable;
- retain parameter values;
- visually mute the card modestly;
- clearly state that the unit is excluded downstream/from output.

Do not disable its controls.

### 10.5 Final output

Large output section below the unit strip:

\[
y(x)=\phi_0+\sum_i\phi_i h_i(x)
\]

Include:

- larger `y(x)` chart;
- `φ₀` output-intercept slider;
- optional toggle to show weighted contributions `φ_i h_i(x)` as subdued/dashed series;
- probe value `y(x_probe)`.

For small neuron counts, render the expanded equation. For larger counts, switch to sigma notation to avoid unwieldy UI.

---

## 11. Synchronized inspection

Use Mantine Charts/Recharts synchronization so all function charts share the same sampled `x` positions and inspection coordinate.

A hover at a given `x` should let the learner compare the same input across:

- every `z_i(x)`;
- every `h_i(x)`;
- the final `y(x)`;
- eventually every layer in a deep network.

The persistent `x` probe is separate from ephemeral hover.

For the probe, display a compact forward-pass summary, for example:

```text
x = 0.40
z₁ = ... → h₁ = ...
z₂ = ... → h₂ = ...
z₃ = ... → h₃ = ...
y  = ...
```

For deeper networks, the summary should be grouped by layer rather than flattened into an unreadable list.

Custom tooltips should use mathematical language rather than generic chart-series labels where practical.

---

## 12. Parameter controls

Initial sensible ranges may be:

```text
θ bias/intercept     [-2, 2], step 0.05
θ scalar weight      [-3, 3], step 0.05
φ output weight      [-3, 3], step 0.05
φ₀ output intercept  [-2, 2], step 0.05
x probe              input domain, e.g. [-1, 1]
```

Treat these as teaching-view configuration, not mathematical constraints on the domain model.

For later deep layers, incoming `θ` controls should be labelled by source unit/activation rather than “slope”. Consider a compact/collapsible parameter region for units with many incoming connections.

---

## 13. Presets

Presets configure a network and teaching view; they do not invoke special-case logic.

Initial required preset:

- scalar input domain `[-1, 1]`;
- one hidden layer;
- three units;
- ReLU by default;
- exactly 10 trainable `θ`/`φ` parameters;
- parameters selected to produce a visually meaningful piecewise-linear function on first load.

Future presets may demonstrate:

- one hinge;
- multiple hinges/regions;
- identity versus ReLU;
- logistic versus tanh;
- width changes;
- depth changes.

Every preset must pass domain validation tests.

---

## 14. Deep-network readiness

The initial UI need not expose add/remove-layer controls, but the domain and sampling pipeline must be exercised with multi-layer tests before the shallow UI is considered complete.

Future deep view concept:

```text
Input x

Layer 1                                      → horizontal scroll
[ unit ][ unit ][ unit ] ...

Layer 2                                      → horizontal scroll
[ unit ][ unit ] ...

...

Output y(x)
```

Because the external network input is scalar, every internal `z_li` and `h_li` remains a function of the original scalar `x` and can therefore be plotted against the same synchronized x-axis.

Depth should become mainly a presentation feature over an already-general evaluator.

---

## 15. Source layout

Prefer concept-owned modules rather than generic buckets.

Suggested initial structure:

```text
src/
├── domain/
│   ├── activation/
│   │   ├── activation.ts
│   │   ├── identity.ts
│   │   ├── leakyRelu.ts
│   │   ├── relu.ts
│   │   ├── sigmoid.ts
│   │   └── tanh.ts
│   ├── network/
│   │   ├── countParameters.ts
│   │   ├── evaluateHiddenLayer.ts
│   │   ├── evaluateHiddenUnit.ts
│   │   ├── evaluateNetwork.ts
│   │   ├── evaluateOutputLayer.ts
│   │   ├── sampleNetwork.ts
│   │   ├── types.ts
│   │   └── validateNetwork.ts
│   └── range/
│       └── reachableRange.ts
│
├── application/
│   ├── explorer/
│   │   ├── explorerReducer.ts
│   │   ├── selectors.ts
│   │   └── types.ts
│   └── presets/
│       ├── defaultShallow.ts
│       └── presets.ts
│
├── presentation/
│   ├── charts/
│   │   ├── ActivationChart.tsx
│   │   ├── OutputChart.tsx
│   │   ├── PreActivationChart.tsx
│   │   ├── chartAdapters.ts
│   │   └── chartConfig.ts
│   ├── controls/
│   │   ├── ActivationControl.tsx
│   │   ├── ParameterSlider.tsx
│   │   ├── ProbeControl.tsx
│   │   └── ScaleModeControl.tsx
│   ├── explorer/
│   │   ├── NetworkExplorer.tsx
│   │   ├── NetworkHeader.tsx
│   │   ├── ProbeSummary.tsx
│   │   └── UnitStrip.tsx
│   └── unit/
│       └── HiddenUnitCard.tsx
│
├── App.tsx
└── main.tsx
```

Do not create empty directories/files merely to match this tree. Let Knip reject unused scaffolding. Create a module when it has a caller/test.

Do not introduce `src/utils`, `src/helpers`, or `src/common` unless a concrete concept genuinely warrants such a module, and prefer a concept-specific name instead.

---

## 16. Static quality constraints

### 16.1 TypeScript

Use strict TypeScript 6.x with explicit strict options, including:

- `strict`;
- `noUncheckedIndexedAccess`;
- `exactOptionalPropertyTypes`;
- `noImplicitOverride`;
- `noPropertyAccessFromIndexSignature`;
- `noUncheckedSideEffectImports`;
- `noImplicitReturns`;
- `noFallthroughCasesInSwitch`;
- `noUnusedLocals`;
- `noUnusedParameters`;
- `allowUnreachableCode: false`;
- `allowUnusedLabels: false`;
- `isolatedModules`;
- `verbatimModuleSyntax`;
- `erasableSyntaxOnly`;
- `skipLibCheck: false`;
- `noEmit`.

No `any`. No casual assertions. No non-null assertions.

### 16.2 ESLint

Use flat config with type-aware Project Service and:

- `@eslint/js` recommended;
- `typescript-eslint` `strictTypeChecked`;
- `typescript-eslint` `stylisticTypeChecked`;
- React Hooks recommended rules;
- strict JSX accessibility rules;
- Vitest rules for test files;
- Playwright rules for E2E files;
- selective functional/immutability rules for `domain/**`.

Set zero warnings in CI.

Initial complexity budgets:

```text
complexity              8
max depth               3
max params              4
file code lines         250
ordinary function lines 50
React component lines   70
max statements          20
nested callbacks        3
```

### 16.3 Architecture

Enforce dependency direction mechanically with Dependency Cruiser.

### 16.4 Dead code

Run Knip with unused exports/files/dependencies treated as failures.

### 16.5 Formatting

Use exactly pinned Prettier and a formatting check in CI.

---

## 17. Testing specification

### 17.1 Domain unit tests

Use Vitest.

Require 100% branch/function/line/statement coverage for `src/domain/**`.

#### Activations

ReLU:

- negative input → `0`;
- zero → `0`;
- positive input → input.

Leaky ReLU:

- non-negative input → input;
- negative input → `αz`;
- configuration is preserved and validated.

Sigmoid:

- `a[0] = 0.5`;
- values lie strictly between 0 and 1 for finite inputs;
- representative monotonicity cases.

Tanh:

- `a[0] = 0`;
- representative values lie in `(-1, 1)`;
- odd symmetry on representative cases.

Identity:

- returns `z` exactly.

#### Hidden-unit/layer evaluation

Test:

- correct weighted affine sum;
- bias inclusion;
- activation applied exactly once;
- multiple incoming activations;
- arbitrary unit counts;
- previous layer `h` is used rather than `z`;
- exclusion produces zero downstream value while retaining mathematical `z` and `h`.

#### Network evaluation

Test:

- one and multiple hidden layers; validation should require at least one hidden layer for the initial domain;
- arbitrary widths;
- final `φ₀` inclusion;
- final `φ` weighted sum;
- activation change in a later layer leaves prior-layer values unchanged;
- excluded unit effect propagates downstream;
- network data is not mutated by evaluation.

#### Parameter count

Test shallow counts:

```text
n=1 → 4
n=3 → 10
n=8 → 25
```

Test at least one multi-layer network against the general dense-network count formula.

#### Identity-depth property

Construct representative deep networks with identity activation at every hidden layer and verify sampled second differences are zero within a documented floating-point tolerance, or otherwise verify equivalence to the analytically collapsed affine coefficients.

Prefer the analytic coefficient comparison if it remains clear and compact.

#### Sampling

Test:

- input endpoints included;
- sample count exact;
- monotonically ordered `x`;
- all network values correspond to direct evaluation at that `x`;
- deterministic output.

#### Reachable ranges

Test:

- positive-only values;
- negative-only values;
- mixed-sign values;
- zero-only values;
- constant non-zero values;
- very small spans;
- deterministic padding;
- all sampled values contained in returned domain;
- no zero-width/NaN/infinite domains.

### 17.2 Application and component tests

Use Testing Library and `user-event`.

Cover:

- arbitrary hidden-unit card counts;
- parameter sliders update the expected mathematical values;
- changing `θ` alters the relevant `z` and downstream values;
- changing `φ` does not alter hidden-unit `z`/`h`;
- changing `φ₀` does not alter hidden-unit values;
- activation selector changes `h` and output while preserving applicable `z` values;
- excluded units preserve editable parameters;
- re-including a unit uses its latest parameter values;
- persistent probe changes the displayed forward-pass values;
- fixed/reachable scale mode uses the expected domain source;
- reset returns exactly to preset state.

Do not assert Recharts SVG path internals.

### 17.3 Playwright

Small critical-path suite:

1. app renders;
2. default architecture shows `1 → 3 → 1` and `10 parameters`;
3. slider changes visibly alter the network/output;
4. exclude/include changes output and retains parameters;
5. activation switch works end-to-end;
6. probe interaction works;
7. fixed/reachable scale switch works;
8. reset restores default;
9. principal page has no serious automated accessibility violations.

Add a responsive smoke test for a narrow viewport and a wide viewport; confirm the neuron strip scrolls rather than compressing into unusable cards.

### 17.4 Mutation tests

Configure mutation testing for the pure mathematical domain after Gate 2.

Focus especially on:

- `+`/`-`/`*` operator mutations;
- activation branch mutations;
- parameter-count mutations;
- range-boundary mutations.

Do not mutate React/Mantine presentation initially.

---

## 18. Accessibility

Every interactive control must have an accessible label.

Requirements:

- keyboard-operable sliders;
- keyboard-operable activation and scale controls;
- semantic unit include/exclude switch;
- visible focus;
- sufficient contrast under Mantine defaults/customization;
- charts accompanied by textual mathematical context;
- probe values available as text, not chart position alone;
- reduced-motion support;
- no interaction that depends solely on hover.

Synchronized hover is an enhancement. The persistent keyboard-accessible probe is the accessible inspection mechanism.

---

## 19. Styling

Use Mantine components and theme conventions before custom CSS.

Desired visual language:

- standard Mantine;
- compact;
- neutral;
- minimal borders;
- restrained unit color identity;
- no gradients;
- no decorative illustrations;
- no excessive shadows;
- no giant typography;
- no redundant explanatory prose.

Use one consistent visual identity per hidden unit across its pre-activation, activation, contribution, and probe display where this remains accessible.

The final output should have stronger visual emphasis than individual hidden-unit traces.

---

## 20. GitHub CI and Pages

The app is fully static and client-side. GitHub Actions is the authoritative integration gate and GitHub Pages deployment mechanism.

The canonical production deployment is `https://nn.eoin.ai`, served from the root of that custom domain. Configure Vite with `base: '/'` (or omit `base`, whose default is `/`). Do **not** configure the project-site path `/neural-network-explorer/` for production. No backend, persistence, or repository secret is required for the initial tool.

### 20.1 Workflow triggers

The required CI workflow runs on:

- every pull request targeting `main`;
- every push to `main`;
- `workflow_dispatch` for manual diagnosis where useful.

Use concurrency keyed by workflow and ref, with `cancel-in-progress: true` for superseded pull-request runs.

Do not use `pull_request_target` to execute code from an untrusted pull request.

### 20.2 Workflow security and reproducibility

GitHub Actions configuration must demonstrate least privilege and deterministic tooling:

- default `permissions: contents: read`;
- grant `pages: write` and `id-token: write` only to the deploy job;
- pin all action references to immutable full commit SHAs, with the readable upstream version in a comment;
- let Dependabot maintain action SHA pins;
- use the exact Node and pnpm versions declared by the repository;
- install with `pnpm install --frozen-lockfile`;
- set sensible `timeout-minutes` per job;
- do not expose secrets to PR jobs;
- deploy via the protected GitHub `pages` environment.

### 20.3 Required CI jobs

Use clear jobs with one responsibility each. At minimum:

1. **commit-style**
   - checkout with enough/full history for the relevant commit range;
   - run Commitlint across every commit introduced by the PR/push;
   - on pull requests, pipe the PR title through Commitlint as well, so a squash merge produces a valid Conventional Commit.
2. **quality**
   - deterministic install;
   - `pnpm check`;
   - retain coverage output as a short-lived artifact only when useful for debugging.
3. **browser**
   - depends on `quality`;
   - install only the required Playwright browser(s), initially Chromium unless cross-browser behaviour becomes a teaching requirement;
   - run `pnpm test:e2e` including Axe checks.
4. **pages-build**
   - runs only for a push to protected `main`;
   - depends on `commit-style`, `quality`, and `browser`;
   - builds the exact green revision and uploads the Pages artifact.
5. **deploy**
   - depends on `pages-build`;
   - is the only job with Pages/id-token write permissions;
   - deploys to the GitHub `pages` environment.

A failure in commit style, static quality, tests, accessibility, browser integration, or production build must make deployment impossible.

### 20.4 Mutation CI

Measure domain mutation-test runtime before deciding whether it belongs in every PR.

Preferred progression:

- if the domain mutation suite remains comfortably fast, make it a required PR job;
- otherwise run it on pushes to `main`, on a scheduled cadence, and via `workflow_dispatch`;
- never silently ignore surviving mutations in `src/domain/**`.

### 20.5 Pages deployment and custom domain

The Pages path is:

```text
green commit-style + quality + browser
                ↓
          production build
                ↓
      upload Pages artifact
                ↓
        deploy environment
                ↓
        https://nn.eoin.ai
```

Deployment configuration:

1. In the repository's **Settings → Pages**, select **GitHub Actions** as the publishing source.
2. Set the repository custom domain to `nn.eoin.ai`.
3. At the DNS provider for `eoin.ai`, create a `CNAME` for `nn` pointing to `<GITHUB_USER>.github.io`. The DNS target is the user/organization Pages hostname, not the repository name or a repository path.
4. Prefer verifying `eoin.ai` in the GitHub account's Pages settings before relying on the subdomain, so immediate subdomains are protected against Pages-domain takeover.
5. After DNS validation and certificate issuance complete, enable **Enforce HTTPS**.
6. Keep Vite's production base at `/`; the custom domain serves this application at its root.

When publishing through a custom GitHub Actions workflow, a source `CNAME` file is not required and is not the authoritative custom-domain configuration. Keep the domain in GitHub Pages settings and DNS instead.

The default project-pages URL `<GITHUB_USER>.github.io/neural-network-explorer/` is not a supported production fallback for this root-based build. Verify production at `https://nn.eoin.ai`.

Do not commit `dist/` to the repository. The deployed artifact must contain `index.html` at its root.

### 20.6 Deployment smoke checks

After the first custom-domain deployment, verify at least:

- `https://nn.eoin.ai/` loads the application;
- built JS/CSS assets resolve from the custom-domain root rather than `/neural-network-explorer/`;
- HTTPS is valid and enforced;
- a production navigation/reload does not depend on the GitHub project-page URL;
- the deployed revision corresponds to the green `main` commit.

These are deployment checks, not reasons to introduce runtime environment detection into the application.

---

## 21. Repository hygiene and Git conventions

### 21.1 Reproducible repository metadata

The GitHub repository is named `neural-network-explorer`. Keep repository naming independent from the production hostname `nn.eoin.ai`.

Commit these root-level hygiene files/configurations at Gate 0:

- `.editorconfig` — UTF-8, LF, final newline, spaces;
- `.gitattributes` — normalized text and LF behaviour;
- `.gitignore` — dependencies, build output, coverage, Playwright artifacts, local caches, OS/editor files, and `.env` secrets;
- `.node-version` (or one equivalent) matching `package.json#engines`;
- exact `packageManager` entry for pnpm;
- committed `pnpm-lock.yaml`;
- `.npmrc`/pnpm settings that save exact versions, enforce engines, and surface peer-dependency problems;
- `package.json` with `private: true` unless package publication is intentionally introduced later.

Use exact dependency versions for this small reference implementation. Do not commit generated `dist`, coverage, Playwright reports, mutation reports, local environment files, or caches.

If runtime configuration is ever added, commit only a documented `.env.example` with variable names and safe placeholders.

### 21.2 Conventional Commits and Commitlint

Use Commitlint with `@commitlint/config-conventional`.

Required files/tooling:

```text
commitlint.config.mjs
.husky/commit-msg        # or an equivalently transparent commit-msg hook
```

The commit convention is:

```text
<type>[optional scope][!]: <description>
```

Examples:

```text
feat(charts): add reachable range scaling
fix(domain): preserve excluded unit parameters
test(activation): cover leaky ReLU negative branch
docs: explain identity activation
ci: gate Pages deployment on browser tests
refactor(domain)!: change connection identity representation
```

Use the standard Conventional Commit type set. Scopes are optional and should identify a real concept, not a ticket number. Add a concise header-length rule (approximately 72 characters) to discourage generated prose.

The local commit-msg hook is fast feedback only. CI must lint the relevant commit range independently.

If squash merge is the repository policy, lint PR titles with the same rules because the PR title becomes the canonical `main` commit subject.

### 21.3 Documentation quality

Add:

- `markdownlint-cli2` for Markdown structure/style;
- `cspell` for learner-facing prose and source strings;
- a small project dictionary for names/terms such as Mantine, Recharts, Vitest, Playwright, Knip, theta, phi, sigmoid, and tanh.

Do not disable spelling checks broadly because mathematical vocabulary produces a false positive; add the specific legitimate term to the dictionary.

### 21.4 Bundle-size budget

After Gate 0 produces the first real Mantine/Recharts production build, measure the unavoidable baseline and configure a tool such as Size Limit.

Set a small explicit budget relative to that measured baseline rather than inventing a number in advance. Once the baseline is accepted, a budget increase must be deliberate and explained.

This is primarily a guard against accidental dependency creep in AI-assisted edits.

### 21.5 Dependency maintenance

Commit `.github/dependabot.yml` with at least:

- weekly dependency updates for the npm/pnpm ecosystem;
- weekly GitHub Actions updates;
- sensible grouping of routine compatible updates to avoid PR noise.

Enable Dependabot security alerts and secret scanning where the repository/account supports them.

Do not make `pnpm audit` a deterministic PR gate: registry/advisory state is network-dependent and can change without a code change. Security advisories should instead be surfaced through GitHub dependency alerts and deliberate updates.

### 21.6 Collaboration files and repository settings

For a public/collaborative repository, include concise:

- `CONTRIBUTING.md` describing setup, `pnpm check`, `pnpm verify`, tests, and Conventional Commits;
- `.github/pull_request_template.md` with a short checklist for tests, architecture/notation impact, and UI screenshots when visual behaviour changes;
- `LICENSE` after an explicit license choice.

Avoid template bureaucracy that adds no useful information.

Recommended GitHub ruleset for `main`:

- require pull requests;
- require the CI checks from section 20;
- require linear history;
- prefer squash merging for this small repo;
- block force pushes and branch deletion;
- require conversation resolution where practical.

---

## 22. Quality-gate scripts

Use `pnpm` unless the repository already standardizes on a different package manager.

Required script semantics:

```text
pnpm format
pnpm format:check
pnpm docs:lint
pnpm spellcheck
pnpm typecheck
pnpm lint
pnpm architecture
pnpm knip
pnpm test
pnpm test:coverage
pnpm test:e2e
pnpm test:mutation
pnpm size
pnpm build
pnpm commitlint
pnpm check
pnpm verify
```

`pnpm check`:

```text
format:check
→ docs:lint
→ spellcheck
→ typecheck
→ lint --max-warnings=0
→ architecture
→ knip
→ test:coverage
→ build
→ size              # once the measured Gate 0 budget exists
```

`pnpm verify`:

```text
pnpm check
→ Playwright / Axe
```

Commitlint is range/event-aware: the local `commit-msg` hook lints one proposed commit, while CI supplies the PR/push base and head SHAs and also lints PR title when applicable. Do not make `pnpm check` guess a Git range.

Mutation testing can remain a separate slower command until its runtime justifies promotion to the required PR path.

---

## 23. Implementation gates

### Gate 0 — constrained scaffold

Deliver no neural-network functionality yet.

Establish:

- Vite;
- React;
- TypeScript 6.x strict configuration;
- Mantine Core/Hooks;
- Mantine Charts + Recharts;
- ESLint flat config with typed linting;
- Prettier;
- Markdownlint and CSpell;
- Commitlint + Conventional Commits configuration;
- transparent local `commit-msg` hook;
- `.editorconfig`, `.gitattributes`, `.gitignore`;
- exact Node/pnpm metadata and committed lockfile;
- strict package-manager settings;
- Dependency Cruiser;
- Knip;
- Size Limit (or equivalent) configured after measuring the first Mantine/Recharts build baseline;
- Vitest;
- Testing Library;
- Playwright;
- Axe;
- coverage thresholds;
- Dependabot configuration;
- GitHub CI with commit-style, quality, browser, and gated Pages jobs;
- least-privilege workflow permissions, concurrency, timeouts, and immutable action pins;
- GitHub Pages deployment pipeline for `https://nn.eoin.ai`;
- Vite production base `/` for root custom-domain hosting;
- documented Pages/DNS custom-domain setup with no source `CNAME` file dependency;
- concise contribution/PR guidance if the repository is collaborative/public;
- all scripts;
- minimal app shell.

Acceptance:

```text
pnpm check   PASS
pnpm verify  PASS
```

No lint warnings. No skipped tests. No dead-code findings.

### Gate 1 — activation and range primitives

Implement:

- activation definitions/registry;
- activation tests;
- pure reachable-range calculation;
- range tests.

No React dependency.

Acceptance:

- domain coverage 100%;
- Knip clean;
- architecture clean;
- `pnpm check` passes.

### Gate 2 — general dense network domain

Implement:

- domain network types;
- validation;
- hidden-unit evaluation;
- hidden-layer evaluation;
- output evaluation;
- general network evaluation;
- exploration intervention semantics;
- parameter counting;
- sampling;
- default shallow preset;
- at least one deep-network test fixture.

Required invariants:

- default preset count = 10;
- arbitrary widths tested;
- multiple hidden layers tested;
- no ReLU hard-coding in evaluator;
- identity-depth affine property tested;
- no React/Mantine/Recharts imports in domain.

Run initial domain mutation testing here.

### Gate 3 — shallow presentation shell

Implement:

- compact page/header;
- architecture/parameter summary;
- activation control;
- horizontal unit strip generated from data;
- unit cards;
- parameter controls;
- final output area;
- fixed scale mode.

No synchronized chart/probe work required yet.

Acceptance:

- arbitrary unit-count component test;
- no hard-coded three-column layout;
- wide/narrow layout smoke tests;
- `pnpm verify` passes.

### Gate 4 — charts and synchronized probe

Implement:

- pre-activation charts;
- activation charts;
- output chart;
- chart adapters;
- shared sampled `x` values;
- Mantine/Recharts synchronization;
- persistent scalar `x` probe;
- mathematical tooltips/summary;
- reference line/point as appropriate.

Acceptance:

- hover/probe behaviour does not change the mathematical model;
- probe is keyboard accessible;
- charts share x semantics;
- no brittle SVG tests;
- `pnpm verify` passes.

### Gate 5 — reachable scaling and restrained motion

Implement:

- fixed/reachable scale control;
- shared layer `z` ranges;
- shared layer `h` ranges;
- reachable output range;
- stable padding/constant-function handling;
- subtle discrete UI transitions;
- reduced-motion handling;
- no queued long chart animation during slider interaction.

Acceptance:

- scale calculations already covered in domain tests;
- component tests confirm correct scale policy selection;
- browser test confirms scale mode changes remain usable;
- reduced-motion browser/emulation check where practical;
- `pnpm verify` passes.

### Gate 6 — teaching polish

Implement only after the core is stable:

- initial visually meaningful parameters;
- weighted contribution overlay toggle;
- refined custom tooltip;
- polished empty/constant states;
- optional preset selector if useful;
- documentation describing the mathematics and architecture.

Run an adversarial architecture review before release.

---

## 24. Adversarial review before release

Search explicitly for these failure modes:

### Hard-coded width

Reject:

- `Neuron1`, `Neuron2`, `Neuron3` component logic;
- `z1`, `z2`, `z3` domain fields;
- fixed three-column layout assumptions;
- loops bounded by `3` for network semantics.

### Hard-coded depth

Reject:

- evaluator logic that directly assumes a single hidden layer;
- output code reaching into `hiddenLayers[0]` as a general case;
- sampling formats that cannot represent multiple layers.

### Activation leakage

Reject:

- `Math.max(0, z)` outside the ReLU definition/tests;
- activation-ID branching spread across evaluator/components;
- parameter count changing merely because activation changed.

### Notation drift

Reject inconsistent use of:

- `θ` versus `φ`;
- `z` versus `h`;
- ReLU as a synonym for generic `a[z]`;
- “slope” for arbitrary deeper-layer weights.

### UI contamination

Reject:

- chart types in domain;
- hover/probe state in network types;
- inclusion switch represented as a trainable parameter;
- derived sampled values stored redundantly in canonical React state.

### Model-generated verbosity

Reject:

- one-use abstraction layers;
- verbose names that obscure canonical notation;
- unnecessary factories/classes/services;
- empty extension hooks;
- unused exports;
- giant TSX components;
- comments that narrate code;
- repeated wrapper components that add no semantics.

### Repository / CI drift

Reject:

- non-Conventional commit or squash-merge subjects;
- unpinned Node/pnpm versions or a changed lockfile without the corresponding manifest intent;
- generated `dist`, coverage, Playwright, mutation, or cache artifacts committed to Git;
- GitHub Actions with broad write permissions;
- mutable action tags where immutable SHA pins are required;
- `pull_request_target` running untrusted project code;
- Pages deployment paths that can bypass required quality/browser jobs;
- new dependencies with no current caller or a disproportionate bundle-size cost;
- broad spelling/lint ignores added to silence one legitimate term;
- arbitrary bundle-budget increases;
- secrets or real credentials in source, config, examples, tests, screenshots, or fixtures.

### Testing smell

Reject:

- SVG-path snapshots;
- tests that only duplicate implementation arithmetic without checking meaningful properties;
- broad snapshots replacing targeted assertions;
- skipped/focused tests;
- coverage exclusions added for convenience;
- mutation survivors in core mathematics without investigation.

---

## 25. Definition of first-release success

A first release is ready for teaching when:

- a learner can manipulate all 10 parameters of the default `1 → 3 → 1` network;
- the UI uses Prince notation consistently;
- pre-activation, activation, and output functions are clear and synchronized;
- switching activation makes its effect visually obvious;
- the persistent `x` probe exposes a forward pass at one input;
- units can be excluded/re-included without losing their parameters;
- fixed and reachable chart scaling are both understandable and stable;
- motion is subtle and optional under reduced-motion settings;
- the domain already evaluates tested multi-layer networks even though the first UI is shallow;
- changing the default hidden width requires changing data/configuration, not application structure;
- the codebase contains no dead speculative scaffolding;
- repository history follows Conventional Commits and PR titles are squash-safe;
- Node, pnpm, dependencies, lockfile, and GitHub Actions are reproducibly pinned/maintained;
- documentation/spelling and bundle-size gates are green;
- GitHub Actions runs with least privilege and required jobs cannot be bypassed by Pages deployment;
- `pnpm check` and `pnpm verify` are green;
- GitHub Pages deploys only from a protected, green `main` revision;
- the production deployment resolves correctly at `https://nn.eoin.ai` with root-based asset paths and HTTPS.

The result should feel like an executable mathematical diagram rather than a generic dashboard.
