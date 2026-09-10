import type { Network } from '../../domain/network/types';
import { inputNodeId } from '../../domain/network/types';
import type { Preset } from './preset';

// One unit, so y(x) is phi0 + phi1 a[theta10 + theta11 x] and nothing else. The
// hinge sits at x = -0.2, inside the input domain, so both linear regions are
// on screen at once.
const network: Network = {
  hiddenLayers: [
    {
      id: 'hidden-1',
      units: [
        { id: 'unit-1', thetaBias: 0.3, incomingTheta: [{ sourceId: inputNodeId, value: 1.5 }] },
      ],
      activation: { id: 'relu' },
    },
  ],
  output: { phi0: -0.5, incomingPhi: [{ sourceId: 'unit-1', value: 1 }] },
};

/**
 * The smallest network that is not a straight line. Every parameter has one
 * visible job: theta moves the hinge, phi tilts the ramp, phi0 lifts the whole
 * function. Worth reaching for before the three-unit network makes sense.
 */
export const singleHingePreset: Preset = {
  id: 'single-hinge',
  title: 'One hidden unit',
  lesson: 'A single ReLU unit is one hinge between two straight lines.',
  xDomain: [-1, 1],
  network,
  fixedScale: {
    z: { min: -3, max: 3 },
    h: { min: -3, max: 3 },
    y: { min: -2, max: 2 },
  },
};
