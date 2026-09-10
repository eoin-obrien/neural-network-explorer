import { expect, test } from 'vitest';

import { countParameters } from '../../domain/network/countParameters';
import { evaluateNetwork } from '../../domain/network/evaluateNetwork';
import type { Network } from '../../domain/network/types';
import { inputNodeId } from '../../domain/network/types';
import { defaultShallowPreset } from '../presets/defaultShallow';
import type { Preset } from '../presets/preset';
import { twoLayerPreset } from '../presets/twoLayer';
import { explorerReducer } from './explorerReducer';
import { initialExplorerState } from './explorerState';

const shallow = initialExplorerState(defaultShallowPreset);
const deep = initialExplorerState(twoLayerPreset);

function widen(state: typeof shallow, layerId: string, times = 1): typeof shallow {
  return Array.from({ length: times }).reduce<typeof shallow>(
    (current) => explorerReducer(current, { type: 'addUnit', layerId }),
    state,
  );
}

function unitIds(network: Network, layerIndex: number): readonly string[] {
  return network.hiddenLayers.flatMap((layer, index) =>
    index === layerIndex ? layer.units.map((unit) => unit.id) : [],
  );
}

test('a unit added to the last hidden layer brings a theta bias, a theta and a phi', () => {
  const next = widen(shallow, 'hidden-1');
  const layer = next.network.hiddenLayers.at(0);

  expect(layer?.units).toHaveLength(4);
  // The default 1 -> 3 -> 1 preset has 10; a fourth unit adds its bias, its
  // weight on x, and the phi that reads it.
  expect(countParameters(next.network)).toBe(13);
  // One weight, on the scalar input, because this is the first hidden layer.
  expect(layer?.units.at(3)?.incomingTheta.map((theta) => theta.sourceId)).toStrictEqual([
    inputNodeId,
  ]);
  expect(Number.isFinite(layer?.units.at(3)?.thetaBias)).toBe(true);
});

test('the added unit is read by the output layer', () => {
  const next = widen(shallow, 'hidden-1');
  const added = next.network.hiddenLayers.at(0)?.units.at(3);

  expect(next.network.output.incomingPhi.map((phi) => phi.sourceId)).toContain(added?.id);
  expect(next.network.output.incomingPhi).toHaveLength(4);
});

test('widening leaves every unit that was already there untouched', () => {
  const next = widen(shallow, 'hidden-1');

  expect(next.network.hiddenLayers.at(0)?.units.slice(0, 3)).toStrictEqual(
    defaultShallowPreset.network.hiddenLayers.at(0)?.units,
  );
  expect(next.network.output.incomingPhi.slice(0, 3)).toStrictEqual(
    defaultShallowPreset.network.output.incomingPhi,
  );
});

test('a unit added below a deeper layer is read by that layer, not by the output', () => {
  const next = explorerReducer(deep, { type: 'addUnit', layerId: 'hidden-1' });
  const added = next.network.hiddenLayers.at(0)?.units.at(2);

  // Every unit of the layer above gains a connection to the new activation.
  for (const above of next.network.hiddenLayers.at(1)?.units ?? []) {
    expect(above.incomingTheta.map((theta) => theta.sourceId)).toContain(added?.id);
  }

  expect(next.network.output.incomingPhi).toStrictEqual(twoLayerPreset.network.output.incomingPhi);
});

test('a unit added to a deeper layer reads the activations below it', () => {
  const next = explorerReducer(deep, { type: 'addUnit', layerId: 'hidden-2' });
  const added = next.network.hiddenLayers.at(1)?.units.at(2);

  expect(added?.incomingTheta.map((theta) => theta.sourceId)).toStrictEqual(
    unitIds(twoLayerPreset.network, 0),
  );
});

test('the widened network still evaluates, so no connection names a missing source', () => {
  const next = widen(deep, 'hidden-1');

  expect(() => evaluateNetwork(next.network, 0.5, new Set())).not.toThrow();
});

test('an added unit takes an id no live unit already holds', () => {
  const next = widen(shallow, 'hidden-1', 3);
  const ids = unitIds(next.network, 0);

  expect(new Set(ids).size).toBe(ids.length);
  expect(ids).toHaveLength(6);
});

test('removing a unit takes its phi with it', () => {
  const widened = widen(shallow, 'hidden-1');
  const added = widened.network.hiddenLayers.at(0)?.units.at(3);
  const next = explorerReducer(widened, { type: 'removeUnit', layerId: 'hidden-1' });

  expect(next.network.hiddenLayers.at(0)?.units).toHaveLength(3);
  expect(next.network.output.incomingPhi.map((phi) => phi.sourceId)).not.toContain(added?.id);
  expect(countParameters(next.network)).toBe(10);
});

test('removing a unit below a deeper layer disconnects it from that layer', () => {
  const widened = explorerReducer(deep, { type: 'addUnit', layerId: 'hidden-1' });
  const added = widened.network.hiddenLayers.at(0)?.units.at(2);
  const next = explorerReducer(widened, { type: 'removeUnit', layerId: 'hidden-1' });

  for (const above of next.network.hiddenLayers.at(1)?.units ?? []) {
    expect(above.incomingTheta.map((theta) => theta.sourceId)).not.toContain(added?.id);
  }

  expect(() => evaluateNetwork(next.network, 0.5, new Set())).not.toThrow();
});

test('removing from the deepest layer leaves the layer below it untouched', () => {
  const next = explorerReducer(deep, { type: 'removeUnit', layerId: 'hidden-2' });
  const removed = twoLayerPreset.network.hiddenLayers.at(1)?.units.at(1);

  expect(next.network.hiddenLayers.at(0)).toStrictEqual(twoLayerPreset.network.hiddenLayers.at(0));
  expect(next.network.hiddenLayers.at(1)?.units).toHaveLength(1);
  expect(next.network.output.incomingPhi.map((phi) => phi.sourceId)).not.toContain(removed?.id);
});

test('adding then removing returns the network it started from', () => {
  const roundTrip = explorerReducer(widen(shallow, 'hidden-1'), {
    type: 'removeUnit',
    layerId: 'hidden-1',
  });

  expect(roundTrip.network).toStrictEqual(defaultShallowPreset.network);
});

test('a layer at its minimum width refuses to give up its last unit', () => {
  const single: Preset = {
    ...defaultShallowPreset,
    network: {
      hiddenLayers: [
        {
          id: 'hidden-1',
          units: [
            { id: 'only', thetaBias: 0.1, incomingTheta: [{ sourceId: inputNodeId, value: 1 }] },
          ],
          activation: { id: 'relu' },
        },
      ],
      output: { phi0: 0, incomingPhi: [{ sourceId: 'only', value: 1 }] },
    },
  };
  const state = initialExplorerState(single);
  const next = explorerReducer(state, { type: 'removeUnit', layerId: 'hidden-1' });

  expect(next.network).toStrictEqual(single.network);
});

test('a layer that is not in the network is left alone', () => {
  const added = explorerReducer(shallow, { type: 'addUnit', layerId: 'no-such-layer' });
  const removed = explorerReducer(shallow, { type: 'removeUnit', layerId: 'no-such-layer' });

  expect(added.network).toStrictEqual(defaultShallowPreset.network);
  expect(removed.network).toStrictEqual(defaultShallowPreset.network);
});

test('removing an excluded unit forgets the exclusion rather than stranding it', () => {
  const widened = widen(shallow, 'hidden-1');
  const added = widened.network.hiddenLayers.at(0)?.units.at(3)?.id ?? '';
  const excluded = explorerReducer(widened, {
    type: 'setUnitExcluded',
    unitId: added,
    excluded: true,
  });
  const next = explorerReducer(excluded, { type: 'removeUnit', layerId: 'hidden-1' });

  expect(excluded.excludedUnitIds.has(added)).toBe(true);
  expect(next.excludedUnitIds.has(added)).toBe(false);
});

test('an exclusion on a unit that stays survives an unrelated network edit', () => {
  const excluded = explorerReducer(shallow, {
    type: 'setUnitExcluded',
    unitId: 'unit-2',
    excluded: true,
  });
  const next = explorerReducer(excluded, { type: 'setPhi0', value: 0.5 });

  expect(next.excludedUnitIds.has('unit-2')).toBe(true);
});

test('reset restores the preset width', () => {
  const next = explorerReducer(widen(shallow, 'hidden-1', 2), { type: 'reset' });

  expect(next.network).toStrictEqual(defaultShallowPreset.network);
  expect(countParameters(next.network)).toBe(10);
});
