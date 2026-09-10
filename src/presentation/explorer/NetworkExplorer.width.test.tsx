import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';

import { defaultShallowPreset } from '../../application/presets/defaultShallow';
import type { Preset } from '../../application/presets/preset';
import { twoLayerPreset } from '../../application/presets/twoLayer';
import { theme } from '../theme';
import { NetworkExplorer } from './NetworkExplorer';

function renderExplorer(preset: Preset = defaultShallowPreset): {
  user: ReturnType<typeof userEvent.setup>;
} {
  const user = userEvent.setup();

  render(
    <MantineProvider theme={theme}>
      <NetworkExplorer preset={preset} />
    </MantineProvider>,
  );

  return { user };
}

function neuronCards(): HTMLElement[] {
  return screen.getAllByRole('article');
}

const addToFirst = { name: 'Add a neuron to hidden layer 1' };
const removeFromFirst = { name: 'Remove a neuron from hidden layer 1' };

test('adding a neuron renders another card and re-counts the parameters', async () => {
  const { user } = renderExplorer();

  expect(neuronCards()).toHaveLength(3);
  expect(screen.getByText('10 parameters')).toBeDefined();

  await user.click(screen.getByRole('button', addToFirst));

  expect(neuronCards()).toHaveLength(4);
  expect(screen.getByText('13 parameters')).toBeDefined();
  expect(screen.getByText('1 → 4 ReLU → 1')).toBeDefined();
});

test('the new neuron arrives with its own theta and phi sliders', async () => {
  const { user } = renderExplorer();

  await user.click(screen.getByRole('button', addToFirst));

  expect(screen.getByRole('slider', { name: 'θ₄₀ — intercept' })).toBeDefined();
  expect(screen.getByRole('slider', { name: 'θ₄₁ — slope' })).toBeDefined();
  expect(screen.getByRole('slider', { name: 'φ₄ — output weight' })).toBeDefined();
});

test('removing a neuron takes the last card and its parameters away', async () => {
  const { user } = renderExplorer();

  await user.click(screen.getByRole('button', removeFromFirst));

  expect(neuronCards()).toHaveLength(2);
  expect(screen.getByText('7 parameters')).toBeDefined();
  expect(screen.queryByRole('slider', { name: 'φ₃ — output weight' })).toBeNull();
});

test('the remove button gives out at one neuron and the add button at the cap', async () => {
  const { user } = renderExplorer();

  await user.click(screen.getByRole('button', removeFromFirst));
  await user.click(screen.getByRole('button', removeFromFirst));

  expect(neuronCards()).toHaveLength(1);
  expect(screen.getByRole('button', removeFromFirst).hasAttribute('disabled')).toBe(true);

  // Seven clicks from one unit reaches the eight the control stops at.
  for (let click = 0; click < 7; click += 1) {
    await user.click(screen.getByRole('button', addToFirst));
  }

  expect(neuronCards()).toHaveLength(8);
  expect(screen.getByRole('button', addToFirst).hasAttribute('disabled')).toBe(true);
});

test('changing a width leaves the other parameters where the learner put them', async () => {
  const { user } = renderExplorer();
  const phi0 = screen.getByRole('slider', { name: 'φ₀ — output intercept' });

  phi0.focus();
  await user.keyboard('{ArrowRight}');
  const moved = phi0.getAttribute('aria-valuenow');

  await user.click(screen.getByRole('button', addToFirst));

  expect(
    screen.getByRole('slider', { name: 'φ₀ — output intercept' }).getAttribute('aria-valuenow'),
  ).toBe(moved);
});

test('each layer of a deeper network widens on its own', async () => {
  const { user } = renderExplorer(twoLayerPreset);

  expect(neuronCards()).toHaveLength(4);

  await user.click(screen.getByRole('button', { name: 'Add a neuron to hidden layer 2' }));

  expect(neuronCards()).toHaveLength(5);
  expect(screen.getByText('1 → 2 ReLU → 3 ReLU → 1')).toBeDefined();
});

test('the width buttons are reachable and operable from the keyboard', async () => {
  const { user } = renderExplorer();

  screen.getByRole('button', addToFirst).focus();
  await user.keyboard('{Enter}');

  expect(neuronCards()).toHaveLength(4);
});

test('reset restores the width the preset declares', async () => {
  const { user } = renderExplorer();

  await user.click(screen.getByRole('button', addToFirst));
  await user.click(screen.getByRole('button', { name: 'Reset' }));

  expect(neuronCards()).toHaveLength(3);
  expect(screen.getByText('10 parameters')).toBeDefined();
});
