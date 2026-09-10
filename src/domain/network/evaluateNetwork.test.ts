import { expect, test } from 'vitest';

import { evaluateNetwork } from './evaluateNetwork';
import type { ActivationSelection } from '../activation/activation';
import type { Network } from './types';
import { inputNodeId } from './types';

const none = new Set<string>();

const shallow: Network = {
  hiddenLayers: [
    {
      id: 'layer-1',
      units: [
        { id: 'u1', thetaBias: 0, incomingTheta: [{ sourceId: inputNodeId, value: 1 }] },
        { id: 'u2', thetaBias: 1, incomingTheta: [{ sourceId: inputNodeId, value: -1 }] },
      ],
      activation: { id: 'relu' },
    },
  ],
  output: {
    phi0: 0.5,
    incomingPhi: [
      { sourceId: 'u1', value: 2 },
      { sourceId: 'u2', value: -1 },
    ],
  },
};

// Two hidden layers where h and z differ, so reading z downstream would give a
// visibly different answer.
function twoLayer(secondActivation: ActivationSelection = { id: 'identity' }): Network {
  return {
    hiddenLayers: [
      {
        id: 'layer-1',
        units: [
          { id: 'a', thetaBias: 0, incomingTheta: [{ sourceId: inputNodeId, value: 1 }] },
          { id: 'b', thetaBias: 1, incomingTheta: [{ sourceId: inputNodeId, value: -1 }] },
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
        activation: secondActivation,
      },
    ],
    output: { phi0: 0, incomingPhi: [{ sourceId: 'c', value: 2 }] },
  };
}

test('a shallow forward pass retains x, every z and h, and y', () => {
  expect(evaluateNetwork(shallow, 2, none)).toStrictEqual({
    x: 2,
    layers: [
      {
        layerId: 'layer-1',
        units: [
          { unitId: 'u1', z: 2, h: 2, downstreamValue: 2 },
          // z = 1 - 2 = -1, clamped by ReLU.
          { unitId: 'u2', z: -1, h: 0, downstreamValue: 0 },
        ],
      },
    ],
    // The terms of y, kept beside their sum. The second is a negated zero
    // because -1 * 0 is: the sign is arithmetic, not meaning.
    contributions: [
      { sourceId: 'u1', value: 4 },
      { sourceId: 'u2', value: -0 },
    ],
    // y = 0.5 + 2 * 2 - 1 * 0
    y: 4.5,
  });
});

// The terms and the sum are one calculation, so a view can show what each unit
// puts into y without the risk of the two disagreeing.
test('the retained terms add up to the y beside them', () => {
  const { contributions, y } = evaluateNetwork(shallow, 2, none);

  expect(contributions.reduce((sum, term) => sum + term.value, shallow.output.phi0)).toBe(y);
});

test('phi0 shifts y and nothing else', () => {
  const shifted: Network = { ...shallow, output: { ...shallow.output, phi0: 2.5 } };

  expect(evaluateNetwork(shifted, 2, none).y).toBe(evaluateNetwork(shallow, 2, none).y + 2);
  expect(evaluateNetwork(shifted, 2, none).layers).toStrictEqual(
    evaluateNetwork(shallow, 2, none).layers,
  );
});

// At x = -2 the two candidates differ: h gives y = 6, z would give y = 2.
test('a later layer reads the previous layer h, not its z', () => {
  expect(evaluateNetwork(twoLayer(), -2, none).y).toBe(6);
});

test('changing a later layer activation leaves the earlier layer untouched', () => {
  const asIdentity = evaluateNetwork(twoLayer(), -2, none);
  const asTanh = evaluateNetwork(twoLayer({ id: 'tanh' }), -2, none);

  expect(asTanh.layers.at(0)).toStrictEqual(asIdentity.layers.at(0));
  expect(asTanh.y).toBeCloseTo(2 * Math.tanh(3), 12);
});

test('an excluded unit keeps its mathematics while its effect propagates as zero', () => {
  const excluded = evaluateNetwork(twoLayer(), 2, new Set(['a']));

  expect(excluded.layers.at(0)?.units.at(0)).toStrictEqual({
    unitId: 'a',
    z: 2,
    h: 2,
    downstreamValue: 0,
  });
  // Layer 2 therefore sees 0 from a and 0 from the ReLU-clamped b.
  expect(excluded.layers.at(1)?.units.at(0)?.z).toBe(0);
  expect(excluded.y).toBe(0);
  expect(evaluateNetwork(twoLayer(), 2, none).y).toBe(4);
});

test('evaluation does not mutate the network it is given', () => {
  const network = twoLayer();
  const before = structuredClone(network);

  evaluateNetwork(network, 0.5, new Set(['a']));

  expect(network).toStrictEqual(before);
});

// The initial domain models networks with at least one hidden layer; an output
// that names a unit no layer produced is malformed rather than degenerate.
test('an output connection with no hidden layer to read is rejected', () => {
  const noHiddenLayer: Network = {
    hiddenLayers: [],
    output: { phi0: 0, incomingPhi: [{ sourceId: 'u1', value: 1 }] },
  };

  expect(() => evaluateNetwork(noHiddenLayer, 0, none)).toThrow("'u1'");
});
