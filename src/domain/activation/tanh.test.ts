import { expect, test } from 'vitest';

import { tanh } from './tanh';

test('a[0] is zero', () => {
  expect(tanh(0)).toBe(0);
});

test('a[z] lies strictly between -1 and 1 for finite z', () => {
  for (const z of [-15, -1, -0.001, 0.001, 1, 15]) {
    expect(tanh(z)).toBeGreaterThan(-1);
    expect(tanh(z)).toBeLessThan(1);
  }
});

test('a[z] is odd', () => {
  expect(tanh(-0.75)).toBeCloseTo(-tanh(0.75), 12);
  expect(tanh(-3)).toBeCloseTo(-tanh(3), 12);
});
