import { expect, test } from 'vitest';

import { defaultShallowPreset } from '../../application/presets/defaultShallow';
import { sampleNetwork } from '../../domain/network/sampleNetwork';
import { layerScale, outputScale } from './chartScale';

const { network, xDomain, fixedScale } = defaultShallowPreset;
const samples = sampleNetwork(network, xDomain, new Set());

test('the fixed mode takes both layer ranges from the preset', () => {
  expect(layerScale('fixed', fixedScale, samples, 'hidden-1')).toStrictEqual({
    z: fixedScale.z,
    h: fixedScale.h,
  });
});

test('the fixed mode takes the output range from the preset', () => {
  expect(outputScale('fixed', fixedScale, samples)).toStrictEqual(fixedScale.y);
});

// z reaches -2.9 at x = -1 (unit 3) and 2 at x = 1 (unit 1), so the shared
// range spans both units rather than whichever one was asked for.
test('the reachable mode takes the layer z range from every unit in the layer', () => {
  const { z } = layerScale('reachable', fixedScale, samples, 'hidden-1');

  expect(z).toStrictEqual({ min: -3.145, max: 2.245 });
});

// ReLU clamps every negative z, so h reaches 0 and 2 where z reached -2.9.
test('the reachable mode scales h by what the activation actually produces', () => {
  const { h } = layerScale('reachable', fixedScale, samples, 'hidden-1');

  expect(h).toStrictEqual({ min: -0.1, max: 2.1 });
});

test('the reachable mode derives the output range from sampled y', () => {
  const range = outputScale('reachable', fixedScale, samples);
  const y = samples.map((sample) => sample.y);

  expect(range.min).toBeLessThan(Math.min(...y));
  expect(range.max).toBeGreaterThan(Math.max(...y));
  // Tighter than the preset's fixed y scale, which is the point of asking.
  expect(range.max - range.min).toBeLessThan(fixedScale.y.max - fixedScale.y.min);
});

// Excluding a unit changes y, so the reachable output range follows it while
// the fixed one does not.
test('the reachable output range follows an intervention', () => {
  const excluded = sampleNetwork(network, xDomain, new Set(['unit-3']));

  expect(outputScale('reachable', fixedScale, excluded)).not.toStrictEqual(
    outputScale('reachable', fixedScale, samples),
  );
  expect(outputScale('fixed', fixedScale, excluded)).toStrictEqual(
    outputScale('fixed', fixedScale, samples),
  );
});
