import { expect, test } from 'vitest';

import { leakyRelu } from './leakyRelu';

test('a[z] is z for non-negative z whatever alpha is', () => {
  expect(leakyRelu(0, 0.1)).toBe(0);
  expect(leakyRelu(2.5, 0.1)).toBe(2.5);
  expect(leakyRelu(2.5, 0.9)).toBe(2.5);
});

test('a[z] is alpha times z for negative z', () => {
  expect(leakyRelu(-4, 0.1)).toBeCloseTo(-0.4, 12);
  expect(leakyRelu(-4, 0.5)).toBe(-2);
});

test('alpha zero degrades leaky ReLU to ReLU on the negative branch', () => {
  expect(leakyRelu(-4, 0)).toBe(-0);
});
