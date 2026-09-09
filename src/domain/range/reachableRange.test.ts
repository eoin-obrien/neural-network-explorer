import { expect, test } from 'vitest';

import { reachableRange } from './reachableRange';

test('all-positive values are padded on both sides', () => {
  expect(reachableRange([1, 2, 3])).toStrictEqual({ min: 0.9, max: 3.1 });
});

test('all-negative values are padded on both sides', () => {
  expect(reachableRange([-3, -1])).toStrictEqual({ min: -3.1, max: -0.9 });
});

test('mixed-sign values keep both extremes inside the range', () => {
  expect(reachableRange([-2, 0, 5])).toStrictEqual({ min: -2.35, max: 5.35 });
});

test('a wide span is padded by a fraction rather than the absolute floor', () => {
  expect(reachableRange([0, 100])).toStrictEqual({ min: -5, max: 105 });
});

// The everyday case for h charts. Bounded activations span 1 (sigmoid) or 2
// (tanh), so if the absolute floor applied at these spans the axis would be
// mostly empty space and reachable scaling would look no different from a
// fixed teaching scale.
test('a bounded activation range is not swamped by padding', () => {
  const bounded = [
    [0, 1],
    [-1, 1],
    [0.3, 0.7],
  ] as const;

  for (const [min, max] of bounded) {
    const range = reachableRange([min, max]);

    expect((max - min) / (range.max - range.min)).toBeGreaterThan(0.75);
  }
});

test('an all-zero function still gets a usable axis', () => {
  expect(reachableRange([0, 0, 0])).toStrictEqual({ min: -0.05, max: 0.05 });
});

test('a constant non-zero function is centred on its value', () => {
  expect(reachableRange([2.5, 2.5, 2.5])).toStrictEqual({ min: 2.45, max: 2.55 });
});

test('a very small span is widened to the minimum padding', () => {
  expect(reachableRange([1, 1.000001])).toStrictEqual({ min: 0.95, max: 1.050001 });
});

test('non-finite samples are ignored rather than poisoning the range', () => {
  expect(reachableRange([Number.NaN, Number.POSITIVE_INFINITY, 1, 2])).toStrictEqual({
    min: 0.95,
    max: 2.05,
  });
  expect(reachableRange([Number.NEGATIVE_INFINITY, -3, -1])).toStrictEqual({
    min: -3.1,
    max: -0.9,
  });
});

test('a sample set with nothing finite falls back to a usable axis', () => {
  expect(reachableRange([])).toStrictEqual({ min: -0.05, max: 0.05 });
  expect(reachableRange([Number.NaN, Number.POSITIVE_INFINITY])).toStrictEqual({
    min: -0.05,
    max: 0.05,
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

// Sliders move continuously, so the axis must too: a rounding or "nice tick"
// rule that snapped the domain would move the range far more than the samples
// that produced it, and the chart would visibly jump while a slider moved.
test('a small change in the samples moves the range by a comparably small amount', () => {
  const base = reachableRange([-1, 2]);

  for (const delta of [1e-9, 1e-6, 1e-3, 1e-1]) {
    const nudged = reachableRange([-1, 2 + delta]);

    expect(Math.abs(nudged.min - base.min)).toBeLessThanOrEqual(delta * 1.5);
    expect(Math.abs(nudged.max - base.max)).toBeLessThanOrEqual(delta * 1.5);
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
