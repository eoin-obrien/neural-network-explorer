import { expect, test } from 'vitest';

import { identity } from './identity';

test('a[z] returns z exactly', () => {
  for (const z of [-7.25, -1, 0, 0.5, 1234.5]) {
    expect(identity(z)).toBe(z);
  }
});
