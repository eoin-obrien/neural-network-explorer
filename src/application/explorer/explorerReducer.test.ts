import { expect, test } from 'vitest';

import type { Network } from '../../domain/network/types';
import { inputNodeId } from '../../domain/network/types';
import type { Preset } from '../presets/preset';
import type { ExplorerAction } from './explorerReducer';
import { explorerReducer } from './explorerReducer';
import { initialExplorerState } from './explorerState';

// Two incoming connections on the deeper unit, so an edit has to find the right
// one rather than happening to hit the only one there is.
const network: Network = {
  hiddenLayers: [
    {
      id: 'hidden-1',
      units: [
        { id: 'a', thetaBias: 0.1, incomingTheta: [{ sourceId: inputNodeId, value: 1 }] },
        { id: 'b', thetaBias: -0.2, incomingTheta: [{ sourceId: inputNodeId, value: -1 }] },
      ],
      activation: { id: 'relu' },
    },
    {
      id: 'hidden-2',
      units: [
        {
          id: 'c',
          thetaBias: 0,
          incomingTheta: [
            { sourceId: 'a', value: 1 },
            { sourceId: 'b', value: 0.5 },
          ],
        },
      ],
      activation: { id: 'relu' },
    },
  ],
  output: { phi0: 0.2, incomingPhi: [{ sourceId: 'c', value: 1 }] },
};

const preset: Preset = {
  id: 'test',
  title: 'Test network',
  lesson: 'A two-layer network for exercising the reducer.',
  network,
  xDomain: [-1, 3],
  fixedScale: { z: { min: -3, max: 3 }, h: { min: -3, max: 3 }, y: { min: -2, max: 2 } },
};

const initial = initialExplorerState(preset);

test('the probe starts at the middle of the input domain', () => {
  expect(initial.probeX).toBe(1);
});

test('setting a theta bias changes only that unit', () => {
  const next = explorerReducer(initial, { type: 'setThetaBias', unitId: 'b', value: 1.5 });

  expect(next.network.hiddenLayers.at(0)?.units.at(1)?.thetaBias).toBe(1.5);
  expect(next.network.hiddenLayers.at(0)?.units.at(0)).toStrictEqual(
    network.hiddenLayers.at(0)?.units.at(0),
  );
});

test('setting a theta changes only the connection from that source', () => {
  const next = explorerReducer(initial, {
    type: 'setTheta',
    unitId: 'c',
    sourceId: 'b',
    value: -2,
  });

  expect(next.network.hiddenLayers.at(1)?.units.at(0)?.incomingTheta).toStrictEqual([
    { sourceId: 'a', value: 1 },
    { sourceId: 'b', value: -2 },
  ]);
});

test('setting a phi changes only the connection from that unit', () => {
  const next = explorerReducer(initial, { type: 'setPhi', sourceId: 'c', value: -1 });

  expect(next.network.output).toStrictEqual({
    phi0: 0.2,
    incomingPhi: [{ sourceId: 'c', value: -1 }],
  });
});

test('setting phi0 leaves every other parameter alone', () => {
  const next = explorerReducer(initial, { type: 'setPhi0', value: -0.75 });

  expect(next.network.output.phi0).toBe(-0.75);
  expect(next.network.hiddenLayers).toStrictEqual(network.hiddenLayers);
});

// The initial view offers one activation, and it reaches every hidden layer.
test('setting the activation applies it to every hidden layer', () => {
  const next = explorerReducer(initial, { type: 'setActivation', selection: { id: 'tanh' } });

  expect(next.network.hiddenLayers.map((layer) => layer.activation)).toStrictEqual([
    { id: 'tanh' },
    { id: 'tanh' },
  ]);
});

test('excluding and restoring a unit leaves the network untouched', () => {
  const excluded = explorerReducer(initial, {
    type: 'setUnitExcluded',
    unitId: 'a',
    excluded: true,
  });
  const restored = explorerReducer(excluded, {
    type: 'setUnitExcluded',
    unitId: 'a',
    excluded: false,
  });

  expect([...excluded.excludedUnitIds]).toStrictEqual(['a']);
  expect([...restored.excludedUnitIds]).toStrictEqual([]);
  expect(excluded.network).toBe(initial.network);
  expect(restored.network).toBe(initial.network);
});

test('the axis starts on the stable teaching scale', () => {
  expect(initial.scaleMode).toBe('fixed');
});

// Rescaling an axis is a way of looking at the network, not a parameter of it.
test('switching the scale mode leaves the network and the probe alone', () => {
  const next = explorerReducer(initial, { type: 'setScaleMode', mode: 'reachable' });

  expect(next).toStrictEqual({ ...initial, scaleMode: 'reachable' });
  expect(next.network).toBe(initial.network);
});

test('moving the probe changes nothing else', () => {
  const next = explorerReducer(initial, { type: 'setProbeX', value: -0.5 });

  expect(next).toStrictEqual({ ...initial, probeX: -0.5 });
});

test('reset returns exactly to the preset state', () => {
  const edits: readonly ExplorerAction[] = [
    { type: 'setPhi0', value: 3 },
    { type: 'setProbeX', value: -1 },
    { type: 'setUnitExcluded', unitId: 'a', excluded: true },
    { type: 'setScaleMode', mode: 'reachable' },
  ];

  const changed = edits.reduce(explorerReducer, initial);

  expect(explorerReducer(changed, { type: 'reset' })).toStrictEqual(initial);
});

test('the reducer never mutates the state it is given', () => {
  const before = structuredClone(initial.network);

  explorerReducer(initial, { type: 'setTheta', unitId: 'c', sourceId: 'a', value: 9 });

  expect(initial.network).toStrictEqual(before);
});
