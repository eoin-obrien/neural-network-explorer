import { expect, test } from 'vitest';

import { sigmoid } from './sigmoid';

test('a[0] is one half', () => {
  expect(sigmoid(0)).toBe(0.5);
});

// Beyond roughly |z| = 37 the logistic curve saturates to exactly 0 or 1 in
// double precision, so the strict bound is asserted over representative inputs
// rather than claimed for every finite z.
test('a[z] lies strictly between 0 and 1 over representative inputs', () => {
  for (const z of [-16, -1, -0.001, 0, 0.001, 1, 16]) {
    expect(sigmoid(z)).toBeGreaterThan(0);
    expect(sigmoid(z)).toBeLessThan(1);
  }
});

test('a[z] is monotonically increasing', () => {
  expect(sigmoid(-2)).toBeLessThan(sigmoid(-1));
  expect(sigmoid(-1)).toBeLessThan(sigmoid(0));
  expect(sigmoid(0)).toBeLessThan(sigmoid(1));
  expect(sigmoid(1)).toBeLessThan(sigmoid(2));
});

test('a[-z] is 1 - a[z]', () => {
  expect(sigmoid(-1.5)).toBeCloseTo(1 - sigmoid(1.5), 12);
});
