import { expect, test } from 'vitest';

import { evaluateNetwork } from './evaluateNetwork';
import { sampleNetwork } from './sampleNetwork';
import type { Network, XDomain } from './types';
import { inputNodeId } from './types';

const network: Network = {
  hiddenLayers: [
    {
      id: 'layer-1',
      units: [
        { id: 'u1', thetaBias: 0.25, incomingTheta: [{ sourceId: inputNodeId, value: 1.5 }] },
        { id: 'u2', thetaBias: -0.5, incomingTheta: [{ sourceId: inputNodeId, value: -2 }] },
      ],
      activation: { id: 'relu' },
    },
  ],
  output: {
    phi0: 0.1,
    incomingPhi: [
      { sourceId: 'u1', value: 1 },
      { sourceId: 'u2', value: -1 },
    ],
  },
};

const normalized: XDomain = [-1, 1];
const none = new Set<string>();

// The count is declared once in the sampler; this is where its value is
// specified, so a change to it is a deliberate change to behaviour.
test('sampling produces exactly 161 samples', () => {
  expect(sampleNetwork(network, normalized, none)).toHaveLength(161);
});

test('both endpoints of the input domain are sampled exactly', () => {
  const samples = sampleNetwork(network, normalized, none);

  expect(samples.at(0)?.x).toBe(-1);
  expect(samples.at(-1)?.x).toBe(1);
});

test('an asymmetric domain also reaches its exact endpoints', () => {
  const samples = sampleNetwork(network, [-0.3, 4.7], none);

  expect(samples.at(0)?.x).toBe(-0.3);
  expect(samples.at(-1)?.x).toBe(4.7);
});

// On this domain the two differ: stepping accumulates to 0.10000000000000009,
// so without the exact endpoint the right-hand end of every plot would sit
// just outside the domain the preset declares.
test('the last sample is the exact endpoint, not what stepping accumulates to', () => {
  const inexact: XDomain = [-1, 0.1];
  const accumulated = inexact[0] + 160 * ((inexact[1] - inexact[0]) / 160);

  expect(accumulated).not.toBe(inexact[1]);
  expect(sampleNetwork(network, inexact, none).at(-1)?.x).toBe(inexact[1]);
});

// Even spacing is what makes one shared set of x positions meaningful: the
// charts synchronize by row index, so an uneven grid would put different inputs
// at the same index in different plots.
test('samples are evenly spaced across the domain', () => {
  const gaps = gapsOf(sampleNetwork(network, normalized, none).map((sample) => sample.x));

  expect(gaps).toHaveLength(160);
  // A width of 2 over 160 intervals, rounded past the noise of binary division.
  expect(new Set(gaps.map((gap) => Number(gap.toFixed(12))))).toStrictEqual(new Set([0.0125]));
});

test('samples are strictly increasing in x', () => {
  const xs = sampleNetwork(network, normalized, none).map((sample) => sample.x);

  expect(
    xs.every((x, index) => index === 0 || x > (xs[index - 1] ?? Number.NEGATIVE_INFINITY)),
  ).toBe(true);
});

test('every sample equals a direct evaluation at that x', () => {
  for (const sample of sampleNetwork(network, normalized, none)) {
    expect(sample).toStrictEqual(evaluateNetwork(network, sample.x, none));
  }
});

test('sampling is deterministic', () => {
  expect(sampleNetwork(network, normalized, none)).toStrictEqual(
    sampleNetwork(network, normalized, none),
  );
});

test('an exclusion applies to every sample', () => {
  const excluded = sampleNetwork(network, normalized, new Set(['u1']));

  for (const sample of excluded) {
    expect(sample.layers.at(0)?.units.at(0)?.downstreamValue).toBe(0);
  }
});

/** The distance between each pair of neighbouring samples. */
function gapsOf(xs: readonly number[]): readonly number[] {
  return xs.flatMap((x, index) =>
    xs.filter((_, position) => position === index + 1).map((next) => next - x),
  );
}
