import { identity } from './identity';
import { leakyRelu } from './leakyRelu';
import { relu } from './relu';
import { sigmoid } from './sigmoid';
import { tanh } from './tanh';

export type ActivationId = 'relu' | 'leaky-relu' | 'sigmoid' | 'tanh' | 'identity';

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

export const activationRegistry: readonly ActivationDefinition[] = [
  {
    id: 'relu',
    name: 'ReLU',
    notation: 'a[z] = max(0, z)',
    defaultSelection: { id: 'relu' },
  },
  {
    id: 'leaky-relu',
    name: 'Leaky ReLU',
    notation: 'a[z] = z if z ≥ 0, otherwise αz',
    defaultSelection: { id: 'leaky-relu', alpha: 0.1 },
  },
  {
    id: 'sigmoid',
    name: 'Logistic (sigmoid)',
    notation: 'a[z] = 1 / (1 + exp(-z))',
    defaultSelection: { id: 'sigmoid' },
  },
  {
    id: 'tanh',
    name: 'Tanh',
    notation: 'a[z] = tanh(z)',
    defaultSelection: { id: 'tanh' },
  },
  {
    id: 'identity',
    name: 'Identity',
    notation: 'a[z] = z',
    defaultSelection: { id: 'identity' },
  },
];

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
