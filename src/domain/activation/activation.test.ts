import { expect, test } from 'vitest';

import type { ActivationId, ActivationSelection } from './activation';
import { activationRegistry, evaluateActivation } from './activation';
import { identity } from './identity';
import { leakyRelu } from './leakyRelu';
import { relu } from './relu';
import { sigmoid } from './sigmoid';
import { tanh } from './tanh';

const expectedIds: readonly ActivationId[] = ['relu', 'leaky-relu', 'sigmoid', 'tanh', 'identity'];

test('the registry offers exactly the initial activation set, in order', () => {
  expect(activationRegistry.map((definition) => definition.id)).toStrictEqual(expectedIds);
});

test('registry ids are unique', () => {
  const ids = activationRegistry.map((definition) => definition.id);

  expect(new Set(ids).size).toBe(ids.length);
});

test('every definition can describe itself to a learner', () => {
  for (const definition of activationRegistry) {
    expect(definition.name.length).toBeGreaterThan(0);
    expect(definition.notation).toContain('a[z]');
  }
});

test('choosing an activation yields a selection for that same activation', () => {
  for (const definition of activationRegistry) {
    expect(definition.defaultSelection.id).toBe(definition.id);
  }
});

test('leaky ReLU carries an explicit default alpha', () => {
  const definition = activationRegistry.find(({ id }) => id === 'leaky-relu');

  expect(definition?.defaultSelection).toStrictEqual({ id: 'leaky-relu', alpha: 0.1 });
});

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
  for (const { defaultSelection } of activationRegistry) {
    expect(Number.isFinite(evaluateActivation(defaultSelection, 0.75))).toBe(true);
  }
});
