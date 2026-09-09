import { expect, test } from 'vitest';

import { evaluateHiddenUnit } from './evaluateHiddenUnit';
import type { HiddenUnit } from './types';
import { inputNodeId } from './types';

const scalarUnit: HiddenUnit = {
  id: 'unit-1',
  thetaBias: 0.5,
  incomingTheta: [{ sourceId: inputNodeId, value: -2 }],
};

const none = new Set<string>();

test('z is the theta-weighted affine sum including the bias', () => {
  const evaluation = evaluateHiddenUnit(
    scalarUnit,
    { id: 'identity' },
    new Map([[inputNodeId, 0.25]]),
    none,
  );

  // z = 0.5 + (-2 * 0.25)
  expect(evaluation.z).toBe(0);
});

test('h is a[z], applied exactly once', () => {
  const evaluation = evaluateHiddenUnit(
    scalarUnit,
    { id: 'relu' },
    new Map([[inputNodeId, 1]]),
    none,
  );

  // z = 0.5 - 2 = -1.5, so ReLU clamps h to 0 while z stays negative.
  expect(evaluation).toStrictEqual({ unitId: 'unit-1', z: -1.5, h: 0, downstreamValue: 0 });
});

test('a unit sums every incoming activation, not only the first', () => {
  const unit: HiddenUnit = {
    id: 'unit-2',
    thetaBias: 1,
    incomingTheta: [
      { sourceId: 'a', value: 2 },
      { sourceId: 'b', value: -0.5 },
      { sourceId: 'c', value: 10 },
    ],
  };

  const evaluation = evaluateHiddenUnit(
    unit,
    { id: 'identity' },
    new Map([
      ['a', 3],
      ['b', 4],
      ['c', 0],
    ]),
    none,
  );

  // z = 1 + 6 - 2 + 0
  expect(evaluation.z).toBe(5);
});

test('connections are read by source id, not by position', () => {
  const unit: HiddenUnit = {
    id: 'unit-3',
    thetaBias: 0,
    incomingTheta: [
      { sourceId: 'b', value: 1 },
      { sourceId: 'a', value: 100 },
    ],
  };

  const evaluation = evaluateHiddenUnit(
    unit,
    { id: 'identity' },
    new Map([
      ['a', 1],
      ['b', 2],
    ]),
    none,
  );

  expect(evaluation.z).toBe(102);
});

test('an excluded unit keeps its own z and h but contributes zero downstream', () => {
  const evaluation = evaluateHiddenUnit(
    scalarUnit,
    { id: 'identity' },
    new Map([[inputNodeId, -1]]),
    new Set(['unit-1']),
  );

  expect(evaluation).toStrictEqual({ unitId: 'unit-1', z: 2.5, h: 2.5, downstreamValue: 0 });
});

test('excluding a different unit leaves this one contributing', () => {
  const evaluation = evaluateHiddenUnit(
    scalarUnit,
    { id: 'identity' },
    new Map([[inputNodeId, -1]]),
    new Set(['unit-other']),
  );

  expect(evaluation.downstreamValue).toBe(2.5);
});

test('the layer activation is applied without the unit knowing which one it is', () => {
  const values = new Map([[inputNodeId, 1]]);
  const asTanh = evaluateHiddenUnit(scalarUnit, { id: 'tanh' }, values, none);
  const asLeaky = evaluateHiddenUnit(scalarUnit, { id: 'leaky-relu', alpha: 0.5 }, values, none);

  expect(asTanh.z).toBe(asLeaky.z);
  expect(asTanh.h).toBeCloseTo(Math.tanh(-1.5), 12);
  expect(asLeaky.h).toBe(-0.75);
});
