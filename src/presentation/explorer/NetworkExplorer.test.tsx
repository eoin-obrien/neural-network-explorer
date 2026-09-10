import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';

import { defaultShallowPreset } from '../../application/presets/defaultShallow';
import { theme } from '../theme';
import { NetworkExplorer } from './NetworkExplorer';

function renderExplorer(): { user: ReturnType<typeof userEvent.setup> } {
  const user = userEvent.setup();

  render(
    <MantineProvider theme={theme}>
      <NetworkExplorer preset={defaultShallowPreset} />
    </MantineProvider>,
  );

  return { user };
}

function slider(name: string): HTMLElement {
  return screen.getByRole('slider', { name });
}

function accessibleName(element: HTMLElement): string {
  return element.getAttribute('aria-label') ?? '';
}

/** Every plot's stated value axis, in forward-pass order. */
function valueAxes(): string[] {
  return screen
    .getAllByRole('figure')
    .map((figure) => figure.querySelector('figcaption')?.textContent ?? '');
}

test('the header reports the architecture and the trainable parameter count', () => {
  renderExplorer();

  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Shallow neural network');
  expect(screen.getByText('1 → 3 ReLU → 1')).toBeDefined();
  expect(screen.getByText('10 parameters')).toBeDefined();
  expect(screen.getByText('y = φ₀ + φ₁h₁ + φ₂h₂ + φ₃h₃')).toBeDefined();
});

test('one card is rendered for each hidden unit in the preset', () => {
  renderExplorer();

  expect(screen.getAllByText(/^Neuron \d+$/)).toHaveLength(3);
});

test('the probe reports the forward pass at x = 0', () => {
  renderExplorer();

  // z1 = 0.40, z2 = -0.20 and z3 = -0.90 at x = 0; ReLU clamps the last two.
  expect(screen.getByText('x = 0.00')).toBeDefined();
  expect(screen.getByText('z₁ = 0.40 → h₁ = 0.40')).toBeDefined();
  expect(screen.getByText('z₂ = -0.20 → h₂ = 0.00')).toBeDefined();
  expect(screen.getByText('z₃ = -0.90 → h₃ = 0.00')).toBeDefined();
  // y = -0.40 + 0.9 * 0.40
  expect(screen.getByText('y = -0.04')).toBeDefined();
});

// Every plot is named for the function it draws and for the coordinate it draws
// it against, so the shared horizontal axis is part of the stated contract
// rather than an accident of how the charts happen to be configured.
test('every stage of the forward pass is a named plot against the original x', () => {
  renderExplorer();

  expect(screen.getAllByRole('figure').map(accessibleName)).toStrictEqual([
    'z₁ against x',
    'h₁ against x',
    'z₂ against x',
    'h₂ against x',
    'z₃ against x',
    'h₃ against x',
    'y against x',
  ]);
});

test('every parameter of every unit has an accessible mathematical name', () => {
  renderExplorer();

  expect(slider('θ₁₀ — intercept')).toBeDefined();
  expect(slider('θ₁₁ — slope')).toBeDefined();
  expect(slider('φ₁ — output weight')).toBeDefined();
  expect(slider('φ₀ — output intercept')).toBeDefined();
  expect(slider('x — network input')).toBeDefined();
});

test('changing a theta changes that unit z, its h, and the output', async () => {
  const { user } = renderExplorer();

  await user.click(slider('θ₁₀ — intercept'));
  await user.keyboard('{ArrowRight}{ArrowRight}');

  // theta_10 moves 0.40 -> 0.50, so z1 and h1 follow and y gains 0.9 * 0.10.
  expect(screen.getByText('z₁ = 0.50 → h₁ = 0.50')).toBeDefined();
  expect(screen.getByText('y = 0.05')).toBeDefined();
  expect(screen.getByText('z₂ = -0.20 → h₂ = 0.00')).toBeDefined();
});

test('changing a phi changes the output but leaves every hidden unit alone', async () => {
  const { user } = renderExplorer();

  await user.click(slider('φ₁ — output weight'));
  await user.keyboard('{ArrowRight}{ArrowRight}');

  // phi_1 moves 0.90 -> 1.00, so y gains 0.10 * h1.
  expect(screen.getByText('z₁ = 0.40 → h₁ = 0.40')).toBeDefined();
  expect(screen.getByText('y = 0.00')).toBeDefined();
});

test('phi0 shifts the output vertically and nothing else', async () => {
  const { user } = renderExplorer();

  await user.click(slider('φ₀ — output intercept'));
  await user.keyboard('{ArrowRight}');

  expect(screen.getByText('z₁ = 0.40 → h₁ = 0.40')).toBeDefined();
  expect(screen.getByText('y = 0.01')).toBeDefined();
});

test('moving the probe reports the forward pass at the new x', async () => {
  const { user } = renderExplorer();

  await user.click(slider('x — network input'));
  await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}');

  // x = 0.20: z1 = 0.40 + 1.6 * 0.20, z3 = -0.90 + 2 * 0.20.
  expect(screen.getByText('x = 0.20')).toBeDefined();
  expect(screen.getByText('z₁ = 0.72 → h₁ = 0.72')).toBeDefined();
  expect(screen.getByText('z₃ = -0.50 → h₃ = 0.00')).toBeDefined();
});

test('switching activation changes h and the output while z is preserved', async () => {
  const { user } = renderExplorer();

  await user.click(screen.getByRole('combobox', { name: 'Activation a[z]' }));
  // jsdom performs no layout, so Floating UI reports the popover's reference as
  // hidden and styles the dropdown display:none. The options are rendered and
  // clickable; Playwright covers that they are visible in a real browser.
  await user.click(screen.getByRole('option', { name: 'Identity', hidden: true }));

  // Identity leaves every z alone and lets the negative ones through.
  expect(screen.getByText('a[z] = z')).toBeDefined();
  expect(screen.getByText('z₁ = 0.40 → h₁ = 0.40')).toBeDefined();
  expect(screen.getByText('z₂ = -0.20 → h₂ = -0.20')).toBeDefined();
  expect(screen.getByText('z₃ = -0.90 → h₃ = -0.90')).toBeDefined();
  // y = -0.40 + 0.9 * 0.40 + 0.8 * -0.20 - 1.3 * -0.90
  expect(screen.getByText('y = 0.97')).toBeDefined();
  expect(screen.getByText('1 → 3 Identity → 1')).toBeDefined();
});

test('excluding a unit removes its contribution while keeping its mathematics', async () => {
  const { user } = renderExplorer();

  await user.click(screen.getByRole('switch', { name: 'Neuron 1 included' }));

  expect(screen.getByText('Excluded from the output')).toBeDefined();
  // Neuron 1 still computes z1 and h1; only phi_1 h_1 leaves the sum.
  expect(screen.getByText('z₁ = 0.40 → h₁ = 0.40')).toBeDefined();
  expect(screen.getByText('y = -0.40')).toBeDefined();
});

test('an excluded unit keeps editable parameters, and restoring it uses them', async () => {
  const { user } = renderExplorer();

  await user.click(screen.getByRole('switch', { name: 'Neuron 1 included' }));
  await user.click(slider('θ₁₀ — intercept'));
  await user.keyboard('{ArrowRight}{ArrowRight}');

  // The parameter moved while the unit was excluded, so its own z and h follow
  // even though the output does not.
  expect(screen.getByText('z₁ = 0.50 → h₁ = 0.50')).toBeDefined();
  expect(screen.getByText('y = -0.40')).toBeDefined();

  await user.click(screen.getByRole('switch', { name: 'Neuron 1 included' }));

  // Restoring uses the parameter as it stands now, not as it was.
  expect(screen.getByText('y = 0.05')).toBeDefined();
});

test('reset returns the network and the probe to the preset', async () => {
  const { user } = renderExplorer();

  await user.click(slider('θ₁₀ — intercept'));
  await user.keyboard('{ArrowRight}{ArrowRight}');
  await user.click(slider('x — network input'));
  await user.keyboard('{ArrowRight}{ArrowRight}');
  await user.click(screen.getByRole('switch', { name: 'Neuron 1 included' }));

  await user.click(screen.getByRole('button', { name: 'Reset' }));

  expect(screen.getByText('x = 0.00')).toBeDefined();
  expect(screen.getByText('z₁ = 0.40 → h₁ = 0.40')).toBeDefined();
  expect(screen.getByText('y = -0.04')).toBeDefined();
  expect(screen.queryByText('Excluded from the output')).toBeNull();
});

// The scale mode is a way of looking at the network, so the value axis moves
// and nothing the mathematics says about the network does.
test('the fixed scale draws every plot on the axis the preset chose', () => {
  renderExplorer();

  expect(valueAxes()).toStrictEqual([
    'z₁ from -3.00 to 3.00',
    'h₁ from -3.00 to 3.00',
    'z₂ from -3.00 to 3.00',
    'h₂ from -3.00 to 3.00',
    'z₃ from -3.00 to 3.00',
    'h₃ from -3.00 to 3.00',
    'y from -2.00 to 2.00',
  ]);
});

test('reachable scaling shares one z range and one h range across the layer', async () => {
  const { user } = renderExplorer();

  await user.click(screen.getByRole('radio', { name: 'Reachable' }));

  // z reaches -2.9 at unit 3 and 2 at unit 1; ReLU clamps h to [0, 2]. Both
  // ranges are the union over the layer, so the three cards stay comparable.
  expect(valueAxes()).toStrictEqual([
    'z₁ from -3.15 to 2.25',
    'h₁ from -0.10 to 2.10',
    'z₂ from -3.15 to 2.25',
    'h₂ from -0.10 to 2.10',
    'z₃ from -3.15 to 2.25',
    'h₃ from -0.10 to 2.10',
    'y from -0.25 to 1.10',
  ]);
});

test('rescaling changes the axes and nothing the forward pass reports', async () => {
  const { user } = renderExplorer();

  await user.click(screen.getByRole('radio', { name: 'Reachable' }));

  expect(screen.getByText('Axes from the values reached over x')).toBeDefined();
  expect(screen.getByText('x = 0.00')).toBeDefined();
  expect(screen.getByText('z₁ = 0.40 → h₁ = 0.40')).toBeDefined();
  expect(screen.getByText('y = -0.04')).toBeDefined();
});

test('the output range follows an intervention while the fixed one does not', async () => {
  const { user } = renderExplorer();

  await user.click(screen.getByRole('radio', { name: 'Reachable' }));
  await user.click(screen.getByRole('switch', { name: 'Neuron 1 included' }));

  expect(screen.getByText('y from -1.97 to 1.18')).toBeDefined();

  await user.click(screen.getByRole('radio', { name: 'Fixed' }));

  expect(screen.getByText('y from -2.00 to 2.00')).toBeDefined();
});

test('reset returns to the stable teaching scale', async () => {
  const { user } = renderExplorer();

  await user.click(screen.getByRole('radio', { name: 'Reachable' }));
  await user.click(screen.getByRole('button', { name: 'Reset' }));

  expect(screen.getByText('Axes chosen by the preset')).toBeDefined();
  expect(screen.getByText('y from -2.00 to 2.00')).toBeDefined();
});

// The wheel is the fine adjustment a drag across a short track cannot make.
// It is deliberately gated on focus: a control that took the wheel on hover
// would rewrite the mathematics under someone merely scrolling the page.
test('scrolling a focused slider steps it, and an unfocused one ignores it', async () => {
  const { user } = renderExplorer();
  const theta = slider('θ₁₀ — intercept');

  fireEvent.wheel(theta, { deltaY: -100 });

  expect(screen.getByText('z₁ = 0.40 → h₁ = 0.40')).toBeDefined();

  await user.click(theta);
  fireEvent.wheel(theta, { deltaY: -100 });

  expect(screen.getByText('z₁ = 0.45 → h₁ = 0.45')).toBeDefined();

  fireEvent.wheel(theta, { deltaY: 200 });

  expect(screen.getByText('z₁ = 0.35 → h₁ = 0.35')).toBeDefined();
});

// The wheel and the arrow keys move on the same grid, so no value the wheel can
// reach is out of a keyboard's reach.
test('the wheel and the arrow keys agree step for step', async () => {
  const { user } = renderExplorer();
  const theta = slider('θ₁₀ — intercept');

  await user.click(theta);
  await user.keyboard('{ArrowRight}{ArrowRight}');

  expect(screen.getByText('z₁ = 0.50 → h₁ = 0.50')).toBeDefined();

  fireEvent.wheel(theta, { deltaY: 200 });

  expect(screen.getByText('z₁ = 0.40 → h₁ = 0.40')).toBeDefined();
});

// A trackpad sends a stream of deltas far smaller than a mouse notch. None of
// them is a step on its own, and none of them is thrown away either.
test('scroll too small to be a step is carried until it is one', async () => {
  const { user } = renderExplorer();
  const theta = slider('θ₁₀ — intercept');

  await user.click(theta);
  fireEvent.wheel(theta, { deltaY: -40 });

  expect(screen.getByText('z₁ = 0.40 → h₁ = 0.40')).toBeDefined();

  fireEvent.wheel(theta, { deltaY: -40 });
  fireEvent.wheel(theta, { deltaY: -40 });

  expect(screen.getByText('z₁ = 0.45 → h₁ = 0.45')).toBeDefined();
});

test('scrolling stops at the ends of the control range', async () => {
  const { user } = renderExplorer();
  const theta = slider('θ₁₀ — intercept');

  await user.click(theta);
  // theta_10 starts at 0.40 and its control stops at 2, well short of 40 steps.
  fireEvent.wheel(theta, { deltaY: -4000 });

  expect(screen.getByText('z₁ = 2.00 → h₁ = 2.00')).toBeDefined();

  fireEvent.wheel(theta, { deltaY: 8000 });

  expect(screen.getByText('z₁ = -2.00 → h₁ = 0.00')).toBeDefined();
});

test('the probe is scrollable too', async () => {
  const { user } = renderExplorer();
  const probe = slider('x — network input');

  await user.click(probe);
  fireEvent.wheel(probe, { deltaY: -400 });

  expect(screen.getByText('x = 0.20')).toBeDefined();
});

test('changing the scalar-input weight tilts that unit and the output with it', async () => {
  const { user } = renderExplorer();

  await user.click(slider('x — network input'));
  await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}');
  await user.click(slider('θ₁₁ — slope'));
  await user.keyboard('{ArrowRight}{ArrowRight}');

  // theta_11 moves 1.60 -> 1.70, and at x = 0.20 that is z1 = 0.40 + 0.34.
  expect(screen.getByText('z₁ = 0.74 → h₁ = 0.74')).toBeDefined();
  expect(screen.getByText('y = 0.27')).toBeDefined();
});
