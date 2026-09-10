import { expect, test } from 'vitest';

import { activationDefinitions } from '../../domain/activation/activation';
import { countParameters } from '../../domain/network/countParameters';
import { sampleNetwork } from '../../domain/network/sampleNetwork';
import type { HiddenUnit, Network } from '../../domain/network/types';
import { inputNodeId } from '../../domain/network/types';
import { defaultShallowPreset } from './defaultShallow';
import type { Preset } from './preset';
import { initialPreset, presetFor, presets } from './presets';

function unitsOf(network: Network): readonly HiddenUnit[] {
  return network.hiddenLayers.flatMap((layer) => layer.units);
}

/** What every unit of layer `index` reads, in the order the notation numbers it. */
function sourcesOf(network: Network, index: number): readonly string[] {
  const previous = network.hiddenLayers.filter((_layer, position) => position === index - 1);

  return previous.length === 0
    ? [inputNodeId]
    : previous.flatMap((layer) => layer.units.map((unit) => unit.id));
}

/** The slopes of y(x) over the sampled domain, rounded past floating-point noise. */
function slopesOf(preset: Preset): readonly number[] {
  const samples = sampleNetwork(preset.network, preset.xDomain, new Set());

  return samples
    .slice(1)
    .flatMap((sample, index) =>
      samples
        .filter((_, position) => position === index)
        .map((previous) => Number(((sample.y - previous.y) / (sample.x - previous.x)).toFixed(6))),
    );
}

test.each(presets)('$id has a unique, non-empty identity', (preset) => {
  expect(preset.id).not.toBe('');
  expect(preset.title).not.toBe('');
  expect(preset.lesson).not.toBe('');
});

test('preset ids and titles are unique, so the selector can never be ambiguous', () => {
  expect(new Set(presets.map((preset) => preset.id)).size).toBe(presets.length);
  expect(new Set(presets.map((preset) => preset.title)).size).toBe(presets.length);
});

test('the page starts on a preset the selector offers', () => {
  expect(presets).toContain(initialPreset);
  expect(presetFor(initialPreset.id)).toStrictEqual([initialPreset]);
});

test('an id no preset declares selects nothing rather than being asserted into one', () => {
  expect(presetFor('no-such-network')).toStrictEqual([]);
  expect(presetFor(null)).toStrictEqual([]);
});

test.each(presets)('$id gives every layer and unit a unique id', ({ network }) => {
  const ids = [
    ...network.hiddenLayers.map((layer) => layer.id),
    ...unitsOf(network).map((u) => u.id),
  ];

  expect(new Set(ids).size).toBe(ids.length);
});

test.each(presets)('$id has finite parameters throughout', ({ network }) => {
  const values = [
    ...unitsOf(network).flatMap((unit) => [
      unit.thetaBias,
      ...unit.incomingTheta.map((theta) => theta.value),
    ]),
    network.output.phi0,
    ...network.output.incomingPhi.map((phi) => phi.value),
  ];

  expect(values.every(Number.isFinite)).toBe(true);
});

// A connection naming a source that does not exist throws during evaluation, so
// the wiring is checked here rather than at the first render. Dense means every
// unit reads every source of the layer before it, in that layer's own order.
test.each(presets)('$id wires every layer densely to the one before it', ({ network }) => {
  network.hiddenLayers.forEach((layer, index) => {
    for (const unit of layer.units) {
      expect(unit.incomingTheta.map((theta) => theta.sourceId)).toStrictEqual(
        sourcesOf(network, index),
      );
    }
  });
});

// phi_i is written as the weight on unit i of the last hidden layer, so the
// order of the output connections is what makes that numbering true.
test.each(presets)('$id output reads the last hidden layer in order', ({ network }) => {
  const last = network.hiddenLayers
    .slice(-1)
    .flatMap((layer) => layer.units.map((unit) => unit.id));

  expect(network.output.incomingPhi.map((phi) => phi.sourceId)).toStrictEqual(last);
});

test.each(presets)('$id names an activation the registry declares', ({ network }) => {
  for (const layer of network.hiddenLayers) {
    expect(activationDefinitions[layer.activation.id].id).toBe(layer.activation.id);
  }
});

test.each(presets)('$id samples the normalized input domain', ({ xDomain }) => {
  expect(xDomain).toStrictEqual([-1, 1]);
});

test.each(presets)(
  '$id gives every fixed teaching scale a non-empty interval',
  ({ fixedScale }) => {
    for (const range of [fixedScale.z, fixedScale.h, fixedScale.y]) {
      expect(range.max).toBeGreaterThan(range.min);
    }
  },
);

// A fixed scale the opening function does not fit inside would clip the curve
// on first load, which reads as a bug rather than as a chosen teaching scale.
test.each(presets)('$id fixed scale contains the function it opens on', (preset) => {
  const samples = sampleNetwork(preset.network, preset.xDomain, new Set());
  const units = samples.flatMap((sample) => sample.layers.flatMap((layer) => layer.units));
  const reached = [
    { values: units.map((unit) => unit.z), range: preset.fixedScale.z },
    { values: units.map((unit) => unit.h), range: preset.fixedScale.h },
    { values: samples.map((sample) => sample.y), range: preset.fixedScale.y },
  ];

  for (const { values, range } of reached) {
    expect(Math.min(...values)).toBeGreaterThanOrEqual(range.min);
    expect(Math.max(...values)).toBeLessThanOrEqual(range.max);
  }
});

// "Visually meaningful" made executable: a preset that opened on a straight
// line, or on a function that never moved, would teach nothing about hinges.
test.each(presets)('$id opens on a function with a visible bend in it', (preset) => {
  const slopes = slopesOf(preset);

  expect(new Set(slopes).size).toBeGreaterThanOrEqual(2);
  expect(slopes.some((slope) => slope !== 0)).toBe(true);
});

test('the default preset is the 1 -> 3 -> 1 shallow network the notation is written for', () => {
  expect(defaultShallowPreset.network.hiddenLayers).toHaveLength(1);
  expect(unitsOf(defaultShallowPreset.network)).toHaveLength(3);
});

// The stated parameter count is the first thing the page claims; if the preset
// drifts, the claim has to fail here rather than quietly become wrong.
test('the default preset has exactly 10 trainable parameters', () => {
  expect(countParameters(defaultShallowPreset.network)).toBe(10);
});

// Three units, three hinges, four straight regions. A hinge outside the input
// domain would be a unit whose effect the learner cannot see at all.
test('every hinge of the default preset falls inside the input domain', () => {
  const [min, max] = defaultShallowPreset.xDomain;
  const hinges = unitsOf(defaultShallowPreset.network).flatMap((unit) =>
    unit.incomingTheta.map((theta) => -unit.thetaBias / theta.value),
  );

  expect(hinges).toHaveLength(3);
  for (const hinge of hinges) {
    expect(hinge).toBeGreaterThan(min);
    expect(hinge).toBeLessThan(max);
  }
  expect(new Set(slopesOf(defaultShallowPreset)).size).toBe(4);
});
