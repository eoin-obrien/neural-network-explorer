import { expect, test } from 'vitest';

import type { ActivationSelection } from './activation';
import {
  activationDefinitions,
  activationIds,
  activationSelectionFor,
  evaluateActivation,
} from './activation';
import { identity } from './identity';
import { leakyRelu } from './leakyRelu';
import { relu } from './relu';
import { sigmoid } from './sigmoid';
import { tanh } from './tanh';

const definitions = activationIds.map((id) => activationDefinitions[id]);

test('the registry offers exactly the initial activation set, in order', () => {
  expect(activationIds).toStrictEqual(['relu', 'leaky-relu', 'sigmoid', 'tanh', 'identity']);
});

test('registry ids are unique', () => {
  expect(new Set(activationIds).size).toBe(activationIds.length);
});

test('every definition is filed under its own id', () => {
  for (const id of activationIds) {
    expect(activationDefinitions[id].id).toBe(id);
  }
});

test('every definition can describe itself to a learner', () => {
  for (const definition of definitions) {
    expect(definition.name.length).toBeGreaterThan(0);
    expect(definition.notation).toContain('a[z]');
  }
});

test('choosing an activation yields a selection for that same activation', () => {
  for (const definition of definitions) {
    expect(definition.defaultSelection.id).toBe(definition.id);
  }
});

test('leaky ReLU carries an explicit default alpha', () => {
  expect(activationDefinitions['leaky-relu'].defaultSelection).toStrictEqual({
    id: 'leaky-relu',
    alpha: 0.1,
  });
});

test.each(activationIds)('the control value %s yields that activation selection', (id) => {
  expect(activationSelectionFor(id)).toStrictEqual([activationDefinitions[id].defaultSelection]);
});

// A Mantine Select hands back an arbitrary string, or null when nothing is
// selected; neither names an activation.
test.each([['relu ', 'not-an-activation', ''] as const, [null] as const].flat())(
  'the control value %o yields no activation selection',
  (value) => {
    expect(activationSelectionFor(value)).toStrictEqual([]);
  },
);

const z = -1.25;

const dispatchCases: readonly (readonly [ActivationSelection, number])[] = [
  [{ id: 'relu' }, relu(z)],
  [{ id: 'leaky-relu', alpha: 0.2 }, leakyRelu(z, 0.2)],
  [{ id: 'sigmoid' }, sigmoid(z)],
  [{ id: 'tanh' }, tanh(z)],
  [{ id: 'identity' }, identity(z)],
];

test('evaluation dispatches every selection to its own activation', () => {
  for (const [selection, expected] of dispatchCases) {
    expect(evaluateActivation(selection, z)).toBe(expected);
  }
});

test('leaky ReLU alpha is read from the selection, not a fixed constant', () => {
  expect(evaluateActivation({ id: 'leaky-relu', alpha: 0.5 }, -2)).toBe(-1);
  expect(evaluateActivation({ id: 'leaky-relu', alpha: 0.25 }, -2)).toBe(-0.5);
});

test('every registry default selection is evaluable', () => {
  for (const { defaultSelection } of definitions) {
    expect(Number.isFinite(evaluateActivation(defaultSelection, 0.75))).toBe(true);
  }
});
