import { expect, test } from 'vitest';

import { scaleModeFor, scaleModes } from './explorerState';

test('every offered mode narrows to itself', () => {
  expect(scaleModes.flatMap(scaleModeFor)).toStrictEqual([...scaleModes]);
});

test('a value the control does not offer narrows to no mode at all', () => {
  expect(scaleModeFor('logarithmic')).toStrictEqual([]);
});
