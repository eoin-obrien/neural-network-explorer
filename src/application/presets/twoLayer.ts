import type { Network } from '../../domain/network/types';
import { inputNodeId } from '../../domain/network/types';
import type { Preset } from './preset';

/*
 * Two hidden layers of two units. Layer 1 puts a hinge either side of the
 * origin; layer 2 mixes both of those activations, so its units are functions
 * of x that neither layer-1 unit produces on its own. That composition is the
 * whole point of depth, and it is what the second strip of cards shows.
 *
 * Prince indexes a deeper network by layer as well as unit, so the parameters
 * here read theta_lij: theta_211 is layer 2, unit 1, weighting h_11.
 *
 * The weights are scaled to keep every z, h and y inside the same fixed
 * teaching scale the shallow presets use, so switching between presets compares
 * like with like instead of silently rescaling the axes.
 */
const network: Network = {
  hiddenLayers: [
    {
      id: 'hidden-1',
      units: [
        { id: 'l1-a', thetaBias: 0.2, incomingTheta: [{ sourceId: inputNodeId, value: 2 }] },
        { id: 'l1-b', thetaBias: 0.1, incomingTheta: [{ sourceId: inputNodeId, value: -2 }] },
      ],
      activation: { id: 'relu' },
    },
    {
      id: 'hidden-2',
      units: [
        {
          id: 'l2-a',
          thetaBias: -0.2,
          incomingTheta: [
            { sourceId: 'l1-a', value: 1.2 },
            { sourceId: 'l1-b', value: -0.8 },
          ],
        },
        {
          id: 'l2-b',
          thetaBias: 0.1,
          incomingTheta: [
            { sourceId: 'l1-a', value: -1 },
            { sourceId: 'l1-b', value: 1.3 },
          ],
        },
      ],
      activation: { id: 'relu' },
    },
  ],
  output: {
    phi0: -0.2,
    incomingPhi: [
      { sourceId: 'l2-a', value: 0.8 },
      { sourceId: 'l2-b', value: 0.6 },
    ],
  },
};

export const twoLayerPreset: Preset = {
  id: 'two-layer',
  title: 'Two hidden layers',
  lesson: 'A deeper unit is built from the layer below it, not from x directly.',
  xDomain: [-1, 1],
  network,
  fixedScale: {
    z: { min: -3, max: 3 },
    h: { min: -3, max: 3 },
    y: { min: -2, max: 2 },
  },
};
