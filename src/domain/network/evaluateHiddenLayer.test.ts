import { expect, test } from 'vitest';

import { evaluateHiddenLayer } from './evaluateHiddenLayer';
import type { HiddenLayer, HiddenUnit } from './types';
import { inputNodeId } from './types';

function scalarLayer(width: number): HiddenLayer {
  const units: readonly HiddenUnit[] = Array.from({ length: width }, (_, index) => ({
    id: `unit-${String(index + 1)}`,
    thetaBias: index,
    incomingTheta: [{ sourceId: inputNodeId, value: 1 }],
  }));

  return { id: 'layer-1', units, activation: { id: 'identity' } };
}

const none = new Set<string>();

test.each([1, 3, 7])('a layer of width %i evaluates every one of its units', (width) => {
  const evaluation = evaluateHiddenLayer(scalarLayer(width), new Map([[inputNodeId, 0]]), none);

  expect(evaluation.units).toHaveLength(width);
  expect(evaluation.units.map((unit) => unit.z)).toStrictEqual(
    Array.from({ length: width }, (_, index) => index),
  );
});

test('the layer evaluation carries the layer identity', () => {
  expect(evaluateHiddenLayer(scalarLayer(2), new Map([[inputNodeId, 0]]), none).layerId).toBe(
    'layer-1',
  );
});

test('every unit in the layer uses the layer activation', () => {
  const layer: HiddenLayer = { ...scalarLayer(3), activation: { id: 'relu' } };

  const evaluation = evaluateHiddenLayer(layer, new Map([[inputNodeId, -1.5]]), none);

  // z = index - 1.5, so only the unit with bias 2 stays positive.
  expect(evaluation.units.map((unit) => unit.h)).toStrictEqual([0, 0, 0.5]);
});

test('exclusion applies per unit, not per layer', () => {
  const evaluation = evaluateHiddenLayer(
    scalarLayer(3),
    new Map([[inputNodeId, 1]]),
    new Set(['unit-2']),
  );

  expect(evaluation.units.map((unit) => unit.h)).toStrictEqual([1, 2, 3]);
  expect(evaluation.units.map((unit) => unit.downstreamValue)).toStrictEqual([1, 0, 3]);
});
