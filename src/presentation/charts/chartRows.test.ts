import { expect, test } from 'vitest';

import type { NetworkEvaluation } from '../../domain/network/types';
import { outputPlot, unitRows } from './chartRows';

function evaluation(x: number, z: number, h: number): NetworkEvaluation {
  return {
    x,
    layers: [
      { layerId: 'hidden-1', units: [{ unitId: 'a', z, h, downstreamValue: h }] },
      { layerId: 'hidden-2', units: [{ unitId: 'b', z: z * 2, h: h * 2, downstreamValue: h * 2 }] },
    ],
    contributions: [{ sourceId: 'b', value: h * 2 }],
    y: z + h,
  };
}

const samples: readonly NetworkEvaluation[] = [evaluation(-1, 0.5, 0.5), evaluation(1, -0.5, 0)];

test('a unit contributes one z row and one h row per sample, keyed by the original x', () => {
  expect(unitRows(samples, 'a')).toStrictEqual({
    z: [
      { x: -1, value: 0.5 },
      { x: 1, value: -0.5 },
    ],
    h: [
      { x: -1, value: 0.5 },
      { x: 1, value: 0 },
    ],
  });
});

// The unit is found by id, never by position: a unit in a later layer plots its
// own values rather than those of the unit sharing its index.
test('a unit deeper in the network is found by its identity', () => {
  expect(unitRows(samples, 'b').z).toStrictEqual([
    { x: -1, value: 1 },
    { x: 1, value: -1 },
  ]);
});

test('a unit the evaluation does not contain contributes no rows', () => {
  expect(unitRows(samples, 'absent')).toStrictEqual({ z: [], h: [] });
});

test('the output plots y against the same original x', () => {
  expect(outputPlot(samples).rows).toStrictEqual([
    { x: -1, value: 1, 'term-b': 1 },
    { x: 1, value: -0.5, 'term-b': 0 },
  ]);
});

// The keys are generated from the network's own connections. Nothing here
// counts units, so a wider or deeper network needs no change to be plotted.
// These samples have two layers, so the term names the last layer's unit.
test('every term of the output sum becomes a series of its own', () => {
  expect(outputPlot(samples).terms).toStrictEqual([{ key: 'term-b', name: 'φ₁h₂₁' }]);
});

test('a plot with nothing sampled has no terms rather than a missing one', () => {
  expect(outputPlot([])).toStrictEqual({ rows: [], terms: [] });
});

// A single evaluation is how the probe reaches the charts: the marker is the
// same function at one x, shaped by the same adapter as the curve.
test('one evaluation yields exactly one row per function', () => {
  const probe = evaluation(0, 0.25, 0.25);

  expect(unitRows([probe], 'a')).toStrictEqual({
    z: [{ x: 0, value: 0.25 }],
    h: [{ x: 0, value: 0.25 }],
  });
  expect(outputPlot([probe]).rows).toStrictEqual([{ x: 0, value: 0.5, 'term-b': 0.5 }]);
});
