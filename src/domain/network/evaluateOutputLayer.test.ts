import { expect, test } from 'vitest';

import { evaluateOutputLayer } from './evaluateOutputLayer';
import type { OutputLayer } from './types';

const output: OutputLayer = {
  phi0: 0.5,
  incomingPhi: [
    { sourceId: 'unit-1', value: 2 },
    { sourceId: 'unit-2', value: -1 },
  ],
};

test('y is phi0 plus the phi-weighted sum of the incoming activations', () => {
  const y = evaluateOutputLayer(
    output,
    new Map([
      ['unit-1', 1.5],
      ['unit-2', 4],
    ]),
  );

  // y = 0.5 + 2 * 1.5 - 1 * 4
  expect(y).toBe(-0.5);
});

test('phi0 alone is the output of a network with no incoming connections', () => {
  expect(evaluateOutputLayer({ phi0: -1.25, incomingPhi: [] }, new Map())).toBe(-1.25);
});

test('phi is read by source id, so unit order carries no meaning', () => {
  const reordered: OutputLayer = { ...output, incomingPhi: [...output.incomingPhi].reverse() };
  const sources = new Map([
    ['unit-1', 1.5],
    ['unit-2', 4],
  ]);

  expect(evaluateOutputLayer(reordered, sources)).toBe(evaluateOutputLayer(output, sources));
});
