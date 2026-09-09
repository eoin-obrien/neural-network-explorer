import { expect, test } from 'vitest';

import { formatValue, subscript } from './notation';

test('single-digit indices are juxtaposed, as Prince writes them', () => {
  expect(subscript([1, 0])).toBe('₁₀');
  expect(subscript([3])).toBe('₃');
});

// Without the separator, unit 1's bias and unit 10 would both read as theta
// with the subscript 10.
test('a two-digit index forces a separator so the indices stay readable', () => {
  expect(subscript([10, 0])).toBe('₁₀,₀');
  expect(subscript([12])).toBe('₁₂');
});

test('values are formatted to a fixed width of two decimals', () => {
  expect(formatValue(0.4)).toBe('0.40');
  expect(formatValue(-1.257)).toBe('-1.26');
  expect(formatValue(12)).toBe('12.00');
});

test('a value that rounds to zero never shows a minus sign', () => {
  expect(formatValue(-0.001)).toBe('0.00');
  expect(formatValue(-0)).toBe('0.00');
});
