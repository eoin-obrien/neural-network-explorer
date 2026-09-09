import { expect, test } from 'vitest';

import { countParameters } from './countParameters';
import type { HiddenUnit, Network } from './types';
import { inputNodeId } from './types';

function shallowNetwork(width: number): Network {
  const units: readonly HiddenUnit[] = Array.from({ length: width }, (_, index) => ({
    id: `unit-${String(index)}`,
    thetaBias: 0,
    incomingTheta: [{ sourceId: inputNodeId, value: 1 }],
  }));

  return {
    hiddenLayers: [{ id: 'layer-1', units, activation: { id: 'relu' } }],
    output: { phi0: 0, incomingPhi: units.map((unit) => ({ sourceId: unit.id, value: 1 })) },
  };
}

// P(n) = 3n + 1 for a dense 1 -> n -> 1 network.
test.each([
  [1, 4],
  [3, 10],
  [8, 25],
])('a shallow network of width %i has %i trainable parameters', (width, expected) => {
  expect(countParameters(shallowNetwork(width))).toBe(expected);
});

test('the default 1 -> 3 -> 1 preset shape has exactly 10 parameters', () => {
  expect(countParameters(shallowNetwork(3))).toBe(10);
});

test('a multi-layer network counts every theta and phi', () => {
  const network: Network = {
    hiddenLayers: [
      {
        id: 'layer-1',
        units: [
          { id: 'a', thetaBias: 0, incomingTheta: [{ sourceId: inputNodeId, value: 1 }] },
          { id: 'b', thetaBias: 0, incomingTheta: [{ sourceId: inputNodeId, value: 1 }] },
        ],
        activation: { id: 'relu' },
      },
      {
        id: 'layer-2',
        units: [
          {
            id: 'c',
            thetaBias: 0,
            incomingTheta: [
              { sourceId: 'a', value: 1 },
              { sourceId: 'b', value: 1 },
            ],
          },
        ],
        activation: { id: 'relu' },
      },
    ],
    output: { phi0: 0, incomingPhi: [{ sourceId: 'c', value: 1 }] },
  };

  // Layer 1: 2 units x (1 bias + 1 weight) = 4. Layer 2: 1 bias + 2 weights = 3.
  // Output: phi0 + 1 phi = 2.
  expect(countParameters(network)).toBe(9);
});

// Alpha configures a[.]; it is not a trainable theta or phi.
test('activation configuration is not counted as a network parameter', () => {
  const relu = shallowNetwork(3);
  const leaky: Network = {
    ...relu,
    hiddenLayers: relu.hiddenLayers.map((layer) => ({
      ...layer,
      activation: { id: 'leaky-relu', alpha: 0.1 },
    })),
  };

  expect(countParameters(leaky)).toBe(countParameters(relu));
});
