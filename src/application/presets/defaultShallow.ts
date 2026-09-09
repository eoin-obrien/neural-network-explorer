import type { Network } from '../../domain/network/types';
import { inputNodeId } from '../../domain/network/types';
import type { Preset } from './preset';

// Chosen so ReLU puts three hinges inside x in [-1, 1] at x = -0.25, -0.1 and
// 0.45: the piecewise-linear shape is visible the moment the page loads.
const network: Network = {
  hiddenLayers: [
    {
      id: 'hidden-1',
      units: [
        { id: 'unit-1', thetaBias: 0.4, incomingTheta: [{ sourceId: inputNodeId, value: 1.6 }] },
        { id: 'unit-2', thetaBias: -0.2, incomingTheta: [{ sourceId: inputNodeId, value: -2 }] },
        { id: 'unit-3', thetaBias: -0.9, incomingTheta: [{ sourceId: inputNodeId, value: 2 }] },
      ],
      activation: { id: 'relu' },
    },
  ],
  output: {
    phi0: -0.4,
    incomingPhi: [
      { sourceId: 'unit-1', value: 0.9 },
      { sourceId: 'unit-2', value: 0.8 },
      { sourceId: 'unit-3', value: -1.3 },
    ],
  },
};

export const defaultShallowPreset: Preset = {
  id: 'shallow-relu',
  title: 'Shallow neural network',
  network,
  // Normalized input: every function plot samples this same domain.
  xDomain: [-1, 1],
  // z and h share one scale so a[z] can be read against the z it transforms.
  // y gets a tighter scale because a single output curve is the point of the
  // final chart rather than a comparison across units.
  fixedScale: {
    z: { min: -3, max: 3 },
    h: { min: -3, max: 3 },
    y: { min: -2, max: 2 },
  },
};
