import { expect, test } from 'vitest';

import type { LayerEvaluation, NetworkEvaluation, UnitEvaluation } from '../network/types';
import { layerRanges, outputRange } from './networkRanges';

function unit(unitId: string, z: number, h: number, downstreamValue = h): UnitEvaluation {
  return { unitId, z, h, downstreamValue };
}

function layer(layerId: string, units: readonly UnitEvaluation[]): LayerEvaluation {
  return { layerId, units };
}

// Two units whose extremes fall in different samples, so a range that read only
// one unit or only one sample would be visibly wrong.
const samples: readonly NetworkEvaluation[] = [
  { x: -1, layers: [layer('hidden-1', [unit('a', -2, 0), unit('b', 1, 1)])], y: -0.5 },
  { x: 1, layers: [layer('hidden-1', [unit('a', 2, 2), unit('b', -3, 0)])], y: 1.5 },
];

const deep: readonly NetworkEvaluation[] = [
  {
    x: 0,
    layers: [layer('hidden-1', [unit('a', 1, 1)]), layer('hidden-2', [unit('b', 10, 10)])],
    y: 3,
  },
];

test('a layer z range spans every unit in the layer', () => {
  // z reaches -3 and 2 across the two units; 5% of that span is 0.25.
  expect(layerRanges(samples, 'hidden-1').z).toStrictEqual({ min: -3.25, max: 2.25 });
});

test('a layer h range is taken from h alone, not from z', () => {
  // h reaches 0 and 2: the clamped units never carry z's -3 into the h axis.
  expect(layerRanges(samples, 'hidden-1').h).toStrictEqual({ min: -0.1, max: 2.1 });
});

// The unit is still drawn while it is excluded, so the axis it is drawn on has
// to contain it. Reading downstreamValue here would collapse it to zero.
test('an excluded unit still widens the range its own curves are drawn in', () => {
  const withExcluded: readonly NetworkEvaluation[] = [
    { x: 0, layers: [layer('hidden-1', [unit('a', 0, 0), unit('b', 4, 4, 0)])], y: 0 },
  ];

  expect(layerRanges(withExcluded, 'hidden-1').h).toStrictEqual({ min: -0.2, max: 4.2 });
});

test('each layer is scaled by what that layer reaches', () => {
  expect(layerRanges(deep, 'hidden-1').z).toStrictEqual({ min: 0.95, max: 1.05 });
  expect(layerRanges(deep, 'hidden-2').z).toStrictEqual({ min: 9.95, max: 10.05 });
});

test('a layer that is not in the samples still yields a usable axis', () => {
  expect(layerRanges(deep, 'hidden-9')).toStrictEqual({
    z: { min: -0.05, max: 0.05 },
    h: { min: -0.05, max: 0.05 },
  });
});

test('the output range comes from y alone', () => {
  expect(outputRange(samples)).toStrictEqual({ min: -0.6, max: 1.6 });
});

test('an output that never moves still yields a usable axis', () => {
  expect(outputRange(deep)).toStrictEqual({ min: 2.95, max: 3.05 });
});
