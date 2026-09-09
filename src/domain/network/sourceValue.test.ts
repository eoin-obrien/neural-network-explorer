import { expect, test } from 'vitest';

import { sourceValue } from './sourceValue';

test('a declared source resolves to its value', () => {
  expect(sourceValue(new Map([['unit-1', 0.75]]), 'unit-1')).toBe(0.75);
});

test('a zero source value is a value, not an absent source', () => {
  expect(sourceValue(new Map([['unit-1', 0]]), 'unit-1')).toBe(0);
});

// Reading an undeclared source as zero would plot a plausible-looking wrong
// function, so a malformed network fails loudly instead.
test('an undeclared source is rejected rather than read as zero', () => {
  expect(() => sourceValue(new Map(), 'unit-9')).toThrow("'unit-9'");
});
