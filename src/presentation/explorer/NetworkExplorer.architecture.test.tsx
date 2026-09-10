import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import type { Preset } from '../../application/presets/preset';
import type { HiddenUnit, Network } from '../../domain/network/types';
import { inputNodeId } from '../../domain/network/types';
import { theme } from '../theme';
import { NetworkExplorer } from './NetworkExplorer';

const fixedScale = {
  z: { min: -3, max: 3 },
  h: { min: -3, max: 3 },
  y: { min: -2, max: 2 },
};

function presetFor(network: Network): Preset {
  return {
    id: 'test',
    title: 'Test network',
    lesson: 'A network shaped only to exercise the layout.',
    network,
    xDomain: [-1, 1],
    fixedScale,
  };
}

/** The width lives in the data: nothing in the layout knows how many units. */
function shallowNetwork(width: number): Network {
  const units: readonly HiddenUnit[] = Array.from({ length: width }, (_, index) => ({
    id: `unit-${String(index + 1)}`,
    thetaBias: 0.1 * index,
    incomingTheta: [{ sourceId: inputNodeId, value: 1 }],
  }));

  return {
    hiddenLayers: [{ id: 'hidden-1', units, activation: { id: 'relu' } }],
    output: { phi0: 0, incomingPhi: units.map((unit) => ({ sourceId: unit.id, value: 1 })) },
  };
}

const deepNetwork: Network = {
  hiddenLayers: [
    {
      id: 'hidden-1',
      units: [
        { id: 'a', thetaBias: 0.1, incomingTheta: [{ sourceId: inputNodeId, value: 1 }] },
        { id: 'b', thetaBias: -0.2, incomingTheta: [{ sourceId: inputNodeId, value: -1 }] },
      ],
      activation: { id: 'identity' },
    },
    {
      id: 'hidden-2',
      units: [
        {
          id: 'c',
          thetaBias: 0,
          incomingTheta: [
            { sourceId: 'a', value: 1 },
            { sourceId: 'b', value: 0.5 },
          ],
        },
      ],
      activation: { id: 'tanh' },
    },
  ],
  output: { phi0: 0.2, incomingPhi: [{ sourceId: 'c', value: 1 }] },
};

function accessibleName(element: HTMLElement): string {
  return element.getAttribute('aria-label') ?? '';
}

function renderPreset(network: Network): void {
  render(
    <MantineProvider theme={theme}>
      <NetworkExplorer preset={presetFor(network)} />
    </MantineProvider>,
  );
}

test.each([1, 3, 5, 8])('a preset of width %i renders that many unit cards', (width) => {
  renderPreset(shallowNetwork(width));

  expect(screen.getAllByText(/^Neuron \d+$/)).toHaveLength(width);
  expect(screen.getByText(`1 → ${String(width)} ReLU → 1`)).toBeDefined();
  // P(n) = 3n + 1.
  expect(screen.getByText(`${String(3 * width + 1)} parameters`)).toBeDefined();
});

test('a wide network states the output in sigma notation instead of expanding it', () => {
  renderPreset(shallowNetwork(8));

  expect(screen.getByText('y = φ₀ + Σᵢ φᵢ hᵢ')).toBeDefined();
});

test('a narrow network expands the output sum term by term', () => {
  renderPreset(shallowNetwork(2));

  expect(screen.getByText('y = φ₀ + φ₁h₁ + φ₂h₂')).toBeDefined();
});

test('a two-layer network renders a strip per layer', () => {
  renderPreset(deepNetwork);

  // Each strip is a named region, so which layer's neurons these are survives
  // for a reader who never sees the heading beside them.
  expect(screen.getByRole('region', { name: 'Hidden layer 1' })).toBeDefined();
  expect(screen.getByRole('region', { name: 'Hidden layer 2' })).toBeDefined();
  expect(screen.getByText('1 → 2 Identity → 1 Tanh → 1')).toBeDefined();
  // Layer 1: 2 x (bias + weight). Layer 2: bias + 2 weights. Output: phi0 + phi.
  expect(screen.getByText('9 parameters')).toBeDefined();
  // The output reads the last layer, so its term names that layer's unit.
  expect(screen.getByText('y = φ₀ + φ₁h₂₁')).toBeDefined();
});

test('a deeper unit labels its theta by the activation it reads, not as a slope', () => {
  renderPreset(deepNetwork);

  // theta_lij: layer 2, unit 1, reading h_11 and h_12 — the activations of
  // layer 1, named the way layer 1's own cards name them.
  expect(screen.getByRole('slider', { name: 'θ₂₁₁ — weight on h₁₁' })).toBeDefined();
  expect(screen.getByRole('slider', { name: 'θ₂₁₂ — weight on h₁₂' })).toBeDefined();
  expect(screen.getByRole('slider', { name: 'θ₁₁₁ — slope' })).toBeDefined();
  expect(screen.getByRole('slider', { name: 'θ₁₂₁ — slope' })).toBeDefined();
});

// Two units in different layers are both "unit 1" of their layer, so without
// the layer index they would present the same symbol for different parameters.
test('depth puts the layer index into every symbol', () => {
  renderPreset(deepNetwork);

  expect(screen.getAllByRole('slider', { name: /^θ/ }).map(accessibleName)).toStrictEqual([
    'θ₁₁₀ — intercept',
    'θ₁₁₁ — slope',
    'θ₁₂₀ — intercept',
    'θ₁₂₁ — slope',
    'θ₂₁₀ — intercept',
    'θ₂₁₁ — weight on h₁₁',
    'θ₂₁₂ — weight on h₁₂',
  ]);
});

// The shallow view drops the layer index, exactly as Prince writes a shallow
// network: theta_i0 and theta_i1, not theta_1i0.
test('a single hidden layer keeps the shallow subscripts', () => {
  renderPreset(shallowNetwork(2));

  expect(screen.getAllByRole('slider', { name: /^θ/ }).map(accessibleName)).toStrictEqual([
    'θ₁₀ — intercept',
    'θ₁₁ — slope',
    'θ₂₀ — intercept',
    'θ₂₁ — slope',
  ]);
});

test('only the units the output reads carry a phi control', () => {
  renderPreset(deepNetwork);

  // Three units, but the output connects to the last layer alone. With depth a
  // card names its layer too: every layer otherwise has a neuron 1.
  expect(screen.getAllByText(/^Layer \d+ neuron \d+$/)).toHaveLength(3);
  expect(screen.getAllByRole('slider', { name: /output weight$/ })).toHaveLength(1);
});

test('the probe summary groups the forward pass by layer once there is depth', () => {
  renderPreset(deepNetwork);

  expect(screen.getByText('Layer 1')).toBeDefined();
  expect(screen.getByText('Layer 2')).toBeDefined();
  // At x = 0 the identity layer passes its biases through, and
  // z_21 = 0.1 + 0.5 * -0.2.
  expect(screen.getByText('z₁₁ = 0.10 → h₁₁ = 0.10')).toBeDefined();
  expect(screen.getByText('z₁₂ = -0.20 → h₁₂ = -0.20')).toBeDefined();
  expect(screen.getByText('z₂₁ = 0.00 → h₂₁ = 0.00')).toBeDefined();
  expect(screen.getByText('y = 0.20')).toBeDefined();
});
