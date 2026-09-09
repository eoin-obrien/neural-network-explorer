import { expect, test } from 'vitest';

import { relu } from './relu';

test('a[z] is zero for negative z', () => {
  expect(relu(-3)).toBe(0);
  expect(relu(-0.25)).toBe(0);
});

test('a[z] is zero at the kink', () => {
  expect(relu(0)).toBe(0);
});

test('a[z] is z for positive z', () => {
  expect(relu(0.25)).toBe(0.25);
  expect(relu(7)).toBe(7);
});
