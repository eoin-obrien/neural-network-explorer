import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
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

/** Every plot's stated value axis, in forward-pass order. */
function valueAxes(): string[] {
  return screen
    .getAllByRole('figure')
    .map((figure) => figure.querySelector('figcaption')?.textContent ?? '');
}

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
