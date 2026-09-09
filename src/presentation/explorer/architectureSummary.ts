import { activationDefinitions } from '../../domain/activation/activation';
import type { Network, OutputLayer } from '../../domain/network/types';
import { subscript } from '../notation/notation';

/** For example `1 → 3 ReLU → 1`: scalar in, each hidden layer, scalar out. */
export function architectureSummary(network: Network): string {
  const hidden = network.hiddenLayers.map(
    (layer) => `${String(layer.units.length)} ${activationDefinitions[layer.activation.id].name}`,
  );

  return ['1', ...hidden, '1'].join(' → ');
}

// Beyond this width the expanded sum stops being readable and sigma notation
// says the same thing.
const maxExpandedTerms = 5;

export function outputEquation(output: OutputLayer): string {
  if (output.incomingPhi.length > maxExpandedTerms) {
    return 'y = φ₀ + Σᵢ φᵢ hᵢ';
  }

  const terms = output.incomingPhi.map(
    (_, index) => `φ${subscript([index + 1])}h${subscript([index + 1])}`,
  );

  return ['y = φ₀', ...terms].join(' + ');
}
