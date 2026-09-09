import { expect, test } from 'vitest';

import { reachableRange } from './reachableRange';

test('all-positive values are padded on both sides', () => {
  expect(reachableRange([1, 2, 3])).toStrictEqual({ min: 0.5, max: 3.5 });
});

test('all-negative values are padded on both sides', () => {
  expect(reachableRange([-3, -1])).toStrictEqual({ min: -3.5, max: -0.5 });
});

test('mixed-sign values keep both extremes inside the range', () => {
  expect(reachableRange([-2, 0, 5])).toStrictEqual({ min: -2.5, max: 5.5 });
});

test('a wide span is padded by a fraction rather than the absolute floor', () => {
  const range = reachableRange([0, 100]);

  expect(range.min).toBeCloseTo(-5, 10);
  expect(range.max).toBeCloseTo(105, 10);
});

test('an all-zero function still gets a usable axis', () => {
  expect(reachableRange([0, 0, 0])).toStrictEqual({ min: -0.5, max: 0.5 });
});

test('a constant non-zero function is centred on its value', () => {
  expect(reachableRange([2.5, 2.5, 2.5])).toStrictEqual({ min: 2, max: 3 });
});

test('a very small span is widened to the minimum padding', () => {
  const range = reachableRange([1, 1.000001]);

  expect(range.min).toBeCloseTo(0.5, 10);
  expect(range.max).toBeCloseTo(1.500001, 10);
});

test('non-finite samples are ignored rather than poisoning the range', () => {
  expect(reachableRange([Number.NaN, Number.POSITIVE_INFINITY, 1, 2])).toStrictEqual({
    min: 0.5,
    max: 2.5,
  });
  expect(reachableRange([Number.NEGATIVE_INFINITY, -3, -1])).toStrictEqual({
    min: -3.5,
    max: -0.5,
  });
});

test('a sample set with nothing finite falls back to a usable axis', () => {
  expect(reachableRange([])).toStrictEqual({ min: -0.5, max: 0.5 });
  expect(reachableRange([Number.NaN, Number.POSITIVE_INFINITY])).toStrictEqual({
    min: -0.5,
    max: 0.5,
  });
});

const datasets: readonly (readonly number[])[] = [
  [],
  [0],
  [0, 0, 0],
  [2.5, 2.5],
  [1, 2, 3],
  [-3, -1],
  [-2, 0, 5],
  [0, 100],
  [-1e6, 1e6],
  [1, 1.000001],
  [Number.NaN, 4],
];

test('padding is deterministic: the same samples always give the same range', () => {
  for (const values of datasets) {
    expect(reachableRange(values)).toStrictEqual(reachableRange(values));
  }
});

test('every finite sample lies inside the returned range', () => {
  for (const values of datasets) {
    const { min, max } = reachableRange(values);

    for (const value of values.filter(Number.isFinite)) {
      expect(value).toBeGreaterThanOrEqual(min);
      expect(value).toBeLessThanOrEqual(max);
    }
  }
});

test('no range is NaN, infinite, or zero-width', () => {
  for (const values of datasets) {
    const { min, max } = reachableRange(values);

    expect(Number.isFinite(min)).toBe(true);
    expect(Number.isFinite(max)).toBe(true);
    expect(max).toBeGreaterThan(min);
  }
});
