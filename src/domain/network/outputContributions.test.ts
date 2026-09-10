import { expect, test } from 'vitest';

import { outputContributions, sumContributions } from './outputContributions';
import type { OutputLayer } from './types';

const output: OutputLayer = {
  phi0: 0.5,
  incomingPhi: [
    { sourceId: 'unit-1', value: 2 },
    { sourceId: 'unit-2', value: -1 },
  ],
};

const sources = new Map([
  ['unit-1', 1.5],
  ['unit-2', 4],
]);

test('each term is that unit phi times the activation the output reads', () => {
  expect(outputContributions(output, sources)).toStrictEqual([
    { sourceId: 'unit-1', value: 3 },
    { sourceId: 'unit-2', value: -4 },
  ]);
});

test('y is phi0 plus the phi-weighted sum of the incoming activations', () => {
  // y = 0.5 + 2 * 1.5 - 1 * 4
  expect(sumContributions(output.phi0, outputContributions(output, sources))).toBe(-0.5);
});

test('phi0 alone is the output of a network with no incoming connections', () => {
  const empty: OutputLayer = { phi0: -1.25, incomingPhi: [] };

  expect(outputContributions(empty, new Map())).toStrictEqual([]);
  expect(sumContributions(empty.phi0, [])).toBe(-1.25);
});

// A term names the unit it came from, so a view can put it beside that unit
// rather than trusting two lists to stay in the same order.
test('phi is read by source id, so unit order carries no meaning', () => {
  const reordered: OutputLayer = { ...output, incomingPhi: [...output.incomingPhi].reverse() };

  expect(sumContributions(output.phi0, outputContributions(reordered, sources))).toBe(
    sumContributions(output.phi0, outputContributions(output, sources)),
  );
});

// An excluded unit reaches the output as zero, so its term vanishes from the
// sum while the phi that would weight it is untouched.
test('a unit withheld from the pass contributes a zero term, not a missing one', () => {
  const withheld = new Map([
    ['unit-1', 0],
    ['unit-2', 4],
  ]);

  expect(outputContributions(output, withheld)).toStrictEqual([
    { sourceId: 'unit-1', value: 0 },
    { sourceId: 'unit-2', value: -4 },
  ]);
});
