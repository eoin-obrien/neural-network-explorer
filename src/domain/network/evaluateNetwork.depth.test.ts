import { expect, test } from 'vitest';

import type { ActivationSelection } from '../activation/activation';
import { countParameters } from './countParameters';
import { evaluateNetwork } from './evaluateNetwork';
import type { HiddenLayer, Network } from './types';
import { inputNodeId } from './types';

// Deterministic parameters spread across both signs, so a sign or operator
// error in the evaluator cannot survive by cancelling out.
function parameterAt(index: number): number {
  return ((index * 7) % 11) / 5 - 1;
}

/** A fully dense scalar-input network of the given hidden-layer widths. */
function denseNetwork(widths: readonly number[], activation: ActivationSelection): Network {
  const hiddenLayers = widths.reduce<readonly HiddenLayer[]>((built, width, depth) => {
    const sourceIds = built.at(-1)?.units.map((unit) => unit.id) ?? [inputNodeId];
    const units = Array.from({ length: width }, (_, index) => ({
      id: `l${String(depth)}u${String(index)}`,
      thetaBias: parameterAt(depth * 13 + index),
      incomingTheta: sourceIds.map((sourceId, source) => ({
        sourceId,
        value: parameterAt(depth * 17 + index * 3 + source),
      })),
    }));

    return [...built, { id: `layer-${String(depth)}`, units, activation }];
  }, []);

  const finalUnits = hiddenLayers.at(-1)?.units ?? [];

  return {
    hiddenLayers,
    output: {
      phi0: 0.3,
      incomingPhi: finalUnits.map((unit, index) => ({
        sourceId: unit.id,
        value: parameterAt(index * 5 + 2),
      })),
    },
  };
}

const none = new Set<string>();

test.each([[[1]], [[3]], [[9]], [[2, 4]], [[3, 3, 2]], [[1, 5, 1, 4]]])(
  'a network of widths %j evaluates every layer and produces a finite y',
  (widths) => {
    const evaluation = evaluateNetwork(denseNetwork(widths, { id: 'relu' }), 0.4, none);

    expect(evaluation.layers.map((layer) => layer.units.length)).toStrictEqual(widths);
    expect(Number.isFinite(evaluation.y)).toBe(true);
  },
);

test('the dense parameter count follows the widths', () => {
  // Layer 1: 3 x (1 + 1). Layer 2: 2 x (1 + 3). Output: phi0 + 2 phi.
  expect(countParameters(denseNetwork([3, 2], { id: 'relu' }))).toBe(17);
});

// With identity at every hidden layer the whole composition collapses to a
// single affine function of x, at any depth. This is the teaching control that
// shows what the activation is actually contributing.
test.each([[[3]], [[2, 4]], [[3, 3, 2]], [[1, 5, 1, 4]]])(
  'identity activations leave a network of widths %j affine in x',
  (widths) => {
    const network = denseNetwork(widths, { id: 'identity' });
    const y = (x: number): number => evaluateNetwork(network, x, none).y;

    const intercept = y(0);
    const slope = y(1) - intercept;

    for (const x of [-1, -0.375, 0.42, 2.5]) {
      expect(y(x)).toBeCloseTo(intercept + slope * x, 12);
    }
  },
);

test('a non-identity activation is not affine in x', () => {
  const network = denseNetwork([3, 3], { id: 'relu' });
  const y = (x: number): number => evaluateNetwork(network, x, none).y;

  expect(y(1) - y(0)).not.toBeCloseTo(y(0) - y(-1), 6);
});

// Tanh rather than ReLU so the test measures propagation through depth rather
// than accidentally exciting a unit that ReLU had already clamped to zero.
test('excluding a unit in the first layer changes the output of a deep network', () => {
  const network = denseNetwork([3, 3, 2], { id: 'tanh' });
  const excludedId = network.hiddenLayers.at(0)?.units.at(0)?.id ?? '';

  expect(evaluateNetwork(network, 0.6, new Set([excludedId])).y).not.toBe(
    evaluateNetwork(network, 0.6, none).y,
  );
});
