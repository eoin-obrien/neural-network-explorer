import { expect, test } from 'vitest';

import { tanh } from './tanh';

test('a[0] is zero', () => {
  expect(tanh(0)).toBe(0);
});

// Beyond roughly |z| = 20 tanh saturates to exactly -1 or 1 in double
// precision, so the strict bound is asserted over representative inputs rather
// than claimed for every finite z.
test('a[z] lies strictly between -1 and 1 over representative inputs', () => {
  for (const z of [-15, -1, -0.001, 0.001, 1, 15]) {
    expect(tanh(z)).toBeGreaterThan(-1);
    expect(tanh(z)).toBeLessThan(1);
  }
});

test('a[z] is odd', () => {
  expect(tanh(-0.75)).toBeCloseTo(-tanh(0.75), 12);
  expect(tanh(-3)).toBeCloseTo(-tanh(3), 12);
});
