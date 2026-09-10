import { activationDefinitions } from '../../domain/activation/activation';
import type { Network } from '../../domain/network/types';
import { activationSymbol, subscript } from '../notation/notation';

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

export function outputEquation(network: Network): string {
  if (network.output.incomingPhi.length > maxExpandedTerms) {
    return 'y = φ₀ + Σᵢ φᵢ hᵢ';
  }

  // The output reads the last hidden layer, so phi_i weights that layer's unit
  // i: h₁ while the network is shallow, h₂₁ once there is a layer above.
  const depth = network.hiddenLayers.length;
  const terms = network.output.incomingPhi.map(
    (_, index) => `φ${subscript([index + 1])}${activationSymbol(depth, index + 1, depth)}`,
  );

  return ['y = φ₀', ...terms].join(' + ');
}
