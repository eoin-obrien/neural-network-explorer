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

// The terms of the sum, on the same axes as the sum: a learner can see which
// unit put which part of y where. Off by default, so the plain function is
// what the page opens on.
test('the output terms are offered as an overlay and named as the equation writes them', async () => {
  const { user } = renderExplorer();
  const toggle = screen.getByRole('switch', { name: 'Show φᵢhᵢ terms' });

  expect(screen.getByText('y from -2.00 to 2.00')).toBeDefined();

  await user.click(toggle);

  expect(screen.getByText('y from -2.00 to 2.00, with terms φ₁h₁, φ₂h₂, φ₃h₃')).toBeDefined();
  // The overlay is a way of drawing y, not a change to it.
  expect(screen.getByText('y = -0.04')).toBeDefined();

  await user.click(toggle);

  expect(screen.getByText('y from -2.00 to 2.00')).toBeDefined();
});

test('excluding every unit says so, because y is then the constant φ₀', async () => {
  const { user } = renderExplorer();

  for (const number of [1, 2, 3]) {
    await user.click(screen.getByRole('switch', { name: `Neuron ${String(number)} included` }));
  }

  expect(screen.getByText('Every unit is excluded, so y is the constant φ₀.')).toBeDefined();
  expect(screen.getByText('y = -0.40')).toBeDefined();

  await user.click(screen.getByRole('switch', { name: 'Neuron 1 included' }));

  expect(screen.queryByText('Every unit is excluded, so y is the constant φ₀.')).toBeNull();
});

test('the preset selector starts a fresh exploration of the chosen network', async () => {
  const { user } = renderExplorer();

  await user.click(slider('θ₁₀ — intercept'));
  await user.keyboard('{ArrowRight}{ArrowRight}');
  await user.click(screen.getByRole('switch', { name: 'Neuron 1 included' }));

  await user.click(screen.getByRole('combobox', { name: 'Network' }));
  await user.click(screen.getByRole('option', { name: 'One hidden unit', hidden: true }));

  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('One hidden unit');
  expect(screen.getByText('1 → 1 ReLU → 1')).toBeDefined();
  // P(n) = 3n + 1.
  expect(screen.getByText('4 parameters')).toBeDefined();
  expect(screen.getAllByText(/^Neuron \d+$/)).toHaveLength(1);
  // The edit and the exclusion belonged to the network that was left behind.
  expect(screen.queryByText('Excluded from the output')).toBeNull();
});

test('a deeper preset renders a strip per layer with layer-indexed symbols', async () => {
  const { user } = renderExplorer();

  await user.click(screen.getByRole('combobox', { name: 'Network' }));
  await user.click(screen.getByRole('option', { name: 'Two hidden layers', hidden: true }));

  expect(screen.getByText('1 → 2 ReLU → 2 ReLU → 1')).toBeDefined();
  expect(screen.getByRole('region', { name: 'Hidden layer 2' })).toBeDefined();
  expect(screen.getByRole('slider', { name: 'θ₂₁₁ — weight on h₁₁' })).toBeDefined();
  expect(screen.getByText('y = φ₀ + φ₁h₂₁ + φ₂h₂₂')).toBeDefined();
});

// Reset returns to the preset being explored, not to the one the page opened on.
test('reset returns to the selected preset rather than the initial one', async () => {
  const { user } = renderExplorer();

  await user.click(screen.getByRole('combobox', { name: 'Network' }));
  await user.click(screen.getByRole('option', { name: 'One hidden unit', hidden: true }));
  await user.click(slider('θ₁₀ — intercept'));
  await user.keyboard('{ArrowRight}');
  await user.click(screen.getByRole('button', { name: 'Reset' }));

  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('One hidden unit');
  expect(screen.getByText('4 parameters')).toBeDefined();
});

/*
 * The plots read a deferred copy of the state so a drag is not held up by
 * seventeen redraws. Deferring is a scheduling decision, not a second source of
 * truth: once React has settled, every reading agrees.
 *
 * The inclusion switch is deliberately not deferred. It reports the click it
 * has just received rather than lagging a frame behind it, and the exclusion is
 * already carried into the plots as a withheld contribution.
 */
test('a settled view agrees with the controls that produced it', async () => {
  const { user } = renderExplorer();

  await user.click(slider('θ₁₀ — intercept'));
  await user.keyboard('{ArrowRight}');

  expect(slider('θ₁₀ — intercept').getAttribute('aria-valuenow')).toBe('0.45');
  expect(screen.getByText('z₁ = 0.45 → h₁ = 0.45')).toBeDefined();
  expect(screen.getByText('y = 0.01')).toBeDefined();
});

test('the inclusion switch answers its own click', async () => {
  const { user } = renderExplorer();

  await user.click(screen.getByRole('switch', { name: 'Neuron 1 included' }));

  expect(screen.getByRole('switch', { name: 'Neuron 1 included', checked: false })).toBeDefined();
  expect(screen.getByText('Excluded from the output')).toBeDefined();
  expect(screen.getByText('y = -0.40')).toBeDefined();
});

// Two places print the probe's x: the control that sets it and the forward pass
// stated beside the output. Deferring the plots must not leave those two reading
// different numbers while a drag settles, so the stated pass is never deferred.
test('both readings of the probe x agree', async () => {
  const { user } = renderExplorer();

  await user.click(slider('x — network input'));
  await user.keyboard('{ArrowRight}{ArrowRight}');

  const control = slider('x — network input').getAttribute('aria-valuenow');

  expect(control).toBe('0.1');
  expect(screen.getByText('x = 0.10')).toBeDefined();
});
