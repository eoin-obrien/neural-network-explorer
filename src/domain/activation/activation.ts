import { identity } from './identity';
import { leakyRelu } from './leakyRelu';
import { relu } from './relu';
import { sigmoid } from './sigmoid';
import { tanh } from './tanh';

/** Display order for activation controls. */
export const activationIds = ['relu', 'leaky-relu', 'sigmoid', 'tanh', 'identity'] as const;

export type ActivationId = (typeof activationIds)[number];

/**
 * A layer's chosen activation together with any configuration that activation
 * requires. Configuration such as leaky ReLU's alpha rides on the selection
 * because it is not one of the network's trainable theta/phi parameters.
 */
export type ActivationSelection =
  | { readonly id: 'relu' }
  | { readonly id: 'leaky-relu'; readonly alpha: number }
  | { readonly id: 'sigmoid' }
  | { readonly id: 'tanh' }
  | { readonly id: 'identity' };

interface ActivationDefinition {
  readonly id: ActivationId;
  readonly name: string;
  readonly notation: string;
  /**
   * Selection produced when this activation is chosen. Callers pick an entry
   * and use this value, so choosing an activation never means branching on ids.
   */
  readonly defaultSelection: ActivationSelection;
}

export const activationDefinitions: Readonly<Record<ActivationId, ActivationDefinition>> = {
  relu: {
    id: 'relu',
    name: 'ReLU',
    notation: 'a[z] = max(0, z)',
    defaultSelection: { id: 'relu' },
  },
  'leaky-relu': {
    id: 'leaky-relu',
    name: 'Leaky ReLU',
    notation: 'a[z] = z if z ≥ 0, otherwise αz',
    defaultSelection: { id: 'leaky-relu', alpha: 0.1 },
  },
  sigmoid: {
    id: 'sigmoid',
    name: 'Logistic (sigmoid)',
    notation: 'a[z] = 1 / (1 + exp(-z))',
    defaultSelection: { id: 'sigmoid' },
  },
  tanh: {
    id: 'tanh',
    name: 'Tanh',
    notation: 'a[z] = tanh(z)',
    defaultSelection: { id: 'tanh' },
  },
  identity: {
    id: 'identity',
    name: 'Identity',
    notation: 'a[z] = z',
    defaultSelection: { id: 'identity' },
  },
};

/**
 * A control hands back a plain string, or nothing. This narrows that untrusted
 * value to the selection it names, so no caller has to assert that a control
 * can only produce known ids.
 *
 * The empty-or-single sequence is deliberate: a `| undefined` return would push
 * an `if` into the one caller that can never take its false branch, because the
 * control only ever offers ids this registry declares. A sequence lets the
 * caller stay total, and the unknown-value case is checked here instead.
 */
export function activationSelectionFor(value: string | null): readonly ActivationSelection[] {
  return activationIds
    .filter((id) => id === value)
    .map((id) => activationDefinitions[id].defaultSelection);
}

/**
 * The single dispatch point from a selection to its evaluator. Network
 * evaluation calls this; no other code should branch on an activation id.
 */
export function evaluateActivation(selection: ActivationSelection, z: number): number {
  switch (selection.id) {
    case 'relu':
      return relu(z);
    case 'leaky-relu':
      return leakyRelu(z, selection.alpha);
    case 'sigmoid':
      return sigmoid(z);
    case 'tanh':
      return tanh(z);
    case 'identity':
      return identity(z);
  }
}
