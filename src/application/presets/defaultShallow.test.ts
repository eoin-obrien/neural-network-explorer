import { expect, test } from 'vitest';

import { activationDefinitions } from '../../domain/activation/activation';
import { countParameters } from '../../domain/network/countParameters';
import type { HiddenUnit } from '../../domain/network/types';
import { inputNodeId } from '../../domain/network/types';
import { defaultShallowPreset } from './defaultShallow';

const { network, xDomain, fixedScale } = defaultShallowPreset;
const units: readonly HiddenUnit[] = network.hiddenLayers.flatMap((layer) => layer.units);

test('the default preset is the 1 -> 3 -> 1 shallow network the teaching view assumes', () => {
  expect(network.hiddenLayers).toHaveLength(1);
  expect(units).toHaveLength(3);
});

// The stated parameter count is the first thing the page claims; if the preset
// drifts, the claim has to fail here rather than quietly become wrong.
test('the default preset has exactly 10 trainable parameters', () => {
  expect(countParameters(network)).toBe(10);
});

test('layer and unit ids are unique, so identity never falls back to position', () => {
  const ids = [...network.hiddenLayers.map((layer) => layer.id), ...units.map((unit) => unit.id)];

  expect(new Set(ids).size).toBe(ids.length);
});

test('every theta and phi is finite', () => {
  const values = [
    ...units.flatMap((unit) => [unit.thetaBias, ...unit.incomingTheta.map((theta) => theta.value)]),
    network.output.phi0,
    ...network.output.incomingPhi.map((phi) => phi.value),
  ];

  expect(values.every(Number.isFinite)).toBe(true);
});

// A connection naming a source that does not exist throws during evaluation,
// so the preset's wiring is checked here rather than at the first render.
test('every connection names a source the forward pass provides', () => {
  const unitIds = new Set(units.map((unit) => unit.id));

  for (const unit of units) {
    expect(unit.incomingTheta.map((theta) => theta.sourceId)).toStrictEqual([inputNodeId]);
  }

  expect(network.output.incomingPhi.every((phi) => unitIds.has(phi.sourceId))).toBe(true);
});

test('the dense layer connects every unit to the input and to the output', () => {
  expect(units.every((unit) => unit.incomingTheta.length === 1)).toBe(true);
  expect(network.output.incomingPhi).toHaveLength(units.length);
});

test('every hidden layer names an activation the registry declares', () => {
  for (const layer of network.hiddenLayers) {
    expect(activationDefinitions[layer.activation.id].id).toBe(layer.activation.id);
  }
});

test('the input domain is the normalized interval every function plot samples', () => {
  expect(xDomain).toStrictEqual([-1, 1]);
});

test('every fixed teaching scale is a non-empty interval', () => {
  for (const range of [fixedScale.z, fixedScale.h, fixedScale.y]) {
    expect(range.max).toBeGreaterThan(range.min);
  }
});
